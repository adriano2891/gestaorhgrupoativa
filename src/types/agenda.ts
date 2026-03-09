export type CategoriaEvento = 'reuniao' | 'tarefa' | 'lembrete' | 'pessoal' | 'feriado' | 'treinamento';

export type RecorrenciaTipo = 'nenhuma' | 'diaria' | 'semanal' | 'mensal' | 'anual';

export interface EventoAgenda {
  id: string;
  titulo: string;
  descricao?: string;
  dataInicio: string; // ISO string
  dataFim: string;    // ISO string
  diaInteiro: boolean;
  categoria: CategoriaEvento;
  cor: string;
  recorrencia: RecorrenciaTipo;
  lembrete?: number; // minutes before
  local?: string;
  concluido: boolean;
  criadoEm: string;
}

export const CORES_CATEGORIA: Record<CategoriaEvento, string> = {
  reuniao: 'hsl(221, 83%, 53%)',
  tarefa: 'hsl(142, 71%, 45%)',
  lembrete: 'hsl(38, 92%, 50%)',
  pessoal: 'hsl(280, 67%, 55%)',
  feriado: 'hsl(0, 84%, 60%)',
  treinamento: 'hsl(199, 89%, 48%)',
};

export const LABELS_CATEGORIA: Record<CategoriaEvento, string> = {
  reuniao: 'Reunião',
  tarefa: 'Tarefa',
  lembrete: 'Lembrete',
  pessoal: 'Pessoal',
  feriado: 'Feriado',
  treinamento: 'Treinamento',
};
