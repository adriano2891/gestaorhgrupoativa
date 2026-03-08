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
import { Plus, Trash2, ShieldCheck, Download, Paperclip, Upload, X, FileText } from "lucide-react";
import { useEPIEntregas, useCreateEPI, useDeleteEPI } from "@/hooks/useSST";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { SSTDocumentosPanel } from "./SSTDocumentosPanel";
import { useUploadSSTDocumento } from "@/hooks/useSSTDocumentos";
import { gerarPdfEPI } from "@/utils/sstPdfGenerator";
import { format } from "date-fns";
import { toast } from "sonner";

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
const MAX_SIZE = 20 * 1024 * 1024;

export const EPITab = () => {
  const { data: epis, isLoading } = useEPIEntregas();
  const { data: funcionarios } = useFuncionarios();
  const createEPI = useCreateEPI();
  const deleteEPI = useDeleteEPI();
  const uploadDoc = useUploadSSTDocumento();
  const [open, setOpen] = useState(false);
  const [docsDialogId, setDocsDialogId] = useState<string | null>(null);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const formFileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    user_id: "", nome_epi: "", ca_numero: "", data_entrega: "",
    quantidade: 1, observacoes: "",
  });

  const handleSubmit = () => {
    if (!form.user_id || !form.nome_epi || !form.data_entrega) return;
    createEPI.mutate({
      ...form,
      ca_numero: form.ca_numero || null,
      observacoes: form.observacoes || null,
    } as any, {
      onSuccess: (data: any) => {
        const recordId = data?.[0]?.id;
        if (recordId && pendingFiles.length > 0) {
          pendingFiles.forEach(file => uploadDoc.mutate({ file, registroTipo: "epi", registroId: recordId }));
        }
        setOpen(false); resetForm(); setPendingFiles([]);
      }
    });
  };

  const handleAddFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) { toast.error("Formato não permitido. Use PDF, JPG ou PNG."); return; }
    if (file.size > MAX_SIZE) { toast.error("Arquivo muito grande. Máximo 20MB."); return; }
    setPendingFiles(prev => [...prev, file]);
    if (formFileRef.current) formFileRef.current.value = "";
  };

  const resetForm = () => setForm({
    user_id: "", nome_epi: "", ca_numero: "", data_entrega: "",
    quantidade: 1, observacoes: "",
  });

  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const selectedEpi = epis?.find(e => e.id === docsDialogId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>EPI — Equipamentos de Proteção Individual</CardTitle>
            <CardDescription>NR-6 — Registro de entrega e devolução de EPIs</CardDescription>
          </div>
          <Button onClick={() => setOpen(true)} className="gap-1"><Plus className="h-4 w-4" />Registrar Entrega</Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!epis || epis.length === 0) ? (
          <div className="text-center py-8 text-muted-foreground">Nenhuma entrega de EPI registrada.</div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>EPI</TableHead>
                  <TableHead>CA</TableHead>
                  <TableHead>Data Entrega</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Assinatura</TableHead>
                  <TableHead>Devolução</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {epis.map(epi => (
                  <TableRow key={epi.id}>
                    <TableCell className="font-medium">{epi._nome || "—"}</TableCell>
                    <TableCell>{epi.nome_epi}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{epi.ca_numero || "—"}</TableCell>
                    <TableCell>{format(new Date(epi.data_entrega), "dd/MM/yyyy")}</TableCell>
                    <TableCell>{epi.quantidade}</TableCell>
                    <TableCell>
                      {epi.assinado ? (
                        <Badge className="bg-green-500/10 text-green-700 border-green-300 gap-1" variant="outline">
                          <ShieldCheck className="h-3 w-3" />Assinado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Pendente</Badge>
                      )}
                    </TableCell>
                    <TableCell>{epi.data_devolucao ? format(new Date(epi.data_devolucao), "dd/MM/yyyy") : "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setDocsDialogId(epi.id)} title="Documentos">
                          <Paperclip className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => gerarPdfEPI(epi)} title="Baixar PDF">
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteEPI.mutate(epi.id)}>
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

      {/* Dialog Novo EPI */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Entrega de EPI</DialogTitle></DialogHeader>
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
                <Label>Nome do EPI *</Label>
                <Input value={form.nome_epi} onChange={e => setForm(p => ({ ...p, nome_epi: e.target.value }))} placeholder="Ex: Capacete, Luva, Óculos" />
              </div>
              <div>
                <Label>Nº CA (Certificado de Aprovação)</Label>
                <Input value={form.ca_numero} onChange={e => setForm(p => ({ ...p, ca_numero: e.target.value }))} placeholder="Ex: 12345" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data de Entrega *</Label>
                <Input type="date" value={form.data_entrega} onChange={e => setForm(p => ({ ...p, data_entrega: e.target.value }))} />
              </div>
              <div>
                <Label>Quantidade</Label>
                <Input type="number" min={1} value={form.quantidade} onChange={e => setForm(p => ({ ...p, quantidade: parseInt(e.target.value) || 1 }))} />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
            </div>
            <Separator />
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="flex items-center gap-1"><Paperclip className="h-3.5 w-3.5" />Anexar Documentos</Label>
                <div>
                  <input ref={formFileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleAddFile} />
                  <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => formFileRef.current?.click()}>
                    <Upload className="h-3 w-3" />Adicionar
                  </Button>
                </div>
              </div>
              {pendingFiles.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-2 border border-dashed rounded-md">Nenhum documento selecionado</p>
              ) : (
                <div className="space-y-1">
                  {pendingFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 p-1.5 rounded border bg-muted/30 text-sm">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate flex-1">{f.name}</span>
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleSubmit} disabled={createEPI.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Documentos */}
      <Dialog open={!!docsDialogId} onOpenChange={(o) => !o && setDocsDialogId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Documentos — EPI {selectedEpi?._nome || ""}</DialogTitle>
          </DialogHeader>
          {docsDialogId && (
            <SSTDocumentosPanel registroTipo="epi" registroId={docsDialogId} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
