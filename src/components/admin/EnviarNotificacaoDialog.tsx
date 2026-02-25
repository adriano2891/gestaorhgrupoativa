import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const EnviarNotificacaoDialog = ({ open, onOpenChange }: Props) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [titulo, setTitulo] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [tipo, setTipo] = useState("info");
  const [prioridade, setPrioridade] = useState("normal");
  const [destinatarioTipo, setDestinatarioTipo] = useState("todos");
  const [destinatarioDepartamento, setDestinatarioDepartamento] = useState("");
  const [destinatarioId, setDestinatarioId] = useState("");

  // Fetch departments for selection
  const { data: departamentos = [] } = useQuery({
    queryKey: ["departamentos-unicos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("departamento")
        .not("departamento", "is", null);
      if (error) throw error;
      const unique = [...new Set(data.map((d: any) => d.departamento).filter(Boolean))];
      return unique as string[];
    },
  });

  // Fetch employees for individual selection
  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, departamento, user_roles!inner(role)")
        .eq("user_roles.role", "funcionario")
        .order("nome");
      if (error) throw error;
      return data as { id: string; nome: string; departamento: string | null }[];
    },
    enabled: destinatarioTipo === "individual",
  });

  const enviarMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        titulo,
        mensagem,
        tipo,
        prioridade,
        destinatario_tipo: destinatarioTipo,
        criado_por: user?.id,
      };

      if (destinatarioTipo === "departamento") {
        payload.destinatario_departamento = destinatarioDepartamento;
      } else if (destinatarioTipo === "individual") {
        payload.destinatario_id = destinatarioId;
      }

      const { error } = await (supabase as any).from("notificacoes").insert(payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notificação enviada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["admin-notificacoes"] });
      resetForm();
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao enviar notificação");
    },
  });

  const resetForm = () => {
    setTitulo("");
    setMensagem("");
    setTipo("info");
    setPrioridade("normal");
    setDestinatarioTipo("todos");
    setDestinatarioDepartamento("");
    setDestinatarioId("");
  };

  const canSubmit = titulo.trim() && mensagem.trim() &&
    (destinatarioTipo === "todos" ||
      (destinatarioTipo === "departamento" && destinatarioDepartamento) ||
      (destinatarioTipo === "individual" && destinatarioId));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Notificação</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Título</Label>
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Atualização importante"
            />
          </div>

          <div>
            <Label>Mensagem</Label>
            <Textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Descreva a notificação..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Informativo</SelectItem>
                  <SelectItem value="aviso">Aviso</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="tarefa">Tarefa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Destinatários</Label>
            <Select value={destinatarioTipo} onValueChange={setDestinatarioTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Funcionários</SelectItem>
                <SelectItem value="departamento">Por Departamento</SelectItem>
                <SelectItem value="individual">Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {destinatarioTipo === "departamento" && (
            <div>
              <Label>Departamento</Label>
              <Select value={destinatarioDepartamento} onValueChange={setDestinatarioDepartamento}>
                <SelectTrigger><SelectValue placeholder="Selecionar departamento" /></SelectTrigger>
                <SelectContent>
                  {departamentos.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {destinatarioTipo === "individual" && (
            <div>
              <Label>Funcionário</Label>
              <Select value={destinatarioId} onValueChange={setDestinatarioId}>
                <SelectTrigger><SelectValue placeholder="Selecionar funcionário" /></SelectTrigger>
                <SelectContent>
                  {funcionarios.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.nome} {f.departamento ? `(${f.departamento})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => enviarMutation.mutate()}
            disabled={!canSubmit || enviarMutation.isPending}
          >
            {enviarMutation.isPending ? "Enviando..." : "Enviar Notificação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
