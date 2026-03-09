import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, BookOpen, AlertTriangle, Paperclip, FileText, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { toast } from "sonner";
import { format, isPast } from "date-fns";

interface Convencao {
  id: string;
  nome: string;
  tipo: string;
  sindicato: string | null;
  data_inicio: string;
  data_fim: string;
  documento_url: string | null;
  documento_nome: string | null;
}

interface PisoSalarial {
  id: string;
  convencao_id: string;
  cargo: string;
  piso_salarial: number;
}

export const ConvencoesColetivasCard = () => {
  const [convencoes, setConvencoes] = useState<Convencao[]>([]);
  const [pisos, setPisos] = useState<PisoSalarial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pisoDialogOpen, setPisoDialogOpen] = useState(false);
  const [selectedConvencao, setSelectedConvencao] = useState<string | null>(null);
  const { data: funcionarios } = useFuncionarios();

  const [form, setForm] = useState({ nome: "", tipo: "cct", sindicato: "", data_inicio: "", data_fim: "" });
  const [pisoForm, setPisoForm] = useState({ cargo: "", piso_salarial: "" });
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      const { data: conv } = await (supabase as any).from("convencoes_coletivas").select("*").order("data_fim", { ascending: false });
      setConvencoes(conv || []);
      const { data: p } = await (supabase as any).from("pisos_salariais").select("*");
      setPisos(p || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const sanitizeFileName = (name: string) =>
    name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-").toLowerCase();

  const handleAddConvencao = async () => {
    if (!form.nome || !form.data_inicio || !form.data_fim) { toast.error("Preencha todos os campos obrigatórios"); return; }
    try {
      setUploading(true);
      let documento_url: string | null = null;
      let documento_nome: string | null = null;

      if (arquivo) {
        const safeName = sanitizeFileName(arquivo.name);
        const path = `convencoes/${Date.now()}-${safeName}`;
        const { error: upErr } = await supabase.storage.from("documentos").upload(path, arquivo);
        if (upErr) throw upErr;
        documento_url = path;
        documento_nome = arquivo.name;
      }

      const { error } = await (supabase as any).from("convencoes_coletivas").insert({
        ...form, sindicato: form.sindicato || null, documento_url, documento_nome,
      });
      if (error) throw error;
      toast.success("Convenção registrada");
      setDialogOpen(false);
      setForm({ nome: "", tipo: "cct", sindicato: "", data_inicio: "", data_fim: "" });
      setArquivo(null);
      load();
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadDoc = async (url: string, nome: string) => {
    try {
      const { data, error } = await supabase.storage.from("documentos").createSignedUrl(url, 300);
      if (error) throw error;
      window.open(data.signedUrl, "_blank");
    } catch (e: any) {
      toast.error("Erro ao abrir documento", { description: e.message });
    }
  };

  const handleAddPiso = async () => {
    if (!selectedConvencao || !pisoForm.cargo || !pisoForm.piso_salarial) { toast.error("Preencha todos os campos"); return; }
    try {
      const { error } = await (supabase as any).from("pisos_salariais").insert({
        convencao_id: selectedConvencao,
        cargo: pisoForm.cargo,
        piso_salarial: parseFloat(pisoForm.piso_salarial.replace(",", ".")),
      });
      if (error) throw error;
      toast.success("Piso salarial adicionado");
      setPisoDialogOpen(false);
      setPisoForm({ cargo: "", piso_salarial: "" });
      load();
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("convencoes_coletivas").delete().eq("id", id);
    toast.success("Convenção removida");
    load();
  };

  // Verificar violações de piso
  const violacoes = pisos.filter(p => {
    const funcsComCargo = funcionarios?.filter(f =>
      f.cargo?.toLowerCase().trim() === p.cargo.toLowerCase().trim()
    );
    return funcsComCargo?.some(f => f.salario && f.salario < p.piso_salarial);
  });

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <>
      <Card className="h-full" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        <CardHeader className="p-2.5 sm:p-3 pb-1.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-1.5 text-sm font-semibold">
                <BookOpen className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="truncate">CCT / ACT — Convenções Coletivas</span>
              </CardTitle>
              <CardDescription className="text-[11px] mt-0.5">CLT Art. 611-A — Pisos salariais por categoria</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-1 h-7 text-xs px-2.5 flex-shrink-0"><Plus className="h-3 w-3" />Nova CCT/ACT</Button>
          </div>
          {violacoes.length > 0 && (
            <div className="mt-2 p-2 rounded-md bg-destructive/5 border border-destructive/30">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                <span className="font-medium text-xs text-destructive">
                  {violacoes.length} violação(ões) de piso detectada(s)
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                Funcionários com salário abaixo do piso da categoria. Risco de autuação.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-2.5 sm:p-3 pt-0">
          {loading ? (
            <p className="text-xs text-muted-foreground text-center py-3">Carregando...</p>
          ) : convencoes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-5">Nenhuma CCT/ACT cadastrada.</p>
          ) : (
            <div className="space-y-2">
              {convencoes.map(conv => {
                const pisosConv = pisos.filter(p => p.convencao_id === conv.id);
                const vencida = isPast(new Date(conv.data_fim));
                return (
                  <div key={conv.id} className="p-2.5 rounded-md border">
                    <div className="flex items-center justify-between mb-1 gap-1">
                      <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{conv.tipo.toUpperCase()}</Badge>
                        <span className="font-medium text-xs truncate">{conv.nome}</span>
                        {vencida && <Badge variant="destructive" className="text-[9px] px-1 py-0">Vencida</Badge>}
                      </div>
                      <div className="flex gap-0.5 flex-shrink-0">
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-1.5" onClick={() => { setSelectedConvencao(conv.id); setPisoDialogOpen(true); }}>
                          <Plus className="h-2.5 w-2.5 mr-0.5" />Piso
                        </Button>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => handleDelete(conv.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-1.5 leading-tight truncate">
                      {conv.sindicato && `${conv.sindicato} · `}
                      {format(new Date(conv.data_inicio), "dd/MM/yy")} a {format(new Date(conv.data_fim), "dd/MM/yy")}
                    </p>
                    {pisosConv.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[10px] py-1 h-auto">Cargo</TableHead>
                            <TableHead className="text-[10px] py-1 h-auto text-right">Piso</TableHead>
                            <TableHead className="text-[10px] py-1 h-auto text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pisosConv.map(p => {
                            const funcsAbaixo = funcionarios?.filter(f =>
                              f.cargo?.toLowerCase().trim() === p.cargo.toLowerCase().trim() && f.salario && f.salario < p.piso_salarial
                            );
                            return (
                              <TableRow key={p.id}>
                                <TableCell className="text-[11px] py-1 truncate max-w-[120px]">{p.cargo}</TableCell>
                                <TableCell className="text-[11px] py-1 text-right font-mono">{fmt(p.piso_salarial)}</TableCell>
                                <TableCell className="text-right py-1">
                                  {funcsAbaixo && funcsAbaixo.length > 0 ? (
                                    <Badge variant="destructive" className="text-[9px] gap-0.5 px-1 py-0">
                                      <AlertTriangle className="h-2 w-2" />
                                      {funcsAbaixo.length}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[9px] px-1 py-0">OK</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Convenção */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nova Convenção Coletiva</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="CCT Sindicato X 2024/2025" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cct">CCT</SelectItem>
                    <SelectItem value="act">ACT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sindicato</Label>
                <Input value={form.sindicato} onChange={e => setForm(p => ({ ...p, sindicato: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início Vigência *</Label>
                <Input type="date" value={form.data_inicio} onChange={e => setForm(p => ({ ...p, data_inicio: e.target.value }))} />
              </div>
              <div>
                <Label>Fim Vigência *</Label>
                <Input type="date" value={form.data_fim} onChange={e => setForm(p => ({ ...p, data_fim: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label>Documento (PDF, DOC)</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={e => setArquivo(e.target.files?.[0] || null)}
              />
              {arquivo ? (
                <div className="flex items-center gap-2 mt-1 p-2 rounded-md border bg-muted/50">
                  <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs truncate flex-1">{arquivo.name}</span>
                  <Button type="button" variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => { setArquivo(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" size="sm" className="w-full mt-1 gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-3.5 w-3.5" />
                  Anexar documento
                </Button>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddConvencao} disabled={uploading}>
              {uploading ? "Enviando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Novo Piso */}
      <Dialog open={pisoDialogOpen} onOpenChange={setPisoDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Adicionar Piso Salarial</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Cargo *</Label>
              <Input value={pisoForm.cargo} onChange={e => setPisoForm(p => ({ ...p, cargo: e.target.value }))} placeholder="Ex: Auxiliar de limpeza" />
            </div>
            <div>
              <Label>Piso Salarial (R$) *</Label>
              <Input value={pisoForm.piso_salarial} onChange={e => setPisoForm(p => ({ ...p, piso_salarial: e.target.value }))} placeholder="0,00" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPisoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddPiso}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
