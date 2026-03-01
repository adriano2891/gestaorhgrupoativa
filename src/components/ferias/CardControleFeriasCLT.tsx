import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Users, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getAccessToken = (): string | null => {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || SUPABASE_URL?.match(/\/\/([^.]+)/)?.[1];
    const raw = localStorage.getItem(`sb-${projectId}-auth-token`);
    if (raw) return JSON.parse(raw)?.access_token || null;
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

type StatusFerias = 'cumprindo' | 'prestes_a_vencer' | 'vencida' | 'em_ferias';

interface FuncionarioFerias {
  id: string;
  nome: string;
  cargo?: string;
  departamento?: string;
  data_admissao: string;
  fim_periodo_aquisitivo: string;
  fim_periodo_concessivo: string;
  status: StatusFerias;
  dias_para_vencer: number;
}

const calcularStatusFerias = (dataAdmissao: string, statusPerfil: string): {
  fimAquisitivo: Date;
  fimConcessivo: Date;
  status: StatusFerias;
  diasParaVencer: number;
} => {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const admissao = new Date(`${dataAdmissao}T12:00:00`);

  const fimAquisitivo = new Date(admissao);
  fimAquisitivo.setFullYear(fimAquisitivo.getFullYear() + 1);

  const fimConcessivo = new Date(admissao);
  fimConcessivo.setFullYear(fimConcessivo.getFullYear() + 2);

  const diasParaVencer = Math.ceil((fimConcessivo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

  // Se o status do perfil é "Em férias", mantém como ativo em férias
  const stNorm = (statusPerfil || 'ativo').toLowerCase().replace(/[_\s]+/g, '');
  if (stNorm === 'emferias' || stNorm === 'emférias') {
    return { fimAquisitivo, fimConcessivo, status: 'em_ferias', diasParaVencer };
  }

  let status: StatusFerias;
  if (hoje < fimAquisitivo) {
    status = 'cumprindo';
  } else if (hoje >= fimConcessivo) {
    status = 'vencida';
  } else if (diasParaVencer <= 60) {
    status = 'prestes_a_vencer';
  } else {
    status = 'cumprindo';
  }

  return { fimAquisitivo, fimConcessivo, status, diasParaVencer };
};

const useFuncionariosFerias = () => {
  return useQuery({
    queryKey: ["funcionarios-ferias-clt"],
    queryFn: async () => {
      try {
        // Get employee roles
        const roles: { user_id: string; role: string }[] = await restGet('user_roles?select=user_id,role');
        const employeeIds = new Set<string>();
        const adminIds = new Set<string>();
        (roles || []).forEach(r => {
          if (r.role === 'funcionario') employeeIds.add(r.user_id);
          if (['admin', 'gestor', 'rh'].includes(r.role)) adminIds.add(r.user_id);
        });
        const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
        if (targetIds.length === 0) return [] as FuncionarioFerias[];

        const idsParam = targetIds.map(id => `"${id}"`).join(',');
        const profiles: any[] = await restGet(`profiles?select=id,nome,cargo,departamento,data_admissao,created_at,status&id=in.(${idsParam})&order=nome.asc`);

        const activeProfiles = (profiles || []).filter((p: any) => {
          const st = (p.status || 'ativo').toLowerCase();
          return st !== 'demitido' && st !== 'pediu_demissao';
        });

        return activeProfiles.map((p: any) => {
          const dataAdmissao = p.data_admissao || (p.created_at ? p.created_at.split('T')[0] : null);
          if (!dataAdmissao) return null;

          const statusPerfil = p.status || 'ativo';
          const { fimAquisitivo, fimConcessivo, status, diasParaVencer } = calcularStatusFerias(dataAdmissao, statusPerfil);

          return {
            id: p.id,
            nome: p.nome,
            cargo: p.cargo,
            departamento: p.departamento,
            data_admissao: dataAdmissao,
            fim_periodo_aquisitivo: fimAquisitivo.toISOString().split('T')[0],
            fim_periodo_concessivo: fimConcessivo.toISOString().split('T')[0],
            status,
            dias_para_vencer: diasParaVencer,
          } as FuncionarioFerias;
        }).filter(Boolean) as FuncionarioFerias[];
      } catch (error) {
        console.error("Erro ao buscar funcionários para controle CLT:", error);
        return [] as FuncionarioFerias[];
      }
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 30, // Poll every 30s for near real-time updates
    refetchOnWindowFocus: true,
    retry: 2,
  });
};

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const getStatusConfig = (status: StatusFerias) => {
  switch (status) {
    case 'cumprindo':
      return { label: 'Cumprindo', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle };
    case 'prestes_a_vencer':
      return { label: 'Prestes a Vencer', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Clock };
    case 'vencida':
      return { label: 'Vencida', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300', icon: AlertTriangle };
    case 'em_ferias':
      return { label: 'Em Férias', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: CheckCircle };
  }
};

export const CardControleFeriasCLT = () => {
  const { data: funcionarios, isLoading } = useFuncionariosFerias();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  useEffect(() => {
    const channel = supabase
      .channel("ferias-clt-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["funcionarios-ferias-clt"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_roles" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["funcionarios-ferias-clt"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
  const filtered = useMemo(() => {
    if (!funcionarios) return [];
    return funcionarios.filter(f => {
      const nameMatch = f.nome.toLowerCase().includes(searchTerm.toLowerCase());
      const statusMatch = statusFilter === "todos" || f.status === statusFilter;
      return nameMatch && statusMatch;
    });
  }, [funcionarios, searchTerm, statusFilter]);

  const counts = useMemo(() => {
    if (!funcionarios) return { cumprindo: 0, prestes_a_vencer: 0, vencida: 0 };
    return {
      cumprindo: funcionarios.filter(f => f.status === 'cumprindo').length,
      prestes_a_vencer: funcionarios.filter(f => f.status === 'prestes_a_vencer').length,
      vencida: funcionarios.filter(f => f.status === 'vencida').length,
    };
  }, [funcionarios]);

  if (isLoading) {
    return <Card><CardContent className="p-6"><Skeleton className="h-64" /></CardContent></Card>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Controle de Férias – CLT (Art. 129-153)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Previsão de férias com base no período aquisitivo e concessivo
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status counters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 rounded-lg border p-3 bg-green-50 dark:bg-green-950/30">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-muted-foreground">Cumprindo</p>
              <p className="text-xl font-bold text-green-700 dark:text-green-400">{counts.cumprindo}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3 bg-yellow-50 dark:bg-yellow-950/30">
            <Clock className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-sm text-muted-foreground">Prestes a Vencer</p>
              <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{counts.prestes_a_vencer}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border p-3 bg-red-50 dark:bg-red-950/30">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm text-muted-foreground">Vencida</p>
              <p className="text-xl font-bold text-red-700 dark:text-red-400">{counts.vencida}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="cumprindo">🟢 Cumprindo</SelectItem>
              <SelectItem value="prestes_a_vencer">🟡 Prestes a Vencer</SelectItem>
              <SelectItem value="vencida">🔴 Vencida</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Funcionário</TableHead>
                <TableHead>Data de Admissão</TableHead>
                <TableHead>Fim Per. Aquisitivo</TableHead>
                <TableHead>Fim Per. Concessivo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum funcionário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((func) => {
                  const statusConfig = getStatusConfig(func.status);
                  return (
                    <TableRow key={func.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{func.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {func.cargo || '-'} {func.departamento ? `/ ${func.departamento}` : ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(func.data_admissao)}</TableCell>
                      <TableCell>{formatDate(func.fim_periodo_aquisitivo)}</TableCell>
                      <TableCell>{formatDate(func.fim_periodo_concessivo)}</TableCell>
                      <TableCell>
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
