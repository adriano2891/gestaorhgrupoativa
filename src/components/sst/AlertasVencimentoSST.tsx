import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Clock, CheckCircle, Bell } from "lucide-react";
import { useASOs, useEPIEntregas } from "@/hooks/useSST";
import { isPast, addDays, differenceInDays, format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

interface Alerta {
  id: string;
  tipo: "aso" | "epi";
  funcionario: string;
  descricao: string;
  vencimento: string;
  diasRestantes: number;
  severidade: "critico" | "urgente" | "atencao";
}

export const AlertasVencimentoSST = () => {
  const { data: asos, isLoading: loadingASO } = useASOs();
  const { data: epis, isLoading: loadingEPI } = useEPIEntregas();

  if (loadingASO || loadingEPI) return <Skeleton className="h-40 w-full" />;

  const alertas: Alerta[] = [];
  const hoje = new Date();

  // ASOs vencidos ou a vencer
  asos?.forEach((aso) => {
    if (!aso.data_vencimento) return;
    const venc = new Date(aso.data_vencimento);
    const dias = differenceInDays(venc, hoje);
    if (dias <= 60) {
      alertas.push({
        id: aso.id,
        tipo: "aso",
        funcionario: aso._nome || "—",
        descricao: `ASO ${aso.tipo === "periodico" ? "Periódico" : aso.tipo === "admissional" ? "Admissional" : aso.tipo} — ${aso.resultado}`,
        vencimento: aso.data_vencimento,
        diasRestantes: dias,
        severidade: dias < 0 ? "critico" : dias <= 15 ? "urgente" : "atencao",
      });
    }
  });

  // EPIs — sem data de devolução pode indicar uso prolongado
  // Alertar EPIs entregues há mais de 180 dias sem devolução
  epis?.forEach((epi) => {
    if (epi.data_devolucao) return;
    const entrega = new Date(epi.data_entrega);
    const diasUso = differenceInDays(hoje, entrega);
    if (diasUso > 180) {
      alertas.push({
        id: epi.id,
        tipo: "epi",
        funcionario: epi._nome || "—",
        descricao: `EPI "${epi.nome_epi}" — CA ${epi.ca_numero || "N/A"} em uso há ${diasUso} dias`,
        vencimento: format(addDays(entrega, 365), "yyyy-MM-dd"),
        diasRestantes: 365 - diasUso,
        severidade: diasUso > 365 ? "critico" : diasUso > 270 ? "urgente" : "atencao",
      });
    }
  });

  // Ordenar por severidade
  alertas.sort((a, b) => {
    const ordem = { critico: 0, urgente: 1, atencao: 2 };
    return ordem[a.severidade] - ordem[b.severidade] || a.diasRestantes - b.diasRestantes;
  });

  const countCritico = alertas.filter((a) => a.severidade === "critico").length;
  const countUrgente = alertas.filter((a) => a.severidade === "urgente").length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Alertas de Vencimento SST</CardTitle>
          </div>
          <div className="flex gap-2">
            {countCritico > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {countCritico} vencido{countCritico > 1 ? "s" : ""}
              </Badge>
            )}
            {countUrgente > 0 && (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 gap-1" variant="outline">
                <Clock className="h-3 w-3" />
                {countUrgente} urgente{countUrgente > 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {alertas.length === 0 ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Nenhum alerta de vencimento no momento
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {alertas.map((alerta) => (
              <div
                key={`${alerta.tipo}-${alerta.id}`}
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  alerta.severidade === "critico"
                    ? "bg-destructive/5 border-destructive/30"
                    : alerta.severidade === "urgente"
                    ? "bg-amber-50 dark:bg-amber-950/20 border-amber-300/50"
                    : "bg-muted/30 border-border"
                }`}
              >
                {alerta.severidade === "critico" ? (
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                ) : (
                  <Clock className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-medium text-sm">{alerta.funcionario}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {alerta.tipo.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span
                    className={`text-xs font-semibold ${
                      alerta.diasRestantes < 0
                        ? "text-destructive"
                        : alerta.diasRestantes <= 15
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {alerta.diasRestantes < 0
                      ? `Vencido há ${Math.abs(alerta.diasRestantes)}d`
                      : `${alerta.diasRestantes}d restantes`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
