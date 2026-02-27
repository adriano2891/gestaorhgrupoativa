import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import type { Documento, DocumentoCategoria, DocumentoVersao, DocumentoComentario, DocumentoTipo } from "@/types/documentos";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_KEY,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `HTTP ${res.status}`);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// Helper para detectar tipo do arquivo
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

// Fetch categorias
export const useDocumentosCategorias = () => {
  return useQuery({
    queryKey: ["documentos-categorias"],
    queryFn: async () => {
      try {
        const data = await restGet('documentos_categorias', '?select=*&order=ordem');
        return (data ?? []) as DocumentoCategoria[];
      } catch (e) {
        console.error('Erro ao buscar categorias:', e);
        return [] as DocumentoCategoria[];
      }
    },
  });
};

// Fetch documentos
export const useDocumentos = (filters?: {
  categoriaId?: string;
  search?: string;
  tipo?: DocumentoTipo;
  favoritos?: boolean;
}) => {
  return useQuery({
    queryKey: ["documentos", filters],
    queryFn: async () => {
      try {
        // Build query params
        let params = '?select=*,categoria:documentos_categorias(id,nome,cor)&order=created_at.desc';
        
        if (filters?.categoriaId) {
          params += `&categoria_id=eq.${filters.categoriaId}`;
        }
        if (filters?.tipo) {
          params += `&tipo=eq.${filters.tipo}`;
        }
        if (filters?.search) {
          params += `&or=(titulo.ilike.*${filters.search}*,descricao.ilike.*${filters.search}*)`;
        }

        const data = await restGet('documentos', params);
        return (data ?? []) as Documento[];
      } catch (e) {
        console.error('Erro ao buscar documentos:', e);
        return [] as Documento[];
      }
    },
  });
};

// Fetch favoritos do usuário
export const useMeusFavoritos = () => {
  return useQuery({
    queryKey: ["meus-favoritos"],
    queryFn: async () => {
      try {
        const token = getAccessToken();
        // Decode JWT to get user id
        if (token === SUPABASE_KEY) return [];
        const payload = JSON.parse(atob(token.split('.')[1]));
        const userId = payload.sub;
        if (!userId) return [];

        const data = await restGet('documentos_favoritos', `?select=documento_id&user_id=eq.${userId}`);
        return (data ?? []).map((f: any) => f.documento_id) as string[];
      } catch (e) {
        console.error('Erro ao buscar favoritos:', e);
        return [] as string[];
      }
    },
  });
};

// Fetch documento específico
export const useDocumentoDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: ["documento", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const data = await restGet('documentos', `?select=*,categoria:documentos_categorias(id,nome,cor)&id=eq.${id}`);
        return (data && data.length > 0 ? data[0] : null) as Documento | null;
      } catch (e) {
        console.error('Erro ao buscar documento:', e);
        return null;
      }
    },
    enabled: !!id,
  });
};

// Fetch versões
export const useDocumentoVersoes = (documentoId: string | undefined) => {
  return useQuery({
    queryKey: ["documento-versoes", documentoId],
    queryFn: async () => {
      if (!documentoId) return [];
      try {
        const data = await restGet('documentos_versoes', `?select=*&documento_id=eq.${documentoId}&order=versao.desc`);
        return (data ?? []) as DocumentoVersao[];
      } catch (e) {
        console.error('Erro ao buscar versões:', e);
        return [] as DocumentoVersao[];
      }
    },
    enabled: !!documentoId,
  });
};

// Fetch comentários
export const useDocumentoComentarios = (documentoId: string | undefined) => {
  return useQuery({
    queryKey: ["documento-comentarios", documentoId],
    queryFn: async () => {
      if (!documentoId) return [];
      try {
        const data = await restGet('documentos_comentarios', `?select=*&documento_id=eq.${documentoId}&order=created_at.asc`);
        return (data ?? []) as DocumentoComentario[];
      } catch (e) {
        console.error('Erro ao buscar comentários:', e);
        return [] as DocumentoComentario[];
      }
    },
    enabled: !!documentoId,
  });
};

