import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChamadoSuporte {
  id: string;
  user_id: string;
  categoria: string;
  assunto: string;
  status: string;
  created_at: string;
  updated_at: string;
  profiles?: { nome: string; departamento: string | null; cargo: string | null } | null;
}

export interface MensagemChamado {
  id: string;
  chamado_id: string;
  remetente_id: string;
  conteudo: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  created_at: string;
  profiles?: { nome: string } | null;
}

// Hook para funcionário - seus chamados
export const useMeusChamados = () => {
  return useQuery({
    queryKey: ["meus-chamados"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        console.warn("useMeusChamados: Nenhuma sessão ativa encontrada");
        return [] as ChamadoSuporte[];
      }
      
      const userId = session.user.id;
      const { data, error } = await (supabase as any)
        .from("chamados_suporte")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Erro ao carregar chamados:", error);
        return [] as ChamadoSuporte[];
      }
      return (data || []) as ChamadoSuporte[];
    },
    retry: 2,
    retryDelay: 1000,
    refetchOnWindowFocus: true,
    staleTime: 1000 * 10,
  });
};

// Hook para RH - todos os chamados
export const useTodosChamados = () => {
  return useQuery({
    queryKey: ["todos-chamados"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("chamados_suporte")
        .select("*, profiles:user_id(nome, departamento, cargo, status)")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Erro ao carregar todos os chamados:", error);
        throw error;
      }

      // Filtrar funcionários demitidos no client-side
      const filtered = (data || []).filter((c: any) => {
        const profileStatus = c.profiles?.status;
        return profileStatus !== 'demitido' && profileStatus !== 'pediu_demissao';
      });

      return filtered as ChamadoSuporte[];
    },
    retry: 2,
  });
};

// Hook para mensagens de um chamado
export const useMensagensChamado = (chamadoId: string | null) => {
  return useQuery({
    queryKey: ["mensagens-chamado", chamadoId],
    queryFn: async () => {
      if (!chamadoId) return [] as MensagemChamado[];
      const { data, error } = await (supabase as any)
        .from("mensagens_chamado")
        .select("*, profiles:remetente_id(nome)")
        .eq("chamado_id", chamadoId)
        .order("created_at", { ascending: true });
      if (error) {
        console.error("Erro ao carregar mensagens:", error);
        return [] as MensagemChamado[];
      }
      return (data || []) as MensagemChamado[];
    },
    enabled: !!chamadoId,
    refetchOnWindowFocus: true,
  });
};

// Mutation para criar chamado
export const useCriarChamado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      user_id: string;
      categoria: string;
      assunto: string;
      mensagem: string;
      arquivo?: File;
    }) => {
      // Use current auth session to ensure user_id matches auth.uid()
      const { data: { session } } = await supabase.auth.getSession();
      const actualUserId = session?.user?.id || params.user_id;

      // Criar chamado
      const { data: chamado, error: chamadoError } = await (supabase as any)
        .from("chamados_suporte")
        .insert({ user_id: actualUserId, categoria: params.categoria, assunto: params.assunto })
        .select()
        .single();
      if (chamadoError) throw chamadoError;

      // Upload de arquivo se houver
      let arquivo_url = null;
      let arquivo_nome = null;
      if (params.arquivo) {
        const sanitizedName = params.arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${chamado.id}/${Date.now()}_${sanitizedName}`;
        const { error: uploadError } = await supabase.storage
          .from("chamados-anexos")
          .upload(filePath, params.arquivo);
        if (uploadError) throw uploadError;
        arquivo_url = filePath;
        arquivo_nome = params.arquivo.name;
      }

      // Criar mensagem inicial
      const { error: msgError } = await (supabase as any)
        .from("mensagens_chamado")
        .insert({
          chamado_id: chamado.id,
          remetente_id: actualUserId,
          conteudo: params.mensagem,
          arquivo_url,
          arquivo_nome,
        });
      if (msgError) throw msgError;

      return chamado;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meus-chamados"] });
      queryClient.invalidateQueries({ queryKey: ["todos-chamados"] });
      toast.success("Chamado criado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar chamado: " + error.message);
    },
  });
};

// Mutation para enviar mensagem
export const useEnviarMensagem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      chamado_id: string;
      remetente_id: string;
      conteudo: string;
      arquivo?: File;
    }) => {
      let arquivo_url = null;
      let arquivo_nome = null;
      if (params.arquivo) {
        const sanitizedName = params.arquivo.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "_");
        const filePath = `${params.chamado_id}/${Date.now()}_${sanitizedName}`;
        const { error: uploadError } = await supabase.storage
          .from("chamados-anexos")
          .upload(filePath, params.arquivo);
        if (uploadError) throw uploadError;
        arquivo_url = filePath;
        arquivo_nome = params.arquivo.name;
      }

      // Use current auth session for remetente_id
      const { data: { session } } = await supabase.auth.getSession();
      const actualRemetenteId = session?.user?.id || params.remetente_id;

      const { data, error } = await (supabase as any)
        .from("mensagens_chamado")
        .insert({
          chamado_id: params.chamado_id,
          remetente_id: actualRemetenteId,
          conteudo: params.conteudo,
          arquivo_url,
          arquivo_nome,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["mensagens-chamado", variables.chamado_id] });
      queryClient.invalidateQueries({ queryKey: ["meus-chamados"] });
      queryClient.invalidateQueries({ queryKey: ["todos-chamados"] });
    },
    onError: (error: any) => {
      toast.error("Erro ao enviar mensagem: " + error.message);
    },
  });
};

// Mutation para atualizar status do chamado
export const useAtualizarStatusChamado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { chamado_id: string; status: string }) => {
      const { data, error } = await (supabase as any)
        .from("chamados_suporte")
        .update({ status: params.status })
        .eq("id", params.chamado_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["meus-chamados"] });
      queryClient.invalidateQueries({ queryKey: ["todos-chamados"] });
      toast.success("Status atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });
};
