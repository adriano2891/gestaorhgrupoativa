import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AvaliacaoCurso {
  id: string;
  curso_id: string | null;
  aula_id: string | null;
  titulo: string;
  descricao: string | null;
  tipo: string | null;
  tempo_limite: number | null;
  tentativas_permitidas: number | null;
  ordem: number | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TentativaAvaliacao {
  id: string;
  avaliacao_id: string;
  user_id: string;
  respostas: Record<string, unknown> | null;
  nota: number | null;
  aprovado: boolean | null;
  tempo_gasto: number | null;
  data_inicio: string;
  data_conclusao: string | null;
  created_at: string;
}

// Buscar todas as avaliações (para seleção no admin)
export const useTodasAvaliacoes = () => {
  return useQuery({
    queryKey: ["todas-avaliacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes_curso")
        .select("*")
        .order("titulo", { ascending: true });

      if (error) throw error;
      return data as AvaliacaoCurso[];
    },
  });
};

// Buscar avaliações de um curso específico
export const useAvaliacoesCurso = (cursoId?: string) => {
  return useQuery({
    queryKey: ["avaliacoes-curso", cursoId],
    queryFn: async () => {
      if (!cursoId) return [];

      const { data, error } = await supabase
        .from("avaliacoes_curso")
        .select("*")
        .eq("curso_id", cursoId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as AvaliacaoCurso[];
    },
    enabled: !!cursoId,
  });
};

// Buscar avaliações sem curso vinculado (disponíveis para vincular)
export const useAvaliacoesDisponiveis = () => {
  return useQuery({
    queryKey: ["avaliacoes-disponiveis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avaliacoes_curso")
        .select("*")
        .is("curso_id", null)
        .order("titulo", { ascending: true });

      if (error) throw error;
      return data as AvaliacaoCurso[];
    },
  });
};

// Buscar tentativas de avaliação do usuário
export const useTentativasUsuario = (cursoId?: string) => {
  return useQuery({
    queryKey: ["tentativas-usuario", cursoId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || !cursoId) return [];

      // Buscar avaliações do curso
      const { data: avaliacoes } = await supabase
        .from("avaliacoes_curso")
        .select("id")
        .eq("curso_id", cursoId);

      if (!avaliacoes || avaliacoes.length === 0) return [];

      const avaliacaoIds = avaliacoes.map(a => a.id);

      const { data, error } = await supabase
        .from("tentativas_avaliacao")
        .select("*")
        .eq("user_id", user.user.id)
        .in("avaliacao_id", avaliacaoIds);

      if (error) throw error;
      return data as TentativaAvaliacao[];
    },
    enabled: !!cursoId,
  });
};

// Mutações de avaliações
export const useAvaliacaoMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createAvaliacao = useMutation({
    mutationFn: async (avaliacao: Partial<AvaliacaoCurso>) => {
      const { data, error } = await supabase
        .from("avaliacoes_curso")
        .insert({
          titulo: avaliacao.titulo || '',
          descricao: avaliacao.descricao,
          tipo: avaliacao.tipo || 'quiz',
          tempo_limite: avaliacao.tempo_limite,
          tentativas_permitidas: avaliacao.tentativas_permitidas || 3,
          ordem: avaliacao.ordem || 1,
          curso_id: avaliacao.curso_id,
          aula_id: avaliacao.aula_id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes-curso"] });
      queryClient.invalidateQueries({ queryKey: ["todas-avaliacoes"] });
      queryClient.invalidateQueries({ queryKey: ["avaliacoes-disponiveis"] });
      toast({ title: "Avaliação criada com sucesso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar avaliação", description: error.message, variant: "destructive" });
    },
  });

  const vincularAvaliacao = useMutation({
    mutationFn: async ({ avaliacaoId, cursoId }: { avaliacaoId: string; cursoId: string }) => {
      const { data, error } = await supabase
        .from("avaliacoes_curso")
        .update({ curso_id: cursoId })
        .eq("id", avaliacaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes-curso"] });
      queryClient.invalidateQueries({ queryKey: ["todas-avaliacoes"] });
      queryClient.invalidateQueries({ queryKey: ["avaliacoes-disponiveis"] });
      toast({ title: "Avaliação vinculada ao curso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao vincular avaliação", description: error.message, variant: "destructive" });
    },
  });

  const desvincularAvaliacao = useMutation({
    mutationFn: async (avaliacaoId: string) => {
      const { data, error } = await supabase
        .from("avaliacoes_curso")
        .update({ curso_id: null })
        .eq("id", avaliacaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes-curso"] });
      queryClient.invalidateQueries({ queryKey: ["todas-avaliacoes"] });
      queryClient.invalidateQueries({ queryKey: ["avaliacoes-disponiveis"] });
      toast({ title: "Avaliação removida do curso!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao desvincular avaliação", description: error.message, variant: "destructive" });
    },
  });

  const deleteAvaliacao = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("avaliacoes_curso")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["avaliacoes-curso"] });
      queryClient.invalidateQueries({ queryKey: ["todas-avaliacoes"] });
      queryClient.invalidateQueries({ queryKey: ["avaliacoes-disponiveis"] });
      toast({ title: "Avaliação excluída!" });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir avaliação", description: error.message, variant: "destructive" });
    },
  });

  return { createAvaliacao, vincularAvaliacao, desvincularAvaliacao, deleteAvaliacao };
};

// Verificar se usuário concluiu todas as avaliações do curso
export const useVerificarConclusaoAvaliacoes = (cursoId?: string) => {
  return useQuery({
    queryKey: ["verificar-conclusao-avaliacoes", cursoId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user || !cursoId) {
        return { temAvaliacoes: false, todasAprovadas: true, avaliacoesRestantes: 0 };
      }

      // Buscar avaliações do curso
      const { data: avaliacoes } = await supabase
        .from("avaliacoes_curso")
        .select("id")
        .eq("curso_id", cursoId);

      // Se não tem avaliações, retorna como "todas aprovadas"
      if (!avaliacoes || avaliacoes.length === 0) {
        return { temAvaliacoes: false, todasAprovadas: true, avaliacoesRestantes: 0 };
      }

      const avaliacaoIds = avaliacoes.map(a => a.id);

      // Buscar tentativas aprovadas do usuário
      const { data: tentativas } = await supabase
        .from("tentativas_avaliacao")
        .select("avaliacao_id, aprovado")
        .eq("user_id", user.user.id)
        .in("avaliacao_id", avaliacaoIds)
        .eq("aprovado", true);

      const avaliacoesAprovadas = new Set(tentativas?.map(t => t.avaliacao_id) || []);
      const avaliacoesRestantes = avaliacaoIds.filter(id => !avaliacoesAprovadas.has(id)).length;

      return {
        temAvaliacoes: true,
        todasAprovadas: avaliacoesRestantes === 0,
        avaliacoesRestantes,
        totalAvaliacoes: avaliacaoIds.length,
        avaliacoesAprovadas: avaliacoesAprovadas.size,
      };
    },
    enabled: !!cursoId,
  });
};
