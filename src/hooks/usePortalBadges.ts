import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortalAuth } from "@/components/ponto/PortalAuthProvider";

export function usePortalBadges() {
  const { user } = usePortalAuth();

  // Comunicados não lidos
  const { data: comunicadosNaoLidos = 0 } = useQuery({
    queryKey: ["portal-badge-comunicados", user?.id],
    queryFn: async () => {
      const { data: lidos } = await (supabase as any)
        .from("comunicados_lidos")
        .select("comunicado_id")
        .eq("user_id", user!.id);
      const lidosIds = (lidos || []).map((r: any) => r.comunicado_id);

      const { data: comunicados } = await (supabase as any)
        .from("comunicados")
        .select("id")
        .eq("ativo", true);
      
      const naoLidos = (comunicados || []).filter(
        (c: any) => !lidosIds.includes(c.id)
      );
      return naoLidos.length;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Chamados com respostas não lidas (mensagens do RH que o funcionário ainda não viu)
  const { data: suporteNaoLido = 0 } = useQuery({
    queryKey: ["portal-badge-suporte", user?.id],
    queryFn: async () => {
      // Buscar chamados do funcionário
      const { data: chamados } = await (supabase as any)
        .from("chamados_suporte")
        .select("id, updated_at")
        .eq("user_id", user!.id)
        .neq("status", "fechado");

      if (!chamados || chamados.length === 0) return 0;

      let count = 0;
      for (const chamado of chamados) {
        // Buscar última mensagem do chamado que NÃO é do funcionário
        const { data: msgs } = await (supabase as any)
          .from("mensagens_chamado")
          .select("id, remetente_id, created_at")
          .eq("chamado_id", chamado.id)
          .neq("remetente_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (msgs && msgs.length > 0) {
          // Buscar última mensagem do funcionário
          const { data: myMsgs } = await (supabase as any)
            .from("mensagens_chamado")
            .select("created_at")
            .eq("chamado_id", chamado.id)
            .eq("remetente_id", user!.id)
            .order("created_at", { ascending: false })
            .limit(1);

          // Se a última msg do RH é mais recente que a última do funcionário, há resposta não lida
          if (!myMsgs || myMsgs.length === 0 || new Date(msgs[0].created_at) > new Date(myMsgs[0].created_at)) {
            count++;
          }
        }
      }
      return count;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Notificações não lidas (do sistema de notificações)
  const { data: notificacoesNaoLidas = 0 } = useQuery({
    queryKey: ["portal-badge-notificacoes", user?.id],
    queryFn: async () => {
      const { data: notifs } = await (supabase as any)
        .from("notificacoes")
        .select("id")
        .or(`agendado_para.is.null,agendado_para.lte.${new Date().toISOString()}`)
        .limit(50);

      const { data: lidas } = await (supabase as any)
        .from("notificacoes_lidas")
        .select("notificacao_id")
        .eq("user_id", user!.id);

      const lidasSet = new Set((lidas || []).map((r: any) => r.notificacao_id));
      return (notifs || []).filter((n: any) => !lidasSet.has(n.id)).length;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Holerites novos (últimos 30 dias não visualizados)
  const { data: holeritesNovos = 0 } = useQuery({
    queryKey: ["portal-badge-holerites", user?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await (supabase as any)
        .from("holerites")
        .select("id")
        .eq("user_id", user!.id)
        .gte("created_at", thirtyDaysAgo.toISOString());
      if (error) return 0;
      return (data || []).length;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  // Férias com status atualizado (aprovadas/reprovadas recentemente)
  const { data: feriasAtualizadas = 0 } = useQuery({
    queryKey: ["portal-badge-ferias", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("solicitacoes_ferias")
        .select("id")
        .eq("user_id", user!.id)
        .in("status", ["aprovada", "reprovada"])
        .is("notificado_em", null);
      if (error) return 0;
      return (data || []).length;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const badges = useMemo(() => ({
    comunicados: comunicadosNaoLidos,
    suporte: suporteNaoLido,
    holerite: holeritesNovos,
    ferias: feriasAtualizadas,
  }), [comunicadosNaoLidos, suporteNaoLido, holeritesNovos, feriasAtualizadas]);

  return badges;
}
