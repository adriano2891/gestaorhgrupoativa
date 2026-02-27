import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const [confirmAction, setConfirmAction] = useState<{ campo: string; label: string } | null>(null);
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

      // Validações CLT na entrada
      if (campo === "entrada") {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("escala_trabalho, turno")
          .eq("id", userId)
          .maybeSingle();

        // Buscar último registro com saída para validações de descanso
        const { data: ultimoRegistro } = await supabase
          .from("registros_ponto")
          .select("saida, data")
          .eq("user_id", userId)
          .not("saida", "is", null)
          .order("data", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ultimoRegistro?.saida) {
          const ultimaSaida = new Date(ultimoRegistro.saida);
          const agora2 = new Date();
          const horasDescanso = (agora2.getTime() - ultimaSaida.getTime()) / (1000 * 60 * 60);

          if (profileData?.escala_trabalho === "12x36") {
            if (horasDescanso < 36) {
              const horasRestantes = (36 - horasDescanso).toFixed(1);
              toast.error("Descanso mínimo não atingido", {
                description: `Escala 12x36: Faltam ${horasRestantes}h para completar as 36h de descanso obrigatório (CLT art. 59-A).`,
              });
              setLoading(null);
              return;
            }
          } else {
            if (horasDescanso < 11) {
              const horasRestantes = (11 - horasDescanso).toFixed(1);
              toast.error("Intervalo interjornada insuficiente", {
                description: `Faltam ${horasRestantes}h para completar as 11h de descanso obrigatório entre jornadas (CLT art. 66).`,
              });
              setLoading(null);
              return;
            }
          }
        }

        // Validar turno configurado (apenas warning, não bloqueia)
        if (profileData?.escala_trabalho === "12x36") {
          const horaAtual = new Date().getHours();
          if (profileData.turno === "diurno" && (horaAtual < 5 || horaAtual >= 21)) {
            toast.warning("Atenção: Registro fora do turno diurno (07h-19h)", {
              description: "Prosseguindo. Alterações fora do turno ficam sujeitas a validação administrativa.",
            });
          } else if (profileData.turno === "noturno" && (horaAtual >= 9 && horaAtual < 17)) {
            toast.warning("Atenção: Registro fora do turno noturno (19h-07h)", {
              description: "Prosseguindo. Alterações fora do turno ficam sujeitas a validação administrativa.",
            });
          }
        }

        // DSR: avisar se está registrando em domingo
        const diaSemana = new Date().getDay();
        if (diaSemana === 0) {
          toast.info("Registro em DSR (Domingo)", {
            description: "Horas trabalhadas serão classificadas com adicional de 100% (CLT art. 70).",
            duration: 5000,
          });
        }
      }

      // Validação de intervalo intrajornada no retorno do almoço
      if (campo === "retorno_almoco" && registroHoje?.saida_almoco) {
        const saidaAlmoco = new Date(registroHoje.saida_almoco);
        const retorno = new Date();
        const intervaloMin = (retorno.getTime() - saidaAlmoco.getTime()) / (1000 * 60);
        
        if (intervaloMin < 60) {
          toast.warning("Intervalo intrajornada inferior a 1h", {
            description: `Intervalo de ${Math.round(intervaloMin)}min. O mínimo legal é 1h para jornadas >6h (CLT art. 71). Uma ocorrência será registrada.`,
            duration: 6000,
          });
        } else if (intervaloMin > 120) {
          toast.warning("Intervalo intrajornada superior a 2h", {
            description: `Intervalo de ${Math.round(intervaloMin)}min. O máximo recomendado é 2h (CLT art. 71). Uma ocorrência será registrada.`,
            duration: 6000,
          });
        }
      }

      const agora = new Date().toISOString();
      const hoje = new Date().toISOString().split('T')[0];

      // Detectar se é dia de folga para escala 12x36
      let isRegistroFolga = false;
      if (campo === "entrada") {
        const { data: profileData2 } = await supabase
          .from("profiles")
          .select("escala_trabalho")
          .eq("id", userId)
          .maybeSingle();

        if (profileData2?.escala_trabalho === "12x36") {
          const { data: ultimoTrabalho } = await supabase
            .from("registros_ponto")
            .select("data")
            .eq("user_id", userId)
            .not("entrada", "is", null)
            .order("data", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (ultimoTrabalho?.data) {
            const ultimaData = new Date(ultimoTrabalho.data + "T12:00:00");
            const hojeDate = new Date(hoje + "T12:00:00");
            const diffDias = Math.round((hojeDate.getTime() - ultimaData.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDias > 0 && diffDias % 2 === 0) {
              isRegistroFolga = true;
              toast.warning("Registro em dia de folga (12x36)", {
                description: "Este registro será enviado para aprovação do administrador como possível hora extra.",
                duration: 6000,
              });
            }
          }
        }
      }

      if (!registroHoje) {
        // Verificar se já existe registro para hoje (evitar duplicação)
        const { data: existente } = await supabase
          .from("registros_ponto")
          .select("id")
          .eq("user_id", userId)
          .eq("data", hoje)
          .maybeSingle();

        if (existente) {
          // Registro já existe, atualizar ao invés de inserir
          const { error } = await supabase
            .from("registros_ponto")
            .update({ [campo]: agora } as any)
            .eq("id", existente.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from("registros_ponto")
            .insert({
              user_id: userId,
              data: hoje,
              [campo]: agora,
              registro_folga: isRegistroFolga,
              status_validacao: isRegistroFolga ? "pendente" : "validado",
            } as any);

          if (error) throw error;
        }
      } else {
        const { error } = await supabase
          .from("registros_ponto")
          .update({ [campo]: agora } as any)
          .eq("id", registroHoje.id);

        if (error) throw error;
      }

      toast.success("Ponto registrado!", {
        description: `${label} registrado às ${new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}`,
      });

      // Small delay to ensure DB trigger calculations complete before refetching
      await new Promise(resolve => setTimeout(resolve, 300));
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
