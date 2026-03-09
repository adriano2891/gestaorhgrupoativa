/**
 * Cálculos trabalhistas centralizados (CLT)
 * 
 * Módulo unificado para cálculos de:
 * - Horas extras com percentuais legais
 * - DSR sobre horas extras
 * - Adicional noturno
 * - Verbas rescisórias
 * - Proporcionalidades (13º, férias)
 */

import { differenceInDays, differenceInMonths } from "date-fns";

// ========== Constantes Legais ==========
export const PERCENTUAL_HE_DIA_UTIL = 50;        // Art. 59 CLT
export const PERCENTUAL_HE_DSR_FERIADO = 100;     // Art. 70 CLT
export const PERCENTUAL_ADICIONAL_NOTURNO = 20;    // Art. 73 CLT
export const HORA_NOTURNA_MINUTOS = 52.5;          // Art. 73 §1º CLT (52min30s)
export const JORNADA_DIARIA_PADRAO = 8;             // Art. 58 CLT
export const JORNADA_SEMANAL_PADRAO = 44;           // Art. 58 CLT
export const TOLERANCIA_DIARIA_MINUTOS = 10;        // Art. 58 §1º CLT
export const TOLERANCIA_MARCACAO_MINUTOS = 5;       // Art. 58 §1º CLT
export const INTERVALO_INTRAJORNADA_MIN = 60;       // Art. 71 CLT (jornada > 6h)
export const INTERVALO_INTRAJORNADA_CURTA = 15;     // Art. 71 §1º CLT (jornada 4-6h)
export const INTERVALO_INTERJORNADA = 11;           // Art. 66 CLT (horas)
export const LIMITE_HE_DIARIA = 2;                  // Art. 59 CLT
export const PRAZO_BANCO_HORAS_INDIVIDUAL = 6;      // Art. 59 §5º CLT (meses)
export const PRAZO_BANCO_HORAS_COLETIVO = 12;       // Art. 59 §2º CLT (meses)
export const AVISO_PREVIO_BASE = 30;                // Art. 487 CLT
export const AVISO_PREVIO_ADICIONAL_ANO = 3;        // Lei 12.506/2011
export const AVISO_PREVIO_MAXIMO = 90;              // Lei 12.506/2011

// ========== Cálculos de Jornada ==========

/**
 * Calcula horas extras considerando a tolerância legal de 10 minutos
 * Art. 58 §1º CLT: não serão descontadas nem computadas como jornada 
 * extraordinária as variações de horário no registro de ponto não 
 * excedentes de cinco minutos, observado o limite máximo de dez minutos diários.
 */
export const calcularHorasExtras = (
  horasTrabalhadas: number,
  jornadaPadrao: number = JORNADA_DIARIA_PADRAO
): number => {
  const excesso = horasTrabalhadas - jornadaPadrao;
  if (excesso <= 0) return 0;

  const toleranciaHoras = TOLERANCIA_DIARIA_MINUTOS / 60;
  if (excesso <= toleranciaHoras) return 0; // Dentro da tolerância

  return excesso; // Excedeu tolerância: TODA a diferença é HE
};

/**
 * Calcula o valor monetário das horas extras
 */
export const calcularValorHorasExtras = (
  horasExtras: number,
  valorHoraNormal: number,
  percentual: number = PERCENTUAL_HE_DIA_UTIL
): number => {
  return horasExtras * valorHoraNormal * (1 + percentual / 100);
};

/**
 * Calcula DSR sobre horas extras
 * Súmula 172 TST: A remuneração do repouso semanal remunerado, 
 * habitual, integra o cálculo das horas extras.
 */
export const calcularDSRsobreHE = (
  valorHEsemana: number,
  diasUteisTrabalhadosSemana: number
): number => {
  if (diasUteisTrabalhadosSemana <= 0) return 0;
  return valorHEsemana / diasUteisTrabalhadosSemana;
};

// ========== Cálculos de Aviso Prévio (Lei 12.506/2011) ==========
export const calcularAvisoPrevio = (
  anosTrabalhados: number
): { dias: number; proporcional: number } => {
  const proporcional = Math.min(anosTrabalhados * AVISO_PREVIO_ADICIONAL_ANO, AVISO_PREVIO_MAXIMO - AVISO_PREVIO_BASE);
  const dias = Math.min(AVISO_PREVIO_BASE + proporcional, AVISO_PREVIO_MAXIMO);
  return { dias, proporcional };
};

// ========== Cálculo de 13º Proporcional ==========

/**
 * Regra dos 15 dias: se trabalhou >= 15 dias no mês, conta o mês inteiro
 * Art. 1º Lei 4.090/62
 */
