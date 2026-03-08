import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ========== ASO ==========
export interface ASO {
  id: string;
  user_id: string;
  tipo: string;
  data_exame: string;
  data_vencimento: string | null;
  resultado: string;
  medico_nome: string | null;
  crm: string | null;
  observacoes: string | null;
  arquivo_url: string | null;
  created_at: string;
  _nome?: string;
  _departamento?: string;
}

export const useASOs = () => {
  return useQuery({
    queryKey: ["asos"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/asos?select=*&order=data_exame.desc`,
        { headers: authHeaders(token) }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      return enrichWithNames(data, token) as Promise<ASO[]>;
    },
  });
};

export const useCreateASO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (aso: Partial<ASO>) => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/asos`, {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(aso),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["asos"] }); toast.success("ASO registrado"); },
    onError: (e: any) => toast.error("Erro ao registrar ASO", { description: e.message }),
  });
};

export const useDeleteASO = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/asos?id=eq.${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["asos"] }); toast.success("ASO excluído"); },
  });
};

// ========== EPI ==========
export interface EPIEntrega {
  id: string;
  user_id: string;
  nome_epi: string;
  ca_numero: string | null;
  data_entrega: string;
  data_devolucao: string | null;
  quantidade: number;
  motivo_troca: string | null;
  assinado: boolean;
  data_assinatura: string | null;
  ip_assinatura: string | null;
  observacoes: string | null;
  created_at: string;
  _nome?: string;
}

export const useEPIEntregas = () => {
  return useQuery({
    queryKey: ["epi-entregas"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/epi_entregas?select=*&order=data_entrega.desc`,
        { headers: authHeaders(token) }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      return enrichWithNames(data, token) as Promise<EPIEntrega[]>;
    },
  });
};

export const useCreateEPI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (epi: Partial<EPIEntrega>) => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/epi_entregas`, {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(epi),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["epi-entregas"] }); toast.success("EPI registrado"); },
    onError: (e: any) => toast.error("Erro ao registrar EPI", { description: e.message }),
  });
};

export const useDeleteEPI = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/epi_entregas?id=eq.${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["epi-entregas"] }); toast.success("EPI excluído"); },
  });
};

// ========== CAT ==========
export interface CAT {
  id: string;
  user_id: string;
  data_acidente: string;
  hora_acidente: string | null;
  tipo: string;
  local_acidente: string | null;
  descricao: string;
  parte_corpo: string | null;
  agente_causador: string | null;
  testemunha_1: string | null;
  testemunha_2: string | null;
  houve_afastamento: boolean;
  dias_afastamento: number;
  numero_cat: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  _nome?: string;
}

export const useCATs = () => {
  return useQuery({
    queryKey: ["cats"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/cats?select=*&order=data_acidente.desc`,
        { headers: authHeaders(token) }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      return enrichWithNames(data, token) as Promise<CAT[]>;
    },
  });
};

export const useCreateCAT = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cat: Partial<CAT>) => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/cats`, {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(cat),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cats"] }); toast.success("CAT registrada"); },
    onError: (e: any) => toast.error("Erro ao registrar CAT", { description: e.message }),
  });
};

export const useUpdateCAT = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<CAT> & { id: string }) => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/cats?id=eq.${id}`, {
        method: "PATCH",
        headers: { ...authHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cats"] }); toast.success("CAT atualizada"); },
    onError: (e: any) => toast.error("Erro ao atualizar CAT", { description: e.message }),
  });
};

// ========== CIPA ==========
export interface CIPAMembro {
  id: string;
  user_id: string | null;
  nome: string;
  cargo_cipa: string;
  representacao: string;
  tipo: string;
  mandato_inicio: string;
  mandato_fim: string;
  ativo: boolean;
  created_at: string;
}

export interface CIPAReuniao {
  id: string;
  data_reuniao: string;
  tipo: string;
  pauta: string | null;
  ata: string | null;
  created_at: string;
}

export const useCIPAMembros = () => {
  return useQuery({
    queryKey: ["cipa-membros"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/cipa_membros?select=*&order=mandato_fim.desc`,
        { headers: authHeaders(token) }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json() as Promise<CIPAMembro[]>;
    },
  });
};

export const useCreateCIPAMembro = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: Partial<CIPAMembro>) => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/cipa_membros`, {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(m),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cipa-membros"] }); toast.success("Membro CIPA adicionado"); },
    onError: (e: any) => toast.error("Erro", { description: e.message }),
  });
};

export const useDeleteCIPAMembro = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/cipa_membros?id=eq.${id}`, {
        method: "DELETE",
        headers: authHeaders(token),
      });
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cipa-membros"] }); toast.success("Membro removido"); },
  });
};

export const useCIPAReunioes = () => {
  return useQuery({
    queryKey: ["cipa-reunioes"],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/cipa_reunioes?select=*&order=data_reuniao.desc`,
        { headers: authHeaders(token) }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json() as Promise<CIPAReuniao[]>;
    },
  });
};

export const useCreateCIPAReuniao = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: Partial<CIPAReuniao>) => {
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/cipa_reunioes`, {
        method: "POST",
        headers: { ...authHeaders(token), "Content-Type": "application/json", Prefer: "return=representation" },
        body: JSON.stringify(r),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["cipa-reunioes"] }); toast.success("Reunião registrada"); },
    onError: (e: any) => toast.error("Erro", { description: e.message }),
  });
};

// ========== Helpers ==========
function getToken(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
  const raw = localStorage.getItem(`sb-${projectId}-auth-token`);
  return raw ? JSON.parse(raw)?.access_token || '' : '';
}

function authHeaders(token: string): Record<string, string> {
  return {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
  };
}

async function enrichWithNames(data: any[], token: string): Promise<any[]> {
  if (data.length === 0) return data;
  const userIds = [...new Set(data.map((d: any) => d.user_id).filter(Boolean))];
  if (userIds.length === 0) return data;
  const idsParam = userIds.map(id => `"${id}"`).join(',');
  try {
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/profiles?select=id,nome,departamento&id=in.(${idsParam})`,
      { headers: authHeaders(token) }
    );
    if (res.ok) {
      const profiles = await res.json();
      const map: Record<string, { nome: string; departamento?: string }> = {};
      profiles.forEach((p: any) => { map[p.id] = { nome: p.nome, departamento: p.departamento }; });
      data.forEach((d: any) => {
        d._nome = map[d.user_id]?.nome || "—";
        d._departamento = map[d.user_id]?.departamento;
      });
    }
  } catch { /* ignore */ }
  return data;
}
