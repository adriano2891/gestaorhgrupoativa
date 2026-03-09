/**
 * Cálculos de INSS e IRRF — Tabelas Progressivas 2024/2025
 * 
 * INSS: Alíquotas progressivas (EC 103/2019)
 * IRRF: Tabela progressiva mensal (IN RFB)
 */

// ========== INSS — Alíquotas Progressivas (2024) ==========
const FAIXAS_INSS = [
  { limite: 1412.00, aliquota: 7.5 },
  { limite: 2666.68, aliquota: 9.0 },
  { limite: 4000.03, aliquota: 12.0 },
  { limite: 7786.02, aliquota: 14.0 },
];

export const TETO_INSS = 7786.02;

/**
 * Calcula INSS progressivo (EC 103/2019)
 * Cada faixa aplica alíquota apenas sobre o valor que cai nela
 */
export const calcularINSS = (salarioBruto: number): { valor: number; aliquotaEfetiva: number; faixas: { faixa: string; base: number; aliquota: number; valor: number }[] } => {
  let desconto = 0;
  let baseRestante = Math.min(salarioBruto, TETO_INSS);
  let limiteAnterior = 0;
  const faixasDetalhadas: { faixa: string; base: number; aliquota: number; valor: number }[] = [];

  for (const faixa of FAIXAS_INSS) {
    if (baseRestante <= 0) break;
    const baseCalculo = Math.min(baseRestante, faixa.limite - limiteAnterior);
    const valorFaixa = baseCalculo * (faixa.aliquota / 100);
    desconto += valorFaixa;
    faixasDetalhadas.push({
      faixa: `Até R$ ${faixa.limite.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
      base: Math.round(baseCalculo * 100) / 100,
      aliquota: faixa.aliquota,
      valor: Math.round(valorFaixa * 100) / 100,
    });
    baseRestante -= baseCalculo;
    limiteAnterior = faixa.limite;
  }

  return {
    valor: Math.round(desconto * 100) / 100,
    aliquotaEfetiva: salarioBruto > 0 ? Math.round((desconto / salarioBruto) * 10000) / 100 : 0,
    faixas: faixasDetalhadas,
  };
};

// ========== IRRF — Tabela Progressiva Mensal (2024) ==========
const FAIXAS_IRRF = [
  { limite: 2259.20, aliquota: 0, deducao: 0 },
  { limite: 2826.65, aliquota: 7.5, deducao: 169.44 },
  { limite: 3751.05, aliquota: 15.0, deducao: 381.44 },
  { limite: 4664.68, aliquota: 22.5, deducao: 662.77 },
  { limite: Infinity, aliquota: 27.5, deducao: 896.00 },
];

export const DEDUCAO_DEPENDENTE_IRRF = 189.59;

/**
 * Calcula IRRF mensal
 * Base = Salário Bruto - INSS - Dependentes (R$ 189,59/cada)
 */
export const calcularIRRF = (
  salarioBruto: number,
  descontoINSS: number,
  numDependentes: number = 0,
  outrasDeducoes: number = 0
): { valor: number; aliquota: number; baseCalculo: number; faixa: string } => {
  const deducaoDependentes = numDependentes * DEDUCAO_DEPENDENTE_IRRF;
  const baseCalculo = salarioBruto - descontoINSS - deducaoDependentes - outrasDeducoes;

  if (baseCalculo <= 0) {
    return { valor: 0, aliquota: 0, baseCalculo: 0, faixa: "Isento" };
  }

  for (const faixa of FAIXAS_IRRF) {
    if (baseCalculo <= faixa.limite) {
      const imposto = Math.max(0, (baseCalculo * faixa.aliquota / 100) - faixa.deducao);
      return {
        valor: Math.round(imposto * 100) / 100,
        aliquota: faixa.aliquota,
        baseCalculo: Math.round(baseCalculo * 100) / 100,
        faixa: faixa.aliquota === 0 ? "Isento" : `${faixa.aliquota}%`,
      };
    }
  }

  return { valor: 0, aliquota: 0, baseCalculo: 0, faixa: "Isento" };
};

// ========== Cálculo de Adicionais ==========

/**
 * Adicional de Insalubridade (CLT Art. 192)
 * Grau mínimo: 10%, médio: 20%, máximo: 40% sobre salário mínimo
 */
export const SALARIO_MINIMO_2024 = 1412.00;

export const calcularInsalubridade = (
  grau: "minimo" | "medio" | "maximo",
  baseSalarioMinimo: number = SALARIO_MINIMO_2024
): { percentual: number; valor: number } => {
  const percentuais = { minimo: 10, medio: 20, maximo: 40 };
  const percentual = percentuais[grau];
  return {
    percentual,
    valor: Math.round((baseSalarioMinimo * percentual / 100) * 100) / 100,
  };
};

/**
 * Adicional de Periculosidade (CLT Art. 193)
 * 30% sobre salário base
 */
export const calcularPericulosidade = (salarioBase: number): { percentual: number; valor: number } => {
  return {
    percentual: 30,
    valor: Math.round((salarioBase * 0.30) * 100) / 100,
  };
};

// ========== Simulação completa da folha ==========
export interface SimulacaoFolha {
  salarioBruto: number;
  insalubridade: number;
  periculosidade: number;
  horasExtras: number;
  totalBruto: number;
  inss: number;
  irrf: number;
  outrosDescontos: number;
  totalDescontos: number;
  salarioLiquido: number;
}

export const simularFolha = (params: {
  salarioBase: number;
  insalubridadeGrau?: "minimo" | "medio" | "maximo" | null;
  temPericulosidade?: boolean;
  horasExtrasValor?: number;
  numDependentes?: number;
  outrosDescontos?: number;
}): SimulacaoFolha => {
  const { salarioBase, insalubridadeGrau, temPericulosidade, horasExtrasValor = 0, numDependentes = 0, outrosDescontos = 0 } = params;

  // Adicionais (não cumuláveis — CLT Art. 193 §2º)
  let insalubridade = 0;
  let periculosidade = 0;
  if (insalubridadeGrau) {
    insalubridade = calcularInsalubridade(insalubridadeGrau).valor;
  } else if (temPericulosidade) {
    periculosidade = calcularPericulosidade(salarioBase).valor;
  }

  const totalBruto = salarioBase + insalubridade + periculosidade + horasExtrasValor;
  const inssResult = calcularINSS(totalBruto);
  const irrfResult = calcularIRRF(totalBruto, inssResult.valor, numDependentes);

  const totalDescontos = inssResult.valor + irrfResult.valor + outrosDescontos;

  return {
    salarioBruto: salarioBase,
    insalubridade,
    periculosidade,
    horasExtras: horasExtrasValor,
    totalBruto: Math.round(totalBruto * 100) / 100,
    inss: inssResult.valor,
    irrf: irrfResult.valor,
    outrosDescontos,
    totalDescontos: Math.round(totalDescontos * 100) / 100,
    salarioLiquido: Math.round((totalBruto - totalDescontos) * 100) / 100,
  };
};
