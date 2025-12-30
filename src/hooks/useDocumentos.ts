import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Documento, DocumentoCategoria, DocumentoVersao, DocumentoComentario, DocumentoTipo } from "@/types/documentos";

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
      const { data, error } = await supabase
        .from("documentos_categorias")
        .select("*")
        .order("ordem");

      if (error) throw error;
      return data as DocumentoCategoria[];
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
      let query = supabase
        .from("documentos")
        .select(`
          *,
          categoria:documentos_categorias(id, nome, cor),
          profiles:criado_por(nome)
        `)
        .order("created_at", { ascending: false });

      if (filters?.categoriaId) {
        query = query.eq("categoria_id", filters.categoriaId);
      }

      if (filters?.search) {
        query = query.or(`titulo.ilike.%${filters.search}%,descricao.ilike.%${filters.search}%`);
      }

      if (filters?.tipo) {
        query = query.eq("tipo", filters.tipo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as Documento[];
    },
  });
};

// Fetch favoritos do usuário
export const useMeusFavoritos = () => {
  return useQuery({
    queryKey: ["meus-favoritos"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("documentos_favoritos")
        .select("documento_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map(f => f.documento_id);
    },
  });
};

// Fetch documento específico
export const useDocumentoDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: ["documento", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("documentos")
        .select(`
          *,
          categoria:documentos_categorias(id, nome, cor),
          profiles:criado_por(nome)
        `)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Documento | null;
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
      
      const { data, error } = await supabase
        .from("documentos_versoes")
        .select(`*, profiles:criado_por(nome)`)
        .eq("documento_id", documentoId)
        .order("versao", { ascending: false });

      if (error) throw error;
      return data as DocumentoVersao[];
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
      
      const { data, error } = await supabase
        .from("documentos_comentarios")
        .select(`*, profiles:user_id(nome)`)
        .eq("documento_id", documentoId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as DocumentoComentario[];
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
      const fileName = `${Date.now()}_${file.name}`;
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("documentos")
        .getPublicUrl(fileName);

      // Create document record
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
          criado_por: user?.id,
          publico: publico || false,
        })
        .select()
        .single();

      if (error) throw error;

      // Create first version
      await supabase.from("documentos_versoes").insert({
        documento_id: data.id,
        versao: 1,
        arquivo_url: publicUrl,
        arquivo_nome: file.name,
        arquivo_tamanho: file.size,
        alteracoes: "Versão inicial",
        criado_por: user?.id,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documentos"] });
      toast({ title: "Documento enviado com sucesso!" });
    },
    onError: (error: Error) => {
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
      
      // Get current version
      const { data: doc } = await supabase
        .from("documentos")
        .select("versao_atual")
        .eq("id", documentoId)
        .single();

      const novaVersao = (doc?.versao_atual || 0) + 1;
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("documentos")
        .getPublicUrl(fileName);

      // Create version record
      await supabase.from("documentos_versoes").insert({
        documento_id: documentoId,
        versao: novaVersao,
        arquivo_url: publicUrl,
        arquivo_nome: file.name,
        arquivo_tamanho: file.size,
        alteracoes,
        criado_por: user?.id,
      });

      // Update document
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
