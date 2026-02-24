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
  visualizada_admin: boolean;
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
  apenasNovas?: boolean;
}) => {
  return useQuery({
    queryKey: ["solicitacoes-ferias", filters],
    queryFn: async () => {
      try {
        let query = supabase
          .from("solicitacoes_ferias")
          .select(`
            *,
            profiles!user_id (
              nome,
              cargo,
              departamento,
              status
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

        if (filters?.apenasNovas) {
          query = query.eq("visualizada_admin", false);
        }

        const { data, error } = await query;

        if (error) {
          console.error("Erro ao buscar solicitações de férias:", error);
          return [] as SolicitacaoFerias[];
        }

        // Filtrar funcionários ativos e por departamento no client-side
        let filteredData = (data as SolicitacaoFerias[]).filter((s) => {
          const profileStatus = (s.profiles as any)?.status;
          return profileStatus !== 'demitido' && profileStatus !== 'pediu_demissao';
        });
        
        if (filters?.departamento) {
          filteredData = filteredData.filter(
            (s) => s.profiles?.departamento === filters.departamento
          );
        }

        return filteredData;
      } catch (error) {
        console.error("Erro inesperado em useSolicitacoesFerias:", error);
        return [] as SolicitacaoFerias[];
      }
    },
  });
};

export const useMetricasFerias = () => {
  return useQuery({
    queryKey: ["metricas-ferias"],
    queryFn: async () => {
      try {
        const { data: solicitacoes, error } = await supabase
          .from("solicitacoes_ferias")
          .select(`
            status, data_inicio, data_fim,
            profiles!user_id(status)
          `);

        if (error) {
          console.error("Erro ao buscar solicitações de férias:", error);
          return { pendentes: 0, emAndamento: 0, proximas: 0, saldoMedio: 0 };
        }

        // Filtrar apenas funcionários ativos no client-side
        const ativas = (solicitacoes || []).filter((s: any) => {
          const profileStatus = s.profiles?.status;
          return profileStatus !== 'demitido' && profileStatus !== 'pediu_demissao';
        });

        const hoje = new Date().toISOString().split('T')[0];
        
        const pendentes = ativas.filter((s: any) => s.status === "pendente").length;
        
        const emAndamento = ativas.filter(
          (s: any) => s.status === "em_andamento" || 
          (s.status === "aprovado" && s.data_inicio <= hoje && s.data_fim >= hoje)
        ).length;
        
        const proximas = ativas.filter(
          (s: any) => s.status === "aprovado" && s.data_inicio > hoje
        ).length;

        const { data: periodos } = await supabase
          .from("periodos_aquisitivos")
          .select(`dias_disponiveis`);

        const saldoMedio = periodos?.length
          ? Math.round(
              periodos.reduce((acc, p) => acc + (p.dias_disponiveis || 0), 0) / periodos.length
            )
          : 0;

        return { pendentes, emAndamento, proximas, saldoMedio };
      } catch (error) {
        console.error("Erro inesperado em useMetricasFerias:", error);
        return { pendentes: 0, emAndamento: 0, proximas: 0, saldoMedio: 0 };
      }
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

export const useMarcarComoVisualizada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (solicitacaoId: string) => {
      const { data, error } = await supabase
        .from("solicitacoes_ferias")
        .update({ visualizada_admin: true })
        .eq("id", solicitacaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
    },
  });
};

export const useCriarSolicitacaoFerias = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      periodo_aquisitivo_id,
      data_inicio,
      data_fim,
      dias_solicitados,
      tipo = 'ferias',
      observacao,
    }: {
      periodo_aquisitivo_id: string;
      data_inicio: string;
      data_fim: string;
      dias_solicitados: number;
      tipo?: 'ferias' | 'ferias_coletivas' | 'abono_pecuniario';
      observacao?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("solicitacoes_ferias")
        .insert({
          user_id: user.id,
          periodo_aquisitivo_id,
          data_inicio,
          data_fim,
          dias_solicitados,
          tipo,
          observacao,
          status: 'pendente',
        })
        .select()
        .single();

      if (error) throw error;

      // Criar chamado automático no módulo Suporte ao Funcionário
      const tipoLabel = tipo === 'ferias' ? 'Férias' : tipo === 'ferias_coletivas' ? 'Férias Coletivas' : 'Abono Pecuniário';
      const assuntoChamado = `Solicitação de ${tipoLabel} - ${data_inicio} a ${data_fim}`;
      const mensagemChamado = `Solicitação automática de ${tipoLabel}.\n\nPeríodo: ${data_inicio} a ${data_fim}\nDias solicitados: ${dias_solicitados}${observacao ? `\nObservação: ${observacao}` : ''}`;

      try {
        const { data: chamado } = await (supabase as any)
          .from("chamados_suporte")
          .insert({ user_id: user.id, categoria: "ferias", assunto: assuntoChamado })
          .select()
          .single();

        if (chamado) {
          await (supabase as any)
            .from("mensagens_chamado")
            .insert({
              chamado_id: chamado.id,
              remetente_id: user.id,
              conteudo: mensagemChamado,
            });
        }
      } catch (e) {
        // Não bloquear a solicitação de férias se o chamado falhar
        console.error("Erro ao criar chamado de suporte para férias:", e);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias-portal"] });
      queryClient.invalidateQueries({ queryKey: ["periodos-aquisitivos-portal"] });
      queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação de férias foi enviada para aprovação",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: "Erro ao solicitar férias: " + error.message,
        variant: "destructive",
      });
    },
  });
};
