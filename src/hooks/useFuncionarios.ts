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
      // Get admin user IDs to exclude
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "gestor", "rh"]);
      
      const adminUserIds = (adminRoles || []).map(r => r.user_id);

      let query = supabase
        .from("profiles")
        .select("*, user_roles!inner(role)")
        .eq("user_roles.role", "funcionario")
        .not("status", "in", '("demitido","pediu_demissao")')
        .order("nome", { ascending: true });

      if (adminUserIds.length > 0) {
        query = query.not("id", "in", `(${adminUserIds.join(",")})`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Funcionario[];
    },
  });
};

export const useFuncionariosPorDepartamento = () => {
  return useQuery({
    queryKey: ["funcionarios-por-departamento"],
    queryFn: async () => {
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "gestor", "rh"]);
      const adminUserIds = (adminRoles || []).map(r => r.user_id);

      let query = supabase
        .from("profiles")
        .select("departamento, id, user_roles!inner(role)")
        .eq("user_roles.role", "funcionario")
        .not("status", "in", '("demitido","pediu_demissao")')
        .order("departamento", { ascending: true });

      if (adminUserIds.length > 0) {
        query = query.not("id", "in", `(${adminUserIds.join(",")})`);
      }

      const { data, error } = await query;
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
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["admin", "gestor", "rh"]);
      const adminUserIds = (adminRoles || []).map(r => r.user_id);

      let query = supabase
        .from("profiles")
        .select("cargo, id, user_roles!inner(role)")
        .eq("user_roles.role", "funcionario")
        .not("status", "in", '("demitido","pediu_demissao")')
        .order("cargo", { ascending: true });

      if (adminUserIds.length > 0) {
        query = query.not("id", "in", `(${adminUserIds.join(",")})`);
      }

      const { data, error } = await query;
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
