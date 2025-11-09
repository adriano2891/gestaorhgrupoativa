import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCriarSolicitacaoFerias } from "@/hooks/useFerias";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SolicitarFeriasDialogProps {
  periodos: Array<{
    id: string;
    data_inicio: string;
    data_fim: string;
    dias_disponiveis: number;
  }>;
}

export const SolicitarFeriasDialog = ({ periodos }: SolicitarFeriasDialogProps) => {
  const [open, setOpen] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [tipo, setTipo] = useState<"ferias" | "ferias_coletivas" | "abono_pecuniario">("ferias");
  const [observacao, setObservacao] = useState("");

  const criarSolicitacao = useCriarSolicitacaoFerias();

  const periodo = periodos.find((p) => p.id === periodoSelecionado);
  const diasSolicitados = dataInicio && dataFim ? differenceInDays(dataFim, dataInicio) + 1 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!periodoSelecionado || !dataInicio || !dataFim) {
      return;
    }

    if (periodo && diasSolicitados > periodo.dias_disponiveis) {
      return;
    }

    await criarSolicitacao.mutateAsync({
      periodo_aquisitivo_id: periodoSelecionado,
      data_inicio: format(dataInicio, "yyyy-MM-dd"),
      data_fim: format(dataFim, "yyyy-MM-dd"),
      dias_solicitados: diasSolicitados,
      tipo,
      observacao: observacao || undefined,
    });

    setOpen(false);
    setPeriodoSelecionado("");
    setDataInicio(undefined);
    setDataFim(undefined);
    setTipo("ferias");
    setObservacao("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">Solicitar Férias</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Férias</DialogTitle>
        </DialogHeader>
        
        {periodos.length === 0 ? (
          <div className="py-8 text-center space-y-4">
            <p className="text-muted-foreground">
              Você ainda não possui períodos aquisitivos cadastrados.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o RH para cadastrar seus períodos de férias.
            </p>
            <Button onClick={() => setOpen(false)} className="w-full">
              Entendi
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodo">Período Aquisitivo</Label>
              <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                <SelectTrigger id="periodo">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {format(new Date(p.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                      {format(new Date(p.data_fim), "dd/MM/yyyy", { locale: ptBR })} ({p.dias_disponiveis}{" "}
                      dias disponíveis)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ferias">Férias</SelectItem>
                <SelectItem value="ferias_coletivas">Férias Coletivas</SelectItem>
                <SelectItem value="abono_pecuniario">Abono Pecuniário</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataInicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={setDataInicio}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => date < new Date()}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data de Fim</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataFim && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataFim}
                  onSelect={setDataFim}
                  initialFocus
                  className="pointer-events-auto"
                  disabled={(date) => !dataInicio || date < dataInicio}
                />
              </PopoverContent>
            </Popover>
          </div>

          {diasSolicitados > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">Dias solicitados: {diasSolicitados}</p>
              {periodo && diasSolicitados > periodo.dias_disponiveis && (
                <p className="text-sm text-destructive mt-1">
                  Você não tem saldo suficiente neste período
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação (opcional)</Label>
            <Textarea
              id="observacao"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Adicione uma observação se necessário"
              rows={3}
            />
          </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={
                  !periodoSelecionado ||
                  !dataInicio ||
                  !dataFim ||
                  (periodo ? diasSolicitados > periodo.dias_disponiveis : false) ||
                  criarSolicitacao.isPending
                }
              >
                {criarSolicitacao.isPending ? "Enviando..." : "Solicitar"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
