import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Users, Calendar, Download, Paperclip } from "lucide-react";
import { useCIPAMembros, useCreateCIPAMembro, useDeleteCIPAMembro, useCIPAReunioes, useCreateCIPAReuniao } from "@/hooks/useSST";
import { SSTDocumentosPanel } from "./SSTDocumentosPanel";
import { gerarPdfCIPAMembro, gerarPdfCIPAReuniao } from "@/utils/sstPdfGenerator";
import { format, isPast } from "date-fns";

export const CIPATab = () => {
  const { data: membros, isLoading: loadingMembros } = useCIPAMembros();
  const { data: reunioes, isLoading: loadingReunioes } = useCIPAReunioes();
  const createMembro = useCreateCIPAMembro();
  const deleteMembro = useDeleteCIPAMembro();
  const createReuniao = useCreateCIPAReuniao();
  const [openMembro, setOpenMembro] = useState(false);
  const [openReuniao, setOpenReuniao] = useState(false);
  const [docsDialog, setDocsDialog] = useState<{ tipo: string; id: string; nome: string } | null>(null);

  const [membroForm, setMembroForm] = useState({
    nome: "", cargo_cipa: "membro", representacao: "empregado",
    tipo: "titular", mandato_inicio: "", mandato_fim: "",
  });

  const [reuniaoForm, setReuniaoForm] = useState({
    data_reuniao: "", tipo: "ordinaria", pauta: "", ata: "",
  });

  const handleSubmitMembro = () => {
    if (!membroForm.nome || !membroForm.mandato_inicio || !membroForm.mandato_fim) return;
    createMembro.mutate(membroForm as any, {
      onSuccess: () => { setOpenMembro(false); setMembroForm({ nome: "", cargo_cipa: "membro", representacao: "empregado", tipo: "titular", mandato_inicio: "", mandato_fim: "" }); },
    });
  };

  const handleSubmitReuniao = () => {
    if (!reuniaoForm.data_reuniao) return;
    createReuniao.mutate({
      ...reuniaoForm,
      pauta: reuniaoForm.pauta || null,
      ata: reuniaoForm.ata || null,
    } as any, {
      onSuccess: () => { setOpenReuniao(false); setReuniaoForm({ data_reuniao: "", tipo: "ordinaria", pauta: "", ata: "" }); },
    });
  };

  const isLoading = loadingMembros || loadingReunioes;
  if (isLoading) return <Skeleton className="h-64 w-full" />;

  const cargoLabel: Record<string, string> = {
    presidente: "Presidente", vice_presidente: "Vice-Presidente",
    secretario: "Secretário(a)", membro: "Membro",
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>CIPA — Comissão Interna de Prevenção de Acidentes</CardTitle>
          <CardDescription>NR-5 — Gestão de membros, mandatos e reuniões</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="membros">
          <TabsList>
            <TabsTrigger value="membros" className="gap-1"><Users className="h-4 w-4" />Membros</TabsTrigger>
            <TabsTrigger value="reunioes" className="gap-1"><Calendar className="h-4 w-4" />Reuniões</TabsTrigger>
          </TabsList>

          <TabsContent value="membros">
            <div className="flex justify-end mb-3">
              <Button onClick={() => setOpenMembro(true)} className="gap-1"><Plus className="h-4 w-4" />Novo Membro</Button>
            </div>
            {(!membros || membros.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum membro cadastrado.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Representação</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mandato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membros.map(m => (
                    <TableRow key={m.id}>
                      <TableCell className="font-medium">{m.nome}</TableCell>
                      <TableCell>{cargoLabel[m.cargo_cipa] || m.cargo_cipa}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {m.representacao === 'empregador' ? 'Empregador' : 'Empregado'}
                        </Badge>
                      </TableCell>
                      <TableCell>{m.tipo === 'titular' ? 'Titular' : 'Suplente'}</TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(m.mandato_inicio), "dd/MM/yy")} — {format(new Date(m.mandato_fim), "dd/MM/yy")}
                      </TableCell>
                      <TableCell>
                        {isPast(new Date(m.mandato_fim)) ? (
                          <Badge variant="destructive">Expirado</Badge>
                        ) : (
                          <Badge className="bg-green-500/10 text-green-700 border-green-300" variant="outline">Ativo</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDocsDialog({ tipo: "cipa_membro", id: m.id, nome: m.nome })} title="Documentos">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => gerarPdfCIPAMembro(m)} title="Baixar PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => deleteMembro.mutate(m.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="reunioes">
            <div className="flex justify-end mb-3">
              <Button onClick={() => setOpenReuniao(true)} className="gap-1"><Plus className="h-4 w-4" />Nova Reunião</Button>
            </div>
            {(!reunioes || reunioes.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">Nenhuma reunião registrada.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Pauta</TableHead>
                    <TableHead>Ata</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reunioes.map(r => (
                    <TableRow key={r.id}>
                      <TableCell>{format(new Date(r.data_reuniao), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.tipo === 'ordinaria' ? 'Ordinária' : 'Extraordinária'}</Badge>
                      </TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">{r.pauta || "—"}</TableCell>
                      <TableCell className="max-w-[300px] truncate text-sm">{r.ata || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setDocsDialog({ tipo: "cipa_reuniao", id: r.id, nome: format(new Date(r.data_reuniao), "dd/MM/yyyy") })} title="Documentos">
                            <Paperclip className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => gerarPdfCIPAReuniao(r)} title="Baixar PDF">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>

      {/* Dialog Membro */}
      <Dialog open={openMembro} onOpenChange={setOpenMembro}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Adicionar Membro CIPA</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nome *</Label>
              <Input value={membroForm.nome} onChange={e => setMembroForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cargo CIPA</Label>
                <Select value={membroForm.cargo_cipa} onValueChange={v => setMembroForm(p => ({ ...p, cargo_cipa: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="presidente">Presidente</SelectItem>
                    <SelectItem value="vice_presidente">Vice-Presidente</SelectItem>
                    <SelectItem value="secretario">Secretário(a)</SelectItem>
                    <SelectItem value="membro">Membro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Representação</Label>
                <Select value={membroForm.representacao} onValueChange={v => setMembroForm(p => ({ ...p, representacao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="empregador">Empregador</SelectItem>
                    <SelectItem value="empregado">Empregado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={membroForm.tipo} onValueChange={v => setMembroForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="titular">Titular</SelectItem>
                    <SelectItem value="suplente">Suplente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Início Mandato *</Label>
                <Input type="date" value={membroForm.mandato_inicio} onChange={e => setMembroForm(p => ({ ...p, mandato_inicio: e.target.value }))} />
              </div>
              <div>
                <Label>Fim Mandato *</Label>
                <Input type="date" value={membroForm.mandato_fim} onChange={e => setMembroForm(p => ({ ...p, mandato_fim: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenMembro(false)}>Cancelar</Button>
            <Button onClick={handleSubmitMembro} disabled={createMembro.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Reunião */}
      <Dialog open={openReuniao} onOpenChange={setOpenReuniao}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Registrar Reunião CIPA</DialogTitle></DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data *</Label>
                <Input type="date" value={reuniaoForm.data_reuniao} onChange={e => setReuniaoForm(p => ({ ...p, data_reuniao: e.target.value }))} />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select value={reuniaoForm.tipo} onValueChange={v => setReuniaoForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ordinaria">Ordinária</SelectItem>
                    <SelectItem value="extraordinaria">Extraordinária</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Pauta</Label>
              <Textarea value={reuniaoForm.pauta} onChange={e => setReuniaoForm(p => ({ ...p, pauta: e.target.value }))} rows={3} />
            </div>
            <div>
              <Label>Ata</Label>
              <Textarea value={reuniaoForm.ata} onChange={e => setReuniaoForm(p => ({ ...p, ata: e.target.value }))} rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenReuniao(false)}>Cancelar</Button>
            <Button onClick={handleSubmitReuniao} disabled={createReuniao.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Documentos */}
      <Dialog open={!!docsDialog} onOpenChange={(o) => !o && setDocsDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Documentos — {docsDialog?.nome || ""}</DialogTitle>
          </DialogHeader>
          {docsDialog && (
            <SSTDocumentosPanel registroTipo={docsDialog.tipo} registroId={docsDialog.id} />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
