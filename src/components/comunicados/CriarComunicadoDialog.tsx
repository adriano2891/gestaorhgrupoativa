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
  const [destinatariosTodos, setDestinatariosTodos] = useState(true);
  const [departamentosSelecionados, setDepartamentosSelecionados] = useState<string[]>([]);
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

  const createMutation = useMutation({
    mutationFn: async () => {
      const destinatarios = destinatariosTodos
        ? ["todos"]
        : departamentosSelecionados;

      const { error } = await supabase.from("comunicados").insert({
        titulo,
        conteudo,
        tipo,
        prioridade,
        destinatarios,
        data_expiracao: dataExpiracao?.toISOString() || null,
        ativo: true,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunicados-admin"] });
      toast.success("Comunicado criado com sucesso");
      handleClose();
    },
    onError: () => {
      toast.error("Erro ao criar comunicado");
    },
  });

  const handleClose = () => {
    setTitulo("");
    setConteudo("");
    setTipo("informativo");
    setPrioridade("normal");
    setDestinatariosTodos(true);
    setDepartamentosSelecionados([]);
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="todos"
                checked={destinatariosTodos}
                onCheckedChange={(checked) => {
                  setDestinatariosTodos(checked as boolean);
                  if (checked) setDepartamentosSelecionados([]);
                }}
              />
              <label
                htmlFor="todos"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enviar para todos os funcionários
              </label>
            </div>

            {!destinatariosTodos && departamentos && (
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
