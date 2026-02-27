import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, ChevronDown, ChevronUp } from "lucide-react";
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
      return await res.json() || [];
    },
    retry: 2,
    staleTime: 1000 * 30,
  });

  const displayedLogs = expanded ? logs : logs?.slice(0, 5);

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
        <CardDescription>
          Log de todas as alterações realizadas na folha de ponto
        </CardDescription>
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
            <ScrollArea className={expanded ? "max-h-[400px]" : ""}>
              <Table>
                <TableHeader>
                  <TableRow>
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
                        <TableCell className="text-sm">{data}</TableCell>
                        <TableCell className="text-sm">{hora}</TableCell>
                        <TableCell className="text-sm font-medium">{log.autorizado_por_nome}</TableCell>
                        <TableCell>{getActionBadge(log.campo_editado)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px]">
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
            </ScrollArea>

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
