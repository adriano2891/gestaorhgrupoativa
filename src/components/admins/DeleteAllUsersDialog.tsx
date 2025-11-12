import { useState } from "react";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const DeleteAllUsersDialog = () => {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleDeleteAll = async () => {
    if (confirmText !== "EXCLUIR TUDO") {
      toast.error("Digite 'EXCLUIR TUDO' para confirmar");
      return;
    }

    setIsDeleting(true);

    try {
      const { data, error } = await supabase.functions.invoke("delete-all-users");

      if (error) throw error;

      toast.success(data.message || "Todos os usuários foram excluídos");
      
      // Invalidar todas as queries
      queryClient.invalidateQueries();
      
      // Fazer logout e redirecionar
      await supabase.auth.signOut();
      navigate("/login");
      
    } catch (error) {
      console.error("Erro ao excluir usuários:", error);
      toast.error("Erro ao excluir usuários. Verifique os logs.");
    } finally {
      setIsDeleting(false);
      setOpen(false);
      setConfirmText("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Trash2 className="h-4 w-4" />
          Excluir Todos os Funcionários
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            ⚠️ OPERAÇÃO CRÍTICA E IRREVERSÍVEL
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4 text-left">
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 space-y-2">
              <p className="font-semibold text-destructive">Esta ação irá:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Deletar TODOS os funcionários do sistema</li>
                <li>Remover todos os dados de autenticação (auth.users)</li>
                <li>Apagar todos os registros de ponto</li>
                <li>Excluir todas as solicitações de férias</li>
                <li>Remover todos os holerites</li>
                <li>Excluir dados pessoais: CPF, email, telefone, salário</li>
              </ul>
            </div>

            <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-500 rounded-lg p-4">
              <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                ⚠️ ESTA AÇÃO É IRREVERSÍVEL
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Não há como recuperar os dados após a exclusão. Todos os históricos serão perdidos permanentemente.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-foreground">
                Digite <span className="font-mono font-bold text-destructive">EXCLUIR TUDO</span> para confirmar:
              </Label>
              <Input
                id="confirm"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Digite: EXCLUIR TUDO"
                className="font-mono"
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDeleteAll}
            disabled={confirmText !== "EXCLUIR TUDO" || isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Confirmar Exclusão Total
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
