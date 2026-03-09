/**
 * Validações CLT para o módulo de Férias
 * 
 * Referências legais:
 * - Art. 130: Dias de férias conforme faltas injustificadas
 * - Art. 134 §1º: Fracionamento em até 3 períodos (1 >= 14 dias, demais >= 5 dias)
 * - Art. 134 §3º: Férias não podem iniciar nos 2 dias que antecedem feriado ou DSR
 * - Art. 137: Férias vencidas devem ser pagas em dobro
 * - Art. 143: Abono pecuniário limitado a 1/3 dos dias de direito
 * - Art. 145: Pagamento até 2 dias antes do início
 */

import { differenceInDays, addDays, getDay, parseISO, format } from "date-fns";

// ========== Art. 130 – Redução de dias por faltas injustificadas ==========
export const calcularDiasDireitoPorFaltas = (faltasInjustificadas: number): number => {
  if (faltasInjustificadas <= 5) return 30;
  if (faltasInjustificadas <= 14) return 24;
  if (faltasInjustificadas <= 23) return 18;
  if (faltasInjustificadas <= 32) return 12;
  return 0; // Mais de 32 faltas: perde o direito (Art. 130)
};

// ========== Art. 134 §1º – Validação de fracionamento ==========
export interface ValidacaoFracionamento {
  valido: boolean;
  mensagem?: string;
}

export const validarFracionamento = (
  diasSolicitados: number,
  solicitacoesExistentes: { dias_solicitados: number; status: string }[],
  diasDireito: number
): ValidacaoFracionamento => {
  const ativas = solicitacoesExistentes.filter(
    (s) => ["pendente", "aprovado", "em_andamento"].includes(s.status)
  );

  const numeroParcelas = ativas.length + 1;

  if (numeroParcelas > 3) {
    return {
      valido: false,
      mensagem: "Limite de fracionamento excedido. CLT Art. 134 §1º permite no máximo 3 períodos.",
    };
  }

  const todosDias = [...ativas.map((s) => s.dias_solicitados), diasSolicitados].sort((a, b) => b - a);
  
  if (todosDias.length >= 1 && todosDias[0] < 14) {
    return {
      valido: false,
      mensagem: "Um dos períodos deve ter no mínimo 14 dias corridos (CLT Art. 134 §1º).",
    };
  }

  for (let i = 1; i < todosDias.length; i++) {
    if (todosDias[i] < 5) {
      return {
        valido: false,
        mensagem: "Os demais períodos devem ter no mínimo 5 dias corridos cada (CLT Art. 134 §1º).",
      };
    }
  }

  return { valido: true };
};

// ========== Art. 134 §3º – Restrição de início de férias ==========
// Feriados nacionais brasileiros fixos (fallback)
const FERIADOS_FIXOS = [
  "01-01", "04-21", "05-01", "09-07", "10-12", "11-02", "11-15", "12-25",
];

const isFeriadoNacionalFixo = (date: Date): boolean => {
  const mmdd = format(date, "MM-dd");
  return FERIADOS_FIXOS.includes(mmdd);
};

const isDSR = (date: Date): boolean => {
  return getDay(date) === 0;
};

export interface FeriadoDinamico {
  data: string;
  recorrente: boolean;
}

/**
 * Verifica se uma data é feriado usando lista dinâmica (se fornecida) ou fallback estático
 */
const isFeriado = (date: Date, feriadosDinamicos?: FeriadoDinamico[]): boolean => {
  if (feriadosDinamicos && feriadosDinamicos.length > 0) {
    const dateStr = date.toISOString().split('T')[0];
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    return feriadosDinamicos.some(f => {
      if (f.recorrente) {
        const fDate = new Date(f.data + 'T12:00:00');
        const fmm = String(fDate.getMonth() + 1).padStart(2, '0');
        const fdd = String(fDate.getDate()).padStart(2, '0');
        return fmm === mm && fdd === dd;
      }
      return f.data === dateStr;
    });
  }
  return isFeriadoNacionalFixo(date);
};

