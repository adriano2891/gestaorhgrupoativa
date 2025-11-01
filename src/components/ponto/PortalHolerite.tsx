import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download } from "lucide-react";

interface PortalHoleriteProps {
  onBack: () => void;
}

export const PortalHolerite = ({ onBack }: PortalHoleriteProps) => {
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
                <FileText className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Meus Holerites</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Visualize e baixe seus contracheques
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                  <div>
                    <p className="font-medium">Holerite - Janeiro 2025</p>
                    <p className="text-sm text-muted-foreground">Emitido em 05/01/2025</p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
