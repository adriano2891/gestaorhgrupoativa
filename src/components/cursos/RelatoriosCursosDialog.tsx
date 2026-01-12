import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
} from "lucide-react";
import { useMatriculas, useCursos, useCursosStats } from "@/hooks/useCursos";
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
  const { data: matriculas, isLoading } = useMatriculas(
    selectedCurso !== "all" ? selectedCurso : undefined
  );
  const { data: stats } = useCursosStats();

  // Calcular métricas
  const calcularMetricas = () => {
    if (!matriculas)
      return {
        total: 0,
        concluidos: 0,
        emAndamento: 0,
        taxaConclusao: 0,
        progressoMedio: 0,
      };

    const total = matriculas.length;
    const concluidos = matriculas.filter((m) => m.status === "concluido").length;
    const emAndamento = matriculas.filter((m) => m.status === "em_andamento").length;
    const taxaConclusao = total > 0 ? Math.round((concluidos / total) * 100) : 0;
    const progressoMedio =
      total > 0
        ? Math.round(
            matriculas.reduce((acc, m) => acc + Number(m.progresso || 0), 0) / total
          )
        : 0;

    return { total, concluidos, emAndamento, taxaConclusao, progressoMedio };
  };

  const metricas = calcularMetricas();

  // Agrupar por departamento
  const agruparPorDepartamento = () => {
    if (!matriculas) return [];

    const grupos: Record<
      string,
      { total: number; concluidos: number; progresso: number }
    > = {};

    matriculas.forEach((m) => {
      const dept = m.profile?.departamento || "Sem departamento";
      if (!grupos[dept]) {
        grupos[dept] = { total: 0, concluidos: 0, progresso: 0 };
      }
      grupos[dept].total++;
      if (m.status === "concluido") grupos[dept].concluidos++;
      grupos[dept].progresso += Number(m.progresso || 0);
    });

    return Object.entries(grupos)
      .map(([nome, dados]) => ({
        nome,
        ...dados,
        progressoMedio: dados.total > 0 ? Math.round(dados.progresso / dados.total) : 0,
        taxaConclusao:
          dados.total > 0 ? Math.round((dados.concluidos / dados.total) * 100) : 0,
      }))
      .sort((a, b) => b.taxaConclusao - a.taxaConclusao);
  };

  const exportarCSV = async () => {
    if (!matriculas) return;

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
        "Data Início",
        "Data Conclusão",
      ];

      const rows = matriculas.map((m) => [
        m.profile?.nome || "",
        m.profile?.email || "",
        m.profile?.departamento || "",
        m.profile?.cargo || "",
        m.curso?.titulo || "",
        String(m.progresso || 0),
        m.status === "concluido"
          ? "Concluído"
          : m.status === "em_andamento"
          ? "Em Andamento"
          : m.status,
        m.data_inicio ? format(new Date(m.data_inicio), "dd/MM/yyyy") : "",
        m.data_conclusao ? format(new Date(m.data_conclusao), "dd/MM/yyyy") : "",
      ]);

      const csvContent = [headers.join(";"), ...rows.map((r) => r.join(";"))].join(
        "\n"
      );

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

  const departamentos = agruparPorDepartamento();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Relatórios de Cursos
          </DialogTitle>
          <DialogDescription>
            Acompanhe métricas e exporte relatórios de progresso
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
            disabled={isExporting || !matriculas?.length}
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
            <TabsList>
              <TabsTrigger value="resumo">Resumo</TabsTrigger>
              <TabsTrigger value="departamentos">Por Departamento</TabsTrigger>
              <TabsTrigger value="detalhado">Detalhado</TabsTrigger>
            </TabsList>

            <TabsContent value="resumo" className="space-y-4">
              {/* Métricas Gerais */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                    <p className="text-2xl font-bold">{metricas.total}</p>
                    <p className="text-xs text-muted-foreground">Matriculados</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Award className="h-6 w-6 mx-auto text-green-600 mb-2" />
                    <p className="text-2xl font-bold">{metricas.concluidos}</p>
                    <p className="text-xs text-muted-foreground">Concluídos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Clock className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                    <p className="text-2xl font-bold">{metricas.emAndamento}</p>
                    <p className="text-xs text-muted-foreground">Em Andamento</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                    <p className="text-2xl font-bold">{metricas.taxaConclusao}%</p>
                    <p className="text-xs text-muted-foreground">Taxa Conclusão</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <BookOpen className="h-6 w-6 mx-auto text-amber-600 mb-2" />
                    <p className="text-2xl font-bold">{metricas.progressoMedio}%</p>
                    <p className="text-xs text-muted-foreground">Progresso Médio</p>
                  </CardContent>
                </Card>
              </div>

              {/* Estatísticas Gerais */}
              {stats && (
                <Card>
                  <CardContent className="p-4">
                    <h4 className="font-medium mb-3">Visão Geral da Plataforma</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Total de Cursos</p>
                        <p className="text-lg font-bold">{stats.totalCursos}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cursos Publicados</p>
                        <p className="text-lg font-bold">{stats.cursosPublicados}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Matrículas</p>
                        <p className="text-lg font-bold">{stats.totalMatriculas}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Taxa Geral Conclusão</p>
                        <p className="text-lg font-bold">{stats.taxaConclusao}%</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="departamentos" className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : departamentos.length > 0 ? (
                departamentos.map((dept) => (
                  <Card key={dept.nome}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{dept.nome}</h4>
                        <Badge variant="outline">{dept.total} matriculados</Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
                        <div>
                          <p className="text-muted-foreground">Concluídos</p>
                          <p className="font-medium text-green-600">{dept.concluidos}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Taxa Conclusão</p>
                          <p className="font-medium">{dept.taxaConclusao}%</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Progresso Médio</p>
                          <p className="font-medium">{dept.progressoMedio}%</p>
                        </div>
                      </div>
                      <Progress value={dept.taxaConclusao} className="h-2" />
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum dado disponível
                </p>
              )}
            </TabsContent>

            <TabsContent value="detalhado">
              {isLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : matriculas && matriculas.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3">Funcionário</th>
                        <th className="text-left p-3">Curso</th>
                        <th className="text-center p-3">Progresso</th>
                        <th className="text-center p-3">Status</th>
                        <th className="text-center p-3">Conclusão</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matriculas.slice(0, 50).map((m) => (
                        <tr key={m.id} className="border-t">
                          <td className="p-3">
                            <p className="font-medium">{m.profile?.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {m.profile?.departamento}
                            </p>
                          </td>
                          <td className="p-3">{m.curso?.titulo}</td>
                          <td className="p-3">
                            <div className="w-20 mx-auto">
                              <Progress
                                value={Number(m.progresso)}
                                className="h-2"
                              />
                              <p className="text-xs text-center mt-1">
                                {m.progresso}%
                              </p>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <Badge
                              className={
                                m.status === "concluido"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-blue-100 text-blue-700"
                              }
                            >
                              {m.status === "concluido"
                                ? "Concluído"
                                : "Em Andamento"}
                            </Badge>
                          </td>
                          <td className="p-3 text-center text-muted-foreground">
                            {m.data_conclusao
                              ? format(new Date(m.data_conclusao), "dd/MM/yy")
                              : "-"}
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
