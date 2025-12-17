import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Equipamento {
  id: string;
  numero_equipamento: string;
  nome_equipamento: string;
  modelo_marca: string | null;
  cor: string | null;
  localizacao: 'central' | 'home_office';
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type EquipamentoInput = Omit<Equipamento, 'id' | 'created_at' | 'updated_at'>;

export const useInventarioEquipamentos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: equipamentos = [], isLoading, error } = useQuery({
    queryKey: ["inventario-equipamentos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventario_equipamentos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Equipamento[];
    },
  });

  const createEquipamento = useMutation({
    mutationFn: async (input: EquipamentoInput) => {
      const { data, error } = await supabase
        .from("inventario_equipamentos")
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario-equipamentos"] });
      toast({ title: "Equipamento cadastrado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao cadastrar equipamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateEquipamento = useMutation({
    mutationFn: async ({ id, ...input }: Partial<Equipamento> & { id: string }) => {
      const { data, error } = await supabase
        .from("inventario_equipamentos")
        .update(input)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario-equipamentos"] });
      toast({ title: "Equipamento atualizado com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar equipamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteEquipamento = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("inventario_equipamentos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventario-equipamentos"] });
      toast({ title: "Equipamento removido com sucesso!" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover equipamento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    equipamentos,
    isLoading,
    error,
    createEquipamento,
    updateEquipamento,
    deleteEquipamento,
  };
};
