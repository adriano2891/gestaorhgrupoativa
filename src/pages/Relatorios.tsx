import { useState, useMemo, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { BarChart3, Download, Users, Clock, FileText, TrendingDown, Briefcase, Receipt, AlertCircle, CalendarDays, Heart, HardHat } from "lucide-react";
import { ReportSelector } from "@/components/relatorios/ReportSelector";
import { ReportViewer } from "@/components/relatorios/ReportViewer";
import { ReportFilters } from "@/components/relatorios/ReportFilters";
import { ExportOptions } from "@/components/relatorios/ExportOptions";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useASOs, useEPIEntregas, useCATs, useCIPAMembros } from "@/hooks/useSST";
import { useRegistrosPonto } from "@/hooks/useRegistrosPonto";
import { useHolerites } from "@/hooks/useHolerites";
import { useSolicitacoesFerias } from "@/hooks/useFerias";
import { supabase } from "@/integrations/supabase/client";
import { restGet } from "@/lib/restClient";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

const reportOptions = [
  { id: "funcionarios", name: "Relatório de Funcionários", icon: Users, category: "Gestão de Pessoas", description: "Informações completas dos colaboradores" },
  { id: "ferias", name: "Férias e Afastamentos", icon: Briefcase, category: "Gestão de Pessoas", description: "Controle de férias, licenças e afastamentos" },
  { id: "faltas", name: "Faltas e Atrasos", icon: AlertCircle, category: "Frequência", description: "Análise de ausências e pontualidade" },
  { id: "pontos", name: "Pontos Registrados", icon: Clock, category: "Frequência", description: "Registro detalhado de ponto eletrônico" },
  { id: "turnover", name: "Turnover", icon: TrendingDown, category: "Indicadores", description: "Taxa de rotatividade e movimentações" },
  { id: "absenteismo", name: "Absenteísmo", icon: CalendarDays, category: "Indicadores", description: "Índices e tendências de ausências" },
  
  { id: "beneficios", name: "Benefícios", icon: Heart, category: "Bem-estar", description: "Relatório de benefícios por funcionário" },
  { id: "sst", name: "Saúde e Segurança", icon: HardHat, category: "Bem-estar", description: "Relatório de SST, ASOs, EPIs e CATs" },
  { id: "holerites", name: "Folha de Pagamento", icon: FileText, category: "Custos", description: "Resumo da folha com proventos, descontos, líquido, encargos e benefícios" },
];

