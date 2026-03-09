import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, FileCheck, AlertTriangle, Clock, CheckCircle, Upload, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, isPast, addDays, differenceInDays } from "date-fns";

interface DocSSTValidade {
  id: string;
  tipo: string;
  nome: string;
  data_emissao: string;
  data_validade: string;
  responsavel: string | null;
  arquivo_url: string | null;
  observacoes: string | null;
}

const tipoLabels: Record<string, string> = {
  pgr: "PGR — Programa de Gerenciamento de Riscos",
  pcmso: "PCMSO — Programa de Controle Médico",
  ltcat: "LTCAT — Laudo Técnico das Condições Ambientais",
  ppra: "PPRA — Programa de Prevenção de Riscos",
  laudo_insalubridade: "Laudo de Insalubridade",
  laudo_periculosidade: "Laudo de Periculosidade",
  aet: "AET — Análise Ergonômica do Trabalho",
  outros: "Outros",
};

export const DocumentosSSTValidadeCard = () => {
  const [docs, setDocs] = useState<DocSSTValidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    tipo: "pgr", nome: "", data_emissao: "", data_validade: "", responsavel: "", observacoes: "",
  });

  const load = async () => {
    try {
      const { data } = await (supabase as any)
        .from("documentos_sst_validade")
        .select("*")
        .order("data_validade", { ascending: true });
      setDocs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.nome || !form.data_emissao || !form.data_validade) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    try {
      const { error } = await (supabase as any).from("documentos_sst_validade").insert({
        ...form,
        responsavel: form.responsavel || null,
        observacoes: form.observacoes || null,
      });
      if (error) throw error;
      toast.success("Documento SST registrado");
      setDialogOpen(false);
      setForm({ tipo: "pgr", nome: "", data_emissao: "", data_validade: "", responsavel: "", observacoes: "" });
      load();
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("documentos_sst_validade").delete().eq("id", id);
    toast.success("Documento removido");
    load();
  };

  const getStatusBadge = (doc: DocSSTValidade) => {
    const hoje = new Date();
    const validade = new Date(doc.data_validade);
    const dias = differenceInDays(validade, hoje);

    if (dias < 0) return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Vencido há {Math.abs(dias)}d</Badge>;
    if (dias <= 30) return <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 gap-1" variant="outline"><Clock className="h-3 w-3" />{dias}d restantes</Badge>;
    if (dias <= 90) return <Badge className="bg-amber-500/10 text-amber-700 border-amber-300" variant="outline">{dias}d restantes</Badge>;
    return <Badge variant="outline" className="gap-1"><CheckCircle className="h-3 w-3 text-green-600" />Válido</Badge>;
  };

  const vencidos = docs.filter(d => isPast(new Date(d.data_validade)));
  const aVencer = docs.filter(d => {
    const dias = differenceInDays(new Date(d.data_validade), new Date());
    return dias >= 0 && dias <= 60;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5 text-primary" />
              Documentos SST — Controle de Validade
            </CardTitle>
            <CardDescription>PGR (NR-1) · PCMSO (NR-7) · LTCAT · Laudos</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-1"><Plus className="h-4 w-4" />Novo Documento</Button>
        </div>
        {(vencidos.length > 0 || aVencer.length > 0) && (
          <div className="flex gap-2 mt-2">
            {vencidos.length > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {vencidos.length} vencido{vencidos.length > 1 ? "s" : ""}
              </Badge>
            )}
            {aVencer.length > 0 && (
              <Badge className="bg-amber-500/10 text-amber-700 border-amber-300 gap-1" variant="outline">
                <Clock className="h-3 w-3" />
                {aVencer.length} a vencer
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum documento SST cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Emissão</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map(doc => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">{doc.tipo.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">{doc.nome}</TableCell>
                    <TableCell className="text-sm">{format(new Date(doc.data_emissao), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-sm">{format(new Date(doc.data_validade), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-sm">{doc.responsavel || "—"}</TableCell>
                    <TableCell>{getStatusBadge(doc)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Registrar Documento SST</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(tipoLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nome do Documento *</Label>
              <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: PGR 2024 — Empresa X" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data Emissão *</Label>
                <Input type="date" value={form.data_emissao} onChange={e => setForm(p => ({ ...p, data_emissao: e.target.value }))} />
              </div>
              <div>
                <Label>Validade *</Label>
                <Input type="date" value={form.data_validade} onChange={e => setForm(p => ({ ...p, data_validade: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Responsável Técnico</Label>
              <Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} placeholder="Eng. / Médico do Trabalho" />
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
