import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle, Info } from "lucide-react";
import { format, differenceInDays, isBefore, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useCriarSolicitacaoFerias } from "@/hooks/useFerias";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PeriodoAquisitivo {
  id: string;
  data_inicio: string;
  data_fim: string;
  dias_disponiveis: number;
  dias_direito: number;
  dias_usados: number;
}

interface SolicitarFeriasDialogProps {
  periodos: PeriodoAquisitivo[];
}

export const SolicitarFeriasDialog = ({ periodos }: SolicitarFeriasDialogProps) => {
  const [open, setOpen] = useState(false);
  const [showIndisponivelDialog, setShowIndisponivelDialog] = useState(false);
  const [periodoSelecionado, setPeriodoSelecionado] = useState("");
  const [dataInicio, setDataInicio] = useState<Date>();
  const [dataFim, setDataFim] = useState<Date>();
  const [tipo, setTipo] = useState<"ferias" | "ferias_coletivas" | "abono_pecuniario">("ferias");
  const [observacao, setObservacao] = useState("");

  const criarSolicitacao = useCriarSolicitacaoFerias();

  const periodosElegiveis = useMemo(() => {
    const hoje = new Date();
    return periodos.filter((p) => {
      const fimPeriodo = parseISO(p.data_fim);
      return isBefore(fimPeriodo, hoje) && (p.dias_disponiveis ?? (p.dias_direito - p.dias_usados)) > 0;
    });
  }, [periodos]);

  const periodosEmAquisicao = useMemo(() => {
    const hoje = new Date();
    return periodos.filter((p) => {
      const fimPeriodo = parseISO(p.data_fim);
      return !isBefore(fimPeriodo, hoje);
    });
  }, [periodos]);

  const periodo = periodosElegiveis.find((p) => p.id === periodoSelecionado);
  const diasSolicitados = dataInicio && dataFim ? differenceInDays(dataFim, dataInicio) + 1 : 0;

  const podeAbrir = periodosElegiveis.length > 0;

  const periodoEmAndamento = periodosEmAquisicao[0];
  const diasRestantesAquisicao = periodoEmAndamento
    ? Math.max(0, differenceInDays(parseISO(periodoEmAndamento.data_fim), new Date()))
    : null;

  const handleClickSolicitar = () => {
    if (!podeAbrir) {
      setShowIndisponivelDialog(true);
    } else {
      setOpen(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodoSelecionado || !dataInicio || !dataFim) return;

    const diasDisp = periodo ? (periodo.dias_disponiveis ?? (periodo.dias_direito - periodo.dias_usados)) : 0;
    if (diasSolicitados > diasDisp) return;

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
    <>
      {/* Popup de indisponível */}
      <Dialog open={showIndisponivelDialog} onOpenChange={setShowIndisponivelDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <DialogTitle>Férias indisponíveis</DialogTitle>
            </div>
            <DialogDescription className="pt-3 text-sm leading-relaxed">
              {periodos.length === 0 ? (
                "Você ainda não possui períodos aquisitivos cadastrados. Entre em contato com o RH."
              ) : periodosEmAquisicao.length > 0 && diasRestantesAquisicao !== null ? (
                <>
                  Seu período aquisitivo está em andamento. Faltam{" "}
                  <strong className="text-foreground">{diasRestantesAquisicao} dias</strong> para completar os 12 meses
                  {periodoEmAndamento && (
                    <> ({format(parseISO(periodoEmAndamento.data_inicio), "dd/MM/yyyy", { locale: ptBR })} a{" "}
                    {format(parseISO(periodoEmAndamento.data_fim), "dd/MM/yyyy", { locale: ptBR })})</>
                  )}.
                </>
              ) : (
                "Todos os seus períodos aquisitivos já foram utilizados. Aguarde o próximo período."
              )}
            </DialogDescription>
          </DialogHeader>
          <Button variant="outline" className="w-full mt-2" onClick={() => setShowIndisponivelDialog(false)}>
            Entendi
          </Button>
        </DialogContent>
      </Dialog>

      {/* Botão único */}
      <Button className="w-full" onClick={handleClickSolicitar}>
        Solicitar Férias
      </Button>

      {/* Dialog de solicitação */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Solicitar Férias</DialogTitle>
          </DialogHeader>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 mb-2">
            <Info className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              Apenas períodos aquisitivos completos (12 meses de trabalho) são exibidos, conforme Art. 130 da CLT.
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="periodo">Período Aquisitivo</Label>
              <Select value={periodoSelecionado} onValueChange={setPeriodoSelecionado}>
                <SelectTrigger id="periodo">
                  <SelectValue placeholder="Selecione o período" />
                </SelectTrigger>
                <SelectContent>
                  {periodosElegiveis.map((p) => {
                    const disp = p.dias_disponiveis ?? (p.dias_direito - p.dias_usados);
                    return (
                      <SelectItem key={p.id} value={p.id}>
                        {format(parseISO(p.data_inicio), "dd/MM/yyyy", { locale: ptBR })} -{" "}
                        {format(parseISO(p.data_fim), "dd/MM/yyyy", { locale: ptBR })} ({disp} dias disponíveis)
                      </SelectItem>
                    );
                  })}
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
                    className={cn("w-full justify-start text-left font-normal", !dataInicio && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataInicio ? format(dataInicio, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataInicio} onSelect={setDataInicio} initialFocus className="pointer-events-auto" disabled={(date) => date < new Date()} />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data de Fim</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !dataFim && "text-muted-foreground")}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dataFim ? format(dataFim, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dataFim} onSelect={setDataFim} initialFocus className="pointer-events-auto" disabled={(date) => !dataInicio || date < dataInicio} />
                </PopoverContent>
              </Popover>
            </div>

            {diasSolicitados > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">Dias solicitados: {diasSolicitados}</p>
                {periodo && diasSolicitados > (periodo.dias_disponiveis ?? (periodo.dias_direito - periodo.dias_usados)) && (
                  <p className="text-sm text-destructive mt-1">Você não tem saldo suficiente neste período</p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="observacao">Observação (opcional)</Label>
              <Textarea id="observacao" value={observacao} onChange={(e) => setObservacao(e.target.value)} placeholder="Adicione uma observação se necessário" rows={3} />
            </div>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">Cancelar</Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={!periodoSelecionado || !dataInicio || !dataFim || (periodo ? diasSolicitados > (periodo.dias_disponiveis ?? (periodo.dias_direito - periodo.dias_usados)) : false) || criarSolicitacao.isPending}
              >
                {criarSolicitacao.isPending ? "Enviando..." : "Solicitar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
