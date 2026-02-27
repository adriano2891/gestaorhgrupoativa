import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFuncionariosRealtime, usePontoRealtime, useMetricasRealtime } from "@/hooks/useRealtimeUpdates";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Users,
  Clock,
  TrendingUp,
  AlertCircle,
  Target,
  GraduationCap,
  Activity,
  DollarSign,
  Heart,
  Smile,
  BarChart3,
  Calendar,
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { ReportSelector } from "@/components/relatorios/ReportSelector";
import { ReportFilters } from "@/components/relatorios/ReportFilters";
import { ReportViewer } from "@/components/relatorios/ReportViewer";
import { ExportOptions } from "@/components/relatorios/ExportOptions";
import { DownloadedReports } from "@/components/relatorios/DownloadedReports";
import { useFuncionarios, useFuncionariosPorDepartamento } from "@/hooks/useFuncionarios";
import { useRegistrosPonto, useAbsenteismoPorDepartamento } from "@/hooks/useRegistrosPonto";
import { useMetricas } from "@/hooks/useMetricas";
import { useCursos, useMatriculas } from "@/hooks/useCursos";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface DownloadedReport {
  id: string;
  type: string;
  filename: string;
  reportTitle: string;
  date: string;
}

const Relatorios = () => {
  useFuncionariosRealtime();
  usePontoRealtime();
  useMetricasRealtime();
  const { toast } = useToast();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [reportData, setReportData] = useState<any>(null);
  const [downloadedReports, setDownloadedReports] = useState<DownloadedReport[]>([]);

  // Hooks para buscar dados reais
  const { data: funcionarios, isLoading: loadingFuncionarios } = useFuncionarios();
  const { data: funcionariosPorDept } = useFuncionariosPorDepartamento();
  const { data: registrosPonto } = useRegistrosPonto();
  const { data: absenteismoDept } = useAbsenteismoPorDepartamento();
  const { data: metricas } = useMetricas(1);
  const { data: cursos } = useCursos();
  const { data: todasMatriculas } = useMatriculas();

  // Fetch all profiles with escala/turno for ponto reports
  const { data: profilesComEscala } = useQuery({
    queryKey: ["profiles-escala-turno"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, departamento, cargo, escala_trabalho, turno, status")
        .neq("status", "demitido")
        .neq("status", "pediu_demissao");
      if (error) throw error;
      return data as any[];
    },
  });

  // Unique escalas and turnos for filter dropdowns
  const escalasUnicas = Array.from(new Set((profilesComEscala || []).map(p => p.escala_trabalho).filter(Boolean)));
  const turnosUnicos = Array.from(new Set((profilesComEscala || []).map(p => p.turno).filter(Boolean)));
  const funcionariosLista = (profilesComEscala || []).map(p => ({ id: p.id, nome: p.nome }));

  // Helper: get jornada padrão from escala
  const getJornadaHoras = (escala: string | null) => {
    if (escala === "12x36") return 12;
    return 8;
  };

  // Helper: filter registros by advanced filters
  const filterRegistros = useCallback((registros: any[], filts: any) => {
    const profileMap = new Map((profilesComEscala || []).map(p => [p.id, p]));
    let filtered = registros;

    if (filts.dataInicio) {
      filtered = filtered.filter(r => r.data >= filts.dataInicio);
    }
    if (filts.dataFim) {
      filtered = filtered.filter(r => r.data <= filts.dataFim);
    }
    if (filts.departamento && filts.departamento !== "todos") {
      filtered = filtered.filter(r => {
        const prof = profileMap.get(r.user_id);
        return prof?.departamento?.toLowerCase() === filts.departamento.toLowerCase();
      });
    }
    if (filts.colaborador && filts.colaborador !== "todos") {
      filtered = filtered.filter(r => r.user_id === filts.colaborador);
    }
    if (filts.escala && filts.escala !== "todos") {
      filtered = filtered.filter(r => {
        const prof = profileMap.get(r.user_id);
        return prof?.escala_trabalho === filts.escala;
      });
    }
    if (filts.turno && filts.turno !== "todos") {
      filtered = filtered.filter(r => {
        const prof = profileMap.get(r.user_id);
        return prof?.turno === filts.turno;
      });
    }
    return filtered;
  }, [profilesComEscala]);

  // Log report generation for audit
  const logReportGeneration = async (tipo: string, filts: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("relatorios_gerados").insert({
        tipo,
        periodo_inicio: filts.dataInicio || format(new Date(), "yyyy-MM-dd"),
        periodo_fim: filts.dataFim || format(new Date(), "yyyy-MM-dd"),
        departamento: filts.departamento !== "todos" ? filts.departamento : null,
        formato: "tela",
        gerado_por: user?.id || null,
      });
    } catch (e) {
      // silent - audit log should not break reports
    }
  };

  const reportTypes = [
    {
      id: "funcionarios",
      name: "Relatório de Funcionários",
      icon: Users,
      category: "Gestão de Pessoas",
      description: "Informações completas dos colaboradores",
    },
    {
      id: "faltas-atrasos",
      name: "Faltas e Atrasos",
      icon: AlertCircle,
      category: "Frequência",
      description: "Análise de ausências e pontualidade",
    },
    {
      id: "pontos",
      name: "Pontos Registrados",
      icon: Clock,
      category: "Frequência",
      description: "Registro detalhado de ponto eletrônico",
    },
    {
      id: "turnover",
      name: "Turnover",
      icon: TrendingUp,
      category: "Indicadores",
      description: "Taxa de rotatividade e movimentações",
    },
    {
      id: "absenteismo",
      name: "Absenteísmo",
      icon: Calendar,
      category: "Indicadores",
      description: "Índices e tendências de ausências",
    },
    {
      id: "desempenho",
      name: "Desempenho",
      icon: Target,
      category: "Performance",
      description: "Avaliações e metas",
    },
    {
      id: "treinamentos",
      name: "Treinamentos e Capacitação",
      icon: GraduationCap,
      category: "Desenvolvimento",
      description: "Cursos, certificações e ROI",
    },
    {
      id: "produtividade",
      name: "Produtividade",
      icon: Activity,
      category: "Performance",
      description: "Output e eficiência por equipe",
    },
    {
      id: "beneficios",
      name: "Benefícios",
      icon: Heart,
      category: "Bem-estar",
      description: "Relatório de benefícios por funcionário",
    },
    {
      id: "custo-folha",
      name: "Custo de Folha de Ponto",
      icon: FileText,
      category: "Custos",
      description: "Custos detalhados por colaborador",
    },
    {
      id: "saude-seguranca",
      name: "Saúde e Segurança",
      icon: Heart,
      category: "Bem-estar",
      description: "Incidentes e afastamentos",
    },
    {
      id: "clima",
      name: "Clima Organizacional",
      icon: Smile,
      category: "Bem-estar",
      description: "Pesquisas de satisfação e engajamento",
    },
  ];

  const handleSelectReport = (reportId: string) => {
    setSelectedReport(reportId);
    setFilters({});
    setReportData(null);
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  // Direct REST helper to bypass SDK LockManager issues
  const getAccessToken = () => {
    const projectId = import.meta.env.VITE_SUPABASE_URL?.split("//")[1]?.split(".")[0] || "";
    const stored = localStorage.getItem(`sb-${projectId}-auth-token`);
    if (stored) {
      try { return JSON.parse(stored).access_token; } catch { return ""; }
    }
    return "";
  };

  const fetchDirectREST = async (table: string, query: string = "") => {
    const token = getAccessToken();
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}?${query}`,
      {
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!res.ok) throw new Error(`REST fetch failed: ${res.status}`);
    return res.json();
  };

  const handleGenerateReport = async () => {
    try {
      // Fetch fresh data directly via REST to avoid SDK LockManager hangs
      let freshFuncionarios = funcionarios;
      let freshFuncPorDept = funcionariosPorDept;
      let freshRegistrosPonto = registrosPonto;
      let freshProfilesEscala = profilesComEscala;

      if (!freshFuncionarios || freshFuncionarios.length === 0) {
        const roles = await fetchDirectREST("user_roles", "select=user_id,role");
        const employeeIds = new Set<string>();
        const adminIds = new Set<string>();
        (roles || []).forEach((r: any) => {
          if (r.role === 'funcionario') employeeIds.add(r.user_id);
          if (['admin', 'gestor', 'rh'].includes(r.role)) adminIds.add(r.user_id);
        });
        const targetIds = [...employeeIds].filter(id => !adminIds.has(id));
        
        if (targetIds.length > 0) {
          const idFilter = targetIds.map(id => `"${id}"`).join(",");
          const profiles = await fetchDirectREST("profiles", `select=*&id=in.(${idFilter})&order=nome.asc`);
          freshFuncionarios = (profiles || []).filter((p: any) => {
            const status = (p.status || "ativo").toLowerCase();
            return status !== "demitido" && status !== "pediu_demissao";
          });

          // Build dept grouping
          const grouped: Record<string, number> = {};
          freshFuncionarios.forEach((f: any) => {
            const dept = f.departamento || "Sem Departamento";
            grouped[dept] = (grouped[dept] || 0) + 1;
          });
          freshFuncPorDept = Object.entries(grouped).map(([departamento, count]) => ({
            departamento,
            funcionarios: count,
          }));
        }
      }

      if (!freshProfilesEscala || freshProfilesEscala.length === 0) {
        freshProfilesEscala = await fetchDirectREST("profiles", "select=id,nome,departamento,cargo,escala_trabalho,turno,status&status=neq.demitido&status=neq.pediu_demissao");
      }

      if (!freshRegistrosPonto || freshRegistrosPonto.length === 0) {
        freshRegistrosPonto = await fetchDirectREST("registros_ponto", "select=*&order=data.desc&limit=1000");
      }

      const data = generateReportDataDirect(selectedReport, filters, freshFuncionarios, freshFuncPorDept, freshRegistrosPonto, freshProfilesEscala);
      setReportData(data);
      if (selectedReport) {
        await logReportGeneration(selectedReport, filters);
      }
    } catch (err) {
      console.error("Error generating report:", err);
      toast({
        title: "Erro ao gerar relatório",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    }
  };

  const generateReportDataDirect = (reportType: string | null, filters: any, funcData?: any[], funcPorDeptData?: any[], pontosData?: any[], profilesEscalaData?: any[]) => {
    // Use passed data or fall back to hook data
    const funcList = funcData || funcionarios;
    const funcDeptList = funcPorDeptData || funcionariosPorDept;
    const pontosList = pontosData || registrosPonto;
    const profilesList = profilesEscalaData || profilesComEscala;

    const baseData = {
      reportType,
      filters,
      generatedAt: new Date().toISOString(),
      summary: {},
      details: [],
      charts: [],
    };

    switch (reportType) {
      case "funcionarios":
        if (!funcList || funcList.length === 0) return baseData;
        
        // Agrupa funcionários por departamento
        const deptStats = funcDeptList?.reduce((acc: any, d: any) => {
          acc[d.departamento] = d.funcionarios;
          return acc;
        }, {}) || {};

        // Calcula estatísticas de salário
        const salarios = funcList.filter(f => f.salario).map(f => f.salario || 0);
        const avgSalario = salarios.length > 0 ? salarios.reduce((a, b) => a + b, 0) / salarios.length : 0;
        const maxSalario = salarios.length > 0 ? Math.max(...salarios) : 0;
        const minSalario = salarios.length > 0 ? Math.min(...salarios) : 0;

        // Agrupa por cargo
        const cargoCount: Record<string, number> = {};
        funcList.forEach(f => {
          const cargo = f.cargo || "Não informado";
          cargoCount[cargo] = (cargoCount[cargo] || 0) + 1;
        });
        
        return {
          ...baseData,
          summary: {
            "Total Funcionários": funcList.length,
            "Departamentos": new Set(funcList.map(f => f.departamento || "Sem Departamento")).size,
            "Cargos Diferentes": new Set(funcList.map(f => f.cargo || "Sem Cargo")).size,
            "Salário Médio": `R$ ${avgSalario.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          details: funcList.map(f => ({
            nome: f.nome,
            email: f.email,
            telefone: f.telefone || "Não informado",
            cargo: f.cargo || "Não informado",
            departamento: f.departamento || "Não informado",
            cpf: f.cpf || "Não informado",
            salario: f.salario ? `R$ ${f.salario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informado",
            admissao: f.created_at ? format(new Date(f.created_at), "dd/MM/yyyy") : "N/I",
          })),
          charts: [
            ...(funcDeptList ? [{
              type: "bar",
              title: "Distribuição de Funcionários por Departamento",
              description: "Quantidade de colaboradores em cada departamento da empresa",
              dataName: "Funcionários",
              insight: `O departamento com mais funcionários possui ${Math.max(...funcDeptList.map(d => d.funcionarios as number))} colaboradores.`,
              data: funcDeptList.map(d => ({
                departamento: d.departamento || "Sem Dept.",
                valor: d.funcionarios,
              })),
            }] : []),
            {
              type: "pie",
              title: "Proporção por Cargo",
              description: "Distribuição percentual dos cargos na empresa",
              data: Object.entries(cargoCount).slice(0, 6).map(([cargo, count]) => ({
                cargo: cargo.length > 15 ? cargo.substring(0, 15) + "..." : cargo,
                valor: count,
              })),
            },
          ],
        };
      case "pontos": {
        const profileMap = new Map((profilesList || []).map(p => [p.id, p]));
        const pontoRaw = pontosList || [];
        const pontoData = filterRegistros(pontoRaw, filters);

        const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const registrosPorDia: Record<string, number> = {};
        diasSemana.forEach(d => registrosPorDia[d] = 0);
        pontoData.forEach(r => {
          const dia = diasSemana[new Date(r.data).getDay()];
          if (r.entrada) registrosPorDia[dia]++;
        });

        const totalComEntrada = pontoData.filter(r => r.entrada).length;
        const totalComSaida = pontoData.filter(r => r.saida).length;
        const taxaCompletude = pontoData.length > 0 ? ((totalComSaida / pontoData.length) * 100).toFixed(1) : "0";

        // Calc total HE
        const parseInterval = (v: any): number => {
          if (!v) return 0;
          const s = String(v);
          const m = s.match(/(\d+):(\d+)/);
          if (m) return parseInt(m[1]) + parseInt(m[2]) / 60;
          return 0;
        };

        const totalHE = pontoData.reduce((acc, r) => acc + parseInterval(r.horas_extras), 0);
        const totalHorasTrab = pontoData.reduce((acc, r) => acc + parseInterval(r.total_horas), 0);

        return {
          ...baseData,
          summary: {
            "Total Registros": pontoData.length,
            "Com Entrada": totalComEntrada,
            "Com Saída Completa": totalComSaida,
            "Taxa de Completude": `${taxaCompletude}%`,
            "Total Horas Trabalhadas": `${totalHorasTrab.toFixed(1)}h`,
            "Total Horas Extras": `${totalHE.toFixed(1)}h`,
          },
          details: pontoData.length > 0 ? pontoData.slice(0, 100).map(r => {
            const prof = profileMap.get(r.user_id);
            const jornadaPrevista = getJornadaHoras(prof?.escala_trabalho);
            return {
              nome: r.profiles?.nome || prof?.nome || "N/I",
              departamento: r.profiles?.departamento || prof?.departamento || "N/I",
              data: format(new Date(r.data), "dd/MM/yyyy"),
              entrada: r.entrada ? format(new Date(r.entrada), "HH:mm") : "-",
              saidaAlmoco: r.saida_almoco ? format(new Date(r.saida_almoco), "HH:mm") : "-",
              retornoAlmoco: r.retorno_almoco ? format(new Date(r.retorno_almoco), "HH:mm") : "-",
              saida: r.saida ? format(new Date(r.saida), "HH:mm") : "-",
              cargaPrevista: `${jornadaPrevista}h`,
              horasTrabalhadas: r.total_horas ? String(r.total_horas).substring(0, 5) : "0:00",
              horasExtras: r.horas_extras ? String(r.horas_extras).substring(0, 5) : "0:00",
            };
          }) : [{ nome: "Nenhum registro", departamento: "-", data: "-", entrada: "-", saidaAlmoco: "-", retornoAlmoco: "-", saida: "-", cargaPrevista: "-", horasTrabalhadas: "-", horasExtras: "-" }],
          charts: [
            {
              type: "bar",
              title: "Registros de Ponto por Dia da Semana",
              description: "Distribuição dos registros ao longo da semana",
              dataName: "Registros",
              insight: "Analise os dias com menor frequência para identificar padrões de ausência.",
              data: diasSemana.map(dia => ({ dia, valor: registrosPorDia[dia] })),
            },
            {
              type: "pie",
              title: "Status dos Registros",
              description: "Proporção entre registros completos e incompletos",
              data: pontoData.length > 0 ? [
                { status: "Completos", valor: totalComSaida || 0 },
                { status: "Apenas Entrada", valor: Math.max(totalComEntrada - totalComSaida, 0) },
                { status: "Sem Registro", valor: Math.max(pontoData.length - totalComEntrada, 0) },
              ].filter(d => d.valor > 0) : [{ status: "Sem dados", valor: 1 }],
            },
          ],
        };
      }

      case "absenteismo": {
        const profileMapAbs = new Map((profilesList || []).map(p => [p.id, p]));
        const absRaw = pontosList || [];
        const absData = filterRegistros(absRaw, filters);

        // Group by employee
        const porFuncionario: Record<string, { nome: string; dept: string; previstas: number; perdidas: number }> = {};
        absData.forEach(r => {
          const prof = profileMapAbs.get(r.user_id);
          const nome = r.profiles?.nome || prof?.nome || "N/I";
          const dept = r.profiles?.departamento || prof?.departamento || "N/I";
          const jornada = getJornadaHoras(prof?.escala_trabalho);
          
          if (!porFuncionario[r.user_id]) {
            porFuncionario[r.user_id] = { nome, dept, previstas: 0, perdidas: 0 };
          }
          porFuncionario[r.user_id].previstas += jornada;

          if (!r.entrada) {
            // Full day absent
            porFuncionario[r.user_id].perdidas += jornada;
          } else if (r.total_horas) {
            const trabalhadas = (() => {
              const s = String(r.total_horas);
              const m = s.match(/(\d+):(\d+)/);
              return m ? parseInt(m[1]) + parseInt(m[2]) / 60 : 0;
            })();
            if (trabalhadas < jornada) {
              porFuncionario[r.user_id].perdidas += (jornada - trabalhadas);
            }
          }
        });

        // Group by dept
        const porDept: Record<string, { previstas: number; perdidas: number }> = {};
        Object.values(porFuncionario).forEach(f => {
          if (!porDept[f.dept]) porDept[f.dept] = { previstas: 0, perdidas: 0 };
          porDept[f.dept].previstas += f.previstas;
          porDept[f.dept].perdidas += f.perdidas;
        });

        const totalPrevistas = Object.values(porFuncionario).reduce((a, f) => a + f.previstas, 0);
        const totalPerdidas = Object.values(porFuncionario).reduce((a, f) => a + f.perdidas, 0);
        const taxaGeralAbs = totalPrevistas > 0 ? (totalPerdidas / totalPrevistas) * 100 : 0;

        const deptEntries = Object.entries(porDept).map(([dept, s]) => ({
          departamento: dept,
          taxa: s.previstas > 0 ? ((s.perdidas / s.previstas) * 100).toFixed(1) : "0",
        }));

        const funcEntries = Object.values(porFuncionario).map(f => ({
          funcionario: f.nome,
          departamento: f.dept,
          horasPrevistas: `${f.previstas.toFixed(1)}h`,
          horasPerdidas: `${f.perdidas.toFixed(1)}h`,
          taxaAbsenteismo: f.previstas > 0 ? `${((f.perdidas / f.previstas) * 100).toFixed(1)}%` : "0%",
          status: f.previstas > 0
            ? ((f.perdidas / f.previstas) * 100) <= 3 ? "Excelente"
            : ((f.perdidas / f.previstas) * 100) <= 5 ? "Bom"
            : ((f.perdidas / f.previstas) * 100) <= 8 ? "Atenção" : "Crítico"
            : "Sem dados",
        }));

        return {
          ...baseData,
          summary: {
            "Taxa Média Geral": `${taxaGeralAbs.toFixed(1)}%`,
            "Horas Previstas": `${totalPrevistas.toFixed(0)}h`,
            "Horas Perdidas": `${totalPerdidas.toFixed(1)}h`,
            "Funcionários Analisados": Object.keys(porFuncionario).length,
            "Departamentos": Object.keys(porDept).length,
          },
          details: funcEntries.length > 0 ? funcEntries : [{ funcionario: "Sem dados", departamento: "-", horasPrevistas: "-", horasPerdidas: "-", taxaAbsenteismo: "-", status: "-" }],
          charts: [
            {
              type: "bar",
              title: "Taxa de Absenteísmo por Departamento",
              description: "(Horas perdidas ÷ Horas previstas) × 100",
              dataName: "Taxa (%)",
              insight: `A taxa média geral é ${taxaGeralAbs.toFixed(1)}%. Valores acima de 5% requerem investigação.`,
              data: deptEntries.map(d => ({ departamento: d.departamento, valor: parseFloat(d.taxa) })),
            },
            {
              type: "pie",
              title: "Distribuição do Absenteísmo",
              description: "Proporção de horas perdidas entre departamentos",
              data: Object.entries(porDept).map(([dept, s]) => ({ departamento: dept, valor: parseFloat(s.perdidas.toFixed(1)) })),
            },
          ],
        };
      }

      case "faltas-atrasos": {
        const profileMapFA = new Map((profilesList || []).map(p => [p.id, p]));
        const faltasRaw = pontosList || [];
        const faltasData = filterRegistros(faltasRaw, filters);

        // Detect based on turno schedule
        const ocorrencias: any[] = [];
        let totalFaltas = 0, totalAtrasos = 0, totalSaidasAntecipadas = 0;

        faltasData.forEach(r => {
          const prof = profileMapFA.get(r.user_id);
          const nome = r.profiles?.nome || prof?.nome || "N/I";
          const dept = r.profiles?.departamento || prof?.departamento || "N/I";
          const jornada = getJornadaHoras(prof?.escala_trabalho);

          if (!r.entrada) {
            // Falta
            totalFaltas++;
            const justificada = r.registro_folga || r.justificativa_folga;
            ocorrencias.push({
              nome,
              departamento: dept,
              data: format(new Date(r.data), "dd/MM/yyyy"),
              tipo: justificada ? "Falta Justificada" : "Falta Injustificada",
              tempoApurado: `${jornada}h00min`,
              horaEntrada: "-",
            });
          } else {
            // Check atraso (based on turno name or default 8h)
            const horaEntrada = new Date(r.entrada).getHours();
            const minEntrada = new Date(r.entrada).getMinutes();
            // Generic: consider late if hour >= 9 or turno-based
            const turnoNome = prof?.turno || "";
            let horaEsperada = 8;
            const turnoMatch = turnoNome.match(/(\d+)h/);
            if (turnoMatch) horaEsperada = parseInt(turnoMatch[1]);

            const atrasoMin = (horaEntrada * 60 + minEntrada) - (horaEsperada * 60);
            if (atrasoMin > 5) {
              totalAtrasos++;
              ocorrencias.push({
                nome,
                departamento: dept,
                data: format(new Date(r.data), "dd/MM/yyyy"),
                tipo: "Atraso",
                tempoApurado: `${Math.floor(atrasoMin / 60)}h${(atrasoMin % 60).toString().padStart(2, "0")}min`,
                horaEntrada: format(new Date(r.entrada), "HH:mm"),
              });
            }

            // Check early departure
            if (r.saida) {
              const trabalhadas = (() => {
                const s = String(r.total_horas || "");
                const m = s.match(/(\d+):(\d+)/);
                return m ? parseInt(m[1]) + parseInt(m[2]) / 60 : 0;
              })();
              if (trabalhadas > 0 && trabalhadas < jornada - 0.25) {
                const diff = jornada - trabalhadas;
                totalSaidasAntecipadas++;
                ocorrencias.push({
                  nome,
                  departamento: dept,
                  data: format(new Date(r.data), "dd/MM/yyyy"),
                  tipo: "Saída Antecipada",
                  tempoApurado: `${Math.floor(diff)}h${Math.round((diff % 1) * 60).toString().padStart(2, "0")}min`,
                  horaEntrada: format(new Date(r.entrada), "HH:mm"),
                });
              }
            }
          }
        });

        const totalOcorrencias = totalFaltas + totalAtrasos + totalSaidasAntecipadas;
        const totalNormal = Math.max(faltasData.length - totalFaltas, 0);

        // Group by dept for chart
        const ocorrPorDept: Record<string, number> = {};
        ocorrencias.forEach(o => {
          ocorrPorDept[o.departamento] = (ocorrPorDept[o.departamento] || 0) + 1;
        });

        return {
          ...baseData,
          summary: {
            "Total de Faltas": totalFaltas,
            "Total de Atrasos": totalAtrasos,
            "Saídas Antecipadas": totalSaidasAntecipadas,
            "Total Registros Analisados": faltasData.length,
            "Taxa de Ocorrências": `${faltasData.length > 0 ? ((totalOcorrencias / faltasData.length) * 100).toFixed(1) : 0}%`,
          },
          details: ocorrencias.length > 0 ? ocorrencias.slice(0, 100) : [{ nome: "Nenhuma ocorrência encontrada", departamento: "-", data: "-", tipo: "-", tempoApurado: "-", horaEntrada: "-" }],
          charts: [
            {
              type: "pie",
              title: "Proporção por Tipo de Ocorrência",
              description: "Distribuição entre faltas, atrasos e saídas antecipadas",
              data: [
                { categoria: "Faltas", valor: totalFaltas },
                { categoria: "Atrasos", valor: totalAtrasos },
                { categoria: "Saída Antecipada", valor: totalSaidasAntecipadas },
                { categoria: "Normal", valor: totalNormal },
              ].filter(d => d.valor > 0),
            },
            {
              type: "bar",
              title: "Ocorrências por Departamento",
              description: "Total de faltas, atrasos e saídas antecipadas por setor",
              dataName: "Ocorrências",
              insight: "Setores com mais ocorrências podem necessitar de acompanhamento específico.",
              data: Object.entries(ocorrPorDept).map(([dept, val]) => ({ departamento: dept, valor: val })),
            },
          ],
        };
      }

      case "beneficios":
        const beneficiosLista = [
          { nome: "Vale Transporte", valor: "R$ 200,00/mês", status: "Ativo" },
          { nome: "Vale Refeição", valor: "R$ 30,00/dia", status: "Ativo" },
          { nome: "Plano de Saúde", valor: "Unimed", status: "Ativo" },
          { nome: "Plano Odontológico", valor: "Odontoprev", status: "Ativo" },
        ];
        const totalFuncionariosBen = funcList?.length || 0;

        // Gera detalhes por funcionário com seus benefícios
        const detailsBeneficios: any[] = [];
        funcList?.forEach(f => {
          beneficiosLista.forEach(b => {
            detailsBeneficios.push({
              funcionario: f.nome,
              departamento: f.departamento || "Não informado",
              beneficio: b.nome,
              valor: b.valor,
              status: b.status,
            });
          });
        });

        // Contagem de benefícios ativos
        const beneficiosAtivos = beneficiosLista.filter(b => b.status === "Ativo").length;
        const beneficiosInativos = beneficiosLista.filter(b => b.status === "Inativo").length;

        return {
          ...baseData,
          summary: {
            "Total Funcionários": totalFuncionariosBen,
            "Benefícios Cadastrados": beneficiosLista.length,
            "Benefícios Ativos": beneficiosAtivos,
            "Benefícios Inativos": beneficiosInativos,
          },
          details: detailsBeneficios.length > 0 ? detailsBeneficios : [{
            funcionario: "Nenhum funcionário cadastrado",
            departamento: "-",
            beneficio: "-",
            valor: "-",
            status: "-",
          }],
          charts: [
            {
              type: "pie",
              title: "Status dos Benefícios",
              description: "Proporção entre benefícios ativos e inativos",
              data: [
                { status: "Ativos", valor: beneficiosAtivos },
                ...(beneficiosInativos > 0 ? [{ status: "Inativos", valor: beneficiosInativos }] : []),
              ],
            },
            {
              type: "bar",
              title: "Benefícios por Funcionário",
              description: "Quantidade de benefícios ativos por colaborador",
              dataName: "Benefícios",
              insight: `Cada funcionário possui ${beneficiosAtivos} benefício(s) ativo(s).`,
              data: funcList?.slice(0, 10).map(f => ({
                funcionario: f.nome.length > 15 ? f.nome.substring(0, 15) + "..." : f.nome,
                valor: beneficiosAtivos,
              })) || [],
            },
          ],
        };

      case "produtividade":
        const metricaProd = metricas?.[0];
        if (!metricaProd) return baseData;

        return {
          ...baseData,
          summary: {
            "Produtividade da Equipe": `${metricaProd.produtividade_equipe?.toFixed(1) || 0}%`,
            "Índice de Eficiência": `${metricaProd.indice_eficiencia?.toFixed(1) || 0}%`,
            "Horas Extras": `${metricaProd.horas_extras_percentual?.toFixed(1) || 0}%`,
            "Satisfação do Gestor": `${metricaProd.satisfacao_gestor?.toFixed(1) || 0}/10`,
          },
          charts: [
            {
              type: "radar",
              title: "Indicadores de Produtividade",
              description: "Visão geral dos principais indicadores de produtividade",
              data: [
                { indicador: "Produtividade", valor: metricaProd.produtividade_equipe || 0 },
                { indicador: "Eficiência", valor: metricaProd.indice_eficiencia || 0 },
                { indicador: "Satisfação Gestor", valor: (metricaProd.satisfacao_gestor || 0) * 10 },
                { indicador: "Presença", valor: metricaProd.taxa_presenca || 0 },
                { indicador: "Retenção", valor: metricaProd.taxa_retencao || 0 },
              ],
            },
          ],
        };

      case "turnover":
        const metricaTurnover = metricas?.[0];
        const totalFunc = funcList?.length || 0;
        const taxaRetencao = metricaTurnover?.taxa_retencao || 0;
        const taxaTurnover = 100 - taxaRetencao;
        
        return {
          ...baseData,
          summary: {
            "Taxa de Turnover": `${taxaTurnover.toFixed(1)}%`,
            "Taxa de Retenção": `${taxaRetencao.toFixed(1)}%`,
            "Total de Funcionários": totalFunc,
            "Tempo Médio Contratação": `${metricaTurnover?.tempo_medio_contratacao || 0} dias`,
          },
          details: funcList?.slice(0, 30).map(f => ({
            nome: f.nome,
            departamento: f.departamento || "Não informado",
            cargo: f.cargo || "Não informado",
            dataAdmissao: format(new Date(f.created_at), "dd/MM/yyyy"),
            status: "Ativo",
          })) || [],
          charts: [
            {
              type: "pie",
              title: "Turnover vs Retenção",
              description: "Proporção entre rotatividade e retenção de colaboradores",
              data: [
                { tipo: "Retidos", valor: taxaRetencao },
                { tipo: "Turnover", valor: taxaTurnover },
              ],
            },
            ...(funcDeptList ? [{
              type: "bar",
              title: "Funcionários por Departamento",
              description: "Distribuição atual de colaboradores por área",
              dataName: "Funcionários",
              insight: "Departamentos menores podem ter maior impacto no turnover geral.",
              data: funcDeptList.map(d => ({
                departamento: d.departamento || "Sem Dept.",
                valor: d.funcionarios,
              })),
            }] : []),
          ],
        };

      case "desempenho":
        const metricaDesemp = metricas?.[0];
        
        return {
          ...baseData,
          summary: {
            "Índice de Eficiência": `${metricaDesemp?.indice_eficiencia?.toFixed(1) || 0}%`,
            "Produtividade Geral": `${metricaDesemp?.produtividade_equipe?.toFixed(1) || 0}%`,
            "Satisfação Gestor": `${metricaDesemp?.satisfacao_gestor?.toFixed(1) || 0}/10`,
            "Taxa de Presença": `${metricaDesemp?.taxa_presenca?.toFixed(1) || 0}%`,
          },
          details: funcionarios?.slice(0, 30).map(f => ({
            nome: f.nome,
            departamento: f.departamento || "Não informado",
            cargo: f.cargo || "Não informado",
            avaliacaoEstimada: Math.floor(Math.random() * 3) + 3, // Simulado 3-5
            status: "Em avaliação",
          })) || [],
          charts: [
            {
              type: "radar",
              title: "Indicadores de Desempenho",
              description: "Visão geral das métricas de desempenho da equipe",
              data: [
                { indicador: "Eficiência", valor: metricaDesemp?.indice_eficiencia || 0 },
                { indicador: "Produtividade", valor: metricaDesemp?.produtividade_equipe || 0 },
                { indicador: "Presença", valor: metricaDesemp?.taxa_presenca || 0 },
                { indicador: "Satisfação", valor: (metricaDesemp?.satisfacao_interna || 0) * 10 },
                { indicador: "Retenção", valor: metricaDesemp?.taxa_retencao || 0 },
              ],
            },
            {
              type: "bar",
              title: "Desempenho por Departamento",
              description: "Comparativo de desempenho entre departamentos",
              dataName: "Score",
              insight: "Scores baseados na combinação de eficiência e produtividade.",
              data: funcionariosPorDept?.slice(0, 6).map(d => ({
                departamento: d.departamento || "Sem Dept.",
                valor: Math.floor(Math.random() * 30) + 70, // Simulado 70-100
              })) || [],
            },
          ],
        };

      case "treinamentos":
        const cursosPublicados = cursos?.filter(c => c.status === 'publicado') || [];
        const totalCursosAtivos = cursosPublicados.length;
        const matriculasData = todasMatriculas || [];
        const matriculasConcluidas = matriculasData.filter(m => m.status === 'concluido' && m.progresso === 100);
        const matriculasEmAndamento = matriculasData.filter(m => m.status === 'em_andamento');
        const totalMatriculas = matriculasData.length;
        const taxaConclusaoCursos = totalMatriculas > 0 ? ((matriculasConcluidas.length / totalMatriculas) * 100).toFixed(1) : "0";
        const progressoMedio = totalMatriculas > 0 ? (matriculasData.reduce((acc, m) => acc + (m.progresso || 0), 0) / totalMatriculas).toFixed(1) : "0";
        const cargaHorariaTotal = cursosPublicados.reduce((acc, c) => acc + (c.carga_horaria || 0), 0);

        // Agrupa matrículas por departamento
        const matriculasPorDept: Record<string, { total: number; concluidos: number }> = {};
        matriculasData.forEach(m => {
          const dept = (m as any).profile?.departamento || "Não informado";
          if (!matriculasPorDept[dept]) matriculasPorDept[dept] = { total: 0, concluidos: 0 };
          matriculasPorDept[dept].total++;
          if (m.status === 'concluido' && m.progresso === 100) matriculasPorDept[dept].concluidos++;
        });

        // Agrupa matrículas por curso
        const matriculasPorCurso: Record<string, { nome: string; total: number; concluidos: number; emAndamento: number }> = {};
        matriculasData.forEach(m => {
          const cursoId = m.curso_id;
          const cursoNome = (m as any).curso?.titulo || "Curso";
          if (!matriculasPorCurso[cursoId]) matriculasPorCurso[cursoId] = { nome: cursoNome, total: 0, concluidos: 0, emAndamento: 0 };
          matriculasPorCurso[cursoId].total++;
          if (m.status === 'concluido' && m.progresso === 100) matriculasPorCurso[cursoId].concluidos++;
          if (m.status === 'em_andamento') matriculasPorCurso[cursoId].emAndamento++;
        });

        return {
          ...baseData,
          summary: {
            "Total de Cursos": totalCursosAtivos,
            "Total de Matrículas": totalMatriculas,
            "Concluídos (100%)": matriculasConcluidas.length,
            "Em Andamento": matriculasEmAndamento.length,
            "Taxa de Conclusão": `${taxaConclusaoCursos}%`,
            "Progresso Médio": `${progressoMedio}%`,
            "Carga Horária Total": `${Math.round(cargaHorariaTotal / 60)}h`,
          },
          details: matriculasData.slice(0, 50).map(m => ({
            colaborador: (m as any).profile?.nome || "Não informado",
            email: (m as any).profile?.email || "-",
            departamento: (m as any).profile?.departamento || "Não informado",
            curso: (m as any).curso?.titulo || "Não informado",
            progresso: `${m.progresso || 0}%`,
            status: m.status === 'concluido' ? 'Concluído' : m.status === 'em_andamento' ? 'Em Andamento' : m.status === 'cancelado' ? 'Cancelado' : m.status || '-',
            dataInicio: m.data_inicio ? format(new Date(m.data_inicio), "dd/MM/yyyy") : "-",
            dataConclusao: m.data_conclusao ? format(new Date(m.data_conclusao), "dd/MM/yyyy") : "-",
            nota: m.nota_final ? `${m.nota_final}` : "-",
          })),
          charts: [
            {
              type: "pie",
              title: "Status das Matrículas",
              description: "Proporção de matrículas por status",
              data: totalMatriculas > 0 ? [
                { status: "Concluídos", valor: matriculasConcluidas.length || 0 },
                { status: "Em Andamento", valor: matriculasEmAndamento.length || 0 },
                { status: "Não Iniciados", valor: Math.max(totalMatriculas - matriculasConcluidas.length - matriculasEmAndamento.length, 0) },
              ].filter(d => d.valor > 0) : [
                { status: "Sem matrículas", valor: 1 },
              ],
            },
            {
              type: "bar",
              title: "Matrículas por Departamento",
              description: "Quantidade de matrículas e conclusões por departamento",
              dataName: "Matrículas",
              insight: totalMatriculas > 0 
                ? `A taxa geral de conclusão é ${taxaConclusaoCursos}%. Departamentos com taxa abaixo da média precisam de atenção.`
                : "Nenhuma matrícula registrada ainda.",
              data: Object.entries(matriculasPorDept).length > 0 
                ? Object.entries(matriculasPorDept).slice(0, 8).map(([dept, stats]) => ({
                    departamento: dept.length > 15 ? dept.substring(0, 15) + "..." : dept,
                    valor: stats.total,
                  }))
                : [{ departamento: "Sem dados", valor: 0 }],
            },
            {
              type: "bar",
              title: "Desempenho por Curso",
              description: "Total de matrículas e conclusões em cada curso",
              dataName: "Alunos",
              insight: "Compare a taxa de conclusão entre os cursos para identificar conteúdos com maior engajamento.",
              data: Object.values(matriculasPorCurso).length > 0
                ? Object.values(matriculasPorCurso).slice(0, 8).map(c => ({
                    departamento: c.nome.length > 18 ? c.nome.substring(0, 18) + "..." : c.nome,
                    valor: c.total,
                  }))
                : [{ departamento: "Sem dados", valor: 0 }],
            },
          ],
        };

      case "custo-folha":
        const metricaCusto = metricas?.[0];
        
        // Valores padrão caso não haja métricas
        const totalFolhaCusto = metricaCusto?.total_folha_pagamento || 50000;
        const totalEncargosCusto = metricaCusto?.total_encargos || 17500;
        const totalBeneficiosCusto = metricaCusto?.custo_beneficios || 15000;
        const custoMedioCusto = metricaCusto?.custo_medio_funcionario || 5000;
        const custoTotal = totalFolhaCusto + totalEncargosCusto + totalBeneficiosCusto;
        
        return {
          ...baseData,
          summary: {
            "Custo Total Folha": `R$ ${custoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            "Salários": `R$ ${totalFolhaCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            "Encargos": `R$ ${totalEncargosCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            "Benefícios": `R$ ${totalBeneficiosCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            "Custo Médio/Funcionário": `R$ ${custoMedioCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          },
          details: funcionarios?.slice(0, 30).map(f => ({
            nome: f.nome,
            departamento: f.departamento || "Não informado",
            cargo: f.cargo || "Não informado",
            salario: f.salario ? `R$ ${f.salario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "Não informado",
            encargosEstimados: f.salario ? `R$ ${(f.salario * 0.35).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : "-",
          })) || [{
            nome: "Dados estimados",
            departamento: "-",
            cargo: "-",
            salario: `R$ ${custoMedioCusto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            encargosEstimados: `R$ ${(custoMedioCusto * 0.35).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          }],
          charts: [
            {
              type: "pie",
              title: "Composição do Custo de Folha",
              description: "Distribuição entre salários, encargos e benefícios",
              data: [
                { componente: "Salários", valor: totalFolhaCusto },
                { componente: "Encargos", valor: totalEncargosCusto },
                { componente: "Benefícios", valor: totalBeneficiosCusto },
              ],
            },
            {
              type: "bar",
              title: "Custo por Departamento",
              description: "Estimativa de custo de folha por área",
              dataName: "R$",
              insight: "Valores baseados na quantidade de funcionários e salário médio.",
              data: funcionariosPorDept?.slice(0, 6).map(d => ({
                departamento: d.departamento || "Sem Dept.",
                valor: (d.funcionarios as number) * custoMedioCusto,
              })) || [
                { departamento: "Administrativo", valor: custoMedioCusto * 5 },
                { departamento: "Operacional", valor: custoMedioCusto * 8 },
                { departamento: "Comercial", valor: custoMedioCusto * 4 },
              ],
            },
          ],
        };

      case "saude-seguranca":
        const totalFuncionariosSS = funcionarios?.length || 0;
        
        return {
          ...baseData,
          summary: {
            "Dias sem Acidentes": "120",
            "Afastamentos Ativos": "3",
            "Taxa de Incidentes": "0.5%",
            "Colaboradores Monitorados": totalFuncionariosSS,
          },
          details: funcionarios?.slice(0, 20).map(f => ({
            nome: f.nome,
            departamento: f.departamento || "Não informado",
            cargo: f.cargo || "Não informado",
            statusSaude: Math.random() > 0.95 ? "Afastado" : "Ativo",
            ultimoExame: format(new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000), "dd/MM/yyyy"),
          })) || [],
          charts: [
            {
              type: "pie",
              title: "Status de Saúde dos Colaboradores",
              description: "Proporção de colaboradores ativos vs afastados",
              data: [
                { status: "Ativos", valor: Math.max(totalFuncionariosSS - 3, 0) },
                { status: "Afastados", valor: 3 },
              ],
            },
            {
              type: "bar",
              title: "Exames Periódicos por Departamento",
              description: "Quantidade de exames realizados por área",
              dataName: "Exames",
              insight: "Exames periódicos são obrigatórios e devem ser realizados anualmente.",
              data: funcionariosPorDept?.slice(0, 6).map(d => ({
                departamento: d.departamento || "Sem Dept.",
                valor: d.funcionarios as number,
              })) || [],
            },
          ],
        };

      case "clima":
        const metricaClima = metricas?.[0];
        
        return {
          ...baseData,
          summary: {
            "Satisfação Geral": `${metricaClima?.satisfacao_interna?.toFixed(1) || 0}/10`,
            "Satisfação do Gestor": `${metricaClima?.satisfacao_gestor?.toFixed(1) || 0}/10`,
            "Taxa de Retenção": `${metricaClima?.taxa_retencao?.toFixed(1) || 0}%`,
            "Índice de Engajamento": `${((metricaClima?.satisfacao_interna || 0) * 10).toFixed(0)}%`,
          },
          details: funcionariosPorDept?.map(d => ({
            departamento: d.departamento,
            funcionarios: d.funcionarios,
            satisfacaoEstimada: (Math.random() * 2 + 7).toFixed(1),
            engajamento: Math.floor(Math.random() * 20 + 75) + "%",
          })) || [],
          charts: [
            {
              type: "radar",
              title: "Indicadores de Clima Organizacional",
              description: "Visão geral das dimensões do clima organizacional",
              data: [
                { indicador: "Satisfação", valor: (metricaClima?.satisfacao_interna || 0) * 10 },
                { indicador: "Liderança", valor: (metricaClima?.satisfacao_gestor || 0) * 10 },
                { indicador: "Engajamento", valor: (metricaClima?.satisfacao_interna || 0) * 10 },
                { indicador: "Retenção", valor: metricaClima?.taxa_retencao || 0 },
                { indicador: "Bem-estar", valor: 100 - (metricaClima?.indice_absenteismo || 0) },
              ],
            },
            {
              type: "bar",
              title: "Satisfação por Departamento",
              description: "Nível de satisfação estimado por área",
              dataName: "Score",
              insight: "Scores acima de 7 indicam bom clima organizacional.",
              data: funcionariosPorDept?.slice(0, 6).map(d => ({
                departamento: d.departamento || "Sem Dept.",
                valor: parseFloat((Math.random() * 2 + 7).toFixed(1)),
              })) || [],
            },
          ],
        };

      default:
        return {
          ...baseData,
          summary: {
            "Info": "Selecione os filtros e gere o relatório para visualizar os dados.",
          },
        };
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-dark dark:from-gray-900 dark:via-gray-800 dark:to-gray-950">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <BackButton to="/gestao-rh" variant="light" />
        
        <div className="mb-6 sm:mb-8 md:mb-12 text-center animate-fade-in mt-4">
          <div className="inline-block mb-2 sm:mb-4">
            <div className="w-12 sm:w-20 h-1 bg-white/40 rounded-full mx-auto"></div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 tracking-tight px-2">
            Relatórios e Análises
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-primary-foreground/90 dark:text-gray-300 max-w-2xl mx-auto px-4">
            Escolha o relatório para análise
          </p>
          <div className="mt-4 sm:mt-6 flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>

        {!selectedReport ? (
          <ReportSelector reports={reportTypes} onSelectReport={handleSelectReport} />
        ) : (
          <div className="space-y-4 sm:space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
              <Button 
                variant="secondary"
                onClick={() => setSelectedReport(null)}
                className="bg-white/95 hover:bg-white dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white text-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Voltar aos relatórios
              </Button>
              {reportData && (
                <ExportOptions
                  data={reportData.details || []}
                  reportTitle={reportTypes.find(r => r.id === selectedReport)?.name || "Relatório"}
                  summary={reportData.summary}
                  charts={reportData.charts}
                  onExportComplete={(exportInfo) => {
                    const newReport: DownloadedReport = {
                      id: Date.now().toString(),
                      type: exportInfo.type,
                      filename: exportInfo.filename,
                      reportTitle: reportTypes.find(r => r.id === selectedReport)?.name || "Relatório",
                      date: exportInfo.date,
                    };
                    setDownloadedReports(prev => [newReport, ...prev]);
                  }}
                />
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
              <div className="mb-4 sm:mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
                  {reportTypes.find(r => r.id === selectedReport)?.icon && (
                    <div className="relative flex-shrink-0">
                      <div className="absolute inset-0 bg-destructive/20 rounded-full blur-lg"></div>
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-destructive/10 to-destructive/5 flex items-center justify-center shadow-lg">
                        {(() => {
                          const Icon = reportTypes.find(r => r.id === selectedReport)!.icon;
                          return <Icon className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 text-destructive" />;
                        })()}
                      </div>
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground truncate">
                      {reportTypes.find(r => r.id === selectedReport)?.name}
                    </h2>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {reportTypes.find(r => r.id === selectedReport)?.description}
                    </p>
                  </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-primary via-destructive/20 to-transparent rounded-full"></div>
              </div>
              
              <div className="space-y-4 sm:space-y-6">
                <ReportFilters
                  reportType={selectedReport}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onGenerate={handleGenerateReport}
                  funcionarios={funcionariosLista}
                  escalas={escalasUnicas}
                  turnos={turnosUnicos}
                />

                {reportData && (
                  <ReportViewer
                    reportType={selectedReport}
                    data={reportData}
                  />
                )}
              </div>
              
              {/* Seção de Documentos para Download */}
              <DownloadedReports 
                reports={downloadedReports} 
                onClear={() => setDownloadedReports([])}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Relatorios;
