import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound } from "@/utils/notificationSound";
import { usePortalAuth } from "@/components/ponto/PortalAuthProvider";

export interface Notificacao {
  id: string;
  titulo: string;
  mensagem: string;
  tipo: string;
  prioridade: string;
  criado_por: string | null;
  destinatario_tipo: string;
  destinatario_id: string | null;
  destinatario_departamento: string | null;
  agendado_para: string | null;
  created_at: string;
  updated_at: string;
}

export function useNotificacoesPortal() {
  const queryClient = useQueryClient();
  const { user } = usePortalAuth();

  const { data: notificacoes = [], isLoading } = useQuery({
    queryKey: ["notificacoes-portal"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notificacoes")
        .select("*")
        .or(`agendado_para.is.null,agendado_para.lte.${new Date().toISOString()}`)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as Notificacao[];
    },
    enabled: !!user,
  });

  const { data: lidas = [] } = useQuery({
    queryKey: ["notificacoes-lidas"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notificacoes_lidas")
        .select("notificacao_id");
      if (error) throw error;
      return (data || []).map((r: any) => r.notificacao_id as string);
    },
    enabled: !!user,
  });

  const lidasSet = useMemo(() => new Set(lidas), [lidas]);

  const naoLidas = useMemo(
    () => notificacoes.filter((n) => !lidasSet.has(n.id)),
    [notificacoes, lidasSet]
  );

  const marcarComoLida = useMutation({
    mutationFn: async (notificacaoId: string) => {
      const { error } = await (supabase as any)
        .from("notificacoes_lidas")
        .insert({ notificacao_id: notificacaoId, user_id: user!.id });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes-lidas"] });
    },
  });

  const marcarTodasComoLidas = useMutation({
    mutationFn: async () => {
      const idsNaoLidos = naoLidas.map((n) => ({
        notificacao_id: n.id,
        user_id: user!.id,
      }));
      if (idsNaoLidos.length === 0) return;
      const { error } = await (supabase as any)
        .from("notificacoes_lidas")
        .upsert(idsNaoLidos, { onConflict: "notificacao_id,user_id" });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes-lidas"] });
    },
  });

  // Realtime listener
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("portal-notificacoes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notificacoes" },
        () => {
          playNotificationSound("success");
          queryClient.invalidateQueries({ queryKey: ["notificacoes-portal"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  return {
    notificacoes,
    naoLidas,
    totalNaoLidas: naoLidas.length,
    isLoading,
    marcarComoLida: marcarComoLida.mutate,
    marcarTodasComoLidas: marcarTodasComoLidas.mutate,
  };
}
