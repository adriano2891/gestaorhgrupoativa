import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { playNotificationSound } from "@/utils/notificationSound";

export interface AdminNotification {
  id: string;
  type: "ferias" | "suporte" | "chamado";
  title: string;
  description: string;
  createdAt: string;
  route?: string;
}

export function useAdminNotifications() {
  const queryClient = useQueryClient();

  // Fetch pending vacation requests (not yet viewed by admin)
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

  // Fetch open support tickets
  const { data: chamadosAbertos = [] } = useQuery({
    queryKey: ["admin-notif-chamados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chamados_suporte")
        .select("id, created_at, assunto, categoria, user_id, profiles:user_id(nome)")
        .eq("status", "aberto")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
  });

  // Realtime listeners
  useEffect(() => {
    const channel = supabase
      .channel("admin-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "solicitacoes_ferias" },
        () => {
          playNotificationSound("success");
          queryClient.invalidateQueries({ queryKey: ["admin-notif-ferias"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "solicitacoes_ferias" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-notif-ferias"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chamados_suporte" },
        () => {
          playNotificationSound("success");
          queryClient.invalidateQueries({ queryKey: ["admin-notif-chamados"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chamados_suporte" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["admin-notif-chamados"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const notifications: AdminNotification[] = useMemo(() => {
    const items: AdminNotification[] = [];

    feriasPendentes.forEach((f: any) => {
      items.push({
        id: `ferias-${f.id}`,
        type: "ferias",
        title: "Solicitação de Férias",
        description: `${f.profiles?.nome || "Funcionário"} — ${f.dias_solicitados} dias (${f.tipo === "ferias" ? "Férias" : f.tipo})`,
        createdAt: f.created_at,
        route: "/controle-ferias",
      });
    });

    chamadosAbertos.forEach((c: any) => {
      items.push({
        id: `chamado-${c.id}`,
        type: "suporte",
        title: "Chamado de Suporte",
        description: `${c.profiles?.nome || "Funcionário"} — ${c.assunto}`,
        createdAt: c.created_at,
        route: "/suporte-funcionarios",
      });
    });

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items;
  }, [feriasPendentes, chamadosAbertos]);

  const totalCount = notifications.length;

  return { notifications, totalCount };
}
