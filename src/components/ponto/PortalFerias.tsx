import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, AlertTriangle, Info } from "lucide-react";
import { usePortalAuth } from "./PortalAuthProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { format, differenceInDays, parseISO, isBefore, addYears } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SolicitarFeriasDialog } from "./SolicitarFeriasDialog";
import { PortalBackground } from "./PortalBackground";
import { toast } from "@/hooks/use-toast";
import { playNotificationSound } from "@/utils/notificationSound";

interface PortalFeriasProps {
  onBack: () => void;
}

export const PortalFerias = ({ onBack }: PortalFeriasProps) => {
  const { user, profile } = usePortalAuth();
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
      try {
        const userId = user?.id;
        if (!userId) return [];

        const { data, error } = await supabase
          .from("periodos_aquisitivos")
          .select("*")
          .eq("user_id", userId)
          .order("data_inicio", { ascending: false });

        if (error) {
          console.error("Erro ao buscar períodos aquisitivos:", error);
          return [];
        }
        return data || [];
      } catch (e) {
        console.error("Erro inesperado em períodos aquisitivos:", e);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 1000 * 30,
  });

  const { data: solicitacoes, isLoading: loadingSolicitacoes } = useQuery({
    queryKey: ["solicitacoes-ferias-portal", user?.id],
    queryFn: async () => {
      try {
        const userId = user?.id;
        if (!userId) return [];

        const { data, error } = await supabase
          .from("solicitacoes_ferias")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Erro ao buscar solicitações de férias:", error);
          return [];
        }
        return data || [];
      } catch (e) {
        console.error("Erro inesperado em solicitações de férias:", e);
        return [];
      }
    },
    enabled: !!user?.id,
    retry: 2,
    staleTime: 1000 * 30,
  });

  // Calcular dados baseado na data de admissão e períodos aquisitivos (CLT)
  const feriasInfo = useMemo(() => {
    const hoje = new Date();
    const profileData = profile as any;
    const dataAdmissao = profileData?.data_admissao
      ? parseISO(profileData.data_admissao)
      : profileData?.created_at
        ? new Date(profileData.created_at)
        : null;

    if (!periodos || periodos.length === 0 || !dataAdmissao) {
      return {
        saldoDisponivel: 0,
        diasUsadosTotal: 0,
        periodoAtualCompleto: false,
        periodoAtual: null,
        proximoPeriodoData: dataAdmissao ? addYears(dataAdmissao, 1) : null,
        diasRestantesAquisicao: dataAdmissao
          ? Math.max(0, differenceInDays(addYears(dataAdmissao, 1), hoje))
          : null,
        periodosCompletosComSaldo: [],
        periodosEmAquisicao: [],
      };
    }

    // Separar períodos completos (12 meses passaram) e em aquisição
    const periodosCompletos = periodos.filter((p) => {
      const fimPeriodo = parseISO(p.data_fim);
      return isBefore(fimPeriodo, hoje);
    });

    const periodosEmAquisicao = periodos.filter((p) => {
      const fimPeriodo = parseISO(p.data_fim);
      return !isBefore(fimPeriodo, hoje);
    });

    // Saldo disponível = soma dos dias disponíveis de períodos COMPLETOS
    const saldoDisponivel = periodosCompletos.reduce(
      (acc, p) => acc + (p.dias_disponiveis ?? (p.dias_direito - p.dias_usados)),
      0
    );

    // Dias usados total (todos os períodos)
    const diasUsadosTotal = periodos.reduce((acc, p) => acc + (p.dias_usados || 0), 0);

    // Período em aquisição atual (mais recente)
    const periodoEmAquisicaoAtual = periodosEmAquisicao[0];

    // Calcular próximo período com base na data de admissão
    let proximoPeriodoData: Date | null = null;
    if (periodoEmAquisicaoAtual) {
      proximoPeriodoData = parseISO(periodoEmAquisicaoAtual.data_fim);
    }

    // Dias restantes para completar período aquisitivo atual
    const diasRestantesAquisicao = periodoEmAquisicaoAtual
      ? Math.max(0, differenceInDays(parseISO(periodoEmAquisicaoAtual.data_fim), hoje))
      : null;

    const periodoAtualCompleto = periodosCompletos.length > 0;

    return {
      saldoDisponivel: Math.max(0, saldoDisponivel),
      diasUsadosTotal,
      periodoAtualCompleto,
      periodoAtual: periodosCompletos[0] || periodoEmAquisicaoAtual,
      proximoPeriodoData,
      diasRestantesAquisicao,
      periodosCompletosComSaldo: periodosCompletos.filter(
        (p) => (p.dias_disponiveis ?? (p.dias_direito - p.dias_usados)) > 0
      ),
      periodosEmAquisicao,
    };
  }, [periodos, profile]);

  const proximaSolicitacaoAprovada = solicitacoes?.find(
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
                  {/* Cards de resumo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                        <p className="text-2xl font-bold text-primary">
                          {feriasInfo.saldoDisponivel} dias
                        </p>
                        {!feriasInfo.periodoAtualCompleto && feriasInfo.periodosEmAquisicao.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Período aquisitivo em andamento
                          </p>
                        )}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Dias Usados</p>
                        <p className="text-2xl font-bold">
                          {feriasInfo.diasUsadosTotal} dias
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="text-sm text-muted-foreground">Próximo Período</p>
                        <p className="text-2xl font-bold">
                          {proximaSolicitacaoAprovada
                            ? format(new Date(proximaSolicitacaoAprovada.data_inicio), "dd/MM/yyyy", { locale: ptBR })
                            : feriasInfo.proximoPeriodoData
                              ? format(feriasInfo.proximoPeriodoData, "dd/MM/yyyy", { locale: ptBR })
                              : "-"}
                        </p>
                        {!proximaSolicitacaoAprovada && feriasInfo.diasRestantesAquisicao !== null && feriasInfo.diasRestantesAquisicao > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Faltam {feriasInfo.diasRestantesAquisicao} dias
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Info sobre data de admissão e período aquisitivo */}
                  {(profile as any)?.data_admissao && (
                    <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-start gap-2">
                        <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-muted-foreground">
                          <p>
                            <strong>Data de admissão:</strong>{" "}
                            {format(parseISO((profile as any).data_admissao), "dd/MM/yyyy", { locale: ptBR })}
                          </p>
                          <p className="mt-0.5">
                            Conforme Art. 130 da CLT, o direito a férias é adquirido após completar 12 meses de trabalho (período aquisitivo).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Aviso se não houver período aquisitivo completo */}
                  {!feriasInfo.periodoAtualCompleto && feriasInfo.periodosEmAquisicao.length > 0 && (
                    <div className="mb-4 p-4 rounded-lg border-2 border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/40">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                           <p className="font-semibold text-amber-900 dark:text-amber-200">Período aquisitivo em andamento</p>
                           <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                            Seu período aquisitivo atual ainda não foi completado.
                            {feriasInfo.diasRestantesAquisicao !== null && (
                              <>
                                {" "}Faltam <strong>{feriasInfo.diasRestantesAquisicao} dias</strong> para completar
                                ({format(parseISO(feriasInfo.periodosEmAquisicao[0].data_inicio), "dd/MM/yyyy", { locale: ptBR })} a{" "}
                                {format(parseISO(feriasInfo.periodosEmAquisicao[0].data_fim), "dd/MM/yyyy", { locale: ptBR })}).
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <SolicitarFeriasDialog periodos={periodos || []} />

                  {/* Solicitações Pendentes - destaque */}
                  {solicitacoes && solicitacoes.filter(s => s.status === "pendente").length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3 text-amber-700 dark:text-amber-300">⏳ Aguardando Análise do RH</h3>
                      <div className="space-y-3">
                        {solicitacoes.filter(s => s.status === "pendente").map((sol) => (
                          <Card key={sol.id} className="border-2 border-amber-300 dark:border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 shadow-md animate-in fade-in">
                            <CardContent className="pt-4 pb-4">
                              <div className="flex justify-between items-center">
                                <div>
                                   <p className="font-semibold text-amber-900 dark:text-amber-200">
                                     {format(new Date(sol.data_inicio), "dd/MM/yyyy", { locale: ptBR })} - {format(new Date(sol.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                                   </p>
                                   <p className="text-sm text-amber-700 dark:text-amber-300">
                                     {sol.dias_solicitados} dias • {sol.tipo === "ferias" ? "Férias" : sol.tipo === "ferias_coletivas" ? "Férias Coletivas" : "Abono Pecuniário"}
                                   </p>
                                  {sol.observacao && (
                                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">"{sol.observacao}"</p>
                                  )}
                                </div>
                                <span className="text-xs font-bold px-3 py-1.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 border border-amber-300 dark:border-amber-600">
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
                            sol.status === "aprovado" ? "border-green-300 dark:border-green-700 bg-green-50/60 dark:bg-green-950/40" :
                            sol.status === "reprovado" ? "border-red-300 dark:border-red-700 bg-red-50/60 dark:bg-red-950/40" :
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
                                    <p className="text-xs text-red-600 dark:text-red-400 mt-1">Motivo: {sol.motivo_reprovacao}</p>
                                  )}
                                </div>
                                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${
                                  sol.status === "aprovado" ? "bg-green-200 dark:bg-green-800 text-green-900 dark:text-green-100" :
                                  sol.status === "reprovado" ? "bg-red-200 dark:bg-red-800 text-red-900 dark:text-red-100" :
                                  sol.status === "concluido" ? "bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100" :
                                  sol.status === "cancelado" ? "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100" :
                                  "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
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