// Upload documento
export const useUploadDocumento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      file, 
      titulo, 
      descricao, 
      categoriaId, 
      tags,
      publico 
    }: { 
      file: File; 
      titulo: string; 
      descricao?: string;
      categoriaId?: string;
      tags?: string[];
      publico?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Você precisa estar autenticado para fazer upload de documentos");
      }

      const fileName = `${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: signedData, error: signedError } = await supabase.storage
        .from("documentos")
        .createSignedUrl(fileName, 3600);
      if (signedError) throw signedError;
      const publicUrl = signedData.signedUrl;

      const { data, error } = await supabase
        .from("documentos")
        .insert({
          titulo,
          descricao,
          categoria_id: categoriaId || null,
          tipo: getDocumentoTipo(file.type),
          arquivo_url: publicUrl,
          arquivo_nome: file.name,
          arquivo_tamanho: file.size,
          mime_type: file.type,
          tags: tags || [],
          criado_por: user.id,
          publico: publico || false,
        })
        .select()
        .single();

      if (error) throw error;

      const { error: versionError } = await supabase.from("documentos_versoes").insert({
        documento_id: data.id,
        versao: 1,
        arquivo_url: publicUrl,
        arquivo_nome: file.name,
        arquivo_tamanho: file.size,
        alteracoes: "Versão inicial",
        criado_por: user.id,
      });

      if (versionError) {
        console.error("Erro ao criar versão:", versionError);
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      toast({ title: "Documento enviado com sucesso!" });
    },
    onError: (error: Error) => {
      console.error("Erro no upload:", error);
      toast({ title: "Erro ao enviar documento", description: error.message, variant: "destructive" });
    },
  });
};

// Atualizar documento
export const useUpdateDocumento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Documento> & { id: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data: updated, error } = await supabase
        .from("documentos")
        .update({ ...data, atualizado_por: user?.id })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["documento", variables.id] });
      toast({ title: "Documento atualizado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar documento", description: error.message, variant: "destructive" });
    },
  });
};

// Deletar documento
export const useDeleteDocumento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("documentos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      toast({ title: "Documento excluído!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir documento", description: error.message, variant: "destructive" });
    },
  });
};

// Toggle favorito
export const useToggleFavorito = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentoId, isFavorito }: { documentoId: string; isFavorito: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      if (isFavorito) {
        const { error } = await supabase
          .from("documentos_favoritos")
          .delete()
          .eq("documento_id", documentoId)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("documentos_favoritos")
          .insert({ documento_id: documentoId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meus-favoritos"] });
    },
  });
};

// Adicionar comentário
export const useAddComentario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentoId, conteudo }: { documentoId: string; conteudo: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("documentos_comentarios")
        .insert({
          documento_id: documentoId,
          user_id: user.id,
          conteudo,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documento-comentarios", variables.documentoId] });
      toast({ title: "Comentário adicionado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar comentário", description: error.message, variant: "destructive" });
    },
  });
};

// Criar categoria
export const useCreateCategoria = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nome: string; descricao?: string; cor?: string; categoria_pai_id?: string }) => {
      const { data: created, error } = await supabase
        .from("documentos_categorias")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos-categorias"] });
      toast({ title: "Categoria criada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar categoria", description: error.message, variant: "destructive" });
    },
  });
};

// Upload nova versão
export const useUploadVersao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ documentoId, file, alteracoes }: { documentoId: string; file: File; alteracoes?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${Date.now()}_${file.name}`;
      
      const { data: doc } = await supabase
        .from("documentos")
        .select("versao_atual")
        .eq("id", documentoId)
        .single();

      const novaVersao = (doc?.versao_atual || 0) + 1;
      
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: signedData, error: signedError } = await supabase.storage
        .from("documentos")
        .createSignedUrl(fileName, 3600);
      if (signedError) throw signedError;
      const publicUrl = signedData.signedUrl;

      await supabase.from("documentos_versoes").insert({
        documento_id: documentoId,
        versao: novaVersao,
        arquivo_url: publicUrl,
        arquivo_nome: file.name,
        arquivo_tamanho: file.size,
        alteracoes,
        criado_por: user?.id,
      });

      await supabase.from("documentos").update({
        versao_atual: novaVersao,
        arquivo_url: publicUrl,
        arquivo_nome: file.name,
        arquivo_tamanho: file.size,
        atualizado_por: user?.id,
      }).eq("id", documentoId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      queryClient.invalidateQueries({ queryKey: ["documento", variables.documentoId] });
      queryClient.invalidateQueries({ queryKey: ["documento-versoes", variables.documentoId] });
      toast({ title: "Nova versão enviada!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar versão", description: error.message, variant: "destructive" });
    },
  });
};
