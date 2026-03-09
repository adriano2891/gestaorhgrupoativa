import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Trash2 } from 'lucide-react';
import { EventoAgenda, CategoriaEvento, RecorrenciaTipo, CORES_CATEGORIA, LABELS_CATEGORIA } from '@/types/agenda';

interface EventoDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  evento?: EventoAgenda | null;
  dataInicial?: Date;
  onSalvar: (data: Omit<EventoAgenda, 'id' | 'criadoEm' | 'concluido'>) => void;
  onEditar: (id: string, data: Partial<EventoAgenda>) => void;
  onExcluir: (id: string) => void;
  conflitos?: EventoAgenda[];
}

function toLocalDatetime(d: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventoDialog({
  open, onOpenChange, evento, dataInicial, onSalvar, onEditar, onExcluir, conflitos = [],
}: EventoDialogProps) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [diaInteiro, setDiaInteiro] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaEvento>('reuniao');
  const [recorrencia, setRecorrencia] = useState<RecorrenciaTipo>('nenhuma');
  const [lembrete, setLembrete] = useState<number>(15);
  const [local, setLocal] = useState('');

  useEffect(() => {
    if (evento) {
      setTitulo(evento.titulo);
      setDescricao(evento.descricao || '');
      setDataInicio(toLocalDatetime(new Date(evento.dataInicio)));
      setDataFim(toLocalDatetime(new Date(evento.dataFim)));
      setDiaInteiro(evento.diaInteiro);
      setCategoria(evento.categoria);
      setRecorrencia(evento.recorrencia);
      setLembrete(evento.lembrete || 15);
      setLocal(evento.local || '');
    } else {
      const base = dataInicial || new Date();
      const inicio = new Date(base);
      inicio.setHours(9, 0, 0, 0);
      const fim = new Date(base);
      fim.setHours(10, 0, 0, 0);
      setTitulo('');
      setDescricao('');
      setDataInicio(toLocalDatetime(inicio));
      setDataFim(toLocalDatetime(fim));
      setDiaInteiro(false);
      setCategoria('reuniao');
      setRecorrencia('nenhuma');
      setLembrete(15);
      setLocal('');
    }
  }, [evento, dataInicial, open]);

  const handleSalvar = () => {
    if (!titulo.trim() || !dataInicio || !dataFim) return;
    const dados = {
      titulo: titulo.trim(),
      descricao: descricao.trim() || undefined,
      dataInicio: new Date(dataInicio).toISOString(),
      dataFim: new Date(dataFim).toISOString(),
      diaInteiro,
      categoria,
      cor: CORES_CATEGORIA[categoria],
      recorrencia,
      lembrete,
      local: local.trim() || undefined,
    };

    if (evento) {
      onEditar(evento.id, dados);
    } else {
      onSalvar(dados);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{evento ? 'Editar Evento' : 'Novo Evento'}</DialogTitle>
          <DialogDescription>
            {evento ? 'Altere os dados do evento.' : 'Preencha os dados para criar um novo evento.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
          <div>
            <Label>Título *</Label>
            <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Nome do evento" />
          </div>

          <div>
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={v => setCategoria(v as CategoriaEvento)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LABELS_CATEGORIA).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full inline-block" style={{ backgroundColor: CORES_CATEGORIA[k as CategoriaEvento] }} />
                      {v}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={diaInteiro} onCheckedChange={setDiaInteiro} id="dia-inteiro" />
            <Label htmlFor="dia-inteiro">Dia inteiro</Label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Início *</Label>
              <Input
                type={diaInteiro ? 'date' : 'datetime-local'}
                value={diaInteiro ? dataInicio.split('T')[0] : dataInicio}
                onChange={e => setDataInicio(diaInteiro ? `${e.target.value}T00:00` : e.target.value)}
              />
            </div>
            <div>
              <Label>Fim *</Label>
              <Input
                type={diaInteiro ? 'date' : 'datetime-local'}
                value={diaInteiro ? dataFim.split('T')[0] : dataFim}
                onChange={e => setDataFim(diaInteiro ? `${e.target.value}T23:59` : e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Recorrência</Label>
            <Select value={recorrencia} onValueChange={v => setRecorrencia(v as RecorrenciaTipo)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nenhuma">Nenhuma</SelectItem>
                <SelectItem value="diaria">Diária</SelectItem>
                <SelectItem value="semanal">Semanal</SelectItem>
                <SelectItem value="mensal">Mensal</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Lembrete</Label>
            <Select value={String(lembrete)} onValueChange={v => setLembrete(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 minutos antes</SelectItem>
                <SelectItem value="15">15 minutos antes</SelectItem>
                <SelectItem value="30">30 minutos antes</SelectItem>
                <SelectItem value="60">1 hora antes</SelectItem>
                <SelectItem value="1440">1 dia antes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Local</Label>
            <Input value={local} onChange={e => setLocal(e.target.value)} placeholder="Ex: Sala de reuniões" />
          </div>

          <div>
            <Label>Descrição</Label>
            <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes do evento" rows={3} />
          </div>

          {conflitos.length > 0 && (
            <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
              ⚠️ Conflito com {conflitos.length} evento(s): {conflitos.map(c => c.titulo).join(', ')}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {evento && (
            <Button variant="destructive" size="sm" onClick={() => { onExcluir(evento.id); onOpenChange(false); }}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSalvar} disabled={!titulo.trim()}>
            {evento ? 'Salvar' : 'Criar Evento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
