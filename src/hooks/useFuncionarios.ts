import { useQuery } from "@tanstack/react-query";

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
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getAccessToken = (): string | null => {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
    const storageKey = `sb-${projectId}-auth-token`;
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    return JSON.parse(raw)?.access_token || null;
  } catch { return null; }
};

const restGet = async (path: string) => {
  const token = getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token || SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`REST ${res.status}`);
  return res.json();
};

export const useFuncionarios = () => {
  return useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      // Step 1: Get roles via REST
      const roles: { user_id: string; role: string }[] = await restGet('user_roles?select=user_id,role');

      const employeeIds = new Set<string>();
      const adminIds = new Set<string>();

      (roles || []).forEach(r => {
        if (r.role === 'funcionario') employeeIds.add(r.user_id);
        if (['admin', 'gestor', 'rh'].includes(r.role)) adminIds.add(r.user_id);
      });

      const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
      if (targetIds.length === 0) return [] as Funcionario[];

      // Step 2: Fetch profiles via REST (batched if needed)
      const idsParam = targetIds.map(id => `"${id}"`).join(',');
      const profiles: any[] = await restGet(`profiles?select=*&id=in.(${idsParam})&order=nome.asc`);

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
      const data: any[] = await restGet(`profiles?select=departamento,id,status&id=in.(${idsParam})&order=departamento.asc`);

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
      const data: any[] = await restGet(`profiles?select=cargo,id,status&id=in.(${idsParam})&order=cargo.asc`);

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
