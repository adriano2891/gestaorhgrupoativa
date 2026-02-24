import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { usePortalAuth } from "./PortalAuthProvider";

export const HistoricoPonto = () => {
  const { profile } = usePortalAuth();
  const [registros, setRegistros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistorico = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id || profile?.id;
        if (!userId) {
          setLoading(false);
          return;
        }

        const { data, error } = await (supabase as any)
          .from("registros_ponto")
          .select("*")
          .eq("user_id", userId)
          .order("data", { ascending: false })
          .limit(5);

        if (error) throw error;
        setRegistros(data || []);
      } catch (error) {
        console.error("Erro ao carregar histórico:", error);
      } finally {
        setLoading(false);
      }
    };

    loadHistorico();
  }, [profile?.id]);

  const formatData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatHora = (timestamp: string | null) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatInterval = (interval: string | null) => {
    if (!interval) return "-";
    
    const matches = interval.match(/(\d+):(\d+):(\d+)/);
    if (!matches) return interval;
    
    const hours = parseInt(matches[1]);
    const minutes = parseInt(matches[2]);
    
    return `${hours}h ${minutes}min`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Histórico Recente</CardTitle>
        </div>
        <CardDescription>
          Últimos 5 dias de registro de ponto
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Entrada</TableHead>
                <TableHead>Saída Almoço</TableHead>
                <TableHead>Retorno Almoço</TableHead>
                <TableHead>Saída</TableHead>
                <TableHead>Total Horas</TableHead>
                <TableHead>HE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((registro) => (
                <TableRow key={registro.id}>
                  <TableCell className="font-medium">
                    {formatData(registro.data)}
                  </TableCell>
                  <TableCell>{formatHora(registro.entrada)}</TableCell>
                  <TableCell>{formatHora(registro.saida_almoco)}</TableCell>
                  <TableCell>{formatHora(registro.retorno_almoco)}</TableCell>
                  <TableCell>{formatHora(registro.saida)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {formatInterval(registro.total_horas)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {registro.horas_extras && registro.horas_extras !== "00:00:00" ? (
                      <Badge variant="secondary">
                        {formatInterval(registro.horas_extras)}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {registros.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhum registro de ponto encontrado no histórico.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
