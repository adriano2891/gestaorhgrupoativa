import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { usePortalAuth } from "./PortalAuthProvider";

const getRestConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID || supabaseUrl.match(/\/\/([^.]+)/)?.[1];
  const storageKey = `sb-${projectRef}-auth-token`;
  let token = anonKey;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) token = JSON.parse(raw).access_token || anonKey;
  } catch {}
  return {
    url: supabaseUrl,
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
  };
};

interface SolicitarAjustePontoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSolicitacaoCriada?: () => void;
}

export const SolicitarAjustePontoDialog = ({ open, onOpenChange, onSolicitacaoCriada }: SolicitarAjustePontoDialogProps) => {
  const { profile } = usePortalAuth();
  const [loading, setLoading] = useState(false);
  const [dataRegistro, setDataRegistro] = useState("");
  const [campo, setCampo] = useState("");
  const [valorSolicitado, setValorSolicitado] = useState("");
  const [motivo, setMotivo] = useState("");

  const campos = [
    { value: "entrada", label: "Entrada" },
    { value: "saida_almoco", label: "Saída Almoço" },
    { value: "retorno_almoco", label: "Retorno Almoço" },
    { value: "saida", label: "Saída" },
    { value: "saida_pausa_1", label: "Saída Pausa 1" },
    { value: "retorno_pausa_1", label: "Retorno Pausa 1" },
    { value: "saida_pausa_2", label: "Saída Pausa 2" },
    { value: "retorno_pausa_2", label: "Retorno Pausa 2" },
    { value: "inicio_he", label: "Início HE" },
    { value: "fim_he", label: "Fim HE" },
  ];

  const handleSubmit = async () => {
    if (!dataRegistro || !campo || !valorSolicitado || !motivo.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    if (motivo.trim().length < 10) {
      toast.error("O motivo deve ter no mínimo 10 caracteres");
      return;
    }

    setLoading(true);
    try {
      const userId = profile?.id;
      if (!userId) throw new Error("Sessão expirada");

      const { url, headers } = getRestConfig();

      // Get original value if exists
      const checkRes = await fetch(
        `${url}/rest/v1/registros_ponto?user_id=eq.${userId}&data=eq.${dataRegistro}&select=id,${campo}&limit=1`,
        { headers: { apikey: headers.apikey, Authorization: headers.Authorization } }
      );
      const existing = checkRes.ok ? await checkRes.json() : [];
      const valorOriginal = existing?.[0]?.[campo] || null;

      const res = await fetch(`${url}/rest/v1/solicitacoes_ajuste_ponto`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: userId,
          registro_ponto_id: existing?.[0]?.id || null,
          data_registro: dataRegistro,
          campo,
          valor_original: valorOriginal ? new Date(valorOriginal).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "Sem registro",
          valor_solicitado: valorSolicitado,
          motivo: motivo.trim(),
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      toast.success("Solicitação de ajuste enviada com sucesso!", {
        description: "Aguarde a aprovação do gestor/administrador.",
      });

      setDataRegistro("");
      setCampo("");
      setValorSolicitado("");
      setMotivo("");
      onOpenChange(false);
      onSolicitacaoCriada?.();
    } catch (error: any) {
      console.error("Erro ao solicitar ajuste:", error);
      toast.error("Erro ao enviar solicitação", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Solicitar Ajuste de Ponto</DialogTitle>
          <DialogDescription>
            Preencha os dados para solicitar um ajuste. A solicitação será analisada pelo gestor.
            Conforme Portaria 671/2021, o registro original será preservado.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="data">Data do Registro *</Label>
            <Input
              id="data"
              type="date"
              value={dataRegistro}
              onChange={(e) => setDataRegistro(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <Label htmlFor="campo">Campo a Ajustar *</Label>
            <Select value={campo} onValueChange={setCampo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o campo" />
              </SelectTrigger>
              <SelectContent>
                {campos.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="valor">Horário Correto (HH:MM) *</Label>
            <Input
              id="valor"
              type="time"
              value={valorSolicitado}
              onChange={(e) => setValorSolicitado(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="motivo">Motivo da Solicitação * (mín. 10 caracteres)</Label>
            <Textarea
              id="motivo"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Descreva o motivo do ajuste..."
              maxLength={500}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Enviando..." : "Enviar Solicitação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
