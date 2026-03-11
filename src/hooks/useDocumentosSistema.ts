import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { DocumentoTipo } from "@/types/documentos";

// Types specific to Sistema module
export interface DocumentoSistemaCategoria {
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

export interface DocumentoSistema {
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
  excluido?: boolean;
  created_at: string;
  updated_at: string;
  categoria?: { id: string; nome: string; cor: string } | null;
}

export interface DocumentoSistemaVersao {
  id: string;
  documento_id: string;
  versao: number;
  arquivo_url: string;
  arquivo_nome: string;
  arquivo_tamanho: number | null;
  alteracoes: string | null;
  criado_por: string | null;
  created_at: string;
}

export interface DocumentoSistemaComentario {
  id: string;
  documento_id: string;
  user_id: string;
  conteudo: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Storage bucket dedicated to Sistema module
const SISTEMA_BUCKET = 'documentos-sistema';

function getAccessToken(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1] || '';
  const storageKey = `sb-${projectId}-auth-token`;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.access_token || SUPABASE_KEY;
    }
  } catch {}
  return SUPABASE_KEY;
}

async function restGet(table: string, query?: string) {
  const token = getAccessToken();
  const url = `${SUPABASE_URL}/rest/v1/${table}${query || ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_KEY, 'Accept': 'application/json' },
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err || `HTTP ${res.status}`); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function restPost(table: string, body: any) {
  const token = getAccessToken();
  const url = `${SUPABASE_URL}/rest/v1/${table}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err || `HTTP ${res.status}`); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function restPatch(table: string, query: string, body: any) {
  const token = getAccessToken();
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json', 'Accept': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err || `HTTP ${res.status}`); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

async function restDelete(table: string, query: string) {
  const token = getAccessToken();
  const url = `${SUPABASE_URL}/rest/v1/${table}${query}`;
  const res = await fetch(url, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_KEY },
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err || `HTTP ${res.status}`); }
}

function getUserIdFromToken(): string | null {
  const token = getAccessToken();
  if (token === SUPABASE_KEY) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub || null;
  } catch { return null; }
}

function sanitizeStorageFileName(name: string): string {
  return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'arquivo';
}

function encodeStoragePath(path: string): string {
  return path.split('/').map((segment) => encodeURIComponent(segment)).join('/');
}

async function storageUpload(fileName: string, file: File) {
  const token = getAccessToken();
  const encodedPath = encodeStoragePath(fileName);
  const url = `${SUPABASE_URL}/storage/v1/object/${SISTEMA_BUCKET}/${encodedPath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_KEY },
    body: file,
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err || `Upload failed: HTTP ${res.status}`); }
  return res.json();
}

async function storageSignedUrl(fileName: string) {
  const token = getAccessToken();
  const encodedPath = encodeStoragePath(fileName);
  const url = `${SUPABASE_URL}/storage/v1/object/sign/${SISTEMA_BUCKET}/${encodedPath}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!res.ok) { const err = await res.text(); throw new Error(err || `Signed URL failed: HTTP ${res.status}`); }
  const data = await res.json();
  return `${SUPABASE_URL}/storage/v1${data.signedURL}`;
}

function extractStoragePath(arquivoUrl: string): string | null {
  if (!arquivoUrl) return null;
  const cleanUrl = arquivoUrl.trim();
  if (!cleanUrl) return null;
  try {
    const parsed = new URL(cleanUrl);
    const signPrefix = `/storage/v1/object/sign/${SISTEMA_BUCKET}/`;
    const objectPrefix = `/storage/v1/object/${SISTEMA_BUCKET}/`;
    if (parsed.pathname.includes(signPrefix)) {
      const path = parsed.pathname.split(signPrefix)[1];
      return path ? decodeURIComponent(path) : null;
    }
    if (parsed.pathname.includes(objectPrefix)) {
      const path = parsed.pathname.split(objectPrefix)[1];
      return path ? decodeURIComponent(path) : null;
    }
  } catch {}
  const withoutQuery = cleanUrl.split('?')[0].replace(/^\/+/, '');
  if (withoutQuery.startsWith(`${SISTEMA_BUCKET}/`)) {
    return decodeURIComponent(withoutQuery.replace(`${SISTEMA_BUCKET}/`, ''));
  }
  if (!withoutQuery.includes('://')) {
    return decodeURIComponent(withoutQuery);
  }
  return null;
}

export async function getDocumentoSistemaAccessUrl(arquivoUrl: string): Promise<string> {
  const path = extractStoragePath(arquivoUrl);
  if (!path) return arquivoUrl;
  return storageSignedUrl(path);
}

const getDocumentoTipo = (mimeType: string): DocumentoTipo => {
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType === 'application/msword') return 'docx';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'xlsx';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'pptx';
  if (mimeType.startsWith('image/')) return 'imagem';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'outro';
};

// ========== QUERIES ==========

