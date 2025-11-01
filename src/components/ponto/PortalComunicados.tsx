import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PortalComunicadosProps {
  onBack: () => void;
}

export const PortalComunicados = ({ onBack }: PortalComunicadosProps) => {
  const comunicados = [
    {
      id: 1,
      titulo: "Novo Horário de Expediente",
      data: "01/11/2025",
      tipo: "importante",
      lido: false,
    },
    {
      id: 2,
      titulo: "Confraternização de Fim de Ano",
      data: "28/10/2025",
      tipo: "evento",
      lido: true,
    },
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
                <Bell className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Comunicados Internos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Avisos e notícias da empresa
              </p>
              <div className="space-y-3">
                {comunicados.map((comunicado) => (
                  <div
                    key={comunicado.id}
                    className={`p-4 border rounded-lg hover:bg-accent cursor-pointer ${
                      !comunicado.lido ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{comunicado.titulo}</p>
                          {!comunicado.lido && (
                            <Badge variant="default" className="text-xs">
                              Novo
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {comunicado.data}
                        </p>
                      </div>
                      <Badge variant="outline">{comunicado.tipo}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
