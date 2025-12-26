import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadHoleriteParams {
  userId: string;
  mes: number;
  ano: number;
  file: File;
  salarioBruto?: number;
  descontos?: number;
  salarioLiquido?: number;
}

interface CreateHoleriteParams {
  userId: string;
  mes: number;
  ano: number;
  salarioBruto: number;
  descontos: number;
  salarioLiquido: number;
  arquivoUrl?: string;
}

// Hook para upload de holerite com arquivo PDF
export const useUploadHolerite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      mes,
      ano,
      file,
      salarioBruto = 0,
      descontos = 0,
      salarioLiquido = 0,
    }: UploadHoleriteParams) => {
      // 1. Verificar se já existe holerite para este funcionário/mês/ano
      const { data: existingHolerite } = await supabase
        .from("holerites")
        .select("id, arquivo_url")
        .eq("user_id", userId)
        .eq("mes", mes)
        .eq("ano", ano)
        .maybeSingle();

      // 2. Gerar nome único para o arquivo
      const timestamp = Date.now();
      const fileName = `${userId}/${ano}-${String(mes).padStart(2, "0")}-${timestamp}.pdf`;

      // 3. Se existe arquivo anterior, deletar do storage
      if (existingHolerite?.arquivo_url) {
        const oldPath = existingHolerite.arquivo_url.split("/holerites/")[1];
        if (oldPath) {
          await supabase.storage.from("holerites").remove([oldPath]);
        }
      }

      // 4. Upload do arquivo para o storage
      const { error: uploadError } = await supabase.storage
        .from("holerites")
        .upload(fileName, file, {
          contentType: "application/pdf",
          upsert: true,
        });

      if (uploadError) {
        console.error("Erro no upload:", uploadError);
        throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      }

      // 5. Obter URL pública do arquivo
      const { data: urlData } = supabase.storage
        .from("holerites")
        .getPublicUrl(fileName);

      // Para bucket privado, usar URL assinada
      const { data: signedUrlData } = await supabase.storage
        .from("holerites")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 ano

      const arquivoUrl = signedUrlData?.signedUrl || urlData.publicUrl;

      // 6. Buscar dados do funcionário para calcular valores se não fornecidos
      let finalSalarioBruto = salarioBruto;
      let finalDescontos = descontos;
      let finalSalarioLiquido = salarioLiquido;

      if (!salarioBruto) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("salario")
          .eq("id", userId)
          .single();

        if (profile?.salario) {
          finalSalarioBruto = profile.salario;
          // Cálculo padrão de descontos (INSS + IRRF estimados)
          finalDescontos = finalSalarioBruto * 0.15; // 15% estimado
          finalSalarioLiquido = finalSalarioBruto - finalDescontos;
        } else {
          // Valores padrão se não houver salário cadastrado
          finalSalarioBruto = 0;
          finalDescontos = 0;
          finalSalarioLiquido = 0;
        }
      }

      // 7. Inserir ou atualizar registro no banco
      if (existingHolerite) {
        // Atualizar registro existente
        const { data, error } = await supabase
          .from("holerites")
          .update({
            arquivo_url: arquivoUrl,
            salario_bruto: finalSalarioBruto,
            descontos: finalDescontos,
            salario_liquido: finalSalarioLiquido,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingHolerite.id)
          .select()
          .single();

        if (error) {
          console.error("Erro ao atualizar holerite:", error);
          throw new Error(`Erro ao atualizar registro: ${error.message}`);
        }

        return { ...data, isUpdate: true };
      } else {
        // Criar novo registro
        const { data, error } = await supabase
          .from("holerites")
          .insert({
            user_id: userId,
            mes,
            ano,
            arquivo_url: arquivoUrl,
            salario_bruto: finalSalarioBruto,
            descontos: finalDescontos,
            salario_liquido: finalSalarioLiquido,
          })
          .select()
          .single();

        if (error) {
          console.error("Erro ao criar holerite:", error);
          throw new Error(`Erro ao criar registro: ${error.message}`);
        }

        return { ...data, isUpdate: false };
      }
    },
    onSuccess: (data) => {
      const action = data.isUpdate ? "atualizado" : "criado";
      toast({
        title: `Holerite ${action} com sucesso!`,
        description: `O holerite foi ${action} e está disponível para o funcionário.`,
      });
      // Invalidar queries para atualizar views em tempo real
      queryClient.invalidateQueries({ queryKey: ["holerites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao processar holerite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para criar holerite sem arquivo (apenas metadados)
export const useCreateHolerite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      mes,
      ano,
      salarioBruto,
      descontos,
      salarioLiquido,
      arquivoUrl,
    }: CreateHoleriteParams) => {
      // Verificar duplicata
      const { data: existing } = await supabase
        .from("holerites")
        .select("id")
        .eq("user_id", userId)
        .eq("mes", mes)
        .eq("ano", ano)
        .maybeSingle();

      if (existing) {
        throw new Error("Já existe um holerite para este funcionário/mês/ano.");
      }

      const { data, error } = await supabase
        .from("holerites")
        .insert({
          user_id: userId,
          mes,
          ano,
          salario_bruto: salarioBruto,
          descontos,
          salario_liquido: salarioLiquido,
          arquivo_url: arquivoUrl,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Holerite criado!",
        description: "O registro foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["holerites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar holerite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para deletar holerite
export const useDeleteHolerite = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (holeriteId: string) => {
      // Buscar holerite para obter URL do arquivo
      const { data: holerite } = await supabase
        .from("holerites")
        .select("arquivo_url")
        .eq("id", holeriteId)
        .single();

      // Deletar arquivo do storage se existir
      if (holerite?.arquivo_url) {
        const path = holerite.arquivo_url.split("/holerites/")[1]?.split("?")[0];
        if (path) {
          await supabase.storage.from("holerites").remove([path]);
        }
      }

      // Deletar registro do banco
      const { error } = await supabase
        .from("holerites")
        .delete()
        .eq("id", holeriteId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Holerite removido",
        description: "O holerite foi removido com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["holerites"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover holerite",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Hook para obter URL assinada de download
export const useHoleriteDownloadUrl = () => {
  return useMutation({
    mutationFn: async (arquivoUrl: string) => {
      // Extrair path do arquivo
      const path = arquivoUrl.split("/holerites/")[1]?.split("?")[0];
      if (!path) {
        throw new Error("URL de arquivo inválida");
      }

      const { data, error } = await supabase.storage
        .from("holerites")
        .createSignedUrl(path, 60 * 5); // 5 minutos

      if (error) throw error;
      return data.signedUrl;
    },
  });
};
