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

export function useItensOrcamento() {
  const queryClient = useQueryClient();

  const { data: itens = [], isLoading, error } = useQuery({
    queryKey: ['itens_orcamento'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('itens_orcamento')
          .select('*')
          .order('nome');
        
        if (error) {
          console.error('Erro ao buscar itens:', error.message);
          return [] as ItemOrcamento[];
        }
        return (data ?? []) as ItemOrcamento[];
      } catch (err) {
        console.error('Erro inesperado ao buscar itens:', err);
        return [] as ItemOrcamento[];
      }
    },
    retry: 2,
    staleTime: 2 * 60 * 1000,
  });

  const createItem = useMutation({
    mutationFn: async (item: ItemOrcamentoInput) => {
      const { data, error } = await supabase
        .from('itens_orcamento')
        .insert(item)
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        throw new Error(error.message);
      }
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
      const { data, error } = await supabase
        .from('itens_orcamento')
        .update(item)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('Supabase update error:', error);
        throw new Error(error.message);
      }
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
      const { error } = await supabase
        .from('itens_orcamento')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens_orcamento'] });
      toast.success('Item excluído com sucesso!');
    },
    onError: (error) => {
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