export const useDocumentosSistemaCategorias = () => {
  return useQuery({
    queryKey: ["sistema-documentos-categorias"],
    queryFn: async () => {
      try {
        const data = await restGet('documentos_sistema_categorias', '?select=*&order=ordem');
        return (data ?? []) as DocumentoSistemaCategoria[];
      } catch (e) {
        console.error('Erro ao buscar categorias sistema:', e);
        return [] as DocumentoSistemaCategoria[];
      }
    },
  });
};

export const useDocumentosSistema = (filters?: {
  categoriaId?: string;
  search?: string;
  tipo?: DocumentoTipo;
}) => {
  return useQuery({
    queryKey: ["sistema-documentos", filters],
    queryFn: async () => {
      try {
        let params = '?select=*,categoria:documentos_sistema_categorias(id,nome,cor)&excluido=eq.false&order=created_at.desc';
        if (filters?.categoriaId) params += `&categoria_id=eq.${filters.categoriaId}`;
        if (filters?.tipo) params += `&tipo=eq.${filters.tipo}`;
        if (filters?.search) params += `&or=(titulo.ilike.*${filters.search}*,descricao.ilike.*${filters.search}*)`;
        const data = await restGet('documentos_sistema', params);
        return (data ?? []) as DocumentoSistema[];
      } catch (e) {
        console.error('Erro ao buscar documentos sistema:', e);
        return [] as DocumentoSistema[];
      }
    },
  });
};

export const useMeusFavoritosSistema = () => {
  return useQuery({
    queryKey: ["sistema-meus-favoritos"],
    queryFn: async () => {
      try {
        const token = getAccessToken();
        if (token === SUPABASE_KEY) return [];
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;
        if (!userId) return [];
        const data = await restGet('documentos_sistema_favoritos', `?select=documento_id&user_id=eq.${userId}`);
        return (data ?? []).map((f: any) => f.documento_id) as string[];
      } catch (e) {
        console.error('Erro ao buscar favoritos sistema:', e);
        return [] as string[];
      }
    },
  });
};

// ========== MUTATIONS ==========

export const useDeleteDocumentoSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const userId = getUserIdFromToken();
      await restPatch('documentos_sistema', `?id=eq.${id}`, {
        excluido: true, excluido_por: userId, excluido_em: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-documentos"] });
      toast({ title: "Documento excluído!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir documento", description: error.message, variant: "destructive" });
    },
  });
};

export const useToggleFavoritoSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentoId, isFavorito }: { documentoId: string; isFavorito: boolean }) => {
      const userId = getUserIdFromToken();
      if (!userId) throw new Error("Usuário não autenticado");
      if (isFavorito) {
        await restDelete('documentos_sistema_favoritos', `?documento_id=eq.${documentoId}&user_id=eq.${userId}`);
      } else {
        await restPost('documentos_sistema_favoritos', { documento_id: documentoId, user_id: userId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-meus-favoritos"] });
    },
  });
};

