import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useFuncionarios } from "@/hooks/useFuncionarios";
import { toast } from "sonner";
import { format } from "date-fns";

interface RegistroSobreaviso {
  id: string;
  user_id: string;
  data: string;
  inicio: string;
  fim: string;
  horas_sobreaviso: string | null;
  valor_hora_sobreaviso: number | null;
  acionado: boolean;
  observacoes: string | null;
  _nome?: string;
}

export const SobreavisoCard = () => {
  const [registros, setRegistros] = useState<RegistroSobreaviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: funcionarios } = useFuncionarios();

  const [form, setForm] = useState({
    user_id: "", data: "", inicio: "", fim: "", acionado: false, observacoes: "",
  });

  const load = async () => {
    try {
      const { data } = await (supabase as any)
        .from("registros_sobreaviso")
        .select("*")
        .order("data", { ascending: false })
        .limit(50);

      if (data && data.length > 0 && funcionarios) {
        const funcMap = new Map(funcionarios.map(f => [f.id, f.nome]));
        data.forEach((r: any) => { r._nome = funcMap.get(r.user_id) || "—"; });
      }
      setRegistros(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [funcionarios]);

  const handleAdd = async () => {
    if (!form.user_id || !form.data || !form.inicio || !form.fim) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    // Calcular horas de sobreaviso
    const inicio = new Date(`${form.data}T${form.inicio}`);
    const fim = new Date(`${form.data}T${form.fim}`);
    if (fim <= inicio) fim.setDate(fim.getDate() + 1); // Cruzou meia-noite
    const horasNum = (fim.getTime() - inicio.getTime()) / (1000 * 60 * 60);

    // Buscar salário para calcular valor/hora
    const func = funcionarios?.find(f => f.id === form.user_id);
    const salario = func?.salario || 0;
    const valorHora = salario > 0 ? salario / 220 : 0;
    const valorSobreaviso = Math.round((horasNum * valorHora / 3) * 100) / 100; // 1/3

    try {
      const { error } = await (supabase as any).from("registros_sobreaviso").insert({
        user_id: form.user_id,
        data: form.data,
        inicio: `${form.data}T${form.inicio}:00`,
        fim: fim.toISOString(),
        horas_sobreaviso: `${Math.floor(horasNum)} hours ${Math.round((horasNum % 1) * 60)} minutes`,
        valor_hora_sobreaviso: valorSobreaviso,
        acionado: form.acionado,
        observacoes: form.observacoes || null,
      });
      if (error) throw error;
      toast.success("Sobreaviso registrado");
      setDialogOpen(false);
      setForm({ user_id: "", data: "", inicio: "", fim: "", acionado: false, observacoes: "" });
      load();
    } catch (e: any) {
      toast.error("Erro", { description: e.message });
    }
  };

  const handleDelete = async (id: string) => {
    await (supabase as any).from("registros_sobreaviso").delete().eq("id", id);
    toast.success("Registro removido");
    load();
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <PhoneCall className="h-5 w-5 text-primary" />
              Sobreaviso
            </CardTitle>
            <CardDescription>CLT Art. 244 §2º · Súmula 428 TST — Remuneração de 1/3 da hora normal</CardDescription>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-1"><Plus className="h-4 w-4" />Registrar</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        ) : registros.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum sobreaviso registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Valor (1/3)</TableHead>
                  <TableHead>Acionado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r._nome || "—"}</TableCell>
                    <TableCell>{format(new Date(r.data), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.inicio && format(new Date(r.inicio), "HH:mm")} - {r.fim && format(new Date(r.fim), "HH:mm")}
                    </TableCell>
                    <TableCell>{r.valor_hora_sobreaviso ? fmt(r.valor_hora_sobreaviso) : "—"}</TableCell>
                    <TableCell>
                      {r.acionado ? (
                        <Badge variant="destructive" className="text-[10px]">Sim</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Não</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)}>
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
          <DialogHeader><DialogTitle>Registrar Sobreaviso</DialogTitle></DialogHeader>
          <div className="grid gap-3">
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
            <div>
              <Label>Data *</Label>
              <Input type="date" value={form.data} onChange={e => setForm(p => ({ ...p, data: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Início *</Label>
                <Input type="time" value={form.inicio} onChange={e => setForm(p => ({ ...p, inicio: e.target.value }))} />
              </div>
              <div>
                <Label>Fim *</Label>
                <Input type="time" value={form.fim} onChange={e => setForm(p => ({ ...p, fim: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.acionado} onCheckedChange={v => setForm(p => ({ ...p, acionado: v }))} />
              <Label>Foi acionado para trabalho</Label>
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} />
            </div>
            <p className="text-xs text-muted-foreground border-t pt-2">
              Máximo de 24h por escala. Remuneração: 1/3 da hora normal (CLT Art. 244 §2º).
              Se acionado, as horas trabalhadas são remuneradas integralmente + HE se aplicável.
            </p>
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
