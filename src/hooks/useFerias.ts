import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// supabase SDK bypassed - using direct REST calls
import { toast } from "@/hooks/use-toast";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getAccessToken = (): string | null => {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1];
    const raw = localStorage.getItem(`sb-${projectId}-auth-token`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.access_token || null;
    }
  } catch {}
  return null;
};

const restGet = async (path: string) => {
  const token = getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token || SUPABASE_KEY}`,
      'Accept': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`REST ${res.status}`);
  return res.json();
};

const restPatch = async (path: string, body: any) => {
  const token = getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token || SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`REST PATCH ${res.status}`);
  return res.json();
};

const restPost = async (path: string, body: any) => {
  const token = getAccessToken();
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${token || SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`REST POST ${res.status}`);
  return res.json();
};

export interface PeriodoAquisitivo {
  id: string;
  user_id: string;
  data_inicio: string;
  data_fim: string;
  dias_direito: number;
  dias_usados: number;
  dias_disponiveis: number;
  created_at: string;
  updated_at: string;
}

export interface SolicitacaoFerias {
  id: string;
  user_id: string;
  periodo_aquisitivo_id: string;
  data_inicio: string;
  data_fim: string;
  dias_solicitados: number;
  tipo: 'ferias' | 'ferias_coletivas' | 'abono_pecuniario';
  status: 'pendente' | 'aprovado' | 'em_andamento' | 'reprovado' | 'concluido' | 'cancelado';
  observacao?: string;
  aprovado_por?: string;
  data_aprovacao?: string;
  motivo_reprovacao?: string;
  notificado_em?: string;
  visualizada_admin: boolean;
  created_at: string;
  updated_at: string;
  profiles?: {
    nome: string;
    cargo?: string;
    departamento?: string;
  };
}

export const useSolicitacoesFerias = (filters?: {
  status?: string;
  departamento?: string;
  dataInicio?: string;
  dataFim?: string;
  apenasNovas?: boolean;
}) => {
  return useQuery({
    queryKey: ["solicitacoes-ferias", filters],
    staleTime: 0,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
    retry: 2,
    queryFn: async () => {
      try {
        let path = 'solicitacoes_ferias?select=*&order=created_at.desc';
        if (filters?.status) path += `&status=eq.${filters.status}`;
        if (filters?.dataInicio) path += `&data_inicio=gte.${filters.dataInicio}`;
        if (filters?.dataFim) path += `&data_fim=lte.${filters.dataFim}`;
        if (filters?.apenasNovas) path += `&visualizada_admin=eq.false`;

        const solicitacoes: any[] = await restGet(path);
        if (!solicitacoes || solicitacoes.length === 0) return [] as SolicitacaoFerias[];

        // Fetch profiles separately
        const userIds = [...new Set(solicitacoes.map(s => s.user_id))];
        const profilesPath = `profiles?select=id,nome,cargo,departamento,status&id=in.(${userIds.join(',')})`;
        const profiles: any[] = await restGet(profilesPath);
        const profileMap = new Map(profiles.map(p => [p.id, p]));

        // Map and filter
        let result = solicitacoes.map(s => ({
          ...s,
          profiles: profileMap.get(s.user_id) ? {
            nome: profileMap.get(s.user_id).nome,
            cargo: profileMap.get(s.user_id).cargo,
            departamento: profileMap.get(s.user_id).departamento,
          } : undefined,
        })).filter(s => {
          const prof = profileMap.get(s.user_id);
          return prof?.status !== 'demitido' && prof?.status !== 'pediu_demissao';
        });

        if (filters?.departamento) {
          result = result.filter(s => s.profiles?.departamento === filters.departamento);
        }

        return result as SolicitacaoFerias[];
      } catch (error) {
        console.error("Erro em useSolicitacoesFerias:", error);
        return [] as SolicitacaoFerias[];
      }
    },
  });
};

export const useMetricasFerias = () => {
  return useQuery({
    queryKey: ["metricas-ferias"],
    staleTime: 0,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
    retry: 2,
    queryFn: async () => {
      try {
        const [solicitacoes, roles, profiles, periodos] = await Promise.all([
          restGet('solicitacoes_ferias?select=status,data_inicio,data_fim,user_id'),
          restGet('user_roles?select=user_id,role'),
          restGet('profiles?select=id,status,data_admissao,created_at'),
          restGet('periodos_aquisitivos?select=dias_disponiveis'),
        ]);

        const employeeIds = new Set<string>();
        const adminLikeIds = new Set<string>();

        (roles || []).forEach((r: any) => {
          if (r.role === 'funcionario') employeeIds.add(r.user_id);
          if (['admin', 'gestor', 'rh'].includes(r.role)) adminLikeIds.add(r.user_id);
        });

        const funcionariosAtivos = (profiles || []).filter((p: any) => {
          const st = (p.status || 'ativo').toLowerCase();
          return employeeIds.has(p.id) && !adminLikeIds.has(p.id) && st !== 'demitido' && st !== 'pediu_demissao';
        });

        const activeIds = new Set(funcionariosAtivos.map((p: any) => p.id));
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        const hojeISO = hoje.toISOString().split('T')[0];

        const cltStatusByUser = new Map<string, 'cumprindo' | 'prestes_a_vencer' | 'vencida' | 'em_ferias'>();

        funcionariosAtivos.forEach((p: any) => {
          const dataBase = p.data_admissao || (p.created_at ? String(p.created_at).split('T')[0] : null);
          if (!dataBase) return;

          // Check if employee status is "Em férias"
          const stNorm = (p.status || 'ativo').toLowerCase().replace(/[_\s]+/g, '');
          if (stNorm === 'emferias' || stNorm === 'emférias') {
            cltStatusByUser.set(p.id, 'em_ferias');
            return;
          }

          const admissao = new Date(`${dataBase}T12:00:00`);
          const fimAquisitivo = new Date(admissao);
          fimAquisitivo.setFullYear(fimAquisitivo.getFullYear() + 1);
          const fimConcessivo = new Date(admissao);
          fimConcessivo.setFullYear(fimConcessivo.getFullYear() + 2);

          const diasParaVencer = Math.ceil((fimConcessivo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

          let status: 'cumprindo' | 'prestes_a_vencer' | 'vencida' = 'cumprindo';
          if (hoje >= fimConcessivo) status = 'vencida';
          else if (hoje < fimAquisitivo) status = 'cumprindo';
          else if (diasParaVencer <= 60) status = 'prestes_a_vencer';

          cltStatusByUser.set(p.id, status);
        });

        const solicitacoesAtivas = (solicitacoes || []).filter((s: any) => activeIds.has(s.user_id));

        const pendentes = solicitacoesAtivas.filter((s: any) => s.status === "pendente").length;

        const colaboradoresFerias = new Set<string>();
        solicitacoesAtivas.forEach((s: any) => {
          if (s.status === "em_andamento" || (s.status === "aprovado" && s.data_inicio <= hojeISO && s.data_fim >= hojeISO)) {
            colaboradoresFerias.add(s.user_id);
          }
        });
        // Employees with profile status "Em férias" count as on vacation
        cltStatusByUser.forEach((status, userId) => {
          if (status === 'em_ferias') colaboradoresFerias.add(userId);
        });

        const proximasFerias = new Set<string>();
        solicitacoesAtivas.forEach((s: any) => {
          if (s.status === "aprovado" && s.data_inicio > hojeISO) {
            proximasFerias.add(s.user_id);
          }
        });
        cltStatusByUser.forEach((status, userId) => {
          if (status === 'prestes_a_vencer') proximasFerias.add(userId);
        });

        const vencidas = Array.from(cltStatusByUser.values()).filter((status) => status === 'vencida').length;

        const saldoMedio = periodos?.length
          ? Math.round(periodos.reduce((acc: number, p: any) => acc + (p.dias_disponiveis || 0), 0) / periodos.length)
          : 0;

        return {
          pendentes,
          emAndamento: colaboradoresFerias.size,
          proximas: proximasFerias.size,
          vencidas,
          saldoMedio,
        };
      } catch (error) {
        console.error("Erro em useMetricasFerias:", error);
        return { pendentes: 0, emAndamento: 0, proximas: 0, vencidas: 0, saldoMedio: 0 };
      }
    },
  });
};

export const useAtualizarSolicitacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id, status, observacao, motivo_reprovacao,
    }: { id: string; status: string; observacao?: string; motivo_reprovacao?: string; }) => {
      const updateData: any = { status, observacao };

      if (status === "aprovado") {
        updateData.data_aprovacao = new Date().toISOString();
        const token = getAccessToken();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            updateData.aprovado_por = payload.sub;
          } catch {}
        }
      }

      if (status === "reprovado" && motivo_reprovacao) {
        updateData.motivo_reprovacao = motivo_reprovacao;
      }

      const data = await restPatch(`solicitacoes_ferias?id=eq.${id}`, updateData);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
      toast({ title: "Sucesso", description: "Solicitação atualizada com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: "Erro ao atualizar solicitação: " + error.message, variant: "destructive" });
    },
  });
};

export const useNotificarFuncionario = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (solicitacaoId: string) => {
      const data = await restPatch(`solicitacoes_ferias?id=eq.${solicitacaoId}`, {
        notificado_em: new Date().toISOString(),
      });
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      toast({ title: "Notificação enviada", description: "Funcionário notificado com sucesso" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: "Erro ao enviar notificação: " + error.message, variant: "destructive" });
    },
  });
};

export const useMarcarComoVisualizada = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (solicitacaoId: string) => {
      const data = await restPatch(`solicitacoes_ferias?id=eq.${solicitacaoId}`, {
        visualizada_admin: true,
      });
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
    },
  });
};

export const useCriarSolicitacaoFerias = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      periodo_aquisitivo_id, data_inicio, data_fim, dias_solicitados,
      tipo = 'ferias', observacao,
    }: {
      periodo_aquisitivo_id: string; data_inicio: string; data_fim: string;
      dias_solicitados: number; tipo?: 'ferias' | 'ferias_coletivas' | 'abono_pecuniario';
      observacao?: string;
    }) => {
      const token = getAccessToken();
      let userId: string | null = null;
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          userId = payload.sub;
        } catch {}
      }
      if (!userId) throw new Error("Usuário não autenticado");

      const data = await restPost('solicitacoes_ferias', {
        user_id: userId,
        periodo_aquisitivo_id,
        data_inicio,
        data_fim,
        dias_solicitados,
        tipo,
        observacao,
        status: 'pendente',
      });

      // Criar chamado automático
      const tipoLabel = tipo === 'ferias' ? 'Férias' : tipo === 'ferias_coletivas' ? 'Férias Coletivas' : 'Abono Pecuniário';
      const assuntoChamado = `Solicitação de ${tipoLabel} - ${data_inicio} a ${data_fim}`;
      const mensagemChamado = `Solicitação automática de ${tipoLabel}.\n\nPeríodo: ${data_inicio} a ${data_fim}\nDias solicitados: ${dias_solicitados}${observacao ? `\nObservação: ${observacao}` : ''}`;

      try {
        const chamados = await restPost('chamados_suporte', {
          user_id: userId, categoria: "ferias", assunto: assuntoChamado,
        });
        const chamado = Array.isArray(chamados) ? chamados[0] : chamados;
        if (chamado) {
          await restPost('mensagens_chamado', {
            chamado_id: chamado.id, remetente_id: userId, conteudo: mensagemChamado,
          });
        }
      } catch (e) {
        console.error("Erro ao criar chamado de suporte para férias:", e);
      }

      return Array.isArray(data) ? data[0] : data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias-portal"] });
      queryClient.invalidateQueries({ queryKey: ["periodos-aquisitivos-portal"] });
      queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
      toast({ title: "Solicitação enviada", description: "Sua solicitação de férias foi enviada para aprovação" });
    },
    onError: (error) => {
      toast({ title: "Erro", description: "Erro ao solicitar férias: " + error.message, variant: "destructive" });
    },
  });
};
