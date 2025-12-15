export interface Fornecedor {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  cpf_cnpj: string;
  tipo_fornecedor: 'produto' | 'servico' | 'ambos';
  responsavel: string;
  telefone: string;
  email: string;
  status: 'ativo' | 'inativo';
  condicoes_pagamento: string | null;
  prazo_medio_entrega: number | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface EnderecoFornecedor {
  id: string;
  fornecedor_id: string;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItemFornecedor {
  id: string;
  fornecedor_id: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  valor: number;
  unidade: string | null;
  prazo_entrega: number | null;
  imagem_url: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentoFornecedor {
  id: string;
  fornecedor_id: string;
  tipo_documento: string;
  nome_arquivo: string;
  arquivo_url: string;
  created_at: string;
}

export interface HistoricoPrecoFornecedor {
  id: string;
  item_id: string;
  valor_anterior: number | null;
  valor_novo: number;
  alterado_por: string | null;
  created_at: string;
}

export interface FornecedorComEndereco extends Fornecedor {
  endereco?: EnderecoFornecedor;
}

export const TIPO_FORNECEDOR_LABELS: Record<Fornecedor['tipo_fornecedor'], string> = {
  produto: 'Produto',
  servico: 'Serviço',
  ambos: 'Ambos',
};

export const STATUS_FORNECEDOR_LABELS: Record<Fornecedor['status'], string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
};

export const TIPO_DOCUMENTO_OPTIONS = [
  'Contrato',
  'Catálogo',
  'Nota Fiscal',
  'Certificado',
  'Outro',
];
