import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Metrica {
  id: string;
  periodo: string;
  taxa_presenca: number;
  taxa_retencao: number;
  satisfacao_interna: number;
  tempo_medio_contratacao: number;
  indice_absenteismo: number;
  custo_medio_funcionario: number;
  horas_extras_percentual: number;
  indice_eficiencia: number;
  produtividade_equipe?: number;
  custo_beneficios?: number;
  satisfacao_gestor?: number;
  total_folha_pagamento?: number;
  total_encargos?: number;
  variacao_mensal?: number;
}

export const useMetricas = (limit = 1) => {
  return useQuery({
    queryKey: ["metricas", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("metricas")
        .select("*")
        .order("periodo", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as Metrica[];
    },
  });
};
