import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, AlertTriangle, Download, Paperclip } from "lucide-react";
import { useCATs, useCreateCAT, useUpdateCAT } from "@/hooks/useSST";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { SSTDocumentosPanel } from "./SSTDocumentosPanel";
import { gerarPdfCAT } from "@/utils/sstPdfGenerator";
import { format } from "date-fns";

export const CATTab = () => {
  const { data: cats, isLoading } = useCATs();
  const { data: funcionarios } = useFuncionarios();
  const createCAT = useCreateCAT();
  const updateCAT = useUpdateCAT();
  const [open, setOpen] = useState(false);
  const [docsDialogId, setDocsDialogId] = useState<string | null>(null);
  const [form, setForm] = useState({
    user_id: "", data_acidente: "", hora_acidente: "", tipo: "tipico",
    local_acidente: "", descricao: "", parte_corpo: "", agente_causador: "",
    testemunha_1: "", testemunha_2: "", houve_afastamento: false,
    dias_afastamento: 0, numero_cat: "", observacoes: "",
  });

  const handleSubmit = () => {
    if (!form.user_id || !form.data_acidente || !form.descricao) return;
    createCAT.mutate({
      ...form,
      hora_acidente: form.hora_acidente || null,
      local_acidente: form.local_acidente || null,
      parte_corpo: form.parte_corpo || null,
      agente_causador: form.agente_causador || null,
      testemunha_1: form.testemunha_1 || null,
      testemunha_2: form.testemunha_2 || null,
      numero_cat: form.numero_cat || null,
      observacoes: form.observacoes || null,
    } as any, { onSuccess: () => { setOpen(false); resetForm(); } });
  };

  const resetForm = () => setForm({
    user_id: "", data_acidente: "", hora_acidente: "", tipo: "tipico",
    local_acidente: "", descricao: "", parte_corpo: "", agente_causador: "",
    testemunha_1: "", testemunha_2: "", houve_afastamento: false,
    dias_afastamento: 0, numero_cat: "", observacoes: "",
  });

  const tipoLabel: Record<string, string> = {
    tipico: "Típico", trajeto: "Trajeto", doenca_ocupacional: "Doença Ocupacional",
  };

  const statusBadge = (status: string) => {
    if (status === 'registrado') return <Badge variant="outline">Registrado</Badge>;
    if (status === 'enviado_inss') return <Badge className="bg-blue-500/10 text-blue-700 border-blue-300" variant="outline">Enviado INSS</Badge>;
    if (status === 'concluido') return <Badge className="bg-green-500/10 text-green-700 border-green-300" variant="outline">Concluído</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const selectedCat = cats?.find(c => c.id === docsDialogId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              CAT — Comunicação de Acidente de Trabalho
            </CardTitle>
            <CardDescription>Lei 8.213/91 — Registro obrigatório em até 24h após o acidente</CardDescription>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-1" variant="destructive"><Plus className="h-4 w-4" />Registrar CAT</Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!cats || cats.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">Nenhuma CAT registrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Afastamento</TableHead>
                  <TableHead>Nº CAT</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cats.map(cat => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat._nome || "—"}</TableCell>
                    <TableCell>{format(new Date(cat.data_acidente), "dd/MM/yyyy")}{cat.hora_acidente ? ` ${cat.hora_acidente.substring(0,5)}` : ""}</TableCell>
                    <TableCell>{tipoLabel[cat.tipo] || cat.tipo}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{cat.descricao}</TableCell>
                    <TableCell>
                      {cat.houve_afastamento ? (
                        <Badge variant="destructive">{cat.dias_afastamento} dias</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">{cat.numero_cat || "—"}</TableCell>
                    <TableCell>{statusBadge(cat.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDocsDialogId(cat.id)} title="Documentos">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => gerarPdfCAT(cat)} title="Baixar PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        {cat.status === 'registrado' && (
                          <Button variant="outline" size="sm" onClick={() => updateCAT.mutate({ id: cat.id, status: 'enviado_inss' })}>
                            Enviar INSS
                          </Button>
                        )}
                        {cat.status === 'enviado_inss' && (
                          <Button variant="outline" size="sm" onClick={() => updateCAT.mutate({ id: cat.id, status: 'concluido' })}>
                            Concluir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog Novo CAT */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar CAT</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Funcionário *</Label>
              <Select value={form.user_id} onValueChange={v => setForm(p => ({ ...p, user_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {funcionarios?.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Data do Acidente *</Label>
                <Input type="date" value={form.data_acidente} onChange={e => setForm(p => ({ ...p, data_acidente: e.target.value }))} />
              </div>
              <div>
                <Label>Hora</Label>
                <Input type="time" value={form.hora_acidente} onChange={e => setForm(p => ({ ...p, hora_acidente: e.target.value }))} />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tipico">Típico</SelectItem>
                    <SelectItem value="trajeto">Trajeto</SelectItem>
                    <SelectItem value="doenca_ocupacional">Doença Ocupacional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Local do Acidente</Label>
              <Input value={form.local_acidente} onChange={e => setForm(p => ({ ...p, local_acidente: e.target.value }))} placeholder="Onde ocorreu" />
            </div>
            <div>
              <Label>Descrição do Acidente *</Label>
              <Textarea value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descreva o acidente em detalhes" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Parte do Corpo Atingida</Label>
                <Input value={form.parte_corpo} onChange={e => setForm(p => ({ ...p, parte_corpo: e.target.value }))} placeholder="Ex: Mão esquerda" />
              </div>
              <div>
                <Label>Agente Causador</Label>
                <Input value={form.agente_causador} onChange={e => setForm(p => ({ ...p, agente_causador: e.target.value }))} placeholder="Ex: Máquina, Queda" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Testemunha 1</Label>
                <Input value={form.testemunha_1} onChange={e => setForm(p => ({ ...p, testemunha_1: e.target.value }))} />
              </div>
              <div>
                <Label>Testemunha 2</Label>
                <Input value={form.testemunha_2} onChange={e => setForm(p => ({ ...p, testemunha_2: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.houve_afastamento} onCheckedChange={v => setForm(p => ({ ...p, houve_afastamento: v }))} />
                <Label>Houve afastamento?</Label>
              </div>
              {form.houve_afastamento && (
                <div className="flex items-center gap-2">
                  <Label>Dias:</Label>
                  <Input type="number" min={0} value={form.dias_afastamento} onChange={e => setForm(p => ({ ...p, dias_afastamento: parseInt(e.target.value) || 0 }))} className="w-20" />
                </div>
              )}
            </div>
            <div>
              <Label>Nº CAT (se já emitida)</Label>
              <Input value={form.numero_cat} onChange={e => setForm(p => ({ ...p, numero_cat: e.target.value }))} />
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createCAT.isPending} variant="destructive">Registrar CAT</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Documentos */}
      <Dialog open={!!docsDialogId} onOpenChange={(o) => !o && setDocsDialogId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Documentos — CAT {selectedCat?._nome || ""}</DialogTitle>
          </DialogHeader>
          {docsDialogId && (
            <SSTDocumentosPanel registroTipo="cat" registroId={docsDialogId} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
