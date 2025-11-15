import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CriarComunicadoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CriarComunicadoDialog = ({
  open,
  onOpenChange,
}: CriarComunicadoDialogProps) => {
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [tipo, setTipo] = useState("informativo");
  const [prioridade, setPrioridade] = useState("normal");
  const [tipoDestinatario, setTipoDestinatario] = useState<"todos" | "departamentos" | "funcionarios">("todos");
  const [departamentosSelecionados, setDepartamentosSelecionados] = useState<string[]>([]);
  const [funcionariosSelecionados, setFuncionariosSelecionados] = useState<string[]>([]);
  const [dataExpiracao, setDataExpiracao] = useState<Date | undefined>();
  const queryClient = useQueryClient();

  const { data: departamentos } = useQuery({
    queryKey: ["departamentos-comunicados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("departamento")
        .not("departamento", "is", null);

      if (error) throw error;

      const uniqueDepts = Array.from(
        new Set(data.map((p) => p.departamento).filter(Boolean))
      );
      return uniqueDepts as string[];
    },
  });

  const { data: funcionarios } = useQuery({
    queryKey: ["funcionarios-comunicados"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, nome, email, departamento")
        .order("nome", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      let destinatarios: string[] = [];
      
      if (tipoDestinatario === "todos") {
        destinatarios = ["todos"];
      } else if (tipoDestinatario === "departamentos") {
        destinatarios = departamentosSelecionados;
      } else if (tipoDestinatario === "funcionarios") {
        destinatarios = funcionariosSelecionados;
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      console.log("Criando comunicado com dados:", {
        titulo,
        conteudo,
        tipo,
        prioridade,
        destinatarios,
        criado_por: user.id,
        data_expiracao: dataExpiracao?.toISOString() || null,
        ativo: true,
      });

      const { data, error } = await supabase.from("comunicados").insert({
        titulo,
        conteudo,
        tipo,
        prioridade,
        destinatarios,
        criado_por: user.id,
        data_expiracao: dataExpiracao?.toISOString() || null,
        ativo: true,
      }).select();

      if (error) {
        console.error("Erro ao criar comunicado:", error);
        throw error;
      }
      
      console.log("Comunicado criado com sucesso:", data);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunicados-admin"] });
      toast.success("Comunicado criado com sucesso");
      handleClose();
    },
    onError: (error: any) => {
      console.error("Erro na mutation:", error);
      toast.error(error.message || "Erro ao criar comunicado");
    },
  });

  const handleClose = () => {
    setTitulo("");
    setConteudo("");
    setTipo("informativo");
    setPrioridade("normal");
    setTipoDestinatario("todos");
    setDepartamentosSelecionados([]);
    setFuncionariosSelecionados([]);
    setDataExpiracao(undefined);
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate();
  };

  const toggleDepartamento = (dept: string) => {
    setDepartamentosSelecionados((prev) =>
      prev.includes(dept) ? prev.filter((d) => d !== dept) : [...prev, dept]
    );
  };

  const toggleFuncionario = (funcId: string) => {
    setFuncionariosSelecionados((prev) =>
      prev.includes(funcId) ? prev.filter((id) => id !== funcId) : [...prev, funcId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Novo Comunicado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Aviso importante sobre horário de funcionamento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conteudo">Conteúdo *</Label>
            <Textarea
              id="conteudo"
              value={conteudo}
              onChange={(e) => setConteudo(e.target.value)}
              placeholder="Digite o conteúdo do comunicado..."
              rows={5}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger id="tipo">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="informativo">Informativo</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                  <SelectItem value="evento">Evento</SelectItem>
                  <SelectItem value="aviso">Aviso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prioridade">Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger id="prioridade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Data de Expiração (Opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataExpiracao && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataExpiracao ? (
                    format(dataExpiracao, "dd/MM/yyyy", { locale: ptBR })
                  ) : (
                    "Selecione uma data"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataExpiracao}
                  onSelect={setDataExpiracao}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-3">
            <Label>Destinatários</Label>
            <RadioGroup value={tipoDestinatario} onValueChange={(value: any) => {
              setTipoDestinatario(value);
              setDepartamentosSelecionados([]);
              setFuncionariosSelecionados([]);
            }}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="todos" id="todos" />
                <label
                  htmlFor="todos"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enviar para todos os funcionários
                </label>
              </div>
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="departamentos" id="departamentos" />
                <label
                  htmlFor="departamentos"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enviar para departamentos específicos
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="funcionarios" id="funcionarios" />
                <label
                  htmlFor="funcionarios"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Enviar para funcionários específicos
                </label>
              </div>
            </RadioGroup>

            {tipoDestinatario === "departamentos" && departamentos && (
              <div className="space-y-2 pl-6 border-l-2 border-border">
                <Label className="text-sm text-muted-foreground">
                  Selecione os departamentos:
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {departamentos.map((dept) => (
                    <div key={dept} className="flex items-center space-x-2">
                      <Checkbox
                        id={dept}
                        checked={departamentosSelecionados.includes(dept)}
                        onCheckedChange={() => toggleDepartamento(dept)}
                      />
                      <label
                        htmlFor={dept}
                        className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tipoDestinatario === "funcionarios" && funcionarios && (
              <div className="space-y-2 pl-6 border-l-2 border-border">
                <Label className="text-sm text-muted-foreground">
                  Selecione os funcionários ({funcionariosSelecionados.length} selecionados):
                </Label>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <div className="space-y-2">
                    {funcionarios.map((func) => (
                      <div key={func.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={func.id}
                          checked={funcionariosSelecionados.includes(func.id)}
                          onCheckedChange={() => toggleFuncionario(func.id)}
                        />
                        <label
                          htmlFor={func.id}
                          className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{func.nome}</span>
                            <span className="text-xs text-muted-foreground">{func.email} • {func.departamento || "Sem departamento"}</span>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Criando..." : "Criar Comunicado"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
