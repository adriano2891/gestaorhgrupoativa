import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, CheckCircle, Clock, Users } from "lucide-react";
import { useEffect } from "react";

interface ConfirmacoesLeituraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comunicadoId: string | null;
}

export const ConfirmacoesLeituraDialog = ({
  open,
  onOpenChange,
  comunicadoId,
}: ConfirmacoesLeituraDialogProps) => {
  const queryClient = useQueryClient();

  // Realtime subscription for comunicados_lidos changes
  useEffect(() => {
    if (!comunicadoId || !open) return;
    const channel = supabase
      .channel(`comunicados-lidos-${comunicadoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comunicados_lidos', filter: `comunicado_id=eq.${comunicadoId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["comunicado-confirmacoes", comunicadoId] });
          queryClient.invalidateQueries({ queryKey: ["comunicado-destinatarios-count", comunicadoId] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [comunicadoId, open, queryClient]);

  // Fetch the comunicado to know its destinatarios
  const { data: comunicado } = useQuery({
    queryKey: ["comunicado-detalhes", comunicadoId],
    queryFn: async () => {
      if (!comunicadoId) return null;
      const { data, error } = await supabase
        .from("comunicados")
        .select("destinatarios")
        .eq("id", comunicadoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: open && !!comunicadoId,
  });

  // Fetch total targeted employees
  const { data: totalDestinatarios = 0 } = useQuery({
    queryKey: ["comunicado-destinatarios-count", comunicadoId, comunicado?.destinatarios],
    queryFn: async () => {
      if (!comunicado) return 0;
      const destinatarios = comunicado.destinatarios as string[] | null;

      let query = (supabase as any)
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true);

      if (destinatarios && !destinatarios.includes("todos")) {
        query = query.in("departamento", destinatarios);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    },
    enabled: open && !!comunicadoId && !!comunicado,
  });

  const { data: confirmacoes, isLoading } = useQuery({
    queryKey: ["comunicado-confirmacoes", comunicadoId],
    queryFn: async () => {
      if (!comunicadoId) return [];
      const { data, error } = await supabase
        .from("comunicados_lidos")
        .select("*, profiles:user_id(nome, email, departamento)")
        .eq("comunicado_id", comunicadoId)
        .order("lido_em", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!comunicadoId,
  });

  const totalConfirmados = confirmacoes?.filter((c: any) => c.confirmado).length || 0;
  const totalLidos = confirmacoes?.length || 0;
  const pendentes = totalDestinatarios - totalLidos;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Confirmações de Leitura
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-blue-600">{totalLidos}</p>
            <p className="text-xs text-muted-foreground">Leituras</p>
          </div>
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-600">{totalConfirmados}</p>
            <p className="text-xs text-muted-foreground">Confirmados</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-950 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-orange-600">{pendentes > 0 ? pendentes : 0}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </div>
        </div>

        {totalDestinatarios > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Users className="h-3.5 w-3.5" />
            <span>Total de destinatários: <strong>{totalDestinatarios}</strong></span>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !confirmacoes || confirmacoes.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma leitura registrada ainda.
          </p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {confirmacoes.map((c: any) => (
                <div key={c.id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{c.profiles?.nome || "—"}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.profiles?.departamento || "Sem depto"} • {c.profiles?.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Lido em {format(new Date(c.lido_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                    {c.confirmado && c.confirmado_em && (
                      <p className="text-xs text-green-600">
                        Confirmado em {format(new Date(c.confirmado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    )}
                  </div>
                  <div>
                    {c.confirmado ? (
                      <Badge className="bg-green-500 text-white gap-1">
                        <CheckCircle className="h-3 w-3" />
                        Confirmado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        Apenas lido
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
