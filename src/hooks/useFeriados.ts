import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restGet, restPost, restPatch, restDelete } from "@/lib/restClient";
import { toast } from "@/hooks/use-toast";

export interface Feriado {
  id: string;
  nome: string;
  data: string;
  tipo: string;
  estado?: string;
  cidade?: string;
  recorrente: boolean;
  ativo: boolean;
  created_at: string;
}

export const useFeriados = () => {
  return useQuery({
    queryKey: ["feriados"],
    queryFn: async () => {
      const data = await restGet('feriados?select=*&ativo=eq.true&order=data.asc');
      return (data || []) as Feriado[];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useCriarFeriado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (feriado: { nome: string; data: string; tipo: string; estado?: string; cidade?: string; recorrente: boolean }) => {
      return restPost('feriados', { ...feriado, ativo: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feriados"] });
      toast({ title: "Feriado cadastrado" });
    },
    onError: (e) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });
};

export const useRemoverFeriado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return restPatch(`feriados?id=eq.${id}`, { ativo: false });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feriados"] });
      toast({ title: "Feriado removido" });
    },
  });
};

/**
 * Check if a date is a holiday using the dynamic feriados table
 */
export const isFeriadoDinamico = (date: Date, feriados: Feriado[]): boolean => {
  const dateStr = date.toISOString().split('T')[0];
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');

  return feriados.some(f => {
    if (f.recorrente) {
      const fDate = new Date(f.data + 'T12:00:00');
      const fmm = String(fDate.getMonth() + 1).padStart(2, '0');
      const fdd = String(fDate.getDate()).padStart(2, '0');
      return fmm === mm && fdd === dd;
    }
    return f.data === dateStr;
  });
};
