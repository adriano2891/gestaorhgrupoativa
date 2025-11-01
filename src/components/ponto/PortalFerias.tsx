import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar } from "lucide-react";

interface PortalFeriasProps {
  onBack: () => void;
}

export const PortalFerias = ({ onBack }: PortalFeriasProps) => {
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
                <Calendar className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Férias e Licenças</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Solicite férias e acompanhe seu saldo
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Saldo Disponível</p>
                    <p className="text-2xl font-bold text-primary">30 dias</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Dias Usados</p>
                    <p className="text-2xl font-bold">0 dias</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">Próximo Período</p>
                    <p className="text-2xl font-bold">-</p>
                  </CardContent>
                </Card>
              </div>
              <Button className="w-full">Solicitar Férias</Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
