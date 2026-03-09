import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { BarChart3, Download, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gerarPdfChecklistConformidade } from "@/utils/checklistConformidadePdf";

const Relatorios = () => {
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reportOptions = [
    { id: "funcionarios", name: "Funcionários Ativos", category: "RH" },
    { id: "pontos", name: "Pontos Registrados", category: "Ponto" },
    { id: "holerites", name: "Folha de Pagamento", category: "Folha" },
    { id: "ferias", name: "Férias e Afastamentos", category: "RH" },
    { id: "desempenho", name: "Desempenho", category: "Desempenho" },
    { id: "turnover", name: "Turnover", category: "RH" },
    { id: "clima", name: "Clima Organizacional", category: "Bem-estar" },
    { id: "custo-folha", name: "Custo de Folha de Ponto", category: "Custos" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <BackButton to="/gestao-rh" />
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-sm text-muted-foreground">Análise de dados e métricas</p>
          </div>
        </div>
      </div>

      {/* Checklist de Conformidade */}
      <Card className="border-primary/30 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Checklist de Conformidade CLT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-3">
            66 requisitos legais · 59 implementados (89%) · Jornada, Remuneração, Férias, Rescisão, SST e mais
          </p>
          <Button size="sm" className="gap-2" onClick={() => gerarPdfChecklistConformidade()}>
            <Download className="h-4 w-4" />
            Baixar PDF Completo
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reportOptions.map((report) => (
          <Card
            key={report.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => setSelectedReport(report.id)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{report.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{report.category}</p>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Download className="h-4 w-4" />
                Gerar Relatório
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Relatorios;
