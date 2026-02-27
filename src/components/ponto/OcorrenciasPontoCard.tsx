import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Info, XCircle, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import { SuperAdminAuthDialog } from "./SuperAdminAuthDialog";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const getAccessToken = (): string | null => {
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
    const raw = localStorage.getItem(`sb-${projectId}-auth-token`);
    if (!raw) return null;
    return JSON.parse(raw)?.access_token || null;
  } catch { return null; }
};

interface Ocorrencia {
  id: string;
  user_id: string;
  data: string;
  tipo: string;
  descricao: string;
  severidade: string;
  resolvido: boolean;
  resolvido_por?: string;
  resolvido_em?: string;
  justificativa_resolucao?: string;
  created_at: string;
  profiles?: { nome: string };
}

interface OcorrenciasPontoCardProps {
  mes: string;
  ano: string;
}

export const OcorrenciasPontoCard = ({ mes, ano }: OcorrenciasPontoCardProps) => {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [authorizedAdmin, setAuthorizedAdmin] = useState<{ id: string; name: string } | null>(null);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState("");
  const [saving, setSaving] = useState(false);
  const [showResolved, setShowResolved] = useState(false);

  const loadOcorrencias = useCallback(async () => {
    try {
      const token = getAccessToken();
      if (!token) { setLoading(false); setOcorrencias([]); return; }

      const startDate = `${ano}-${mes}-01`;
      const daysInMonth = new Date(parseInt(ano), parseInt(mes), 0).getDate();
      const endDate = `${ano}-${mes}-${daysInMonth}`;

      const url = `${SUPABASE_URL}/rest/v1/ocorrencias_ponto?select=*,profiles:user_id(nome)&data=gte.${startDate}&data=lte.${endDate}&order=created_at.desc`;
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`REST ${res.status}`);
      const data = await res.json();
      setOcorrencias(data || []);
    } catch (error) {
      console.error("Erro ao carregar ocorrências:", error);
      setOcorrencias([]);
    } finally {
      setLoading(false);
    }
  }, [mes, ano]);

  useEffect(() => {
    setLoading(true);
    loadOcorrencias();
  }, [loadOcorrencias]);

  const handleResolver = (id: string) => {
    setResolvingId(id);
    if (!authorizedAdmin) {
      setShowAuthDialog(true);
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolvingId || !authorizedAdmin || !justificativa.trim()) {
      toast.error("Justificativa é obrigatória");
      return;
    }
    setSaving(true);
    try {
      const token = getAccessToken();
      if (!token) throw new Error("Sessão expirada");

      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/ocorrencias_ponto?id=eq.${resolvingId}`,
        {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({
            resolvido: true,
            resolvido_por: authorizedAdmin.id,
            resolvido_em: new Date().toISOString(),
            justificativa_resolucao: justificativa.trim(),
          }),
        }
      );

      if (!res.ok) throw new Error(`Erro ${res.status}`);
      toast.success("Ocorrência resolvida");
      setResolvingId(null);
      setJustificativa("");
      loadOcorrencias();
    } catch (error: any) {
      toast.error("Erro: " + (error.message || "Tente novamente"));
    } finally {
      setSaving(false);
    }
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case "error": return <XCircle className="h-4 w-4 text-destructive" />;
      case "warning": return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      default: return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const getTipoLabel = (tipo: string) => {
    const map: Record<string, string> = {
      intervalo_intrajornada: "Intrajornada",
      intervalo_interjornada: "Interjornada",
      limite_he: "Limite HE",
      dsr_trabalhado: "DSR Trabalhado",
      turno_irregular: "Turno Irregular",
    };
    return map[tipo] || tipo;
  };

  const pendentes = ocorrencias.filter(o => !o.resolvido);
  const resolvidas = ocorrencias.filter(o => o.resolvido);
  const displayed = showResolved ? ocorrencias : pendentes;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-base">
                Ocorrências CLT
                {pendentes.length > 0 && (
                  <Badge variant="destructive" className="ml-2">{pendentes.length}</Badge>
                )}
              </CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResolved(!showResolved)}
            >
              {showResolved ? "Apenas pendentes" : `Ver todas (${ocorrencias.length})`}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : displayed.length === 0 ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Nenhuma ocorrência {showResolved ? "no período" : "pendente"}
            </div>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {displayed.map((oc) => (
                <div
                  key={oc.id}
                  className={`border rounded-lg p-3 space-y-2 ${oc.resolvido ? "opacity-60" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 min-w-0">
                      {getSeverityIcon(oc.severidade)}
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {(oc as any).profiles?.nome || "Funcionário"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(oc.data + "T12:00:00").toLocaleDateString("pt-BR")} • {getTipoLabel(oc.tipo)}
                        </p>
                      </div>
                    </div>
                    <Badge variant={oc.resolvido ? "secondary" : oc.severidade === "error" ? "destructive" : "outline"} className="shrink-0 text-xs">
                      {oc.resolvido ? "Resolvido" : oc.severidade === "error" ? "Crítico" : oc.severidade === "warning" ? "Alerta" : "Info"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{oc.descricao}</p>

                  {oc.resolvido && oc.justificativa_resolucao && (
                    <p className="text-xs italic text-muted-foreground border-t pt-1">
                      Resolução: {oc.justificativa_resolucao}
                    </p>
                  )}

                  {!oc.resolvido && resolvingId === oc.id && authorizedAdmin ? (
                    <div className="space-y-2 border-t pt-2">
                      <Textarea
                        value={justificativa}
                        onChange={(e) => setJustificativa(e.target.value)}
                        placeholder="Justificativa para resolver esta ocorrência..."
                        rows={2}
                        className="text-xs"
                        disabled={saving}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleConfirmResolve} disabled={saving || !justificativa.trim()}>
                          {saving ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <CheckCircle className="h-3 w-3 mr-1" />}
                          Resolver
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setResolvingId(null); setJustificativa(""); }}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : !oc.resolvido ? (
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleResolver(oc.id)}>
                      <Shield className="h-3 w-3 mr-1" />
                      Resolver
                    </Button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <SuperAdminAuthDialog
        open={showAuthDialog}
        onOpenChange={setShowAuthDialog}
        onAuthorized={(id, name) => setAuthorizedAdmin({ id, name })}
        actionDescription="resolver ocorrências de ponto"
      />
    </>
  );
};
