import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: string;
  prioridade: string;
  destinatarios: string[];
  criado_por: string | null;
  created_at: string;
  data_expiracao: string | null;
  ativo: boolean;
  anexos: any[] | null;
}

export interface ComunicadoComLeitura extends Comunicado {
  lido: boolean;
  lido_em: string | null;
  confirmado: boolean;
  confirmado_em: string | null;
}

export const useComunicados = (userId?: string) => {
  return useQuery({
    queryKey: ["comunicados", userId],
    queryFn: async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const activeUserId = session?.user?.id || userId;

        if (!activeUserId) return [] as ComunicadoComLeitura[];

        const { data: comunicados, error: comunicadosError } = await supabase
          .from("comunicados")
          .select("*")
          .eq("ativo", true)
          .eq("excluido" as any, false)
          .order("created_at", { ascending: false });

        if (comunicadosError) {
          console.error("Erro ao buscar comunicados:", comunicadosError);
          return [] as ComunicadoComLeitura[];
        }

        const { data: leituras } = await supabase
          .from("comunicados_lidos")
          .select("comunicado_id, lido_em, confirmado, confirmado_em" as any)
          .eq("user_id", activeUserId);

        const leiturasMap = new Map(
          (leituras as any[])?.map((l: any) => [l.comunicado_id, l]) || []
        );

        return (comunicados || []).map((c: any) => {
          const leitura = leiturasMap.get(c.id);
          return {
            ...c,
            lido: !!leitura,
            lido_em: leitura?.lido_em || null,
            confirmado: leitura?.confirmado || false,
            confirmado_em: leitura?.confirmado_em || null,
          };
        }) as ComunicadoComLeitura[];
      } catch (error) {
        console.error("Erro inesperado em useComunicados:", error);
        return [] as ComunicadoComLeitura[];
      }
    },
    enabled: !!userId,
    retry: 2,
    staleTime: 1000 * 30,
  });
};

export const useMarcarComunicadoLido = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      comunicadoId,
      userId,
    }: {
      comunicadoId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("comunicados_lidos")
        .insert({
          comunicado_id: comunicadoId,
          user_id: userId,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comunicados", variables.userId] });
    },
    onError: (error) => {
      toast.error("Erro ao marcar comunicado como lido");
      console.error("Erro:", error);
    },
  });
};

/**
 * Confirmação formal de leitura (CLT - acuse de recebimento)
 * Registra que o funcionário leu e está ciente do comunicado.
 */
export const useConfirmarComunicado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      comunicadoId,
      userId,
    }: {
      comunicadoId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("comunicados_lidos")
        .update({
          confirmado: true,
          confirmado_em: new Date().toISOString(),
        } as any)
        .eq("comunicado_id", comunicadoId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comunicados", variables.userId] });
    },
    onError: (error) => {
      toast.error("Erro ao confirmar comunicado");
      console.error("Erro:", error);
    },
  });
};
