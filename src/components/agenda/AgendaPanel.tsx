import { useState, useMemo } from 'react';
import { CalendarDays, Clock, TrendingUp, AlertTriangle, ChevronRight } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEventosAgenda } from '@/hooks/useEventosAgenda';
import { CalendarView } from './CalendarView';
import { EventoDialog } from './EventoDialog';
import { AgendaDia } from './AgendaDia';
import { EventoAgenda, CORES_CATEGORIA, LABELS_CATEGORIA } from '@/types/agenda';

interface AgendaPanelProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function AgendaPanel({ open, onOpenChange }: AgendaPanelProps) {
  const {
    eventos, criarEvento, editarEvento, excluirEvento, toggleConcluido,
    getEventosDia, getEventosMes, getProximosEventos, getOcupacaoDia, verificarConflitos,
  } = useEventosAgenda();

  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [eventoDialog, setEventoDialog] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<EventoAgenda | null>(null);
  const [dataNovoEvento, setDataNovoEvento] = useState<Date | undefined>();
  const [tab, setTab] = useState('calendario');

  const eventosDia = useMemo(() => getEventosDia(dataSelecionada), [getEventosDia, dataSelecionada]);
  const proximos = useMemo(() => getProximosEventos(8), [getProximosEventos]);
  const ocupacao = useMemo(() => getOcupacaoDia(new Date()), [getOcupacaoDia]);

  const lembretes = useMemo(() => {
    const agora = new Date();
    return proximos.filter(e => {
      if (!e.lembrete) return false;
      const inicio = new Date(e.dataInicio);
      const diff = (inicio.getTime() - agora.getTime()) / 60000;
      return diff > 0 && diff <= e.lembrete;
    });
  }, [proximos]);

  const conflitosAtual = useMemo(() => {
    if (!eventoDialog || !dataNovoEvento) return [];
    return verificarConflitos({
      dataInicio: dataNovoEvento.toISOString(),
      dataFim: new Date(dataNovoEvento.getTime() + 3600000).toISOString(),
      id: eventoEditando?.id,
    });
  }, [eventoDialog, dataNovoEvento, verificarConflitos, eventoEditando]);

  const handleNovoEvento = (data?: Date) => {
    setEventoEditando(null);
    setDataNovoEvento(data || new Date());
    setEventoDialog(true);
  };

  const handleEditarEvento = (ev: EventoAgenda) => {
    setEventoEditando(ev);
    setDataNovoEvento(undefined);
    setEventoDialog(true);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 flex flex-col" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
          <SheetHeader className="p-4 pb-2 border-b">
            <SheetTitle className="flex items-center gap-2 text-lg" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
              <CalendarDays className="h-5 w-5 text-primary" />
              Agenda
            </SheetTitle>
            <SheetDescription className="sr-only">Painel de agenda e calendário</SheetDescription>
          </SheetHeader>

           {/* Produtividade */}
           <div className="px-4 py-3 border-b bg-muted/30" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
             <div className="flex items-center justify-between mb-1.5">
               <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                 <TrendingUp className="h-3 w-3" /> Ocupação hoje
               </span>
               <span className="text-xs font-bold text-foreground">{ocupacao}%</span>
             </div>
             <Progress value={ocupacao} className="h-2" />
             <div className="flex items-center justify-between mt-1.5 text-[10px] text-muted-foreground">
               <span>{eventosDia.length} evento(s) hoje</span>
               <span>{100 - ocupacao}% livre</span>
             </div>
             {lembretes.length > 0 && (
               <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                 <AlertTriangle className="h-3 w-3" />
                 {lembretes.length} lembrete(s) ativo(s)
               </div>
             )}
           </div>

          <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
             <TabsList className="mx-4 mt-2 grid grid-cols-3 h-9" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
               <TabsTrigger value="calendario" className="text-xs" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Calendário</TabsTrigger>
               <TabsTrigger value="dia" className="text-xs" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Dia</TabsTrigger>
               <TabsTrigger value="proximos" className="text-xs" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Próximos</TabsTrigger>
             </TabsList>

            <ScrollArea className="flex-1">
              <TabsContent value="calendario" className="p-4 mt-0">
                <CalendarView
                  eventos={eventos}
                  getEventosDia={getEventosDia}
                  getEventosMes={getEventosMes}
                  onDiaClick={(d) => {
                    setDataSelecionada(d);
                    setTab('dia');
                    handleNovoEvento(d);
                  }}
                  onNovoEvento={handleNovoEvento}
                  dataSelecionada={dataSelecionada}
                  setDataSelecionada={setDataSelecionada}
                />
              </TabsContent>

              <TabsContent value="dia" className="p-4 mt-0">
                <AgendaDia
                  data={dataSelecionada}
                  eventos={eventosDia}
                  onEventoClick={handleEditarEvento}
                  onToggleConcluido={toggleConcluido}
                  onNovoEvento={handleNovoEvento}
                />
              </TabsContent>

               <TabsContent value="proximos" className="p-4 mt-0 space-y-4" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
                 <h4 className="text-sm font-semibold text-foreground" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>Próximos Eventos</h4>
                {proximos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum evento próximo</p>
                ) : (
                  <div className="space-y-2">
                    {proximos.map(ev => (
                      <button
                        key={ev.id}
                        onClick={() => handleEditarEvento(ev)}
                        className="w-full text-left rounded-lg border p-3 hover:shadow-md transition-all focus-ring"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: ev.cor || CORES_CATEGORIA[ev.categoria] }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ev.titulo}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(ev.dataInicio).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                              {!ev.diaInteiro && (
                                <> · {new Date(ev.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</>
                              )}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[10px]" style={{ borderColor: ev.cor, color: ev.cor }}>
                            {LABELS_CATEGORIA[ev.categoria]}
                          </Badge>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetContent>
      </Sheet>

      <EventoDialog
        open={eventoDialog}
        onOpenChange={setEventoDialog}
        evento={eventoEditando}
        dataInicial={dataNovoEvento}
        onSalvar={criarEvento}
        onEditar={editarEvento}
        onExcluir={excluirEvento}
        conflitos={conflitosAtual}
      />
    </>
  );
}
