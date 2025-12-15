export type CondoStatus = 'ativo' | 'suspenso' | 'finalizado';

export interface CondoDocument {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
}

export interface Condominio {
  id: string;
  nome: string;
  endereco: string;
  numUnidades?: string;
  sindico: string;
  telefone: string;
  email: string;
  servicos: string[];
  statusContrato: CondoStatus;
  dataInicio: string;
  observacoes: string;
  valorContrato: string;
  updatedAt: string;
  documents?: CondoDocument[];
}

export const SERVICOS_DISPONIVEIS = [
  'Limpeza',
  'Manutenção',
  'Jardinagem',
  'Portaria',
  'Zeladoria',
  'Administrativo'
] as const;

export const STATUS_LABELS: Record<CondoStatus, string> = {
  ativo: 'Ativo',
  suspenso: 'Suspenso',
  finalizado: 'Finalizado'
};

export const STATUS_COLORS: Record<CondoStatus, { bg: string; text: string }> = {
  ativo: { bg: 'bg-green-100', text: 'text-green-700' },
  suspenso: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  finalizado: { bg: 'bg-red-100', text: 'text-red-700' }
};
