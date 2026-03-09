import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EventoAgenda, CORES_CATEGORIA } from '@/types/agenda';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  eventos: EventoAgenda[];
  getEventosDia: (data: Date) => EventoAgenda[];
  getEventosMes: (ano: number, mes: number) => EventoAgenda[];
  onDiaClick: (data: Date) => void;
  onNovoEvento: (data?: Date) => void;
  dataSelecionada: Date;
  setDataSelecionada: (d: Date) => void;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export function CalendarView({
  getEventosDia,
  onDiaClick,
  onNovoEvento,
  dataSelecionada,
  setDataSelecionada,
}: CalendarViewProps) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [visualizacao, setVisualizacao] = useState<'mensal' | 'semanal'>('mensal');

  const hoje = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const diasMes = useMemo(() => {
    const ano = mesAtual.getFullYear();
    const mes = mesAtual.getMonth();
    const primeiroDia = new Date(ano, mes, 1);
    const ultimoDia = new Date(ano, mes + 1, 0);
    const diasAntes = primeiroDia.getDay();

    const dias: { data: Date; foraDoMes: boolean }[] = [];

    for (let i = diasAntes - 1; i >= 0; i--) {
      const d = new Date(ano, mes, -i);
      dias.push({ data: d, foraDoMes: true });
    }

    for (let i = 1; i <= ultimoDia.getDate(); i++) {
      dias.push({ data: new Date(ano, mes, i), foraDoMes: false });
    }

    const restante = 42 - dias.length;
    for (let i = 1; i <= restante; i++) {
      dias.push({ data: new Date(ano, mes + 1, i), foraDoMes: true });
    }

    return dias;
  }, [mesAtual]);

  const diasSemana = useMemo(() => {
    const inicio = new Date(dataSelecionada);
    inicio.setDate(inicio.getDate() - inicio.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(inicio);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [dataSelecionada]);

  const navegar = (dir: number) => {
    setMesAtual(prev => {
      const n = new Date(prev);
      if (visualizacao === 'mensal') {
        n.setMonth(n.getMonth() + dir);
      } else {
        n.setDate(n.getDate() + dir * 7);
      }
      return n;
    });
  };

  const isHoje = (d: Date) => d.toDateString() === hoje.toDateString();
  const isSelecionado = (d: Date) => d.toDateString() === dataSelecionada.toDateString();

  return (
    <div className="space-y-3" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navegar(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-base font-semibold text-foreground min-w-[160px] text-center" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
            {MESES[mesAtual.getMonth()]} {mesAtual.getFullYear()}
          </h3>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navegar(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              setMesAtual(new Date());
              setDataSelecionada(new Date());
            }}
          >
            Hoje
          </Button>
          <Tabs value={visualizacao} onValueChange={v => setVisualizacao(v as any)}>
            <TabsList className="h-7">
              <TabsTrigger value="mensal" className="text-xs px-2 h-6">Mês</TabsTrigger>
              <TabsTrigger value="semanal" className="text-xs px-2 h-6">Semana</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

       {/* Dias da semana header */}
       <div className="grid grid-cols-7 gap-px" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
         {DIAS_SEMANA.map(d => (
           <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1.5">
             {d}
           </div>
         ))}
       </div>

      {/* Grid */}
      {visualizacao === 'mensal' ? (
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {diasMes.map(({ data, foraDoMes }, i) => {
            const eventosD = getEventosDia(data);
            return (
              <button
                key={i}
                onClick={() => {
                  setDataSelecionada(data);
                  onDiaClick(data);
                }}
                className={cn(
                  'relative bg-card p-1 min-h-[68px] sm:min-h-[80px] text-left transition-colors hover:bg-accent/50 focus-ring',
                  foraDoMes && 'opacity-40',
                  isSelecionado(data) && 'ring-2 ring-primary ring-inset',
                )}
              >
                <span className={cn(
                  'inline-flex items-center justify-center h-6 w-6 text-xs rounded-full font-medium',
                  isHoje(data) && 'bg-primary text-primary-foreground',
                )}>
                  {data.getDate()}
                </span>
                <div className="mt-0.5 space-y-0.5 overflow-hidden">
                  {eventosD.slice(0, 3).map((ev, j) => (
                    <div
                      key={j}
                      className="text-[10px] leading-tight truncate rounded px-1 py-px text-white font-medium"
                      style={{ backgroundColor: ev.cor || CORES_CATEGORIA[ev.categoria] }}
                    >
                      {ev.titulo}
                    </div>
                  ))}
                  {eventosD.length > 3 && (
                    <span className="text-[10px] text-muted-foreground pl-1">+{eventosD.length - 3}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {diasSemana.map((data, i) => {
            const eventosD = getEventosDia(data);
            return (
              <button
                key={i}
                onClick={() => {
                  setDataSelecionada(data);
                  onDiaClick(data);
                }}
                className={cn(
                  'bg-card p-2 min-h-[200px] text-left transition-colors hover:bg-accent/50 focus-ring',
                  isSelecionado(data) && 'ring-2 ring-primary ring-inset',
                )}
              >
                <div className="text-center mb-2">
                  <span className="text-xs text-muted-foreground block">{DIAS_SEMANA[data.getDay()]}</span>
                  <span className={cn(
                    'inline-flex items-center justify-center h-8 w-8 text-sm rounded-full font-semibold',
                    isHoje(data) && 'bg-primary text-primary-foreground',
                  )}>
                    {data.getDate()}
                  </span>
                </div>
                <div className="space-y-1">
                  {eventosD.map((ev, j) => (
                    <div
                      key={j}
                      className="text-[10px] sm:text-xs leading-tight truncate rounded px-1.5 py-0.5 text-white font-medium"
                      style={{ backgroundColor: ev.cor || CORES_CATEGORIA[ev.categoria] }}
                    >
                      {!ev.diaInteiro && (
                        <span className="opacity-80">
                          {new Date(ev.dataInicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}{' '}
                        </span>
                      )}
                      {ev.titulo}
                    </div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* FAB */}
      <Button
        size="sm"
        className="w-full gap-2"
        onClick={() => onNovoEvento(dataSelecionada)}
      >
        <Plus className="h-4 w-4" />
        Novo Evento
      </Button>
    </div>
  );
}
