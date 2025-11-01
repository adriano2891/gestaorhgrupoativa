import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface MetricData {
  title: string;
  value: string | number;
  description: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon: React.ReactNode;
  color: string;
}

interface AdvancedMetricsProps {
  metrics: MetricData[];
}

export const AdvancedMetrics = ({ metrics }: AdvancedMetricsProps) => {
  const getTrendIcon = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'neutral':
        return <Minus className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getTrendColor = (trend?: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'neutral':
        return 'text-yellow-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card key={index} className="relative overflow-hidden">
          <div
            className="absolute top-0 right-0 w-24 h-24 opacity-10"
            style={{ transform: 'translate(20%, -20%)' }}
          >
            {metric.icon}
          </div>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${metric.color} bg-opacity-10`}>
                {metric.icon}
              </div>
              {metric.trend && (
                <div className="flex items-center gap-1">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-sm font-medium ${getTrendColor(metric.trend)}`}>
                    {metric.trendValue}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-2xl font-bold">{metric.value}</p>
              <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
              <CardDescription className="text-xs">{metric.description}</CardDescription>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
