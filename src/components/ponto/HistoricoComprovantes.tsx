import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, Download, Eye, Loader2 } from "lucide-react";
import { usePortalAuth } from "./PortalAuthProvider";
import { ComprovantePontoModal } from "./ComprovantePontoModal";
import { supabase } from "@/integrations/supabase/client";

export const HistoricoComprovantes = () => {
  const { profile } = usePortalAuth();
  const [comprovantes, setComprovantes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      if (!profile?.id) { setComprovantes([]); return; }

      const { data, error } = await supabase
        .from("comprovantes_ponto")
        .select("*")
        .eq("user_id", profile.id)
        .order("data_jornada", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Erro ao carregar comprovantes:", error);
        setComprovantes([]);
      } else {
        setComprovantes(data || []);
      }
    } catch {
      setComprovantes([]);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => { load(); }, [load]);

  const formatDate = (d: string) =>
    new Date(d + "T12:00:00").toLocaleDateString("pt-BR");

  const formatTime = (ts: string | null) => {
    if (!ts) return "--:--";
    return new Date(ts).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  const formatInterval = (interval: string | null) => {
    if (!interval) return "0h 0min";
    const match = interval.match(/(\d+):(\d+)/);
    if (match) return `${parseInt(match[1])}h ${parseInt(match[2])}min`;
    return "0h 0min";
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Comprovantes de Ponto</CardTitle>
          </div>
          <CardDescription>
            Visualize e baixe seus comprovantes digitais com hash criptográfico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {comprovantes.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                Nenhum comprovante encontrado.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {comprovantes.map((comp) => (
                <div
                  key={comp.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{formatDate(comp.data_jornada)}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatTime(comp.horario_entrada)} → {formatTime(comp.horario_saida)} | Total: {formatInterval(comp.total_horas)}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono mt-1">
                      Hash: {comp.hash_comprovante?.substring(0, 16)}...
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelected({ ...comp, profile })}
                    className="gap-1 ml-4"
                  >
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selected && (
        <ComprovantePontoModal
          comprovante={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
};
