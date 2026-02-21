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
    staleTime: 1000 * 30, // 30 seconds - ensures portal sees recently published courses
    refetchOnWindowFocus: true,
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
          profile:profiles!inner(id, nome, email, departamento, cargo, status)
        `)
        .not("profile.status", "in", '("demitido","pediu_demissao")')
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

// Atualizar progresso na matrícula
export const useAtualizarProgressoMatricula = () => {
  const queryClient = useQueryClient();

  const atualizarMatricula = useMutation({
    mutationFn: async ({ cursoId, progresso, status }: { cursoId: string; progresso: number; status?: string }) => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error("Usuário não autenticado");

      const updateData: Record<string, unknown> = { progresso };
      
      if (status) {
        updateData.status = status;
        if (status === 'concluido') {
          updateData.data_conclusao = new Date().toISOString();
        }
      }

      const { data, error } = await supabase
        .from("matriculas")
        .update(updateData)
        .eq("curso_id", cursoId)
        .eq("user_id", user.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["minhas-matriculas"] });
      queryClient.invalidateQueries({ queryKey: ["matriculas"] });
    },
  });

  return { atualizarMatricula };
};

// Progresso detalhado por funcionário (para admin)
export const useProgressoFuncionario = (cursoId: string, userId: string) => {
  return useQuery({
    queryKey: ["progresso-funcionario", cursoId, userId],
    queryFn: async () => {
      // Buscar aulas do curso
      const { data: modulos } = await supabase
        .from("modulos_curso")
        .select("id")
        .eq("curso_id", cursoId);

      if (!modulos || modulos.length === 0) return [];

      const moduloIds = modulos.map(m => m.id);

      const { data: aulas } = await supabase
        .from("aulas")
        .select("id, titulo, ordem, modulo_id")
        .in("modulo_id", moduloIds)
        .order("ordem");

      if (!aulas || aulas.length === 0) return [];

      const aulaIds = aulas.map(a => a.id);

      const { data: progresso, error } = await supabase
        .from("progresso_aulas")
        .select("*")
        .eq("user_id", userId)
        .in("aula_id", aulaIds);

      if (error) throw error;

      // Combinar aulas com progresso
      return aulas.map(aula => {
        const prog = progresso?.find(p => p.aula_id === aula.id);
        return {
          ...aula,
          concluida: prog?.concluida || false,
          tempo_assistido: prog?.tempo_assistido || 0,
          data_conclusao: prog?.data_conclusao,
        };
      });
    },
    enabled: !!cursoId && !!userId,
  });
};

// Certificados
export const useMeusCertificados = () => {
  return useQuery({
    queryKey: ["meus-certificados"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Fallback: tentar getUser
        const { data: user } = await supabase.auth.getUser();
        if (!user.user) return [] as Certificado[];
        
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
      }

      const { data, error } = await supabase
        .from("certificados")
        .select(`
          *,
          curso:cursos(*)
        `)
        .eq("user_id", session.user.id)
        .order("data_emissao", { ascending: false });

      if (error) throw error;
      return data as Certificado[];
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
    retry: 3,
    retryDelay: 1000,
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

// Estatísticas Admin - Considera apenas conclusões totais (100%)
export const useCursosStats = () => {
  return useQuery({
    queryKey: ["cursos-stats"],
    queryFn: async () => {
      const [
        { count: totalCursos },
        { count: cursosPublicados },
        { data: todasMatriculas },
      ] = await Promise.all([
        supabase.from("cursos").select("*", { count: "exact", head: true }),
        supabase.from("cursos").select("*", { count: "exact", head: true }).eq("status", "publicado"),
        supabase.from("matriculas").select("id, progresso, status"),
      ]);

      const totalMatriculas = todasMatriculas?.length || 0;
      
      // Apenas matrículas com 100% de progresso são consideradas concluídas
      const matriculasConcluidas = todasMatriculas?.filter(
        m => Number(m.progresso) === 100 && m.status === "concluido"
      ).length || 0;

      return {
        totalCursos: totalCursos || 0,
        cursosPublicados: cursosPublicados || 0,
        totalMatriculas,
        matriculasConcluidas,
        taxaConclusao: totalMatriculas ? Math.round(matriculasConcluidas / totalMatriculas * 100) : 0,
      };
    },
  });
};

// Hook para métricas detalhadas (usado na aba Relatórios)
export const useMetricasDetalhadas = (cursoId?: string) => {
  return useQuery({
    queryKey: ["metricas-detalhadas", cursoId],
    queryFn: async () => {
      let query = supabase
        .from("matriculas")
        .select(`
          id, progresso, status, data_inicio, data_conclusao, user_id,
          curso:cursos(id, titulo),
          profile:profiles(id, nome, email, departamento, cargo)
        `);

      if (cursoId && cursoId !== "all") {
        query = query.eq("curso_id", cursoId);
      }

      const { data: matriculas, error } = await query;
      if (error) throw error;

      const total = matriculas?.length || 0;
      
      // Só conta como concluído se progresso = 100%
      const concluidos = matriculas?.filter(
        m => Number(m.progresso) === 100 && m.status === "concluido"
      ) || [];
      
      const emAndamento = matriculas?.filter(
        m => m.status === "em_andamento" || (m.status !== "concluido" && Number(m.progresso) > 0)
      ) || [];
      
      const naoIniciados = matriculas?.filter(
        m => Number(m.progresso) === 0 && m.status !== "concluido"
      ) || [];

      const progressoMedio = total > 0
        ? Math.round(matriculas!.reduce((acc, m) => acc + Number(m.progresso || 0), 0) / total)
        : 0;

      const taxaConclusao = total > 0 ? Math.round((concluidos.length / total) * 100) : 0;

      // Agrupar por departamento
      const porDepartamento: Record<string, {
        total: number;
        concluidos: number;
        emAndamento: number;
        progressoTotal: number;
        funcionarios: Array<{
          id: string;
          nome: string;
          email: string;
          progresso: number;
          status: string;
          concluido: boolean;
        }>;
      }> = {};

      matriculas?.forEach(m => {
        const dept = m.profile?.departamento || "Sem departamento";
        if (!porDepartamento[dept]) {
          porDepartamento[dept] = { 
            total: 0, 
            concluidos: 0, 
            emAndamento: 0,
            progressoTotal: 0,
            funcionarios: []
          };
        }
        
        porDepartamento[dept].total++;
        porDepartamento[dept].progressoTotal += Number(m.progresso || 0);
        
        const isConcluido = Number(m.progresso) === 100 && m.status === "concluido";
        if (isConcluido) {
          porDepartamento[dept].concluidos++;
        } else if (Number(m.progresso) > 0) {
          porDepartamento[dept].emAndamento++;
        }
        
        porDepartamento[dept].funcionarios.push({
          id: m.profile?.id || m.user_id,
          nome: m.profile?.nome || "Desconhecido",
          email: m.profile?.email || "",
          progresso: Number(m.progresso || 0),
          status: m.status || "nao_iniciado",
          concluido: isConcluido,
        });
      });

      const departamentos = Object.entries(porDepartamento)
        .map(([nome, dados]) => ({
          nome,
          total: dados.total,
          concluidos: dados.concluidos,
          emAndamento: dados.emAndamento,
          progressoMedio: dados.total > 0 ? Math.round(dados.progressoTotal / dados.total) : 0,
          taxaConclusao: dados.total > 0 ? Math.round((dados.concluidos / dados.total) * 100) : 0,
          funcionarios: dados.funcionarios,
        }))
        .sort((a, b) => b.taxaConclusao - a.taxaConclusao);

      return {
        resumo: {
          total,
          concluidos: concluidos.length,
          emAndamento: emAndamento.length,
          naoIniciados: naoIniciados.length,
          taxaConclusao,
          progressoMedio,
        },
        matriculas: matriculas || [],
        funcionariosConcluidos: concluidos.map(m => ({
          id: m.profile?.id || m.user_id,
          nome: m.profile?.nome || "Desconhecido",
          email: m.profile?.email || "",
          departamento: m.profile?.departamento || "Sem departamento",
          cargo: m.profile?.cargo || "",
          curso: m.curso?.titulo || "",
          dataConclusao: m.data_conclusao,
        })),
        funcionariosMatriculados: matriculas?.map(m => ({
          id: m.profile?.id || m.user_id,
          nome: m.profile?.nome || "Desconhecido",
          email: m.profile?.email || "",
          departamento: m.profile?.departamento || "Sem departamento",
          cargo: m.profile?.cargo || "",
          curso: m.curso?.titulo || "",
          progresso: Number(m.progresso || 0),
          status: m.status,
          concluido: Number(m.progresso) === 100 && m.status === "concluido",
        })) || [],
        departamentos,
      };
    },
  });
};
