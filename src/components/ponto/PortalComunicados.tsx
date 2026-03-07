import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Paperclip, Download, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { usePortalAuth } from "./PortalAuthProvider";
import { useComunicados, useMarcarComunicadoLido, useConfirmarComunicado } from "@/hooks/useComunicados";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PortalBackground } from "./PortalBackground";
import { toast } from "sonner";

interface PortalComunicadosProps {
  onBack: () => void;
}

export const PortalComunicados = ({ onBack }: PortalComunicadosProps) => {
  const { user } = usePortalAuth();
  const { data: comunicados, isLoading } = useComunicados(user?.id);
  const marcarLido = useMarcarComunicadoLido();
  const confirmar = useConfirmarComunicado();

  const handleComunicadoClick = (comunicado: any) => {
    if (!comunicado.lido && user?.id) {
      marcarLido.mutate({
        comunicadoId: comunicado.id,
        userId: user.id,
      });
    }
  };

  const handleConfirmar = (comunicadoId: string) => {
    if (!user?.id) return;
    confirmar.mutate(
      { comunicadoId, userId: user.id },
      {
        onSuccess: () => toast.success("Comunicado confirmado com sucesso"),
        onError: () => toast.error("Erro ao confirmar comunicado"),
      }
    );
  };

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
                <Bell className="h-8 w-8 text-primary" />
                <CardTitle className="text-3xl">Comunicados Internos</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 text-lg">
                Avisos e notícias da empresa
              </p>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ) : !comunicados || comunicados.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Nenhum comunicado disponível no momento
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {comunicados.map((comunicado) => (
                    <div
                      key={comunicado.id}
                      onClick={() => handleComunicadoClick(comunicado)}
                      className={`p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors ${
                        !comunicado.lido ? "bg-primary/5 border-primary/20" : ""
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-lg">{comunicado.titulo}</p>
                            {!comunicado.lido && (
                              <Badge variant="default" className="text-xs">Novo</Badge>
                            )}
                          </div>
                          <p className="text-base text-muted-foreground mb-2">
                            {format(new Date(comunicado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          <p className="text-base">{comunicado.conteudo}</p>

                          {/* Anexos */}
                          {comunicado.anexos && comunicado.anexos.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                              {comunicado.anexos.map((anexo: any, i: number) => (
                                <a
                                  key={i}
                                  href={anexo.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-xs bg-muted rounded px-2 py-1 hover:bg-muted/80"
                                >
                                  <Paperclip className="h-3 w-3" />
                                  {anexo.nome}
                                  <Download className="h-3 w-3 ml-1" />
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Botão de confirmação formal */}
                          {comunicado.lido && !comunicado.confirmado && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="mt-3 gap-1 border-green-500 text-green-600 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConfirmar(comunicado.id);
                              }}
                            >
                              <CheckCircle className="h-4 w-4" />
                              Li e estou ciente
                            </Button>
                          )}
                          {comunicado.confirmado && (
                            <Badge className="mt-3 bg-green-500 text-white gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Confirmado em {comunicado.confirmado_em
                                ? format(new Date(comunicado.confirmado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
                                : ""}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline">{comunicado.tipo}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </PortalBackground>
  );
};
