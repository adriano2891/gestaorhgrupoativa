import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface LogEnvioHolerite {
  id: string;
  holerite_id: string;
  user_id: string;
  email_destino: string;
  status: "sucesso" | "erro" | "pendente";
  mensagem_erro?: string;
  tentativas: number;
  enviado_por?: string;
  created_at: string;
  updated_at: string;
}

export const useLogsEnvioHolerites = (holeriteId?: string) => {
  return useQuery({
    queryKey: ["logs-envio-holerites", holeriteId],
    queryFn: async () => {
      let query = supabase
        .from("logs_envio_holerites")
        .select("*")
        .order("created_at", { ascending: false });

      if (holeriteId) {
        query = query.eq("holerite_id", holeriteId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as LogEnvioHolerite[];
    },
  });
};

export const useEnviarHolerite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ holerite_id, user_id }: { holerite_id: string; user_id: string }) => {
      const { data, error } = await supabase.functions.invoke("enviar-holerite-email", {
        body: { holerite_id, user_id, manual: true },
      });

      if (error) throw error;
      
      // Verificar se a resposta indica erro
      if (data && !data.success) {
        throw new Error(data.error || "Erro ao enviar holerite");
      }
      
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Holerite enviado!",
        description: "O holerite foi enviado com sucesso para o e-mail do colaborador.",
      });
      queryClient.invalidateQueries({ queryKey: ["logs-envio-holerites"] });
      queryClient.invalidateQueries({ queryKey: ["holerites"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao enviar holerite",
        description: error.message || "Ocorreu um erro ao enviar o holerite.",
        variant: "destructive",
      });
    },
  });
};
