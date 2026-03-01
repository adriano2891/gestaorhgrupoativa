export type FormFieldType = 'text' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'date' | 'file' | 'number' | 'email' | 'phone' | 'likert' | 'nps' | 'signature' | 'section' | 'paragraph';
export type FormStatus = 'rascunho' | 'pendente_aprovacao' | 'aprovado' | 'publicado' | 'arquivado';
export type FormCategory = 'admissao' | 'desligamento' | 'avaliacao_desempenho' | 'feedback' | 'solicitacao' | 'treinamento' | 'documentos' | 'outro';

export interface FormularioRH {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria: FormCategory;
  status: FormStatus;
  is_template: boolean;
  template_origem_id: string | null;
  criado_por: string | null;
  aprovado_por: string | null;
  data_aprovacao: string | null;
  departamento_destino: string | null;
  requer_assinatura: boolean;
  arquivo_externo_url: string | null;
  arquivo_externo_nome: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { nome: string } | null;
}

export interface FormularioCampo {
  id: string;
  formulario_id: string;
  label: string;
  tipo: FormFieldType;
  obrigatorio: boolean;
  ordem: number;
  opcoes: string[] | null;
  placeholder: string | null;
  valor_padrao: string | null;
  largura: number;
  created_at: string;
  updated_at: string;
}

export const LARGURA_OPTIONS = [
  { value: 100, label: '100%' },
  { value: 50, label: '50%' },
  { value: 33, label: '33%' },
  { value: 25, label: '25%' },
] as const;

export interface FormularioAtribuicao {
  id: string;
  formulario_id: string;
  user_id: string;
  status: string;
  data_limite: string | null;
  assinado: boolean;
  data_assinatura: string | null;
  ip_assinatura: string | null;
  notificado: boolean;
  created_at: string;
  updated_at: string;
  profiles?: { nome: string; email: string } | null;
  formularios_rh?: { titulo: string } | null;
}

export interface FormularioResposta {
  id: string;
  atribuicao_id: string;
  campo_id: string;
  valor: string | null;
  arquivo_url: string | null;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABELS: Record<FormCategory, string> = {
  admissao: 'Admissão',
  desligamento: 'Desligamento',
  avaliacao_desempenho: 'Avaliação de Desempenho',
  feedback: 'Feedback',
  solicitacao: 'Solicitação',
  treinamento: 'Treinamento',
  documentos: 'Documentos',
  outro: 'Outro'
};

export const STATUS_LABELS: Record<FormStatus, string> = {
  rascunho: 'Rascunho',
  pendente_aprovacao: 'Pendente Aprovação',
  aprovado: 'Aprovado',
  publicado: 'Publicado',
  arquivado: 'Arquivado'
};

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  text: 'Texto Curto',
  textarea: 'Texto Longo',
  select: 'Lista de Seleção',
  checkbox: 'Múltipla Escolha',
  radio: 'Escolha Única',
  date: 'Data',
  file: 'Upload de Arquivo',
  number: 'Número',
  email: 'E-mail',
  phone: 'Telefone',
  likert: 'Escala Likert',
  nps: 'NPS (0-10)',
  signature: 'Assinatura Digital',
  section: 'Seção/Título',
  paragraph: 'Parágrafo Informativo',
};
