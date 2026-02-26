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
import { supabase } from "@/integrations/supabase/client";
import { PortalBackground } from "./PortalBackground";

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
      let userId = profile?.id;
      
      if (!userId) {
        try {
          const sessionPromise = supabase.auth.getSession();
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 4000));
          const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
          userId = session?.user?.id;
        } catch {
          // Session fetch timed out or failed
        }
      }
      
      if (!userId) {
        setLoading(false);
        return;
      }

      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from("registros_ponto")
        .select("*")
        .eq("user_id", userId)
        .eq("data", hoje)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar registro:", error);
      }

      setRegistroHoje(data || null);
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
    setRefreshKey(prev => prev + 1); // triggers HistoricoPonto refresh
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
      {/* Cabeçalho */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Card de Boas-vindas */}
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

          {/* Relógios e Cronômetros */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <RelogioTurno registroHoje={registroHoje} />
            <CronometroPausa registroHoje={registroHoje} />
          </div>

          {/* Botões de Marcação */}
          <BotoesPonto 
            registroHoje={registroHoje} 
            onRegistroAtualizado={handleRegistroAtualizado}
          />

          {/* Tabela do Dia */}
          <TabelaPontoDia 
            registro={registroHoje} 
            loading={loading}
          />

          {/* Histórico dos Últimos 5 Dias */}
          <HistoricoPonto key={refreshKey} />
        </div>
      </main>
    </PortalBackground>
  );
};
