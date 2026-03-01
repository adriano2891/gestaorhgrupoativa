import { useNavigate } from "react-router-dom";
import { FileText, MoreVertical, Edit, Trash2, Copy, Users, ExternalLink, LayoutTemplate, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteFormulario, useCreateFormulario } from "@/hooks/useFormulariosRH";
import { CATEGORY_LABELS, STATUS_LABELS, type FormularioRH } from "@/types/formularios";
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
import { useState } from "react";
import { AtribuirFormularioDialog } from "./AtribuirFormularioDialog";

interface FormularioCardProps {
  formulario: FormularioRH;
  isTemplate?: boolean;
}

const statusColors: Record<string, string> = {
  rascunho: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  pendente_aprovacao: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  aprovado: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  publicado: "bg-green-500/10 text-green-600 border-green-500/20",
  arquivado: "bg-gray-500/10 text-gray-600 border-gray-500/20",
};

export const FormularioCard = ({ formulario, isTemplate }: FormularioCardProps) => {
  const navigate = useNavigate();
  const deleteFormulario = useDeleteFormulario();
  const createFormulario = useCreateFormulario();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAtribuirDialog, setShowAtribuirDialog] = useState(false);

  const handleView = () => {
    try {
      navigate(`/formularios-rh/${formulario.id}`);
    } catch (error) {
      console.error("Erro ao navegar para formulário:", error);
    }
  };

  const handleEdit = () => {
    try {
      navigate(`/formularios-rh/${formulario.id}`);
    } catch (error) {
      console.error("Erro ao navegar para edição:", error);
    }
  };

  const handleDuplicate = async () => {
    try {
      await createFormulario.mutateAsync({
        titulo: `${formulario.titulo} (Cópia)`,
        descricao: formulario.descricao || undefined,
        categoria: formulario.categoria,
        template_origem_id: isTemplate ? formulario.id : formulario.template_origem_id || undefined,
        departamento_destino: formulario.departamento_destino || undefined,
        requer_assinatura: formulario.requer_assinatura,
      });
    } catch (error) {
      console.error("Erro ao duplicar formulário:", error);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteFormulario.mutateAsync(formulario.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Erro ao excluir formulário:", error);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 hover:border-primary/30">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                {isTemplate ? (
                  <LayoutTemplate className="h-5 w-5 text-primary" />
                ) : formulario.arquivo_externo_url ? (
                  <ExternalLink className="h-5 w-5 text-primary" />
                ) : (
                  <FileText className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {formulario.titulo}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(formulario.created_at), "dd MMM yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/formularios-rh/${formulario.id}`)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDuplicate}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicar
                </DropdownMenuItem>
                {!isTemplate && (
                  <DropdownMenuItem onClick={() => setShowAtribuirDialog(true)}>
                    <Users className="h-4 w-4 mr-2" />
                    Atribuir
                  </DropdownMenuItem>
                )}
                {formulario.arquivo_externo_url && (
                  <DropdownMenuItem onClick={() => window.open(formulario.arquivo_externo_url!, '_blank')}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Arquivo
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          {formulario.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {formulario.descricao}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className={statusColors[formulario.status]}>
              {STATUS_LABELS[formulario.status]}
            </Badge>
            <Badge variant="secondary">
              {CATEGORY_LABELS[formulario.categoria]}
            </Badge>
            {formulario.requer_assinatura && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                Assinatura
              </Badge>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleView}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
          </div>

          {formulario.profiles?.nome && (
            <p className="text-xs text-muted-foreground mt-3">
              Criado por: {formulario.profiles.nome}
            </p>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir formulário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O formulário "{formulario.titulo}" e todos os seus dados serão permanentemente excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!isTemplate && (
        <AtribuirFormularioDialog
          open={showAtribuirDialog}
          onOpenChange={setShowAtribuirDialog}
          formularioId={formulario.id}
        />
      )}
    </>
  );
};
