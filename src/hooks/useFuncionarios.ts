import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Funcionario {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  cargo?: string;
  departamento?: string;
  cpf?: string;
  salario?: number;
  created_at: string;
  updated_at: string;
}

export const useFuncionarios = () => {
  return useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data as Funcionario[];
    },
  });
};

export const useFuncionariosPorDepartamento = () => {
  return useQuery({
    queryKey: ["funcionarios-por-departamento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("departamento, id")
        .order("departamento", { ascending: true });

      if (error) throw error;

      // Agrupar por departamento
      const grouped = data.reduce((acc: any, curr: any) => {
        const dept = curr.departamento || "Sem Departamento";
        if (!acc[dept]) {
          acc[dept] = 0;
        }
        acc[dept]++;
        return acc;
      }, {});

      return Object.entries(grouped).map(([departamento, count]) => ({
        departamento,
        funcionarios: count,
      }));
    },
  });
};

export const useFuncionariosPorCargo = () => {
  return useQuery({
    queryKey: ["funcionarios-por-cargo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("cargo, id")
        .order("cargo", { ascending: true });

      if (error) throw error;

      // Agrupar por cargo
      const grouped = data.reduce((acc: any, curr: any) => {
        const position = curr.cargo || "Sem Cargo";
        if (!acc[position]) {
          acc[position] = 0;
        }
        acc[position]++;
        return acc;
      }, {});

      return Object.entries(grouped).map(([cargo, count]) => ({
        cargo,
        funcionarios: count,
      }));
    },
  });
};
