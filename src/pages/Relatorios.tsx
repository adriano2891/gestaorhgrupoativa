import { useState, useMemo } from "react";
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
          statusCount[s] = (statusCount[s] || 0) + 1;
        });
        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Período": periodoLabel,
            "Total Solicitações": data.length,
            "Aprovadas": statusCount["aprovada"] || 0,
            "Pendentes": statusCount["pendente"] || 0,
            "Rejeitadas": statusCount["rejeitada"] || 0,
          },
          charts: [
            {
              type: "pie",
              title: "Status das Solicitações",
              description: "Distribuição por status",
              data: Object.entries(statusCount).map(([status, count]) => ({ status, valor: count })),
            },
          ],
          details: data.slice(0, 100).map((f: any) => ({
            Funcionário: f.profiles?.nome || "-",
            "Data Início": f.data_inicio || "-",
            "Data Fim": f.data_fim || "-",
            Status: f.status || "-",
            Tipo: f.tipo || "Férias",
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

        if (selectedReport === "faltas") {
          const faltas = data.filter((r: any) => !r.entrada);
          const atrasos = data.filter((r: any) => {
            if (!r.entrada) return false;
            const hora = parseInt(r.entrada.split(":")[0] || "0");
            return hora > 8;
          });
          const deptFaltas: Record<string, number> = {};
          faltas.forEach((r: any) => {
            const d = r.profiles?.departamento || "Sem Departamento";
            deptFaltas[d] = (deptFaltas[d] || 0) + 1;
          });
          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Período": periodoLabel,
              "Total Registros": data.length,
              "Faltas": faltas.length,
              "Atrasos": atrasos.length,
              "Taxa de Faltas": data.length > 0 ? `${((faltas.length / data.length) * 100).toFixed(1)}%` : "0%",
            },
            charts: [
              {
                type: "bar",
                title: "Faltas por Departamento",
                description: "Distribuição de faltas por departamento",
                data: Object.entries(deptFaltas).map(([dept, count]) => ({ departamento: dept, valor: count })),
                dataName: "Faltas",
              },
            ],
            details: faltas.slice(0, 100).map((r: any) => ({
              Funcionário: r.profiles?.nome || "-",
              Data: r.data || "-",
              Departamento: r.profiles?.departamento || "-",
              Tipo: "Falta",
            })),
          });
        } else if (selectedReport === "absenteismo") {
          const deptStats: Record<string, { total: number; ausencias: number }> = {};
          data.forEach((r: any) => {
            const d = r.profiles?.departamento || "Sem Departamento";
            if (!deptStats[d]) deptStats[d] = { total: 0, ausencias: 0 };
            deptStats[d].total++;
            if (!r.entrada) deptStats[d].ausencias++;
          });
          const totalAusencias = data.filter((r: any) => !r.entrada).length;
          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Período": periodoLabel,
              "Total Registros": data.length,
              "Total Ausências": totalAusencias,
              "Taxa de Absenteísmo": data.length > 0 ? `${((totalAusencias / data.length) * 100).toFixed(1)}%` : "0%",
            },
            charts: [
              {
                type: "bar",
                title: "Absenteísmo por Departamento",
                description: "Taxa de ausências por departamento",
                data: Object.entries(deptStats).map(([dept, stats]) => ({
                  departamento: dept,
                  valor: stats.total > 0 ? parseFloat(((stats.ausencias / stats.total) * 100).toFixed(1)) : 0,
                })),
                dataName: "Taxa (%)",
              },
            ],
            details: data.filter((r: any) => !r.entrada).slice(0, 100).map((r: any) => ({
              Funcionário: r.profiles?.nome || "-",
              Data: r.data || "-",
              Departamento: r.profiles?.departamento || "-",
            })),
          });
        } else {
          // pontos
          const deptHoras: Record<string, number> = {};
          data.forEach((r: any) => {
            const d = r.profiles?.departamento || "Sem Departamento";
            deptHoras[d] = (deptHoras[d] || 0) + 1;
          });
          setGeneratedData({
            generatedAt: now.toISOString(),
            summary: {
              "Período": periodoLabel,
              "Total Registros": data.length,
              "Colaboradores": new Set(data.map((r: any) => r.user_id)).size,
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
            details: data.slice(0, 100).map((r: any) => ({
              Funcionário: r.profiles?.nome || "-",
              Data: r.data || "-",
              Entrada: r.entrada || "-",
              "Saída Almoço": r.saida_almoco || "-",
              "Retorno Almoço": r.retorno_almoco || "-",
              Saída: r.saida || "-",
              "Total Horas": r.total_horas || "-",
              "Horas Extras": r.horas_extras || "-",
            })),
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
        const total = filtered.length;
        const desligados = filtered.filter((f: any) =>
          f.status === "demitido" || f.status === "pediu_demissao" || f.status === "Demitido" || f.status === "Pediu Demissão"
        );
        const taxaTurnover = total > 0 ? ((desligados.length / total) * 100).toFixed(1) : "0";
        const taxaRetencao = total > 0 ? (((total - desligados.length) / total) * 100).toFixed(1) : "0";
        const motivoCount: Record<string, number> = {};
        desligados.forEach((f: any) => {
          const m = f.status || "Desligado";
          motivoCount[m] = (motivoCount[m] || 0) + 1;
        });
        const deptDesligamentos: Record<string, number> = {};
        desligados.forEach((f: any) => {
          const d = f.departamento || "Sem Departamento";
          deptDesligamentos[d] = (deptDesligamentos[d] || 0) + 1;
        });
        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Total Colaboradores": total,
            "Desligamentos": desligados.length,
            "Taxa Turnover": `${taxaTurnover}%`,
            "Taxa Retenção": `${taxaRetencao}%`,
          },
          charts: [
            {
              type: "bar",
              title: "Desligamentos por Departamento",
              description: "Distribuição de desligamentos por área",
              data: Object.entries(deptDesligamentos).map(([dept, count]) => ({ departamento: dept, valor: count })),
              dataName: "Desligamentos",
            },
            {
              type: "pie",
              title: "Motivo dos Desligamentos",
              description: "Tipo de desligamento",
              data: Object.entries(motivoCount).map(([motivo, count]) => ({ motivo, valor: count })),
            },
          ],
          details: desligados.slice(0, 100).map((f: any) => ({
            Nome: f.nome || "-",
            Cargo: f.cargo || "-",
            Departamento: f.departamento || "-",
            Status: f.status || "-",
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

      case "beneficios":
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
        const title = selectedReport === "beneficios" ? "Benefícios por Departamento" : "Colaboradores por Departamento (SST)";
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
              title,
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
        if (filters.departamento && filters.departamento !== "todos") {
          data = data.filter((h: any) => h.profiles?.departamento?.toLowerCase().includes(filters.departamento.toLowerCase()));
        }
        const totalProventos = data.reduce((acc: number, h: any) => acc + (parseFloat(h.salario_bruto) || 0), 0);
        const totalDescontos = data.reduce((acc: number, h: any) => acc + (parseFloat(h.total_descontos) || 0), 0);
        const totalLiquido = data.reduce((acc: number, h: any) => acc + (parseFloat(h.salario_liquido) || 0), 0);
        setGeneratedData({
          generatedAt: now.toISOString(),
          summary: {
            "Período": periodoLabel,
            "Total Pagamentos": data.length,
            "Total Proventos": `R$ ${totalProventos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            "Total Descontos": `R$ ${totalDescontos.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
            "Remuneração Líquida": `R$ ${totalLiquido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
          },
          charts: [
            {
              type: "bar",
              title: "Composição da Folha",
              description: "Proventos vs Descontos vs Líquido",
              data: [
                { categoria: "Proventos", valor: totalProventos },
                { categoria: "Descontos", valor: totalDescontos },
                { categoria: "Líquido", valor: totalLiquido },
              ],
              dataName: "Valor (R$)",
            },
          ],
          details: data.slice(0, 100).map((h: any) => ({
            Funcionário: h.profiles?.nome || "-",
            "Mês/Ano": `${h.mes_referencia}/${h.ano_referencia}`,
            "Salário Bruto": h.salario_bruto ? `R$ ${parseFloat(h.salario_bruto).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-",
            Descontos: h.total_descontos ? `R$ ${parseFloat(h.total_descontos).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-",
            Líquido: h.salario_liquido ? `R$ ${parseFloat(h.salario_liquido).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "-",
          })),
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
