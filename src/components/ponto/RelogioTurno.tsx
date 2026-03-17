import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface RelogioTurnoProps {
  registroHoje: any;
}

export const RelogioTurno = ({ registroHoje }: RelogioTurnoProps) => {
  const [tempoTotal, setTempoTotal] = useState<string>("00:00:00");
  const registroRef = useRef<any>(null);

  // Keep ref in sync without restarting the interval
  useEffect(() => {
    registroRef.current = registroHoje;
  }, [registroHoje]);

  useEffect(() => {
    if (!registroHoje?.entrada) {
      setTempoTotal("00:00:00");
      return;
    }

    const calcularTempo = () => {
      const reg = registroRef.current;
      if (!reg?.entrada) return;

      const entrada = new Date(reg.entrada);
      const agora = reg.saida ? new Date(reg.saida) : new Date();

      let totalSegundos = Math.floor((agora.getTime() - entrada.getTime()) / 1000);

      // Only subtract COMPLETED pauses — never subtract active ones
      if (reg.saida_pausa_1 && reg.retorno_pausa_1) {
        totalSegundos -= Math.floor(
          (new Date(reg.retorno_pausa_1).getTime() - new Date(reg.saida_pausa_1).getTime()) / 1000
        );
      }

      if (reg.saida_almoco && reg.retorno_almoco) {
        totalSegundos -= Math.floor(
          (new Date(reg.retorno_almoco).getTime() - new Date(reg.saida_almoco).getTime()) / 1000
        );
      }

      if (reg.saida_pausa_2 && reg.retorno_pausa_2) {
        totalSegundos -= Math.floor(
          (new Date(reg.retorno_pausa_2).getTime() - new Date(reg.saida_pausa_2).getTime()) / 1000
        );
      }

      if (totalSegundos < 0) totalSegundos = 0;

      const horas = Math.floor(totalSegundos / 3600);
      const minutos = Math.floor((totalSegundos % 3600) / 60);
      const segundos = totalSegundos % 60;

      setTempoTotal(
        `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`
      );
    };

    calcularTempo();
    const intervalo = setInterval(calcularTempo, 1000);

    return () => clearInterval(intervalo);
    // Only restart interval when entrada changes, not on every registroHoje update
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroHoje?.entrada]);

  if (!registroHoje?.entrada) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Tempo Total de Trabalho</p>
              <p className="text-3xl font-bold text-primary">{tempoTotal}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
