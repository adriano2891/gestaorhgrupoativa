import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  Users,
  Award,
  Clock,
  BookOpen,
  Loader2,
  CheckCircle,
  XCircle,
  Building2,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { useCursos, useCursosStats, useMetricasDetalhadas } from "@/hooks/useCursos";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface RelatoriosCursosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RelatoriosCursosDialog = ({
  open,
  onOpenChange,
}: RelatoriosCursosDialogProps) => {
  const [selectedCurso, setSelectedCurso] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const { data: cursos } = useCursos();
  const { data: stats } = useCursosStats();
  const { data: metricas, isLoading } = useMetricasDetalhadas(
    selectedCurso !== "all" ? selectedCurso : undefined
  );

  const exportarCSV = async () => {
    if (!metricas?.funcionariosMatriculados) return;

    setIsExporting(true);
    try {
      const headers = [
        "Funcionário",
        "Email",
        "Departamento",
        "Cargo",
        "Curso",
        "Progresso (%)",
        "Status",
        "Concluído (100%)",
      ];

      const rows = metricas.funcionariosMatriculados.map((f) => [
        f.nome,
        f.email,
        f.departamento,
        f.cargo,
        f.curso,
        String(f.progresso),
        f.concluido ? "Concluído" : f.status === "em_andamento" ? "Em Andamento" : "Não Iniciado",
        f.concluido ? "Sim" : "Não",
      ]);

      const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `relatorio-cursos-${format(new Date(), "yyyy-MM-dd")}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const exportarPDF = async () => {
    if (!metricas?.funcionariosMatriculados) return;

    setIsExportingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Relatório de Cursos", pageWidth / 2, 20, { align: "center" });

      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, 27, { align: "center" });

      let y = 35;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Resumo Geral", 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [["Métrica", "Valor"]],
        body: [
          ["Matriculados", String(metricas.resumo.total || 0)],
          ["Concluídos (100%)", String(metricas.resumo.concluidos || 0)],
          ["Em Andamento", String(metricas.resumo.emAndamento || 0)],
          ["Taxa Conclusão", `${metricas.resumo.taxaConclusao || 0}%`],
          ["Progresso Médio", `${metricas.resumo.progressoMedio || 0}%`],
        ],
        theme: "grid",
        headStyles: { fillColor: [62, 224, 207], textColor: [0, 0, 0], fontStyle: "bold" },
        styles: { fontSize: 9 },
        margin: { left: 14, right: 14 },
      });

      y = (doc as any).lastAutoTable.finalY + 12;

      if (stats) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("Visão Geral da Plataforma", 14, y);
        y += 8;

        autoTable(doc, {
          startY: y,
          head: [["Total Cursos", "Publicados", "Matrículas", "Taxa Conclusão"]],
          body: [[String(stats.totalCursos), String(stats.cursosPublicados), String(stats.totalMatriculas), `${stats.taxaConclusao}%`]],
          theme: "grid",
          headStyles: { fillColor: [62, 224, 207], textColor: [0, 0, 0], fontStyle: "bold" },
          styles: { fontSize: 9 },
          margin: { left: 14, right: 14 },
        });

        y = (doc as any).lastAutoTable.finalY + 12;
      }

      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Detalhamento por Funcionário", 14, y);
      y += 8;

      autoTable(doc, {
        startY: y,
        head: [["Funcionário", "Departamento", "Curso", "Progresso", "Status"]],
        body: metricas.funcionariosMatriculados.map((f) => [
          f.nome,
          f.departamento,
          f.curso,
          `${f.progresso}%`,
          f.concluido ? "Concluído" : f.status === "em_andamento" ? "Em Andamento" : "Não Iniciado",
        ]),
        theme: "grid",
        headStyles: { fillColor: [62, 224, 207], textColor: [0, 0, 0], fontStyle: "bold" },
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 35 }, 2: { cellWidth: 45 } },
        margin: { left: 14, right: 14 },
      });

      doc.save(`relatorio-cursos-${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] flex flex-col p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
            Relatórios de Cursos
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Métricas completas de conclusão total (100%) - somente nesta aba
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 py-2">
          <Select value={selectedCurso} onValueChange={setSelectedCurso}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todos os cursos" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="all">Todos os cursos</SelectItem>
              {cursos?.map((curso) => (
                <SelectItem key={curso.id} value={curso.id}>
                  {curso.titulo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            onClick={exportarCSV}
            disabled={isExporting || !metricas?.funcionariosMatriculados?.length}
            className="w-full sm:w-auto"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Exportar CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportarPDF}
            disabled={isExportingPDF || !metricas?.funcionariosMatriculados?.length}
            className="w-full sm:w-auto"
          >
            {isExportingPDF ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileText className="h-4 w-4 mr-2" />
            )}
            Baixar PDF
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          <Tabs defaultValue="resumo" className="space-y-3">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="resumo" className="text-xs sm:text-sm py-1.5 px-2">Resumo Geral</TabsTrigger>
              <TabsTrigger value="departamentos" className="text-xs sm:text-sm py-1.5 px-2">Por Departamento</TabsTrigger>
              <TabsTrigger value="detalhado" className="text-xs sm:text-sm py-1.5 px-2">Detalhado</TabsTrigger>
            </TabsList>

            {/* Aba Resumo */}
            <TabsContent value="resumo" className="space-y-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Métricas Principais */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                    <Card>
                      <CardContent className="p-2 sm:p-3 text-center">
                        <Users className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-blue-600 mb-1" />
                        <p className="text-lg sm:text-xl font-bold">{metricas?.resumo.total || 0}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Matriculados</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50/50">
                      <CardContent className="p-2 sm:p-3 text-center">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-green-600 mb-1" />
                        <p className="text-lg sm:text-xl font-bold text-green-700">
                          {metricas?.resumo.concluidos || 0}
                        </p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Concluídos (100%)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 sm:p-3 text-center">
                        <Clock className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-amber-600 mb-1" />
                        <p className="text-lg sm:text-xl font-bold">{metricas?.resumo.emAndamento || 0}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Em Andamento</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-2 sm:p-3 text-center">
                        <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-purple-600 mb-1" />
                        <p className="text-lg sm:text-xl font-bold">{metricas?.resumo.taxaConclusao || 0}%</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Taxa Conclusão</p>
                      </CardContent>
                    </Card>
                    <Card className="col-span-2 sm:col-span-1">
                      <CardContent className="p-2 sm:p-3 text-center">
                        <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 mx-auto text-indigo-600 mb-1" />
                        <p className="text-lg sm:text-xl font-bold">{metricas?.resumo.progressoMedio || 0}%</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">Progresso Médio</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Visão Geral da Plataforma */}
                  {stats && (
                    <Card>
                      <CardHeader className="py-2 px-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                          Visão Geral da Plataforma
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-3 pb-3">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-xs sm:text-sm">
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground text-[10px] sm:text-xs">Total de Cursos</p>
                            <p className="text-base sm:text-lg font-bold">{stats.totalCursos}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground text-[10px] sm:text-xs">Cursos Publicados</p>
                            <p className="text-base sm:text-lg font-bold">{stats.cursosPublicados}</p>
                          </div>
                          <div className="p-2 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground text-[10px] sm:text-xs">Total Matrículas</p>
                            <p className="text-base sm:text-lg font-bold">{stats.totalMatriculas}</p>
                          </div>
                          <div className="p-2 bg-green-100 rounded-lg">
                            <p className="text-muted-foreground text-[10px] sm:text-xs">Taxa Geral Conclusão</p>
                            <p className="text-base sm:text-lg font-bold text-green-700">{stats.taxaConclusao}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lista de Funcionários Concluídos */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <UserCheck className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                        Funcionários que Concluíram (100%)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      {metricas?.funcionariosConcluidos && metricas.funcionariosConcluidos.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {metricas.funcionariosConcluidos.map((f, idx) => (
                            <div
                              key={`${f.id}-${idx}`}
                              className="flex items-center justify-between p-1.5 sm:p-2 bg-green-50 rounded-lg border border-green-200"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-green-800 text-xs sm:text-sm truncate">{f.nome}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                  {f.departamento} • {f.cargo}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0 ml-2">
                                <Badge className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-1.5 py-0.5">
                                  <CheckCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5" />
                                  100%
                                </Badge>
                                {f.dataConclusao && (
                                  <p className="text-[10px] text-muted-foreground mt-0.5">
                                    {format(new Date(f.dataConclusao), "dd/MM/yyyy", { locale: ptBR })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-3 text-xs sm:text-sm">
                          Nenhum funcionário concluiu 100% ainda
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Lista de Funcionários Matriculados */}
                  <Card>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                        Todos os Matriculados ({metricas?.resumo.total || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      {metricas?.funcionariosMatriculados && metricas.funcionariosMatriculados.length > 0 ? (
                        <div className="space-y-1.5 max-h-36 overflow-y-auto">
                          {metricas.funcionariosMatriculados.map((f, idx) => (
                            <div
                              key={`${f.id}-${idx}`}
                              className="flex items-center justify-between p-1.5 sm:p-2 bg-muted/50 rounded-lg"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-xs sm:text-sm truncate">{f.nome}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                                  {f.departamento} • {f.curso}
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 ml-2">
                                <div className="w-12 sm:w-16">
                                  <Progress value={f.progresso} className="h-1.5 sm:h-2" />
                                  <p className="text-[10px] sm:text-xs text-center mt-0.5">{f.progresso}%</p>
                                </div>
                                {f.concluido ? (
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-3 text-xs sm:text-sm">
                          Nenhuma matrícula encontrada
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Aba Por Departamento */}
            <TabsContent value="departamentos" className="space-y-2">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : metricas?.departamentos && metricas.departamentos.length > 0 ? (
                metricas.departamentos.map((dept) => (
                  <Card key={dept.nome}>
                    <CardHeader className="py-2 px-3">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <CardTitle className="text-sm flex items-center gap-1.5">
                          <Building2 className="h-3 w-3 sm:h-4 sm:w-4" />
                          {dept.nome}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] sm:text-xs">{dept.total} matriculados</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3 pb-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-xs mb-2">
                        <div className="text-center p-1.5 sm:p-2 bg-green-50 rounded">
                          <p className="text-sm sm:text-base font-bold text-green-700">{dept.concluidos}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Concluídos</p>
                        </div>
                        <div className="text-center p-1.5 sm:p-2 bg-amber-50 rounded">
                          <p className="text-sm sm:text-base font-bold text-amber-700">{dept.emAndamento}</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Em Andamento</p>
                        </div>
                        <div className="text-center p-1.5 sm:p-2 bg-purple-50 rounded">
                          <p className="text-sm sm:text-base font-bold text-purple-700">{dept.taxaConclusao}%</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Taxa Conclusão</p>
                        </div>
                        <div className="text-center p-1.5 sm:p-2 bg-blue-50 rounded">
                          <p className="text-sm sm:text-base font-bold text-blue-700">{dept.progressoMedio}%</p>
                          <p className="text-[10px] sm:text-xs text-muted-foreground">Progresso Médio</p>
                        </div>
                      </div>
                      
                      <Progress value={dept.taxaConclusao} className="h-1.5 sm:h-2 mb-2" />
                      
                      {/* Lista de funcionários do departamento */}
                      <div className="space-y-0.5 max-h-24 overflow-y-auto">
                        {dept.funcionarios.map((f, idx) => (
                          <div
                            key={`${f.id}-${idx}`}
                            className="flex items-center justify-between text-xs py-0.5 px-1.5 rounded hover:bg-muted/50"
                          >
                            <span className="flex items-center gap-1 truncate">
                              {f.concluido ? (
                                <CheckCircle className="h-2.5 w-2.5 text-green-600 flex-shrink-0" />
                              ) : (
                                <Clock className="h-2.5 w-2.5 text-amber-600 flex-shrink-0" />
                              )}
                              <span className="truncate">{f.nome}</span>
                            </span>
                            <span className={`flex-shrink-0 ml-2 ${f.concluido ? "text-green-600 font-medium" : "text-muted-foreground"}`}>
                              {f.progresso}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-6 text-xs sm:text-sm">
                  Nenhum dado disponível
                </p>
              )}
            </TabsContent>

            {/* Aba Detalhado */}
            <TabsContent value="detalhado">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : metricas?.funcionariosMatriculados && metricas.funcionariosMatriculados.length > 0 ? (
                <div className="border rounded-lg overflow-hidden overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm min-w-[500px]">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-2 sm:p-3">Funcionário</th>
                        <th className="text-left p-2 sm:p-3 hidden sm:table-cell">Departamento</th>
                        <th className="text-left p-2 sm:p-3">Curso</th>
                        <th className="text-center p-2 sm:p-3">Progresso</th>
                        <th className="text-center p-2 sm:p-3">Status</th>
                        <th className="text-center p-2 sm:p-3">100%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas.funcionariosMatriculados.map((f, idx) => (
                        <tr key={`${f.id}-${idx}`} className="border-t hover:bg-muted/50">
                          <td className="p-2 sm:p-3">
                            <p className="font-medium text-xs sm:text-sm truncate max-w-[100px] sm:max-w-none">{f.nome}</p>
                            <p className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-[100px] sm:max-w-none">{f.email}</p>
                          </td>
                          <td className="p-2 sm:p-3 text-muted-foreground hidden sm:table-cell">{f.departamento}</td>
                          <td className="p-2 sm:p-3 text-xs truncate max-w-[80px] sm:max-w-none">{f.curso}</td>
                          <td className="p-2 sm:p-3">
                            <div className="w-14 sm:w-20 mx-auto">
                              <Progress value={f.progresso} className="h-1.5 sm:h-2" />
                              <p className="text-[10px] sm:text-xs text-center mt-0.5">{f.progresso}%</p>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-center">
                            <Badge
                              className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 ${
                                f.concluido
                                  ? "bg-green-100 text-green-700"
                                  : f.status === "em_andamento"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {f.concluido
                                ? "Concluído"
                                : f.status === "em_andamento"
                                ? "Em Andamento"
                                : "Não Iniciado"}
                            </Badge>
                          </td>
                          <td className="p-2 sm:p-3 text-center">
                            {f.concluido ? (
                              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-6 text-xs sm:text-sm">
                  Nenhuma matrícula encontrada
                </p>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};
