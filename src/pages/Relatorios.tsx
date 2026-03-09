import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { BarChart3, Download, ShieldCheck, Users, Clock, FileText, DollarSign, TrendingDown, HeartPulse, Briefcase, Receipt, AlertCircle, CalendarDays, Heart, HardHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarPdfChecklistConformidade } from "@/utils/checklistConformidadePdf";
import { ReportSelector } from "@/components/relatorios/ReportSelector";
import { ReportViewer } from "@/components/relatorios/ReportViewer";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { useRegistrosPonto } from "@/hooks/useRegistrosPonto";
import { useHolerites } from "@/hooks/useHolerites";
import { useSolicitacoesFerias } from "@/hooks/useFerias";

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
  const { data: funcionarios } = useFuncionarios();
  const { data: registros } = useRegistrosPonto();
  const { data: holerites } = useHolerites();
  const { data: ferias } = useSolicitacoesFerias();

  const getReportData = () => {
    switch (selectedReport) {
      case "funcionarios": return funcionarios || [];
      case "pontos": return registros || [];
      case "holerites": return holerites || [];
      case "ferias": return ferias || [];
      default: return [];
    }
  };

  if (selectedReport) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <BackButton onClick={() => setSelectedReport(null)} />
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Arial, sans-serif' }}>
                {reportOptions.find(r => r.id === selectedReport)?.name}
              </h1>
              <p className="text-sm text-muted-foreground">Relatórios e Análises</p>
            </div>
          </div>
        </div>
        <ReportViewer reportType={selectedReport} data={getReportData()} />
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


      {/* Report Selector com cards categorizados */}
      <ReportSelector reports={reportOptions} onSelectReport={setSelectedReport} />
    </div>
  );
};

export default Relatorios;
