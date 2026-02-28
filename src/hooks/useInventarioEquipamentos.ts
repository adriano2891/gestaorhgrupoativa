import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;

export interface Equipamento {
  id: string;
  numero_equipamento: string;
  nome_equipamento: string;
  modelo_marca: string | null;
  cor: string | null;
  localizacao: 'central' | 'home_office' | 'cliente';
  detalhe_localizacao: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type EquipamentoInput = Omit<Equipamento, 'id' | 'created_at' | 'updated_at'>;

const getAuthToken = (): string | null => {
  try {
    const raw = localStorage.getItem(`sb-${PROJECT_ID}-auth-token`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.access_token || null;
  } catch {
    return null;
  }
};

const getHeaders = () => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "apikey": SUPABASE_KEY,
    "Content-Type": "application/json",
    "Prefer": "return=representation",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
};

export const useInventarioEquipamentos = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: equipamentos = [], isLoading, error } = useQuery({
    queryKey: ["inventario-equipamentos"],
    queryFn: async () => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/inventario_equipamentos?select=*&order=created_at.desc`,
        { headers: getHeaders() }
      );
      if (!res.ok) throw new Error(await res.text());
      return (await res.json()) as Equipamento[];
    },
  });

  const createEquipamento = useMutation({
    mutationFn: async (input: EquipamentoInput) => {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/inventario_equipamentos`,
        {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify(input),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
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
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/inventario_equipamentos?id=eq.${id}`,
        {
          method: "PATCH",
          headers: getHeaders(),
          body: JSON.stringify(input),
        }
      );
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      return Array.isArray(data) ? data[0] : data;
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
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/inventario_equipamentos?id=eq.${id}`,
        {
          method: "DELETE",
          headers: getHeaders(),
        }
      );
      if (!res.ok) throw new Error(await res.text());
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
