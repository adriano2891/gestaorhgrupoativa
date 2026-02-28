import { useState, useEffect, useCallback } from "react";
import { usePortalAuth } from "./PortalAuthProvider";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { BotoesPonto } from "./BotoesPonto";
import { TabelaPontoDia } from "./TabelaPontoDia";
import { HistoricoPonto } from "./HistoricoPonto";
import { RelogioTurno } from "./RelogioTurno";
import { CronometroPausa } from "./CronometroPausa";
import { FolhasPontoCard } from "./FolhasPontoCard";
import { PortalBackground } from "./PortalBackground";

const getRestHeaders = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID || supabaseUrl.match(/\/\/([^.]+)/)?.[1];
  const storageKey = `sb-${projectRef}-auth-token`;
  let token = anonKey;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) token = JSON.parse(raw).access_token || anonKey;
  } catch {}
  return {
    'apikey': anonKey,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

interface PainelPontoProps {
  onBack?: () => void;
}

export const PainelPonto = ({ onBack }: PainelPontoProps) => {
  const { profile } = usePortalAuth();
  const [registroHoje, setRegistroHoje] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadRegistroHoje = useCallback(async () => {
    try {
      const userId = profile?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const hoje = new Date().toISOString().split('T')[0];
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      const res = await fetch(
        `${supabaseUrl}/rest/v1/registros_ponto?user_id=eq.${userId}&data=eq.${hoje}&select=*&limit=1`,
        { headers: getRestHeaders() }
      );

      if (!res.ok) {
        console.error("Erro ao carregar registro:", res.status);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setRegistroHoje(data?.[0] || null);
    } catch (error) {
      console.error("Erro ao carregar registro do dia:", error);
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    loadRegistroHoje();
  }, [loadRegistroHoje]);

  const handleRegistroAtualizado = useCallback(() => {
    loadRegistroHoje();
    setRefreshKey(prev => prev + 1);
  }, [loadRegistroHoje]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  return (
    <PortalBackground>
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-8 w-8 text-primary" />
                <div>
                  <CardTitle className="text-2xl">Registro de Ponto</CardTitle>
                  <p className="text-muted-foreground mt-1">
                    Registre seus horários de entrada, pausas e saída
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RelogioTurno registroHoje={registroHoje} />
            <CronometroPausa registroHoje={registroHoje} />
          </div>

          <BotoesPonto 
            registroHoje={registroHoje} 
            onRegistroAtualizado={handleRegistroAtualizado}
          />

          <TabelaPontoDia 
            registro={registroHoje} 
            loading={loading}
          />

          <HistoricoPonto key={refreshKey} />

          <FolhasPontoCard />
        </div>
      </main>
    </PortalBackground>
  );
};
