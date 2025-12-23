import { useState } from "react";
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
import { ReportSelector } from "@/components/relatorios/ReportSelector";
import { ReportFilters } from "@/components/relatorios/ReportFilters";
import { ReportViewer } from "@/components/relatorios/ReportViewer";
import { ExportOptions } from "@/components/relatorios/ExportOptions";
import { DownloadedReports } from "@/components/relatorios/DownloadedReports";
import { useFuncionarios, useFuncionariosPorDepartamento } from "@/hooks/useFuncionarios";
import { useRegistrosPonto, useAbsenteismoPorDepartamento } from "@/hooks/useRegistrosPonto";
import { useMetricas } from "@/hooks/useMetricas";
import { format } from "date-fns";

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
      name: "Benefícios e Custos",
      icon: DollarSign,
      category: "Custos",
      description: "Análise de benefícios e despesas",
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
    {
      id: "kpis",
      name: "Indicadores-Chave (KPIs)",
      icon: BarChart3,
      category: "Indicadores",
      description: "Dashboard com principais métricas",
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

  const handleGenerateReport = () => {
    const data = generateReportData(selectedReport, filters);
    setReportData(data);
  };

  const generateReportData = (reportType: string | null, filters: any) => {
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
        if (!funcionarios) return baseData;
        
        // Agrupa funcionários por departamento
        const deptStats = funcionariosPorDept?.reduce((acc: any, d: any) => {
          acc[d.departamento] = d.funcionarios;
          return acc;
        }, {}) || {};

        // Calcula estatísticas de salário
        const salarios = funcionarios.filter(f => f.salario).map(f => f.salario || 0);
        const avgSalario = salarios.length > 0 ? salarios.reduce((a, b) => a + b, 0) / salarios.length : 0;
        const maxSalario = salarios.length > 0 ? Math.max(...salarios) : 0;
        const minSalario = salarios.length > 0 ? Math.min(...salarios) : 0;

        // Agrupa por cargo
        const cargoCount: Record<string, number> = {};
        funcionarios.forEach(f => {
          const cargo = f.cargo || "Não informado";
          cargoCount[cargo] = (cargoCount[cargo] || 0) + 1;
        });
        
        return {
          ...baseData,
          summary: {
            "Total Funcionários": funcionarios.length,
            "Departamentos": new Set(funcionarios.map(f => f.departamento || "Sem Departamento")).size,
            "Cargos Diferentes": new Set(funcionarios.map(f => f.cargo || "Sem Cargo")).size,
            "Salário Médio": `R$ ${avgSalario.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
          details: funcionarios.map(f => ({
            nome: f.nome,
            email: f.email,
            telefone: f.telefone || "Não informado",
            cargo: f.cargo || "Não informado",
            departamento: f.departamento || "Não informado",
            cpf: f.cpf || "Não informado",
            salario: f.salario ? `R$ ${f.salario.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Não informado",
            admissao: format(new Date(f.created_at), "dd/MM/yyyy"),
          })),
          charts: [
            ...(funcionariosPorDept ? [{
              type: "bar",
              title: "Distribuição de Funcionários por Departamento",
              description: "Quantidade de colaboradores em cada departamento da empresa",
              dataName: "Funcionários",
              insight: `O departamento com mais funcionários possui ${Math.max(...funcionariosPorDept.map(d => d.funcionarios as number))} colaboradores.`,
              data: funcionariosPorDept.map(d => ({
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

      case "pontos":
        if (!registrosPonto) return baseData;
        
        // Agrupa registros por dia da semana
        const diasSemana = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
        const registrosPorDia: Record<string, number> = {};
        diasSemana.forEach(d => registrosPorDia[d] = 0);
        
        registrosPonto.forEach(r => {
          const dia = diasSemana[new Date(r.data).getDay()];
          if (r.entrada) registrosPorDia[dia]++;
        });

        const totalComEntrada = registrosPonto.filter(r => r.entrada).length;
        const totalComSaida = registrosPonto.filter(r => r.saida).length;
        const taxaCompletude = registrosPonto.length > 0 ? ((totalComSaida / registrosPonto.length) * 100).toFixed(1) : 0;
        
        return {
          ...baseData,
          summary: {
            "Total Registros": registrosPonto.length,
            "Com Entrada": totalComEntrada,
            "Com Saída Completa": totalComSaida,
            "Taxa de Completude": `${taxaCompletude}%`,
          },
          details: registrosPonto.slice(0, 50).map(r => ({
            nome: r.profiles?.nome || "Não informado",
            departamento: r.profiles?.departamento || "Não informado",
            data: format(new Date(r.data), "dd/MM/yyyy"),
            entrada: r.entrada ? format(new Date(r.entrada), "HH:mm") : "Não registrado",
            saida: r.saida ? format(new Date(r.saida), "HH:mm") : "Não registrado",
            totalHoras: r.total_horas || "0h",
            horasExtras: r.horas_extras || "0h",
          })),
          charts: [
            {
              type: "bar",
              title: "Registros de Ponto por Dia da Semana",
              description: "Distribuição dos registros ao longo da semana",
              dataName: "Registros",
              insight: "Analise os dias com menor frequência de registros para identificar padrões de ausência.",
              data: diasSemana.map(dia => ({
                dia,
                valor: registrosPorDia[dia],
              })),
            },
            {
              type: "pie",
              title: "Status dos Registros",
              description: "Proporção entre registros completos e incompletos",
              data: [
                { status: "Completos", valor: totalComSaida },
                { status: "Apenas Entrada", valor: totalComEntrada - totalComSaida },
                { status: "Sem Registro", valor: registrosPonto.length - totalComEntrada },
              ].filter(d => d.valor > 0),
            },
          ],
        };

      case "kpis":
        const metrica = metricas?.[0];
        if (!metrica) return baseData;

        const kpiData = [
          { indicador: "Presença", valor: metrica.taxa_presenca || 0, meta: 95 },
          { indicador: "Retenção", valor: metrica.taxa_retencao || 0, meta: 90 },
          { indicador: "Eficiência", valor: metrica.indice_eficiencia || 0, meta: 85 },
          { indicador: "Satisfação", valor: (metrica.satisfacao_interna || 0) * 10, meta: 80 },
          { indicador: "Produtividade", valor: metrica.produtividade_equipe || 0, meta: 80 },
        ];

        return {
          ...baseData,
          summary: {
            "Taxa de Presença": `${metrica.taxa_presenca?.toFixed(1) || 0}%`,
            "Taxa de Retenção": `${metrica.taxa_retencao?.toFixed(1) || 0}%`,
            "Satisfação Interna": `${metrica.satisfacao_interna?.toFixed(1) || 0}/10`,
            "Índice de Absenteísmo": `${metrica.indice_absenteismo?.toFixed(1) || 0}%`,
            "Horas Extras": `${metrica.horas_extras_percentual?.toFixed(1) || 0}%`,
            "Índice de Eficiência": `${metrica.indice_eficiencia?.toFixed(1) || 0}%`,
          },
          charts: [
            {
              type: "radar",
              title: "Visão Geral dos KPIs",
              description: "Comparativo entre indicadores atuais e metas estabelecidas",
              insight: "O gráfico radar permite visualizar rapidamente quais áreas precisam de atenção.",
              data: kpiData,
            },
            ...(absenteismoDept ? [{
              type: "bar",
              title: "Absenteísmo por Departamento",
              description: "Taxa de absenteísmo segmentada por área",
              dataName: "Taxa (%)",
              insight: "Departamentos com taxa acima de 5% requerem atenção especial.",
              data: absenteismoDept.map(d => ({
                departamento: d.departamento || "Sem Dept.",
                valor: parseFloat(d.taxa as string),
              })),
            }] : []),
          ],
        };

      case "absenteismo":
        if (!absenteismoDept) return baseData;
        
        const taxaMedia = absenteismoDept.reduce((acc, d) => acc + parseFloat(d.taxa as string), 0) / absenteismoDept.length || 0;
        const deptMaiorAbsenteismo = absenteismoDept.reduce((max, d) => 
          parseFloat(d.taxa as string) > parseFloat(max.taxa as string) ? d : max
        , absenteismoDept[0]);
        const deptMenorAbsenteismo = absenteismoDept.reduce((min, d) => 
          parseFloat(d.taxa as string) < parseFloat(min.taxa as string) ? d : min
        , absenteismoDept[0]);
        
        return {
          ...baseData,
          summary: {
            "Taxa Média Geral": `${taxaMedia.toFixed(1)}%`,
            "Maior Taxa": `${deptMaiorAbsenteismo?.departamento}: ${deptMaiorAbsenteismo?.taxa}%`,
            "Menor Taxa": `${deptMenorAbsenteismo?.departamento}: ${deptMenorAbsenteismo?.taxa}%`,
            "Total Departamentos": absenteismoDept.length,
          },
          details: absenteismoDept.map(d => ({
            departamento: d.departamento,
            taxaAbsenteismo: `${d.taxa}%`,
            status: parseFloat(d.taxa as string) <= 3 ? "Excelente" : 
                    parseFloat(d.taxa as string) <= 5 ? "Bom" : 
                    parseFloat(d.taxa as string) <= 8 ? "Atenção" : "Crítico",
          })),
          charts: [
            {
              type: "bar",
              title: "Taxa de Absenteísmo por Departamento",
              description: "Comparativo das taxas de ausência entre departamentos",
              dataName: "Taxa (%)",
              insight: `A taxa média de absenteísmo é ${taxaMedia.toFixed(1)}%. Valores acima de 5% indicam necessidade de investigação.`,
              data: absenteismoDept.map(d => ({
                departamento: d.departamento || "Sem Dept.",
                valor: parseFloat(d.taxa as string),
              })),
            },
            {
              type: "pie",
              title: "Distribuição do Absenteísmo",
              description: "Proporção do absenteísmo entre departamentos",
              data: absenteismoDept.map(d => ({
                departamento: d.departamento || "Sem Dept.",
                valor: parseFloat(d.taxa as string),
              })),
            },
          ],
        };

      case "faltas-atrasos":
        if (!registrosPonto) return baseData;
        
        const semEntrada = registrosPonto.filter(r => !r.entrada).length;
        const comAtraso = registrosPonto.filter(r => {
          if (!r.entrada) return false;
          const horaEntrada = new Date(r.entrada).getHours();
          return horaEntrada >= 9; // Considera atraso após 9h
        }).length;
        
        return {
          ...baseData,
          summary: {
            "Total de Faltas": semEntrada,
            "Total de Atrasos": comAtraso,
            "Taxa de Faltas": `${registrosPonto.length > 0 ? ((semEntrada / registrosPonto.length) * 100).toFixed(1) : 0}%`,
            "Taxa de Atrasos": `${registrosPonto.length > 0 ? ((comAtraso / registrosPonto.length) * 100).toFixed(1) : 0}%`,
          },
          details: registrosPonto.filter(r => !r.entrada || new Date(r.entrada!).getHours() >= 9).slice(0, 30).map(r => ({
            nome: r.profiles?.nome || "Não informado",
            departamento: r.profiles?.departamento || "Não informado",
            data: format(new Date(r.data), "dd/MM/yyyy"),
            tipo: !r.entrada ? "Falta" : "Atraso",
            horaEntrada: r.entrada ? format(new Date(r.entrada), "HH:mm") : "-",
          })),
          charts: [
            {
              type: "pie",
              title: "Proporção Faltas vs Atrasos",
              description: "Distribuição percentual entre faltas e atrasos registrados",
              data: [
                { tipo: "Faltas", valor: semEntrada },
                { tipo: "Atrasos", valor: comAtraso },
                { tipo: "Normal", valor: registrosPonto.length - semEntrada - comAtraso },
              ].filter(d => d.valor > 0),
            },
          ],
        };

      case "beneficios":
        const metricaBeneficios = metricas?.[0];
        if (!metricaBeneficios) return baseData;

        return {
          ...baseData,
          summary: {
            "Custo Total Benefícios": `R$ ${(metricaBeneficios.custo_beneficios || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            "Custo Médio/Funcionário": `R$ ${(metricaBeneficios.custo_medio_funcionario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            "Total Folha": `R$ ${(metricaBeneficios.total_folha_pagamento || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
            "Total Encargos": `R$ ${(metricaBeneficios.total_encargos || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          },
          charts: [
            {
              type: "pie",
              title: "Composição dos Custos",
              description: "Distribuição dos custos entre folha, benefícios e encargos",
              data: [
                { tipo: "Folha de Pagamento", valor: metricaBeneficios.total_folha_pagamento || 0 },
                { tipo: "Benefícios", valor: metricaBeneficios.custo_beneficios || 0 },
                { tipo: "Encargos", valor: metricaBeneficios.total_encargos || 0 },
              ].filter(d => d.valor > 0),
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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-dark">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        <div className="mb-6 sm:mb-8 md:mb-12 text-center animate-fade-in">
          <div className="inline-block mb-2 sm:mb-4">
            <div className="w-12 sm:w-20 h-1 bg-white/40 rounded-full mx-auto"></div>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 tracking-tight px-2">
            Relatórios e Análises
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-primary-foreground/90 max-w-2xl mx-auto px-4">
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
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <Button 
                variant="secondary"
                onClick={() => setSelectedReport(null)}
                className="bg-white/95 hover:bg-white text-primary shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
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

            <div className="bg-white rounded-2xl shadow-2xl p-8">
              <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                  {reportTypes.find(r => r.id === selectedReport)?.icon && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-destructive/20 rounded-full blur-lg"></div>
                      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-destructive/10 to-destructive/5 flex items-center justify-center shadow-lg">
                        {(() => {
                          const Icon = reportTypes.find(r => r.id === selectedReport)!.icon;
                          return <Icon className="h-7 w-7 text-destructive" />;
                        })()}
                      </div>
                    </div>
                  )}
                  <div>
                    <h2 className="text-3xl font-bold text-foreground">
                      {reportTypes.find(r => r.id === selectedReport)?.name}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {reportTypes.find(r => r.id === selectedReport)?.description}
                    </p>
                  </div>
                </div>
                <div className="h-1 w-full bg-gradient-to-r from-primary via-destructive/20 to-transparent rounded-full"></div>
              </div>
              
              <div className="space-y-6">
                <ReportFilters
                  reportType={selectedReport}
                  filters={filters}
                  onFilterChange={handleFilterChange}
                  onGenerate={handleGenerateReport}
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
