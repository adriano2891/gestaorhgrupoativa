import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { FormularioRH, FormularioCampo, FormularioAtribuicao, FormCategory, FormStatus, FormFieldType } from "@/types/formularios";

// Fetch all forms
export const useFormulariosRH = () => {
  return useQuery({
    queryKey: ["formularios-rh"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formularios_rh")
        .select(`*`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as FormularioRH[];
    },
    staleTime: 1000 * 60 * 2,
    retry: 2,
  });
};

// Fetch templates only
export const useFormulariosTemplates = () => {
  return useQuery({
    queryKey: ["formularios-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("formularios_rh")
        .select("*")
        .eq("is_template", true)
        .eq("status", "publicado")
        .order("titulo");

      if (error) throw error;
      return data as FormularioRH[];
    },
  });
};

// Fetch single form with fields
export const useFormularioDetails = (id: string | undefined) => {
  return useQuery({
    queryKey: ["formulario-rh", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("formularios_rh")
        .select(`*`)
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as FormularioRH | null;
    },
    enabled: !!id,
  });
};

// Fetch form fields
export const useFormularioCampos = (formularioId: string | undefined) => {
  return useQuery({
    queryKey: ["formulario-campos", formularioId],
    queryFn: async () => {
      if (!formularioId) return [];
      
      const { data, error } = await supabase
        .from("formulario_campos")
        .select("*")
        .eq("formulario_id", formularioId)
        .order("ordem");

      if (error) throw error;
      return data as FormularioCampo[];
    },
    enabled: !!formularioId,
  });
};

// Fetch form assignments
export const useFormularioAtribuicoes = (formularioId: string | undefined) => {
  return useQuery({
    queryKey: ["formulario-atribuicoes", formularioId],
    queryFn: async () => {
      if (!formularioId) return [];
      
      const { data, error } = await supabase
        .from("formulario_atribuicoes")
        .select(`
          *,
          profiles:user_id!inner(nome, email, status)
        `)
        .eq("formulario_id", formularioId)
        .not("profiles.status", "in", '("demitido","pediu_demissao")')
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FormularioAtribuicao[];
    },
    enabled: !!formularioId,
  });
};

// Create form mutation
export const useCreateFormulario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: {
      titulo: string;
      descricao?: string;
      categoria: FormCategory;
      is_template?: boolean;
      template_origem_id?: string;
      departamento_destino?: string;
      requer_assinatura?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from("formularios_rh")
        .insert({
          ...formData,
          criado_por: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formularios-rh"] });
      toast({ title: "Formulário criado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao criar formulário", description: error.message, variant: "destructive" });
    },
  });
};

// Update form mutation
export const useUpdateFormulario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...formData }: Partial<FormularioRH> & { id: string }) => {
      const { data, error } = await supabase
        .from("formularios_rh")
        .update(formData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["formularios-rh"] });
      queryClient.invalidateQueries({ queryKey: ["formulario-rh", variables.id] });
      toast({ title: "Formulário atualizado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar formulário", description: error.message, variant: "destructive" });
    },
  });
};

// Delete form mutation
export const useDeleteFormulario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("formularios_rh")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formularios-rh"] });
      toast({ title: "Formulário excluído!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir formulário", description: error.message, variant: "destructive" });
    },
  });
};

// Add field mutation
export const useAddFormularioCampo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fieldData: {
      formulario_id: string;
      label: string;
      tipo: FormFieldType;
      obrigatorio?: boolean;
      ordem?: number;
      opcoes?: string[];
      placeholder?: string;
      valor_padrao?: string;
    }) => {
      const { data, error } = await supabase
        .from("formulario_campos")
        .insert({ ...fieldData, tipo: fieldData.tipo as any })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["formulario-campos", variables.formulario_id] });
      toast({ title: "Campo adicionado!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao adicionar campo", description: error.message, variant: "destructive" });
    },
  });
};

// Update field mutation
export const useUpdateFormularioCampo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formulario_id, ...fieldData }: Partial<FormularioCampo> & { id: string; formulario_id: string }) => {
      const { data, error } = await supabase
        .from("formulario_campos")
        .update(fieldData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["formulario-campos", variables.formulario_id] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atualizar campo", description: error.message, variant: "destructive" });
    },
  });
};

// Delete field mutation
export const useDeleteFormularioCampo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formulario_id }: { id: string; formulario_id: string }) => {
      const { error } = await supabase
        .from("formulario_campos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["formulario-campos", variables.formulario_id] });
      toast({ title: "Campo removido!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao remover campo", description: error.message, variant: "destructive" });
    },
  });
};

// Assign form to users
export const useAssignFormulario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formulario_id, user_ids, data_limite }: { 
      formulario_id: string; 
      user_ids: string[]; 
      data_limite?: string;
    }) => {
      const assignments = user_ids.map(user_id => ({
        formulario_id,
        user_id,
        data_limite,
      }));

      const { error } = await supabase
        .from("formulario_atribuicoes")
        .upsert(assignments, { onConflict: 'formulario_id,user_id' });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["formulario-atribuicoes", variables.formulario_id] });
      toast({ title: "Formulário atribuído aos colaboradores!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao atribuir formulário", description: error.message, variant: "destructive" });
    },
  });
};

// Upload external file
export const useUploadFormularioExterno = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, formData }: { 
      file: File; 
      formData: {
        titulo: string;
        descricao?: string;
        categoria: FormCategory;
      };
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const fileName = `${Date.now()}_${file.name}`;
      
      // Upload file
      const { error: uploadError } = await supabase.storage
        .from("formularios")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("formularios")
        .getPublicUrl(fileName);

      // Create form record
      const { data, error } = await supabase
        .from("formularios_rh")
        .insert({
          ...formData,
          criado_por: user?.id,
          arquivo_externo_url: publicUrl,
          arquivo_externo_nome: file.name,
          status: 'publicado' as FormStatus,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["formularios-rh"] });
      toast({ title: "Formulário externo enviado com sucesso!" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar formulário", description: error.message, variant: "destructive" });
    },
  });
};
