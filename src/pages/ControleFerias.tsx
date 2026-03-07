import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Download, FileText, ShieldCheck } from "lucide-react";
import { MetricasFerias } from "@/components/ferias/MetricasFerias";
import { FiltrosFerias } from "@/components/ferias/FiltrosFerias";
import { TabelaFerias } from "@/components/ferias/TabelaFerias";
import { CardControleFeriasCLT, useFuncionariosFerias } from "@/components/ferias/CardControleFeriasCLT";
import { useSolicitacoesFerias } from "@/hooks/useFerias";
import { Skeleton } from "@/components/ui/skeleton";
import { exportarFeriasPDF, exportarFeriasExcel } from "@/utils/feriasPdfExcel";
import { exportarRelatorioFeriasAuditoria } from "@/utils/feriasPdfAuditoria";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ControleFerias = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [departamentoFilter, setDepartamentoFilter] = useState("todos");
  const [apenasNovas, setApenasNovas] = useState(false);

  // Realtime: invalidate all vacation queries on relevant table changes
  useEffect(() => {
    const channel = supabase
      .channel("controle-ferias-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "solicitacoes_ferias" }, () => {
        queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
        queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "periodos_aquisitivos" }, () => {
        queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
        queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["funcionarios-ferias-clt"] });
        queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
        queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "user_roles" }, () => {
        queryClient.invalidateQueries({ queryKey: ["funcionarios-ferias-clt"] });
        queryClient.invalidateQueries({ queryKey: ["metricas-ferias"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const { data: funcionariosCLT } = useFuncionariosFerias();

  const { data: solicitacoes, isLoading } = useSolicitacoesFerias({
    status: statusFilter !== "todos" ? statusFilter : undefined,
    departamento: departamentoFilter !== "todos" ? departamentoFilter : undefined,
    apenasNovas,
  });

  const solicitacoesFiltradas = useMemo(() => {
    if (!solicitacoes) return [];

    return solicitacoes.filter((solicitacao) => {
      const nomeMatch = solicitacao.profiles?.nome
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return nomeMatch;
    });
  }, [solicitacoes, searchTerm]);

  const handleExportar = async (formato: "pdf" | "excel") => {
    if (!funcionariosCLT || funcionariosCLT.length === 0) {
      toast.error("Nenhum dado disponível para exportar.");
      return;
    }
    try {
      if (formato === "pdf") {
        exportarFeriasPDF(funcionariosCLT);
        toast.success("PDF exportado com sucesso!");
      } else {
        await exportarFeriasExcel(funcionariosCLT);
        toast.success("Excel exportado com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao exportar:", err);
      toast.error("Erro ao gerar o arquivo.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <BackButton to="/gestao-rh" variant="light" />
          
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-foreground flex items-center gap-3">
                <Calendar className="h-10 w-10 text-primary" />
                Controle de Férias
              </h1>
              <p className="text-muted-foreground mt-2">
                Gerencie solicitações e acompanhe o saldo de férias dos colaboradores
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => handleExportar("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => handleExportar("excel")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button variant="outline" onClick={() => {
                if (!solicitacoesFiltradas || solicitacoesFiltradas.length === 0) {
                  toast.error("Nenhuma solicitação para exportar.");
                  return;
                }
                const formatDate = (d: string) => {
                  const [y, m, day] = d.split('-');
                  return `${day}/${m}/${y}`;
                };
                exportarRelatorioFeriasAuditoria(
                  solicitacoesFiltradas.map(s => ({
                    funcionario: s.profiles?.nome || "-",
                    cargo: s.profiles?.cargo,
                    departamento: s.profiles?.departamento,
                    periodo: `${formatDate(s.data_inicio)} - ${formatDate(s.data_fim)}`,
                    dias: s.dias_solicitados,
                    tipo: s.tipo,
                    status: s.status,
                    data_solicitacao: formatDate(s.created_at.split('T')[0]),
                    data_aprovacao: s.data_aprovacao ? formatDate(s.data_aprovacao.split('T')[0]) : undefined,
                    observacao: s.observacao,
                  }))
                );
                toast.success("Relatório de auditoria exportado!");
              }}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Relatório Auditoria
              </Button>
            </div>
          </div>

          {/* Métricas */}
          <MetricasFerias />

          {/* Tabela */}
          <Card>
            <CardHeader>
              <CardTitle>Solicitações de Férias</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FiltrosFerias
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                departamentoFilter={departamentoFilter}
                setDepartamentoFilter={setDepartamentoFilter}
                apenasNovas={apenasNovas}
                setApenasNovas={setApenasNovas}
              />

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : (
                <TabelaFerias solicitacoes={solicitacoesFiltradas} />
              )}
            </CardContent>
          </Card>

          {/* Card CLT - Controle de Férias por Período Aquisitivo */}
          <CardControleFeriasCLT />
        </div>
      </div>
    </div>
  );
};

export default ControleFerias;
