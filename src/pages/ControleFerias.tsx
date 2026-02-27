import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
// Realtime disabled to avoid LockManager hang
// import { useFeriasRealtime } from "@/hooks/useRealtimeUpdates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Download, FileText } from "lucide-react";
import { MetricasFerias } from "@/components/ferias/MetricasFerias";
import { FiltrosFerias } from "@/components/ferias/FiltrosFerias";
import { TabelaFerias } from "@/components/ferias/TabelaFerias";
import { CardControleFeriasCLT } from "@/components/ferias/CardControleFeriasCLT";
import { useSolicitacoesFerias } from "@/hooks/useFerias";
import { Skeleton } from "@/components/ui/skeleton";

const ControleFerias = () => {
  // useFeriasRealtime(); // Disabled - causes LockManager hang
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [departamentoFilter, setDepartamentoFilter] = useState("todos");
  const [apenasNovas, setApenasNovas] = useState(false);

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

  const handleExportar = (formato: "pdf" | "excel") => {
    // TODO: Implementar exportação
    console.log("Exportar para", formato);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <BackButton to="/gestao-rh" variant="default" />
          
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

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleExportar("pdf")}>
                <FileText className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button variant="outline" onClick={() => handleExportar("excel")}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
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
        </div>
      </div>
    </div>
  );
};

export default ControleFerias;
