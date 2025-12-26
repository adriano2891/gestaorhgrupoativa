import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Download, RefreshCw, Loader2 } from "lucide-react";
import { usePortalAuth } from "./PortalAuthProvider";
import { useHolerites } from "@/hooks/useHolerites";
import { useHoleriteDownloadUrl } from "@/hooks/useHoleritesMutation";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface PortalHoleriteProps {
  onBack: () => void;
}

export const PortalHolerite = ({ onBack }: PortalHoleriteProps) => {
  const { user } = usePortalAuth();
  const { data: holerites, isLoading, refetch } = useHolerites(user?.id);
  const downloadUrl = useHoleriteDownloadUrl();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const getMesNome = (mes: number) => {
    const meses = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    return meses[mes - 1];
  };

  const handleDownload = async (arquivoUrl: string | null) => {
    if (!arquivoUrl) {
      toast({
        title: "Arquivo não disponível",
        description: "Este holerite não possui arquivo PDF anexado.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Se é uma URL assinada, abre diretamente
      if (arquivoUrl.includes("token=")) {
        window.open(arquivoUrl, '_blank');
      } else {
        // Gerar nova URL assinada
        const signedUrl = await downloadUrl.mutateAsync(arquivoUrl);
        window.open(signedUrl, '_blank');
      }
    } catch (error) {
      console.error("Erro ao baixar:", error);
      toast({
        title: "Erro ao baixar",
        description: "Não foi possível baixar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Dados atualizados",
      description: "A lista de holerites foi atualizada.",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50">
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
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
                  <p className="text-sm text-muted-foreground mt-2">
                    Seus holerites aparecerão aqui assim que forem disponibilizados pelo RH.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {holerites.map((holerite) => (
                    <div
                      key={holerite.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">
                          Holerite - {getMesNome(holerite.mes)} {holerite.ano}
                        </p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          <span>
                            Bruto: R$ {holerite.salario_bruto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span>
                            Descontos: R$ {holerite.descontos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="font-medium text-foreground">
                            Líquido: R$ {holerite.salario_liquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Emitido em {format(new Date(holerite.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleDownload(holerite.arquivo_url)}
                        disabled={downloadUrl.isPending}
                        className="ml-4 flex-shrink-0"
                      >
                        {downloadUrl.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </>
                        )}
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
