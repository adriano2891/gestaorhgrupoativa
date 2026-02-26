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

// Helper to get actual session user ID for RLS-safe queries
async function getActiveUserId(fallbackId?: string): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id || fallbackId || null;
  } catch {
    return fallbackId || null;
  }
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
      const userId = await getActiveUserId(user?.id);
      if (!userId) return 0;

      const { data: lidos } = await (supabase as any)
        .from("comunicados_lidos")
        .select("comunicado_id")
        .eq("user_id", userId);
      const lidosIds = (lidos || []).map((r: any) => r.comunicado_id);

      let query = (supabase as any)
        .from("comunicados")
        .select("id, created_at")
        .eq("ativo", true);

      const lastViewed = getLastViewed("comunicados", userId);
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
  });

  // Chamados com respostas não lidas - OPTIMIZED: single query instead of N+1
  const { data: suporteNaoLido = 0 } = useQuery({
    queryKey: ["portal-badge-suporte", user?.id],
    queryFn: async () => {
      const userId = await getActiveUserId(user?.id);
      if (!userId) return 0;

      const { data: chamados } = await (supabase as any)
        .from("chamados_suporte")
        .select("id")
        .eq("user_id", userId)
        .neq("status", "fechado");

      if (!chamados || chamados.length === 0) return 0;

      const chamadoIds = chamados.map((c: any) => c.id);
      const lastViewed = getLastViewed("suporte", userId);

      // Fetch all messages from others in open chamados in one query
      let msgsQuery = (supabase as any)
        .from("mensagens_chamado")
        .select("id, chamado_id, created_at")
        .in("chamado_id", chamadoIds)
        .neq("remetente_id", userId)
        .order("created_at", { ascending: false });

      if (lastViewed) {
        msgsQuery = msgsQuery.gt("created_at", lastViewed);
      }

      const { data: otherMsgs } = await msgsQuery;
      if (!otherMsgs || otherMsgs.length === 0) return 0;

      // Get chamados that have unread messages from others
      const chamadosComMsgs = new Set(otherMsgs.map((m: any) => m.chamado_id));
      return chamadosComMsgs.size;
    },
    enabled: !!user,
  });

  // Notificações não lidas
  const { data: notificacoesNaoLidas = 0 } = useQuery({
    queryKey: ["portal-badge-notificacoes", user?.id],
    queryFn: async () => {
      const userId = await getActiveUserId(user?.id);
      if (!userId) return 0;

      const { data: notifs } = await (supabase as any)
        .from("notificacoes")
        .select("id")
        .or(`agendado_para.is.null,agendado_para.lte.${new Date().toISOString()}`)
        .limit(50);

      const { data: lidas } = await (supabase as any)
        .from("notificacoes_lidas")
        .select("notificacao_id")
        .eq("user_id", userId);

      const lidasSet = new Set((lidas || []).map((r: any) => r.notificacao_id));
      return (notifs || []).filter((n: any) => !lidasSet.has(n.id)).length;
    },
    enabled: !!user,
  });

  // Holerites novos (desde última visualização)
  const { data: holeritesNovos = 0 } = useQuery({
    queryKey: ["portal-badge-holerites", user?.id],
    queryFn: async () => {
      const userId = await getActiveUserId(user?.id);
      if (!userId) return 0;

      const lastViewed = getLastViewed("holerite", userId);
      const since = lastViewed || (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return d.toISOString();
      })();

      const { data, error } = await (supabase as any)
        .from("holerites")
        .select("id")
        .eq("user_id", userId)
        .gt("created_at", since);
      if (error) return 0;
      return (data || []).length;
    },
    enabled: !!user,
  });

  // Férias com status atualizado
  const { data: feriasAtualizadas = 0 } = useQuery({
    queryKey: ["portal-badge-ferias", user?.id],
    queryFn: async () => {
      const userId = await getActiveUserId(user?.id);
      if (!userId) return 0;

      const lastViewed = getLastViewed("ferias", userId);

      let query = (supabase as any)
        .from("solicitacoes_ferias")
        .select("id")
        .eq("user_id", userId)
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
  });

  const markSectionViewed = useCallback((section: string) => {
    if (!user) return;
    setLastViewed(section, user.id);
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
