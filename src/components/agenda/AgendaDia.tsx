import { useMemo } from 'react';
import { Clock, MapPin, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EventoAgenda, CORES_CATEGORIA, LABELS_CATEGORIA } from '@/types/agenda';
import { cn } from '@/lib/utils';

interface AgendaDiaProps {
  data: Date;
  eventos: EventoAgenda[];
  onEventoClick: (e: EventoAgenda) => void;
  onToggleConcluido: (id: string) => void;
}

export function AgendaDia({ data, eventos, onEventoClick, onToggleConcluido }: AgendaDiaProps) {
  const agora = new Date();

  const formatHora = (iso: string) =>
    new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const getStatus = (ev: EventoAgenda) => {
    if (ev.concluido) return 'concluido';
    const inicio = new Date(ev.dataInicio);
    const fim = new Date(ev.dataFim);
    if (agora >= inicio && agora <= fim) return 'em_andamento';
    if (agora > fim) return 'passado';
    return 'futuro';
  };

  if (eventos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Nenhum evento para este dia</p>
        <p className="text-xs mt-1">Clique em "Novo Evento" para adicionar</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-foreground">
        {data.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      </h4>
      <div className="space-y-1.5">
        {eventos.map(ev => {
          const status = getStatus(ev);
          return (
            <button
              key={ev.id}
              onClick={() => onEventoClick(ev)}
              className={cn(
                'w-full text-left rounded-lg border p-3 transition-all hover:shadow-md focus-ring',
                status === 'concluido' && 'opacity-60',
                status === 'em_andamento' && 'border-primary shadow-sm',
              )}
            >
              <div className="flex items-start gap-2.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleConcluido(ev.id); }}
                  className="mt-0.5 flex-shrink-0"
                >
                  {ev.concluido ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: ev.cor || CORES_CATEGORIA[ev.categoria] }}
                    />
                    <span className={cn('text-sm font-medium truncate', ev.concluido && 'line-through')}>
                      {ev.titulo}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {ev.diaInteiro ? (
                      <span>Dia inteiro</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatHora(ev.dataInicio)} - {formatHora(ev.dataFim)}
                      </span>
                    )}
                    {ev.local && (
                      <span className="flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3" />
                        {ev.local}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: ev.cor || CORES_CATEGORIA[ev.categoria], color: ev.cor || CORES_CATEGORIA[ev.categoria] }}>
                    {LABELS_CATEGORIA[ev.categoria]}
                  </Badge>
                  {status === 'em_andamento' && (
                    <Badge className="text-[10px] px-1.5 py-0 bg-primary text-primary-foreground animate-pulse">
                      Agora
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
