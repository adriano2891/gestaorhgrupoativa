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
      // Step 1: Get employee user IDs
      const { data: employeeRoles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Build maps: employees and admins
      const employeeIds = new Set<string>();
      const adminIds = new Set<string>();
      
      (employeeRoles || []).forEach(r => {
        if (r.role === 'funcionario') employeeIds.add(r.user_id);
        if (['admin', 'gestor', 'rh'].includes(r.role as string)) adminIds.add(r.user_id);
      });

      // Only employees that are NOT also admins
      const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
      if (targetIds.length === 0) return [] as Funcionario[];

      // Step 2: Fetch profiles for those IDs
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .in("id", targetIds)
        .order("nome", { ascending: true });

      if (error) throw error;
      
      // Filter inactive statuses client-side for reliability
      const activeData = (data || []).filter((p: any) => {
        const status = (p.status || "ativo").toLowerCase();
        return status !== "demitido" && status !== "pediu_demissao";
      });
      return activeData as Funcionario[];
    },
    retry: 2,
    staleTime: 1000 * 30,
  });
};

export const useFuncionariosPorDepartamento = () => {
  return useQuery({
    queryKey: ["funcionarios-por-departamento"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const employeeIds = new Set<string>();
      const adminIds = new Set<string>();
      (roles || []).forEach(r => {
        if (r.role === 'funcionario') employeeIds.add(r.user_id);
        if (['admin', 'gestor', 'rh'].includes(r.role as string)) adminIds.add(r.user_id);
      });
      const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
      if (targetIds.length === 0) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("departamento, id, status")
        .in("id", targetIds)
        .order("departamento", { ascending: true });

      if (error) throw error;

      const activeData = (data || []).filter((p: any) => {
        const status = (p.status || "ativo").toLowerCase();
        return status !== "demitido" && status !== "pediu_demissao";
      });

      const grouped = (data || []).reduce((acc: Record<string, number>, curr: any) => {
        const dept = curr.departamento || "Sem Departamento";
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([departamento, count]) => ({
        departamento,
        funcionarios: count,
      }));
    },
    retry: 2,
    staleTime: 1000 * 30,
  });
};

export const useFuncionariosPorCargo = () => {
  return useQuery({
    queryKey: ["funcionarios-por-cargo"],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");
      if (rolesError) throw rolesError;

      const employeeIds = new Set<string>();
      const adminIds = new Set<string>();
      (roles || []).forEach(r => {
        if (r.role === 'funcionario') employeeIds.add(r.user_id);
        if (['admin', 'gestor', 'rh'].includes(r.role as string)) adminIds.add(r.user_id);
      });
      const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
      if (targetIds.length === 0) return [];

      const { data, error } = await supabase
        .from("profiles")
        .select("cargo, id, status")
        .in("id", targetIds)
        .order("cargo", { ascending: true });

      if (error) throw error;

      const activeData = (data || []).filter((p: any) => {
        const status = (p.status || "ativo").toLowerCase();
        return status !== "demitido" && status !== "pediu_demissao";
      });

      const grouped = (data || []).reduce((acc: Record<string, number>, curr: any) => {
        const position = curr.cargo || "Sem Cargo";
        acc[position] = (acc[position] || 0) + 1;
        return acc;
      }, {});

      return Object.entries(grouped).map(([cargo, count]) => ({
        cargo,
        funcionarios: count,
      }));
    },
    retry: 2,
    staleTime: 1000 * 30,
  });
};
