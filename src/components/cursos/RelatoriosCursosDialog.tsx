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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios de Cursos
          </DialogTitle>
          <DialogDescription>
            Métricas completas de conclusão total (100%) - somente nesta aba
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2">
          <Select value={selectedCurso} onValueChange={setSelectedCurso}>
            <SelectTrigger className="w-[250px]">
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
            onClick={exportarCSV}
            disabled={isExporting || !metricas?.funcionariosMatriculados?.length}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Exportar CSV
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <Tabs defaultValue="resumo" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="resumo">Resumo Geral</TabsTrigger>
              <TabsTrigger value="departamentos">Por Departamento</TabsTrigger>
              <TabsTrigger value="detalhado">Detalhado</TabsTrigger>
            </TabsList>

            {/* Aba Resumo */}
            <TabsContent value="resumo" className="space-y-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Métricas Principais */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Users className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                        <p className="text-2xl font-bold">{metricas?.resumo.total || 0}</p>
                        <p className="text-xs text-muted-foreground">Matriculados</p>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50/50">
                      <CardContent className="p-4 text-center">
                        <CheckCircle className="h-6 w-6 mx-auto text-green-600 mb-2" />
                        <p className="text-2xl font-bold text-green-700">
                          {metricas?.resumo.concluidos || 0}
                        </p>
                        <p className="text-xs text-muted-foreground">Concluídos (100%)</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <Clock className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                        <p className="text-2xl font-bold">{metricas?.resumo.emAndamento || 0}</p>
                        <p className="text-xs text-muted-foreground">Em Andamento</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                        <p className="text-2xl font-bold">{metricas?.resumo.taxaConclusao || 0}%</p>
                        <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <BookOpen className="h-6 w-6 mx-auto text-indigo-600 mb-2" />
                        <p className="text-2xl font-bold">{metricas?.resumo.progressoMedio || 0}%</p>
                        <p className="text-xs text-muted-foreground">Progresso Médio</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Visão Geral da Plataforma */}
                  {stats && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Visão Geral da Plataforma
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">Total de Cursos</p>
                            <p className="text-xl font-bold">{stats.totalCursos}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">Cursos Publicados</p>
                            <p className="text-xl font-bold">{stats.cursosPublicados}</p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-muted-foreground">Total Matrículas</p>
                            <p className="text-xl font-bold">{stats.totalMatriculas}</p>
                          </div>
                          <div className="p-3 bg-green-100 rounded-lg">
                            <p className="text-muted-foreground">Taxa Geral Conclusão</p>
                            <p className="text-xl font-bold text-green-700">{stats.taxaConclusao}%</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Lista de Funcionários Concluídos */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-green-600" />
                        Funcionários que Concluíram (100%)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {metricas?.funcionariosConcluidos && metricas.funcionariosConcluidos.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {metricas.funcionariosConcluidos.map((f, idx) => (
                            <div
                              key={`${f.id}-${idx}`}
                              className="flex items-center justify-between p-2 bg-green-50 rounded-lg border border-green-200"
                            >
                              <div>
                                <p className="font-medium text-green-800">{f.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {f.departamento} • {f.cargo}
                                </p>
                              </div>
                              <div className="text-right">
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  100%
                                </Badge>
                                {f.dataConclusao && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {format(new Date(f.dataConclusao), "dd/MM/yyyy", { locale: ptBR })}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhum funcionário concluiu 100% ainda
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Lista de Funcionários Matriculados */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Todos os Matriculados ({metricas?.resumo.total || 0})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {metricas?.funcionariosMatriculados && metricas.funcionariosMatriculados.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {metricas.funcionariosMatriculados.map((f, idx) => (
                            <div
                              key={`${f.id}-${idx}`}
                              className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                            >
                              <div>
                                <p className="font-medium">{f.nome}</p>
                                <p className="text-xs text-muted-foreground">
                                  {f.departamento} • {f.curso}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-16">
                                  <Progress value={f.progresso} className="h-2" />
                                  <p className="text-xs text-center mt-0.5">{f.progresso}%</p>
                                </div>
                                {f.concluido ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Clock className="h-4 w-4 text-amber-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-4">
                          Nenhuma matrícula encontrada
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>

            {/* Aba Por Departamento */}
            <TabsContent value="departamentos" className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-32" />
                  ))}
                </div>
              ) : metricas?.departamentos && metricas.departamentos.length > 0 ? (
                metricas.departamentos.map((dept) => (
                  <Card key={dept.nome}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          {dept.nome}
                        </CardTitle>
                        <Badge variant="outline">{dept.total} matriculados</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                        <div className="text-center p-2 bg-green-50 rounded">
                          <p className="text-lg font-bold text-green-700">{dept.concluidos}</p>
                          <p className="text-xs text-muted-foreground">Concluídos</p>
                        </div>
                        <div className="text-center p-2 bg-amber-50 rounded">
                          <p className="text-lg font-bold text-amber-700">{dept.emAndamento}</p>
                          <p className="text-xs text-muted-foreground">Em Andamento</p>
                        </div>
                        <div className="text-center p-2 bg-purple-50 rounded">
                          <p className="text-lg font-bold text-purple-700">{dept.taxaConclusao}%</p>
                          <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
                        </div>
                        <div className="text-center p-2 bg-blue-50 rounded">
                          <p className="text-lg font-bold text-blue-700">{dept.progressoMedio}%</p>
                          <p className="text-xs text-muted-foreground">Progresso Médio</p>
                        </div>
                      </div>
                      
                      <Progress value={dept.taxaConclusao} className="h-2 mb-3" />
                      
                      {/* Lista de funcionários do departamento */}
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {dept.funcionarios.map((f, idx) => (
                          <div
                            key={`${f.id}-${idx}`}
                            className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50"
                          >
                            <span className="flex items-center gap-2">
                              {f.concluido ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : (
                                <Clock className="h-3 w-3 text-amber-600" />
                              )}
                              {f.nome}
                            </span>
                            <span className={f.concluido ? "text-green-600 font-medium" : "text-muted-foreground"}>
                              {f.progresso}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível
                </p>
              )}
            </TabsContent>

            {/* Aba Detalhado */}
            <TabsContent value="detalhado">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : metricas?.funcionariosMatriculados && metricas.funcionariosMatriculados.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Funcionário</th>
                        <th className="text-left p-3">Departamento</th>
                        <th className="text-left p-3">Curso</th>
                        <th className="text-center p-3">Progresso</th>
                        <th className="text-center p-3">Status</th>
                        <th className="text-center p-3">Concluído (100%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metricas.funcionariosMatriculados.map((f, idx) => (
                        <tr key={`${f.id}-${idx}`} className="border-t hover:bg-muted/50">
                          <td className="p-3">
                            <p className="font-medium">{f.nome}</p>
                            <p className="text-xs text-muted-foreground">{f.email}</p>
                          </td>
                          <td className="p-3 text-muted-foreground">{f.departamento}</td>
                          <td className="p-3">{f.curso}</td>
                          <td className="p-3">
                            <div className="w-20 mx-auto">
                              <Progress value={f.progresso} className="h-2" />
                              <p className="text-xs text-center mt-1">{f.progresso}%</p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              className={
                                f.concluido
                                  ? "bg-green-100 text-green-700"
                                  : f.status === "em_andamento"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-700"
                              }
                            >
                              {f.concluido
                                ? "Concluído"
                                : f.status === "em_andamento"
                                ? "Em Andamento"
                                : "Não Iniciado"}
                            </Badge>
                          </td>
                          <td className="p-3 text-center">
                            {f.concluido ? (
                              <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-gray-300 mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma matrícula encontrada
                </p>
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
