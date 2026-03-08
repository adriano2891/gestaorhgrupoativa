import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SSTDocumento {
  id: string;
  registro_tipo: string;
  registro_id: string;
  arquivo_nome: string;
  arquivo_url: string;
  arquivo_tamanho: number | null;
  mime_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export const useSSTDocumentos = (registroTipo: string, registroId: string) => {
  return useQuery({
    queryKey: ["sst-documentos", registroTipo, registroId],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/sst_documentos?registro_tipo=eq.${registroTipo}&registro_id=eq.${registroId}&order=created_at.desc`,
        { headers: authHeaders(token) }
      );
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json() as Promise<SSTDocumento[]>;
    },
    enabled: !!registroId,
  });
};

export const useUploadSSTDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      registroTipo,
      registroId,
    }: {
      file: File;
      registroTipo: string;
      registroId: string;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      // Sanitize filename
      const sanitized = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .toLowerCase();
      const path = `${registroTipo}/${registroId}/${Date.now()}-${sanitized}`;

      const { error: uploadError } = await supabase.storage
        .from("sst-documentos")
        .upload(path, file);
      if (uploadError) throw uploadError;

      // Save metadata
      const token = getToken();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/sst_documentos`, {
        method: "POST",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          registro_tipo: registroTipo,
          registro_id: registroId,
          arquivo_nome: file.name,
          arquivo_url: path,
          arquivo_tamanho: file.size,
          mime_type: file.type,
          uploaded_by: session.user.id,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["sst-documentos", vars.registroTipo, vars.registroId] });
      toast.success("Documento anexado com sucesso");
    },
    onError: (e: any) => toast.error("Erro ao anexar documento", { description: e.message }),
  });
};

export const useDeleteSSTDocumento = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (doc: SSTDocumento) => {
      // Delete from storage
      await supabase.storage.from("sst-documentos").remove([doc.arquivo_url]);

      // Delete metadata
      const token = getToken();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/sst_documentos?id=eq.${doc.id}`,
        { method: "DELETE", headers: authHeaders(token) }
      );
      if (!res.ok) throw new Error(await res.text());
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sst-documentos"] });
      toast.success("Documento removido");
    },
    onError: (e: any) => toast.error("Erro ao remover documento", { description: e.message }),
  });
};

export const getSignedUrl = async (path: string): Promise<string> => {
  const { data, error } = await supabase.storage
    .from("sst-documentos")
    .createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl;
};

// Helpers
function getToken(): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "rzcjwfxmogfsmfbwtwfc";
  const raw = localStorage.getItem(`sb-${projectId}-auth-token`);
  return raw ? JSON.parse(raw)?.access_token || "" : "";
}

function authHeaders(token: string): Record<string, string> {
  return {
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${token}`,
  };
}
