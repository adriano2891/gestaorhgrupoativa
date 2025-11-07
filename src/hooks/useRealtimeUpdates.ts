import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

/**
 * Hook para gerenciar atualizações em tempo real de funcionários
 */
export const useFuncionariosRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('funcionarios-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        (payload) => {
          console.log('Funcionário atualizado:', payload);
          queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
          queryClient.invalidateQueries({ queryKey: ["funcionarios-por-departamento"] });
          queryClient.invalidateQueries({ queryKey: ["funcionarios-por-cargo"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Hook para gerenciar atualizações em tempo real de férias
 */
export const useFeriasRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('ferias-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'solicitacoes_ferias'
        },
        (payload) => {
          console.log('Solicitação de férias atualizada:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Nova solicitação de férias",
              description: "Uma nova solicitação foi criada.",
            });
          } else if (payload.eventType === 'UPDATE') {
            const newStatus = (payload.new as any)?.status;
            if (newStatus === 'aprovado') {
              toast({
                title: "Férias aprovadas",
                description: "Uma solicitação foi aprovada.",
              });
            } else if (newStatus === 'reprovado') {
              toast({
                title: "Férias reprovadas",
                description: "Uma solicitação foi reprovada.",
                variant: "destructive",
              });
            }
          }

          queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
          queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Hook para gerenciar atualizações em tempo real de registros de ponto
 */
export const usePontoRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('ponto-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'registros_ponto'
        },
        (payload) => {
          console.log('Registro de ponto atualizado:', payload);
          queryClient.invalidateQueries({ queryKey: ["registros-ponto"] });
          queryClient.invalidateQueries({ queryKey: ["absenteismo-por-departamento"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Hook para gerenciar atualizações em tempo real de candidatos
 */
export const useCandidatosRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('candidatos-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'candidates'
        },
        (payload) => {
          console.log('Candidato atualizado:', payload);
          
          if (payload.eventType === 'INSERT') {
            toast({
              title: "Novo candidato",
              description: "Um novo candidato foi adicionado ao banco de talentos.",
            });
          }
          
          queryClient.invalidateQueries({ queryKey: ["candidates"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Hook para gerenciar atualizações em tempo real de administradores
 */
export const useAdminsRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('admins-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_roles'
        },
        (payload) => {
          console.log('Role de usuário atualizado:', payload);
          queryClient.invalidateQueries({ queryKey: ["admins"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

/**
 * Hook para gerenciar atualizações em tempo real de métricas
 */
export const useMetricasRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('metricas-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'metricas'
        },
        (payload) => {
          console.log('Métrica atualizada:', payload);
          queryClient.invalidateQueries({ queryKey: ["metricas"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
