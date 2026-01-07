import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Trash2, Eye, EyeOff } from "lucide-react";
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
}

const Comunicados = () => {
  useComunicadosRealtime();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedComunicado, setSelectedComunicado] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: comunicados, isLoading } = useQuery({
    queryKey: ["comunicados-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comunicados")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Comunicado[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log("Tentando excluir comunicado:", id);
      
      const { data, error } = await supabase
        .from("comunicados")
        .delete()
        .eq("id", id)
        .select();
      
      if (error) {
        console.error("Erro ao excluir comunicado:", error);
        throw error;
      }
      
      console.log("Comunicado excluído com sucesso:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunicados-admin"] });
      toast.success("Comunicado excluído com sucesso");
      setDeleteDialogOpen(false);
      setSelectedComunicado(null);
    },
    onError: (error: any) => {
      console.error("Erro na mutation de exclusão:", error);
      toast.error(error.message || "Erro ao excluir comunicado");
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
    <div className="space-y-4 sm:space-y-6">
      <BackButton to="/gestao-rh" variant="light" />
      
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Bell className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0" style={{ color: '#40e0d0' }} />
              <CardTitle className="text-lg sm:text-xl md:text-2xl" style={{ color: '#40e0d0' }}>Comunicados Internos</CardTitle>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Novo Comunicado
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ) : !comunicados || comunicados.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                Nenhum comunicado criado ainda
              </p>
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
                    !comunicado.ativo ? "opacity-60 border-muted" : ""
                  }`}
                >
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-lg">
                            {comunicado.titulo}
                          </h3>
                          <Badge variant={getTipoBadge(comunicado.tipo).variant}>
                            {getTipoBadge(comunicado.tipo).label}
                          </Badge>
                          <Badge className={getPrioridadeBadge(comunicado.prioridade).className}>
                            {getPrioridadeBadge(comunicado.prioridade).label}
                          </Badge>
                          {!comunicado.ativo && (
                            <Badge variant="outline" className="border-red-500 text-red-500">
                              Inativo
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          {comunicado.conteudo}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>
                            Criado em{" "}
                            {format(
                              new Date(comunicado.created_at),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </span>
                          {comunicado.data_expiracao && (
                            <span>
                              Expira em{" "}
                              {format(
                                new Date(comunicado.data_expiracao),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )}
                            </span>
                          )}
                          <span>
                            Destinatários:{" "}
                            {comunicado.destinatarios.includes("todos")
                              ? "Todos"
                              : comunicado.destinatarios.join(", ")}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2">
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
                          {comunicado.ativo ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <EyeOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(comunicado.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <CriarComunicadoDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este comunicado? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Comunicados;
