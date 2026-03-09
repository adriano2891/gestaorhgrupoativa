/**
 * Validações eSocial para dados trabalhistas
 * 
 * Eventos contemplados:
 * - S-2200: Cadastramento Inicial / Admissão
 * - S-2206: Alteração Contratual
 * - S-2230: Afastamento Temporário
 * - S-2250: Aviso Prévio
 * - S-2299: Desligamento
 * - S-2399: Término de TSVE (Trabalhador Sem Vínculo)
 */

export interface ValidacaoResult {
  valido: boolean;
  erros: string[];
  avisos: string[];
}

// ========== Validação de CPF (algoritmo oficial) ==========
export const validarCPF = (cpf: string): boolean => {
  const cleaned = cpf.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cleaned[i]) * (10 - i);
  let remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  if (remainder !== parseInt(cleaned[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * (11 - i);
  remainder = (sum * 10) % 11;
  if (remainder === 10) remainder = 0;
  return remainder === parseInt(cleaned[10]);
};

// ========== Validação de PIS/PASEP ==========
export const validarPIS = (pis: string): boolean => {
  const cleaned = pis.replace(/\D/g, '');
  if (cleaned.length !== 11) return false;

  const weights = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cleaned[i]) * weights[i];
  const remainder = 11 - (sum % 11);
  const digit = remainder >= 10 ? 0 : remainder;
  return digit === parseInt(cleaned[10]);
};

// ========== S-2200: Validação de Admissão ==========
export const validarAdmissao = (dados: {
  nome?: string;
  cpf?: string;
  data_admissao?: string;
  cargo?: string;
  pis?: string;
  rg?: string;
  nacionalidade?: string;
  estado_civil?: string;
  sexo?: string;
  nome_mae?: string;
  tipo_contrato?: string;
}): ValidacaoResult => {
  const erros: string[] = [];
  const avisos: string[] = [];

  // Campos obrigatórios S-2200
  if (!dados.nome?.trim()) erros.push("Nome é obrigatório (S-2200 campo cpfTrab)");
  if (!dados.cpf) erros.push("CPF é obrigatório (S-2200)");
  else if (!validarCPF(dados.cpf)) erros.push("CPF inválido (algoritmo de verificação)");

  if (!dados.data_admissao) erros.push("Data de admissão é obrigatória (S-2200 campo dtAdm)");
  if (!dados.cargo?.trim()) erros.push("Cargo/função é obrigatório (S-2200 campo nmFuncao)");

  if (!dados.pis) avisos.push("PIS/PASEP não informado — obrigatório para eSocial (S-2200 campo nisTrab)");
  else if (!validarPIS(dados.pis)) erros.push("PIS/PASEP inválido");

  if (!dados.rg) avisos.push("RG não informado — recomendado para eSocial");
  if (!dados.nacionalidade) avisos.push("Nacionalidade não informada — obrigatória para eSocial (S-2200)");
  if (!dados.estado_civil) avisos.push("Estado civil não informado — obrigatório para eSocial");
  if (!dados.sexo) avisos.push("Sexo/gênero não informado — obrigatório para eSocial (campo sexo)");
  if (!dados.nome_mae) avisos.push("Nome da mãe não informado — obrigatório para eSocial");
  if (!dados.tipo_contrato) avisos.push("Tipo de contrato não informado — obrigatório (S-2200 campo tpContr)");

  // Validar data de admissão não futura demais
  if (dados.data_admissao) {
    const admissao = new Date(dados.data_admissao);
    const hoje = new Date();
    const diffDias = Math.ceil((admissao.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDias > 30) {
      avisos.push("Data de admissão está a mais de 30 dias no futuro — verifique");
    }
  }

  return { valido: erros.length === 0, erros, avisos };
};

// ========== S-2206: Validação de Alteração Contratual ==========
export const validarAlteracaoContratual = (dados: {
  cargo_anterior?: string;
  cargo_novo?: string;
  departamento_anterior?: string;
  departamento_novo?: string;
  salario_anterior?: number;
  salario_novo?: number;
  data_alteracao?: string;
  motivo?: string;
}): ValidacaoResult => {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (!dados.data_alteracao) erros.push("Data da alteração é obrigatória (S-2206 campo dtAlteracao)");

  const temAlteracao = (dados.cargo_anterior !== dados.cargo_novo) ||
    (dados.departamento_anterior !== dados.departamento_novo) ||
    (dados.salario_anterior !== dados.salario_novo);

  if (!temAlteracao) avisos.push("Nenhuma alteração detectada nos dados contratuais");

  // Salário não pode ser reduzido (Art. 468 CLT) exceto em casos específicos
  if (dados.salario_anterior && dados.salario_novo && dados.salario_novo < dados.salario_anterior) {
    avisos.push("Redução salarial detectada — verificar conformidade com Art. 468 CLT (irredutibilidade salarial)");
  }

  if (!dados.motivo?.trim()) avisos.push("Motivo da alteração não informado — recomendado para auditoria");

  return { valido: erros.length === 0, erros, avisos };
};

// ========== S-2230: Validação de Afastamento ==========
export const validarAfastamento = (dados: {
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
  cid?: string;
  dias_empresa?: number;
}): ValidacaoResult => {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (!dados.tipo) erros.push("Tipo de afastamento é obrigatório (S-2230 campo codMotAfast)");
  if (!dados.data_inicio) erros.push("Data de início é obrigatória (S-2230 campo dtIniAfast)");

  if (dados.tipo === 'medico' && !dados.cid) {
    avisos.push("CID não informado para afastamento médico — recomendado para eSocial");
  }

  if (dados.data_inicio && dados.data_fim) {
    const inicio = new Date(dados.data_inicio);
    const fim = new Date(dados.data_fim);
    if (fim < inicio) erros.push("Data fim não pode ser anterior à data início");

    // Afastamento médico > 15 dias = encaminhamento ao INSS
    const dias = Math.ceil((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (dados.tipo === 'medico' && dias > 15) {
      avisos.push(`Afastamento médico de ${dias} dias — após 15 dias, responsabilidade do INSS (Lei 8.213/91 Art. 60)`);
    }
  }

  return { valido: erros.length === 0, erros, avisos };
};

// ========== S-2299: Validação de Desligamento ==========
export const validarDesligamento = (dados: {
  tipo_rescisao?: string;
  data_demissao?: string;
  data_admissao?: string;
  aviso_previo_trabalhado?: boolean;
  motivo?: string;
}): ValidacaoResult => {
  const erros: string[] = [];
  const avisos: string[] = [];

  if (!dados.tipo_rescisao) erros.push("Tipo de rescisão é obrigatório (S-2299 campo mtvDeslig)");
  if (!dados.data_demissao) erros.push("Data de desligamento é obrigatória (S-2299 campo dtDeslig)");

  if (dados.data_demissao && dados.data_admissao) {
    const admissao = new Date(dados.data_admissao);
    const demissao = new Date(dados.data_demissao);
    if (demissao < admissao) erros.push("Data de demissão não pode ser anterior à admissão");

    // Prazo para pagamento das verbas rescisórias: 10 dias (Art. 477 §6º CLT)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const prazoLimite = new Date(demissao);
    prazoLimite.setDate(prazoLimite.getDate() + 10);
    if (hoje > prazoLimite) {
      avisos.push("Prazo de 10 dias úteis para pagamento das verbas rescisórias expirado (Art. 477 §6º CLT)");
    }
  }

  if (!dados.motivo?.trim()) avisos.push("Motivo do desligamento não informado — recomendado para auditoria e eSocial");

  return { valido: erros.length === 0, erros, avisos };
};

// ========== Validação Geral de Dados eSocial ==========
export const validarDadosEsocial = (perfil: {
  nome?: string;
  cpf?: string;
  pis?: string;
  data_admissao?: string;
  cargo?: string;
  rg?: string;
  nacionalidade?: string;
  estado_civil?: string;
  sexo?: string;
  nome_mae?: string;
  tipo_contrato?: string;
}): ValidacaoResult => {
  return validarAdmissao(perfil);
};

// ========== Cálculo de prazo rescisório (Art. 477 §6º) ==========
export const calcularPrazoRescisorio = (dataDemissao: string): {
  prazoLimite: string;
  diasRestantes: number;
  expirado: boolean;
} => {
  const demissao = new Date(dataDemissao);
  const prazo = new Date(demissao);
  prazo.setDate(prazo.getDate() + 10);

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diasRestantes = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  return {
    prazoLimite: prazo.toISOString().split('T')[0],
    diasRestantes,
    expirado: diasRestantes < 0,
  };
};
