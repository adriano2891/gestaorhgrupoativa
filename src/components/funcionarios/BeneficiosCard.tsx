import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Gift, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Beneficio {
  id: string;
  user_id: string;
  tipo: string;
  valor: number;
  desconto_percentual: number;
  ativo: boolean;
  data_inicio: string;
  observacoes: string | null;
}

const tipoLabels: Record<string, string> = {
  vale_transporte: "Vale-Transporte",
  vale_alimentacao: "Vale-Alimentação",
  vale_refeicao: "Vale-Refeição",
  plano_saude: "Plano de Saúde",
  plano_odontologico: "Plano Odontológico",
};

export const BeneficiosCard = ({ userId, userName }: { userId: string; userName: string }) => {
  const [beneficios, setBeneficios] = useState<Beneficio[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tipo, setTipo] = useState("vale_transporte");
  const [valor, setValor] = useState("");
  const [desconto, setDesconto] = useState("6");

  const loadBeneficios = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("beneficios_funcionario")
        .select("*")
        .eq("user_id", userId)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBeneficios(data || []);
    } catch (e) {
      console.error("Erro ao carregar benefícios:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBeneficios(); }, [userId]);

  const handleAdd = async () => {
    const valorNum = parseFloat(valor.replace(",", "."));
    if (!valorNum || valorNum <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from("beneficios_funcionario")
        .insert({
          user_id: userId,
          tipo,
          valor: valorNum,
          desconto_percentual: parseFloat(desconto) || 0,
        });

      if (error) throw error;
      toast.success("Benefício adicionado");
      setDialogOpen(false);
      setValor("");
      loadBeneficios();
    } catch (e: any) {
      toast.error("Erro ao adicionar benefício", { description: e.message });
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from("beneficios_funcionario")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
      toast.success("Benefício removido");
      loadBeneficios();
    } catch (e: any) {
      toast.error("Erro ao remover benefício", { description: e.message });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            <CardTitle className="text-base">Benefícios — {userName}</CardTitle>
          </div>
          <Button size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : beneficios.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum benefício cadastrado.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor (R$)</TableHead>
                <TableHead>Desconto (%)</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {beneficios.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>
                    <Badge variant="outline">{tipoLabels[b.tipo] || b.tipo}</Badge>
                  </TableCell>
                  <TableCell>R$ {b.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell>{b.desconto_percentual}%</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleRemove(b.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Benefício</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={tipo} onValueChange={setTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vale_transporte">Vale-Transporte</SelectItem>
                  <SelectItem value="vale_alimentacao">Vale-Alimentação</SelectItem>
                  <SelectItem value="vale_refeicao">Vale-Refeição</SelectItem>
                  <SelectItem value="plano_saude">Plano de Saúde</SelectItem>
                  <SelectItem value="plano_odontologico">Plano Odontológico</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor Mensal (R$)</Label>
              <Input value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
            </div>
            <div className="space-y-1.5">
              <Label>Desconto no salário (%)</Label>
              <Input value={desconto} onChange={(e) => setDesconto(e.target.value)} placeholder="6" />
              <p className="text-xs text-muted-foreground">VT: máx 6% do salário (CLT Art. 4º Lei 7.418/85)</p>
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
