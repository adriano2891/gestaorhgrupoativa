import { Building2, CheckCircle, Clock, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Condominio, STATUS_COLORS, STATUS_LABELS } from "@/types/condominios";
import { Badge } from "@/components/ui/badge";

interface CondominiosDashboardProps {
  metricas: {
    total: number;
    ativos: number;
    suspensos: number;
    valorTotal: number;
  };
  recentes: Condominio[];
  onSelectCondominio: (id: string) => void;
}

const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ElementType; 
  color: string;
}) => (
  <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export const CondominiosDashboard = ({ 
  metricas, 
  recentes, 
  onSelectCondominio 
}: CondominiosDashboardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total de Condomínios"
          value={metricas.total}
          icon={Building2}
          color="bg-blue-600"
        />
        <MetricCard
          title="Contratos Ativos"
          value={metricas.ativos}
          icon={CheckCircle}
          color="bg-green-600"
        />
        <MetricCard
          title="Contratos Suspensos"
          value={metricas.suspensos}
          icon={Clock}
          color="bg-yellow-500"
        />
        <MetricCard
          title="Valor Mensal Total"
          value={formatCurrency(metricas.valorTotal)}
          icon={DollarSign}
          color="bg-indigo-600"
        />
      </div>

      {/* Lista de Recentes */}
      <Card className="bg-white border-slate-100 shadow-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            Últimas Atualizações
          </h3>
          {recentes.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              Nenhum condomínio cadastrado ainda.
            </p>
          ) : (
            <div className="space-y-3">
              {recentes.map((condo) => (
                <div
                  key={condo.id}
                  onClick={() => onSelectCondominio(condo.id)}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate">{condo.nome}</p>
                    <p className="text-sm text-slate-500 truncate">Síndico: {condo.sindico}</p>
                  </div>
                  <Badge className={`${STATUS_COLORS[condo.statusContrato].bg} ${STATUS_COLORS[condo.statusContrato].text} border-0`}>
                    {STATUS_LABELS[condo.statusContrato]}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