export const calcular13Proporcional = (
  salarioBase: number,
  dataAdmissao: Date,
  dataDemissao: Date,
  mediaHEmensal: number = 0 // Súmula 45 TST: média de HE habituais integra o 13º
): number => {
  const anoAtual = dataDemissao.getFullYear();
  const inicioAno = new Date(anoAtual, 0, 1);
  const dataRef = dataAdmissao > inicioAno ? dataAdmissao : inicioAno;

  let meses = 0;
  for (let m = dataRef.getMonth(); m <= dataDemissao.getMonth(); m++) {
    const fimMes = new Date(anoAtual, m + 1, 0);
    const diaInicio = m === dataRef.getMonth() ? dataRef.getDate() : 1;
    const diaFim = m === dataDemissao.getMonth() ? dataDemissao.getDate() : fimMes.getDate();
    const diasTrabalhados = diaFim - diaInicio + 1;
    if (diasTrabalhados >= 15) meses++;
  }

  // Súmula 45 TST: a média de HE habituais integra o cálculo do 13º
  const baseCalculo = salarioBase + mediaHEmensal;
  return (baseCalculo / 12) * meses;
};

/**
 * Calcula a média mensal de horas extras habituais para integração no 13º
 * Súmula 45 TST
 */
export const calcularMediaHEmensal = (
  valoresHEmensais: number[] // valores de HE dos últimos meses
): number => {
  if (valoresHEmensais.length === 0) return 0;
  const soma = valoresHEmensais.reduce((acc, v) => acc + v, 0);
  return Math.round((soma / valoresHEmensais.length) * 100) / 100;
};

// ========== Cálculos de Sobreaviso (CLT Art. 244 §2º / Súmula 428 TST) ==========

/**
 * Sobreaviso: 1/3 da hora normal
 * CLT Art. 244 §2º: Considera-se de "sobreaviso" o empregado efetivo que
 * permanecer em sua própria casa, aguardando a qualquer momento o chamado
 * para o serviço. Cada escala de sobreaviso será de, no máximo, 24h.
 * Remuneração: 1/3 do salário-hora normal.
 */
export const calcularSobreaviso = (
  horasSobreaviso: number,
  valorHoraNormal: number
): number => {
  return Math.round((horasSobreaviso * valorHoraNormal / 3) * 100) / 100;
};

// ========== Prorrogação do Adicional Noturno (Súmula 60 II TST) ==========

/**
 * Súmula 60 II TST: "Cumprida integralmente a jornada no período noturno
 * e prorrogada esta, devido é também o adicional quanto às horas prorrogadas."
 * Se o trabalhador começa a jornada no período noturno (22h-5h) e continua
 * trabalhando após as 5h, o adicional noturno deve ser mantido.
 */
export const calcularProrrogacaoNoturno = (
  entrada: Date,
  saida: Date
): { horasNoturnas: number; horasProrrogadas: number; totalComAdicional: number } => {
  const entradaHour = entrada.getHours();
  const saidaHour = saida.getHours();

  // Verifica se a jornada começou no período noturno (22h-5h)
  const iniciouNoturno = entradaHour >= 22 || entradaHour < 5;

  if (!iniciouNoturno) {
    return { horasNoturnas: 0, horasProrrogadas: 0, totalComAdicional: 0 };
  }

  // Período noturno padrão: 22h às 5h = 7 horas
  // Horas prorrogadas: após 5h, quando a jornada iniciou no noturno
  let horasNoturnas = 0;
  let horasProrrogadas = 0;

  // Calcular horas entre 22h e 5h
  const diffMs = saida.getTime() - entrada.getTime();
  const totalHoras = diffMs / (1000 * 60 * 60);

  if (saidaHour >= 5 && saidaHour < 22) {
    // Saiu após o período noturno — há prorrogação
    const fimNoturno = new Date(saida);
    fimNoturno.setHours(5, 0, 0, 0);
    if (fimNoturno <= entrada) {
      fimNoturno.setDate(fimNoturno.getDate() + 1);
    }
    horasNoturnas = Math.max(0, (fimNoturno.getTime() - entrada.getTime()) / (1000 * 60 * 60));
    horasProrrogadas = Math.max(0, totalHoras - horasNoturnas);
  } else {
    horasNoturnas = totalHoras;
  }

  const totalComAdicional = horasNoturnas + horasProrrogadas; // Ambas com adicional

  return {
    horasNoturnas: Math.round(horasNoturnas * 100) / 100,
    horasProrrogadas: Math.round(horasProrrogadas * 100) / 100,
    totalComAdicional: Math.round(totalComAdicional * 100) / 100,
  };
};

// ========== Cálculos de Férias ==========

/**
 * Calcula dias de direito por faltas injustificadas (Art. 130 CLT)
 */
export const calcularDiasFeriasPorFaltas = (faltasInjustificadas: number): number => {
  if (faltasInjustificadas <= 5) return 30;
  if (faltasInjustificadas <= 14) return 24;
  if (faltasInjustificadas <= 23) return 18;
  if (faltasInjustificadas <= 32) return 12;
  return 0;
};

/**
 * Calcula valor das férias com 1/3 constitucional
 */