const Relatorios = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({ departamento: "todos" });
  const [generatedData, setGeneratedData] = useState<any>(null);

  const queryClient = useQueryClient();

  // Realtime: atualiza dados do turnover quando profiles ou user_roles mudam
  useEffect(() => {
    const channel = supabase
      .channel('relatorios-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        queryClient.invalidateQueries({ queryKey: ["todos-funcionarios-turnover"] });
        queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => {
        queryClient.invalidateQueries({ queryKey: ["todos-funcionarios-turnover"] });
        queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const { data: funcionarios } = useFuncionarios();
  const { data: todosFuncionarios } = useQuery({
    queryKey: ["todos-funcionarios-turnover"],
    queryFn: async () => {
      // Step 1: Get all roles via REST (same method that works in useFuncionarios)
      const roles: { user_id: string; role: string }[] = await restGet('user_roles?select=user_id,role');

      const employeeIds = new Set<string>();
      const adminIds = new Set<string>();
      (roles || []).forEach(r => {
        if (r.role === 'funcionario') employeeIds.add(r.user_id);
        if (['admin', 'gestor', 'rh'].includes(r.role)) adminIds.add(r.user_id);
      });
      const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
      if (targetIds.length === 0) return [];

      // Step 2: Fetch ALL profiles (no tipo_perfil or status filter for turnover)
      const idsParam = targetIds.map(id => `"${id}"`).join(',');
      const profiles: any[] = await restGet(`profiles?select=*&id=in.(${idsParam})&order=nome.asc&limit=2000`);

      return (profiles || []) as any[];
    },
    retry: 2,
    staleTime: 1000 * 15,
  });
  const { data: registros } = useRegistrosPonto();
  const { data: holerites } = useHolerites();
  const { data: ferias } = useSolicitacoesFerias();
  const { data: beneficios } = useQuery({
    queryKey: ["beneficios-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beneficios_funcionario")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });
  const { data: afastamentos } = useQuery({
    queryKey: ["afastamentos-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("afastamentos")
        .select("*");
      if (error) throw error;
      return data || [];
    },
  });
  const { data: asos } = useASOs();
  const { data: cats } = useCATs();
  const { data: epiEntregas } = useEPIEntregas();
  const { data: cipaMembros } = useCIPAMembros();

  const selectedReportInfo = reportOptions.find(r => r.id === selectedReport);

  const uniqueEscalas = useMemo(() => {
    if (!funcionarios) return [];
    return [...new Set(funcionarios.map((f: any) => f.escala).filter(Boolean))];
  }, [funcionarios]);

  const uniqueTurnos = useMemo(() => {
    if (!funcionarios) return [];
    return [...new Set(funcionarios.map((f: any) => f.turno).filter(Boolean))];
  }, [funcionarios]);

  const filterByDateRange = (items: any[], dateField: string) => {
    if (!items) return [];
    let filtered = items;
    if (filters.dataInicio) {
      filtered = filtered.filter(i => i[dateField] >= filters.dataInicio);
    }
    if (filters.dataFim) {
      filtered = filtered.filter(i => i[dateField] <= filters.dataFim);
    }
    if (filters.departamento && filters.departamento !== "todos") {
      filtered = filtered.filter(i => {
        const dept = i.departamento || i.profiles?.departamento || "";
        return dept.toLowerCase().includes(filters.departamento.toLowerCase());
      });
    }
    return filtered;
  };

  const generateReport = () => {
    const now = new Date();
    const periodoLabel = filters.dataInicio && filters.dataFim
      ? `${filters.dataInicio} a ${filters.dataFim}`
      : "Todos os períodos";

    switch (selectedReport) {
      case "funcionarios": {
        let data = funcionarios || [];
        if (filters.departamento && filters.departamento !== "todos") {
          data = data.filter((f: any) => f.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }
        if (filters.status && filters.status !== "todos") {
          data = data.filter((f: any) => f.status?.toLowerCase().includes(filters.status.toLowerCase()));
        }
        if (filters.cargo && filters.cargo !== "todos") {
          data = data.filter((f: any) => f.cargo?.toLowerCase().includes(filters.cargo.toLowerCase()));
        }
        const ativos = data.filter((f: any) => {
          const st = (f.status || "ativo").toLowerCase();
          return st === "ativo" || st === "em_ferias";
        }).length;
        const deptCount: Record<string, number> = {};
        data.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          deptCount[d] = (deptCount[d] || 0) + 1;
        });
        const statusCount: Record<string, number> = {};
        data.forEach((f: any) => {
          const s = f.status || "ativo";
          statusCount[s] = (statusCount[s] || 0) + 1;
        });
        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Total Funcionários": data.length,
            "Ativos": ativos,
            "Inativos": data.length - ativos,
            "Departamentos": Object.keys(deptCount).length,
          },
          charts: [
            {
              type: "bar",
              title: "1. Funcionários por Departamento",
              description: "Distribuição dos colaboradores por departamento",
              data: Object.entries(deptCount).map(([dept, count]) => ({ departamento: dept, valor: count })),
              dataName: "Funcionários",
            },
            {
              type: "pie",
              title: "2. Distribuição por Status",
              description: "Status atual dos colaboradores",
              data: Object.entries(statusCount).map(([status, count]) => ({ status, valor: count })),
            },
          ],
          details: data.slice(0, 100).map((f: any) => ({
            Nome: f.nome || "-",
            Cargo: f.cargo || "-",
            Departamento: f.departamento || "-",
            Status: f.status || "ativo",
            "Data Admissão": f.data_admissao || "-",
          })),
        });
        break;
      }

      case "ferias": {
        let data = ferias || [];
        if (filters.dataInicio) data = data.filter((f: any) => f.data_inicio >= filters.dataInicio);
        if (filters.dataFim) data = data.filter((f: any) => f.data_inicio <= filters.dataFim);
        if (filters.departamento && filters.departamento !== "todos") {
          data = data.filter((f: any) => f.profiles?.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }
        const statusCount: Record<string, number> = {};
        data.forEach((f: any) => {
          const s = f.status || "pendente";
          const label = s === "aprovado" ? "Aprovadas" : s === "pendente" ? "Pendentes" : s === "reprovado" ? "Reprovadas" : s === "em_andamento" ? "Em Andamento" : s === "concluido" ? "Concluídas" : s === "cancelado" ? "Canceladas" : s;
          statusCount[label] = (statusCount[label] || 0) + 1;
        });

        // Enrich with funcionarios data for employees without vacation requests
        const empComFerias = new Set(data.map((f: any) => f.user_id));
        const funcsAtivos = (funcionarios || []).filter((f: any) => {
          const st = (f.status || "ativo").toLowerCase();
          return st !== "demitido" && st !== "pediu_demissao";
        });
        const semSolicitacao = funcsAtivos.filter((f: any) => !empComFerias.has(f.id));

        const deptFerias: Record<string, number> = {};
        data.forEach((f: any) => {
          const d = f.profiles?.departamento || "Sem Departamento";
          deptFerias[d] = (deptFerias[d] || 0) + 1;
        });

        const tipoCount: Record<string, number> = {};
        data.forEach((f: any) => {
          const t = f.tipo === "ferias" ? "Férias" : f.tipo === "ferias_coletivas" ? "Férias Coletivas" : f.tipo === "abono_pecuniario" ? "Abono Pecuniário" : f.tipo || "Férias";
          tipoCount[t] = (tipoCount[t] || 0) + 1;
        });

        const totalDias = data.reduce((acc: number, f: any) => acc + (f.dias_solicitados || 0), 0);

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Período": periodoLabel,
            "Total Solicitações": data.length,
            "Aprovadas": statusCount["Aprovadas"] || 0,
            "Pendentes": statusCount["Pendentes"] || 0,
            "Em Andamento": statusCount["Em Andamento"] || 0,
            "Concluídas": statusCount["Concluídas"] || 0,
            "Reprovadas": statusCount["Reprovadas"] || 0,
            "Total Dias Solicitados": totalDias,
            "Sem Solicitação": semSolicitacao.length,
          },
          charts: [
            {
              type: "pie",
              title: "Status das Solicitações",
              description: "Distribuição por status",
              data: Object.entries(statusCount).map(([status, count]) => ({ status, valor: count })),
            },
            {
              type: "bar",
              title: "Solicitações por Departamento",
              description: "Quantidade de solicitações de férias por departamento",
              data: Object.entries(deptFerias).map(([dept, count]) => ({ departamento: dept, valor: count })),
              dataName: "Solicitações",
            },
            {
              type: "pie",
              title: "Tipo de Solicitação",
              description: "Distribuição por tipo",
              data: Object.entries(tipoCount).map(([tipo, count]) => ({ tipo, valor: count })),
            },
          ],
          details: data.slice(0, 100).map((f: any) => ({
            Funcionário: f.profiles?.nome || "-",
            Cargo: f.profiles?.cargo || "-",
            Departamento: f.profiles?.departamento || "-",
            "Data Início": f.data_inicio || "-",
            "Data Fim": f.data_fim || "-",
            "Dias": f.dias_solicitados || "-",
            Status: f.status || "-",
            Tipo: f.tipo === "ferias" ? "Férias" : f.tipo === "ferias_coletivas" ? "Férias Coletivas" : f.tipo === "abono_pecuniario" ? "Abono Pecuniário" : f.tipo || "Férias",
          })),
        });
        break;
      }

      case "faltas":
      case "pontos":
      case "absenteismo": {
        const funcIdsSet = new Set((funcionarios || []).map((f: any) => f.id));
        let data = (registros || []).filter((r: any) => funcIdsSet.has(r.user_id));
        if (filters.dataInicio) data = data.filter((r: any) => r.data >= filters.dataInicio);
        if (filters.dataFim) data = data.filter((r: any) => r.data <= filters.dataFim);
        if (filters.departamento && filters.departamento !== "todos") {
          data = data.filter((r: any) => r.profiles?.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }
        if (filters.colaborador && filters.colaborador !== "todos") {
          data = data.filter((r: any) => r.user_id === filters.colaborador);
        }
        if (filters.escala && filters.escala !== "todos") {
          const funcIds = new Set((funcionarios || []).filter((f: any) => f.escala === filters.escala).map((f: any) => f.id));
          data = data.filter((r: any) => funcIds.has(r.user_id));
        }
        if (filters.turno && filters.turno !== "todos") {
          const funcIds = new Set((funcionarios || []).filter((f: any) => f.turno === filters.turno).map((f: any) => f.id));
          data = data.filter((r: any) => funcIds.has(r.user_id));
        }

        const funcMap = new Map((funcionarios || []).map((f: any) => [f.id, f]));

        // Helper: parse time string "HH:MM:SS" to hours
        const parseHoras = (str: string | null | undefined): number => {
          if (!str || str === "00:00:00" || str === "-") return 0;
          const parts = str.split(":");
          return (parseInt(parts[0]) || 0) + (parseInt(parts[1]) || 0) / 60 + (parseInt(parts[2]) || 0) / 3600;
        };

        // Helper: get carga horária prevista from employee
        const getCargaPrevista = (userId: string): number => {
          const func = funcMap.get(userId);
          const carga = parseFloat(func?.carga_horaria) || 8;
          return carga;
        };

        // Helper: detect early departure
        const isSaidaAntecipada = (r: any): boolean => {
          if (!r.entrada || !r.saida) return false;
          try {
            const entrada = new Date(r.entrada);
            const saida = new Date(r.saida);
            const horasTrabalhadas = (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60);
            const cargaPrevista = getCargaPrevista(r.user_id);
            return horasTrabalhadas < (cargaPrevista - 0.5); // 30min tolerance
          } catch { return false; }
        };

        // Helper: detect late arrival
        const isAtraso = (r: any): boolean => {
          if (!r.entrada) return false;
          try {
            const entradaDate = new Date(r.entrada);
            const hora = entradaDate.getHours();
            const minutos = entradaDate.getMinutes();
            return hora > 8 || (hora === 8 && minutos > 10);
          } catch { return false; }
        };

        // Helper: format time diff as "Xh Ymin"
        const formatTempo = (horasDecimais: number): string => {
          const h = Math.floor(horasDecimais);
          const m = Math.round((horasDecimais - h) * 60);
          return `${h}h${m > 0 ? String(m).padStart(2, '0') + 'min' : ''}`;
        };

        if (selectedReport === "faltas") {
          const faltas = data.filter((r: any) => !r.entrada);
          const atrasosArr = data.filter((r: any) => isAtraso(r));
          const saidasAntecipadas = data.filter((r: any) => isSaidaAntecipada(r));
          const totalOcorrencias = faltas.length + atrasosArr.length + saidasAntecipadas.length;

          // Build occurrences list with types matching reference
          const ocorrencias: any[] = [];
          faltas.forEach((r: any) => {
            const carga = getCargaPrevista(r.user_id);
            ocorrencias.push({
              nome: r.profiles?.nome || funcMap.get(r.user_id)?.nome || "-",
              departamento: r.profiles?.departamento || funcMap.get(r.user_id)?.departamento || "-",
              data: r.data ? format(new Date(r.data + 'T12:00:00'), 'dd/MM/yyyy') : "-",
              tipo: "Falta Injustificada",
              "tempo Apurado": formatTempo(carga),
              "hora Entrada": "-",
            });
          });
          atrasosArr.forEach((r: any) => {
            let horaStr = "-";
            let tempoAtraso = "0h";
            try {
              const d = new Date(r.entrada);
              horaStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              const minutosAtraso = (d.getHours() - 8) * 60 + d.getMinutes();
              tempoAtraso = formatTempo(minutosAtraso / 60);
            } catch {}
            ocorrencias.push({
              nome: r.profiles?.nome || funcMap.get(r.user_id)?.nome || "-",
              departamento: r.profiles?.departamento || funcMap.get(r.user_id)?.departamento || "-",
              data: r.data ? format(new Date(r.data + 'T12:00:00'), 'dd/MM/yyyy') : "-",
              tipo: "Atraso",
              "tempo Apurado": tempoAtraso,
              "hora Entrada": horaStr,
            });
          });
          saidasAntecipadas.forEach((r: any) => {
            let horaStr = "-";
            let tempoSaida = "0h";
            try {
              const entrada = new Date(r.entrada);
              const saida = new Date(r.saida);
              const carga = getCargaPrevista(r.user_id);
              const horasTrab = (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60);
              tempoSaida = formatTempo(carga - horasTrab);
              horaStr = `${String(entrada.getHours()).padStart(2, "0")}:${String(entrada.getMinutes()).padStart(2, "0")}`;
            } catch {}
            ocorrencias.push({
              nome: r.profiles?.nome || funcMap.get(r.user_id)?.nome || "-",
              departamento: r.profiles?.departamento || funcMap.get(r.user_id)?.departamento || "-",
              data: r.data ? format(new Date(r.data + 'T12:00:00'), 'dd/MM/yyyy') : "-",
              tipo: "Saída Antecipada",
              "tempo Apurado": tempoSaida,
              "hora Entrada": horaStr,
            });
          });

          // Charts data by department
          const deptOcorrencias: Record<string, { faltas: number; atrasos: number; saidas: number }> = {};
          ocorrencias.forEach((o) => {
            const d = o.departamento;
            if (!deptOcorrencias[d]) deptOcorrencias[d] = { faltas: 0, atrasos: 0, saidas: 0 };
            if (o.tipo === "Falta Injustificada") deptOcorrencias[d].faltas++;
            else if (o.tipo === "Atraso") deptOcorrencias[d].atrasos++;
            else deptOcorrencias[d].saidas++;
          });

          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Total de Faltas": faltas.length,
              "Total de Atrasos": atrasosArr.length,
              "Saídas Antecipadas": saidasAntecipadas.length,
              "Total Registros Analisados": totalOcorrencias,
              "Taxa de Ocorrências": data.length > 0 ? `${((totalOcorrencias / data.length) * 100).toFixed(1)}%` : "0.0%",
            },
            charts: [
              {
                type: "pie",
                title: "1. Proporção por Tipo de Ocorrência",
                description: "Distribuição entre faltas, atrasos e saídas antecipadas",
                data: [
                  { tipo: "Faltas", valor: faltas.length },
                  { tipo: "Atrasos", valor: atrasosArr.length },
                  { tipo: "Saídas Antecipadas", valor: saidasAntecipadas.length },
                ].filter(d => d.valor > 0),
              },
              {
                type: "bar",
                title: "2. Ocorrências por Departamento",
                description: "Total de faltas, atrasos e saídas antecipadas por setor",
                data: Object.entries(deptOcorrencias).map(([dept, stats]) => ({
                  departamento: dept,
                  Faltas: stats.faltas,
                  Atrasos: stats.atrasos,
                  "Saídas Antecipadas": stats.saidas,
                })),
                insight: "Setores com mais ocorrências podem necessitar de acompanhamento específico.",
              },
            ],
            details: ocorrencias.slice(0, 100),
          });
        } else if (selectedReport === "absenteismo") {
          // Absenteísmo: (Horas de ausência ÷ Horas previstas) × 100
          const totalColaboradores = new Set(data.map((r: any) => r.user_id)).size;

          // Afastamentos no período
          const afastamentosData = afastamentos || [];
          const afastamentosPorFunc: Record<string, number> = {};
          afastamentosData.forEach((a: any) => {
            if (!a.data_inicio) return;
            if (filters.dataInicio && a.data_inicio < filters.dataInicio) return;
            if (filters.dataFim && a.data_fim && a.data_fim > filters.dataFim) return;
            const dias = a.dias_empresa || (a.data_fim ? differenceInDays(new Date(a.data_fim), new Date(a.data_inicio)) + 1 : 1);
            afastamentosPorFunc[a.user_id] = (afastamentosPorFunc[a.user_id] || 0) + dias;
          });

          const empStats: Record<string, { nome: string; dept: string; horasPrevistas: number; horasPerdidas: number; faltas: number; atrasos: number; afastamentoDias: number }> = {};
          data.forEach((r: any) => {
            const uid = r.user_id;
            const carga = getCargaPrevista(uid);
            if (!empStats[uid]) {
              empStats[uid] = {
                nome: r.profiles?.nome || funcMap.get(uid)?.nome || "-",
                dept: r.profiles?.departamento || funcMap.get(uid)?.departamento || "N/I",
                horasPrevistas: 0,
                horasPerdidas: 0,
                faltas: 0,
                atrasos: 0,
                afastamentoDias: afastamentosPorFunc[uid] || 0,
              };
            }
            empStats[uid].horasPrevistas += carga;
            if (!r.entrada) {
              empStats[uid].horasPerdidas += carga;
              empStats[uid].faltas++;
            } else {
              const horasTrab = parseHoras(r.total_horas);
              if (horasTrab < carga) {
                empStats[uid].horasPerdidas += (carga - horasTrab);
              }
              if (isAtraso(r)) {
                empStats[uid].atrasos++;
              }
            }
          });

          // Add afastamento hours to perdidas
          Object.entries(afastamentosPorFunc).forEach(([uid, dias]) => {
            if (empStats[uid]) {
              const carga = getCargaPrevista(uid);
              empStats[uid].horasPerdidas += dias * carga;
              empStats[uid].horasPrevistas += dias * carga;
            }
          });

          const empList = Object.values(empStats);
          const totalHorasPrevistas = empList.reduce((a, e) => a + e.horasPrevistas, 0);
          const totalHorasPerdidas = empList.reduce((a, e) => a + e.horasPerdidas, 0);
          const totalFaltas = empList.reduce((a, e) => a + e.faltas, 0);
          const totalAtrasos = empList.reduce((a, e) => a + e.atrasos, 0);
          const totalAfastamentoDias = empList.reduce((a, e) => a + e.afastamentoDias, 0);
          const taxaMedia = totalHorasPrevistas > 0 ? ((totalHorasPerdidas / totalHorasPrevistas) * 100) : 0;

          // Department stats
          const deptAbsStats: Record<string, { previstas: number; perdidas: number; colaboradores: number }> = {};
          empList.forEach(e => {
            if (!deptAbsStats[e.dept]) deptAbsStats[e.dept] = { previstas: 0, perdidas: 0, colaboradores: 0 };
            deptAbsStats[e.dept].previstas += e.horasPrevistas;
            deptAbsStats[e.dept].perdidas += e.horasPerdidas;
            deptAbsStats[e.dept].colaboradores++;
          });

          const deptHorasPerdidas = Object.entries(deptAbsStats)
            .filter(([, s]) => s.perdidas > 0)
            .map(([dept, s]) => ({ departamento: dept, valor: parseFloat(s.perdidas.toFixed(1)) }));

          // Análise automática
          let analiseAbs = "";
          if (taxaMedia === 0) {
            analiseAbs = "Nenhuma ausência registrada no período. Índice de presença excelente.";
          } else if (taxaMedia <= 3) {
            analiseAbs = "Taxa de absenteísmo dentro do padrão aceitável (até 3%).";
          } else if (taxaMedia <= 5) {
            analiseAbs = "Taxa moderada. Monitore os departamentos com maior índice.";
          } else {
            analiseAbs = "Taxa acima do recomendado (>5%). Investigue causas e implemente ações corretivas.";
          }
          if (totalFaltas > totalAtrasos && totalFaltas > 0) {
            analiseAbs += " As faltas representam a maior causa de ausência.";
          } else if (totalAtrasos > 0) {
            analiseAbs += " Os atrasos são uma causa significativa de perda de horas.";
          }

          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Período": periodoLabel,
              "Taxa de Absenteísmo (%)": `${taxaMedia.toFixed(1)}%`,
              "Total Colaboradores": totalColaboradores,
              "Horas Previstas": `${totalHorasPrevistas.toFixed(0)}h`,
              "Horas Perdidas (ausências)": `${totalHorasPerdidas.toFixed(1)}h`,
              "Total de Faltas": totalFaltas,
              "Total de Atrasos": totalAtrasos,
              "Dias de Afastamento": totalAfastamentoDias,
            },
            analysis: analiseAbs,
            charts: [
              {
                type: "bar",
                title: "1. Taxa de Absenteísmo por Departamento",
                description: "(Horas perdidas ÷ Horas previstas) × 100",
                data: Object.entries(deptAbsStats).map(([dept, stats]) => ({
                  departamento: dept,
                  valor: stats.previstas > 0 ? parseFloat(((stats.perdidas / stats.previstas) * 100).toFixed(1)) : 0,
                })),
                dataName: "Taxa (%)",
                insight: `Taxa média geral: ${taxaMedia.toFixed(1)}%. Acima de 5% requer atenção.`,
              },
              {
                type: "pie",
                title: "2. Distribuição de Horas Perdidas por Departamento",
                description: "Proporção de horas perdidas entre setores",
                data: deptHorasPerdidas.length > 0 ? deptHorasPerdidas : [{ departamento: "Sem dados", valor: 0 }],
              },
              {
                type: "pie",
                title: "3. Tipos de Ausência",
                description: "Distribuição entre faltas, atrasos e afastamentos",
                data: [
                  { tipo: "Faltas", valor: totalFaltas },
                  { tipo: "Atrasos", valor: totalAtrasos },
                  { tipo: "Afastamentos", valor: totalAfastamentoDias },
                ].filter(d => d.valor > 0),
              },
            ],
            details: empList
              .sort((a, b) => {
                const taxaA = a.horasPrevistas > 0 ? (a.horasPerdidas / a.horasPrevistas) : 0;
                const taxaB = b.horasPrevistas > 0 ? (b.horasPerdidas / b.horasPrevistas) : 0;
                return taxaB - taxaA;
              })
              .map(e => {
                const taxa = e.horasPrevistas > 0 ? ((e.horasPerdidas / e.horasPrevistas) * 100) : 0;
                return {
                  funcionario: e.nome,
                  departamento: e.dept,
                  "horas Previstas": `${e.horasPrevistas.toFixed(1)}h`,
                  "horas Perdidas": `${e.horasPerdidas.toFixed(1)}h`,
                  faltas: e.faltas,
                  atrasos: e.atrasos,
                  "dias Afastamento": e.afastamentoDias || 0,
                  "taxa (%)": `${taxa.toFixed(1)}%`,
                  status: taxa > 10 ? "Crítico" : taxa > 5 ? "Atenção" : "Normal",
                };
              }),
          });
        } else {
          // pontos - matching reference exactly
          const comEntrada = data.filter((r: any) => !!r.entrada).length;
          const comSaidaCompleta = data.filter((r: any) => !!r.entrada && !!r.saida).length;
          const taxaCompletude = data.length > 0 ? ((comSaidaCompleta / data.length) * 100) : 0;

          // Total hours worked
          let totalHorasTrabalhadas = 0;
          let totalHorasExtras = 0;
          let estouroPausa = 0;
          data.forEach((r: any) => {
            totalHorasTrabalhadas += parseHoras(r.total_horas);
            totalHorasExtras += parseHoras(r.horas_extras);
            // Check for pause overrun (more than 2h lunch)
            if (r.saida_almoco && r.retorno_almoco) {
              try {
                const saida = new Date(r.saida_almoco);
                const retorno = new Date(r.retorno_almoco);
                const pausaHoras = (retorno.getTime() - saida.getTime()) / (1000 * 60 * 60);
                if (pausaHoras > 2) estouroPausa++;
              } catch {}
            }
          });

          // By day of week
          const diasSemana = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
          const porDiaSemana: Record<string, number> = {};
          data.forEach((r: any) => {
            if (r.data) {
              try {
                const d = new Date(r.data + 'T12:00:00');
                const dia = diasSemana[d.getDay()];
                porDiaSemana[dia] = (porDiaSemana[dia] || 0) + 1;
              } catch {}
            }
          });

          // Status distribution
          const statusRegistro: Record<string, number> = {};
          data.forEach((r: any) => {
            if (!!r.entrada && !!r.saida) statusRegistro["Completo"] = (statusRegistro["Completo"] || 0) + 1;
            else if (!!r.entrada) statusRegistro["Incompleto"] = (statusRegistro["Incompleto"] || 0) + 1;
            else statusRegistro["Sem Registro"] = (statusRegistro["Sem Registro"] || 0) + 1;
          });

          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Total Registros": data.length,
              "Com Entrada": comEntrada,
              "Com Saída Completa": comSaidaCompleta,
              "Taxa de Completude": `${taxaCompletude.toFixed(1)}%`,
              "Total Horas Trabalhadas": `${totalHorasTrabalhadas.toFixed(1)}h`,
              "Total Horas Extras": `${totalHorasExtras.toFixed(1)}h`,
              "Estouros de Pausa": estouroPausa,
            },
            charts: [
              {
                type: "bar",
                title: "1. Registros de Ponto por Dia da Semana",
                description: "Distribuição dos registros ao longo da semana",
                data: diasSemana.filter(d => porDiaSemana[d]).map(dia => ({ dia, valor: porDiaSemana[dia] || 0 })),
                dataName: "Registros",
                insight: "Analise os dias com menor frequência para identificar padrões de ausência.",
              },
              {
                type: "pie",
                title: "2. Status dos Registros",
                description: "Proporção entre registros completos e incompletos",
                data: Object.entries(statusRegistro).map(([status, count]) => ({ status, valor: count })),
              },
            ],
            details: data.slice(0, 100).map((r: any) => {
              let entradaStr = "-", saidaStr = "-", sAlmocoStr = "-", rAlmocoStr = "-";
              try { if (r.entrada) { const d = new Date(r.entrada); entradaStr = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } } catch {}
              try { if (r.saida) { const d = new Date(r.saida); saidaStr = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } } catch {}
              try { if (r.saida_almoco) { const d = new Date(r.saida_almoco); sAlmocoStr = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } } catch {}
              try { if (r.retorno_almoco) { const d = new Date(r.retorno_almoco); rAlmocoStr = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } } catch {}
              const carga = getCargaPrevista(r.user_id);
              return {
                nome: r.profiles?.nome || funcMap.get(r.user_id)?.nome || "-",
                departamento: r.profiles?.departamento || funcMap.get(r.user_id)?.departamento || "-",
                data: r.data ? format(new Date(r.data + 'T12:00:00'), 'dd/MM/yyyy') : "-",
                entrada: entradaStr,
                "saida Almoco": sAlmocoStr,
                "retorno Almoco": rAlmocoStr,
                saida: saidaStr,
                "carga Prevista": `${carga}h`,
                "horas Trabalhadas": r.total_horas || "00:00",
                "horas Extras": r.horas_extras || "00:00",
                "estouro Pausa": "—",
              };
            }),
          });
        }
        break;
      }

      case "turnover": {
        const tdata = todosFuncionarios || [];
        let filtered = tdata;
        if (filters.departamento && filters.departamento !== "todos") {
          filtered = filtered.filter((f: any) => f.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }

        const total = filtered.length;
        const statusNorm = (f: any) => (f.status || "ativo").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        const isEmFerias = (st: string) => st === "em_ferias" || st === "ferias";

        const desligados = filtered.filter((f: any) => {
          const st = statusNorm(f);
          return st === "demitido" || st === "pediu_demissao" || st === "demissao";
        });
        const naoDesligados = filtered.filter((f: any) => {
          const st = statusNorm(f);
          return st !== "demitido" && st !== "pediu_demissao" && st !== "demissao";
        });
        const ativos = naoDesligados.filter((f: any) => {
          const st = statusNorm(f);
          return st === "ativo" || st === "";
        });
        const emFerias = naoDesligados.filter((f: any) => isEmFerias(statusNorm(f)));
        const afastados = naoDesligados.filter((f: any) => statusNorm(f) === "afastado");

        // Admissões no período selecionado
        const admissoes = filtered.filter((f: any) => {
          if (!f.data_admissao) return false;
          if (filters.dataInicio && f.data_admissao < filters.dataInicio) return false;
          if (filters.dataFim && f.data_admissao > filters.dataFim) return false;
          return true;
        });

        // Fórmula: Turnover (%) = ((Admissões + Desligamentos) ÷ 2 ÷ Nº médio funcionários) × 100
        const ativosComFerias = ativos.length + emFerias.length;
        const mediaFuncionarios = total > 0 ? (ativosComFerias + total) / 2 : 0;
        const taxaTurnover = mediaFuncionarios > 0
          ? (((admissoes.length + desligados.length) / 2) / mediaFuncionarios * 100).toFixed(1)
          : "0.0";
        const taxaRetencao = total > 0 ? ((naoDesligados.length / total) * 100).toFixed(1) : "0";

        const motivoCount: Record<string, number> = {};
        desligados.forEach((f: any) => {
          const st = statusNorm(f);
          const label = st === "pediu_demissao" ? "Pedido de Demissão" : "Demissão pela Empresa";
          motivoCount[label] = (motivoCount[label] || 0) + 1;
        });

        const deptDesligamentos: Record<string, number> = {};
        desligados.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          deptDesligamentos[d] = (deptDesligamentos[d] || 0) + 1;
        });
        const deptAtivos: Record<string, number> = {};
        naoDesligados.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          deptAtivos[d] = (deptAtivos[d] || 0) + 1;
        });

        const allDepts = [...new Set([...Object.keys(deptDesligamentos), ...Object.keys(deptAtivos)])];
        const deptTurnover = allDepts.map(dept => ({
          departamento: dept,
          Ativos: deptAtivos[dept] || 0,
          Desligados: deptDesligamentos[dept] || 0,
        }));

        const statusDistrib = [
          { status: "Ativos", valor: ativos.length },
          ...(emFerias.length > 0 ? [{ status: "Em Férias", valor: emFerias.length }] : []),
          ...(afastados.length > 0 ? [{ status: "Afastados", valor: afastados.length }] : []),
          ...(desligados.length > 0 ? [{ status: "Desligados", valor: desligados.length }] : []),
        ];

        // Análise automática
        const turnoverNum = parseFloat(taxaTurnover);
        let tendencia = "Estável";
        let analiseTexto = "";
        if (turnoverNum === 0) {
          tendencia = "Estável";
          analiseTexto = "Sem movimentações no período. Quadro de funcionários estável.";
        } else if (turnoverNum <= 5) {
          tendencia = "Baixo ✅";
          analiseTexto = "Taxa saudável, boa retenção de talentos.";
        } else if (turnoverNum <= 15) {
          tendencia = "Moderado ⚠️";
          analiseTexto = "Taxa moderada. Investigue motivos de desligamento e avalie políticas de retenção.";
        } else {
          tendencia = "Alto 🔴";
          analiseTexto = "Taxa elevada. Revise condições de trabalho, remuneração e clima organizacional.";
        }
        if (desligados.length > 0 && (motivoCount["Pedido de Demissão"] || 0) > (motivoCount["Demissão pela Empresa"] || 0)) {
          analiseTexto += " Maioria dos desligamentos por iniciativa do colaborador.";
        }

        let filteredForDetails = filtered;
        if (filters.tipoMovimentacao && filters.tipoMovimentacao !== "todos") {
          if (filters.tipoMovimentacao === "desligamento") filteredForDetails = desligados;
          else if (filters.tipoMovimentacao === "admissao") filteredForDetails = admissoes;
        }

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Taxa de Turnover (%)": `${taxaTurnover}%`,
            "Tendência": tendencia,
            "Nº Médio Funcionários": Math.round(mediaFuncionarios),
            "Total Cadastrados": total,
            "Ativos (incl. férias)": ativosComFerias,
            "  ↳ Em Atividade": ativos.length,
            "  ↳ Em Férias": emFerias.length,
            "Admissões no Período": admissoes.length,
            "Desligamentos": desligados.length,
            "Taxa de Retenção": `${taxaRetencao}%`,
          },
          analysis: analiseTexto,
          charts: [
            {
              type: "pie",
              title: "1. Distribuição por Status",
              description: "Status atual dos funcionários cadastrados",
              data: statusDistrib,
            },
            {
              type: "bar",
              title: "2. Ativos vs Desligados por Departamento",
              description: "Comparativo por área",
              data: deptTurnover,
              dataName: "Colaboradores",
            },
            ...(Object.keys(motivoCount).length > 0 ? [{
              type: "pie",
              title: "3. Motivos de Desligamento",
              description: "Distribuição dos motivos de saída",
              data: Object.entries(motivoCount).map(([motivo, count]) => ({ motivo, valor: count })),
            }] : []),
          ],
          details: filteredForDetails.slice(0, 200).map((f: any) => {
            const st = statusNorm(f);
            let statusLabel = f.status || "Ativo";
            if (isEmFerias(st)) statusLabel = "Em férias";
            else if (st === "ativo" || st === "") statusLabel = "Ativo";
            else if (st === "demitido" || st === "demissao") statusLabel = "Demitido";
            else if (st === "pediu_demissao") statusLabel = "Pediu demissão";
            else if (st === "afastado") statusLabel = "Afastado";
            return {
              nome: f.nome || "-",
              departamento: f.departamento || "-",
              cargo: f.cargo || "-",
              "data Admissao": f.data_admissao ? format(new Date(f.data_admissao + 'T12:00:00'), 'dd/MM/yyyy') : "-",
              status: statusLabel,
            };
          }),
        });
        break;
      }

      case "desempenho": {
        const data = funcionarios || [];
        let filtered = data;
        if (filters.departamento && filters.departamento !== "todos") {
          filtered = filtered.filter((f: any) => f.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }
        const deptCount: Record<string, number> = {};
        filtered.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          deptCount[d] = (deptCount[d] || 0) + 1;
        });
          const cargoCount: Record<string, number> = {};
          filtered.forEach((f: any) => {
            const c = f.cargo || "Sem Cargo";
            cargoCount[c] = (cargoCount[c] || 0) + 1;
          });
          const statusDesempenho: Record<string, number> = {};
          filtered.forEach((f: any) => {
            const s = f.status || "Ativo";
            statusDesempenho[s] = (statusDesempenho[s] || 0) + 1;
          });
          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Período": periodoLabel,
              "Total Avaliados": filtered.length,
              "Departamentos": Object.keys(deptCount).length,
            },
            charts: [
              {
                type: "bar",
                title: "Colaboradores por Departamento",
                description: "Distribuição para avaliação de desempenho",
                data: Object.entries(deptCount).map(([dept, count]) => ({ departamento: dept, valor: count })),
                dataName: "Colaboradores",
              },
              {
                type: "pie",
                title: "Distribuição por Status",
                description: "Status dos colaboradores avaliados",
                data: Object.entries(statusDesempenho).map(([status, count]) => ({ status, valor: count })),
              },
            ],
          details: filtered.slice(0, 100).map((f: any) => ({
            Nome: f.nome || "-",
            Cargo: f.cargo || "-",
            Departamento: f.departamento || "-",
            Status: f.status || "Ativo",
          })),
        });
        break;
      }

      case "beneficios": {
        const funcsAtivos = (funcionarios || []).filter((f: any) => {
          const st = (f.status || "ativo").toLowerCase();
          return st !== "demitido" && st !== "pediu_demissao";
        });
        let filtered = funcsAtivos;
        if (filters.departamento && filters.departamento !== "todos") {
          filtered = filtered.filter((f: any) => f.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }
        const filteredIds = new Set(filtered.map((f: any) => f.id));
        const funcMap = new Map(filtered.map((f: any) => [f.id, f]));

        // Filter benefits by active employees
        const bens = (beneficios || []).filter((b: any) => filteredIds.has(b.user_id));

        // Stats by type
        const tipoCount: Record<string, number> = {};
        const tipoCusto: Record<string, number> = {};
        bens.forEach((b: any) => {
          const t = b.tipo || "Outro";
          tipoCount[t] = (tipoCount[t] || 0) + 1;
          if (!["plano_saude", "plano_odontologico"].includes(t)) {
            tipoCusto[t] = (tipoCusto[t] || 0) + (b.valor || 0);
          }
        });

        // By department
        const deptBens: Record<string, number> = {};
        bens.forEach((b: any) => {
          const func = funcMap.get(b.user_id);
          const d = func?.departamento || "Sem Departamento";
          deptBens[d] = (deptBens[d] || 0) + 1;
        });

        // Employees without benefits
        const empComBen = new Set(bens.map((b: any) => b.user_id));
        const semBeneficio = filtered.filter((f: any) => !empComBen.has(f.id));

        const totalCusto = bens.reduce((acc: number, b: any) => {
          if (["plano_saude", "plano_odontologico"].includes(b.tipo)) return acc;
          return acc + (b.valor || 0);
        }, 0);

        const tipoLabels: Record<string, string> = {
          vale_transporte: "Vale Transporte",
          vale_alimentacao: "Vale Alimentação",
          vale_refeicao: "Vale Refeição",
          plano_saude: "Plano de Saúde",
          plano_odontologico: "Plano Odontológico",
        };

        // Count unique benefit types
        const uniqueBenTypes = new Set(bens.map((b: any) => b.tipo));
        const bensAtivos = bens.filter((b: any) => b.ativo);
        const bensInativos = bens.filter((b: any) => !b.ativo);

        // Benefits per employee count
        const empBenCount: Record<string, number> = {};
        bensAtivos.forEach((b: any) => {
          empBenCount[b.user_id] = (empBenCount[b.user_id] || 0) + 1;
        });
        const avgBenPerEmp = filtered.length > 0 ? (bensAtivos.length / filtered.length) : 0;

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Total Funcionários": filtered.length,
            "Benefícios Cadastrados": uniqueBenTypes.size,
            "Benefícios Ativos": bensAtivos.length,
            "Benefícios Inativos": bensInativos.length,
          },
          charts: [
            {
              type: "pie",
              title: "1. Status dos Benefícios",
              description: "Proporção entre benefícios ativos e inativos",
              data: [
                { status: "Ativos", valor: bensAtivos.length },
                { status: "Inativos", valor: bensInativos.length },
              ].filter(d => d.valor > 0),
            },
            {
              type: "bar",
              title: "2. Benefícios por Funcionário",
              description: "Quantidade de benefícios ativos por colaborador",
              data: filtered.map((f: any) => ({
                funcionario: (f.nome || "-").split(" ").slice(0, 2).join(" "),
                valor: empBenCount[f.id] || 0,
              })),
              dataName: "Benefícios",
              insight: `Cada funcionário possui ${Math.round(avgBenPerEmp)} benefício(s) ativo(s).`,
            },
          ],
          details: bensAtivos.slice(0, 100).map((b: any) => {
            const func = funcMap.get(b.user_id);
            const isPlano = ["plano_saude", "plano_odontologico"].includes(b.tipo);
            let valorStr = "-";
            if (isPlano) {
              valorStr = b.observacoes || (tipoLabels[b.tipo] || b.tipo);
            } else {
              const val = b.valor || 0;
              const periodo = b.tipo === "vale_refeicao" || b.tipo === "vale_alimentacao" ? "/dia" : "/mês";
              valorStr = `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}${periodo}`;
            }
            return {
              funcionario: func?.nome || "-",
              departamento: func?.departamento || "-",
              beneficio: tipoLabels[b.tipo] || b.tipo || "-",
              valor: valorStr,
              status: b.ativo ? "Ativo" : "Inativo",
            };
          }),
        });
        break;
      }

      case "sst": {
        const sstFuncs = funcionarios || [];
        let filtered = sstFuncs;
        if (filters.departamento && filters.departamento !== "todos") {
          filtered = filtered.filter((f: any) => f.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }
        const filteredIds = new Set(filtered.map((f: any) => f.id));

        // === Dados operacionais ===
        const afastAtivos = (afastamentos || []).filter((a: any) => {
          if (!filteredIds.has(a.user_id)) return false;
          return a.status === "ativo" || a.status === "em_andamento" || !a.data_retorno;
        });

        const catsData = (cats || []).filter((c: any) => filteredIds.has(c.user_id));
        let diasSemAcidentes = 120;
        if (catsData.length > 0) {
          const ultimaCat = [...catsData].sort((a: any, b: any) => b.data_acidente.localeCompare(a.data_acidente))[0];
          try { diasSemAcidentes = differenceInDays(new Date(), new Date(ultimaCat.data_acidente)); } catch {}
        }

        const asosData = (asos || []).filter((a: any) => filteredIds.has(a.user_id));
        const hoje = new Date();
        const asosVencidos = asosData.filter((a: any) => a.data_vencimento && new Date(a.data_vencimento) < hoje).length;

        const lastExamByUser: Record<string, string> = {};
        asosData.forEach((a: any) => {
          if (!lastExamByUser[a.user_id] || a.data_exame > lastExamByUser[a.user_id]) {
            lastExamByUser[a.user_id] = a.data_exame;
          }
        });

        const episData = (epiEntregas || []).filter((e: any) => filteredIds.has(e.user_id));
        const cipaAtivos = (cipaMembros || []).filter((m: any) => m.ativo).length;

        // === RAT/SAT Calculation ===
        // Folha de pagamento = soma salários dos colaboradores filtrados
        const folhaPagamento = filtered.reduce((acc: number, f: any) => acc + (f.salario || 0), 0);

        // Determinar grau de risco baseado no histórico de CATs
        const taxaIncidentes = filtered.length > 0 ? (catsData.length / filtered.length) * 100 : 0;
        let grauRisco = "Leve";
        let aliquotaRAT = 1;
        if (taxaIncidentes > 5 || catsData.length >= 3) {
          grauRisco = "Grave";
          aliquotaRAT = 3;
        } else if (taxaIncidentes > 2 || catsData.length >= 1) {
          grauRisco = "Médio";
          aliquotaRAT = 2;
        }

        // FAP baseado no histórico (simplificado)
        let fap = 1.0;
        if (catsData.length === 0 && afastAtivos.length === 0) fap = 0.5;
        else if (catsData.length <= 1) fap = 0.8;
        else if (catsData.length <= 3) fap = 1.2;
        else fap = 1.8;

        const ratFinal = folhaPagamento * (aliquotaRAT / 100) * fap;

        // Dept breakdown
        const deptSaude: Record<string, { colaboradores: number; cats: number; afastados: number }> = {};
        filtered.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          if (!deptSaude[d]) deptSaude[d] = { colaboradores: 0, cats: 0, afastados: 0 };
          deptSaude[d].colaboradores++;
        });
        catsData.forEach((c: any) => {
          const func = filtered.find((f: any) => f.id === c.user_id);
          const d = func?.departamento || "Sem Departamento";
          if (deptSaude[d]) deptSaude[d].cats++;
        });
        afastAtivos.forEach((a: any) => {
          const func = filtered.find((f: any) => f.id === a.user_id);
          const d = func?.departamento || "Sem Departamento";
          if (deptSaude[d]) deptSaude[d].afastados++;
        });

        // CATs por tipo
        const catTipoCount: Record<string, number> = {};
        catsData.forEach((c: any) => {
          catTipoCount[c.tipo || "Típico"] = (catTipoCount[c.tipo || "Típico"] || 0) + 1;
        });

        // Análise
        let analiseSST = `RAT/SAT: Contribuição ao INSS sobre a folha de pagamento para cobertura de acidentes de trabalho. `;
        analiseSST += `Grau de risco classificado como "${grauRisco}" (alíquota ${aliquotaRAT}%). `;
        analiseSST += `FAP estimado: ${fap.toFixed(1)} (varia de 0,5 a 2,0 conforme histórico). `;
        analiseSST += `Fórmula: RAT Final = Folha × (RAT × FAP). `;
        analiseSST += `Exemplo: R$ ${folhaPagamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × (${aliquotaRAT}% × ${fap.toFixed(1)}) = R$ ${ratFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`;

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Grau de Risco": grauRisco,
            "Alíquota RAT": `${aliquotaRAT}%`,
            "FAP Estimado": fap.toFixed(1),
            "Folha de Pagamento": `R$ ${folhaPagamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            "RAT Final (mensal)": `R$ ${ratFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            "Dias sem Acidentes": diasSemAcidentes,
            "Total CATs": catsData.length,
            "Afastamentos Ativos": afastAtivos.length,
            "ASOs Vencidos": asosVencidos,
            "Colaboradores": filtered.length,
          },
          analysis: analiseSST,
          charts: [
            {
              type: "bar",
              title: "1. Indicadores por Departamento",
              description: "CATs e afastamentos por área",
              data: Object.entries(deptSaude).map(([dept, s]) => ({
                departamento: dept,
                Colaboradores: s.colaboradores,
                CATs: s.cats,
                Afastados: s.afastados,
              })),
              dataName: "Indicadores",
            },
            ...(Object.keys(catTipoCount).length > 0 ? [{
              type: "pie",
              title: "2. CATs por Tipo de Acidente",
              description: "Distribuição das Comunicações de Acidentes",
              data: Object.entries(catTipoCount).map(([tipo, count]) => ({ tipo, valor: count })),
            }] : []),
            {
              type: "pie",
              title: Object.keys(catTipoCount).length > 0 ? "3. Alíquotas RAT por Grau de Risco" : "2. Alíquotas RAT por Grau de Risco",
              description: "Referência oficial das alíquotas",
              data: [
                { tipo: "Leve (1%)", valor: 1 },
                { tipo: "Médio (2%)", valor: 2 },
                { tipo: "Grave (3%)", valor: 3 },
              ],
            },
          ],
          details: filtered.slice(0, 200).map((f: any) => {
            const hasAfastamento = afastAtivos.some((a: any) => a.user_id === f.id);
            const ultimoExame = lastExamByUser[f.id];
            const catsFunc = catsData.filter((c: any) => c.user_id === f.id).length;
            const salario = f.salario || 0;
            const ratIndiv = salario * (aliquotaRAT / 100) * fap;
            return {
              nome: f.nome || "-",
              departamento: f.departamento || "-",
              cargo: f.cargo || "-",
              "status Saude": hasAfastamento ? "Afastado" : "Ativo",
              "ultimo ASO": ultimoExame ? format(new Date(ultimoExame), 'dd/MM/yyyy') : "Sem exame",
              "CATs": catsFunc,
              "salario": `R$ ${salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              "RAT Individual": `R$ ${ratIndiv.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            };
          }),
        });
        break;
      }

      case "holerites": {
        let data = holerites || [];
        if (filters.dataInicio) {
          data = data.filter((h: any) => {
            const ref = `${h.ano}-${String(h.mes).padStart(2, "0")}`;
            return ref >= filters.dataInicio.substring(0, 7);
          });
        }
        if (filters.dataFim) {
          data = data.filter((h: any) => {
            const ref = `${h.ano}-${String(h.mes).padStart(2, "0")}`;
            return ref <= filters.dataFim.substring(0, 7);
          });
        }
        if (filters.mes) {
          data = data.filter((h: any) => String(h.mes) === filters.mes);
        }
        if (filters.ano) {
          data = data.filter((h: any) => String(h.ano) === filters.ano);
        }

        const funcMap = new Map((funcionarios || []).map((f: any) => [f.id, f]));
        if (filters.departamento && filters.departamento !== "todos") {
          data = data.filter((h: any) => {
            const func = funcMap.get(h.user_id);
            return func?.departamento?.toLowerCase().includes(filters.departamento.toLowerCase());
          });
        }

        const funcsAtivos = (funcionarios || []).filter((f: any) => {
          const st = (f.status || "ativo").toLowerCase();
          return st !== "demitido" && st !== "pediu_demissao";
        });

        const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
        const fmtPct = (v: number) => `${v.toFixed(1)}%`;

        // ===== MÓDULO 2: CÁLCULO COMPLETO DA FOLHA (CLT) =====
        // Encargos patronais reais por funcionário
        const calcEncargos = (salBruto: number) => {
          const inssPatronal = salBruto * 0.20;
          const fgts = salBruto * 0.08;
          const rat = salBruto * 0.02; // Risco médio padrão
          const terceiros = salBruto * 0.058;
          const decimoTerceiro = salBruto / 12;
          const feriasProp = salBruto / 12;
          const tercoFerias = feriasProp / 3;
          const fgtsSobreFerias = (feriasProp + tercoFerias) * 0.08;
          const fgtsSobre13 = decimoTerceiro * 0.08;
          const totalEncargos = inssPatronal + fgts + rat + terceiros + decimoTerceiro + feriasProp + tercoFerias + fgtsSobreFerias + fgtsSobre13;
          const pctEncargos = salBruto > 0 ? (totalEncargos / salBruto) * 100 : 0;
          return {
            inssPatronal, fgts, rat, terceiros,
            decimoTerceiro, feriasProp, tercoFerias,
            fgtsSobreFerias, fgtsSobre13,
            totalEncargos, pctEncargos,
            custoMensal: salBruto + totalEncargos,
            custoAnual: (salBruto + totalEncargos) * 12,
          };
        };

        // Aggregate per employee
        const holeritesByUser: Record<string, any[]> = {};
        data.forEach((h: any) => {
          if (!holeritesByUser[h.user_id]) holeritesByUser[h.user_id] = [];
          holeritesByUser[h.user_id].push(h);
        });

        // Build employee-level data
        const empRows: any[] = [];
        let totalFolhaBruta = 0;
        let totalEncargosGeral = 0;
        let totalCustoReal = 0;
        let totalBeneficios = 0;

        const bensAtivos = (beneficios || []).filter((b: any) => b.ativo !== false);

        const allEmpIds = new Set([...Object.keys(holeritesByUser), ...funcsAtivos.map((f: any) => f.id)]);
        allEmpIds.forEach(uid => {
          const func = funcMap.get(uid);
          if (!func) return;
          const hols = holeritesByUser[uid] || [];
          const salBruto = hols.length > 0 ? Math.max(...hols.map((h: any) => parseFloat(h.salario_bruto) || 0)) : (func.salario || 0);
          if (salBruto <= 0) return;

          const enc = calcEncargos(salBruto);
          const empBens = bensAtivos.filter((b: any) => b.user_id === uid);
          const empBenTotal = empBens.reduce((acc: number, b: any) => {
            if (["plano_saude", "plano_odontologico"].includes(b.tipo)) return acc;
            return acc + (b.valor || 0);
          }, 0);

          const custoTotal = enc.custoMensal + empBenTotal;
          totalFolhaBruta += salBruto;
          totalEncargosGeral += enc.totalEncargos;
          totalCustoReal += custoTotal;
          totalBeneficios += empBenTotal;

          empRows.push({
            uid,
            nome: func.nome || "-",
            cargo: func.cargo || "-",
            departamento: func.departamento || "Sem Departamento",
            salBruto,
            ...enc,
            beneficios: empBenTotal,
            custoTotal,
          });
        });

        const totalColab = empRows.length;
        const custoMedioColab = totalColab > 0 ? totalCustoReal / totalColab : 0;
        const pctEncargosGeral = totalFolhaBruta > 0 ? (totalEncargosGeral / totalFolhaBruta) * 100 : 0;

        // ===== MÓDULO 3: CUSTO POR DEPARTAMENTO =====
        const deptData: Record<string, { funcs: number; bruto: number; encargos: number; beneficios: number; custoTotal: number }> = {};
        empRows.forEach(e => {
          const d = e.departamento;
          if (!deptData[d]) deptData[d] = { funcs: 0, bruto: 0, encargos: 0, beneficios: 0, custoTotal: 0 };
          deptData[d].funcs++;
          deptData[d].bruto += e.salBruto;
          deptData[d].encargos += e.totalEncargos;
          deptData[d].beneficios += e.beneficios;
          deptData[d].custoTotal += e.custoTotal;
        });

        const deptChartData = Object.entries(deptData).map(([dept, v]) => ({
          departamento: dept,
          "Folha Bruta": parseFloat(v.bruto.toFixed(2)),
          Encargos: parseFloat(v.encargos.toFixed(2)),
          Benefícios: parseFloat(v.beneficios.toFixed(2)),
        }));

        const deptPctData = Object.entries(deptData).map(([dept, v]) => ({
          departamento: dept,
          valor: totalCustoReal > 0 ? parseFloat(((v.custoTotal / totalCustoReal) * 100).toFixed(1)) : 0,
        }));

        // ===== MÓDULO 5: RANKING DE CARGOS =====
        const cargoData: Record<string, { count: number; custoTotal: number }> = {};
        empRows.forEach(e => {
          const c = e.cargo;
          if (!cargoData[c]) cargoData[c] = { count: 0, custoTotal: 0 };
          cargoData[c].count++;
          cargoData[c].custoTotal += e.custoTotal;
        });
        const cargoRanking = Object.entries(cargoData)
          .map(([cargo, v]) => ({ cargo, "Custo Total": parseFloat(v.custoTotal.toFixed(2)), Qtd: v.count }))
          .sort((a, b) => b["Custo Total"] - a["Custo Total"])
          .slice(0, 10);

        // ===== MÓDULO 6: EVOLUÇÃO MENSAL =====
        const mesTrend: Record<string, { bruto: number; encargos: number; custoReal: number }> = {};
        data.forEach((h: any) => {
          const ref = `${String(h.mes).padStart(2, "0")}/${h.ano}`;
          const sal = parseFloat(h.salario_bruto) || 0;
          const enc = calcEncargos(sal);
          if (!mesTrend[ref]) mesTrend[ref] = { bruto: 0, encargos: 0, custoReal: 0 };
          mesTrend[ref].bruto += sal;
          mesTrend[ref].encargos += enc.totalEncargos;
          mesTrend[ref].custoReal += enc.custoMensal;
        });
        const evolucaoData = Object.entries(mesTrend)
          .sort(([a], [b]) => {
            const [ma, ya] = a.split("/"); const [mb, yb] = b.split("/");
            return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
          })
          .map(([mes, v]) => ({
            mês: mes,
            "Folha Bruta": parseFloat(v.bruto.toFixed(2)),
            "Custo Real": parseFloat(v.custoReal.toFixed(2)),
          }));

        // ===== MÓDULO 9: ALERTAS FINANCEIROS =====
        const alertas: string[] = [];
        // Check month-over-month growth
        const mesesOrdenados = Object.entries(mesTrend).sort(([a], [b]) => {
          const [ma, ya] = a.split("/"); const [mb, yb] = b.split("/");
          return `${ya}-${ma}`.localeCompare(`${yb}-${mb}`);
        });
        if (mesesOrdenados.length >= 2) {
          const ultimo = mesesOrdenados[mesesOrdenados.length - 1][1];
          const penultimo = mesesOrdenados[mesesOrdenados.length - 2][1];
          const crescimento = penultimo.custoReal > 0 ? ((ultimo.custoReal - penultimo.custoReal) / penultimo.custoReal) * 100 : 0;
          if (crescimento > 10) {
            alertas.push(`⚠️ Folha cresceu ${crescimento.toFixed(1)}% em relação ao mês anterior — verificar novas contratações ou reajustes.`);
          }
        }
        // Check department concentration
        Object.entries(deptData).forEach(([dept, v]) => {
          const pct = totalCustoReal > 0 ? (v.custoTotal / totalCustoReal) * 100 : 0;
          if (pct > 40 && Object.keys(deptData).length > 1) {
            alertas.push(`⚠️ Departamento "${dept}" representa ${pct.toFixed(1)}% do custo total da folha.`);
          }
        });
        if (pctEncargosGeral > 55) {
          alertas.push(`⚠️ Percentual de encargos (${pctEncargosGeral.toFixed(1)}%) está acima do esperado — revisar adicionais e provisões.`);
        }

        // ===== MÓDULO 8: SIMULAÇÃO (valores para exibição) =====
        const simSalario = 3000;
        const simEnc = calcEncargos(simSalario);

        // ===== ANALYSIS =====
        const analysisLines: string[] = [];
        analysisLines.push(`A folha de pagamento totaliza ${fmt(totalFolhaBruta)} em salários brutos, com encargos e provisões de ${fmt(totalEncargosGeral)} (${fmtPct(pctEncargosGeral)} sobre o bruto).`);
        analysisLines.push(`O custo real total é ${fmt(totalCustoReal)}, com custo médio de ${fmt(custoMedioColab)} por colaborador.`);
        if (Object.keys(deptData).length > 1) {
          const maiorDept = Object.entries(deptData).sort((a, b) => b[1].custoTotal - a[1].custoTotal)[0];
          analysisLines.push(`O departamento com maior custo é "${maiorDept[0]}" com ${fmt(maiorDept[1].custoTotal)} (${fmtPct(totalCustoReal > 0 ? (maiorDept[1].custoTotal / totalCustoReal) * 100 : 0)} da folha).`);
        }
        if (alertas.length > 0) {
          analysisLines.push(`Atenção: ${alertas.length} alerta(s) financeiro(s) detectado(s).`);
        }

        setGeneratedData({
          generatedAt: now.toISOString(),
          analysis: analysisLines.join(" ") + (alertas.length > 0 ? "\n\n" + alertas.join("\n") : ""),
          summary: {
            "Período": filters.mes && filters.ano ? `${filters.mes}/${filters.ano}` : periodoLabel,
            "Total Colaboradores": totalColab,
            "Total Folha Bruta": fmt(totalFolhaBruta),
            "Encargos e Provisões": fmt(totalEncargosGeral),
            "% Encargos s/ Bruto": fmtPct(pctEncargosGeral),
            "Benefícios (VT/VA/VR)": fmt(totalBeneficios),
            "Custo Real da Folha": fmt(totalCustoReal),
            "Custo Médio/Colaborador": fmt(custoMedioColab),
            "Custo Anual Estimado": fmt(totalCustoReal * 12),
          },
          charts: [
            {
              type: "pie",
              title: "Composição do Custo Total",
              description: "Salários, encargos/provisões e benefícios",
              data: [
                { categoria: "Salários Brutos", valor: parseFloat(totalFolhaBruta.toFixed(2)) },
                { categoria: "Encargos e Provisões", valor: parseFloat(totalEncargosGeral.toFixed(2)) },
                ...(totalBeneficios > 0 ? [{ categoria: "Benefícios", valor: parseFloat(totalBeneficios.toFixed(2)) }] : []),
              ],
            },
            {
              type: "pie",
              title: "Detalhamento dos Encargos",
              description: "INSS Patronal, FGTS, RAT, Terceiros e Provisões",
              data: [
                { encargo: "INSS Patronal (20%)", valor: parseFloat((totalFolhaBruta * 0.20).toFixed(2)) },
                { encargo: "FGTS (8%)", valor: parseFloat((totalFolhaBruta * 0.08).toFixed(2)) },
                { encargo: "RAT (2%)", valor: parseFloat((totalFolhaBruta * 0.02).toFixed(2)) },
                { encargo: "Terceiros (5,8%)", valor: parseFloat((totalFolhaBruta * 0.058).toFixed(2)) },
                { encargo: "13º Proporcional", valor: parseFloat((totalFolhaBruta / 12).toFixed(2)) },
                { encargo: "Férias + 1/3", valor: parseFloat(((totalFolhaBruta / 12) + (totalFolhaBruta / 12 / 3)).toFixed(2)) },
              ],
            },
            ...(deptChartData.length > 1 ? [{
              type: "bar" as const,
              title: "Custo por Departamento",
              description: "Folha bruta, encargos e benefícios por departamento",
              data: deptChartData,
              dataName: "R$",
            }] : []),
            ...(deptPctData.length > 1 ? [{
              type: "pie" as const,
              title: "% da Folha por Departamento",
              description: "Participação de cada departamento no custo total",
              data: deptPctData,
            }] : []),
            ...(cargoRanking.length > 1 ? [{
              type: "bar" as const,
              title: "Ranking: Cargos Mais Caros",
              description: "Top 10 cargos por custo total (salário + encargos + benefícios)",
              data: cargoRanking,
              dataName: "R$",
            }] : []),
            ...(evolucaoData.length > 1 ? [{
              type: "bar" as const,
              title: "Evolução Mensal da Folha",
              description: "Comparativo mensal: Folha Bruta vs Custo Real",
              data: evolucaoData,
              dataName: "R$",
            }] : []),
            {
              type: "bar",
              title: "Simulação: Impacto de Nova Contratação (R$ 3.000)",
              description: `Custo CLT mensal: ${fmt(simEnc.custoMensal)} | Anual: ${fmt(simEnc.custoAnual)} | Encargos: ${fmtPct(simEnc.pctEncargos)}`,
              data: [
                { item: "Salário", valor: simSalario },
                { item: "INSS Patronal", valor: parseFloat(simEnc.inssPatronal.toFixed(2)) },
                { item: "FGTS", valor: parseFloat(simEnc.fgts.toFixed(2)) },
                { item: "RAT", valor: parseFloat(simEnc.rat.toFixed(2)) },
                { item: "Terceiros", valor: parseFloat(simEnc.terceiros.toFixed(2)) },
                { item: "13º Prop.", valor: parseFloat(simEnc.decimoTerceiro.toFixed(2)) },
                { item: "Férias+1/3", valor: parseFloat((simEnc.feriasProp + simEnc.tercoFerias).toFixed(2)) },
              ],
              dataName: "R$",
              insight: `Contratar a R$ 3.000 adiciona ${fmt(simEnc.custoMensal)} ao custo mensal e ${fmt(simEnc.custoAnual)} ao custo anual. Impacto de ${totalCustoReal > 0 ? fmtPct((simEnc.custoMensal / totalCustoReal) * 100) : "N/A"} na folha atual.`,
            },
          ],
          details: empRows
            .sort((a, b) => b.custoTotal - a.custoTotal)
            .slice(0, 200)
            .map(e => ({
              Funcionário: e.nome,
              Cargo: e.cargo,
              Departamento: e.departamento,
              "Sal. Bruto": fmt(e.salBruto),
              "INSS Patronal": fmt(e.inssPatronal),
              "FGTS": fmt(e.fgts),
              "RAT+Terceiros": fmt(e.rat + e.terceiros),
              "Provisões (13º+Férias)": fmt(e.decimoTerceiro + e.feriasProp + e.tercoFerias),
              "Total Encargos": fmt(e.totalEncargos),
              "% Encargos": fmtPct(e.pctEncargos),
              "Benefícios": fmt(e.beneficios),
              "Custo Mensal": fmt(e.custoTotal),
              "Custo Anual": fmt(e.custoTotal * 12),
            })),
        });
        break;
      }

      default:
        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: { "Info": "Dados não disponíveis para este relatório" },
          charts: [],
          details: [],
        });
    }
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReport(reportId);
    setGeneratedData(null);
    setFilters({ departamento: "todos" });
  };

  if (selectedReport) {
    const Icon = selectedReportInfo?.icon || BarChart3;
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => { setSelectedReport(null); setGeneratedData(null); }} />
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
                {selectedReportInfo?.name}
              </h1>
              <p className="text-sm text-muted-foreground">Relatórios e Análises</p>
            </div>
          </div>
        </div>

        {/* Report Header Card + Filters */}
        {!generatedData && (
          <Card className="overflow-hidden border-primary/40">
            <CardHeader className="bg-gradient-to-r from-destructive/5 to-transparent pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-destructive" />
                </div>
                <div>
                  <CardTitle className="text-lg" style={{ fontFamily: 'Arial, sans-serif' }}>
                    {selectedReportInfo?.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{selectedReportInfo?.description}</p>
                </div>
              </div>
              <div className="w-full h-1 bg-gradient-to-r from-primary to-primary/30 rounded-full mt-3" />
            </CardHeader>
            <CardContent className="pt-6">
              <ReportFilters
                reportType={selectedReport === "faltas" ? "faltas-atrasos" : selectedReport}
                filters={filters}
                onFilterChange={setFilters}
                onGenerate={generateReport}
                funcionarios={funcionarios?.map((f: any) => ({ id: f.id, nome: f.nome })) || []}
                escalas={uniqueEscalas}
                turnos={uniqueTurnos}
              />
            </CardContent>
          </Card>
        )}

        {/* Generated Report */}
        {generatedData && (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                onClick={() => setGeneratedData(null)}
                className="text-sm text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2 rounded-md flex items-center gap-1 transition-colors"
              >
                ← Voltar aos filtros
              </button>
              <ExportOptions
                data={generatedData.details || []}
                reportTitle={selectedReportInfo?.name || "Relatório"}
                summary={generatedData.summary}
                charts={generatedData.charts}
              />
            </div>
            <ReportViewer reportType={selectedReport} data={generatedData} />
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton to="/gestao-rh" />
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>Relatórios e Análises</h1>
            <p className="text-sm text-muted-foreground">Análise de dados e métricas</p>
          </div>
        </div>
      </div>

      <ReportSelector reports={reportOptions} onSelectReport={handleSelectReport} />
    </div>
  );
};

export default Relatorios;
