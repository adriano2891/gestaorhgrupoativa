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
      if (!userId) throw new Error("User ID is required");

      // Buscar comunicados
      const { data: comunicados, error: comunicadosError } = await supabase
        .from("comunicados")
        .select("*")
        .order("created_at", { ascending: false });

      if (comunicadosError) throw comunicadosError;

      // Buscar leituras do usuário
      const { data: leituras, error: leiturasError } = await supabase
        .from("comunicados_lidos")
        .select("comunicado_id, lido_em")
        .eq("user_id", userId);

      if (leiturasError) throw leiturasError;

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
    },
    enabled: !!userId,
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
