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
    <Card className="border-amber-300/50 h-full" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
      <CardHeader className="p-2 pb-1">
        <div className="flex items-center gap-1 flex-wrap">
          <DollarSign className="h-3 w-3 text-amber-600 flex-shrink-0" />
          <CardTitle className="text-[11px] font-semibold truncate">
            Equiparação Salarial (Art. 461)
          </CardTitle>
          <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 text-[9px] px-1 py-0" variant="outline">
            {alertas.length} cargo{alertas.length > 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        <p className="text-[11px] text-muted-foreground mb-2 leading-tight">
          Funcionários com mesma função e diferenças salariais &gt;5%. Risco de ação judicial (CLT Art. 461).
        </p>
        <div className="space-y-2">
          {alertas.map((alerta) => (
            <div key={alerta.cargo} className="p-2 rounded-md border bg-amber-50/50 dark:bg-amber-950/10">
              <div className="flex items-center gap-1.5 mb-1">
                <AlertTriangle className="h-3 w-3 text-amber-600 flex-shrink-0" />
                <span className="font-medium text-xs capitalize truncate">{alerta.cargo}</span>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  — {fmt(alerta.diferencaMax)}
                </span>
              </div>
              <div className="grid gap-0.5">
                {alerta.funcionarios.map((f) => (
                  <div key={f.nome} className="flex justify-between text-[11px]">
                    <span className="truncate mr-2">{f.nome}</span>
                    <span className="font-mono flex-shrink-0">{fmt(f.salario)}</span>
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
