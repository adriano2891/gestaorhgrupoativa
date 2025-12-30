export type DocumentoTipo = 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'imagem' | 'video' | 'audio' | 'outro';

export interface DocumentoCategoria {
  id: string;
  nome: string;
  descricao: string | null;
  categoria_pai_id: string | null;
  cor: string;
  icone: string;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export interface Documento {
  id: string;
  titulo: string;
  descricao: string | null;
  categoria_id: string | null;
  tipo: DocumentoTipo;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tamanho: number | null;
  mime_type: string | null;
  tags: string[] | null;
  versao_atual: number;
  criado_por: string | null;
  atualizado_por: string | null;
  visualizacoes: number;
  publico: boolean;
  created_at: string;
  updated_at: string;
  categoria?: { id: string; nome: string; cor: string } | null;
  profiles?: { nome: string } | null;
}

export interface DocumentoVersao {
  id: string;
  documento_id: string;
  versao: number;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tamanho: number | null;
  alteracoes: string | null;
  criado_por: string | null;
  created_at: string;
  profiles?: { nome: string } | null;
}

export interface DocumentoComentario {
  id: string;
  documento_id: string;
  user_id: string;
  conteudo: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  profiles?: { nome: string } | null;
}

export interface DocumentoFavorito {
  id: string;
  documento_id: string;
  user_id: string;
  created_at: string;
}

export const TIPO_LABELS: Record<DocumentoTipo, string> = {
  pdf: 'PDF',
  docx: 'Word',
  xlsx: 'Excel',
  pptx: 'PowerPoint',
  imagem: 'Imagem',
  video: 'Vídeo',
  audio: 'Áudio',
  outro: 'Outro'
};

export const TIPO_ICONS: Record<DocumentoTipo, string> = {
  pdf: 'file-text',
  docx: 'file-text',
  xlsx: 'table',
  pptx: 'presentation',
  imagem: 'image',
  video: 'video',
  audio: 'music',
  outro: 'file'
};
