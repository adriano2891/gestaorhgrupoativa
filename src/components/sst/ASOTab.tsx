import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, AlertTriangle, CheckCircle, Download, Paperclip, Upload, X, FileText } from "lucide-react";
import { useASOs, useCreateASO, useDeleteASO } from "@/hooks/useSST";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { SSTDocumentosPanel } from "./SSTDocumentosPanel";
import { useUploadSSTDocumento } from "@/hooks/useSSTDocumentos";
import { gerarPdfASO } from "@/utils/sstPdfGenerator";
import { format, isPast, addDays } from "date-fns";
import { toast } from "sonner";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
const MAX_SIZE = 20 * 1024 * 1024;

export const ASOTab = () => {
  const { data: asos, isLoading } = useASOs();
  const { data: funcionarios } = useFuncionarios();
  const createASO = useCreateASO();
  const deleteASO = useDeleteASO();
  const uploadDoc = useUploadSSTDocumento();
  const [open, setOpen] = useState(false);
  const [docsDialogId, setDocsDialogId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const formFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    user_id: "", tipo: "periodico", data_exame: "", data_vencimento: "",
    resultado: "apto", medico_nome: "", crm: "", observacoes: "",
  });

  const handleSubmit = () => {
    if (!form.user_id || !form.data_exame) return;
    createASO.mutate({
      ...form,
      data_vencimento: form.data_vencimento || null,
    } as any, { onSuccess: () => { setOpen(false); resetForm(); } });
  };

  const resetForm = () => setForm({
    user_id: "", tipo: "periodico", data_exame: "", data_vencimento: "",
    resultado: "apto", medico_nome: "", crm: "", observacoes: "",
  });

  const getStatusBadge = (aso: any) => {
    if (!aso.data_vencimento) return <Badge variant="outline">Sem vencimento</Badge>;
    if (isPast(new Date(aso.data_vencimento))) return <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Vencido</Badge>;
    const thirtyDays = addDays(new Date(), 30);
    if (new Date(aso.data_vencimento) <= thirtyDays) return <Badge className="bg-yellow-500/10 text-yellow-700 border-yellow-300" variant="outline">Vence em breve</Badge>;
    return <Badge className="bg-green-500/10 text-green-700 border-green-300" variant="outline"><CheckCircle className="h-3 w-3 mr-1" />Válido</Badge>;
  };

  const tipoLabel: Record<string, string> = {
    admissional: "Admissional", periodico: "Periódico", demissional: "Demissional",
    retorno_trabalho: "Retorno ao Trabalho", mudanca_funcao: "Mudança de Função",
  };

  const resultadoLabel: Record<string, string> = {
    apto: "Apto", inapto: "Inapto", apto_com_restricao: "Apto c/ Restrição",
  };

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const selectedAso = asos?.find(a => a.id === docsDialogId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>ASO — Atestados de Saúde Ocupacional</CardTitle>
            <CardDescription>NR-7 (PCMSO) — Controle de exames médicos obrigatórios</CardDescription>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-1"><Plus className="h-4 w-4" />Novo ASO</Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!asos || asos.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">Nenhum ASO registrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data Exame</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Médico</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {asos.map(aso => (
                  <TableRow key={aso.id}>
                    <TableCell className="font-medium">{aso._nome || "—"}</TableCell>
                    <TableCell>{tipoLabel[aso.tipo] || aso.tipo}</TableCell>
                    <TableCell>{format(new Date(aso.data_exame), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{aso.data_vencimento ? format(new Date(aso.data_vencimento), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell>
                      <Badge variant={aso.resultado === 'inapto' ? 'destructive' : 'outline'}>
                        {resultadoLabel[aso.resultado] || aso.resultado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">{aso.medico_nome || "—"}{aso.crm ? ` (CRM ${aso.crm})` : ""}</TableCell>
                    <TableCell>{getStatusBadge(aso)}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDocsDialogId(aso.id)} title="Documentos">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => gerarPdfASO(aso)} title="Baixar PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteASO.mutate(aso.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Dialog Novo ASO */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar ASO</DialogTitle></DialogHeader>
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admissional">Admissional</SelectItem>
                    <SelectItem value="periodico">Periódico</SelectItem>
                    <SelectItem value="demissional">Demissional</SelectItem>
                    <SelectItem value="retorno_trabalho">Retorno ao Trabalho</SelectItem>
                    <SelectItem value="mudanca_funcao">Mudança de Função</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Resultado *</Label>
                <Select value={form.resultado} onValueChange={v => setForm(p => ({ ...p, resultado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="apto">Apto</SelectItem>
                    <SelectItem value="inapto">Inapto</SelectItem>
                    <SelectItem value="apto_com_restricao">Apto c/ Restrição</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data do Exame *</Label>
                <Input type="date" value={form.data_exame} onChange={e => setForm(p => ({ ...p, data_exame: e.target.value }))} />
              </div>
              <div>
                <Label>Vencimento</Label>
                <Input type="date" value={form.data_vencimento} onChange={e => setForm(p => ({ ...p, data_vencimento: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Médico</Label>
                <Input value={form.medico_nome} onChange={e => setForm(p => ({ ...p, medico_nome: e.target.value }))} placeholder="Dr. Nome" />
              </div>
              <div>
                <Label>CRM</Label>
                <Input value={form.crm} onChange={e => setForm(p => ({ ...p, crm: e.target.value }))} placeholder="CRM/SP 123456" />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createASO.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Documentos */}
      <Dialog open={!!docsDialogId} onOpenChange={(o) => !o && setDocsDialogId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Documentos — ASO {selectedAso?._nome || ""}</DialogTitle>
          </DialogHeader>
          {docsDialogId && (
            <SSTDocumentosPanel registroTipo="aso" registroId={docsDialogId} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
