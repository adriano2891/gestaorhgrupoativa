import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Trash2, Eye, EyeOff, FileText, Paperclip, History, Download } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useComunicadosRealtime } from "@/hooks/useRealtimeUpdates";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { CriarComunicadoDialog } from "@/components/comunicados/CriarComunicadoDialog";
import { AuditoriaComunicadoDialog } from "@/components/comunicados/AuditoriaComunicadoDialog";
import { ConfirmacoesLeituraDialog } from "@/components/comunicados/ConfirmacoesLeituraDialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: string;
  prioridade: string;
  destinatarios: string[];
  criado_por: string | null;
  created_at: string;
  data_expiracao: string | null;
  ativo: boolean;
  excluido: boolean;
  excluido_por: string | null;
  excluido_em: string | null;
  anexos: any[] | null;
  emissor_nome?: string;
}

const Comunicados = () => {
  useComunicadosRealtime();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedComunicado, setSelectedComunicado] = useState<string | null>(null);
  const [auditoriaOpen, setAuditoriaOpen] = useState(false);
  const [auditoriaComunicadoId, setAuditoriaComunicadoId] = useState<string | null>(null);
  const [confirmacoesOpen, setConfirmacoesOpen] = useState(false);
  const [confirmacoesComunicadoId, setConfirmacoesComunicadoId] = useState<string | null>(null);
  const [mostrarExcluidos, setMostrarExcluidos] = useState(false);
  const queryClient = useQueryClient();

  // Fetch comunicados with emissor name
  const { data: comunicados, isLoading, error, refetch } = useQuery({
    queryKey: ["comunicados-admin", mostrarExcluidos],
    queryFn: async () => {
      let query = supabase
        .from("comunicados")
        .select("*, profiles:criado_por(nome)")
        .order("created_at", { ascending: false });

      if (!mostrarExcluidos) {
        query = query.eq("excluido" as any, false);
      }

      const { data, error } = await query as any;
      if (error) throw error;

      return (data || []).map((c: any) => ({
        ...c,
        emissor_nome: c.profiles?.nome || "Sistema",
      })) as Comunicado[];
    },
    retry: 2,
    staleTime: 1000 * 30,
  });

  // Soft-delete mutation (replaces hard DELETE)
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from("comunicados")
        .update({
          excluido: true,
          excluido_por: user.id,
          excluido_em: new Date().toISOString(),
          ativo: false,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunicados-admin"] });
      toast.success("Comunicado arquivado com sucesso");
      setDeleteDialogOpen(false);
      setSelectedComunicado(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao arquivar comunicado");
      setDeleteDialogOpen(false);
    },
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("comunicados")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunicados-admin"] });
      toast.success("Status do comunicado atualizado");
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const handleDelete = (id: string) => {
    setSelectedComunicado(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedComunicado) {
      deleteMutation.mutate(selectedComunicado);
    }
  };

  const handleViewAuditoria = (id: string) => {
    setAuditoriaComunicadoId(id);
    setAuditoriaOpen(true);
  };

  const handleViewConfirmacoes = (id: string) => {
    setConfirmacoesComunicadoId(id);
    setConfirmacoesOpen(true);
  };

  const getTipoBadge = (tipo: string) => {
    const tipos: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
      informativo: { label: "Informativo", variant: "default" },
      urgente: { label: "Urgente", variant: "default" },
      evento: { label: "Evento", variant: "secondary" },
      aviso: { label: "Aviso", variant: "outline" },
    };
    return tipos[tipo] || { label: tipo, variant: "outline" };
  };

  const getPrioridadeBadge = (prioridade: string) => {
    const prioridades: Record<string, { label: string; className: string }> = {
      alta: { label: "Alta", className: "bg-red-500 text-white" },
      media: { label: "Média", className: "bg-yellow-500 text-white" },
      baixa: { label: "Baixa", className: "bg-green-500 text-white" },
      normal: { label: "Normal", className: "bg-blue-500 text-white" },
    };
    return prioridades[prioridade] || { label: prioridade, className: "" };
  };

  return (
    <div className="space-y-4 sm:space-y-6" style={{ fontFamily: 'Arial, sans-serif' }}>
      <BackButton to="/gestao-rh" variant="light" />

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" style={{ color: '#40e0d0' }} />
              <CardTitle className="text-lg sm:text-xl md:text-2xl" style={{ color: '#40e0d0' }}>Comunicados Internos</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMostrarExcluidos(!mostrarExcluidos)}
              >
                <History className="h-4 w-4 mr-1" />
                {mostrarExcluidos ? "Ocultar Arquivados" : "Ver Arquivados"}
              </Button>
              <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Novo Comunicado
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Erro ao carregar comunicados</p>
              <p className="text-sm text-muted-foreground mb-4">{(error as Error).message}</p>
              <Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
            </div>
          ) : !comunicados || comunicados.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum comunicado criado ainda</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Comunicado
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {comunicados.map((comunicado) => (
                <Card
                  key={comunicado.id}
                  className={`transition-all ${
                    comunicado.excluido
                      ? "opacity-40 border-destructive/30 bg-destructive/5"
                      : !comunicado.ativo
                      ? "opacity-60 border-muted"
                      : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">{comunicado.titulo}</h3>
                          <Badge variant={getTipoBadge(comunicado.tipo).variant}>
                            {getTipoBadge(comunicado.tipo).label}
                          </Badge>
                          <Badge className={getPrioridadeBadge(comunicado.prioridade).className}>
                            {getPrioridadeBadge(comunicado.prioridade).label}
                          </Badge>
                          {!comunicado.ativo && !comunicado.excluido && (
                            <Badge variant="outline" className="border-red-500 text-red-500">Inativo</Badge>
                          )}
                          {comunicado.excluido && (
                            <Badge variant="outline" className="border-destructive text-destructive">Arquivado</Badge>
                          )}
                          {comunicado.anexos && comunicado.anexos.length > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <Paperclip className="h-3 w-3" />
                              {comunicado.anexos.length} anexo(s)
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">{comunicado.conteudo}</p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                          <span>
                            Criado por <strong>{comunicado.emissor_nome}</strong> em{" "}
                            {format(new Date(comunicado.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                          {comunicado.data_expiracao && (
                            <span>
                              Expira em{" "}
                              {format(new Date(comunicado.data_expiracao), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          )}
                          <span>
                            Destinatários:{" "}
                            {comunicado.destinatarios?.includes("todos")
                              ? "Todos"
                              : comunicado.destinatarios?.join(", ")}
                          </span>
                          {comunicado.excluido && comunicado.excluido_em && (
                            <span className="text-destructive">
                              Arquivado em {format(new Date(comunicado.excluido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          )}
                        </div>
                      </div>

                      {!comunicado.excluido && (
                        <TooltipProvider>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleViewConfirmacoes(comunicado.id)}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Confirmações de Leitura</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleViewAuditoria(comunicado.id)}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Histórico de Auditoria</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() =>
                                    toggleAtivoMutation.mutate({
                                      id: comunicado.id,
                                      ativo: !comunicado.ativo,
                                    })
                                  }
                                  title={comunicado.ativo ? "Desativar" : "Ativar"}
                                >
                                  {comunicado.ativo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>{comunicado.ativo ? "Desativar" : "Ativar"}</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleDelete(comunicado.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Arquivar</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CriarComunicadoDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <AuditoriaComunicadoDialog
        open={auditoriaOpen}
        onOpenChange={setAuditoriaOpen}
        comunicadoId={auditoriaComunicadoId}
      />

      <ConfirmacoesLeituraDialog
        open={confirmacoesOpen}
        onOpenChange={setConfirmacoesOpen}
        comunicadoId={confirmacoesComunicadoId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar arquivamento</AlertDialogTitle>
            <AlertDialogDescription>
              O comunicado será arquivado (soft-delete) e ficará indisponível para os funcionários,
              mas será mantido no sistema para fins de auditoria conforme Art. 11 da CLT (prazo prescricional de 5 anos).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Arquivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Comunicados;
