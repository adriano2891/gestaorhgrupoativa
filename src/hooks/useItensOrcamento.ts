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
      const { data, error } = await supabase
        .from('itens_orcamento')
        .select('*')
        .order('nome');
      
      if (error) throw error;
      return data as ItemOrcamento[];
    }
  });

  const createItem = useMutation({
    mutationFn: async (item: ItemOrcamentoInput) => {
      const { data, error } = await supabase
        .from('itens_orcamento')
        .insert(item)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens_orcamento'] });
      toast.success('Item criado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao criar item: ' + error.message);
    }
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...item }: ItemOrcamentoInput & { id: string }) => {
      const { data, error } = await supabase
        .from('itens_orcamento')
        .update(item)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itens_orcamento'] });
      toast.success('Item atualizado com sucesso!');
    },
    onError: (error) => {
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
