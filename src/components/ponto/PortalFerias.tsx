import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";
import { usePortalAuth } from "./PortalAuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SolicitarFeriasDialog } from "./SolicitarFeriasDialog";
import { PortalBackground } from "./PortalBackground";
import { toast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/utils/notificationSound";

interface PortalFeriasProps {
  onBack: () => void;
}

export const PortalFerias = ({ onBack }: PortalFeriasProps) => {
  const { user } = usePortalAuth();
  const queryClient = useQueryClient();

  // Realtime: escuta mudanças na solicitação de férias do funcionário
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`portal-ferias:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'solicitacoes_ferias',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = (payload.new as any)?.status;
          if (newStatus === 'aprovado') {
            playNotificationSound("success");
            toast({ title: "Férias aprovadas!", description: "Sua solicitação de férias foi aprovada." });
          } else if (newStatus === 'reprovado') {
            playNotificationSound("warning");
            toast({ title: "Férias reprovadas", description: "Sua solicitação de férias foi reprovada.", variant: "destructive" });
          } else if (newStatus === 'concluido' || newStatus === 'cancelado') {
            playNotificationSound("info");
            toast({ title: "Solicitação atualizada", description: `Sua solicitação foi marcada como ${newStatus}.` });
          }
          queryClient.invalidateQueries({ queryKey: ["solicitacoes-ferias-portal", user.id] });
          queryClient.invalidateQueries({ queryKey: ["periodos-aquisitivos-portal", user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'periodos_aquisitivos',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["periodos-aquisitivos-portal", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

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
    <PortalBackground>
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
                  
                  <SolicitarFeriasDialog periodos={periodos || []} />

                  {/* Solicitações Pendentes - destaque */}
                  {solicitacoes && solicitacoes.filter(s => s.status === "pendente").length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3 text-amber-700">⏳ Aguardando Análise do RH</h3>
                      <div className="space-y-3">
                        {solicitacoes.filter(s => s.status === "pendente").map((sol) => (
                          <Card key={sol.id} className="border-2 border-amber-300 bg-amber-50/80 shadow-md animate-in fade-in">
                            <CardContent className="pt-4 pb-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-semibold text-amber-900">
                                    {format(new Date(sol.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(sol.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                                  </p>
                                  <p className="text-sm text-amber-700">
                                    {sol.dias_solicitados} dias • {sol.tipo === "ferias" ? "Férias" : sol.tipo === "ferias_coletivas" ? "Férias Coletivas" : "Abono Pecuniário"}
                                  </p>
                                  {sol.observacao && (
                                    <p className="text-xs text-amber-600 mt-1 italic">"{sol.observacao}"</p>
                                  )}
                                </div>
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                                  Pendente
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Solicitações processadas */}
                  {solicitacoes && solicitacoes.filter(s => s.status !== "pendente").length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Histórico de Solicitações</h3>
                      <div className="space-y-2">
                        {solicitacoes.filter(s => s.status !== "pendente").map((sol) => (
                          <Card key={sol.id} className={`border ${
                            sol.status === "aprovado" ? "border-green-300 bg-green-50/60" :
                            sol.status === "reprovado" ? "border-red-300 bg-red-50/60" :
                            "border-border"
                          }`}>
                            <CardContent className="pt-4 pb-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="font-medium">
                                    {format(new Date(sol.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(sol.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {sol.dias_solicitados} dias
                                  </p>
                                  {sol.motivo_reprovacao && (
                                    <p className="text-xs text-red-600 mt-1">Motivo: {sol.motivo_reprovacao}</p>
                                  )}
                                </div>
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                                  sol.status === "aprovado" ? "bg-green-200 text-green-900" :
                                  sol.status === "reprovado" ? "bg-red-200 text-red-900" :
                                  sol.status === "concluido" ? "bg-blue-200 text-blue-900" :
                                  sol.status === "cancelado" ? "bg-gray-200 text-gray-900" :
                                  "bg-gray-100 text-gray-800"
                                }`}>
                                  {sol.status === "aprovado" ? "✅ Aprovado" :
                                   sol.status === "reprovado" ? "❌ Reprovado" :
                                   sol.status === "concluido" ? "✔ Concluído" :
                                   sol.status === "cancelado" ? "Cancelado" :
                                   sol.status}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
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
    </PortalBackground>
  );
};
