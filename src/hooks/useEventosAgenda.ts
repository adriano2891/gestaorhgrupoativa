import { useState, useEffect, useCallback, useMemo } from 'react';
import { EventoAgenda, RecorrenciaTipo } from '@/types/agenda';

const STORAGE_KEY = 'agenda_eventos';

function gerarId(): string {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2, 11);
}

function carregarEventos(): EventoAgenda[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function salvarEventos(eventos: EventoAgenda[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(eventos));
}

function gerarEventosRecorrentes(evento: EventoAgenda, inicioRange: Date, fimRange: Date): EventoAgenda[] {
  if (evento.recorrencia === 'nenhuma') return [evento];

  const resultados: EventoAgenda[] = [];
  const inicio = new Date(evento.dataInicio);
  const duracao = new Date(evento.dataFim).getTime() - inicio.getTime();
  let atual = new Date(inicio);
  let i = 0;

  while (atual <= fimRange && i < 365) {
    if (atual >= inicioRange || (atual.getTime() + duracao) >= inicioRange.getTime()) {
      resultados.push({
        ...evento,
        id: i === 0 ? evento.id : `${evento.id}_rec_${i}`,
        dataInicio: atual.toISOString(),
        dataFim: new Date(atual.getTime() + duracao).toISOString(),
      });
    }

    switch (evento.recorrencia) {
      case 'diaria':
        atual = new Date(atual);
        atual.setDate(atual.getDate() + 1);
        break;
      case 'semanal':
        atual = new Date(atual);
        atual.setDate(atual.getDate() + 7);
        break;
      case 'mensal':
        atual = new Date(atual);
        atual.setMonth(atual.getMonth() + 1);
        break;
      case 'anual':
        atual = new Date(atual);
        atual.setFullYear(atual.getFullYear() + 1);
        break;
      default:
        return resultados;
    }
    i++;
  }

  return resultados;
}

export function useEventosAgenda() {
  const [eventos, setEventos] = useState<EventoAgenda[]>(carregarEventos);

  useEffect(() => {
    salvarEventos(eventos);
  }, [eventos]);

  const criarEvento = useCallback((data: Omit<EventoAgenda, 'id' | 'criadoEm' | 'concluido'>) => {
    const novo: EventoAgenda = {
      ...data,
      id: gerarId(),
      concluido: false,
      criadoEm: new Date().toISOString(),
    };
    setEventos(prev => [...prev, novo]);
    return novo;
  }, []);

  const editarEvento = useCallback((id: string, data: Partial<EventoAgenda>) => {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
  }, []);

  const excluirEvento = useCallback((id: string) => {
    setEventos(prev => prev.filter(e => e.id !== id));
  }, []);

  const toggleConcluido = useCallback((id: string) => {
    setEventos(prev => prev.map(e => e.id === id ? { ...e, concluido: !e.concluido } : e));
  }, []);

  const getEventosDia = useCallback((data: Date) => {
    const inicio = new Date(data);
    inicio.setHours(0, 0, 0, 0);
    const fim = new Date(data);
    fim.setHours(23, 59, 59, 999);

    return eventos.flatMap(e => gerarEventosRecorrentes(e, inicio, fim))
      .filter(e => {
        const ei = new Date(e.dataInicio);
        const ef = new Date(e.dataFim);
        return ei <= fim && ef >= inicio;
      })
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime());
  }, [eventos]);

  const getEventosMes = useCallback((ano: number, mes: number) => {
    const inicio = new Date(ano, mes, 1);
    const fim = new Date(ano, mes + 1, 0, 23, 59, 59);

    return eventos.flatMap(e => gerarEventosRecorrentes(e, inicio, fim))
      .filter(e => {
        const ei = new Date(e.dataInicio);
        const ef = new Date(e.dataFim);
        return ei <= fim && ef >= inicio;
      });
  }, [eventos]);

  const getProximosEventos = useCallback((limite = 5) => {
    const agora = new Date();
    const futuro = new Date();
    futuro.setDate(futuro.getDate() + 30);

    return eventos.flatMap(e => gerarEventosRecorrentes(e, agora, futuro))
      .filter(e => new Date(e.dataInicio) >= agora)
      .sort((a, b) => new Date(a.dataInicio).getTime() - new Date(b.dataInicio).getTime())
      .slice(0, limite);
  }, [eventos]);

  const getOcupacaoDia = useCallback((data: Date) => {
    const eventosDia = getEventosDia(data).filter(e => !e.diaInteiro);
    let minutosOcupados = 0;
    eventosDia.forEach(e => {
      const duracao = (new Date(e.dataFim).getTime() - new Date(e.dataInicio).getTime()) / 60000;
      minutosOcupados += Math.min(duracao, 480);
    });
    return Math.min(Math.round((minutosOcupados / 480) * 100), 100);
  }, [getEventosDia]);

  const verificarConflitos = useCallback((novoEvento: { dataInicio: string; dataFim: string; id?: string }) => {
    const ni = new Date(novoEvento.dataInicio);
    const nf = new Date(novoEvento.dataFim);
    return eventos.filter(e => {
      if (e.id === novoEvento.id) return false;
      const ei = new Date(e.dataInicio);
      const ef = new Date(e.dataFim);
      return ni < ef && nf > ei;
    });
  }, [eventos]);

  return {
    eventos,
    criarEvento,
    editarEvento,
    excluirEvento,
    toggleConcluido,
    getEventosDia,
    getEventosMes,
    getProximosEventos,
    getOcupacaoDia,
    verificarConflitos,
  };
}
