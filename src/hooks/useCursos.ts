import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { 
  Curso, 
  CategoriaCurso, 
  ModuloCurso, 
  Aula, 
  Matricula, 
  ProgressoAula,
  AvaliacaoCurso,
  Certificado,
  TrilhaAprendizado
} from "@/types/cursos";

// Categorias
export const useCategoriasCurso = () => {
  return useQuery({
    queryKey: ["categorias-curso"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categorias_curso")
        .select("*")
        .eq("ativo", true)
        .order("ordem", { ascending: true });

      if (error) throw error;
      return data as CategoriaCurso[];
    },
  });
};

// Cursos
export const useCursos = (status?: 'rascunho' | 'publicado' | 'arquivado') => {
  return useQuery({
    queryKey: ["cursos", status],
    queryFn: async () => {
      const query = supabase
        .from("cursos")
        .select(`
          *,
          categoria:categorias_curso(*)
        `)
        .order("created_at", { ascending: false });

      const { data, error } = status 
        ? await query.eq("status", status)
        : await query;
        
      if (error) throw error;
      return data as Curso[];
    },
  });
};

export const useCurso = (cursoId: string | undefined) => {
  return useQuery({
    queryKey: ["curso", cursoId],
    queryFn: async () => {
      if (!cursoId) return null;

      const { data, error } = await supabase
        .from("cursos")
        .select(`
          *,
          categoria:categorias_curso(*),
          modulos:modulos_curso(
            *,
            aulas(*)
          )
        `)
        .eq("id", cursoId)
        .single();

      if (error) throw error;
      
      // Ordenar módulos e aulas
      if (data.modulos) {
        data.modulos.sort((a: ModuloCurso, b: ModuloCurso) => a.ordem - b.ordem);
        data.modulos.forEach((modulo: ModuloCurso) => {
          if (modulo.aulas) {
            modulo.aulas.sort((a: Aula, b: Aula) => a.ordem - b.ordem);
          }
        });
      }

      return data as Curso;
    },
    enabled: !!cursoId,
  });
};

// Mutações de Curso
export const useCursoMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCurso = useMutation({
    mutationFn: async (curso: Omit<Partial<Curso>, 'id' | 'created_at' | 'updated_at' | 'categoria' | 'modulos'>) => {
      const { data: user } = await supabase.auth.getUser();
      const insertData = { 
        titulo: curso.titulo || '',
        descricao: curso.descricao,
        categoria_id: curso.categoria_id,
        nivel: curso.nivel,
        status: curso.status,
        carga_horaria: curso.carga_horaria,
        instrutor: curso.instrutor,
        obrigatorio: curso.obrigatorio,
        recorrente: curso.recorrente,
        meses_recorrencia: curso.meses_recorrencia,
        nota_minima: curso.nota_minima,
        departamentos_permitidos: curso.departamentos_permitidos,
        cargos_permitidos: curso.cargos_permitidos,
        criado_por: user.user?.id,
      };
      
      const { data, error } = await supabase
        .from("cursos")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast({ title: "Curso criado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar curso", description: error.message, variant: "destructive" });
    },
  });

  const updateCurso = useMutation({
    mutationFn: async ({ id, ...curso }: Partial<Curso> & { id: string }) => {
      const { data, error } = await supabase
        .from("cursos")
        .update(curso)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      queryClient.invalidateQueries({ queryKey: ["curso"] });
      toast({ title: "Curso atualizado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar curso", description: error.message, variant: "destructive" });
    },
  });

  const deleteCurso = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cursos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cursos"] });
      toast({ title: "Curso excluído com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir curso", description: error.message, variant: "destructive" });
    },
  });

  return { createCurso, updateCurso, deleteCurso };
};

// Módulos
export const useModuloMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createModulo = useMutation({
    mutationFn: async (modulo: { curso_id: string; titulo: string; descricao?: string; ordem?: number }) => {
      const { data, error } = await supabase
        .from("modulos_curso")
        .insert({
          curso_id: modulo.curso_id,
          titulo: modulo.titulo,
          descricao: modulo.descricao,
          ordem: modulo.ordem,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curso"] });
      toast({ title: "Módulo criado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar módulo", description: error.message, variant: "destructive" });
    },
  });

  const updateModulo = useMutation({
    mutationFn: async ({ id, ...modulo }: Partial<ModuloCurso> & { id: string }) => {
      const { data, error } = await supabase
        .from("modulos_curso")
        .update(modulo)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curso"] });
    },
  });

  const deleteModulo = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("modulos_curso").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curso"] });
      toast({ title: "Módulo excluído!" });
    },
  });

  return { createModulo, updateModulo, deleteModulo };
};

