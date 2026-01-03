// Tipos do módulo de Cursos/LMS

export type CursoStatus = 'rascunho' | 'publicado' | 'arquivado';
export type CursoNivel = 'basico' | 'intermediario' | 'avancado';

export interface CategoriaCurso {
  id: string;
  nome: string;
  descricao?: string;
  icone: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface Curso {
  id: string;
  titulo: string;
  descricao?: string;
  categoria_id?: string;
  nivel: CursoNivel;
  status: CursoStatus;
  capa_url?: string;
  carga_horaria: number; // em minutos
  instrutor?: string;
  obrigatorio: boolean;
  recorrente: boolean;
  meses_recorrencia?: number;
  nota_minima: number;
  departamentos_permitidos?: string[];
  cargos_permitidos?: string[];
  criado_por?: string;
  created_at: string;
  updated_at: string;
  // Relações
  categoria?: CategoriaCurso;
  modulos?: ModuloCurso[];
  matriculas_count?: number;
  avaliacoes_count?: number;
}

export interface ModuloCurso {
  id: string;
  curso_id: string;
  titulo: string;
  descricao?: string;
  ordem: number;
  created_at: string;
  updated_at: string;
  // Relações
  aulas?: Aula[];
}

export interface Aula {
  id: string;
  modulo_id: string;
  titulo: string;
  descricao?: string;
  video_url?: string;
  duracao: number; // em segundos
  ordem: number;
  tempo_minimo?: number; // tempo mínimo para marcar como assistida
  material_apoio_url?: string;
  created_at: string;
  updated_at: string;
  // Relações
  progresso?: ProgressoAula;
}

export interface Matricula {
  id: string;
  curso_id: string;
  user_id: string;
  status: 'em_andamento' | 'concluido' | 'cancelado';
  progresso: number; // 0-100
  data_inicio: string;
  data_conclusao?: string;
  nota_final?: number;
  created_at: string;
  updated_at: string;
  // Relações
  curso?: Curso;
  profile?: {
    id: string;
    nome: string;
    email: string;
    departamento?: string;
    cargo?: string;
  };
}

export interface ProgressoAula {
  id: string;
  aula_id: string;
  user_id: string;
  tempo_assistido: number; // em segundos
  posicao_video: number; // posição atual do vídeo
  concluida: boolean;
  data_conclusao?: string;
  created_at: string;
  updated_at: string;
}

export interface AvaliacaoCurso {
  id: string;
  curso_id?: string;
  aula_id?: string;
  titulo: string;
  descricao?: string;
  tipo: 'quiz' | 'prova';
  tempo_limite?: number; // em minutos
  tentativas_permitidas: number;
  ordem: number;
  created_at: string;
  updated_at: string;
  // Relações
  perguntas?: PerguntaAvaliacao[];
}

export interface PerguntaAvaliacao {
  id: string;
  avaliacao_id: string;
  pergunta: string;
  tipo: 'multipla_escolha' | 'verdadeiro_falso' | 'dissertativa';
  opcoes?: { texto: string; correta?: boolean }[];
  resposta_correta?: string;
  pontuacao: number;
  ordem: number;
  created_at: string;
}

export interface TentativaAvaliacao {
  id: string;
  avaliacao_id: string;
  user_id: string;
  respostas?: Record<string, string>;
  nota?: number;
  aprovado?: boolean;
  tempo_gasto?: number; // em segundos
  data_inicio: string;
  data_conclusao?: string;
  created_at: string;
}

export interface Certificado {
  id: string;
  matricula_id: string;
  user_id: string;
  curso_id: string;
  codigo_validacao: string;
  data_emissao: string;
  url_certificado?: string;
  created_at: string;
  // Relações
  curso?: Curso;
  profile?: {
    nome: string;
    email: string;
  };
}

export interface FeedbackCurso {
  id: string;
  curso_id: string;
  user_id: string;
  nota: number; // 1-5
  comentario?: string;
  created_at: string;
  // Relações
  profile?: {
    nome: string;
  };
}

export interface TrilhaAprendizado {
  id: string;
  nome: string;
  descricao?: string;
  icone: string;
  cor: string;
  cursos_ids: string[];
  ativo: boolean;
  created_at: string;
  updated_at: string;
  // Relações
  cursos?: Curso[];
}

export const NIVEL_LABELS: Record<CursoNivel, string> = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado'
};

export const NIVEL_COLORS: Record<CursoNivel, string> = {
  basico: 'bg-green-100 text-green-700',
  intermediario: 'bg-yellow-100 text-yellow-700',
  avancado: 'bg-red-100 text-red-700'
};

export const STATUS_LABELS: Record<CursoStatus, string> = {
  rascunho: 'Rascunho',
  publicado: 'Publicado',
  arquivado: 'Arquivado'
};

export const STATUS_COLORS: Record<CursoStatus, string> = {
  rascunho: 'bg-gray-100 text-gray-700',
  publicado: 'bg-green-100 text-green-700',
  arquivado: 'bg-orange-100 text-orange-700'
};
