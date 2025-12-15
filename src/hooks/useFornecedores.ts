import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { 
  Fornecedor, 
  EnderecoFornecedor, 
  ItemFornecedor, 
  DocumentoFornecedor,
  HistoricoPrecoFornecedor,
  FornecedorComEndereco 
} from '@/types/fornecedores';

// Fornecedores
export function useFornecedores() {
  return useQuery({
    queryKey: ['fornecedores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('razao_social');
      if (error) throw error;
      return data as Fornecedor[];
    },
  });
}

export function useFornecedor(id: string | undefined) {
  return useQuery({
    queryKey: ['fornecedor', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return data as Fornecedor | null;
    },
    enabled: !!id,
  });
}

export function useEnderecoFornecedor(fornecedorId: string | undefined) {
  return useQuery({
    queryKey: ['endereco_fornecedor', fornecedorId],
    queryFn: async () => {
      if (!fornecedorId) return null;
      const { data, error } = await supabase
        .from('enderecos_fornecedor')
        .select('*')
        .eq('fornecedor_id', fornecedorId)
        .maybeSingle();
      if (error) throw error;
      return data as EnderecoFornecedor | null;
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
      const { data: fornecedor, error: fornecedorError } = await supabase
        .from('fornecedores')
        .insert(data.fornecedor)
        .select()
        .single();
      
      if (fornecedorError) throw fornecedorError;
      
      if (data.endereco) {
        const { error: enderecoError } = await supabase
          .from('enderecos_fornecedor')
          .insert({ ...data.endereco, fornecedor_id: fornecedor.id });
        
        if (enderecoError) throw enderecoError;
      }
      
      return fornecedor;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fornecedores'] });
      toast.success('Fornecedor cadastrado com sucesso!');
    },
    onError: (error: any) => {
      if (error.code === '23505') {
        toast.error('Já existe um fornecedor com este CPF/CNPJ.');
      } else {
        toast.error('Erro ao cadastrar fornecedor.');
      }
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
      const { error: fornecedorError } = await supabase
        .from('fornecedores')
        .update(data.fornecedor)
        .eq('id', data.id);
      
      if (fornecedorError) throw fornecedorError;
      
      if (data.endereco) {
        const { data: existingEndereco } = await supabase
          .from('enderecos_fornecedor')
          .select('id')
          .eq('fornecedor_id', data.id)
          .maybeSingle();
        
        if (existingEndereco) {
          await supabase
            .from('enderecos_fornecedor')
            .update(data.endereco)
            .eq('fornecedor_id', data.id);
        } else {
          await supabase
            .from('enderecos_fornecedor')
            .insert({ ...data.endereco, fornecedor_id: data.id });
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
      const { error } = await supabase
        .from('fornecedores')
        .delete()
        .eq('id', id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('itens_fornecedor')
        .select('*')
        .eq('fornecedor_id', fornecedorId)
        .order('nome');
      if (error) throw error;
      return data as ItemFornecedor[];
    },
    enabled: !!fornecedorId,
  });
}

export function useCreateItemFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<ItemFornecedor, 'id' | 'created_at' | 'updated_at'>) => {
      const { data: item, error } = await supabase
        .from('itens_fornecedor')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return item;
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
      const { error } = await supabase
        .from('itens_fornecedor')
        .update(data.updates)
        .eq('id', data.id);
      if (error) throw error;
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
      const { error } = await supabase
        .from('itens_fornecedor')
        .delete()
        .eq('id', data.id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('documentos_fornecedor')
        .select('*')
        .eq('fornecedor_id', fornecedorId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as DocumentoFornecedor[];
    },
    enabled: !!fornecedorId,
  });
}

export function useCreateDocumentoFornecedor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Omit<DocumentoFornecedor, 'id' | 'created_at'>) => {
      const { data: doc, error } = await supabase
        .from('documentos_fornecedor')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return doc;
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
      // Delete from storage
      const path = data.arquivo_url.split('/').pop();
      if (path) {
        await supabase.storage.from('fornecedores').remove([path]);
      }
      
      // Delete from database
      const { error } = await supabase
        .from('documentos_fornecedor')
        .delete()
        .eq('id', data.id);
      if (error) throw error;
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
      const { data, error } = await supabase
        .from('historico_precos_fornecedor')
        .select('*')
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as HistoricoPrecoFornecedor[];
    },
    enabled: !!itemId,
  });
}
