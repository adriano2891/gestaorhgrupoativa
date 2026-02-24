import { useMemo, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePortalAuth } from "@/components/ponto/PortalAuthProvider";

const VIEWED_KEY_PREFIX = "portal-badge-viewed-";

function getLastViewed(section: string, userId: string): string | null {
  try {
    return localStorage.getItem(`${VIEWED_KEY_PREFIX}${section}-${userId}`);
  } catch {
    return null;
  }
}

function setLastViewed(section: string, userId: string) {
  try {
    localStorage.setItem(`${VIEWED_KEY_PREFIX}${section}-${userId}`, new Date().toISOString());
  } catch {}
}

export function usePortalBadges() {
  const { user } = usePortalAuth();
  const queryClient = useQueryClient();

  // Realtime: refresh badges immediately when relevant tables change
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("portal-badges-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "mensagens_chamado" }, () => {
        queryClient.invalidateQueries({ queryKey: ["portal-badge-suporte", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comunicados" }, () => {
        queryClient.invalidateQueries({ queryKey: ["portal-badge-comunicados", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comunicados_lidos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["portal-badge-comunicados", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "holerites" }, () => {
        queryClient.invalidateQueries({ queryKey: ["portal-badge-holerites", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "solicitacoes_ferias" }, () => {
        queryClient.invalidateQueries({ queryKey: ["portal-badge-ferias", user.id] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "notificacoes" }, () => {
        queryClient.invalidateQueries({ queryKey: ["portal-badge-notificacoes", user.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  // Comunicados não lidos
  const { data: comunicadosNaoLidos = 0 } = useQuery({
    queryKey: ["portal-badge-comunicados", user?.id],
    queryFn: async () => {
      const { data: lidos } = await (supabase as any)
        .from("comunicados_lidos")
        .select("comunicado_id")
        .eq("user_id", user!.id);
      const lidosIds = (lidos || []).map((r: any) => r.comunicado_id);

      let query = (supabase as any)
        .from("comunicados")
        .select("id, created_at")
        .eq("ativo", true);

      const lastViewed = getLastViewed("comunicados", user!.id);
      if (lastViewed) {
        query = query.gt("created_at", lastViewed);
      }

      const { data: comunicados } = await query;

      const naoLidos = (comunicados || []).filter(
        (c: any) => !lidosIds.includes(c.id)
      );
      return naoLidos.length;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Chamados com respostas não lidas
  const { data: suporteNaoLido = 0 } = useQuery({
    queryKey: ["portal-badge-suporte", user?.id],
    queryFn: async () => {
      const { data: chamados } = await (supabase as any)
        .from("chamados_suporte")
        .select("id, updated_at")
        .eq("user_id", user!.id)
        .neq("status", "fechado");

      if (!chamados || chamados.length === 0) return 0;

      const lastViewed = getLastViewed("suporte", user!.id);

      let count = 0;
      for (const chamado of chamados) {
        const { data: msgs } = await (supabase as any)
          .from("mensagens_chamado")
          .select("id, remetente_id, created_at")
          .eq("chamado_id", chamado.id)
          .neq("remetente_id", user!.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (msgs && msgs.length > 0) {
          // If user viewed suporte after this message, skip
          if (lastViewed && new Date(msgs[0].created_at) <= new Date(lastViewed)) {
            continue;
          }

          const { data: myMsgs } = await (supabase as any)
            .from("mensagens_chamado")
            .select("created_at")
            .eq("chamado_id", chamado.id)
            .eq("remetente_id", user!.id)
            .order("created_at", { ascending: false })
            .limit(1);

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

  // Notificações não lidas
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

  // Holerites novos (desde última visualização)
  const { data: holeritesNovos = 0 } = useQuery({
    queryKey: ["portal-badge-holerites", user?.id],
    queryFn: async () => {
      const lastViewed = getLastViewed("holerite", user!.id);
      // If never viewed, show last 30 days; otherwise show since last view
      const since = lastViewed || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString();
      })();

      const { data, error } = await (supabase as any)
        .from("holerites")
        .select("id")
        .eq("user_id", user!.id)
        .gt("created_at", since);
      if (error) return 0;
      return (data || []).length;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });

  // Férias com status atualizado
  const { data: feriasAtualizadas = 0 } = useQuery({
    queryKey: ["portal-badge-ferias", user?.id],
    queryFn: async () => {
      const lastViewed = getLastViewed("ferias", user!.id);

      let query = (supabase as any)
        .from("solicitacoes_ferias")
        .select("id")
        .eq("user_id", user!.id)
        .in("status", ["aprovada", "reprovada"]);

      if (lastViewed) {
        query = query.gt("updated_at", lastViewed);
      } else {
        query = query.is("notificado_em", null);
      }

      const { data, error } = await query;
      if (error) return 0;
      return (data || []).length;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markSectionViewed = useCallback((section: string) => {
    if (!user) return;
    setLastViewed(section, user.id);
    // Invalidate the relevant query so badge updates immediately
    const keyMap: Record<string, string> = {
      comunicados: "portal-badge-comunicados",
      suporte: "portal-badge-suporte",
      holerite: "portal-badge-holerites",
      ferias: "portal-badge-ferias",
    };
    const qk = keyMap[section];
    if (qk) {
      queryClient.invalidateQueries({ queryKey: [qk, user.id] });
    }
  }, [user, queryClient]);

  const badges = useMemo(() => ({
    comunicados: comunicadosNaoLidos,
    suporte: suporteNaoLido,
    holerite: holeritesNovos,
    ferias: feriasAtualizadas,
  }), [comunicadosNaoLidos, suporteNaoLido, holeritesNovos, feriasAtualizadas]);

  return { badges, markSectionViewed };
}
