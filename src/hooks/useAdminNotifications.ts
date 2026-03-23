import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound } from "@/utils/notificationSound";

export interface AdminNotification {
  id: string;
  type: "ferias" | "suporte" | "chamado" | "web";
  title: string;
  description: string;
  createdAt: string;
  route?: string;
  url?: string;
  fonte?: string;
}

export function useAdminNotifications() {
  const queryClient = useQueryClient();

  const { data: feriasPendentes = [] } = useQuery({
    queryKey: ["admin-notif-ferias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("solicitacoes_ferias")
        .select("id, created_at, dias_solicitados, tipo, user_id, profiles:user_id(nome)")
        .eq("status", "pendente")
        .eq("visualizada_admin", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: chamadosAbertos = [] } = useQuery({
    queryKey: ["admin-notif-chamados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamados_suporte")
        .select("id, created_at, assunto, categoria, user_id, profiles:user_id(nome)")
        .eq("status", "aberto")
        .neq("categoria", "ferias")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: webNotifs = [] } = useQuery({
    queryKey: ["admin-notif-web"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("notificacoes_web")
        .select("*")
        .eq("lida", false)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  const marcarWebComoLida = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("notificacoes_web")
        .update({ lida: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notif-web"] });
    },
  });

  const marcarTodasWebComoLidas = useMutation({
    mutationFn: async () => {
      if (!webNotifs || webNotifs.length === 0) return;
      const ids = webNotifs.map((w: any) => w.id);
      const { error } = await (supabase as any)
        .from("notificacoes_web")
        .update({ lida: true })
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notif-web"] });
    },
  });

  const buscarAtualizacoesWeb = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("monitor-web-updates", {
        method: "POST",
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notif-web"] });
    },
  });

  const dismissWebNotifications = () => {
    marcarTodasWebComoLidas.mutate();
  };

  // Realtime listeners with fallback polling
  useEffect(() => {
    let realtimeActive = false;

    const channel = supabase
      .channel("admin-notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "solicitacoes_ferias" }, () => {
        playNotificationSound("success");
        queryClient.invalidateQueries({ queryKey: ["admin-notif-ferias"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "solicitacoes_ferias" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-notif-ferias"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chamados_suporte" }, () => {
        playNotificationSound("success");
        queryClient.invalidateQueries({ queryKey: ["admin-notif-chamados"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "chamados_suporte" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-notif-chamados"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificacoes_web" }, () => {
        playNotificationSound("success");
        queryClient.invalidateQueries({ queryKey: ["admin-notif-web"] });
      })
      .subscribe((status) => {
        realtimeActive = status === "SUBSCRIBED";
      });

    // Fallback polling: every 30s if realtime fails
    const pollInterval = setInterval(() => {
      if (!realtimeActive) {
        queryClient.invalidateQueries({ queryKey: ["admin-notif-ferias"] });
        queryClient.invalidateQueries({ queryKey: ["admin-notif-chamados"] });
        queryClient.invalidateQueries({ queryKey: ["admin-notif-web"] });
      }
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Build notifications: internal first, then web
  const { notifications, internalCount } = useMemo(() => {
    const internal: AdminNotification[] = [];
    const web: AdminNotification[] = [];

    feriasPendentes.forEach((f: any) => {
      internal.push({
        id: `ferias-${f.id}`,
        type: "ferias",
        title: "Solicitação de Férias",
        description: `${f.profiles?.nome || "Funcionário"} — ${f.dias_solicitados} dias (${f.tipo === "ferias" ? "Férias" : f.tipo})`,
        createdAt: f.created_at,
        route: "/controle-ferias",
      });
    });

    chamadosAbertos.forEach((c: any) => {
      internal.push({
        id: `chamado-${c.id}`,
        type: "suporte",
        title: "Chamado de Suporte",
        description: `${c.profiles?.nome || "Funcionário"} — ${c.assunto}`,
        createdAt: c.created_at,
        route: "/suporte-funcionarios",
      });
    });

    webNotifs.forEach((w: any) => {
      if (w.url_fonte && w.url_fonte !== "#") {
        web.push({
          id: `web-${w.id}`,
          type: "web",
          title: w.titulo,
          description: w.resumo,
          createdAt: w.created_at,
          url: w.url_fonte,
          fonte: w.fonte,
        });
      }
    });

    internal.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    web.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      notifications: [...internal, ...web],
      internalCount: internal.length,
    };
  }, [feriasPendentes, chamadosAbertos, webNotifs]);

  // Badge count: only internal notifications (web excluded after dismissed)
  const badgeCount = webDismissed ? internalCount : internalCount + (webNotifs?.length || 0);

  return {
    notifications,
    totalCount: notifications.length,
    badgeCount,
    internalCount,
    marcarWebComoLida: marcarWebComoLida.mutate,
    buscarAtualizacoesWeb: buscarAtualizacoesWeb.mutate,
    dismissWebNotifications,
    webDismissed,
  };
}
