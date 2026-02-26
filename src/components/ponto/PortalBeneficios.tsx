import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gift } from "lucide-react";
import { PortalBackground } from "./PortalBackground";

interface PortalBeneficiosProps {
  onBack: () => void;
}

export const PortalBeneficios = ({ onBack }: PortalBeneficiosProps) => {
  const beneficios = [
    { nome: "Vale Transporte", valor: "R$ 200,00/mês", status: "Ativo" },
    { nome: "Vale Refeição", valor: "R$ 30,00/dia", status: "Ativo" },
    { nome: "Plano de Saúde", valor: "Unimed", status: "Ativo" },
    { nome: "Plano Odontológico", valor: "Odontoprev", status: "Ativo" },
  ];

  return (
    <PortalBackground>
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
                <Gift className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Benefícios</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Consulte seus benefícios ativos
              </p>
              <div className="space-y-3">
                {beneficios.map((beneficio, index) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-lg">{beneficio.nome}</p>
                          <p className="text-sm text-muted-foreground">{beneficio.valor}</p>
                        </div>
                        <span className="text-xs font-medium px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400">
                          {beneficio.status}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PortalBackground>
  );
};
