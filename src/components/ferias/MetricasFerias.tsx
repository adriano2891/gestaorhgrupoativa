import { Card, CardContent } from "@/components/ui/card";
import { Clock, CheckCircle, Calendar, TrendingUp } from "lucide-react";
import { useMetricasFerias } from "@/hooks/useFerias";
import { Skeleton } from "@/components/ui/skeleton";

export const MetricasFerias = () => {
  const { data: metricas, isLoading } = useMetricasFerias();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Solicitações Pendentes",
      value: metricas?.pendentes || 0,
      icon: Clock,
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
    {
      title: "Colaboradores de Férias",
      value: metricas?.emAndamento || 0,
      icon: CheckCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Próximas Férias",
      value: metricas?.proximas || 0,
      icon: Calendar,
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Saldo Médio (dias)",
      value: metricas?.saldoMedio || 0,
      icon: TrendingUp,
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title} className="hover:shadow-lg transition-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
                <p className="text-3xl font-bold">{card.value}</p>
              </div>
              <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
