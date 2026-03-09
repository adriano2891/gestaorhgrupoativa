import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { BarChart3, Download, Users, Clock, FileText, DollarSign, TrendingDown, Briefcase, Receipt, AlertCircle, CalendarDays, Heart, HardHat } from "lucide-react";
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

  const { data: funcionarios } = useFuncionarios();
  const { data: todosFuncionarios } = useQuery({
    queryKey: ["todos-funcionarios-turnover"],
    queryFn: async () => {
      const roles: { user_id: string; role: string }[] = await restGet('user_roles?select=user_id,role');
      const employeeIds = new Set<string>();
      const adminIds = new Set<string>();
      (roles || []).forEach(r => {
        if (r.role === 'funcionario') employeeIds.add(r.user_id);
        if (['admin', 'gestor', 'rh'].includes(r.role)) adminIds.add(r.user_id);
      });
      const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
      if (targetIds.length === 0) return [];
      const idsParam = targetIds.map(id => `"${id}"`).join(',');
      const profiles: any[] = await restGet(`profiles?select=*&id=in.(${idsParam})&tipo_perfil=eq.funcionario&order=nome.asc&limit=2000`);
      return (profiles || []) as any[];
    },
    retry: 2,
    staleTime: 1000 * 30,
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
        let data = registros || [];
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
          // Hours-based absenteeism matching reference
          const empStats: Record<string, { nome: string; dept: string; horasPrevistas: number; horasPerdidas: number }> = {};
          data.forEach((r: any) => {
            const uid = r.user_id;
            const carga = getCargaPrevista(uid);
            if (!empStats[uid]) {
              empStats[uid] = {
                nome: r.profiles?.nome || funcMap.get(uid)?.nome || "-",
                dept: r.profiles?.departamento || funcMap.get(uid)?.departamento || "N/I",
                horasPrevistas: 0,
                horasPerdidas: 0,
              };
            }
            empStats[uid].horasPrevistas += carga;
            if (!r.entrada) {
              empStats[uid].horasPerdidas += carga;
            } else {
              const horasTrab = parseHoras(r.total_horas);
              if (horasTrab < carga) {
                empStats[uid].horasPerdidas += (carga - horasTrab);
              }
            }
          });

          const empList = Object.values(empStats);
          const totalHorasPrevistas = empList.reduce((a, e) => a + e.horasPrevistas, 0);
          const totalHorasPerdidas = empList.reduce((a, e) => a + e.horasPerdidas, 0);
          const taxaMedia = totalHorasPrevistas > 0 ? ((totalHorasPerdidas / totalHorasPrevistas) * 100) : 0;

          // Department stats
          const deptAbsStats: Record<string, { previstas: number; perdidas: number }> = {};
          empList.forEach(e => {
            if (!deptAbsStats[e.dept]) deptAbsStats[e.dept] = { previstas: 0, perdidas: 0 };
            deptAbsStats[e.dept].previstas += e.horasPrevistas;
            deptAbsStats[e.dept].perdidas += e.horasPerdidas;
          });

          // Per-department pie data (hours lost distribution)
          const deptHorasPerdidas = Object.entries(deptAbsStats)
            .filter(([, s]) => s.perdidas > 0)
            .map(([dept, s]) => ({ departamento: dept, valor: parseFloat(s.perdidas.toFixed(1)) }));

          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Taxa Média Geral": `${taxaMedia.toFixed(1)}%`,
              "Horas Previstas": `${totalHorasPrevistas.toFixed(0)}h`,
              "Horas Perdidas": `${totalHorasPerdidas.toFixed(1)}h`,
              "Funcionários Analisados": empList.length,
              "Departamentos": Object.keys(deptAbsStats).length,
            },
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
                insight: `A taxa média geral é ${taxaMedia.toFixed(1)}%. Valores acima de 5% requerem investigação.`,
              },
              {
                type: "pie",
                title: "2. Distribuição do Absenteísmo",
                description: "Proporção de horas perdidas entre departamentos",
                data: deptHorasPerdidas.length > 0 ? deptHorasPerdidas : [{ departamento: "Sem dados", valor: 0 }],
              },
            ],
            details: empList.map(e => {
              const taxa = e.horasPrevistas > 0 ? ((e.horasPerdidas / e.horasPrevistas) * 100) : 0;
              return {
                funcionario: e.nome,
                departamento: e.dept,
                "horas Previstas": `${e.horasPrevistas.toFixed(1)}h`,
                "horas Perdidas": `${e.horasPerdidas.toFixed(1)}h`,
                "taxa Absenteismo": `${taxa.toFixed(1)}%`,
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
        if (filters.dataInicio) {
          filtered = filtered.filter((f: any) => f.data_admissao >= filters.dataInicio || !f.data_admissao);
        }

        const total = filtered.length;
        const ativos = filtered.filter((f: any) => {
          const st = (f.status || "ativo").toLowerCase();
          return st !== "demitido" && st !== "pediu_demissao" && st !== "em_ferias";
        });
        const emFerias = filtered.filter((f: any) => {
          const st = (f.status || "").toLowerCase();
          return st === "em_ferias";
        });
        // Também contar quem tem férias aprovadas/em andamento
        const feriasData = ferias || [];
        const feriasPorFunc: Record<string, number> = {};
        feriasData.forEach((f: any) => {
          if (["aprovado", "em_andamento"].includes(f.status)) {
            feriasPorFunc[f.user_id] = (feriasPorFunc[f.user_id] || 0) + (f.dias_solicitados || 0);
          }
        });
        const filteredIds = new Set(filtered.map((f: any) => f.id));
        const totalFeriasAtivas = feriasData.filter((f: any) => filteredIds.has(f.user_id) && ["aprovado", "em_andamento"].includes(f.status)).length;
        const totalDiasFerias = feriasData.filter((f: any) => filteredIds.has(f.user_id) && ["aprovado", "em_andamento", "concluido"].includes(f.status)).reduce((acc: number, f: any) => acc + (f.dias_solicitados || 0), 0);

        const desligados = filtered.filter((f: any) => {
          const st = (f.status || "").toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          return st === "demitido" || st === "pediu_demissao" || st === "demissao";
        });

        // Filter by motivo/tipo de movimentação
        let movimentacoes = filtered;
        if (filters.tipoMovimentacao && filters.tipoMovimentacao !== "todos") {
          if (filters.tipoMovimentacao === "admissao") {
            movimentacoes = ativos;
          } else if (filters.tipoMovimentacao === "desligamento") {
            movimentacoes = desligados;
          }
        }
        if (filters.motivo && filters.motivo !== "todos") {
          movimentacoes = movimentacoes.filter((f: any) => {
            const st = (f.status || "").toLowerCase();
            if (filters.motivo === "pedido") return st === "pediu_demissao";
            if (filters.motivo === "justa-causa" || filters.motivo === "sem-justa-causa") return st === "demitido";
            return true;
          });
        }

        const taxaTurnover = total > 0 ? ((desligados.length / total) * 100).toFixed(1) : "0";
        const taxaRetencao = total > 0 ? (((ativos.length + emFerias.length) / total) * 100).toFixed(1) : "0";

        const motivoCount: Record<string, number> = {};
        desligados.forEach((f: any) => {
          const st = (f.status || "").toLowerCase();
          const label = st === "pediu_demissao" ? "Pedido de Demissão" : st === "demitido" ? "Demissão pela Empresa" : "Outro";
          motivoCount[label] = (motivoCount[label] || 0) + 1;
        });

        const deptDesligamentos: Record<string, number> = {};
        desligados.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          deptDesligamentos[d] = (deptDesligamentos[d] || 0) + 1;
        });

        const deptAtivos: Record<string, number> = {};
        ativos.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          deptAtivos[d] = (deptAtivos[d] || 0) + 1;
        });

        // Admissões por mês
        const admissoesMes: Record<string, number> = {};
        filtered.forEach((f: any) => {
          if (f.data_admissao) {
            const mes = f.data_admissao.substring(0, 7);
            admissoesMes[mes] = (admissoesMes[mes] || 0) + 1;
          }
        });

        const allDepts = [...new Set([...Object.keys(deptDesligamentos), ...Object.keys(deptAtivos)])];

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Taxa de Turnover": `${taxaTurnover}%`,
            "Taxa de Retenção": `${taxaRetencao}%`,
            "Total de Funcionários": total,
            "Ativos": ativos.length,
            "Em Férias": emFerias.length,
            "Férias Aprovadas/Andamento": totalFeriasAtivas,
            "Total Dias de Férias": totalDiasFerias,
            "Desligamentos": desligados.length,
          },
          charts: [
            {
              type: "pie",
              title: "1. Distribuição Geral",
              description: "Ativos, em férias e desligados",
              data: [
                { tipo: "Ativos", valor: ativos.length },
                ...(emFerias.length > 0 ? [{ tipo: "Em Férias", valor: emFerias.length }] : []),
                ...(desligados.length > 0 ? [{ tipo: "Desligados", valor: desligados.length }] : []),
              ],
            },
            {
              type: "bar",
              title: "2. Funcionários por Departamento",
              description: "Distribuição atual de colaboradores por área",
              data: Object.entries(deptAtivos).map(([dept, count]) => ({ departamento: dept, valor: count })),
              dataName: "Funcionários",
            },
            ...(Object.keys(motivoCount).length > 0 ? [{
              type: "pie",
              title: "3. Motivos de Desligamento",
              description: "Distribuição dos motivos de saída",
              data: Object.entries(motivoCount).map(([motivo, count]) => ({ motivo, valor: count })),
            }] : []),
          ],
          details: filtered.slice(0, 200).map((f: any) => {
            const diasFerias = feriasPorFunc[f.id] || 0;
            return {
              nome: f.nome || "-",
              departamento: f.departamento || "-",
              cargo: f.cargo || "-",
              "data Admissao": f.data_admissao ? format(new Date(f.data_admissao + 'T12:00:00'), 'dd/MM/yyyy') : "-",
              "dias Ferias": diasFerias > 0 ? `${diasFerias}d` : "-",
              status: (() => {
                const st = (f.status || "ativo").toLowerCase();
                if (st === "em_ferias") return "Em férias";
                if (st === "ativo") return "Ativo";
                if (st === "demitido") return "Demitido";
                if (st === "pediu_demissao") return "Pediu demissão";
                return f.status || "Ativo";
              })(),
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

        // Afastamentos ativos
        const afastAtivos = (afastamentos || []).filter((a: any) => {
          if (!filteredIds.has(a.user_id)) return false;
          return a.status === "ativo" || a.status === "em_andamento" || !a.data_retorno;
        });

        // CATs
        const catsData = (cats || []).filter((c: any) => filteredIds.has(c.user_id));
        let diasSemAcidentes = 120;
        if (catsData.length > 0) {
          const ultimaCat = [...catsData].sort((a: any, b: any) => b.data_acidente.localeCompare(a.data_acidente))[0];
          try { diasSemAcidentes = differenceInDays(new Date(), new Date(ultimaCat.data_acidente)); } catch {}
        }
        const taxaIncidentes = filtered.length > 0 ? ((catsData.length / filtered.length) * 100).toFixed(1) : "0.0";

        // CATs por tipo
        const catTipoCount: Record<string, number> = {};
        catsData.forEach((c: any) => {
          const t = c.tipo || "Típico";
          catTipoCount[t] = (catTipoCount[t] || 0) + 1;
        });

        // ASOs
        const asosData = (asos || []).filter((a: any) => filteredIds.has(a.user_id));
        const lastExamByUser: Record<string, string> = {};
        asosData.forEach((a: any) => {
          if (!lastExamByUser[a.user_id] || a.data_exame > lastExamByUser[a.user_id]) {
            lastExamByUser[a.user_id] = a.data_exame;
          }
        });

        // ASOs por tipo
        const asoTipoCount: Record<string, number> = {};
        asosData.forEach((a: any) => {
          const t = a.tipo || "Periódico";
          asoTipoCount[t] = (asoTipoCount[t] || 0) + 1;
        });

        // ASOs vencidos
        const hoje = new Date();
        const asosVencidos = asosData.filter((a: any) => a.data_vencimento && new Date(a.data_vencimento) < hoje).length;

        // EPIs
        const episData = (epiEntregas || []).filter((e: any) => filteredIds.has(e.user_id));
        const totalEPIs = episData.length;
        const episAssinados = episData.filter((e: any) => e.assinado).length;

        // CIPA
        const cipaAtivos = (cipaMembros || []).filter((m: any) => m.ativo).length;
        const cipaTotal = (cipaMembros || []).length;

        // Dept stats for exams chart
        const deptExames: Record<string, number> = {};
        filtered.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          if (lastExamByUser[f.id]) {
            deptExames[d] = (deptExames[d] || 0) + 1;
          }
        });

        // Status distribution
        const statusSaude: Record<string, number> = {};
        filtered.forEach((f: any) => {
          const hasAfastamento = afastAtivos.some((a: any) => a.user_id === f.id);
          const label = hasAfastamento ? "Afastado" : "Ativo";
          statusSaude[label] = (statusSaude[label] || 0) + 1;
        });

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Dias sem Acidentes": diasSemAcidentes,
            "Total CATs": catsData.length,
            "Taxa de Incidentes": `${taxaIncidentes}%`,
            "Afastamentos Ativos": afastAtivos.length,
            "Total ASOs": asosData.length,
            "ASOs Vencidos": asosVencidos,
            "EPIs Entregues": totalEPIs,
            "EPIs Assinados": episAssinados,
            "Membros CIPA Ativos": cipaAtivos,
            "Colaboradores Monitorados": filtered.length,
          },
          charts: [
            {
              type: "pie",
              title: "1. Status de Saúde dos Colaboradores",
              description: "Proporção de colaboradores ativos vs afastados",
              data: Object.entries(statusSaude).map(([status, count]) => ({ status, valor: count })),
            },
            {
              type: "bar",
              title: "2. Exames (ASOs) por Departamento",
              description: "Quantidade de exames realizados por área",
              data: Object.entries(deptExames).map(([dept, count]) => ({ departamento: dept, valor: count })),
              dataName: "Exames",
              insight: "Exames periódicos são obrigatórios conforme NR-7.",
            },
            ...(Object.keys(asoTipoCount).length > 0 ? [{
              type: "pie",
              title: "3. ASOs por Tipo de Exame",
              description: "Distribuição dos exames ocupacionais por tipo",
              data: Object.entries(asoTipoCount).map(([tipo, count]) => ({ tipo, valor: count })),
            }] : []),
            ...(Object.keys(catTipoCount).length > 0 ? [{
              type: "pie",
              title: "4. CATs por Tipo de Acidente",
              description: "Distribuição das Comunicações de Acidentes de Trabalho",
              data: Object.entries(catTipoCount).map(([tipo, count]) => ({ tipo, valor: count })),
            }] : []),
          ],
          details: filtered.slice(0, 200).map((f: any) => {
            const hasAfastamento = afastAtivos.some((a: any) => a.user_id === f.id);
            const ultimoExame = lastExamByUser[f.id];
            const episFunc = episData.filter((e: any) => e.user_id === f.id);
            const catsFunc = catsData.filter((c: any) => c.user_id === f.id);
            const asosFunc = asosData.filter((a: any) => a.user_id === f.id);
            return {
              nome: f.nome || "-",
              departamento: f.departamento || "-",
              cargo: f.cargo || "-",
              "status Saude": hasAfastamento ? "Afastado" : "Ativo",
              "ultimo ASO": ultimoExame ? format(new Date(ultimoExame), 'dd/MM/yyyy') : "Sem exame",
              "total ASOs": asosFunc.length,
              "total EPIs": episFunc.length,
              "total CATs": catsFunc.length,
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

        // Enrich with employee data
        const funcMap = new Map((funcionarios || []).map((f: any) => [f.id, f]));
        if (filters.departamento && filters.departamento !== "todos") {
          data = data.filter((h: any) => {
            const func = funcMap.get(h.user_id);
            return func?.departamento?.toLowerCase().includes(filters.departamento.toLowerCase());
          });
        }

        const totalProventos = data.reduce((acc: number, h: any) => acc + (parseFloat(h.salario_bruto) || 0), 0);
        const totalDescontos = data.reduce((acc: number, h: any) => acc + (parseFloat(h.descontos) || 0), 0);
        const totalLiquido = data.reduce((acc: number, h: any) => acc + (parseFloat(h.salario_liquido) || 0), 0);
        const totalINSS = data.reduce((acc: number, h: any) => acc + (parseFloat(h.inss) || 0), 0);
        const totalIRRF = data.reduce((acc: number, h: any) => acc + (parseFloat(h.irrf) || 0), 0);
        const totalFGTS = data.reduce((acc: number, h: any) => acc + (parseFloat(h.fgts) || 0), 0);
        const totalColab = new Set(data.map((h: any) => h.user_id)).size;

        // By department
        const deptCusto: Record<string, number> = {};
        data.forEach((h: any) => {
          const func = funcMap.get(h.user_id);
          const d = func?.departamento || "Sem Departamento";
          deptCusto[d] = (deptCusto[d] || 0) + (parseFloat(h.salario_bruto) || 0);
        });

        // Monthly trend
        const mesTrend: Record<string, { bruto: number; liquido: number }> = {};
        data.forEach((h: any) => {
          const ref = `${h.ano}-${String(h.mes).padStart(2, "0")}`;
          if (!mesTrend[ref]) mesTrend[ref] = { bruto: 0, liquido: 0 };
          mesTrend[ref].bruto += parseFloat(h.salario_bruto) || 0;
          mesTrend[ref].liquido += parseFloat(h.salario_liquido) || 0;
        });

        const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Período": periodoLabel,
            "Total Pagamentos": data.length,
            "Colaboradores": totalColab,
            "Total Proventos": fmt(totalProventos),
            "Total Descontos": fmt(totalDescontos),
            "INSS": fmt(totalINSS),
            "IRRF": fmt(totalIRRF),
            "FGTS": fmt(totalFGTS),
            "Remuneração Líquida": fmt(totalLiquido),
          },
          charts: [
            {
              type: "bar",
              title: "Composição da Folha",
              description: "Proventos vs Descontos vs Líquido",
              data: [
                { categoria: "Proventos", valor: parseFloat(totalProventos.toFixed(2)) },
                { categoria: "Descontos", valor: parseFloat(totalDescontos.toFixed(2)) },
                { categoria: "Líquido", valor: parseFloat(totalLiquido.toFixed(2)) },
              ],
              dataName: "Valor (R$)",
            },
            {
              type: "bar",
              title: "Custo por Departamento",
              description: "Salário bruto total por departamento",
              data: Object.entries(deptCusto).map(([dept, valor]) => ({ departamento: dept, valor: parseFloat(valor.toFixed(2)) })),
              dataName: "R$",
            },
            {
              type: "bar",
              title: "Evolução Mensal",
              description: "Bruto e líquido por mês",
              data: Object.entries(mesTrend).sort(([a], [b]) => a.localeCompare(b)).map(([mes, v]) => ({
                mês: mes,
                Bruto: parseFloat(v.bruto.toFixed(2)),
                Líquido: parseFloat(v.liquido.toFixed(2)),
              })),
              dataName: "R$",
            },
          ],
          details: data.slice(0, 100).map((h: any) => {
            const func = funcMap.get(h.user_id);
            return {
              Funcionário: func?.nome || "-",
              Departamento: func?.departamento || "-",
              Cargo: func?.cargo || "-",
              "Mês/Ano": `${String(h.mes).padStart(2, "0")}/${h.ano}`,
              "Sal. Bruto": fmt(parseFloat(h.salario_bruto) || 0),
              INSS: fmt(parseFloat(h.inss) || 0),
              IRRF: fmt(parseFloat(h.irrf) || 0),
              FGTS: fmt(parseFloat(h.fgts) || 0),
              Descontos: fmt(parseFloat(h.descontos) || 0),
              Líquido: fmt(parseFloat(h.salario_liquido) || 0),
            };
          }),
        });
        break;
      }

      case "custo-folha": {
        let data = holerites || [];
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
        const totalBruto = data.reduce((acc: number, h: any) => acc + (parseFloat(h.salario_bruto) || 0), 0);
        const totalDescontos = data.reduce((acc: number, h: any) => acc + (parseFloat(h.descontos) || 0), 0);
        const totalLiquido = data.reduce((acc: number, h: any) => acc + (parseFloat(h.salario_liquido) || 0), 0);
        const totalINSS = data.reduce((acc: number, h: any) => acc + (parseFloat(h.inss) || 0), 0);
        const totalIRRF = data.reduce((acc: number, h: any) => acc + (parseFloat(h.irrf) || 0), 0);
        const totalFGTS = data.reduce((acc: number, h: any) => acc + (parseFloat(h.fgts) || 0), 0);
        const encargosEstimados = totalBruto * 0.368;
        const totalColab = new Set(data.map((h: any) => h.user_id)).size;

        // Benefícios dos funcionários presentes na folha
        const empIds = new Set(data.map((h: any) => h.user_id));
        const bensAtivos = (beneficios || []).filter((b: any) => empIds.has(b.user_id));
        const totalBeneficios = bensAtivos.reduce((acc: number, b: any) => {
          if (["plano_saude", "plano_odontologico"].includes(b.tipo)) return acc;
          return acc + (b.valor || 0);
        }, 0);
        const totalPlanos = bensAtivos.filter((b: any) => ["plano_saude", "plano_odontologico"].includes(b.tipo)).length;

        const custoTotal = totalBruto + encargosEstimados + totalBeneficios;
        const custoMedio = totalColab > 0 ? custoTotal / totalColab : 0;
        const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

        // Custo por departamento (bruto + encargos + benefícios)
        const deptCusto: Record<string, { bruto: number; beneficios: number }> = {};
        data.forEach((h: any) => {
          const func = funcMap.get(h.user_id);
          const d = func?.departamento || "Sem Departamento";
          if (!deptCusto[d]) deptCusto[d] = { bruto: 0, beneficios: 0 };
          deptCusto[d].bruto += parseFloat(h.salario_bruto) || 0;
        });
        bensAtivos.forEach((b: any) => {
          const func = funcMap.get(b.user_id);
          const d = func?.departamento || "Sem Departamento";
          if (!deptCusto[d]) deptCusto[d] = { bruto: 0, beneficios: 0 };
          if (!["plano_saude", "plano_odontologico"].includes(b.tipo)) {
            deptCusto[d].beneficios += b.valor || 0;
          }
        });

        // Tipo de benefício custo
        const tipoBenCusto: Record<string, number> = {};
        const tipoLabels: Record<string, string> = {
          vale_transporte: "VT", vale_alimentacao: "VA", vale_refeicao: "VR",
          plano_saude: "Plano Saúde", plano_odontologico: "Plano Odonto",
        };
        bensAtivos.forEach((b: any) => {
          const t = tipoLabels[b.tipo] || b.tipo || "Outro";
          tipoBenCusto[t] = (tipoBenCusto[t] || 0) + (b.valor || 0);
        });

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Período": filters.mes && filters.ano ? `${filters.mes}/${filters.ano}` : periodoLabel,
            "Total Pagamentos": data.length,
            "Colaboradores": totalColab,
            "Total Proventos": fmt(totalBruto),
            "Total Descontos": fmt(totalDescontos),
            "INSS": fmt(totalINSS),
            "IRRF": fmt(totalIRRF),
            "FGTS": fmt(totalFGTS),
            "Remuneração Líquida": fmt(totalLiquido),
            "Benefícios (VT/VA/VR)": fmt(totalBeneficios),
            "Planos de Saúde/Odonto": `${totalPlanos} ativos`,
            "Encargos Estimados (36.8%)": fmt(encargosEstimados),
            "Custo Total Estimado": fmt(custoTotal),
            "Custo Médio/Colaborador": fmt(custoMedio),
          },
          charts: [
            {
              type: "bar",
              title: "1. Custo Total por Departamento",
              description: "Folha bruta + benefícios por departamento",
              data: Object.entries(deptCusto).map(([dept, v]) => ({
                departamento: dept,
                Folha: parseFloat(v.bruto.toFixed(2)),
                Benefícios: parseFloat(v.beneficios.toFixed(2)),
              })),
              dataName: "R$",
            },
            {
              type: "pie",
              title: "2. Composição do Custo Total",
              description: "Distribuição entre proventos, encargos e benefícios",
              data: [
                { categoria: "Proventos", valor: parseFloat(totalBruto.toFixed(2)) },
                { categoria: "Descontos", valor: parseFloat(totalDescontos.toFixed(2)) },
                { categoria: "Encargos (36.8%)", valor: parseFloat(encargosEstimados.toFixed(2)) },
                { categoria: "Benefícios", valor: parseFloat(totalBeneficios.toFixed(2)) },
              ],
            },
            {
              type: "pie",
              title: "3. Encargos Trabalhistas",
              description: "Distribuição INSS, IRRF e FGTS",
              data: [
                ...(totalINSS > 0 ? [{ encargo: "INSS", valor: parseFloat(totalINSS.toFixed(2)) }] : []),
                ...(totalIRRF > 0 ? [{ encargo: "IRRF", valor: parseFloat(totalIRRF.toFixed(2)) }] : []),
                ...(totalFGTS > 0 ? [{ encargo: "FGTS", valor: parseFloat(totalFGTS.toFixed(2)) }] : []),
              ],
            },
            ...(Object.keys(tipoBenCusto).length > 0 ? [{
              type: "bar",
              title: "4. Custo por Tipo de Benefício",
              description: "Distribuição dos custos com benefícios",
              data: Object.entries(tipoBenCusto).map(([tipo, valor]) => ({ tipo, valor: parseFloat(valor.toFixed(2)) })),
              dataName: "R$",
            }] : []),
            {
              type: "bar",
              title: "5. Bruto vs Líquido por Departamento",
              description: "Comparativo entre salário bruto e líquido",
              data: (() => {
                const deptLiq: Record<string, { bruto: number; liquido: number }> = {};
                data.forEach((h: any) => {
                  const func = funcMap.get(h.user_id);
                  const d = func?.departamento || "Sem Departamento";
                  if (!deptLiq[d]) deptLiq[d] = { bruto: 0, liquido: 0 };
                  deptLiq[d].bruto += parseFloat(h.salario_bruto) || 0;
                  deptLiq[d].liquido += parseFloat(h.salario_liquido) || 0;
                });
                return Object.entries(deptLiq).map(([dept, v]) => ({
                  departamento: dept,
                  Bruto: parseFloat(v.bruto.toFixed(2)),
                  Líquido: parseFloat(v.liquido.toFixed(2)),
                }));
              })(),
              dataName: "R$",
            },
          ],
          details: data.slice(0, 100).map((h: any) => {
            const func = funcMap.get(h.user_id);
            const empBens = bensAtivos.filter((b: any) => b.user_id === h.user_id);
            const empBenTotal = empBens.reduce((acc: number, b: any) => {
              if (["plano_saude", "plano_odontologico"].includes(b.tipo)) return acc;
              return acc + (b.valor || 0);
            }, 0);
            const empEncargos = (parseFloat(h.salario_bruto) || 0) * 0.368;
            return {
              Funcionário: func?.nome || "-",
              Departamento: func?.departamento || "-",
              Cargo: func?.cargo || "-",
              "Mês/Ano": `${String(h.mes).padStart(2, "0")}/${h.ano}`,
              "Sal. Bruto": fmt(parseFloat(h.salario_bruto) || 0),
              INSS: fmt(parseFloat(h.inss) || 0),
              IRRF: fmt(parseFloat(h.irrf) || 0),
              FGTS: fmt(parseFloat(h.fgts) || 0),
              Benefícios: fmt(empBenTotal),
              Encargos: fmt(empEncargos),
              Descontos: fmt(parseFloat(h.descontos) || 0),
              Líquido: fmt(parseFloat(h.salario_liquido) || 0),
              "Custo Total": fmt((parseFloat(h.salario_bruto) || 0) + empEncargos + empBenTotal),
            };
          }),
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
