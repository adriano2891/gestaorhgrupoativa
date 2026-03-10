import { useQuery } from "@tanstack/react-query";
import { restGet } from "@/lib/restClient";

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
  escala_trabalho?: string;
  turno?: string;
  status?: string;
  matricula?: string;
}

export const useFuncionarios = () => {
  return useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const roles: { user_id: string; role: string }[] = await restGet('user_roles?select=user_id,role');

      const employeeIds = new Set<string>();
      const adminIds = new Set<string>();

      (roles || []).forEach(r => {
        if (r.role === 'funcionario') employeeIds.add(r.user_id);
        if (['admin', 'gestor', 'rh'].includes(r.role)) adminIds.add(r.user_id);
      });

      const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
      if (targetIds.length === 0) return [] as Funcionario[];

      const idsParam = targetIds.map(id => `"${id}"`).join(',');
      const profiles: any[] = await restGet(`profiles?select=*&id=in.(${idsParam})&tipo_perfil=eq.funcionario&order=nome.asc&limit=2000`);

      const activeData = (profiles || []).filter((p: any) => {
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
      const roles: { user_id: string; role: string }[] = await restGet('user_roles?select=user_id,role');

      const employeeIds = new Set<string>();
      const adminIds = new Set<string>();
      (roles || []).forEach(r => {
        if (r.role === 'funcionario') employeeIds.add(r.user_id);
        if (['admin', 'gestor', 'rh'].includes(r.role)) adminIds.add(r.user_id);
      });
      const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
      if (targetIds.length === 0) return [];

      const idsParam = targetIds.map(id => `"${id}"`).join(',');
      const data: any[] = await restGet(`profiles?select=departamento,id,status&id=in.(${idsParam})&tipo_perfil=eq.funcionario&order=departamento.asc`);

      const activeData = (data || []).filter((p: any) => {
        const status = (p.status || "ativo").toLowerCase();
        return status !== "demitido" && status !== "pediu_demissao";
      });

      const grouped = activeData.reduce((acc: Record<string, number>, curr: any) => {
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
      const roles: { user_id: string; role: string }[] = await restGet('user_roles?select=user_id,role');

      const employeeIds = new Set<string>();
      const adminIds = new Set<string>();
      (roles || []).forEach(r => {
        if (r.role === 'funcionario') employeeIds.add(r.user_id);
        if (['admin', 'gestor', 'rh'].includes(r.role)) adminIds.add(r.user_id);
      });
      const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
      if (targetIds.length === 0) return [];

      const idsParam = targetIds.map(id => `"${id}"`).join(',');
      const data: any[] = await restGet(`profiles?select=cargo,id,status&id=in.(${idsParam})&tipo_perfil=eq.funcionario&order=cargo.asc`);

      const activeData = (data || []).filter((p: any) => {
        const status = (p.status || "ativo").toLowerCase();
        return status !== "demitido" && status !== "pediu_demissao";
      });

      const grouped = activeData.reduce((acc: Record<string, number>, curr: any) => {
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
