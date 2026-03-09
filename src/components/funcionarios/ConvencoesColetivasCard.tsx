import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Plus, Trash2, BookOpen, AlertTriangle } from "lucide-react";
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

  const handleAddConvencao = async () => {
    if (!form.nome || !form.data_inicio || !form.data_fim) { toast.error("Preencha todos os campos obrigatórios"); return; }
    try {
      const { error } = await (supabase as any).from("convencoes_coletivas").insert({
        ...form, sindicato: form.sindicato || null,
      });
      if (error) throw error;
      toast.success("Convenção registrada");
      setDialogOpen(false);
      setForm({ nome: "", tipo: "cct", sindicato: "", data_inicio: "", data_fim: "" });
      load();
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
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
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                CCT / ACT — Convenções Coletivas
              </CardTitle>
              <CardDescription>CLT Art. 611-A — Pisos salariais por categoria</CardDescription>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-1"><Plus className="h-4 w-4" />Nova CCT/ACT</Button>
          </div>
          {violacoes.length > 0 && (
            <div className="mt-3 p-3 rounded-lg bg-destructive/5 border border-destructive/30">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="font-medium text-sm text-destructive">
                  {violacoes.length} violação(ões) de piso salarial detectada(s)
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Existem funcionários com salário abaixo do piso da categoria. Risco de autuação.
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
          ) : convencoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma CCT/ACT cadastrada.</p>
          ) : (
            <div className="space-y-4">
              {convencoes.map(conv => {
                const pisosConv = pisos.filter(p => p.convencao_id === conv.id);
                const vencida = isPast(new Date(conv.data_fim));
                return (
                  <div key={conv.id} className="p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{conv.tipo.toUpperCase()}</Badge>
                        <span className="font-medium text-sm">{conv.nome}</span>
                        {vencida && <Badge variant="destructive" className="text-[10px]">Vencida</Badge>}
                      </div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => { setSelectedConvencao(conv.id); setPisoDialogOpen(true); }}>
                          <Plus className="h-3 w-3 mr-1" />Piso
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(conv.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {conv.sindicato && `${conv.sindicato} · `}
                      Vigência: {format(new Date(conv.data_inicio), "dd/MM/yyyy")} a {format(new Date(conv.data_fim), "dd/MM/yyyy")}
                    </p>
                    {pisosConv.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Cargo</TableHead>
                            <TableHead className="text-xs text-right">Piso Salarial</TableHead>
                            <TableHead className="text-xs text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pisosConv.map(p => {
                            const funcsAbaixo = funcionarios?.filter(f =>
                              f.cargo?.toLowerCase().trim() === p.cargo.toLowerCase().trim() && f.salario && f.salario < p.piso_salarial
                            );
                            return (
                              <TableRow key={p.id}>
                                <TableCell className="text-xs">{p.cargo}</TableCell>
                                <TableCell className="text-xs text-right font-mono">{fmt(p.piso_salarial)}</TableCell>
                                <TableCell className="text-right">
                                  {funcsAbaixo && funcsAbaixo.length > 0 ? (
                                    <Badge variant="destructive" className="text-[10px] gap-1">
                                      <AlertTriangle className="h-2.5 w-2.5" />
                                      {funcsAbaixo.length} abaixo
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px]">OK</Badge>
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleAddConvencao}>Salvar</Button>
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
