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
      let query = supabase
        .from("holerites")
        .select("*")
        .order("ano", { ascending: false })
        .order("mes", { ascending: false });

      if (userId) {
        query = query.eq("user_id", userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao buscar holerites:", error);
        throw error;
      }
      
      return data as Holerite[];
    },
    // Sempre habilitado - para admin busca todos, para funcionário busca os seus
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
