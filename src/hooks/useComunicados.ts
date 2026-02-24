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
}

export interface ComunicadoComLeitura extends Comunicado {
  lido: boolean;
  lido_em: string | null;
}

export const useComunicados = (userId?: string) => {
  return useQuery({
    queryKey: ["comunicados", userId],
    queryFn: async () => {
      // Use active session to ensure RLS works correctly
      const { data: { session } } = await supabase.auth.getSession();
      const activeUserId = session?.user?.id || userId;
      
      if (!activeUserId) return [] as ComunicadoComLeitura[];

      try {
        // Buscar comunicados (RLS filters based on active session)
        const { data: comunicados, error: comunicadosError } = await supabase
          .from("comunicados")
          .select("*")
          .order("created_at", { ascending: false });

        if (comunicadosError) {
          console.error("Erro ao buscar comunicados:", comunicadosError);
          return [] as ComunicadoComLeitura[];
        }

        // Buscar leituras do usuário
        const { data: leituras, error: leiturasError } = await supabase
          .from("comunicados_lidos")
          .select("comunicado_id, lido_em")
          .eq("user_id", activeUserId);

        if (leiturasError) {
          console.error("Erro ao buscar leituras:", leiturasError);
        }

        // Mapear leituras
        const leiturasMap = new Map(
          leituras?.map((l) => [l.comunicado_id, l.lido_em]) || []
        );

        // Combinar dados
        const comunicadosComLeitura: ComunicadoComLeitura[] = (comunicados || []).map((c) => ({
          ...c,
          lido: leiturasMap.has(c.id),
          lido_em: leiturasMap.get(c.id) || null,
        }));

        return comunicadosComLeitura;
      } catch (error) {
        console.error("Erro inesperado em useComunicados:", error);
        return [] as ComunicadoComLeitura[];
      }
    },
    enabled: !!userId,
    refetchOnWindowFocus: true,
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
