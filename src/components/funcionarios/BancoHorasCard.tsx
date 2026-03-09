import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Clock, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface BancoHorasEntry {
  id: string;
  data: string;
  tipo: string;
  horas: string;
  motivo: string | null;
  status: string;
}

const formatInterval = (interval: string) => {
  if (!interval) return "0h00";
  const match = interval.match(/(\d+):(\d+)/);
  if (match) return `${match[1]}h${match[2]}`;
  return interval;
};

export const BancoHorasCard = ({ userId, userName }: { userId: string; userName: string }) => {
  const [entries, setEntries] = useState<BancoHorasEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saldo, setSaldo] = useState({ credito: 0, debito: 0 });

  const loadBancoHoras = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from("banco_horas")
        .select("*")
        .eq("user_id", userId)
        .order("data", { ascending: false })
        .limit(50);

      if (error) throw error;

      const items = data || [];
      setEntries(items);

      // Calculate balance
      let totalCredito = 0;
      let totalDebito = 0;
      items.forEach((e: any) => {
        if (e.status !== "aprovado") return;
        const match = (e.horas || "").match(/(\d+):(\d+)/);
        const hours = match ? parseInt(match[1]) + parseInt(match[2]) / 60 : 0;
        if (e.tipo === "credito") totalCredito += hours;
        else totalDebito += hours;
      });

      setSaldo({ credito: Math.round(totalCredito * 100) / 100, debito: Math.round(totalDebito * 100) / 100 });
    } catch (e) {
      console.error("Erro ao carregar banco de horas:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBancoHoras(); }, [userId]);

  const saldoFinal = saldo.credito - saldo.debito;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Banco de Horas — {userName}</CardTitle>
        </div>
        <CardDescription>Compensação de HE conforme Art. 59 §2º CLT</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Saldo */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-950 p-3 text-center">
            <TrendingUp className="h-4 w-4 mx-auto text-green-600 mb-1" />
            <p className="text-xs text-muted-foreground">Crédito</p>
            <p className="text-lg font-bold text-green-700">{saldo.credito}h</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950 p-3 text-center">
            <TrendingDown className="h-4 w-4 mx-auto text-red-600 mb-1" />
            <p className="text-xs text-muted-foreground">Débito</p>
            <p className="text-lg font-bold text-red-700">{saldo.debito}h</p>
          </div>
          <div className={`rounded-lg p-3 text-center ${saldoFinal >= 0 ? 'bg-blue-50 dark:bg-blue-950' : 'bg-orange-50 dark:bg-orange-950'}`}>
            <Clock className={`h-4 w-4 mx-auto mb-1 ${saldoFinal >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
            <p className="text-xs text-muted-foreground">Saldo</p>
            <p className={`text-lg font-bold ${saldoFinal >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
              {saldoFinal >= 0 ? '+' : ''}{saldoFinal}h
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground">Carregando...</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhum registro no banco de horas.</p>
        ) : (
          <div className="overflow-x-auto max-h-64">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Horas</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(e.data + "T12:00:00").toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.tipo === "credito" ? "default" : "secondary"} className={e.tipo === "credito" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {e.tipo === "credito" ? "Crédito" : "Débito"}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">{formatInterval(e.horas)}</TableCell>
                    <TableCell className="max-w-[150px] truncate">{e.motivo || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={e.status === "aprovado" ? "default" : e.status === "rejeitado" ? "destructive" : "secondary"}>
                        {e.status === "aprovado" ? "Aprovado" : e.status === "rejeitado" ? "Rejeitado" : "Pendente"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
