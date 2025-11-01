import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, Clock } from "lucide-react";
import { toast } from "sonner";
import { BotoesPonto } from "./BotoesPonto";
import { TabelaPontoDia } from "./TabelaPontoDia";
import { HistoricoPonto } from "./HistoricoPonto";
import { supabase } from "@/integrations/supabase/client";

export const PainelPonto = () => {
  const { profile, signOut } = useAuth();
  const [registroHoje, setRegistroHoje] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const loadRegistroHoje = async () => {
    if (!profile?.id) return;

    try {
      const hoje = new Date().toISOString().split('T')[0];
      
      const { data, error } = await (supabase as any)
        .from("registros_ponto")
        .select("*")
        .eq("user_id", profile.id)
        .eq("data", hoje)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Erro ao carregar registro:", error);
        return;
      }

      setRegistroHoje(data);
    } catch (error) {
      console.error("Erro ao carregar registro do dia:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistroHoje();
  }, [profile?.id]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  };

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary/50">
      {/* Cabeçalho */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12 border-2 border-primary">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {profile?.nome ? getInitials(profile.nome) : "FN"}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-bold text-foreground">
                  {profile?.nome || "Funcionário"}
                </h2>
                <p className="text-sm text-muted-foreground capitalize">
                  {dataAtual}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
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
    </div>
  );
};
