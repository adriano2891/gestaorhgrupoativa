import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { 
  Fornecedor, 
  EnderecoFornecedor, 
  ItemFornecedor, 
  DocumentoFornecedor,
  HistoricoPrecoFornecedor,
  FornecedorComEndereco 
} from '@/types/fornecedores';

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

function getHeaders(prefer?: string): Record<string, string> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
    'apikey': SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (prefer) headers['Prefer'] = prefer;
  return headers;
}

async function restCall(table: string, method: string, body?: any, query?: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
  const prefer = (method === 'POST' || method === 'PATCH') ? 'return=representation' : undefined;
  
  const res = await fetch(url, {
    method,
    headers: getHeaders(prefer),
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`[restCall ${table}] Error:`, res.status, err);
    throw new Error(err || `HTTP ${res.status}`);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// Fornecedores
export function useFornecedores() {
  return useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      try {
        const data = await restCall('fornecedores', 'GET', undefined, '?select=*&order=razao_social.asc');
        return (data ?? []) as Fornecedor[];
      } catch (err) {
        console.error('Erro ao buscar fornecedores:', err);
        return [] as Fornecedor[];
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });
}

export function useFornecedor(id: string | undefined) {
  return useQuery({
    queryKey: ['fornecedor', id],
    queryFn: async () => {
      if (!id) return null;
      const data = await restCall('fornecedores', 'GET', undefined, `?id=eq.${id}&select=*`);
      return (Array.isArray(data) && data.length > 0 ? data[0] : null) as Fornecedor | null;
    },
    enabled: !!id,
  });
}

export function useEnderecoFornecedor(fornecedorId: string | undefined) {
  return useQuery({
    queryKey: ['endereco_fornecedor', fornecedorId],
    queryFn: async () => {
      if (!fornecedorId) return null;
      const data = await restCall('enderecos_fornecedor', 'GET', undefined, `?fornecedor_id=eq.${fornecedorId}&select=*`);
      return (Array.isArray(data) && data.length > 0 ? data[0] : null) as EnderecoFornecedor | null;
    },
    enabled: !!fornecedorId,
  });
}

export function useCreateFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      fornecedor: Omit<Fornecedor, 'id' | 'created_at' | 'updated_at'>;
      endereco?: Omit<EnderecoFornecedor, 'id' | 'fornecedor_id' | 'created_at' | 'updated_at'>;
    }) => {
      const result = await restCall('fornecedores', 'POST', data.fornecedor);
      const fornecedor = Array.isArray(result) ? result[0] : result;
      
      if (!fornecedor?.id) throw new Error('Falha ao criar fornecedor');
      
      if (data.endereco) {
        await restCall('enderecos_fornecedor', 'POST', { ...data.endereco, fornecedor_id: fornecedor.id });
      }
      
      return fornecedor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor cadastrado com sucesso!');
    },
    onError: (error: any) => {
      const msg = error?.message || '';
      if (msg.includes('23505') || msg.includes('duplicate')) {
        toast.error('Já existe um fornecedor com este CPF/CNPJ.');
      } else {
        toast.error('Erro ao cadastrar fornecedor.');
      }
      console.error('Create fornecedor error:', error);
    },
  });
}

export function useUpdateFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { 
      id: string;
      fornecedor: Partial<Omit<Fornecedor, 'id' | 'created_at' | 'updated_at'>>;
      endereco?: Partial<Omit<EnderecoFornecedor, 'id' | 'fornecedor_id' | 'created_at' | 'updated_at'>>;
    }) => {
      await restCall('fornecedores', 'PATCH', data.fornecedor, `?id=eq.${data.id}`);
      
      if (data.endereco) {
        const existing = await restCall('enderecos_fornecedor', 'GET', undefined, `?fornecedor_id=eq.${data.id}&select=id`);
        if (Array.isArray(existing) && existing.length > 0) {
          await restCall('enderecos_fornecedor', 'PATCH', data.endereco, `?fornecedor_id=eq.${data.id}`);
        } else {
          await restCall('enderecos_fornecedor', 'POST', { ...data.endereco, fornecedor_id: data.id });
        }
      }
      
      return data.id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      queryClient.invalidateQueries({ queryKey: ['fornecedor', id] });
      queryClient.invalidateQueries({ queryKey: ['endereco_fornecedor', id] });
      toast.success('Fornecedor atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar fornecedor.');
    },
  });
}

