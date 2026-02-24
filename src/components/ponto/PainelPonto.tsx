import { useState, useEffect } from "react";
import { usePortalAuth } from "./PortalAuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock } from "lucide-react";
import { BotoesPonto } from "./BotoesPonto";
import { TabelaPontoDia } from "./TabelaPontoDia";
import { HistoricoPonto } from "./HistoricoPonto";
import { RelogioTurno } from "./RelogioTurno";
import { CronometroPausa } from "./CronometroPausa";
import { supabase } from "@/integrations/supabase/client";
import { PortalBackground } from "./PortalBackground";

export const PainelPonto = () => {
  const { profile } = usePortalAuth();
  const [registroHoje, setRegistroHoje] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadRegistroHoje = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || profile?.id;
      if (!userId) {
        setLoading(false);
        return;
      }

      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await (supabase as any)
        .from("registros_ponto")
        .select("*")
        .eq("user_id", userId)
        .eq("data", hoje)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao carregar registro:", error);
      }

      setRegistroHoje(data || null);
    } catch (error) {
      console.error("Erro ao carregar registro do dia:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistroHoje();
  }, [profile?.id]);

  const handleBack = () => {
    window.history.back();
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
            onRegistroAtualizado={loadRegistroHoje}
          />

          {/* Tabela do Dia */}
          <TabelaPontoDia 
            registro={registroHoje} 
            loading={loading}
          />

          {/* Histórico dos Últimos 5 Dias */}
          <HistoricoPonto />
        </div>
      </main>
    </PortalBackground>
  );
};
