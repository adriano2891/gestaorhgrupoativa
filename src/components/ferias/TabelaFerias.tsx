import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, XCircle, Edit, Trash2, Mail } from "lucide-react";
import { SolicitacaoFerias, useAtualizarSolicitacao, useNotificarFuncionario, useMarcarComoVisualizada } from "@/hooks/useFerias";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TabelaFeriasProps {
  solicitacoes: SolicitacaoFerias[];
}

export const TabelaFerias = ({ solicitacoes }: TabelaFeriasProps) => {
  const [dialogAberto, setDialogAberto] = useState(false);
  const [acaoSelecionada, setAcaoSelecionada] = useState<{ tipo: string; id: string } | null>(null);
  const [motivoReprovacao, setMotivoReprovacao] = useState("");

  const atualizarMutation = useAtualizarSolicitacao();
  const notificarMutation = useNotificarFuncionario();
  const marcarVisualizadaMutation = useMarcarComoVisualizada();

  const handleVisualizarDetalhes = (solicitacao: SolicitacaoFerias) => {
    if (!solicitacao.visualizada_admin) {
      marcarVisualizadaMutation.mutate(solicitacao.id);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; color: string }> = {
      pendente: { variant: "outline", label: "Pendente", color: "text-yellow-600 border-yellow-600" },
      aprovado: { variant: "default", label: "Aprovado", color: "bg-green-500" },
      em_andamento: { variant: "default", label: "Em Andamento", color: "bg-blue-500" },
      reprovado: { variant: "destructive", label: "Reprovado", color: "" },
      concluido: { variant: "secondary", label: "Concluído", color: "" },
      cancelado: { variant: "outline", label: "Cancelado", color: "" },
    };

    const config = variants[status] || variants.pendente;
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant={config.variant as any} className={config.color}>
              {config.label}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Status: {config.label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const handleAcao = (tipo: string, id: string) => {
    setAcaoSelecionada({ tipo, id });
    setDialogAberto(true);
    setMotivoReprovacao("");
  };

  const confirmarAcao = () => {
    if (!acaoSelecionada) return;

    const { tipo, id } = acaoSelecionada;

    if (tipo === "notificar") {
      notificarMutation.mutate(id);
    } else if (tipo === "aprovar") {
      atualizarMutation.mutate({ id, status: "aprovado" });
    } else if (tipo === "reprovar") {
      atualizarMutation.mutate({ id, status: "reprovado", motivo_reprovacao: motivoReprovacao });
    } else if (tipo === "cancelar") {
      atualizarMutation.mutate({ id, status: "cancelado" });
    }

    setDialogAberto(false);
    setAcaoSelecionada(null);
  };

  const getTituloDialog = () => {
    if (!acaoSelecionada) return "";
    const titulos: Record<string, string> = {
      notificar: "Notificar Funcionário",
      aprovar: "Aprovar Solicitação",
      reprovar: "Reprovar Solicitação",
      cancelar: "Cancelar Solicitação",
    };
    return titulos[acaoSelecionada.tipo] || "";
  };

  const getDescricaoDialog = () => {
    if (!acaoSelecionada) return "";
    const descricoes: Record<string, string> = {
      notificar: "Deseja enviar uma notificação para o funcionário sobre suas férias?",
      aprovar: "Tem certeza que deseja aprovar esta solicitação de férias?",
      reprovar: "Por favor, informe o motivo da reprovação:",
      cancelar: "Tem certeza que deseja cancelar esta solicitação?",
    };
    return descricoes[acaoSelecionada.tipo] || "";
  };

  return (
    <>
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Funcionário</TableHead>
              <TableHead>Cargo / Depto</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitacoes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Nenhuma solicitação encontrada
                </TableCell>
              </TableRow>
            ) : (
              solicitacoes.map((solicitacao) => (
                <TableRow 
                  key={solicitacao.id}
                  className="cursor-pointer"
                  onClick={() => handleVisualizarDetalhes(solicitacao)}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {!solicitacao.visualizada_admin && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Badge variant="default" className="bg-red-500 hover:bg-red-600 px-2 py-1">
                                <Mail className="h-3 w-3" />
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Nova solicitação</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {solicitacao.profiles?.nome}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{solicitacao.profiles?.cargo || "-"}</div>
                      <div className="text-muted-foreground">{solicitacao.profiles?.departamento || "-"}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {format(new Date(solicitacao.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(new Date(solicitacao.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                    </div>
                  </TableCell>
                  <TableCell>{solicitacao.dias_solicitados}</TableCell>
                  <TableCell>{getStatusBadge(solicitacao.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleAcao("notificar", solicitacao.id)}
                            >
                              <Bell className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Notificar funcionário</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      {solicitacao.status === "pendente" && (
                        <>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAcao("aprovar", solicitacao.id)}
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Aprovar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAcao("reprovar", solicitacao.id)}
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reprovar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </>
                      )}

                      {(solicitacao.status === "pendente" || solicitacao.status === "aprovado") && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleAcao("cancelar", solicitacao.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Cancelar</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={dialogAberto} onOpenChange={setDialogAberto}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getTituloDialog()}</AlertDialogTitle>
            <AlertDialogDescription>{getDescricaoDialog()}</AlertDialogDescription>
          </AlertDialogHeader>

          {acaoSelecionada?.tipo === "reprovar" && (
            <Textarea
              placeholder="Informe o motivo da reprovação..."
              value={motivoReprovacao}
              onChange={(e) => setMotivoReprovacao(e.target.value)}
              className="min-h-24"
            />
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarAcao}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