export const useDeleteCategoriaSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await restDelete('documentos_sistema_categorias', `?id=eq.${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-documentos-categorias"] });
      queryClient.invalidateQueries({ queryKey: ["sistema-documentos"] });
      toast({ title: "Categoria excluída!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir categoria", description: error.message, variant: "destructive" });
    },
  });
};

export const useUploadDocumentoSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file, titulo, descricao, categoriaId, tags, publico
    }: {
      file: File; titulo: string; descricao?: string;
      categoriaId?: string; tags?: string[]; publico?: boolean;
    }) => {
      const userId = getUserIdFromToken();
      if (!userId) throw new Error("Você precisa estar autenticado para fazer upload de documentos");
      const sanitizedName = sanitizeStorageFileName(file.name);
      const fileName = `${Date.now()}_${sanitizedName}`;
      await storageUpload(fileName, file);
      const rows = await restPost('documentos_sistema', {
        titulo, descricao,
        categoria_id: categoriaId || null,
        tipo: getDocumentoTipo(file.type),
        arquivo_url: fileName,
        arquivo_nome: file.name,
        arquivo_tamanho: file.size,
        mime_type: file.type,
        tags: tags || [],
        criado_por: userId,
        publico: publico || false,
      });
      const data = rows[0];
      if (!data) throw new Error("Falha ao salvar documento");
      try {
        await restPost('documentos_sistema_versoes', {
          documento_id: data.id, versao: 1,
          arquivo_url: fileName, arquivo_nome: file.name,
          arquivo_tamanho: file.size, alteracoes: "Versão inicial",
          criado_por: userId,
        });
      } catch (e) { console.error("Erro ao criar versão:", e); }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-documentos"] });
      toast({ title: "Documento enviado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar documento", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateDocumentoSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<DocumentoSistema> & { id: string }) => {
      const userId = getUserIdFromToken();
      const rows = await restPatch('documentos_sistema', `?id=eq.${id}`, { ...data, atualizado_por: userId });
      return rows[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sistema-documentos"] });
      queryClient.invalidateQueries({ queryKey: ["sistema-documento", variables.id] });
      toast({ title: "Documento atualizado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar documento", description: error.message, variant: "destructive" });
    },
  });
};

export const useCreateCategoriaSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; cor?: string; categoria_pai_id?: string }) => {
      const rows = await restPost('documentos_sistema_categorias', data);
      return rows[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-documentos-categorias"] });
      toast({ title: "Categoria criada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar categoria", description: error.message, variant: "destructive" });
    },
  });
};

export const useUpdateCategoriaSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nome?: string; descricao?: string; cor?: string; categoria_pai_id?: string | null }) => {
      const rows = await restPatch('documentos_sistema_categorias', `?id=eq.${id}`, data);
      return rows[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sistema-documentos-categorias"] });
      toast({ title: "Categoria atualizada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar categoria", description: error.message, variant: "destructive" });
    },
  });
};

export const useDocumentoSistemaComentarios = (documentoId: string | undefined) => {
  return useQuery({
    queryKey: ["sistema-documento-comentarios", documentoId],
    queryFn: async () => {
      if (!documentoId) return [];
      try {
        const data = await restGet('documentos_sistema_comentarios', `?select=*&documento_id=eq.${documentoId}&order=created_at.asc`);
        return (data ?? []) as DocumentoSistemaComentario[];
      } catch (e) {
        console.error('Erro ao buscar comentários:', e);
        return [] as DocumentoSistemaComentario[];
      }
    },
    enabled: !!documentoId,
  });
};

export const useDocumentoSistemaVersoes = (documentoId: string | undefined) => {
  return useQuery({
    queryKey: ["sistema-documento-versoes", documentoId],
    queryFn: async () => {
      if (!documentoId) return [];
      try {
        const data = await restGet('documentos_sistema_versoes', `?select=*&documento_id=eq.${documentoId}&order=versao.desc`);
        return (data ?? []) as DocumentoSistemaVersao[];
      } catch (e) {
        console.error('Erro ao buscar versões:', e);
        return [] as DocumentoSistemaVersao[];
      }
    },
    enabled: !!documentoId,
  });
};

export const useAddComentarioSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentoId, conteudo }: { documentoId: string; conteudo: string }) => {
      const userId = getUserIdFromToken();
      if (!userId) throw new Error("Usuário não autenticado");
      const rows = await restPost('documentos_sistema_comentarios', {
        documento_id: documentoId, user_id: userId, conteudo,
      });
      return rows[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sistema-documento-comentarios", variables.documentoId] });
      toast({ title: "Comentário adicionado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar comentário", description: error.message, variant: "destructive" });
    },
  });
};

export const useUploadVersaoSistema = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ documentoId, file, alteracoes }: { documentoId: string; file: File; alteracoes?: string }) => {
      const userId = getUserIdFromToken();
      const sanitizedName = sanitizeStorageFileName(file.name);
      const fileName = `${Date.now()}_${sanitizedName}`;
      const docData = await restGet('documentos_sistema', `?select=versao_atual&id=eq.${documentoId}`);
      const novaVersao = ((docData[0]?.versao_atual) || 0) + 1;
      await storageUpload(fileName, file);
      await restPost('documentos_sistema_versoes', {
        documento_id: documentoId, versao: novaVersao,
        arquivo_url: fileName, arquivo_nome: file.name,
        arquivo_tamanho: file.size, alteracoes, criado_por: userId,
      });
      await restPatch('documentos_sistema', `?id=eq.${documentoId}`, {
        versao_atual: novaVersao, arquivo_url: fileName,
        arquivo_nome: file.name, arquivo_tamanho: file.size,
        atualizado_por: userId,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sistema-documentos"] });
      queryClient.invalidateQueries({ queryKey: ["sistema-documento", variables.documentoId] });
      queryClient.invalidateQueries({ queryKey: ["sistema-documento-versoes", variables.documentoId] });
      toast({ title: "Nova versão enviada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar versão", description: error.message, variant: "destructive" });
    },
  });
};

export async function registrarAcessoDocumentoSistema(documentoId: string, acao: string) {
  try {
    const userId = getUserIdFromToken();
    if (!userId) return;
    await restPost('documentos_sistema_acessos', {
      documento_id: documentoId, user_id: userId, acao,
    });
  } catch (e) {
    console.warn('Falha ao registrar acesso:', e);
  }
}

export const useDocumentoSistemaAuditoria = (documentoId: string | undefined) => {
  return useQuery({
    queryKey: ["sistema-documento-auditoria", documentoId],
    queryFn: async () => {
      if (!documentoId) return [];
      try {
        const data = await restGet('documentos_sistema_auditoria', `?select=*&documento_id=eq.${documentoId}&order=created_at.desc`);
        return data ?? [];
      } catch (e) {
        console.error('Erro ao buscar auditoria:', e);
        return [];
      }
    },
    enabled: !!documentoId,
  });
};
