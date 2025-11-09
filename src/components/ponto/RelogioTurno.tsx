import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface RelogioTurnoProps {
  registroHoje: any;
}

export const RelogioTurno = ({ registroHoje }: RelogioTurnoProps) => {
  const [tempoTotal, setTempoTotal] = useState<string>("00:00:00");

  useEffect(() => {
    if (!registroHoje?.entrada) {
      setTempoTotal("00:00:00");
      return;
    }

    const calcularTempo = () => {
      const entrada = new Date(registroHoje.entrada);
      const agora = registroHoje.saida ? new Date(registroHoje.saida) : new Date();
      
      let totalSegundos = Math.floor((agora.getTime() - entrada.getTime()) / 1000);

      // Descontar pausas
      if (registroHoje.saida_pausa_1 && registroHoje.retorno_pausa_1) {
        const pausa1 = Math.floor(
          (new Date(registroHoje.retorno_pausa_1).getTime() - 
           new Date(registroHoje.saida_pausa_1).getTime()) / 1000
        );
        totalSegundos -= pausa1;
      } else if (registroHoje.saida_pausa_1) {
        // Pausa em andamento
        const pausaAtual = Math.floor((agora.getTime() - new Date(registroHoje.saida_pausa_1).getTime()) / 1000);
        totalSegundos -= pausaAtual;
      }

      if (registroHoje.saida_almoco && registroHoje.retorno_almoco) {
        const almoco = Math.floor(
          (new Date(registroHoje.retorno_almoco).getTime() - 
           new Date(registroHoje.saida_almoco).getTime()) / 1000
        );
        totalSegundos -= almoco;
      } else if (registroHoje.saida_almoco) {
        // Almoço em andamento
        const almocoAtual = Math.floor((agora.getTime() - new Date(registroHoje.saida_almoco).getTime()) / 1000);
        totalSegundos -= almocoAtual;
      }

      if (registroHoje.saida_pausa_2 && registroHoje.retorno_pausa_2) {
        const pausa2 = Math.floor(
          (new Date(registroHoje.retorno_pausa_2).getTime() - 
           new Date(registroHoje.saida_pausa_2).getTime()) / 1000
        );
        totalSegundos -= pausa2;
      } else if (registroHoje.saida_pausa_2) {
        // Pausa em andamento
        const pausaAtual = Math.floor((agora.getTime() - new Date(registroHoje.saida_pausa_2).getTime()) / 1000);
        totalSegundos -= pausaAtual;
      }

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
  }, [registroHoje]);

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
