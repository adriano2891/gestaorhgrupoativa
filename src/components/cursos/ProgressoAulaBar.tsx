import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProgressoAulaBarProps {
  progresso: number; // 0-100
  status: "nao_iniciada" | "em_andamento" | "concluida";
  tempoAssistido?: number; // em segundos
  duracao?: number; // em segundos
  className?: string;
}

export const ProgressoAulaBar = ({
  progresso,
  status,
  tempoAssistido = 0,
  duracao = 0,
  className,
}: ProgressoAulaBarProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = () => {
    switch (status) {
      case "concluida":
        return (
          <Badge className="bg-green-100 text-green-700 gap-1 text-xs">
            <CheckCircle className="h-3 w-3" />
            Concluída
          </Badge>
        );
      case "em_andamento":
        return (
          <Badge className="bg-blue-100 text-blue-700 gap-1 text-xs">
            <Play className="h-3 w-3" />
            Em Andamento
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            Não Iniciada
          </Badge>
        );
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        {getStatusBadge()}
        {status !== "nao_iniciada" && (
          <span className="text-xs text-muted-foreground">
            {duracao > 0
              ? `${formatTime(tempoAssistido)} / ${formatTime(duracao)}`
              : `${progresso}%`}
          </span>
        )}
      </div>
      <Progress
        value={progresso}
        className={cn(
          "h-2",
          status === "concluida" && "[&>div]:bg-green-500"
        )}
      />
    </div>
  );
};

// Componente para mostrar progresso do módulo
interface ProgressoModuloProps {
  aulasTotal: number;
  aulasConcluidas: number;
  className?: string;
}

export const ProgressoModulo = ({
  aulasTotal,
  aulasConcluidas,
  className,
}: ProgressoModuloProps) => {
  const progresso = aulasTotal > 0 ? Math.round((aulasConcluidas / aulasTotal) * 100) : 0;
  const isConcluido = aulasConcluidas >= aulasTotal && aulasTotal > 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Progress
        value={progresso}
        className={cn(
          "h-1.5 flex-1",
          isConcluido && "[&>div]:bg-green-500"
        )}
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {aulasConcluidas}/{aulasTotal}
      </span>
      {isConcluido && (
        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
      )}
    </div>
  );
};
