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
  LogIn, Coffee, CornerDownLeft, Utensils, LogOut, Clock
} from "lucide-react";
import { toast } from "sonner";
import { usePortalAuth } from "./PortalAuthProvider";

const getRestConfig = () => {
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
    url: supabaseUrl,
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

const restGet = async (path: string) => {
  const { url, headers } = getRestConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`REST GET failed: ${res.status}`);
  return res.json();
};

const restPost = async (path: string, body: any) => {
  const { url, headers } = getRestConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST POST failed: ${res.status} ${text}`);
  }
};

const restPatch = async (path: string, body: any) => {
  const { url, headers } = getRestConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST PATCH failed: ${res.status} ${text}`);
  }
};

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
      const userId = profile?.id;
      if (!userId) {
        toast.error("Sessão expirada. Faça login novamente.");
        setLoading(null);
        return;
      }

      // CLT validations on entry
      if (campo === "entrada") {
        const profiles = await restGet(`profiles?id=eq.${userId}&select=escala_trabalho,turno&limit=1`);
        const profileData = profiles?.[0];

        const ultimos = await restGet(
          `registros_ponto?user_id=eq.${userId}&saida=not.is.null&select=saida,data&order=data.desc&limit=1`
        );
        const ultimoRegistro = ultimos?.[0];

        if (ultimoRegistro?.saida) {
          const ultimaSaida = new Date(ultimoRegistro.saida);
          const agora2 = new Date();
          const horasDescanso = (agora2.getTime() - ultimaSaida.getTime()) / (1000 * 60 * 60);

          if (profileData?.escala_trabalho === "12x36") {
            if (horasDescanso < 36) {
              toast.error("Descanso mínimo não atingido", {
                description: `Escala 12x36: Faltam ${(36 - horasDescanso).toFixed(1)}h para completar as 36h de descanso obrigatório.`,
              });
              setLoading(null);
              return;
            }
          } else if (horasDescanso < 11) {
            toast.error("Intervalo interjornada insuficiente", {
              description: `Faltam ${(11 - horasDescanso).toFixed(1)}h para completar as 11h de descanso obrigatório (CLT art. 66).`,
            });
            setLoading(null);
            return;
          }
        }

        // Turno warnings
        if (profileData?.escala_trabalho === "12x36") {
          const horaAtual = new Date().getHours();
          if (profileData.turno === "diurno" && (horaAtual < 5 || horaAtual >= 21)) {
            toast.warning("Atenção: Registro fora do turno diurno (07h-19h)");
          } else if (profileData.turno === "noturno" && (horaAtual >= 9 && horaAtual < 17)) {
            toast.warning("Atenção: Registro fora do turno noturno (19h-07h)");
          }
        }

        if (new Date().getDay() === 0) {
          toast.info("Registro em DSR (Domingo)", {
            description: "Horas trabalhadas serão classificadas com adicional de 100% (CLT art. 70).",
            duration: 5000,
          });
        }
      }

      // Lunch break validation
      if (campo === "retorno_almoco" && registroHoje?.saida_almoco) {
        const intervaloMin = (Date.now() - new Date(registroHoje.saida_almoco).getTime()) / (1000 * 60);
        if (intervaloMin < 60) {
          toast.warning("Intervalo intrajornada inferior a 1h", {
            description: `Intervalo de ${Math.round(intervaloMin)}min. O mínimo legal é 1h (CLT art. 71).`,
            duration: 6000,
          });
        } else if (intervaloMin > 120) {
          toast.warning("Intervalo intrajornada superior a 2h", {
            description: `Intervalo de ${Math.round(intervaloMin)}min (CLT art. 71).`,
            duration: 6000,
          });
        }
      }

      const agora = new Date().toISOString();
      const hoje = new Date().toISOString().split('T')[0];

      // Detect rest day for 12x36
      let isRegistroFolga = false;
      if (campo === "entrada") {
        const profiles2 = await restGet(`profiles?id=eq.${userId}&select=escala_trabalho&limit=1`);
        if (profiles2?.[0]?.escala_trabalho === "12x36") {
          const ultTrabalho = await restGet(
            `registros_ponto?user_id=eq.${userId}&entrada=not.is.null&select=data&order=data.desc&limit=1`
          );
          if (ultTrabalho?.[0]?.data) {
            const diffDias = Math.round(
              (new Date(hoje + "T12:00:00").getTime() - new Date(ultTrabalho[0].data + "T12:00:00").getTime()) / 86400000
            );
            if (diffDias > 0 && diffDias % 2 === 0) {
              isRegistroFolga = true;
              toast.warning("Registro em dia de folga (12x36)", {
                description: "Este registro será enviado para aprovação do administrador.",
                duration: 6000,
              });
            }
          }
        }
      }

      if (!registroHoje) {
        // Check if record already exists
        const existentes = await restGet(
          `registros_ponto?user_id=eq.${userId}&data=eq.${hoje}&select=id&limit=1`
        );

        if (existentes?.[0]) {
          await restPatch(`registros_ponto?id=eq.${existentes[0].id}`, { [campo]: agora });
        } else {
          await restPost('registros_ponto', {
            user_id: userId,
            data: hoje,
            [campo]: agora,
            registro_folga: isRegistroFolga,
            status_validacao: isRegistroFolga ? "pendente" : "validado",
          });
        }
      } else {
        await restPatch(`registros_ponto?id=eq.${registroHoje.id}`, { [campo]: agora });
      }

      toast.success("Ponto registrado!", {
        description: `${label} registrado às ${new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit", minute: "2-digit",
        })}`,
      });

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
    { campo: "entrada", label: "Entrada", icon: LogIn, variant: "default" as const, disabled: !!registroHoje?.entrada },
    { campo: "saida_pausa_1", label: "Saída Pausa 1", icon: Coffee, variant: "outline" as const, disabled: !registroHoje?.entrada || !!registroHoje?.saida_pausa_1 },
    { campo: "retorno_pausa_1", label: "Retorno Pausa 1", icon: CornerDownLeft, variant: "outline" as const, disabled: !registroHoje?.saida_pausa_1 || !!registroHoje?.retorno_pausa_1 },
    { campo: "saida_almoco", label: "Saída Almoço", icon: Utensils, variant: "secondary" as const, disabled: !registroHoje?.entrada || !!registroHoje?.saida_almoco },
    { campo: "retorno_almoco", label: "Retorno Almoço", icon: CornerDownLeft, variant: "secondary" as const, disabled: !registroHoje?.saida_almoco || !!registroHoje?.retorno_almoco },
    { campo: "saida_pausa_2", label: "Saída Pausa 2", icon: Coffee, variant: "outline" as const, disabled: !registroHoje?.retorno_almoco || !!registroHoje?.saida_pausa_2 },
    { campo: "retorno_pausa_2", label: "Retorno Pausa 2", icon: CornerDownLeft, variant: "outline" as const, disabled: !registroHoje?.saida_pausa_2 || !!registroHoje?.retorno_pausa_2 },
    { campo: "saida", label: "Saída", icon: LogOut, variant: "destructive" as const, disabled: !registroHoje?.entrada || !!registroHoje?.saida },
    { campo: "inicio_he", label: "Início HE", icon: Clock, variant: "outline" as const, disabled: !registroHoje?.saida || !!registroHoje?.inicio_he },
    { campo: "fim_he", label: "Fim HE", icon: Clock, variant: "outline" as const, disabled: !registroHoje?.inicio_he || !!registroHoje?.fim_he },
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
                onClick={() => setConfirmAction({ campo: botao.campo, label: botao.label })}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs text-center leading-tight">{botao.label}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar registro de ponto</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja registrar <strong>{confirmAction?.label}</strong> às{" "}
              <strong>{new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</strong>?
              <br />
              Esta ação não poderá ser desfeita pelo funcionário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  registrarPonto(confirmAction.campo, confirmAction.label);
                  setConfirmAction(null);
                }
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
