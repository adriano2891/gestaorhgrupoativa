import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, DollarSign } from "lucide-react";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { Skeleton } from "@/components/ui/skeleton";

interface AlertaEquiparacao {
  cargo: string;
  funcionarios: { nome: string; salario: number }[];
  diferencaMax: number;
}

export const AlertaEquiparacaoSalarial = () => {
  const { data: funcionarios, isLoading } = useFuncionarios();

  if (isLoading) return <Skeleton className="h-32 w-full" />;
  if (!funcionarios || funcionarios.length === 0) return null;

  // Agrupar por cargo e detectar diferenças salariais
  const porCargo: Record<string, { nome: string; salario: number }[]> = {};
  funcionarios.forEach((f) => {
    if (!f.cargo || !f.salario) return;
    const key = f.cargo.toLowerCase().trim();
    if (!porCargo[key]) porCargo[key] = [];
    porCargo[key].push({ nome: f.nome, salario: f.salario });
  });

  const alertas: AlertaEquiparacao[] = [];
  Object.entries(porCargo).forEach(([cargo, funcs]) => {
    if (funcs.length < 2) return;
    const salarios = funcs.map((f) => f.salario);
    const min = Math.min(...salarios);
    const max = Math.max(...salarios);
    const diferenca = max - min;
    // Alertar se diferença > 5% do menor salário
    if (diferenca > min * 0.05) {
      alertas.push({
        cargo: funcs[0].nome.split(" ")[0] ? cargo : cargo, // use cargo original
        funcionarios: funcs.sort((a, b) => b.salario - a.salario),
        diferencaMax: diferenca,
      });
    }
  });

  if (alertas.length === 0) return null;

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card className="border-amber-300/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-base">
            Alerta de Equiparação Salarial (CLT Art. 461)
          </CardTitle>
          <Badge className="bg-amber-500/10 text-amber-700 border-amber-300" variant="outline">
            {alertas.length} cargo{alertas.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          Funcionários com mesma função e diferenças salariais superiores a 5%.
          Risco de ação judicial por equiparação (CLT Art. 461).
        </p>
        <div className="space-y-3">
          {alertas.map((alerta) => (
            <div key={alerta.cargo} className="p-3 rounded-lg border bg-amber-50/50 dark:bg-amber-950/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
                <span className="font-medium text-sm capitalize">{alerta.cargo}</span>
                <span className="text-xs text-muted-foreground">
                  — diferença de {fmt(alerta.diferencaMax)}
                </span>
              </div>
              <div className="grid gap-1">
                {alerta.funcionarios.map((f) => (
                  <div key={f.nome} className="flex justify-between text-xs">
                    <span>{f.nome}</span>
                    <span className="font-mono">{fmt(f.salario)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
