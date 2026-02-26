import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClienteOrcamento {
  id: string;
  nome_condominio: string;
  nome_sindico: string;
  email: string;
  telefone: string | null;
  cep: string | null;
  rua: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  numero_unidades: number | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClienteOrcamentoInput {
  nome_condominio: string;
  nome_sindico: string;
  email: string;
  telefone?: string;
  cep?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  numero_unidades?: number;
  observacoes?: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function getAccessToken(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1] || '';
  const storageKey = `sb-${projectId}-auth-token`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.access_token || SUPABASE_KEY;
    }
  } catch {}
  return SUPABASE_KEY;
}

async function restCall(method: string, body?: any, query?: string) {
  const token = getAccessToken();
  const url = `${SUPABASE_URL}/rest/v1/clientes_orcamentos${query || ''}`;
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
  };
  if (method === 'POST') headers['Prefer'] = 'return=representation';
  if (method === 'PATCH') headers['Prefer'] = 'return=representation';

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export function useClientesOrcamentos() {
  const queryClient = useQueryClient();

  const { data: clientes, isLoading, error } = useQuery({
    queryKey: ['clientes-orcamentos'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('clientes_orcamentos')
          .select('*')
          .eq('ativo', true)
          .order('nome_condominio', { ascending: true });

        if (error) {
          console.error('Erro ao buscar clientes:', error.message);
          return [] as ClienteOrcamento[];
        }
        return (data ?? []) as ClienteOrcamento[];
      } catch (err) {
        console.error('Erro inesperado ao buscar clientes:', err);
        return [] as ClienteOrcamento[];
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });

  const addCliente = useMutation({
    mutationFn: async (cliente: ClienteOrcamentoInput) => {
      console.log('Starting insert mutation for client:', cliente.nome_condominio);
      const data = await restCall('POST', cliente);
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('Não foi possível salvar o cliente.');
      }
      const saved = Array.isArray(data) ? data[0] : data;
      console.log('Client saved:', saved);
      return saved as ClienteOrcamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-orcamentos'] });
      toast.success('Cliente cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
    },
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClienteOrcamento> & { id: string }) => {
      const data = await restCall('PATCH', updates, `?id=eq.${id}`);
      const saved = Array.isArray(data) ? data[0] : data;
      return saved as ClienteOrcamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-orcamentos'] });
      toast.success('Cliente atualizado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar cliente: ${error.message}`);
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      await restCall('PATCH', { ativo: false }, `?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-orcamentos'] });
      toast.success('Cliente removido com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover cliente: ${error.message}`);
    },
  });

  return {
    clientes: clientes || [],
    isLoading,
    error,
    addCliente,
    updateCliente,
    deleteCliente,
  };
}
