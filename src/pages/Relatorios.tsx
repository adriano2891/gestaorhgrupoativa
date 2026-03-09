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
import { useRegistrosPonto } from "@/hooks/useRegistrosPonto";
import { useHolerites } from "@/hooks/useHolerites";
import { useSolicitacoesFerias } from "@/hooks/useFerias";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

const reportOptions = [
  { id: "funcionarios", name: "Relatório de Funcionários", icon: Users, category: "Gestão de Pessoas", description: "Informações completas dos colaboradores" },
  { id: "ferias", name: "Férias e Afastamentos", icon: Briefcase, category: "Gestão de Pessoas", description: "Controle de férias, licenças e afastamentos" },
  { id: "faltas", name: "Faltas e Atrasos", icon: AlertCircle, category: "Frequência", description: "Análise de ausências e pontualidade" },
  { id: "pontos", name: "Pontos Registrados", icon: Clock, category: "Frequência", description: "Registro detalhado de ponto eletrônico" },
  { id: "turnover", name: "Turnover", icon: TrendingDown, category: "Indicadores", description: "Taxa de rotatividade e movimentações" },
  { id: "absenteismo", name: "Absenteísmo", icon: CalendarDays, category: "Indicadores", description: "Índices e tendências de ausências" },
  { id: "desempenho", name: "Desempenho", icon: BarChart3, category: "Indicadores", description: "Avaliações de performance e metas dos colaboradores" },
  { id: "beneficios", name: "Benefícios", icon: Heart, category: "Bem-estar", description: "Relatório de benefícios por funcionário" },
  { id: "sst", name: "Saúde e Segurança", icon: HardHat, category: "Bem-estar", description: "Relatório de SST, ASOs, EPIs e CATs" },
  { id: "holerites", name: "Folha de Pagamento", icon: FileText, category: "Custos", description: "Resumo da folha com proventos, descontos e líquido" },
  { id: "custo-folha", name: "Custo de Folha de Ponto", icon: DollarSign, category: "Custos", description: "Análise de custos com folha, encargos e benefícios" },
];

