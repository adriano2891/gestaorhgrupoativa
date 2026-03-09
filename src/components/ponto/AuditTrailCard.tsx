import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Download, ChevronDown, ChevronUp, Filter, X, FileSpreadsheet, FileText } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ExcelJS from "exceljs";

export const AuditTrailCard = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterIP, setFilterIP] = useState("");
  const [filterDetails, setFilterDetails] = useState("");

  const getAccessToken = (): string | null => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
      const storageKey = `sb-${projectId}-auth-token`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw)?.access_token || null;
    } catch { return null; }
  };

  const loadLogs = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) return;

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/audit_trail_ponto?select=*&order=created_at.desc&limit=100`,
        {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json() || [];

      // Enrich with profile names
      if (data.length > 0) {
        const userIds = [...new Set(data.map((d: any) => d.user_id).filter(Boolean))];
        if (userIds.length > 0) {
          const idsParam = userIds.map(id => `"${id}"`).join(',');
          try {
            const pRes = await fetch(
              `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=id,nome&id=in.(${idsParam})`,
              { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` } }
            );
            if (pRes.ok) {
              const profiles = await pRes.json();
              const nameMap: Record<string, string> = {};
              profiles.forEach((p: any) => { nameMap[p.id] = p.nome; });
              data.forEach((d: any) => { d._nome = nameMap[d.user_id] || "—"; });
            }
          } catch { /* ignore */ }
        }
      }

      setLogs(data);
    } catch (e) {
      console.error("Erro ao carregar audit trail:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
    const channel = supabase
      .channel('audit-trail-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_trail_ponto' }, () => loadLogs())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const exportAuditCSV = () => {
    if (filteredLogs.length === 0) { toast.error("Sem dados para exportar"); return; }
    const headers = ['Funcionário', 'Data/Hora', 'Ação', 'IP', 'Dispositivo', 'Detalhes'];
    const rows = filteredLogs.map(log => [
      log._nome || log.user_id,
      new Date(log.created_at).toLocaleString("pt-BR"),
      log.acao,
      log.ip_address || '-',
      (log.user_agent || '-').substring(0, 80),
      JSON.stringify(log.detalhes || {}),
    ]);
    const csv = [headers.join(';'), ...rows.map(r => r.map(v => `"${v}"`).join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-trail-ponto-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    toast.success("Exportado em CSV");
  };

  const exportAuditExcel = async () => {
    if (filteredLogs.length === 0) { toast.error("Sem dados para exportar"); return; }
    try {
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet("Trilha de Auditoria");
      ws.columns = [
        { header: "Funcionário", key: "func", width: 28 },
        { header: "Data/Hora", key: "data", width: 22 },
        { header: "Ação", key: "acao", width: 28 },
        { header: "IP", key: "ip", width: 18 },
        { header: "Dispositivo", key: "device", width: 40 },
        { header: "Detalhes", key: "detalhes", width: 60 },
      ];
      ws.getRow(1).eachCell(cell => {
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E1E1E" } };
      });
      filteredLogs.forEach(log => {
        ws.addRow({
          func: log._nome || log.user_id,
          data: new Date(log.created_at).toLocaleString("pt-BR"),
          acao: log.acao,
          ip: log.ip_address || "-",
          device: (log.user_agent || "-").substring(0, 80),
          detalhes: JSON.stringify(log.detalhes || {}),
        });
      });
      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `audit-trail-ponto-${new Date().toISOString().split("T")[0]}.xlsx`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Exportado em Excel");
    } catch (e: any) {
      toast.error("Erro ao exportar Excel", { description: e.message });
    }
  };

  const exportAuditPDF = () => {
    if (filteredLogs.length === 0) { toast.error("Sem dados para exportar"); return; }
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Trilha de Auditoria — Ponto Eletrônico", 14, 16);
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 22);
    doc.text("Ref. Legal: Portaria MTP nº 671/2021 — CLT Art. 74", 14, 26);
    autoTable(doc, {
      startY: 30,
      head: [["Funcionário", "Data/Hora", "Ação", "IP", "Dispositivo", "Detalhes"]],
      body: filteredLogs.map(log => [
        log._nome || log.user_id,
        new Date(log.created_at).toLocaleString("pt-BR"),
        log.acao,
        log.ip_address || "-",
        (log.user_agent || "-").substring(0, 60),
        JSON.stringify(log.detalhes || {}).substring(0, 80),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 30, 30] },
    });
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.text(`Página ${i}/${pages} — Documento para fins de auditoria trabalhista`, 14, doc.internal.pageSize.height - 8);
    }
    doc.save(`audit-trail-ponto-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("Exportado em PDF");
  };

  const exportFiscalizacaoJSON = async () => {
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Sessão expirada");

      // Fetch comprehensive data for fiscal export
      const [registrosRes, ajustesRes, logsEdicaoRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/registros_ponto?select=*&order=data.desc&limit=5000`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/solicitacoes_ajuste_ponto?select=*&order=created_at.desc`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
        }),
        fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/logs_edicao_ponto?select=*&order=created_at.desc`, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
        }),
      ]);

      const [registros, ajustes, logsEdicao] = await Promise.all([
        registrosRes.json(), ajustesRes.json(), logsEdicaoRes.json(),
      ]);

      const exportData = {
        exportado_em: new Date().toISOString(),
        sistema: "REP-A - Grupo Ativa",
        conformidade: "Portaria MTP nº 671/2021",
        registros_ponto: registros,
        solicitacoes_ajuste: ajustes,
        logs_edicao: logsEdicao,
        audit_trail: logs,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `exportacao-fiscalizacao-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("Dados exportados para fiscalização (JSON)");
    } catch (e: any) {
      toast.error("Erro ao exportar", { description: e.message });
    }
  };

  const actionTypes = useMemo(() => {
    const actions = new Set(logs.map(l => {
      if (l.acao.includes('entrada')) return 'entrada';
      if (l.acao.includes('saida')) return 'saida';
      if (l.acao.includes('almoco') || l.acao.includes('pausa')) return 'intervalo';
      if (l.acao.includes('login')) return 'login';
      return 'outro';
    }));
    return Array.from(actions);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filterDateFrom) {
        const logDate = new Date(log.created_at).toISOString().split('T')[0];
        if (logDate < filterDateFrom) return false;
      }
      if (filterDateTo) {
        const logDate = new Date(log.created_at).toISOString().split('T')[0];
        if (logDate > filterDateTo) return false;
      }
      if (filterAction && filterAction !== 'all') {
        const acao = log.acao;
        if (filterAction === 'entrada' && !acao.includes('entrada')) return false;
        if (filterAction === 'saida' && !acao.includes('saida')) return false;
        if (filterAction === 'intervalo' && !acao.includes('almoco') && !acao.includes('pausa')) return false;
        if (filterAction === 'login' && !acao.includes('login')) return false;
        if (filterAction === 'outro' && (acao.includes('entrada') || acao.includes('saida') || acao.includes('almoco') || acao.includes('pausa') || acao.includes('login'))) return false;
      }
      if (filterIP && !(log.ip_address || '').includes(filterIP)) return false;
      if (filterDetails) {
        const details = JSON.stringify(log.detalhes || {}).toLowerCase();
        if (!details.includes(filterDetails.toLowerCase())) return false;
      }
      return true;
    });
  }, [logs, filterDateFrom, filterDateTo, filterAction, filterIP, filterDetails]);

  const displayedLogs = expanded ? filteredLogs : filteredLogs.slice(0, 10);

  const hasFilters = filterDateFrom || filterDateTo || (filterAction && filterAction !== 'all') || filterIP || filterDetails;

  const clearFilters = () => {
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterAction("all");
    setFilterIP("");
    setFilterDetails("");
  };

  const getActionBadge = (acao: string) => {
    if (acao.includes('entrada')) return <Badge className="bg-green-500/10 text-green-700 border-green-300" variant="outline">Entrada</Badge>;
    if (acao.includes('saida')) return <Badge className="bg-red-500/10 text-red-700 border-red-300" variant="outline">Saída</Badge>;
    if (acao.includes('almoco') || acao.includes('pausa')) return <Badge className="bg-blue-500/10 text-blue-700 border-blue-300" variant="outline">Intervalo</Badge>;
    if (acao.includes('login')) return <Badge className="bg-purple-500/10 text-purple-700 border-purple-300" variant="outline">Login</Badge>;
    return <Badge variant="outline">{acao}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-64" /></CardHeader>
        <CardContent><Skeleton className="h-48 w-full" /></CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Trilha de Auditoria</CardTitle>
              <CardDescription>Registro imutável de todas as ações - Portaria 671/2021</CardDescription>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={exportAuditCSV}>
              <Download className="h-4 w-4 mr-1" /> CSV
            </Button>
            <Button size="sm" variant="outline" onClick={exportAuditExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button size="sm" variant="outline" onClick={exportAuditPDF}>
              <FileText className="h-4 w-4 mr-1" /> PDF
            </Button>
            <Button size="sm" variant="default" onClick={exportFiscalizacaoJSON}>
              <Download className="h-4 w-4 mr-1" /> Fiscalização
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum evento registrado na trilha de auditoria.
          </div>
        ) : (
          <>
            {/* Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Data início</label>
                <Input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Data fim</label>
                <Input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Ação</label>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                    <SelectItem value="intervalo">Intervalo</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="outro">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">IP</label>
                <Input placeholder="Filtrar por IP" value={filterIP} onChange={e => setFilterIP(e.target.value)} className="h-9 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Detalhes</label>
                <Input placeholder="Buscar nos detalhes" value={filterDetails} onChange={e => setFilterDetails(e.target.value)} className="h-9 text-sm" />
              </div>
            </div>
            {hasFilters && (
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="gap-1">
                  <Filter className="h-3 w-3" />
                  {filteredLogs.length} resultado(s)
                </Badge>
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
                  <X className="h-3 w-3" /> Limpar filtros
                </Button>
              </div>
            )}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                     <TableHead>Funcionário</TableHead>
                     <TableHead>Data/Hora</TableHead>
                     <TableHead>Ação</TableHead>
                     <TableHead>IP</TableHead>
                     <TableHead>Detalhes</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {displayedLogs.map((log) => (
                     <TableRow key={log.id}>
                       <TableCell className="text-sm font-medium whitespace-nowrap">{log._nome || "—"}</TableCell>
                       <TableCell className="whitespace-nowrap text-sm">
                         {new Date(log.created_at).toLocaleString("pt-BR")}
                       </TableCell>
                       <TableCell>{getActionBadge(log.acao)}</TableCell>
                       <TableCell className="text-sm text-muted-foreground">{log.ip_address || '-'}</TableCell>
                       <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                         {log.detalhes ? JSON.stringify(log.detalhes).substring(0, 100) : '-'}
                       </TableCell>
                     </TableRow>
                   ))}
                </TableBody>
              </Table>
            </div>
            {filteredLogs.length > 10 && (
              <div className="flex justify-center mt-3">
                <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="gap-1">
                  {expanded ? <><ChevronUp className="h-4 w-4" /> Menos</> : <><ChevronDown className="h-4 w-4" /> Ver todos ({filteredLogs.length})</>}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
