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
      const { data, error } = await supabase
        .from('clientes_orcamentos')
        .insert([cliente])
        .select()
        .single();

      if (error) throw error;
      return data as ClienteOrcamento;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes-orcamentos'] });
      toast.success('Cliente cadastrado com sucesso!');
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cadastrar cliente: ${error.message}`);
    },
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ClienteOrcamento> & { id: string }) => {
      const { data, error } = await supabase
        .from('clientes_orcamentos')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ClienteOrcamento;
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
      const { error } = await supabase
        .from('clientes_orcamentos')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;
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
