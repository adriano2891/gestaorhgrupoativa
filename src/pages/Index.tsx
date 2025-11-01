import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="min-h-[calc(100vh-180px)] flex items-center justify-center px-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Visão geral do sistema de gestão de recursos humanos
          </p>
        </div>

        {/* Card de Boas-vindas */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-3xl md:text-4xl">Bem-vindo ao AtivaRH</CardTitle>
            <CardDescription className="text-base md:text-lg mt-2">
              Sistema completo de gestão de recursos humanos
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-base text-muted-foreground leading-relaxed">
              Utilize o menu de navegação acima para acessar as diferentes funcionalidades do sistema.
            </p>
            <p className="text-sm text-muted-foreground">
              O módulo de Holerites está pronto para uso!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
