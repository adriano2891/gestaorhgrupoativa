// HRFlow Pro Types

export type HRFlowFieldType = 
  | 'text' 
  | 'textarea' 
  | 'select' 
  | 'checkbox' 
  | 'radio'
  | 'date' 
  | 'file' 
  | 'number' 
  | 'email' 
  | 'phone'
  | 'likert'
  | 'nps'
  | 'signature'
  | 'section'
  | 'paragraph';

export type FormCategory = 
  | 'onboarding'
  | 'desempenho'
  | 'clima'
  | 'recrutamento'
  | 'desligamento'
  | 'treinamento'
  | 'feedback'
  | 'compliance'
  | 'beneficios'
  | 'outros';

export type FormStatus = 'rascunho' | 'ativo' | 'arquivado';

export interface FormField {
  id: string;
  type: HRFlowFieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  helpText?: string;
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  likertScale?: number;
  likertLabels?: { min: string; max: string };
  width?: number; // 25, 33, 50, or 100
}

export const WIDTH_OPTIONS = [
  { value: 100, label: '100%' },
  { value: 50, label: '50%' },
  { value: 33, label: '33%' },
  { value: 25, label: '25%' },
] as const;

export interface FormTemplate {
  id: string;
  title: string;
  description: string;
  category: FormCategory;
  fields: FormField[];
  icon: string;
  estimatedTime?: string;
  popular?: boolean;
}

export interface HRFlowForm {
  id: string;
  title: string;
  description: string;
  category: FormCategory;
  status: FormStatus;
  fields: FormField[];
  branding?: {
    logo?: string;
    primaryColor: string;
    showLgpdBadge: boolean;
  };
  createdAt: string;
  updatedAt: string;
  responsesCount?: number;
}

export interface FormResponse {
  id: string;
  formId: string;
  responses: Record<string, any>;
  submittedAt: string;
  completionTime?: number;
}

export interface AnalyticsData {
  totalForms: number;
  totalResponses: number;
  avgCompletionRate: number;
  avgCompletionTime: number;
  responsesByDay: { date: string; count: number }[];
  responsesByCategory: { category: string; count: number }[];
}

export const CATEGORY_LABELS: Record<FormCategory, string> = {
  onboarding: 'Onboarding',
  desempenho: 'Desempenho',
  clima: 'Clima Organizacional',
  recrutamento: 'Recrutamento',
  desligamento: 'Desligamento',
  treinamento: 'Treinamento',
  feedback: 'Feedback',
  compliance: 'Compliance',
  beneficios: 'Benefícios',
  outros: 'Outros'
};

export const CATEGORY_COLORS: Record<FormCategory, string> = {
  onboarding: 'bg-emerald-100 text-emerald-700',
  desempenho: 'bg-blue-100 text-blue-700',
  clima: 'bg-purple-100 text-purple-700',
  recrutamento: 'bg-amber-100 text-amber-700',
  desligamento: 'bg-red-100 text-red-700',
  treinamento: 'bg-cyan-100 text-cyan-700',
  feedback: 'bg-pink-100 text-pink-700',
  compliance: 'bg-slate-100 text-slate-700',
  beneficios: 'bg-green-100 text-green-700',
  outros: 'bg-gray-100 text-gray-700'
};

export const FIELD_TYPE_LABELS: Record<HRFlowFieldType, string> = {
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
  paragraph: 'Parágrafo Informativo'
};
