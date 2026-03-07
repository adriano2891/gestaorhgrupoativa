/**
 * Validações CLT para o módulo de Férias
 * 
 * Referências legais:
 * - Art. 130: Dias de férias conforme faltas injustificadas
 * - Art. 134 §1º: Fracionamento em até 3 períodos (1 >= 14 dias, demais >= 5 dias)
 * - Art. 134 §3º: Férias não podem iniciar nos 2 dias que antecedem feriado ou DSR
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
  // Filtrar apenas solicitações ativas (pendente, aprovado, em_andamento)
  const ativas = solicitacoesExistentes.filter(
    (s) => ["pendente", "aprovado", "em_andamento"].includes(s.status)
  );

  const numeroParcelas = ativas.length + 1; // +1 para a nova solicitação

  if (numeroParcelas > 3) {
    return {
      valido: false,
      mensagem: "Limite de fracionamento excedido. CLT Art. 134 §1º permite no máximo 3 períodos.",
    };
  }

  // Verificar regra dos mínimos
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
// Feriados nacionais brasileiros fixos (simplificado)
const FERIADOS_FIXOS = [
  "01-01", // Confraternização Universal
  "04-21", // Tiradentes
  "05-01", // Dia do Trabalho
  "09-07", // Independência
  "10-12", // Nossa Senhora Aparecida
  "11-02", // Finados
  "11-15", // Proclamação da República
  "12-25", // Natal
];

const isFeriadoNacional = (date: Date): boolean => {
  const mmdd = format(date, "MM-dd");
  return FERIADOS_FIXOS.includes(mmdd);
};

const isDSR = (date: Date): boolean => {
  return getDay(date) === 0; // Domingo
};

export const validarDataInicio = (dataInicio: Date): { valido: boolean; mensagem?: string } => {
  // Verificar se os 2 dias seguintes à data de início incluem feriado ou DSR
  // Na verdade, a regra é: férias NÃO podem INICIAR nos 2 dias que ANTECEDEM feriado ou DSR
  const dia1Depois = addDays(dataInicio, 1);
  const dia2Depois = addDays(dataInicio, 2);

  if (isDSR(dia1Depois) || isFeriadoNacional(dia1Depois)) {
    return {
      valido: false,
      mensagem: `Férias não podem iniciar em ${format(dataInicio, "dd/MM/yyyy")} pois antecede descanso/feriado (CLT Art. 134 §3º).`,
    };
  }

  if (isDSR(dia2Depois) || isFeriadoNacional(dia2Depois)) {
    return {
      valido: false,
      mensagem: `Férias não podem iniciar em ${format(dataInicio, "dd/MM/yyyy")} pois está a 2 dias de descanso/feriado (CLT Art. 134 §3º).`,
    };
  }

  return { valido: true };
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
