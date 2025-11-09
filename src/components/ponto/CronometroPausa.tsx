import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Timer, Coffee, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

interface CronometroPausaProps {
  registroHoje: any;
}

export const CronometroPausa = ({ registroHoje }: CronometroPausaProps) => {
  const [tempoRestante, setTempoRestante] = useState<string>("00:00");
  const [tipoPausa, setTipoPausa] = useState<"pausa" | "almoco" | null>(null);
  const [tempoExcedido, setTempoExcedido] = useState(false);

  useEffect(() => {
    let pausaInicio: Date | null = null;
    let duracao = 0;
    let tipo: "pausa" | "almoco" | null = null;

    // Verificar qual pausa está ativa
    if (registroHoje?.saida_pausa_1 && !registroHoje?.retorno_pausa_1) {
      pausaInicio = new Date(registroHoje.saida_pausa_1);
      duracao = 20 * 60; // 20 minutos em segundos
      tipo = "pausa";
    } else if (registroHoje?.saida_pausa_2 && !registroHoje?.retorno_pausa_2) {
      pausaInicio = new Date(registroHoje.saida_pausa_2);
      duracao = 20 * 60; // 20 minutos em segundos
      tipo = "pausa";
    } else if (registroHoje?.saida_almoco && !registroHoje?.retorno_almoco) {
      pausaInicio = new Date(registroHoje.saida_almoco);
      duracao = 60 * 60; // 1 hora em segundos
      tipo = "almoco";
    }

    setTipoPausa(tipo);

    if (!pausaInicio || !tipo) {
      setTempoRestante("00:00");
      setTempoExcedido(false);
      return;
    }

    const calcularTempo = () => {
      const agora = new Date();
      const decorrido = Math.floor((agora.getTime() - pausaInicio!.getTime()) / 1000);
      const restante = duracao - decorrido;

      if (restante <= 0) {
        setTempoExcedido(true);
        const excedido = Math.abs(restante);
        const minutos = Math.floor(excedido / 60);
        const segundos = excedido % 60;
        setTempoRestante(`+${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`);
      } else {
        setTempoExcedido(false);
        const minutos = Math.floor(restante / 60);
        const segundos = restante % 60;
        setTempoRestante(`${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`);
      }
    };

    calcularTempo();
    const intervalo = setInterval(calcularTempo, 1000);

    return () => clearInterval(intervalo);
  }, [registroHoje]);

  if (!tipoPausa) {
    return null;
  }

  const Icon = tipoPausa === "almoco" ? Utensils : Coffee;
  const titulo = tipoPausa === "almoco" ? "Pausa para Almoço" : "Pausa para Lanche";
  const duracaoTexto = tipoPausa === "almoco" ? "1 hora" : "20 minutos";

  return (
    <Card className={cn(
      "border-2 transition-colors",
      tempoExcedido 
        ? "border-destructive/50 bg-destructive/5" 
        : "border-orange-500/50 bg-orange-500/5"
    )}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Timer className={cn(
              "h-8 w-8",
              tempoExcedido ? "text-destructive" : "text-orange-500"
            )} />
            <div>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {titulo} ({duracaoTexto})
                </p>
              </div>
              <p className={cn(
                "text-3xl font-bold",
                tempoExcedido ? "text-destructive" : "text-orange-500"
              )}>
                {tempoRestante}
              </p>
              {tempoExcedido && (
                <p className="text-xs text-destructive font-medium mt-1">
                  Tempo excedido!
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
