import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, TrendingUp } from "lucide-react";

const Index = () => {
  const stats = [
    {
      title: "Total de Funcionários",
      value: "234",
      icon: Users,
      description: "+12 este mês",
    },
    {
      title: "Holerites Gerados",
      value: "198",
      icon: FileText,
      description: "Outubro 2025",
    },
    {
      title: "Taxa de Retenção",
      value: "94%",
      icon: TrendingUp,
      description: "+2% vs mês anterior",
    },
    {
      title: "Departamentos",
      value: "8",
      icon: Building2,
      description: "Ativos",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-primary-foreground">Dashboard</h1>
        <p className="text-primary-foreground/80 mt-1">
          Visão geral do sistema de gestão de recursos humanos
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bem-vindo ao AtivaRH</CardTitle>
          <CardDescription>
            Sistema completo de gestão de recursos humanos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Utilize o menu de navegação acima para acessar as diferentes funcionalidades do sistema.
            O módulo de Holerites está pronto para uso!
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
