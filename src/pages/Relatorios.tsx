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
import { useFuncionarios, useFuncionariosPorDepartamento } from "@/hooks/useFuncionarios";
import { useRegistrosPonto, useAbsenteismoPorDepartamento } from "@/hooks/useRegistrosPonto";
import { useMetricas } from "@/hooks/useMetricas";
import { format } from "date-fns";

const Relatorios = () => {
  useFuncionariosRealtime();
  usePontoRealtime();
  useMetricasRealtime();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [reportData, setReportData] = useState<any>(null);

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
        
        return {
          ...baseData,
          summary: {
            total: funcionarios.length,
            departamentos: new Set(funcionarios.map(f => f.departamento || "Sem Departamento")).size,
            cargos: new Set(funcionarios.map(f => f.cargo || "Sem Cargo")).size,
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
          charts: funcionariosPorDept ? [
            {
              type: "bar",
              title: "Funcionários por Departamento",
              data: funcionariosPorDept.map(d => ({
                departamento: d.departamento,
                valor: d.funcionarios,
              })),
            },
          ] : [],
        };

      case "pontos":
        if (!registrosPonto) return baseData;
        
        return {
          ...baseData,
          summary: {
            totalRegistros: registrosPonto.length,
            comPresenca: registrosPonto.filter(r => r.entrada).length,
            semPresenca: registrosPonto.filter(r => !r.entrada).length,
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
        };

      case "kpis":
        const metrica = metricas?.[0];
        if (!metrica) return baseData;

        return {
          ...baseData,
          summary: {
            "Taxa de Presença": `${metrica.taxa_presenca?.toFixed(1) || 0}%`,
            "Taxa de Retenção": `${metrica.taxa_retencao?.toFixed(1) || 0}%`,
            "Satisfação Interna": `${metrica.satisfacao_interna?.toFixed(1) || 0}/10`,
            "Absenteísmo": `${metrica.indice_absenteismo?.toFixed(1) || 0}%`,
            "Horas Extras": `${metrica.horas_extras_percentual?.toFixed(1) || 0}%`,
            "Índice de Eficiência": `${metrica.indice_eficiencia?.toFixed(1) || 0}%`,
          },
          charts: absenteismoDept ? [
            {
              type: "bar",
              title: "Absenteísmo por Departamento",
              data: absenteismoDept.map(d => ({
                departamento: d.departamento,
                valor: parseFloat(d.taxa as string),
              })),
            },
          ] : [],
        };

      case "absenteismo":
        if (!absenteismoDept) return baseData;
        
        return {
          ...baseData,
          summary: {
            "Taxa Média": `${absenteismoDept.reduce((acc, d) => acc + parseFloat(d.taxa as string), 0) / absenteismoDept.length || 0}%`,
          },
          details: absenteismoDept.map(d => ({
            departamento: d.departamento,
            taxaAbsenteismo: `${d.taxa}%`,
          })),
          charts: [
            {
              type: "bar",
              title: "Taxa de Absenteísmo por Departamento",
              data: absenteismoDept.map(d => ({
                departamento: d.departamento,
                valor: parseFloat(d.taxa as string),
              })),
            },
          ],
        };

      default:
        return baseData;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-dark">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center animate-fade-in">
          <div className="inline-block mb-4">
            <div className="w-20 h-1 bg-white/40 rounded-full mx-auto"></div>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 tracking-tight">
            Relatórios e Análises de RH
          </h1>
          <p className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
            Escolha o relatório desejado para análise detalhada e insights estratégicos
          </p>
          <div className="mt-6 flex items-center justify-center gap-2">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Relatorios;
