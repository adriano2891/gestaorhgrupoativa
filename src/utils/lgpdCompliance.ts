/**
 * Utilitários de conformidade com a LGPD (Lei 13.709/2018)
 * 
 * Implementa controles de:
 * - Retenção de dados trabalhistas (5 anos CLT + 20 anos FGTS)
 * - Classificação de dados sensíveis
 * - Mascaramento de dados pessoais
 * - Políticas de acesso e auditoria
 */

// ========== Classificação de Dados ==========
export type ClassificacaoDado = 'publico' | 'interno' | 'confidencial' | 'sensivel';

export interface PoliticaRetencao {
  categoria: string;
  prazoAnos: number;
  fundamentoLegal: string;
  descricao: string;
}

// Prazos de retenção conforme legislação brasileira
export const POLITICAS_RETENCAO: PoliticaRetencao[] = [
  {
    categoria: 'registros_ponto',
    prazoAnos: 5,
    fundamentoLegal: 'Art. 11 CLT (prescrição trabalhista) + Portaria 671/2021',
    descricao: 'Registros de ponto eletrônico',
  },
  {
    categoria: 'holerites',
    prazoAnos: 5,
    fundamentoLegal: 'Art. 11 CLT + Art. 464 CLT',
    descricao: 'Comprovantes de pagamento de salário',
  },
  {
    categoria: 'contratos_trabalho',
    prazoAnos: 5,
    fundamentoLegal: 'Art. 11 CLT (após rescisão)',
    descricao: 'Contratos e alterações contratuais',
  },
  {
    categoria: 'fgts',
    prazoAnos: 30,
    fundamentoLegal: 'Art. 23 §5º Lei 8.036/90',
    descricao: 'Documentos relacionados ao FGTS',
  },
  {
    categoria: 'documentos_sst',
    prazoAnos: 20,
    fundamentoLegal: 'NR-7 (PCMSO) e NR-9 (PPRA/PGR)',
    descricao: 'Documentos de saúde e segurança do trabalho',
  },
  {
    categoria: 'comunicados',
    prazoAnos: 5,
    fundamentoLegal: 'Art. 11 CLT + boas práticas',
    descricao: 'Comunicados internos e confirmações de leitura',
  },
  {
    categoria: 'ferias',
    prazoAnos: 5,
    fundamentoLegal: 'Art. 11 CLT',
    descricao: 'Registros de férias e períodos aquisitivos',
  },
  {
    categoria: 'rescisoes',
    prazoAnos: 5,
    fundamentoLegal: 'Art. 11 CLT + Art. 477 CLT',
    descricao: 'Documentos rescisórios',
  },
  {
    categoria: 'afastamentos',
    prazoAnos: 20,
    fundamentoLegal: 'Lei 8.213/91 + previdenciário',
    descricao: 'Registros de afastamentos e licenças',
  },
  {
    categoria: 'banco_talentos',
    prazoAnos: 2,
    fundamentoLegal: 'LGPD Art. 15 (término do tratamento)',
    descricao: 'Currículos e dados de candidatos',
  },
];

// ========== Classificação de campos sensíveis ==========
export const CAMPOS_SENSIVEIS: Record<string, ClassificacaoDado> = {
  cpf: 'confidencial',
  rg: 'confidencial',
  pis: 'confidencial',
  salario: 'confidencial',
  conta_bancaria: 'confidencial',
  agencia: 'confidencial',
  cid: 'sensivel', // Dado de saúde - LGPD Art. 5º II
  endereco: 'interno',
  telefone: 'interno',
  email: 'interno',
  nome: 'publico',
  cargo: 'publico',
  departamento: 'publico',
  matricula: 'publico',
};

// ========== Mascaramento de Dados ==========
export const mascararCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return '***.***.***-**';
  return `${cleaned.substring(0, 3)}.***.**${cleaned.substring(9, 10)}-${cleaned.substring(10)}`;
};

export const mascararEmail = (email: string): string => {
  const [user, domain] = email.split('@');
  if (!domain) return '***@***';
  const maskedUser = user.length > 2 
    ? `${user[0]}${'*'.repeat(Math.min(user.length - 2, 5))}${user[user.length - 1]}`
    : '***';
  return `${maskedUser}@${domain}`;
};

export const mascararTelefone = (tel: string): string => {
  const cleaned = tel.replace(/\D/g, '');
  if (cleaned.length < 10) return '(**) ****-****';
  return `(${cleaned.substring(0, 2)}) ****-${cleaned.substring(cleaned.length - 4)}`;
};

export const mascararPIS = (pis: string): string => {
  const cleaned = pis.replace(/\D/g, '');
  if (cleaned.length !== 11) return '***.*****.**-*';
  return `${cleaned.substring(0, 3)}.*****.**-${cleaned.substring(10)}`;
};