export function useDeleteFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      await restCall('fornecedores', 'DELETE', undefined, `?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir fornecedor.');
    },
  });
}

// Itens do Fornecedor
export function useItensFornecedor(fornecedorId: string | undefined) {
  return useQuery({
    queryKey: ['itens_fornecedor', fornecedorId],
    queryFn: async () => {
      if (!fornecedorId) return [];
      const data = await restCall('itens_fornecedor', 'GET', undefined, `?fornecedor_id=eq.${fornecedorId}&select=*&order=nome.asc`);
      return (data ?? []) as ItemFornecedor[];
    },
    enabled: !!fornecedorId,
  });
}

export function useCreateItemFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<ItemFornecedor, 'id' | 'created_at' | 'updated_at'>) => {
      const result = await restCall('itens_fornecedor', 'POST', data);
      return Array.isArray(result) ? result[0] : result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itens_fornecedor', variables.fornecedor_id] });
      toast.success('Item cadastrado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao cadastrar item.');
    },
  });
}

export function useUpdateItemFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: string; fornecedor_id: string; updates: Partial<ItemFornecedor> }) => {
      await restCall('itens_fornecedor', 'PATCH', data.updates, `?id=eq.${data.id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itens_fornecedor', variables.fornecedor_id] });
      queryClient.invalidateQueries({ queryKey: ['historico_precos', variables.id] });
      toast.success('Item atualizado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar item.');
    },
  });
}

export function useDeleteItemFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: string; fornecedor_id: string }) => {
      await restCall('itens_fornecedor', 'DELETE', undefined, `?id=eq.${data.id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['itens_fornecedor', variables.fornecedor_id] });
      toast.success('Item excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir item.');
    },
  });
}

// Documentos do Fornecedor
export function useDocumentosFornecedor(fornecedorId: string | undefined) {
  return useQuery({
    queryKey: ['documentos_fornecedor', fornecedorId],
    queryFn: async () => {
      if (!fornecedorId) return [];
      const data = await restCall('documentos_fornecedor', 'GET', undefined, `?fornecedor_id=eq.${fornecedorId}&select=*&order=created_at.desc`);
      return (data ?? []) as DocumentoFornecedor[];
    },
    enabled: !!fornecedorId,
  });
}

export function useCreateDocumentoFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<DocumentoFornecedor, 'id' | 'created_at'>) => {
      const result = await restCall('documentos_fornecedor', 'POST', data);
      return Array.isArray(result) ? result[0] : result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos_fornecedor', variables.fornecedor_id] });
      toast.success('Documento adicionado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao adicionar documento.');
    },
  });
}

export function useDeleteDocumentoFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { id: string; fornecedor_id: string; arquivo_url: string }) => {
      // Delete from storage via REST
      const path = data.arquivo_url.split('/').pop();
      if (path) {
        try {
          await fetch(`${SUPABASE_URL}/storage/v1/object/fornecedores/${path}`, {
            method: 'DELETE',
            headers: getHeaders(),
          });
        } catch (e) {
          console.warn('Erro ao deletar arquivo do storage:', e);
        }
      }
      
      await restCall('documentos_fornecedor', 'DELETE', undefined, `?id=eq.${data.id}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentos_fornecedor', variables.fornecedor_id] });
      toast.success('Documento excluído com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao excluir documento.');
    },
  });
}

// Histórico de Preços
export function useHistoricoPrecos(itemId: string | undefined) {
  return useQuery({
    queryKey: ['historico_precos', itemId],
    queryFn: async () => {
      if (!itemId) return [];
      const data = await restCall('historico_precos_fornecedor', 'GET', undefined, `?item_id=eq.${itemId}&select=*&order=created_at.desc`);
      return (data ?? []) as HistoricoPrecoFornecedor[];
    },
    enabled: !!itemId,
  });
}
