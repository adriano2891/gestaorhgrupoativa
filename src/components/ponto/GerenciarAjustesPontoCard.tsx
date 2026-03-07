import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle, XCircle, ClipboardList, Filter, Download, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface GerenciarAjustesPontoCardProps {
  adminId: string;
  adminName: string;
}

export const GerenciarAjustesPontoCard = ({ adminId, adminName }: GerenciarAjustesPontoCardProps) => {
  const [ajustes, setAjustes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState<Record<string, string>>({});
  const [showFilters, setShowFilters] = useState(false);

  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filterEmployee, setFilterEmployee] = useState("");

  const loadAjustes = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from("solicitacoes_ajuste_ponto")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (error) { console.error("Erro ao carregar ajustes:", error); return; }
      if (!data || data.length === 0) { setAjustes([]); return; }

      try {
        const userIds = [...new Set(data.map((a: any) => a.user_id))] as string[];
        const { data: profiles } = await supabase.from("profiles").select("id, nome").in("id", userIds);
        const nameMap = new Map((profiles || []).map((p: any) => [p.id, p.nome]));
        data.forEach((a: any) => { a.employee_name = nameMap.get(a.user_id) || "Desconhecido"; });
      } catch (e) { console.warn("Failed to fetch profiles for ajustes:", e); }

      setAjustes(data);
    } catch (e) { console.error("Erro ao carregar ajustes:", e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadAjustes();
    const channel = supabase
      .channel('ajustes-ponto-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'solicitacoes_ajuste_ponto' }, () => loadAjustes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredAjustes = useMemo(() => {
    return ajustes.filter(a => {
      if (filterStatus !== "todos" && a.status !== filterStatus) return false;
      if (filterDateStart && a.data_registro < filterDateStart) return false;
      if (filterDateEnd && a.data_registro > filterDateEnd) return false;
      if (filterEmployee && !(a.employee_name || "").toLowerCase().includes(filterEmployee.toLowerCase())) return false;
      return true;
    });
  }, [ajustes, filterStatus, filterDateStart, filterDateEnd, filterEmployee]);

  const handleAction = async (ajusteId: string, action: 'aprovado' | 'rejeitado') => {
    if (action === 'rejeitado' && !motivoRejeicao[ajusteId]?.trim()) {
      toast.error("Informe o motivo da rejeição");
      return;
    }
    setActionLoading(ajusteId);
    try {
      const body: any = {
        status: action,
        aprovado_por: adminId,
        aprovado_por_nome: adminName,
        data_aprovacao: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (action === 'rejeitado') body.motivo_rejeicao = motivoRejeicao[ajusteId].trim();

      const { error } = await (supabase as any)
        .from("solicitacoes_ajuste_ponto")
        .update(body)
        .eq("id", ajusteId);

      if (error) throw error;
      toast.success(action === 'aprovado' ? "Ajuste aprovado" : "Ajuste rejeitado");
      loadAjustes();
    } catch (e: any) {
      toast.error("Erro ao processar ajuste", { description: e.message });
    } finally { setActionLoading(null); }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pendente': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700">Pendente</Badge>;
      case 'aprovado': return <Badge variant="default" className="bg-green-500/10 text-green-700">Aprovado</Badge>;
      case 'rejeitado': return <Badge variant="destructive">Rejeitado</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const campoLabels: Record<string, string> = {
    entrada: "Entrada", saida: "Saída", saida_almoco: "S. Almoço",
    retorno_almoco: "R. Almoço", saida_pausa_1: "S. Pausa 1",
    retorno_pausa_1: "R. Pausa 1", saida_pausa_2: "S. Pausa 2",
    retorno_pausa_2: "R. Pausa 2", inicio_he: "Início HE", fim_he: "Fim HE",
  };

  const clearFilters = () => {
    setFilterStatus("todos");
    setFilterDateStart("");
    setFilterDateEnd("");
    setFilterEmployee("");
  };

  const hasActiveFilters = filterStatus !== "todos" || filterDateStart || filterDateEnd || filterEmployee;

  const handleDownloadPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const now = new Date();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Relatório de Solicitações de Ajuste de Ponto", 14, 16);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Gerado em: ${now.toLocaleString("pt-BR")}`, 14, 23);
    doc.text(`Total de registros: ${filteredAjustes.length}`, 14, 28);

    let startY = 33;
    if (hasActiveFilters) {
      const parts: string[] = [];
      if (filterStatus !== "todos") parts.push(`Status: ${filterStatus}`);
      if (filterDateStart) parts.push(`De: ${filterDateStart}`);
      if (filterDateEnd) parts.push(`Até: ${filterDateEnd}`);
      if (filterEmployee) parts.push(`Funcionário: ${filterEmployee}`);
      doc.text(`Filtros: ${parts.join(" | ")}`, 14, 33);
      startY = 38;
    }

    const rows = filteredAjustes.map(a => [
      a.data_registro ? new Date(a.data_registro + "T12:00:00").toLocaleDateString("pt-BR") : "-",
      a.employee_name || "-",
      campoLabels[a.campo] || a.campo,
      a.valor_original || "-",
      a.valor_solicitado || "-",
      a.motivo || "-",
      a.status?.charAt(0).toUpperCase() + a.status?.slice(1) || "-",
      a.aprovado_por_nome || "-",
    ]);

    autoTable(doc, {
      startY,
      head: [["Data", "Funcionário", "Campo", "Original", "Solicitado", "Motivo", "Status", "Aprovador"]],
      body: rows,
      styles: { fontSize: 8, font: "helvetica", cellPadding: 2 },
      headStyles: { fillColor: [62, 224, 207], textColor: [0, 0, 0], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      didParseCell: (data: any) => {
        if (data.column.index === 6 && data.section === "body") {
          const val = String(data.cell.raw).toLowerCase();
          if (val === "aprovado") data.cell.styles.textColor = [22, 163, 74];
          else if (val === "rejeitado") data.cell.styles.textColor = [220, 38, 38];
          else if (val === "pendente") data.cell.styles.textColor = [202, 138, 4];
        }
      },
    });

    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.text("Documento gerado automaticamente — Portaria 671/2021", 14, doc.internal.pageSize.height - 8);

    doc.save(`ajustes-ponto-${now.toISOString().slice(0, 10)}.pdf`);
    toast.success("Relatório baixado com sucesso");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-64" /></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  const pendentes = ajustes.filter(a => a.status === 'pendente');

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Solicitações de Ajuste de Ponto</CardTitle>
            {pendentes.length > 0 && (
              <Badge variant="destructive" className="ml-1">{pendentes.length} pendente(s)</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-1.5"
            >
              <Filter className="h-4 w-4" />
              Filtros
              {hasActiveFilters && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 text-[10px] flex items-center justify-center rounded-full">!</Badge>}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="gap-1.5"
              disabled={filteredAjustes.length === 0}
            >
              <Download className="h-4 w-4" />
              Baixar Relatório
            </Button>
          </div>
        </div>
        <CardDescription>
          Gerencie as solicitações de ajuste de ponto dos funcionários (Portaria 671/2021)
        </CardDescription>

        {showFilters && (
          <div className="mt-3 p-3 sm:p-4 rounded-lg border border-border bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Filtrar solicitações</span>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 gap-1 text-xs text-muted-foreground">
                  <X className="h-3 w-3" /> Limpar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="aprovado">Aprovado</SelectItem>
                    <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data Início</label>
                <Input type="date" className="h-9" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Data Fim</label>
                <Input type="date" className="h-9" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">Funcionário</label>
                <Input className="h-9" placeholder="Buscar nome..." value={filterEmployee} onChange={e => setFilterEmployee(e.target.value)} />
              </div>
            </div>
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground">{filteredAjustes.length} resultado(s) encontrado(s)</p>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {filteredAjustes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {hasActiveFilters ? "Nenhuma solicitação encontrada com os filtros aplicados." : "Nenhuma solicitação de ajuste encontrada."}
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <Table className="min-w-[700px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Campo</TableHead>
                  <TableHead>Original</TableHead>
                  <TableHead>Solicitado</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAjustes.map((ajuste) => (
                  <TableRow key={ajuste.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(ajuste.data_registro + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="font-medium">{ajuste.employee_name || '-'}</TableCell>
                    <TableCell>{campoLabels[ajuste.campo] || ajuste.campo}</TableCell>
                    <TableCell>{ajuste.valor_original || '-'}</TableCell>
                    <TableCell className="font-medium">{ajuste.valor_solicitado}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={ajuste.motivo}>
                      {ajuste.motivo}
                    </TableCell>
                    <TableCell>{getStatusBadge(ajuste.status)}</TableCell>
                    <TableCell>
                      {ajuste.status === 'pendente' && (
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="text-green-700" disabled={actionLoading === ajuste.id} onClick={() => handleAction(ajuste.id, 'aprovado')}>
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <div className="flex items-center gap-1">
                            <Textarea className="h-8 min-h-[32px] w-32 text-xs" placeholder="Motivo rejeição" value={motivoRejeicao[ajuste.id] || ''} onChange={(e) => setMotivoRejeicao(prev => ({ ...prev, [ajuste.id]: e.target.value }))} />
                            <Button size="sm" variant="outline" className="text-red-700" disabled={actionLoading === ajuste.id} onClick={() => handleAction(ajuste.id, 'rejeitado')}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {ajuste.status !== 'pendente' && (
                        <span className="text-xs text-muted-foreground">
                          {ajuste.aprovado_por_nome && `Por: ${ajuste.aprovado_por_nome}`}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
