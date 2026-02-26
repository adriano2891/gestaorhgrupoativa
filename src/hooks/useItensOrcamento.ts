import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ItemOrcamento {
  id: string;
  nome: string;
  descricao: string | null;
  preco_base: number;
  categoria: string | null;
  imagem_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface ItemOrcamentoInput {
  nome: string;
  descricao?: string;
  preco_base: number;
  categoria?: string;
  imagem_url?: string;
  ativo?: boolean;
}

function getSupabaseConfig() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  let accessToken = supabaseKey;
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || supabaseUrl?.split('//')[1]?.split('.')[0];
    const storageKey = `sb-${projectId}-auth-token`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.access_token) {
        accessToken = parsed.access_token;
      }
    }
  } catch {
    // fallback to anon key
  }
  
  return { supabaseUrl, supabaseKey, accessToken };
}

async function supabaseRestCall(method: string, body?: any, query?: string) {
  const { supabaseUrl, supabaseKey, accessToken } = getSupabaseConfig();
  const url = `${supabaseUrl}/rest/v1/itens_orcamento${query || ''}`;
  
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'apikey': supabaseKey,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation' : method === 'PATCH' ? 'return=representation' : 'return=minimal',
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.message || `Request failed (${res.status})`);
  }

  if (method === 'DELETE') return null;
  const data = await res.json();
  return data;
}

export function useItensOrcamento() {
  const queryClient = useQueryClient();

  const { data: itens = [], isLoading, error } = useQuery({
    queryKey: ['itens_orcamento'],
    queryFn: async () => {
      try {
        const data = await supabaseRestCall('GET', undefined, '?select=*&order=nome');
        return (data ?? []) as ItemOrcamento[];
      } catch (err) {
        console.error('Erro ao buscar itens:', err);
        return [] as ItemOrcamento[];
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });

  const createItem = useMutation({
    mutationFn: async (item: ItemOrcamentoInput) => {
      const data = await supabaseRestCall('POST', item);
      if (!data || data.length === 0) {
        throw new Error('Não foi possível criar o item. Verifique se você está autenticado.');
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens_orcamento'] });
      toast.success('Item criado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast.error('Erro ao criar item: ' + error.message);
    }
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...item }: ItemOrcamentoInput & { id: string }) => {
      const data = await supabaseRestCall('PATCH', item, `?id=eq.${id}`);
      if (!data || data.length === 0) {
        throw new Error('Não foi possível atualizar o item.');
      }
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens_orcamento'] });
      toast.success('Item atualizado com sucesso!');
    },
    onError: (error: Error) => {
      console.error('Mutation error:', error);
      toast.error('Erro ao atualizar item: ' + error.message);
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      await supabaseRestCall('DELETE', undefined, `?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens_orcamento'] });
      toast.success('Item excluído com sucesso!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao excluir item: ' + error.message);
    }
  });

  return {
    itens,
    isLoading,
    error,
    createItem,
    updateItem,
    deleteItem
  };
}