const Relatorios = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({ departamento: "todos" });
  const [generatedData, setGeneratedData] = useState<any>(null);

  const { data: funcionarios } = useFuncionarios();
  const { data: registros } = useRegistrosPonto();
  const { data: holerites } = useHolerites();
  const { data: ferias } = useSolicitacoesFerias();
  const { data: beneficios } = useQuery({
    queryKey: ["beneficios-relatorio"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("beneficios_funcionario")
        .select("*")
        .eq("ativo", true);
      if (error) throw error;
      return data || [];
    },
  });

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
        const ativos = data.filter((f: any) => f.status === "ativo" || !f.status).length;
        const deptCount: Record<string, number> = {};
        data.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          deptCount[d] = (deptCount[d] || 0) + 1;
        });
        const statusCount: Record<string, number> = {};
        data.forEach((f: any) => {
          const s = f.status || "Ativo";
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
              title: "Funcionários por Departamento",
              description: "Distribuição dos colaboradores por departamento",
              data: Object.entries(deptCount).map(([dept, count]) => ({ departamento: dept, valor: count })),
              dataName: "Funcionários",
            },
            {
              type: "pie",
              title: "Distribuição por Status",
              description: "Status atual dos colaboradores",
              data: Object.entries(statusCount).map(([status, count]) => ({ status, valor: count })),
            },
          ],
          details: data.slice(0, 100).map((f: any) => ({
            Nome: f.nome || "-",
            Cargo: f.cargo || "-",
            Departamento: f.departamento || "-",
            Status: f.status || "Ativo",
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

        // Build employee lookup for enrichment
        const funcMap = new Map((funcionarios || []).map((f: any) => [f.id, f]));

        if (selectedReport === "faltas") {
          // Faltas: days without entry record
          const faltas = data.filter((r: any) => !r.entrada);
          // Atrasos: extract hour from timestamptz entrada
          const atrasos = data.filter((r: any) => {
            if (!r.entrada) return false;
            try {
              const entradaDate = new Date(r.entrada);
              const hora = entradaDate.getHours();
              const minutos = entradaDate.getMinutes();
              // Consider late if arrived after 08:10 (10min tolerance per CLT Art. 58 §1º)
              return hora > 8 || (hora === 8 && minutos > 10);
            } catch {
              return false;
            }
          });

          // Cross-reference: employees with NO records at all in the period
          const empComRegistro = new Set(data.map((r: any) => r.user_id));
          const funcsAtivos = (funcionarios || []).filter((f: any) => {
            const st = (f.status || "ativo").toLowerCase();
            return st !== "demitido" && st !== "pediu_demissao";
          });
          const semRegistro = funcsAtivos.filter((f: any) => !empComRegistro.has(f.id));

          const deptFaltas: Record<string, number> = {};
          faltas.forEach((r: any) => {
            const d = r.profiles?.departamento || "Sem Departamento";
            deptFaltas[d] = (deptFaltas[d] || 0) + 1;
          });

          const deptAtrasos: Record<string, number> = {};
          atrasos.forEach((r: any) => {
            const d = r.profiles?.departamento || "Sem Departamento";
            deptAtrasos[d] = (deptAtrasos[d] || 0) + 1;
          });

          // Combined chart data
          const allDepts = [...new Set([...Object.keys(deptFaltas), ...Object.keys(deptAtrasos)])];

          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Período": periodoLabel,
              "Total Registros": data.length,
              "Colaboradores Analisados": new Set(data.map((r: any) => r.user_id)).size,
              "Faltas": faltas.length,
              "Atrasos": atrasos.length,
              "Taxa de Faltas": data.length > 0 ? `${((faltas.length / data.length) * 100).toFixed(1)}%` : "0%",
              "Sem Registros no Período": semRegistro.length,
            },
            charts: [
              {
                type: "bar",
                title: "Faltas por Departamento",
                description: "Distribuição de faltas por departamento",
                data: allDepts.map(dept => ({ departamento: dept, Faltas: deptFaltas[dept] || 0, Atrasos: deptAtrasos[dept] || 0 })),
                dataName: "Faltas",
              },
              {
                type: "pie",
                title: "Proporção Faltas vs Atrasos",
                description: "Comparativo entre faltas e atrasos",
                data: [
                  { tipo: "Faltas", valor: faltas.length },
                  { tipo: "Atrasos", valor: atrasos.length },
                ],
              },
            ],
            details: [
              ...faltas.slice(0, 50).map((r: any) => ({
                Funcionário: r.profiles?.nome || funcMap.get(r.user_id)?.nome || "-",
                Data: r.data || "-",
                Departamento: r.profiles?.departamento || funcMap.get(r.user_id)?.departamento || "-",
                Cargo: funcMap.get(r.user_id)?.cargo || "-",
                Ocorrência: "Falta",
                "Horário Entrada": "-",
              })),
              ...atrasos.slice(0, 50).map((r: any) => {
                let horaStr = "-";
                try {
                  const d = new Date(r.entrada);
                  horaStr = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
                } catch {}
                return {
                  Funcionário: r.profiles?.nome || funcMap.get(r.user_id)?.nome || "-",
                  Data: r.data || "-",
                  Departamento: r.profiles?.departamento || funcMap.get(r.user_id)?.departamento || "-",
                  Cargo: funcMap.get(r.user_id)?.cargo || "-",
                  Ocorrência: "Atraso",
                  "Horário Entrada": horaStr,
                };
              }),
            ],
          });
        } else if (selectedReport === "absenteismo") {
          // Cross-reference registros with funcionarios for comprehensive analysis
          const funcsAtivos = (funcionarios || []).filter((f: any) => {
            const st = (f.status || "ativo").toLowerCase();
            return st !== "demitido" && st !== "pediu_demissao";
          });

          const deptStats: Record<string, { total: number; ausencias: number; atrasos: number }> = {};
          data.forEach((r: any) => {
            const d = r.profiles?.departamento || "Sem Departamento";
            if (!deptStats[d]) deptStats[d] = { total: 0, ausencias: 0, atrasos: 0 };
            deptStats[d].total++;
            if (!r.entrada) {
              deptStats[d].ausencias++;
            } else {
              try {
                const entradaDate = new Date(r.entrada);
                const h = entradaDate.getHours();
                const m = entradaDate.getMinutes();
                if (h > 8 || (h === 8 && m > 10)) deptStats[d].atrasos++;
              } catch {}
            }
          });

          const totalAusencias = data.filter((r: any) => !r.entrada).length;
          const totalAtrasos = data.filter((r: any) => {
            if (!r.entrada) return false;
            try {
              const d = new Date(r.entrada);
              return d.getHours() > 8 || (d.getHours() === 8 && d.getMinutes() > 10);
            } catch { return false; }
          }).length;
          const totalColab = new Set(data.map((r: any) => r.user_id)).size;

          // Período aquisitivo analysis per employee
          const empComRegistro = new Set(data.map((r: any) => r.user_id));
          const semRegistro = funcsAtivos.filter((f: any) => !empComRegistro.has(f.id));

          // Per-employee absenteeism ranking
          const empAusencias: Record<string, { nome: string; dept: string; cargo: string; ausencias: number; total: number }> = {};
          data.forEach((r: any) => {
            const uid = r.user_id;
            if (!empAusencias[uid]) {
              empAusencias[uid] = {
                nome: r.profiles?.nome || funcMap.get(uid)?.nome || "-",
                dept: r.profiles?.departamento || funcMap.get(uid)?.departamento || "-",
                cargo: funcMap.get(uid)?.cargo || "-",
                ausencias: 0,
                total: 0,
              };
            }
            empAusencias[uid].total++;
            if (!r.entrada) empAusencias[uid].ausencias++;
          });

          const rankingAbsenteismo = Object.values(empAusencias)
            .filter(e => e.ausencias > 0)
            .sort((a, b) => b.ausencias - a.ausencias);

          // Monthly trend
          const mesTrend: Record<string, { total: number; ausencias: number }> = {};
          data.forEach((r: any) => {
            if (r.data) {
              const mes = r.data.substring(0, 7);
              if (!mesTrend[mes]) mesTrend[mes] = { total: 0, ausencias: 0 };
              mesTrend[mes].total++;
              if (!r.entrada) mesTrend[mes].ausencias++;
            }
          });

          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Período": periodoLabel,
              "Total Registros": data.length,
              "Colaboradores com Registros": totalColab,
              "Colaboradores Ativos": funcsAtivos.length,
              "Total Ausências": totalAusencias,
              "Total Atrasos": totalAtrasos,
              "Taxa de Absenteísmo": data.length > 0 ? `${((totalAusencias / data.length) * 100).toFixed(1)}%` : "0%",
              "Sem Registros no Período": semRegistro.length,
            },
            charts: [
              {
                type: "bar",
                title: "Absenteísmo por Departamento",
                description: "Taxa de ausências por departamento",
                data: Object.entries(deptStats).map(([dept, stats]) => ({
                  departamento: dept,
                  "Taxa (%)": stats.total > 0 ? parseFloat(((stats.ausencias / stats.total) * 100).toFixed(1)) : 0,
                })),
                dataName: "Taxa (%)",
              },
              {
                type: "bar",
                title: "Tendência Mensal de Absenteísmo",
                description: "Evolução das ausências por mês",
                data: Object.entries(mesTrend).sort(([a], [b]) => a.localeCompare(b)).map(([mes, stats]) => ({
                  mês: mes,
                  valor: stats.total > 0 ? parseFloat(((stats.ausencias / stats.total) * 100).toFixed(1)) : 0,
                })),
                dataName: "Taxa (%)",
              },
            ],
            details: rankingAbsenteismo.length > 0
              ? rankingAbsenteismo.slice(0, 100).map(e => ({
                  Funcionário: e.nome,
                  Departamento: e.dept,
                  Cargo: e.cargo,
                  "Total Registros": e.total,
                  Ausências: e.ausencias,
                  "Taxa Individual": `${((e.ausencias / e.total) * 100).toFixed(1)}%`,
                }))
              : data.filter((r: any) => !r.entrada).slice(0, 100).map((r: any) => ({
                  Funcionário: r.profiles?.nome || funcMap.get(r.user_id)?.nome || "-",
                  Data: r.data || "-",
                  Departamento: r.profiles?.departamento || funcMap.get(r.user_id)?.departamento || "-",
                  Cargo: funcMap.get(r.user_id)?.cargo || "-",
                })),
          });
        } else {
          // pontos
          const deptHoras: Record<string, number> = {};
          data.forEach((r: any) => {
            const d = r.profiles?.departamento || "Sem Departamento";
            deptHoras[d] = (deptHoras[d] || 0) + 1;
          });
          const totalColab = new Set(data.map((r: any) => r.user_id)).size;
          const comHE = data.filter((r: any) => r.horas_extras && r.horas_extras !== "00:00:00").length;
          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Período": periodoLabel,
              "Total Registros": data.length,
              "Colaboradores": totalColab,
              "Registros com Horas Extras": comHE,
            },
            charts: [
              {
                type: "bar",
                title: "Registros por Departamento",
                description: "Quantidade de pontos registrados por departamento",
                data: Object.entries(deptHoras).map(([dept, count]) => ({ departamento: dept, valor: count })),
                dataName: "Registros",
              },
            ],
            details: data.slice(0, 100).map((r: any) => {
              let entradaStr = "-", saidaStr = "-", sAlmocoStr = "-", rAlmocoStr = "-";
              try { if (r.entrada) { const d = new Date(r.entrada); entradaStr = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } } catch {}
              try { if (r.saida) { const d = new Date(r.saida); saidaStr = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } } catch {}
              try { if (r.saida_almoco) { const d = new Date(r.saida_almoco); sAlmocoStr = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } } catch {}
              try { if (r.retorno_almoco) { const d = new Date(r.retorno_almoco); rAlmocoStr = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; } } catch {}
              return {
                Funcionário: r.profiles?.nome || funcMap.get(r.user_id)?.nome || "-",
                Data: r.data || "-",
                Departamento: r.profiles?.departamento || funcMap.get(r.user_id)?.departamento || "-",
                Entrada: entradaStr,
                "S. Almoço": sAlmocoStr,
                "R. Almoço": rAlmocoStr,
                Saída: saidaStr,
                "Total Horas": r.total_horas || "-",
                "Horas Extras": r.horas_extras || "-",
              };
            }),
          });
        }
        break;
      }

      case "turnover": {
        const data = funcionarios || [];
        let filtered = data;
        if (filters.departamento && filters.departamento !== "todos") {
          filtered = filtered.filter((f: any) => f.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }
        if (filters.dataInicio) {
          filtered = filtered.filter((f: any) => f.data_admissao >= filters.dataInicio || !f.data_admissao);
        }

        const total = filtered.length;
        const ativos = filtered.filter((f: any) => {
          const st = (f.status || "ativo").toLowerCase();
          return st !== "demitido" && st !== "pediu_demissao";
        });
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
        const taxaRetencao = total > 0 ? ((ativos.length / total) * 100).toFixed(1) : "0";

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

        // Admissões por mês (últimos 6 meses)
        const admissoesMes: Record<string, number> = {};
        filtered.forEach((f: any) => {
          if (f.data_admissao) {
            const mes = f.data_admissao.substring(0, 7); // YYYY-MM
            admissoesMes[mes] = (admissoesMes[mes] || 0) + 1;
          }
        });

        const allDepts = [...new Set([...Object.keys(deptDesligamentos), ...Object.keys(deptAtivos)])];

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Período": periodoLabel,
            "Total Colaboradores": total,
            "Ativos": ativos.length,
            "Desligamentos": desligados.length,
            "Taxa Turnover": `${taxaTurnover}%`,
            "Taxa Retenção": `${taxaRetencao}%`,
          },
          charts: [
            {
              type: "bar",
              title: "Ativos vs Desligados por Departamento",
              description: "Comparativo por área",
              data: allDepts.map(dept => ({ departamento: dept, Ativos: deptAtivos[dept] || 0, Desligados: deptDesligamentos[dept] || 0 })),
              dataName: "Colaboradores",
            },
            {
              type: "pie",
              title: "Motivo dos Desligamentos",
              description: "Tipo de desligamento",
              data: Object.entries(motivoCount).map(([motivo, count]) => ({ motivo, valor: count })),
            },
            {
              type: "bar",
              title: "Admissões por Mês",
              description: "Volume de admissões ao longo do tempo",
              data: Object.entries(admissoesMes).sort(([a], [b]) => a.localeCompare(b)).map(([mes, count]) => ({ mês: mes, valor: count })),
              dataName: "Admissões",
            },
          ],
          details: movimentacoes.slice(0, 100).map((f: any) => ({
            Nome: f.nome || "-",
            Cargo: f.cargo || "-",
            Departamento: f.departamento || "-",
            "Data Admissão": f.data_admissao || "-",
            Escala: f.escala || "-",
            Status: f.status || "Ativo",
          })),
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

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Período": periodoLabel,
            "Colaboradores Ativos": filtered.length,
            "Total de Benefícios Ativos": bens.length,
            "Custo Total (sem planos)": `R$ ${totalCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            "Sem Benefícios": semBeneficio.length,
            "Tipos Distintos": Object.keys(tipoCount).length,
          },
          charts: [
            {
              type: "pie",
              title: "Distribuição por Tipo de Benefício",
              description: "Quantidade de benefícios por tipo",
              data: Object.entries(tipoCount).map(([tipo, count]) => ({ tipo: tipoLabels[tipo] || tipo, valor: count })),
            },
            {
              type: "bar",
              title: "Benefícios por Departamento",
              description: "Quantidade de benefícios ativos por departamento",
              data: Object.entries(deptBens).map(([dept, count]) => ({ departamento: dept, valor: count })),
              dataName: "Benefícios",
            },
            {
              type: "bar",
              title: "Custo por Tipo de Benefício",
              description: "Valores monetários (exceto planos de saúde/odontológico)",
              data: Object.entries(tipoCusto).map(([tipo, valor]) => ({ tipo: tipoLabels[tipo] || tipo, valor: parseFloat(valor.toFixed(2)) })),
              dataName: "R$",
            },
          ],
          details: bens.slice(0, 100).map((b: any) => {
            const func = funcMap.get(b.user_id);
            const isPlano = ["plano_saude", "plano_odontologico"].includes(b.tipo);
            return {
              Funcionário: func?.nome || "-",
              Departamento: func?.departamento || "-",
              Cargo: func?.cargo || "-",
              Benefício: tipoLabels[b.tipo] || b.tipo || "-",
              Valor: isPlano ? (b.observacoes || "Plano ativo") : `R$ ${(b.valor || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
              "Desconto (%)": b.desconto_percentual ? `${b.desconto_percentual}%` : "-",
              "Data Início": b.data_inicio || "-",
            };
          }),
        });
        break;
      }

      case "sst": {
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
        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Período": periodoLabel,
            "Total Colaboradores": filtered.length,
            "Departamentos": Object.keys(deptCount).length,
          },
          charts: [
            {
              type: "bar",
              title: "Colaboradores por Departamento (SST)",
              description: "Distribuição por departamento",
              data: Object.entries(deptCount).map(([dept, count]) => ({ departamento: dept, valor: count })),
              dataName: "Colaboradores",
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
          data = data.filter((h: any) => String(h.mes_referencia) === filters.mes);
        }
        if (filters.ano) {
          data = data.filter((h: any) => String(h.ano_referencia) === filters.ano);
        }
        if (filters.departamento && filters.departamento !== "todos") {
          data = data.filter((h: any) => h.profiles?.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }
        const totalBruto = data.reduce((acc: number, h: any) => acc + (parseFloat(h.salario_bruto) || 0), 0);
        const totalDescontos = data.reduce((acc: number, h: any) => acc + (parseFloat(h.total_descontos) || 0), 0);
        const totalLiquido = data.reduce((acc: number, h: any) => acc + (parseFloat(h.salario_liquido) || 0), 0);
        const encargosEstimados = totalBruto * 0.368;
        const custoTotal = totalBruto + encargosEstimados;

        const deptCusto: Record<string, number> = {};
        data.forEach((h: any) => {
          const d = h.profiles?.departamento || "Sem Departamento";
          deptCusto[d] = (deptCusto[d] || 0) + (parseFloat(h.salario_bruto) || 0);
        });

        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Período": filters.mes && filters.ano ? `${filters.mes}/${filters.ano}` : periodoLabel,
            "Total Pagamentos": data.length,
            "Total Proventos": `R$ ${totalBruto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            "Total Descontos": `R$ ${totalDescontos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            "Remuneração Líquida": `R$ ${totalLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            "Encargos Estimados (36.8%)": `R$ ${encargosEstimados.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            "Custo Total Estimado": `R$ ${custoTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          },
          charts: [
            {
              type: "bar",
              title: "Custo por Departamento",
              description: "Distribuição do custo de folha por departamento",
              data: Object.entries(deptCusto).map(([dept, custo]) => ({ departamento: dept, valor: custo })),
              dataName: "Custo (R$)",
            },
            {
              type: "pie",
              title: "Composição do Custo",
              description: "Proventos, Descontos e Encargos",
              data: [
                { categoria: "Proventos", valor: totalBruto },
                { categoria: "Descontos", valor: totalDescontos },
                { categoria: "Encargos", valor: encargosEstimados },
              ],
            },
          ],
          details: data.slice(0, 100).map((h: any) => ({
            Funcionário: h.profiles?.nome || "-",
            Departamento: h.profiles?.departamento || "-",
            "Salário Bruto": `R$ ${(parseFloat(h.salario_bruto) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            Descontos: `R$ ${(parseFloat(h.total_descontos) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            Líquido: `R$ ${(parseFloat(h.salario_liquido) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
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
          <Card className="overflow-hidden">
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
                className="text-sm text-primary hover:underline flex items-center gap-1"
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
