import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LogIn, 
  Coffee, 
  CornerDownLeft, 
  Utensils, 
  LogOut,
  Clock
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePortalAuth } from "./PortalAuthProvider";

interface BotoesPontoProps {
  registroHoje: any;
  onRegistroAtualizado: () => void;
}

export const BotoesPonto = ({ registroHoje, onRegistroAtualizado }: BotoesPontoProps) => {
  const { profile } = usePortalAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const registrarPonto = async (campo: string, label: string) => {
    setLoading(campo);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id || profile?.id;
      if (!userId) {
        toast.error("Sessão expirada. Faça login novamente.");
        setLoading(null);
        return;
      }
      const agora = new Date().toISOString();
      const hoje = new Date().toISOString().split('T')[0];

      if (!registroHoje) {
        // Criar novo registro
        const { error } = await (supabase as any)
          .from("registros_ponto")
          .insert({
            user_id: userId,
            data: hoje,
            [campo]: agora,
          });

        if (error) throw error;
      } else {
        // Atualizar registro existente
        const { error } = await (supabase as any)
          .from("registros_ponto")
          .update({ [campo]: agora })
          .eq("id", registroHoje.id);

        if (error) throw error;
      }

      toast.success("Ponto registrado!", {
        description: `${label} registrado às ${new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      });

      onRegistroAtualizado();
    } catch (error: any) {
      console.error("Erro ao registrar ponto:", error);
      toast.error("Erro ao registrar ponto", {
        description: error.message || "Tente novamente",
      });
    } finally {
      setLoading(null);
    }
  };

  const botoes = [
    {
      campo: "entrada",
      label: "Entrada",
      icon: LogIn,
      variant: "default" as const,
      disabled: !!registroHoje?.entrada,
    },
    {
      campo: "saida_pausa_1",
      label: "Saída Pausa 1",
      icon: Coffee,
      variant: "outline" as const,
      disabled: !registroHoje?.entrada || !!registroHoje?.saida_pausa_1,
    },
    {
      campo: "retorno_pausa_1",
      label: "Retorno Pausa 1",
      icon: CornerDownLeft,
      variant: "outline" as const,
      disabled: !registroHoje?.saida_pausa_1 || !!registroHoje?.retorno_pausa_1,
    },
    {
      campo: "saida_almoco",
      label: "Saída Almoço",
      icon: Utensils,
      variant: "secondary" as const,
      disabled: !registroHoje?.entrada || !!registroHoje?.saida_almoco,
    },
    {
      campo: "retorno_almoco",
      label: "Retorno Almoço",
      icon: CornerDownLeft,
      variant: "secondary" as const,
      disabled: !registroHoje?.saida_almoco || !!registroHoje?.retorno_almoco,
    },
    {
      campo: "saida_pausa_2",
      label: "Saída Pausa 2",
      icon: Coffee,
      variant: "outline" as const,
      disabled: !registroHoje?.retorno_almoco || !!registroHoje?.saida_pausa_2,
    },
    {
      campo: "retorno_pausa_2",
      label: "Retorno Pausa 2",
      icon: CornerDownLeft,
      variant: "outline" as const,
      disabled: !registroHoje?.saida_pausa_2 || !!registroHoje?.retorno_pausa_2,
    },
    {
      campo: "saida",
      label: "Saída",
      icon: LogOut,
      variant: "destructive" as const,
      disabled: !registroHoje?.entrada || !!registroHoje?.saida,
    },
    {
      campo: "inicio_he",
      label: "Início HE",
      icon: Clock,
      variant: "outline" as const,
      disabled: !registroHoje?.saida || !!registroHoje?.inicio_he,
    },
    {
      campo: "fim_he",
      label: "Fim HE",
      icon: Clock,
      variant: "outline" as const,
      disabled: !registroHoje?.inicio_he || !!registroHoje?.fim_he,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marcar Ponto</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {botoes.map((botao) => {
            const Icon = botao.icon;
            return (
              <Button
                key={botao.campo}
                variant={botao.variant}
                className="h-auto py-4 px-3 flex flex-col gap-2"
                disabled={botao.disabled || loading === botao.campo}
                onClick={() => registrarPonto(botao.campo, botao.label)}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs text-center leading-tight">
                  {botao.label}
                </span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
