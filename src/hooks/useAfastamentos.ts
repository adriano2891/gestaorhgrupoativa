import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { restGet, restPost, restPatch, getUserIdFromToken } from "@/lib/restClient";
import { toast } from "@/hooks/use-toast";
import { validarAfastamento } from "@/utils/esocialValidation";

export interface Afastamento {
  id: string;
  user_id: string;
  tipo: string;
  data_inicio: string;
  data_fim?: string;
  data_retorno?: string;
  dias_empresa: number;
  dias_inss: number;
  cid?: string;
  numero_beneficio?: string;
  cat_id?: string;
  documento_url?: string;
  observacoes?: string;
  status: string;
  suspende_periodo_aquisitivo: boolean;
  registrado_por?: string;
  created_at: string;
  profiles?: { nome: string; cargo?: string; departamento?: string };
}

const TIPOS_AFASTAMENTO = {
  medico: { label: "Afastamento Médico", diasEmpresa: 15, descricao: "Primeiros 15 dias pela empresa, após pelo INSS (Art. 60 Lei 8.213/91)" },
  licenca_maternidade: { label: "Licença Maternidade", diasEmpresa: 120, descricao: "120 dias (Art. 392 CLT) — estabilidade até 5 meses após parto" },
  licenca_paternidade: { label: "Licença Paternidade", diasEmpresa: 5, descricao: "5 dias (Art. 10 §1º ADCT) — 20 dias se Empresa Cidadã" },
  acidente_trabalho: { label: "Acidente de Trabalho", diasEmpresa: 15, descricao: "15 dias empresa + INSS (Art. 118 Lei 8.213/91) — estabilidade 12 meses após retorno" },
  previdenciario: { label: "Afastamento Previdenciário", diasEmpresa: 0, descricao: "Benefício INSS — suspensão do contrato" },
  servico_militar: { label: "Serviço Militar", diasEmpresa: 0, descricao: "Art. 472 CLT — suspensão do contrato" },
  outro: { label: "Outro", diasEmpresa: 0, descricao: "Outros tipos de afastamento" },
};

export { TIPOS_AFASTAMENTO };

export const useAfastamentos = (userId?: string) => {
  return useQuery({
    queryKey: ["afastamentos", userId],
    queryFn: async () => {
      let path = 'afastamentos?select=*&order=data_inicio.desc';
      if (userId) path += `&user_id=eq.${userId}`;

      const afastamentos: any[] = await restGet(path);
      if (!afastamentos || afastamentos.length === 0) return [] as Afastamento[];

      // Data enrichment: fetch profiles separately
      const userIds = [...new Set(afastamentos.map(a => a.user_id))];
      const profilesPath = `profiles?select=id,nome,cargo,departamento&id=in.(${userIds.join(',')})`;
      const profiles: any[] = await restGet(profilesPath);
      const profileMap = new Map(profiles.map(p => [p.id, p]));

      return afastamentos.map(a => ({
        ...a,
        profiles: profileMap.get(a.user_id) ? {
          nome: profileMap.get(a.user_id).nome,
          cargo: profileMap.get(a.user_id).cargo,
          departamento: profileMap.get(a.user_id).departamento,
        } : undefined,
      })) as Afastamento[];
    },
    retry: 2,
    staleTime: 1000 * 30,
  });
};

export const useCriarAfastamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      user_id: string;
      tipo: string;
      data_inicio: string;
      data_fim?: string;
      cid?: string;
      numero_beneficio?: string;
      cat_id?: string;
      documento_url?: string;
      observacoes?: string;
      suspende_periodo_aquisitivo?: boolean;
    }) => {
      // Validação eSocial S-2230
      const validacao = validarAfastamento({
        tipo: data.tipo,
        data_inicio: data.data_inicio,
        data_fim: data.data_fim,
        cid: data.cid,
      });

      if (!validacao.valido) {
        throw new Error(`Validação eSocial falhou: ${validacao.erros.join('; ')}`);
      }

      // Show warnings but don't block
      if (validacao.avisos.length > 0) {
        toast({
          title: "Avisos eSocial",
          description: validacao.avisos.join('\n'),
        });
      }

      const registradoPor = getUserIdFromToken();
      const tipoConfig = TIPOS_AFASTAMENTO[data.tipo as keyof typeof TIPOS_AFASTAMENTO];
      
      // Calculate dias_inss for medical leaves > 15 days
      let diasInss = 0;
      if (data.data_fim && data.data_inicio) {
        const totalDias = Math.ceil(
          (new Date(data.data_fim).getTime() - new Date(data.data_inicio).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
        const diasEmpresa = tipoConfig?.diasEmpresa || 0;
        diasInss = Math.max(0, totalDias - diasEmpresa);
      }

      const result = await restPost('afastamentos', {
        ...data,
        dias_empresa: tipoConfig?.diasEmpresa || 0,
        dias_inss: diasInss,
        registrado_por: registradoPor,
        status: 'ativo',
      });

      // Update profile status to 'afastado'
      await restPatch(`profiles?id=eq.${data.user_id}`, { status: 'afastado' });

      return Array.isArray(result) ? result[0] : result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["afastamentos"] });
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast({ title: "Afastamento registrado", description: "O afastamento foi registrado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
};

export const useEncerrarAfastamento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, user_id, data_retorno }: { id: string; user_id: string; data_retorno: string }) => {
      await restPatch(`afastamentos?id=eq.${id}`, {
        status: 'encerrado',
        data_retorno,
      });
      
      // Restore profile status to 'ativo'
      await restPatch(`profiles?id=eq.${user_id}`, { status: 'ativo' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["afastamentos"] });
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast({ title: "Afastamento encerrado", description: "O colaborador retornou às atividades." });
    },
    onError: (error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });
};
