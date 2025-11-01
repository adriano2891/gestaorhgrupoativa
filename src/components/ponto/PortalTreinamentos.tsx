import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface PortalTreinamentosProps {
  onBack: () => void;
}

export const PortalTreinamentos = ({ onBack }: PortalTreinamentosProps) => {
  const treinamentos = [
    { nome: "Segurança no Trabalho", progresso: 100, status: "Concluído" },
    { nome: "Uso de EPIs", progresso: 60, status: "Em Andamento" },
    { nome: "Primeiros Socorros", progresso: 0, status: "Não Iniciado" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50">
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Treinamentos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Cursos internos e certificados digitais
              </p>
              <div className="space-y-4">
                {treinamentos.map((treinamento, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{treinamento.nome}</p>
                          <span className="text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary">
                            {treinamento.status}
                          </span>
                        </div>
                        <Progress value={treinamento.progresso} className="h-2" />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">
                            {treinamento.progresso}% concluído
                          </span>
                          <Button size="sm" variant="outline">
                            {treinamento.progresso === 0 ? "Iniciar" : "Continuar"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
