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
      try {
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
      } catch (e) {
        console.error("Erro inesperado em meus chamados:", e);
        return [] as ChamadoSuporte[];
      }
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
      // Fetch chamados without join first (most reliable)
      const { data: chamados, error } = await supabase
        .from("chamados_suporte")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Erro ao carregar todos os chamados:", error);
        throw error;
      }

      if (!chamados || chamados.length === 0) return [] as ChamadoSuporte[];

      // Fetch profiles separately
      try {
        const uniqueUserIds = [...new Set(chamados.map(c => c.user_id))] as string[];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, nome, departamento, cargo, status")
          .in("id", uniqueUserIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));

        const withProfiles = chamados.map(c => ({
          ...c,
          profiles: profileMap.get(c.user_id) || null,
        }));

        // Filtrar funcionários demitidos no client-side
        const filtered = withProfiles.filter((c: any) => {
          const profileStatus = c.profiles?.status;
          return profileStatus !== 'demitido' && profileStatus !== 'pediu_demissao';
        });

        return filtered as ChamadoSuporte[];
      } catch (e) {
        console.warn("Failed to fetch profiles for chamados:", e);
        return chamados as ChamadoSuporte[];
      }
    },
    retry: 2,
    staleTime: 1000 * 60 * 2,
  });
};

// Hook para mensagens de um chamado
export const useMensagensChamado = (chamadoId: string | null) => {
  return useQuery({
    queryKey: ["mensagens-chamado", chamadoId],
    queryFn: async () => {
      if (!chamadoId) return [] as MensagemChamado[];
      
      // Fetch messages without join (most reliable)
      const { data: rawData, error: rawError } = await (supabase as any)
        .from("mensagens_chamado")
        .select("*")
        .eq("chamado_id", chamadoId)
        .order("created_at", { ascending: true });
      
      if (rawError) {
        console.error("Erro ao carregar mensagens:", rawError);
        throw rawError;
      }
      
      if (!rawData || rawData.length === 0) {
        return [] as MensagemChamado[];
      }

      // Fetch profile names separately
      try {
        const uniqueIds = [...new Set(rawData.map((m: any) => m.remetente_id))] as string[];
        const { data: profiles } = await (supabase as any)
          .from("profiles")
          .select("id, nome")
          .in("id", uniqueIds);
        
        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
        return rawData.map((msg: any) => ({
          ...msg,
          profiles: profileMap.get(msg.remetente_id) || null,
        })) as MensagemChamado[];
      } catch (e) {
        console.warn("Failed to fetch profiles:", e);
        return rawData.map((msg: any) => ({
          ...msg,
          profiles: null,
        })) as MensagemChamado[];
      }
    },
    enabled: !!chamadoId,
    refetchOnWindowFocus: true,
    refetchInterval: 10000,
    retry: 3,
    retryDelay: 1000,
    staleTime: 1000 * 5,
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
      queryClient.invalidateQueries({ queryKey: ["admin-notif-chamados"] });
      toast.success("Status atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar status: " + error.message);
    },
  });
};