export const validarDataInicio = (
  dataInicio: Date,
  feriadosDinamicos?: FeriadoDinamico[]
): { valido: boolean; mensagem?: string } => {
  const dia1Depois = addDays(dataInicio, 1);
  const dia2Depois = addDays(dataInicio, 2);

  if (isDSR(dia1Depois) || isFeriado(dia1Depois, feriadosDinamicos)) {
    return {
      valido: false,
      mensagem: `Férias não podem iniciar em ${format(dataInicio, "dd/MM/yyyy")} pois antecede descanso/feriado (CLT Art. 134 §3º).`,
    };
  }

  if (isDSR(dia2Depois) || isFeriado(dia2Depois, feriadosDinamicos)) {
    return {
      valido: false,
      mensagem: `Férias não podem iniciar em ${format(dataInicio, "dd/MM/yyyy")} pois está a 2 dias de descanso/feriado (CLT Art. 134 §3º).`,
    };
  }

  return { valido: true };
};

// ========== Art. 137 – Validação de período concessivo ==========
export const validarPeriodoConcessivo = (
  dataFimAquisitivo: string
): { valido: boolean; mensagem?: string; vencida: boolean } => {
  const fimAquisitivo = parseISO(dataFimAquisitivo);
  const fimConcessivo = addDays(fimAquisitivo, 365);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  if (hoje > fimConcessivo) {
    return {
      valido: false,
      vencida: true,
      mensagem: `Férias VENCIDAS! Período concessivo expirou em ${format(fimConcessivo, "dd/MM/yyyy")}. Pagamento em dobro obrigatório (Art. 137 CLT).`,
    };
  }

  const diasRestantes = differenceInDays(fimConcessivo, hoje);
  if (diasRestantes <= 30) {
    return {
      valido: true,
      vencida: false,
      mensagem: `Atenção: Faltam ${diasRestantes} dias para vencer o período concessivo (${format(fimConcessivo, "dd/MM/yyyy")}).`,
    };
  }

  return { valido: true, vencida: false };
};

// ========== Art. 143 – Abono Pecuniário ==========
export const validarAbonoPecuniario = (
  diasSolicitados: number,
  diasDireito: number
): { valido: boolean; mensagem?: string } => {
  const limiteAbono = Math.floor(diasDireito / 3);
  if (diasSolicitados > limiteAbono) {
    return {
      valido: false,
      mensagem: `Abono pecuniário limitado a 1/3 dos dias de direito (${limiteAbono} dias). CLT Art. 143.`,
    };
  }
  return { valido: true };
};

// ========== Art. 145 – Prazo de Pagamento ==========
export const calcularDataLimitePagamento = (dataInicio: string): string => {
  const inicio = parseISO(dataInicio);
  const limite = addDays(inicio, -2);
  return format(limite, "yyyy-MM-dd");
};

export const verificarPrazoPagamento = (
  dataInicio: string
): { dentroDosPrazos: boolean; dataLimite: string; diasRestantes: number } => {
  const dataLimite = calcularDataLimitePagamento(dataInicio);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const limite = parseISO(dataLimite);
  const diasRestantes = differenceInDays(limite, hoje);

  return {
    dentroDosPrazos: diasRestantes >= 0,
    dataLimite,
    diasRestantes,
  };
};

// ========== Cálculos Financeiros (Art. 7º, XXVII CF + Art. 129 CLT) ==========
export const calcularValorFerias = (
  salarioBruto: number,
  diasFerias: number,
  diasDireito: number = 30
): {
  valorFerias: number;
  adicionalTerco: number;
  totalBruto: number;
} => {
  const valorDiario = salarioBruto / 30;
  const valorFerias = valorDiario * diasFerias;
  const adicionalTerco = valorFerias / 3;
  const totalBruto = valorFerias + adicionalTerco;

  return {
    valorFerias: Math.round(valorFerias * 100) / 100,
    adicionalTerco: Math.round(adicionalTerco * 100) / 100,
    totalBruto: Math.round(totalBruto * 100) / 100,
  };
};

// ========== Art. 139-141 – Validação de Férias Coletivas ==========
export const validarFeriasColetivas = (
  dataInicio: Date
): { valido: boolean; avisos: string[] } => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diasAntecedencia = differenceInDays(dataInicio, hoje);
  const avisos: string[] = [];

  if (diasAntecedencia < 15) {
    avisos.push(
      `Férias coletivas devem ser comunicadas ao sindicato e MTb com 15 dias de antecedência (Art. 139 CLT). Dias disponíveis: ${diasAntecedencia}.`
    );
  }

  avisos.push(
    "Lembre-se: É obrigatória a comunicação ao sindicato da categoria e ao Ministério do Trabalho (Art. 139 §2º e §3º CLT)."
  );

  return { valido: diasAntecedencia >= 15, avisos };
};
