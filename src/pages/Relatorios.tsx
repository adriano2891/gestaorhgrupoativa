import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const Relatorios = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);
  const [filters, setFilters] = useState<any>({});
  const [reportData, setReportData] = useState<any>(null);

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
    // Gerar dados mockados baseados no tipo de relatório
    const mockData = generateMockData(selectedReport, filters);
    setReportData(mockData);
  };

  const generateMockData = (reportType: string | null, filters: any) => {
    // Aqui você implementaria a lógica real de busca de dados
    // Por enquanto, retornamos dados mockados
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
        return {
          ...baseData,
          summary: {
            total: 234,
            ativos: 210,
            afastados: 15,
            desligados: 9,
          },
          details: Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            nome: `Colaborador ${i + 1}`,
            cargo: ["Analista", "Gerente", "Coordenador"][i % 3],
            departamento: ["TI", "RH", "Financeiro", "Comercial"][i % 4],
            status: ["Ativo", "Férias", "Afastado"][i % 3],
            admissao: "01/01/2020",
            email: `colaborador${i + 1}@empresa.com`,
          })),
        };

      case "kpis":
        return {
          ...baseData,
          summary: {
            absenteismo: 3.2,
            turnover: 8.5,
            horasExtras: 12.4,
            tempoMedio: 3.5,
            produtividade: 87.3,
            custoMedio: 8450,
          },
          charts: [
            {
              type: "line",
              title: "Evolução do Turnover",
              data: [
                { mes: "Jan", valor: 7.2 },
                { mes: "Fev", valor: 8.1 },
                { mes: "Mar", valor: 8.5 },
                { mes: "Abr", valor: 9.2 },
                { mes: "Mai", valor: 8.8 },
                { mes: "Jun", valor: 8.5 },
              ],
            },
            {
              type: "bar",
              title: "Absenteísmo por Departamento",
              data: [
                { departamento: "TI", valor: 2.8 },
                { departamento: "RH", valor: 3.5 },
                { departamento: "Financeiro", valor: 2.9 },
                { departamento: "Comercial", valor: 4.1 },
              ],
            },
          ],
        };

      default:
        return baseData;
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Relatórios e Análises de RH
        </h1>
        <p className="text-muted-foreground mt-1">
          Sistema completo de relatórios com 13 tipos de análises
        </p>
      </div>

      {!selectedReport ? (
        <ReportSelector reports={reportTypes} onSelectReport={handleSelectReport} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => setSelectedReport(null)}>
              ← Voltar para seleção
            </Button>
            {reportData && (
              <ExportOptions
                data={reportData.details || []}
                reportTitle={reportTypes.find(r => r.id === selectedReport)?.name || "Relatório"}
              />
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {reportTypes.find(r => r.id === selectedReport)?.icon && (
                  <span className="text-primary">
                    {(() => {
                      const Icon = reportTypes.find(r => r.id === selectedReport)!.icon;
                      return <Icon className="h-6 w-6" />;
                    })()}
                  </span>
                )}
                {reportTypes.find(r => r.id === selectedReport)?.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Relatorios;
