import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Holerite {
  id: string;
  user_id: string;
  mes: number;
  ano: number;
  salario_bruto: number;
  descontos: number;
  salario_liquido: number;
  arquivo_url: string | null;
  created_at: string;
  updated_at?: string;
}

// Hook para buscar holerites - se userId for fornecido, filtra por ele
// Se não, busca todos (para visão admin)
export const useHolerites = (userId?: string) => {
  return useQuery({
    queryKey: ["holerites", userId || "all"],
    queryFn: async () => {
      if (userId) {
        // Funcionário vendo seus próprios holerites
        const { data, error } = await supabase
          .from("holerites")
          .select("*")
          .eq("user_id", userId)
          .order("ano", { ascending: false })
          .order("mes", { ascending: false });

        if (error) throw error;
        return data as Holerite[];
      }

      // Admin: buscar apenas holerites de funcionários ativos cadastrados
      const { data, error } = await supabase
        .from("holerites")
        .select(`
          *,
          profiles:user_id!inner(status)
        `)
        .not("profiles.status", "in", '("demitido","pediu_demissao")')
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });

      if (error) {
        console.error("Erro ao buscar holerites:", error);
        throw error;
      }
      
      return data as Holerite[];
    },
    enabled: true,
  });
};

export const useHoleriteByMesAno = (userId: string, mes: number, ano: number) => {
  return useQuery({
    queryKey: ["holerite", userId, mes, ano],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holerites")
        .select("*")
        .eq("user_id", userId)
        .eq("mes", mes)
        .eq("ano", ano)
        .maybeSingle();

      if (error) throw error;
      return data as Holerite | null;
    },
    enabled: !!userId && !!mes && !!ano,
  });
};
