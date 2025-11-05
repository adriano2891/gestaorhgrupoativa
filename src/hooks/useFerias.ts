import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface PeriodoAquisitivo {
  id: string;
  user_id: string;
  data_inicio: string;
  data_fim: string;
  dias_direito: number;
  dias_usados: number;
  dias_disponiveis: number;
  created_at: string;
  updated_at: string;
}

export interface SolicitacaoFerias {
  id: string;
  user_id: string;
  periodo_aquisitivo_id: string;
  data_inicio: string;
  data_fim: string;
  dias_solicitados: number;
  tipo: 'ferias' | 'ferias_coletivas' | 'abono_pecuniario';
  status: 'pendente' | 'aprovado' | 'em_andamento' | 'reprovado' | 'concluido' | 'cancelado';
  observacao?: string;
  aprovado_por?: string;
  data_aprovacao?: string;
  motivo_reprovacao?: string;
  notificado_em?: string;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome: string;
    cargo?: string;
    departamento?: string;
  };
}

export const useSolicitacoesFerias = (filters?: {
  status?: string;
  departamento?: string;
  dataInicio?: string;
  dataFim?: string;
}) => {
  return useQuery({
    queryKey: ["solicitacoes-ferias", filters],
    queryFn: async () => {
      let query = supabase
        .from("solicitacoes_ferias")
        .select(`
          *,
          profiles!user_id (
            nome,
            cargo,
            departamento
          )
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      if (filters?.dataInicio) {
        query = query.gte("data_inicio", filters.dataInicio);
      }

      if (filters?.dataFim) {
        query = query.lte("data_fim", filters.dataFim);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por departamento após buscar (RLS já filtra o acesso)
      let filteredData = data as SolicitacaoFerias[];
      
      if (filters?.departamento) {
        filteredData = filteredData.filter(
          (s) => s.profiles?.departamento === filters.departamento
        );
      }

      return filteredData;
    },
  });
};

export const useMetricasFerias = () => {
  return useQuery({
    queryKey: ["metricas-ferias"],
    queryFn: async () => {
      const { data: solicitacoes, error } = await supabase
        .from("solicitacoes_ferias")
        .select("status, data_inicio, data_fim");

      if (error) throw error;

      const hoje = new Date().toISOString().split('T')[0];
      
      const pendentes = solicitacoes?.filter((s) => s.status === "pendente").length || 0;
      
      const emAndamento = solicitacoes?.filter(
        (s) => s.status === "em_andamento" || 
        (s.status === "aprovado" && s.data_inicio <= hoje && s.data_fim >= hoje)
      ).length || 0;
      
      const proximas = solicitacoes?.filter(
        (s) => s.status === "aprovado" && s.data_inicio > hoje
      ).length || 0;

      // Buscar saldo médio
      const { data: periodos } = await supabase
        .from("periodos_aquisitivos")
        .select("dias_disponiveis");

      const saldoMedio = periodos?.length
        ? Math.round(
            periodos.reduce((acc, p) => acc + p.dias_disponiveis, 0) / periodos.length
          )
        : 0;

      return {
        pendentes,
        emAndamento,
        proximas,
        saldoMedio,
      };
    },
  });
};

export const useAtualizarSolicitacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      observacao,
      motivo_reprovacao,
    }: {
      id: string;
      status: string;
      observacao?: string;
      motivo_reprovacao?: string;
    }) => {
      const updateData: any = {
        status,
        observacao,
      };

      if (status === "aprovado") {
        updateData.data_aprovacao = new Date().toISOString();
        const { data: { user } } = await supabase.auth.getUser();
        updateData.aprovado_por = user?.id;
      }

      if (status === "reprovado" && motivo_reprovacao) {
        updateData.motivo_reprovacao = motivo_reprovacao;
      }

      const { data, error } = await supabase
        .from("solicitacoes_ferias")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
      toast({
        title: "Sucesso",
        description: "Solicitação atualizada com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar solicitação: " + error.message,
        variant: "destructive",
      });
    },
  });
};

export const useNotificarFuncionario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (solicitacaoId: string) => {
      const { data, error } = await supabase
        .from("solicitacoes_ferias")
        .update({ notificado_em: new Date().toISOString() })
        .eq("id", solicitacaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      toast({
        title: "Notificação enviada",
        description: "Funcionário notificado com sucesso",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao enviar notificação: " + error.message,
        variant: "destructive",
      });
    },
  });
};