export const calcularValorFerias = (
  salarioBase: number,
  diasFerias: number,
  emDobro: boolean = false
): {
  valorFerias: number;
  tercoConstitucional: number;
  total: number;
} => {
  const multiplicador = emDobro ? 2 : 1;
  const valorDiario = salarioBase / 30;
  const valorFerias = valorDiario * diasFerias * multiplicador;
  const tercoConstitucional = valorFerias / 3;
  const total = valorFerias + tercoConstitucional;

  return {
    valorFerias: Math.round(valorFerias * 100) / 100,
    tercoConstitucional: Math.round(tercoConstitucional * 100) / 100,
    total: Math.round(total * 100) / 100,
  };
};

// ========== Cálculos de Rescisão Completos ==========
export interface CalculoRescisao {
  saldoSalario: number;
  avisoPrevioDias: number;
  avisoPrevioValor: number;
  feriasPropValor: number;
  tercoFeriasProp: number;
  feriasVencidasValor: number;
  tercoFeriasVencidas: number;
  decimoTerceiro: number;
  multaFgts: number;
  totalBruto: number;
  projecaoAviso: boolean;
}

export const calcularRescisaoCompleta = (params: {
  salarioBase: number;
  dataAdmissao: string;
  dataDemissao: string;
  tipoRescisao: 'sem_justa_causa' | 'com_justa_causa' | 'pedido_demissao' | 'acordo_mutuo';
  avisoTrabalhado: boolean;
  feriasVencidas: number;
}): CalculoRescisao => {
  const { salarioBase, dataAdmissao, dataDemissao, tipoRescisao, avisoTrabalhado, feriasVencidas } = params;

  const admissao = new Date(dataAdmissao);
  const demissao = new Date(dataDemissao);
  const mesesTrabalhados = Math.max(1, Math.round(differenceInDays(demissao, admissao) / 30));
  const anosTrabalhados = Math.floor(mesesTrabalhados / 12);
  const salarioDiario = salarioBase / 30;

  // Saldo de salário
  const diasUltimoMes = demissao.getDate();
  const saldoSalario = salarioDiario * diasUltimoMes;

  // Aviso prévio
  const { dias: avisoPrevioDias } = calcularAvisoPrevio(anosTrabalhados);
  let avisoPrevioValor = 0;
  const projecaoAviso = !avisoTrabalhado && (tipoRescisao === 'sem_justa_causa' || tipoRescisao === 'acordo_mutuo');

  if (tipoRescisao === 'sem_justa_causa' && !avisoTrabalhado) {
    avisoPrevioValor = salarioDiario * avisoPrevioDias;
  } else if (tipoRescisao === 'acordo_mutuo' && !avisoTrabalhado) {
    avisoPrevioValor = (salarioDiario * avisoPrevioDias) * 0.5;
  }

  // Projeção do aviso para cálculos (Súmula 371 TST)
  let mesesProjetados = mesesTrabalhados;
  if (projecaoAviso) mesesProjetados += Math.floor(avisoPrevioDias / 30);

  // Férias proporcionais
  const mesesDesdeUltimaFerias = mesesProjetados % 12;
  let feriasPropValor = 0;
  let tercoFeriasProp = 0;
  if (tipoRescisao !== 'com_justa_causa') {
    feriasPropValor = (salarioBase / 12) * mesesDesdeUltimaFerias;
    tercoFeriasProp = feriasPropValor / 3;
  }

  // Férias vencidas em dobro (Art. 137 CLT)
  let feriasVencidasValor = 0;
  let tercoFeriasVencidas = 0;
  if (feriasVencidas > 0) {
    feriasVencidasValor = salarioBase * feriasVencidas * 2;
    tercoFeriasVencidas = feriasVencidasValor / 3;
  }

  // 13º proporcional (regra 15 dias)
  let decimoTerceiro = 0;
  if (tipoRescisao !== 'com_justa_causa') {
    decimoTerceiro = calcular13Proporcional(salarioBase, admissao, demissao);
  }

  // Multa FGTS
  let multaFgts = 0;
  const fgtsTotal = salarioBase * 0.08 * mesesTrabalhados;
  if (tipoRescisao === 'sem_justa_causa') multaFgts = fgtsTotal * 0.4;
  else if (tipoRescisao === 'acordo_mutuo') multaFgts = fgtsTotal * 0.2;

  const totalBruto = saldoSalario + avisoPrevioValor + feriasPropValor + tercoFeriasProp +
    feriasVencidasValor + tercoFeriasVencidas + decimoTerceiro + multaFgts;

  return {
    saldoSalario: Math.round(saldoSalario * 100) / 100,
    avisoPrevioDias,
    avisoPrevioValor: Math.round(avisoPrevioValor * 100) / 100,
    feriasPropValor: Math.round(feriasPropValor * 100) / 100,
    tercoFeriasProp: Math.round(tercoFeriasProp * 100) / 100,
    feriasVencidasValor: Math.round(feriasVencidasValor * 100) / 100,
    tercoFeriasVencidas: Math.round(tercoFeriasVencidas * 100) / 100,
    decimoTerceiro: Math.round(decimoTerceiro * 100) / 100,
    multaFgts: Math.round(multaFgts * 100) / 100,
    totalBruto: Math.round(totalBruto * 100) / 100,
    projecaoAviso,
  };
};
