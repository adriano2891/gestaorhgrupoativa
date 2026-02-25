import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth } from "date-fns";

export interface RegistroPonto {
  id: string;
  user_id: string;
  data: string;
  entrada?: string;
  saida?: string;
  saida_almoco?: string;
  retorno_almoco?: string;
  total_horas?: string;
  horas_extras?: string;
  profiles?: {
    nome: string;
    departamento?: string;
  };
}

export const useRegistrosPonto = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ["registros-ponto", startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from("registros_ponto")
        .select(`
          *,
          profiles:user_id (
            nome,
            departamento,
            status
          )
        `)
        .order("data", { ascending: false });

      if (startDate) {
        query = query.gte("data", format(startDate, "yyyy-MM-dd"));
      }
      if (endDate) {
        query = query.lte("data", format(endDate, "yyyy-MM-dd"));
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filter dismissed employees client-side for reliability
      const filtered = (data || []).filter((r: any) => {
        const status = r.profiles?.status;
        return status !== 'demitido' && status !== 'pediu_demissao';
      });

      return filtered as RegistroPonto[];
    },
    retry: 2,
    staleTime: 1000 * 30,
  });
};

export const useAbsenteismoPorDepartamento = (mes?: Date) => {
  return useQuery({
    queryKey: ["absenteismo-departamento", mes],
    queryFn: async () => {
      const inicio = mes ? startOfMonth(mes) : startOfMonth(new Date());
      const fim = mes ? endOfMonth(mes) : endOfMonth(new Date());

      const { data: registros, error } = await supabase
        .from("registros_ponto")
        .select(`
          user_id,
          data,
          entrada,
          profiles:user_id (
            departamento,
            status
          )
        `)
        .gte("data", format(inicio, "yyyy-MM-dd"))
        .lte("data", format(fim, "yyyy-MM-dd"));

      if (error) throw error;

      // Filter dismissed employees client-side
      const activeRecords = (registros || []).filter((r: any) => {
        const status = r.profiles?.status;
        return status !== 'demitido' && status !== 'pediu_demissao';
      });

      const departamentos: Record<string, { total: number; ausencias: number }> = {};
      
      activeRecords.forEach((registro: any) => {
        const dept = registro.profiles?.departamento || "Sem Departamento";
        if (!departamentos[dept]) {
          departamentos[dept] = { total: 0, ausencias: 0 };
        }
        departamentos[dept].total++;
        if (!registro.entrada) {
          departamentos[dept].ausencias++;
        }
      });

      return Object.entries(departamentos).map(([departamento, stats]) => ({
        departamento,
        taxa: stats.total > 0 ? ((stats.ausencias / stats.total) * 100).toFixed(1) : 0,
      }));
    },
    retry: 2,
    staleTime: 1000 * 30,
  });
};
