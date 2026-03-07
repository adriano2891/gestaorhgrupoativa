import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History } from "lucide-react";

interface AuditoriaComunicadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comunicadoId: string | null;
}

export const AuditoriaComunicadoDialog = ({
  open,
  onOpenChange,
  comunicadoId,
}: AuditoriaComunicadoDialogProps) => {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["comunicado-auditoria", comunicadoId],
    queryFn: async () => {
      if (!comunicadoId) return [];
      const { data, error } = await supabase
        .from("comunicados_auditoria")
        .select("*, profiles:user_id(nome)")
        .eq("comunicado_id", comunicadoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: open && !!comunicadoId,
  });

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      criado: { label: "Criado", color: "bg-green-500" },
      editado: { label: "Editado", color: "bg-blue-500" },
      ativado: { label: "Ativado", color: "bg-emerald-500" },
      desativado: { label: "Desativado", color: "bg-yellow-500" },
      arquivado: { label: "Arquivado", color: "bg-red-500" },
    };
    return labels[acao] || { label: acao, color: "bg-muted" };
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Auditoria
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : !logs || logs.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Nenhum registro de auditoria encontrado.
          </p>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-3">
              {logs.map((log: any) => {
                const acaoInfo = getAcaoLabel(log.acao);
                return (
                  <div key={log.id} className="border rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <Badge className={`${acaoInfo.color} text-white`}>{acaoInfo.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                      </span>
                    </div>
                    <p className="text-sm">
                      <strong>{log.profiles?.nome || "Sistema"}</strong>
                    </p>
                    {log.detalhes && (
                      <p className="text-xs text-muted-foreground">{log.detalhes}</p>
                    )}
                    {log.ip_address && (
                      <p className="text-xs text-muted-foreground">IP: {log.ip_address}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
};
