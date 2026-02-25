import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SuperAdminAuthDialog } from "./SuperAdminAuthDialog";

interface RegistroFolga {
  id: string;
  user_id: string;
  employee_name: string;
  data: string;
  entrada?: string;
  saida?: string;
  total_horas?: string;
}

interface AutorizacaoFolgaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registros: RegistroFolga[];
  onDecisaoTomada: () => void;
}

export const AutorizacaoFolgaDialog = ({
  open,
  onOpenChange,
  registros,
  onDecisaoTomada,
}: AutorizacaoFolgaDialogProps) => {
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authorizedAdmin, setAuthorizedAdmin] = useState<{ id: string; name: string } | null>(null);
  const [pendingAction, setPendingAction] = useState<{ registro: RegistroFolga; decisao: "autorizado_he" | "invalidado" } | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAction = (registro: RegistroFolga, decisao: "autorizado_he" | "invalidado") => {
    setPendingAction({ registro, decisao });
    if (!authorizedAdmin) {
      setShowAuthDialog(true);
    }
  };

  const handleAdminAuthorized = (adminId: string, adminName: string) => {
    setAuthorizedAdmin({ id: adminId, name: adminName });
  };

  const handleConfirm = async () => {
    if (!pendingAction || !authorizedAdmin) return;
    if (!justificativa.trim()) {
      toast.error("Justificativa é obrigatória");
      return;
    }

    setLoading(true);
    try {
      const { registro, decisao } = pendingAction;

      // Update registros_ponto status
      const newStatus = decisao === "autorizado_he" ? "validado" : "invalidado";
      const { error: updateError } = await (supabase as any)
        .from("registros_ponto")
        .update({ status_validacao: newStatus })
        .eq("id", registro.id);

      if (updateError) throw updateError;

      // Insert authorization log
      const { error: logError } = await (supabase as any)
        .from("logs_autorizacao_folga")
        .insert({
          registro_ponto_id: registro.id,
          employee_id: registro.user_id,
          employee_name: registro.employee_name,
          data_registro: registro.data,
          decisao,
          justificativa: justificativa.trim(),
          autorizado_por: authorizedAdmin.id,
          autorizado_por_nome: authorizedAdmin.name,
        });

      if (logError) throw logError;

      toast.success(
        decisao === "autorizado_he"
          ? "Registro autorizado como hora extra"
          : "Registro invalidado com sucesso"
      );

      setPendingAction(null);
      setJustificativa("");
      onDecisaoTomada();
    } catch (error: any) {
      console.error("Erro ao processar decisão:", error);
      toast.error("Erro ao processar decisão: " + (error.message || "Tente novamente"));
    } finally {
      setLoading(false);
    }
  };

  const pendingRegistros = registros.filter((r) => true); // all passed are pending

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <DialogTitle>Registros em Dia de Folga (12x36)</DialogTitle>
            </div>
            <DialogDescription>
              Os registros abaixo foram realizados em dias configurados como folga na escala 12x36.
              Cada registro requer autorização de um Super Administrador ou Admin RH.
            </DialogDescription>
          </DialogHeader>

          {authorizedAdmin && (
            <Badge variant="outline" className="w-fit text-xs">
              <Shield className="h-3 w-3 mr-1" />
              Autorizado por: {authorizedAdmin.name}
            </Badge>
          )}

          <div className="space-y-4">
            {pendingRegistros.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum registro pendente de autorização.
              </p>
            ) : (
              pendingRegistros.map((registro) => (
                <div
                  key={registro.id}
                  className="border rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{registro.employee_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Data: {new Date(registro.data + "T12:00:00").toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      Folga 12x36
                    </Badge>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Entrada:</span>{" "}
                      {registro.entrada
                        ? new Date(registro.entrada).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        : "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Saída:</span>{" "}
                      {registro.saida
                        ? new Date(registro.saida).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
                        : "-"}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>{" "}
                      {registro.total_horas || "-"}
                    </div>
                  </div>

                  {pendingAction?.registro.id === registro.id && authorizedAdmin ? (
                    <div className="space-y-3 border-t pt-3">
                      <div className="space-y-2">
                        <Label>
                          Justificativa <span className="text-destructive">*</span>
                        </Label>
                        <Textarea
                          value={justificativa}
                          onChange={(e) => setJustificativa(e.target.value)}
                          placeholder="Informe a justificativa para esta decisão..."
                          rows={3}
                          disabled={loading}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleConfirm}
                          disabled={loading || !justificativa.trim()}
                          className="flex-1"
                          variant={pendingAction.decisao === "autorizado_he" ? "default" : "destructive"}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : pendingAction.decisao === "autorizado_he" ? (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          ) : (
                            <XCircle className="h-4 w-4 mr-2" />
                          )}
                          {pendingAction.decisao === "autorizado_he" ? "Confirmar como HE" : "Confirmar Invalidação"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setPendingAction(null);
                            setJustificativa("");
                          }}
                          disabled={loading}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-green-700 border-green-300 hover:bg-green-50"
                        onClick={() => handleAction(registro, "autorizado_he")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Autorizar HE
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 text-red-700 border-red-300 hover:bg-red-50"
                        onClick={() => handleAction(registro, "invalidado")}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Invalidar
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <SuperAdminAuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthorized={handleAdminAuthorized}
        actionDescription="autorizar registros de ponto em dia de folga"
      />
    </>
  );
};
