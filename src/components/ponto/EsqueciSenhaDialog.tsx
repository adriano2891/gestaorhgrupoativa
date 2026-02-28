import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";

interface EsqueciSenhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EsqueciSenhaDialog = ({ open, onOpenChange }: EsqueciSenhaDialogProps) => {
  const [cpf, setCpf] = useState("");
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erros, setErros] = useState<{ cpf?: string; nome?: string }>({});

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return numbers.slice(0, 11);
  };

  const validarCPF = (cpfValue: string): boolean => {
    const numbers = cpfValue.replace(/\D/g, "");
    if (numbers.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(numbers)) return false;
    return true;
  };

  const validar = (): boolean => {
    const novosErros: { cpf?: string; nome?: string } = {};
    
    if (!validarCPF(cpf)) {
      novosErros.cpf = "CPF inválido. Insira um CPF com 11 dígitos.";
    }
    
    if (!nomeCompleto.trim()) {
      novosErros.nome = "Nome completo é obrigatório.";
    } else if (nomeCompleto.trim().length < 3) {
      novosErros.nome = "Nome deve ter pelo menos 3 caracteres.";
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleEnviar = async () => {
    if (!validar()) return;
    setLoading(true);

    try {
      // Look up user by CPF
      const { data: userData, error: userError } = await supabase
        .rpc("get_email_by_cpf", { cpf_input: cpf.replace(/\D/g, "") });

      if (userError || !userData || userData.length === 0) {
        toast.error("CPF não encontrado no sistema.");
        setLoading(false);
        return;
      }

      const userId = userData[0].user_id;

      // Create chamado for password recovery
      const { error: chamadoError } = await supabase
        .from("chamados_suporte")
        .insert({
          user_id: userId,
          assunto: `Recuperação de Senha - ${nomeCompleto.trim()}`,
          categoria: "outros",
          status: "aberto",
        });

      if (chamadoError) {
        console.error("Erro ao criar chamado:", chamadoError);
        toast.error("Erro ao enviar solicitação. Tente novamente.");
        setLoading(false);
        return;
      }

      setSucesso(true);
    } catch (err) {
      console.error("Erro inesperado:", err);
      toast.error("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCpf("");
    setNomeCompleto("");
    setErros({});
    setSucesso(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Recuperação de Senha</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para solicitar uma nova senha.
          </DialogDescription>
        </DialogHeader>

        {sucesso ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
            <p className="text-sm text-muted-foreground">
              Solicitação recebida, a nova senha será enviada para seu contato de WhatsApp.
            </p>
            <Button onClick={handleClose} className="w-full">OK</Button>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf-recuperar">CPF</Label>
                <Input
                  id="cpf-recuperar"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => {
                    setCpf(formatCPF(e.target.value));
                    setErros((prev) => ({ ...prev, cpf: undefined }));
                  }}
                  maxLength={14}
                />
                {erros.cpf && <p className="text-xs text-destructive">{erros.cpf}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome-recuperar">Nome Completo</Label>
                <Input
                  id="nome-recuperar"
                  type="text"
                  placeholder="Digite seu nome completo"
                  value={nomeCompleto}
                  onChange={(e) => {
                    setNomeCompleto(e.target.value);
                    setErros((prev) => ({ ...prev, nome: undefined }));
                  }}
                  maxLength={100}
                />
                {erros.nome && <p className="text-xs text-destructive">{erros.nome}</p>}
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleEnviar} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Enviar
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
