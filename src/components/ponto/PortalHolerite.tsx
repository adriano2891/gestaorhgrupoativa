import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download } from "lucide-react";
import { usePortalAuth } from "./PortalAuthProvider";
import { useHolerites } from "@/hooks/useHolerites";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PortalHoleriteProps {
  onBack: () => void;
}

export const PortalHolerite = ({ onBack }: PortalHoleriteProps) => {
  const { user } = usePortalAuth();
  const { data: holerites, isLoading } = useHolerites(user?.id);

  const getMesNome = (mes: number) => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[mes - 1];
  };

  const handleDownload = (holerite: any) => {
    if (holerite.arquivo_url) {
      window.open(holerite.arquivo_url, '_blank');
    }
  };

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
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !holerites || holerites.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum holerite disponível no momento
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {holerites.map((holerite) => (
                    <div
                      key={holerite.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent"
                    >
                      <div>
                        <p className="font-medium">
                          Holerite - {getMesNome(holerite.mes)} {holerite.ano}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Salário Líquido: R$ {holerite.salario_liquido.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Emitido em {format(new Date(holerite.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(holerite)}
                        disabled={!holerite.arquivo_url}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};
