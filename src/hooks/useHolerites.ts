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
        // Use active session to ensure RLS works correctly
        const { data: { session } } = await supabase.auth.getSession();
        const activeUserId = session?.user?.id || userId;
        
        const { data, error } = await supabase
          .from("holerites")
          .select("*")
          .eq("user_id", activeUserId)
          .order("ano", { ascending: false })
          .order("mes", { ascending: false });

        if (error) throw error;
        return data as Holerite[];
      }

      // Admin: fetch all holerites, filter active employees separately
      try {
        const { data: allHolerites, error } = await supabase
          .from("holerites")
          .select("*")
          .order("ano", { ascending: false })
          .order("mes", { ascending: false });

        if (error) {
          console.error("Erro ao buscar holerites:", error);
          throw error;
        }

        if (!allHolerites || allHolerites.length === 0) return [] as Holerite[];

        // Filter by active employees
        const uniqueUserIds = [...new Set(allHolerites.map(h => h.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, status")
          .in("id", uniqueUserIds);

        const activeIds = new Set(
          (profiles || [])
            .filter(p => p.status !== 'demitido' && p.status !== 'pediu_demissao')
            .map(p => p.id)
        );

        return allHolerites.filter(h => activeIds.has(h.user_id)) as Holerite[];
      } catch (e) {
        console.error("Erro inesperado em useHolerites:", e);
        return [] as Holerite[];
      }
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
