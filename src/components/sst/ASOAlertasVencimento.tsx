import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, Stethoscope } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ASO } from "@/hooks/useSST";

interface ASOAlertasVencimentoProps {
  asos: ASO[];
}

export const ASOAlertasVencimento = ({ asos }: ASOAlertasVencimentoProps) => {
  const alertas = useMemo(() => {
    const hoje = new Date();
    const vencidos: ASO[] = [];
    const vencendo30: ASO[] = [];
    const vencendo60: ASO[] = [];
    const emDia: ASO[] = [];

    asos.forEach((aso) => {
      if (!aso.data_vencimento) return;
      const vencimento = parseISO(aso.data_vencimento);
      const dias = differenceInDays(vencimento, hoje);

      if (dias < 0) vencidos.push(aso);
      else if (dias <= 30) vencendo30.push(aso);
      else if (dias <= 60) vencendo60.push(aso);
      else emDia.push(aso);
    });

    return { vencidos, vencendo30, vencendo60, emDia };
  }, [asos]);

  const total = alertas.vencidos.length + alertas.vencendo30.length + alertas.vencendo60.length;

  if (asos.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Stethoscope className="h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium text-muted-foreground">Nenhum ASO cadastrado</p>
            <p className="text-sm text-muted-foreground/70">Cadastre exames ocupacionais (ASOs) no módulo de SST para visualizar alertas de vencimento aqui.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={total > 0 ? "border-destructive/50" : "border-green-500/30"}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Stethoscope className="h-5 w-5 text-primary" />
          Alertas de Vencimento — ASO (NR-7)
          {total > 0 && (
            <Badge variant="destructive" className="ml-auto">{total} pendências</Badge>
          )}
          {total === 0 && (
            <Badge className="ml-auto bg-green-500">Tudo em dia</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Vencidos */}
        {alertas.vencidos.length > 0 && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-destructive mb-2">
              <AlertTriangle className="h-4 w-4" />
              ASOs VENCIDOS ({alertas.vencidos.length})
            </div>
            <div className="space-y-1">
              {alertas.vencidos.map((aso) => (
                <div key={aso.id} className="text-xs flex items-center justify-between">
                  <span className="font-medium">{aso._nome || "—"}</span>
                  <span className="text-destructive">
                    Vencido em {format(parseISO(aso.data_vencimento!), "dd/MM/yyyy", { locale: ptBR })}
                    {" "}({Math.abs(differenceInDays(parseISO(aso.data_vencimento!), new Date()))} dias)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vencendo em 30 dias */}
        {alertas.vencendo30.length > 0 && (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2">
              <Clock className="h-4 w-4" />
              Vencendo em até 30 dias ({alertas.vencendo30.length})
            </div>
            <div className="space-y-1">
              {alertas.vencendo30.map((aso) => (
                <div key={aso.id} className="text-xs flex items-center justify-between">
                  <span className="font-medium">{aso._nome || "—"}</span>
                  <span className="text-amber-600 dark:text-amber-400">
                    Vence em {format(parseISO(aso.data_vencimento!), "dd/MM/yyyy", { locale: ptBR })}
                    {" "}({differenceInDays(parseISO(aso.data_vencimento!), new Date())} dias)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vencendo em 60 dias */}
        {alertas.vencendo60.length > 0 && (
          <div className="rounded-lg border border-blue-500/40 bg-blue-500/5 p-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
              <Clock className="h-4 w-4" />
              Vencendo em 30-60 dias ({alertas.vencendo60.length})
            </div>
            <div className="space-y-1">
              {alertas.vencendo60.map((aso) => (
                <div key={aso.id} className="text-xs flex items-center justify-between">
                  <span className="font-medium">{aso._nome || "—"}</span>
                  <span className="text-blue-600 dark:text-blue-400">
                    Vence em {format(parseISO(aso.data_vencimento!), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Em dia */}
        {total === 0 && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle className="h-4 w-4" />
            Todos os ASOs estão dentro do prazo de validade.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
