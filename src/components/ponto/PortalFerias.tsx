import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { usePortalAuth } from "./PortalAuthProvider";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SolicitarFeriasDialog } from "./SolicitarFeriasDialog";

interface PortalFeriasProps {
  onBack: () => void;
}

export const PortalFerias = ({ onBack }: PortalFeriasProps) => {
  const { user } = usePortalAuth();

  const { data: periodos, isLoading } = useQuery({
    queryKey: ["periodos-aquisitivos-portal", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("periodos_aquisitivos")
        .select("*")
        .eq("user_id", user.id)
        .order("data_inicio", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: solicitacoes, isLoading: loadingSolicitacoes } = useQuery({
    queryKey: ["solicitacoes-ferias-portal", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("solicitacoes_ferias")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const periodoAtual = periodos?.[0];
  const proximaSolicitacao = solicitacoes?.find(
    (s) => s.status === "aprovado" || s.status === "em_andamento"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50">
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Férias e Licenças</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Solicite férias e acompanhe seu saldo
              </p>
              {isLoading || loadingSolicitacoes ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                        <p className="text-2xl font-bold text-primary">
                          {periodoAtual?.dias_disponiveis || 0} dias
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Dias Usados</p>
                        <p className="text-2xl font-bold">
                          {periodoAtual?.dias_usados || 0} dias
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Próximo Período</p>
                        <p className="text-2xl font-bold">
                          {proximaSolicitacao
                            ? format(new Date(proximaSolicitacao.data_inicio), "dd/MM/yyyy", { locale: ptBR })
                            : "-"}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {periodos && periodos.length > 0 && (
                    <SolicitarFeriasDialog periodos={periodos} />
                  )}
                  
                  {solicitacoes && solicitacoes.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Minhas Solicitações</h3>
                      <div className="space-y-2">
                        {solicitacoes.map((sol) => (
                          <div key={sol.id} className="p-3 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  {format(new Date(sol.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(sol.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {sol.dias_solicitados} dias
                                </p>
                              </div>
                              <span className={`text-xs px-2 py-1 rounded ${
                                sol.status === "aprovado" ? "bg-green-100 text-green-800" :
                                sol.status === "pendente" ? "bg-yellow-100 text-yellow-800" :
                                sol.status === "reprovado" ? "bg-red-100 text-red-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>
                                {sol.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
