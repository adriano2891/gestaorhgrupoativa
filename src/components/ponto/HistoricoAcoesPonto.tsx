import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ChevronDown, ChevronUp, Download } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface HistoricoAcoesPontoProps {
  selectedMonth: string;
  selectedYear: string;
}

export const HistoricoAcoesPonto = ({ selectedMonth, selectedYear }: HistoricoAcoesPontoProps) => {
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();

  // Realtime subscription for instant updates
  useEffect(() => {
    const channel = supabase
      .channel('logs-edicao-ponto-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'logs_edicao_ponto'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["logs-edicao-ponto", selectedMonth, selectedYear] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, selectedMonth, selectedYear]);
  const getAccessToken = (): string | null => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
      const storageKey = `sb-${projectId}-auth-token`;
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      return JSON.parse(raw)?.access_token || null;
    } catch { return null; }
  };

  const { data: logs, isLoading } = useQuery({
    queryKey: ["logs-edicao-ponto", selectedMonth, selectedYear],
    queryFn: async () => {
      const startDate = `${selectedYear}-${selectedMonth}-01`;
      const daysInMonth = new Date(parseInt(selectedYear), parseInt(selectedMonth), 0).getDate();
      const endDate = `${selectedYear}-${selectedMonth}-${daysInMonth}`;

      const token = getAccessToken();
      if (!token) return [];

      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/logs_edicao_ponto?select=*&data_registro=gte.${startDate}&data_registro=lte.${endDate}&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`REST ${res.status}`);
      const data = await res.json() || [];

      // Enrich with admin role labels
      if (data.length > 0) {
        const adminIds = [...new Set(data.map((d: any) => d.autorizado_por).filter(Boolean))];
        if (adminIds.length > 0) {
          const idsParam = adminIds.map(id => `"${id}"`).join(',');
          try {
            const [profilesRes, rolesRes] = await Promise.all([
              fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=id,nome&id=in.(${idsParam})`, {
                headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Authorization': `Bearer ${token}` },
              }),
              fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/user_roles?select=user_id,role&user_id=in.(${idsParam})`, {
                headers: { 'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Authorization': `Bearer ${token}` },
              }),
            ]);

            const profiles = profilesRes.ok ? await profilesRes.json() : [];
            const roles = rolesRes.ok ? await rolesRes.json() : [];

            const nameMap: Record<string, string> = {};
            profiles.forEach((p: any) => { nameMap[p.id] = p.nome; });

            const roleMap: Record<string, string> = {};
            const roleLabels: Record<string, string> = { admin: "Super Admin", rh: "Admin RH", gestor: "Gestor" };
            roles.forEach((r: any) => {
              const current = roleMap[r.user_id];
              const priority = ["admin", "rh", "gestor"];
              if (!current || priority.indexOf(r.role) < priority.indexOf(current)) {
                roleMap[r.user_id] = r.role;
              }
            });

            data.forEach((d: any) => {
              const nome = nameMap[d.autorizado_por] || d.autorizado_por_nome || "Admin";
              const role = roleMap[d.autorizado_por];
              const roleLabel = role ? roleLabels[role] || role : "";
              d._displayName = roleLabel ? `${roleLabel} - ${nome}` : nome;
            });
          } catch {
            // fallback to stored name
          }
        }
      }

      return data;
    },
    retry: 2,
    staleTime: 1000 * 5,
    refetchInterval: 10000,
  });

  const displayedLogs = expanded ? logs : logs?.slice(0, 5);

  const exportarPDF = () => {
    if (!logs || logs.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape" });
    const titulo = `Histórico de Ações – ${selectedMonth}/${selectedYear}`;
    doc.setFontSize(16);
    doc.text(titulo, 14, 18);
    doc.setFontSize(9);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 25);

    const rows = logs.map((log: any) => {
      const { data, hora } = formatDateTime(log.created_at);
      const campo = log.campo_editado?.toLowerCase() || "";
      const tipo = campo.includes("status") ? "Ajuste" : "Edição";
      return [
        data,
        hora,
        log._displayName || log.autorizado_por_nome || "-",
        tipo,
        `${log.employee_name || "-"} — ${log.campo_editado}: ${log.valor_anterior || "—"} → ${log.valor_novo || "—"} (dia ${new Date(log.data_registro).getDate().toString().padStart(2, "0")})`,
      ];
    });

    autoTable(doc, {
      startY: 32,
      head: [["Data", "Hora", "Responsável", "Tipo", "Descrição"]],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [17, 188, 183] },
    });

    doc.save(`historico-acoes-ponto-${selectedMonth}-${selectedYear}.pdf`);
  };

  const formatDateTime = (isoString: string) => {
    const d = new Date(isoString);
    return {
      data: d.toLocaleDateString("pt-BR"),
      hora: d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
    };
  };

  const getActionBadge = (campo: string) => {
    const lower = campo.toLowerCase();
    if (lower.includes("status")) return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-300">Ajuste</Badge>;
    if (lower.includes("hora")) return <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300">Edição</Badge>;
    return <Badge variant="outline" className="bg-muted text-muted-foreground">Edição</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Histórico de Ações</CardTitle>
        </div>
        <div className="flex items-center justify-between">
          <CardDescription>
            Log de todas as alterações realizadas na folha de ponto
          </CardDescription>
          {logs && logs.length > 0 && (
            <Button variant="outline" size="sm" onClick={exportarPDF} className="gap-1">
              <Download className="h-4 w-4" /> PDF
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : !logs || logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            Nenhuma alteração registrada para o período selecionado.
          </div>
        ) : (
          <>
            <div className={`overflow-x-auto overflow-y-auto ${expanded ? "max-h-[400px]" : ""}`} style={{ WebkitOverflowScrolling: "touch" }}>
              <Table className="min-w-[700px]">
                <TableHeader>
                   <TableRow>
                     <TableHead className="whitespace-nowrap">Funcionário</TableHead>
                     <TableHead className="whitespace-nowrap">Data</TableHead>
                     <TableHead className="whitespace-nowrap">Hora</TableHead>
                     <TableHead className="whitespace-nowrap">Responsável</TableHead>
                     <TableHead className="whitespace-nowrap">Tipo</TableHead>
                     <TableHead className="whitespace-nowrap">Descrição</TableHead>
                   </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedLogs?.map((log: any) => {
                    const { data, hora } = formatDateTime(log.created_at);
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-sm font-medium whitespace-nowrap">{log.employee_name || "—"}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{data}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">{hora}</TableCell>
                        <TableCell className="text-sm font-medium whitespace-nowrap">{log._displayName || log.autorizado_por_nome}</TableCell>
                        <TableCell className="whitespace-nowrap">{getActionBadge(log.campo_editado)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          <span className="font-medium text-foreground">{log.employee_name}</span>
                          {" — "}
                          {log.campo_editado}: {log.valor_anterior || "—"} → {log.valor_novo || "—"}
                          {" (dia "}
                          {new Date(log.data_registro).getDate().toString().padStart(2, "0")}
                          {")"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {logs.length > 5 && (
              <div className="flex justify-center mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpanded(!expanded)}
                  className="gap-1"
                >
                  {expanded ? (
                    <>
                      <ChevronUp className="h-4 w-4" /> Mostrar menos
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" /> Ver todos ({logs.length})
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