// ========== Verificação de Retenção ==========
export const verificarRetencao = (
  categoria: string,
  dataCriacao: string
): {
  dentroDosPrazos: boolean;
  prazoExpiracao: string;
  diasRestantes: number;
  politica: PoliticaRetencao | undefined;
} => {
  const politica = POLITICAS_RETENCAO.find(p => p.categoria === categoria);
  if (!politica) {
    return { dentroDosPrazos: true, prazoExpiracao: '', diasRestantes: 9999, politica: undefined };
  }

  const dataCriacaoDate = new Date(dataCriacao);
  const prazoExpiracao = new Date(dataCriacaoDate);
  prazoExpiracao.setFullYear(prazoExpiracao.getFullYear() + politica.prazoAnos);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diasRestantes = Math.ceil((prazoExpiracao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  return {
    dentroDosPrazos: diasRestantes > 0,
    prazoExpiracao: prazoExpiracao.toISOString().split('T')[0],
    diasRestantes,
    politica,
  };
};

// ========== Relatório de Conformidade LGPD ==========
export interface RelatorioLGPD {
  dataGeracao: string;
  totalRegistros: number;
  registrosComConsentimento: number;
  registrosSemConsentimento: number;
  dadosSensiveis: string[];
  politicasRetencao: PoliticaRetencao[];
  recomendacoes: string[];
}

export const gerarRelatorioConformidade = (dados: {
  totalFuncionarios: number;
  totalCandidatos: number;
  candidatosComConsentimento: number;
  temLogAcesso: boolean;
  temCriptografia: boolean;
  temBackup: boolean;
}): RelatorioLGPD => {
  const recomendacoes: string[] = [];

  if (dados.candidatosComConsentimento < dados.totalCandidatos) {
    recomendacoes.push(
      `${dados.totalCandidatos - dados.candidatosComConsentimento} candidatos sem consentimento LGPD registrado`
    );
  }

  if (!dados.temLogAcesso) {
    recomendacoes.push('Implementar log de acesso a dados pessoais (Art. 37 LGPD)');
  }

  if (!dados.temCriptografia) {
    recomendacoes.push('Implementar criptografia para dados sensíveis em trânsito e repouso (Art. 46 LGPD)');
  }

  if (!dados.temBackup) {
    recomendacoes.push('Implementar backup regular dos dados pessoais (Art. 46 LGPD)');
  }

  return {
    dataGeracao: new Date().toISOString(),
    totalRegistros: dados.totalFuncionarios + dados.totalCandidatos,
    registrosComConsentimento: dados.candidatosComConsentimento + dados.totalFuncionarios, // Funcionários: base legal = execução de contrato
    registrosSemConsentimento: dados.totalCandidatos - dados.candidatosComConsentimento,
    dadosSensiveis: Object.entries(CAMPOS_SENSIVEIS)
      .filter(([, classificacao]) => classificacao === 'sensivel' || classificacao === 'confidencial')
      .map(([campo]) => campo),
    politicasRetencao: POLITICAS_RETENCAO,
    recomendacoes,
  };
};

// ========== Base Legal para Tratamento (Art. 7º LGPD) ==========
export type BaseLegalTratamento =
  | 'consentimento'           // Art. 7º I
  | 'obrigacao_legal'         // Art. 7º II (CLT, eSocial)
  | 'execucao_contrato'       // Art. 7º V (contrato de trabalho)
  | 'exercicio_direitos'      // Art. 7º VI
  | 'interesse_legitimo'      // Art. 7º IX
  | 'protecao_vida';          // Art. 7º VII

export const BASE_LEGAL_POR_MODULO: Record<string, { base: BaseLegalTratamento; descricao: string }> = {
  cadastro_funcionario: {
    base: 'execucao_contrato',
    descricao: 'Execução de contrato de trabalho (Art. 7º V LGPD)',
  },
  folha_pagamento: {
    base: 'obrigacao_legal',
    descricao: 'Obrigação legal trabalhista — CLT, eSocial (Art. 7º II LGPD)',
  },
  registro_ponto: {
    base: 'obrigacao_legal',
    descricao: 'Obrigação legal — Portaria 671/2021 (Art. 7º II LGPD)',
  },
  saude_seguranca: {
    base: 'obrigacao_legal',
    descricao: 'Obrigação legal — NRs e SST (Art. 7º II LGPD) + dado sensível (Art. 11 LGPD)',
  },
  banco_talentos: {
    base: 'consentimento',
    descricao: 'Consentimento do titular para processo seletivo (Art. 7º I LGPD)',
  },
  comunicados: {
    base: 'interesse_legitimo',
    descricao: 'Interesse legítimo do empregador (Art. 7º IX LGPD)',
  },
};
