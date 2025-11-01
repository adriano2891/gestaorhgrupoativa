import {
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Activity,
  Target,
  TrendingDown,
  BarChart3,
  PieChart,
  Percent,
  UserCheck,
} from "lucide-react";
import { useMetricas } from "@/hooks/useMetricas";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { FiltrosRelatorio } from "@/components/relatorios/FiltrosRelatorio";
import { MetricCard } from "@/components/relatorios/MetricCard";
import { ReportCard } from "@/components/relatorios/ReportCard";
import { TendenciaChart } from "@/components/relatorios/TendenciaChart";
import { ComparativoChart } from "@/components/relatorios/ComparativoChart";
import { ExportOptions } from "@/components/relatorios/ExportOptions";
import { ScheduleReport } from "@/components/relatorios/ScheduleReport";
import { SavedFilters } from "@/components/relatorios/SavedFilters";
import { AdvancedMetrics } from "@/components/relatorios/AdvancedMetrics";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Relatorios = () => {
  const { data: metricas, isLoading } = useMetricas(1);
  const metricaAtual = metricas?.[0];
  const [favoritos, setFavoritos] = useState<string[]>([]);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [currentFilters, setCurrentFilters] = useState<any>({});

  const reports = [
    {
      id: "folha-pagamento",
      title: "Relatório de Folha de Pagamento",
      description: "Resumo completo de salários, encargos e benefícios",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
      period: "Outubro 2025",
    },
    {
      id: "frequencia",
      title: "Relatório de Frequência",
      description: "Análise detalhada de presenças, ausências e atrasos",
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      period: "Último mês",
    },
    {
      id: "turnover",
      title: "Relatório de Turnover",
      description: "Taxa de rotatividade e motivos de desligamento",
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      period: "Últimos 12 meses",
    },
    {
      id: "contratacoes",
      title: "Relatório de Contratações",
      description: "Processos seletivos, admissões e evolução de equipes",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      period: "Último trimestre",
    },
    {
      id: "desempenho",
      title: "Relatório de Desempenho",
      description: "Produtividade e entregas por equipe",
      icon: Target,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100",
      period: "Último trimestre",
    },
    {
      id: "absenteismo",
      title: "Relatório de Absenteísmo",
      description: "Análise de faltas justificadas e não justificadas",
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-100",
      period: "Últimos 6 meses",
    },
    {
      id: "carga-horaria",
      title: "Relatório de Carga Horária",
      description: "Comparativo entre horas previstas e realizadas",
      icon: BarChart3,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100",
      period: "Último mês",
    },
    {
      id: "beneficios",
      title: "Relatório de Benefícios",
      description: "Custos e uso de benefícios por departamento",
      icon: PieChart,
      color: "text-pink-600",
      bgColor: "bg-pink-100",
      period: "Último mês",
    },
  ];

  const toggleFavorito = (id: string) => {
    setFavoritos((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  // Dados mock para os gráficos
  const tendenciaData = [
    { mes: "Jan", valor: 92.5 },
    { mes: "Fev", valor: 91.8 },
    { mes: "Mar", valor: 93.2 },
    { mes: "Abr", valor: 94.1 },
    { mes: "Mai", valor: 93.8 },
    { mes: "Jun", valor: 94.5 },
  ];

  const comparativoData = [
    { departamento: "TI", custo: 285000, funcionarios: 45 },
    { departamento: "RH", custo: 165000, funcionarios: 28 },
    { departamento: "Financeiro", custo: 198000, funcionarios: 32 },
    { departamento: "Comercial", custo: 342000, funcionarios: 58 },
    { departamento: "Operacional", custo: 425000, funcionarios: 71 },
  ];

  const handleFilter = (filtros: any) => {
    setCurrentFilters(filtros);
    console.log("Filtros aplicados:", filtros);
    // Aqui seria implementada a filtragem real
  };

  const handleLoadFilters = (filters: any) => {
    setCurrentFilters(filters);
    handleFilter(filters);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const metrics = metricaAtual
    ? [
        {
          title: "Taxa de Presença",
          value: metricaAtual.taxa_presenca || 0,
          description: "Média mensal de presença",
          icon: Activity,
          color: "text-green-600",
          trend: "up" as const,
          trendValue: "+2.5%",
        },
        {
          title: "Taxa de Retenção",
          value: metricaAtual.taxa_retencao || 0,
          description: "Funcionários retidos",
          icon: Users,
          color: "text-blue-600",
          trend: "up" as const,
          trendValue: "+1.2%",
        },
        {
          title: "Satisfação Interna",
          value: metricaAtual.satisfacao_interna || 0,
          description: "Pesquisa de clima",
          icon: Target,
          color: "text-purple-600",
          trend: "neutral" as const,
          trendValue: "0%",
        },
        {
          title: "Índice de Absenteísmo",
          value: metricaAtual.indice_absenteismo || 0,
          description: "Faltas e ausências",
          icon: TrendingDown,
          color: "text-red-600",
          trend: "down" as const,
          trendValue: "-0.8%",
        },
        {
          title: "Produtividade",
          value: metricaAtual.produtividade_equipe || 85,
          description: "Metas atingidas",
          icon: Target,
          color: "text-indigo-600",
          trend: "up" as const,
          trendValue: "+5%",
        },
        {
          title: "Eficiência",
          value: metricaAtual.indice_eficiencia || 0,
          description: "Metas vs entregas",
          icon: BarChart3,
          color: "text-purple-600",
          trend: "up" as const,
          trendValue: "+3.2%",
        },
        {
          title: "Satisfação Gestor",
          value: metricaAtual.satisfacao_gestor || 88,
          description: "Avaliação de equipes",
          icon: UserCheck,
          color: "text-cyan-600",
          trend: "up" as const,
          trendValue: "+2%",
        },
        {
          title: "Horas Extras",
          value: metricaAtual.horas_extras_percentual || 0,
          description: "Sobre carga horária",
          icon: Clock,
          color: "text-orange-600",
          trend: "neutral" as const,
          trendValue: "0%",
        },
      ]
    : [];

  const relatoriosFavoritos = reports.filter((r) => favoritos.includes(r.id));
  const outrosRelatorios = reports.filter((r) => !favoritos.includes(r.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-foreground">
          Relatórios e Análises
        </h1>
        <p className="text-primary-foreground/80 mt-1">
          Métricas em tempo real e relatórios personalizados
        </p>
      </div>

      {/* Filtros Avançados */}
      <FiltrosRelatorio onFilter={handleFilter} />

      {/* Tabs para diferentes visões */}
      <Tabs defaultValue="metricas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="metricas">Métricas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="graficos">Gráficos</TabsTrigger>
          <TabsTrigger value="filtros">Filtros Salvos</TabsTrigger>
        </TabsList>

        <TabsContent value="metricas" className="space-y-6">
          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 mb-4">
            <ExportOptions
              data={metrics.map(m => ({ métrica: m.title, valor: m.value, descrição: m.description }))}
              reportTitle="Métricas Principais"
              metrics={metrics.map(m => ({ title: m.title, value: m.value }))}
            />
          </div>

          {/* Métricas Principais com novo componente */}
          <AdvancedMetrics
            metrics={metrics.map(m => ({
              ...m,
              icon: <m.icon className="h-6 w-6" />
            }))}
          />

          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro - Outubro 2025</CardTitle>
              <CardDescription>
                Consolidação de custos com pessoal e benefícios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-secondary/50 rounded-lg">
                  <span className="font-medium">Total da Folha de Pagamento</span>
                  <span className="text-2xl font-bold text-primary">
                    R$ {(metricaAtual?.total_folha_pagamento || 1847350).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Salários
                    </div>
                    <div className="text-xl font-bold">R$ 1.456.200,00</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      78.8% do total
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Benefícios
                    </div>
                    <div className="text-xl font-bold">
                      R$ {(metricaAtual?.custo_beneficios || 245850).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      13.3% do total
                    </div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">
                      Encargos
                    </div>
                    <div className="text-xl font-bold">
                      R$ {(metricaAtual?.total_encargos || 145300).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      7.9% do total
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-6">
          {/* Relatórios Favoritos */}
          {relatoriosFavoritos.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Relatórios Favoritos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatoriosFavoritos.map((report) => (
                  <ReportCard
                    key={report.id}
                    title={report.title}
                    description={report.description}
                    icon={report.icon}
                    color={report.color}
                    bgColor={report.bgColor}
                    period={report.period}
                    isFavorite={true}
                    onToggleFavorite={() => toggleFavorito(report.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Todos os Relatórios */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Todos os Relatórios</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {outrosRelatorios.map((report) => (
                <ReportCard
                  key={report.id}
                  title={report.title}
                  description={report.description}
                  icon={report.icon}
                  color={report.color}
                  bgColor={report.bgColor}
                  period={report.period}
                  isFavorite={false}
                  onToggleFavorite={() => toggleFavorito(report.id)}
                />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="graficos" className="space-y-6">
          {/* Botões de Ação */}
          <div className="flex justify-end gap-2 mb-4">
            <ExportOptions
              data={[...tendenciaData, ...comparativoData]}
              reportTitle="Gráficos e Análises"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TendenciaChart
              title="Tendência de Taxa de Presença"
              description="Evolução mensal dos últimos 6 meses"
              data={tendenciaData}
            />
            <ComparativoChart
              title="Comparativo por Departamento"
              description="Custos e número de funcionários"
              data={comparativoData}
            />
          </div>
        </TabsContent>

        <TabsContent value="filtros" className="space-y-6">
          <SavedFilters
            currentFilters={currentFilters}
            onLoadFilters={handleLoadFilters}
          />
        </TabsContent>
      </Tabs>

      {/* Dialog de Agendamento */}
      <ScheduleReport
        open={showScheduleDialog}
        onOpenChange={setShowScheduleDialog}
        reportTitle="Relatório Selecionado"
      />
    </div>
  );
};

export default Relatorios;