// Aulas
export const useAulaMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createAula = useMutation({
    mutationFn: async (aula: { modulo_id: string; titulo: string; descricao?: string; duracao?: number; ordem?: number; video_url?: string }) => {
      const { data, error } = await supabase
        .from("aulas")
        .insert({
          modulo_id: aula.modulo_id,
          titulo: aula.titulo,
          descricao: aula.descricao,
          duracao: aula.duracao,
          ordem: aula.ordem,
          video_url: aula.video_url,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curso"] });
      toast({ title: "Aula criada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar aula", description: error.message, variant: "destructive" });
    },
  });

  const updateAula = useMutation({
    mutationFn: async ({ id, ...aula }: Partial<Aula> & { id: string }) => {
      const { data, error } = await supabase
        .from("aulas")
        .update(aula)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curso"] });
    },
  });

  const deleteAula = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("aulas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["curso"] });
      toast({ title: "Aula excluída!" });
    },
  });

  return { createAula, updateAula, deleteAula };
};

// Matrículas
export const useMatriculas = (cursoId?: string) => {
  return useQuery({
    queryKey: ["matriculas", cursoId],
    queryFn: async () => {
      let query = supabase
        .from("matriculas")
        .select(`
          *,
          curso:cursos(*),
          profile:profiles(id, nome, email, departamento, cargo)
        `)
        .order("created_at", { ascending: false });

      if (cursoId) {
        query = query.eq("curso_id", cursoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Matricula[];
    },
  });
};

export const useMinhasMatriculas = () => {
  return useQuery({
    queryKey: ["minhas-matriculas"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("matriculas")
        .select(`
          *,
          curso:cursos(
            *,
            categoria:categorias_curso(*)
          )
        `)
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Matricula[];
    },
  });
};

export const useMatriculaMutations = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const matricular = useMutation({
    mutationFn: async (cursoId: string) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("matriculas")
        .insert({ curso_id: cursoId, user_id: user.user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
      queryClient.invalidateQueries({ queryKey: ["minhas-matriculas"] });
      toast({ title: "Matrícula realizada com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao matricular", description: error.message, variant: "destructive" });
    },
  });

  return { matricular };
};

// Progresso
export const useProgressoAulas = (cursoId?: string) => {
  return useQuery({
    queryKey: ["progresso-aulas", cursoId],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];

      // Buscar aulas do curso
      const { data: modulos } = await supabase
        .from("modulos_curso")
        .select("id")
        .eq("curso_id", cursoId);

      if (!modulos || modulos.length === 0) return [];

      const moduloIds = modulos.map(m => m.id);

      const { data: aulas } = await supabase
        .from("aulas")
        .select("id")
        .in("modulo_id", moduloIds);

      if (!aulas || aulas.length === 0) return [];

      const aulaIds = aulas.map(a => a.id);

      const { data, error } = await supabase
        .from("progresso_aulas")
        .select("*")
        .eq("user_id", user.user.id)
        .in("aula_id", aulaIds);

      if (error) throw error;
      return data as ProgressoAula[];
    },
    enabled: !!cursoId,
  });
};

export const useProgressoMutations = () => {
  const queryClient = useQueryClient();

  const updateProgresso = useMutation({
    mutationFn: async (progresso: Partial<ProgressoAula> & { aula_id: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("progresso_aulas")
        .upsert({
          ...progresso,
          user_id: user.user.id,
        }, { onConflict: 'aula_id,user_id' })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progresso-aulas"] });
      queryClient.invalidateQueries({ queryKey: ["minhas-matriculas"] });
    },
  });

  return { updateProgresso };
};

// Certificados
export const useMeusCertificados = () => {
  return useQuery({
    queryKey: ["meus-certificados"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("certificados")
        .select(`
          *,
          curso:cursos(*)
        `)
        .eq("user_id", user.user.id)
        .order("data_emissao", { ascending: false });

      if (error) throw error;
      return data as Certificado[];
    },
  });
};

// Trilhas
export const useTrilhas = () => {
  return useQuery({
    queryKey: ["trilhas-aprendizado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trilhas_aprendizado")
        .select("*")
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TrilhaAprendizado[];
    },
  });
};

// Estatísticas Admin
export const useCursosStats = () => {
  return useQuery({
    queryKey: ["cursos-stats"],
    queryFn: async () => {
      const [
        { count: totalCursos },
        { count: cursosPublicados },
        { count: totalMatriculas },
        { count: matriculasConcluidas },
      ] = await Promise.all([
        supabase.from("cursos").select("*", { count: "exact", head: true }),
        supabase.from("cursos").select("*", { count: "exact", head: true }).eq("status", "publicado"),
        supabase.from("matriculas").select("*", { count: "exact", head: true }),
        supabase.from("matriculas").select("*", { count: "exact", head: true }).eq("status", "concluido"),
      ]);

      return {
        totalCursos: totalCursos || 0,
        cursosPublicados: cursosPublicados || 0,
        totalMatriculas: totalMatriculas || 0,
        matriculasConcluidas: matriculasConcluidas || 0,
        taxaConclusao: totalMatriculas ? Math.round((matriculasConcluidas || 0) / totalMatriculas * 100) : 0,
      };
    },
  });
};
