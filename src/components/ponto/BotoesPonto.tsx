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
import { ConfirmacaoPontoPopup } from "./ConfirmacaoPontoPopup";
import { ComprovantePontoModal } from "./ComprovantePontoModal";

// Generate SHA-256 hash for record integrity (Portaria 671/2021)
const generateHash = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Get client IP address
const getClientIP = async (): Promise<string> => {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      return data.ip || 'unknown';
    }
  } catch {}
  return 'unknown';
};

// Get geolocation if available
const getGeolocation = (): Promise<string> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
      () => resolve('denied'),
      { timeout: 5000, maximumAge: 60000 }
    );
  });
};

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
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST POST failed: ${res.status} ${text}`);
  }
  return res.json();
};

const restPatch = async (path: string, body: any) => {
  const { url, headers } = getRestConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST PATCH failed: ${res.status} ${text}`);
  }
  return res.json();
};

// Log audit event
const logAuditEvent = async (userId: string, acao: string, detalhes: any, ip: string) => {
  try {
    const { url, headers } = getRestConfig();
    await fetch(`${url}/rest/v1/audit_trail_ponto`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'return=minimal' },
      body: JSON.stringify({
        user_id: userId,
        acao,
        detalhes,
        ip_address: ip,
        user_agent: navigator.userAgent,
      }),
    });
  } catch (e) {
    console.warn('Audit log failed (non-blocking):', e);
  }
};

// Get the last hash for chained integrity
const getLastHash = async (userId: string): Promise<string> => {
  try {
    const results = await restGet(
      `registros_ponto?user_id=eq.${userId}&hash_registro=not.is.null&select=hash_registro&order=created_at.desc&limit=1`
    );
    return results?.[0]?.hash_registro || 'GENESIS';
  } catch {
    return 'GENESIS';
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
  const [popup, setPopup] = useState<{ message: string; description: string } | null>(null);
  const [comprovante, setComprovante] = useState<any>(null);

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

      // HE limit validation (Art. 59 §1º CLT - max 2h extras/day)
      if (campo === "inicio_he") {
        // Calculate hours already worked today
        if (registroHoje?.entrada && registroHoje?.saida) {
          const entrada = new Date(registroHoje.entrada).getTime();
          const saida = new Date(registroHoje.saida).getTime();
          let trabalhadas = (saida - entrada) / (1000 * 60 * 60);
          
          // Subtract completed pauses
          if (registroHoje.saida_almoco && registroHoje.retorno_almoco) {
            trabalhadas -= (new Date(registroHoje.retorno_almoco).getTime() - new Date(registroHoje.saida_almoco).getTime()) / (1000 * 60 * 60);
          }
          if (registroHoje.saida_pausa_1 && registroHoje.retorno_pausa_1) {
            trabalhadas -= (new Date(registroHoje.retorno_pausa_1).getTime() - new Date(registroHoje.saida_pausa_1).getTime()) / (1000 * 60 * 60);
          }
          if (registroHoje.saida_pausa_2 && registroHoje.retorno_pausa_2) {
            trabalhadas -= (new Date(registroHoje.retorno_pausa_2).getTime() - new Date(registroHoje.saida_pausa_2).getTime()) / (1000 * 60 * 60);
          }

          const jornadaPadrao = 8; // TODO: check escala_trabalho
          const heJaFeitas = Math.max(0, trabalhadas - jornadaPadrao);
          
          if (heJaFeitas >= 2) {
            toast.warning("⚠️ Limite de Horas Extras atingido", {
              description: `Você já tem ${heJaFeitas.toFixed(1)}h extras hoje. O limite legal é de 2h/dia (CLT Art. 59 §1º). Uma ocorrência será gerada automaticamente.`,
              duration: 8000,
            });
          } else if (heJaFeitas >= 1.5) {
            toast.info("Atenção: próximo do limite de HE", {
              description: `${heJaFeitas.toFixed(1)}h extras acumuladas. Limite: 2h/dia (CLT Art. 59 §1º).`,
              duration: 5000,
            });
          }
        }
      }

      // Warn when finishing HE if exceeded 2h
      if (campo === "fim_he" && registroHoje?.inicio_he) {
        const heMinutos = (Date.now() - new Date(registroHoje.inicio_he).getTime()) / (1000 * 60);
        if (heMinutos > 120) {
          toast.warning("Horas extras excederam 2h", {
            description: `Período de HE: ${Math.round(heMinutos)}min. Ocorrência CLT será gerada (Art. 59 §1º).`,
            duration: 6000,
          });
        }
      }

      const agora = new Date().toISOString();
      const hoje = new Date().toISOString().split('T')[0];

      // Capture audit metadata (Portaria 671/2021)
      const [clientIP, geoLocation, previousHash] = await Promise.all([
        getClientIP(),
        getGeolocation(),
        getLastHash(userId),
      ]);

      // Build chained hash: SHA256(data + previous_hash)
      const hashData = `${userId}|${campo}|${agora}|${hoje}|${clientIP}|${navigator.userAgent}|${geoLocation}|${previousHash}`;
      const hashRegistro = await generateHash(hashData);

      const auditMetadata = {
        ip_address: clientIP,
        user_agent: navigator.userAgent,
        geolocation: geoLocation,
        hash_registro: hashRegistro,
        hash_anterior: previousHash,
        origem: 'web',
      };

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

      let savedRecord: any = null;

      if (!registroHoje) {
        const existentes = await restGet(
          `registros_ponto?user_id=eq.${userId}&data=eq.${hoje}&select=id&limit=1`
        );

        if (existentes?.[0]) {
          const results = await restPatch(`registros_ponto?id=eq.${existentes[0].id}`, { 
            [campo]: agora,
            ...auditMetadata,
          });
          savedRecord = results?.[0];
        } else {
          // Fetch empresa_id for the record (Portaria 671/2021 - empresa identification)
          let empresaId: string | undefined;
          try {
            const empresas = await restGet('empresas?select=id&limit=1');
            empresaId = empresas?.[0]?.id;
          } catch { /* uses DB default */ }

          const results = await restPost('registros_ponto', {
            user_id: userId,
            data: hoje,
            [campo]: agora,
            registro_folga: isRegistroFolga,
            status_validacao: isRegistroFolga ? "pendente" : "validado",
            ...(empresaId ? { empresa_id: empresaId } : {}),
            ...auditMetadata,
          });
          savedRecord = results?.[0];
        }
      } else {
        const results = await restPatch(`registros_ponto?id=eq.${registroHoje.id}`, { 
          [campo]: agora,
          ...auditMetadata,
        });
        savedRecord = results?.[0];
      }

      // Log audit event
      logAuditEvent(userId, `registro_ponto_${campo}`, {
        campo,
        horario: agora,
        data: hoje,
        registro_folga: isRegistroFolga,
        geolocation: geoLocation,
        hash_registro: hashRegistro,
        hash_anterior: previousHash,
      }, clientIP);

      const hora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      // Generate comprovante for saida (end of shift) - auto-generate receipt
      if (campo === "saida" && savedRecord) {
        try {
          await generateComprovante(userId, hoje, savedRecord, clientIP, geoLocation);
        } catch (e) {
          console.warn("Erro ao gerar comprovante (non-blocking):", e);
        }
      }

      if (campo === "entrada") {
        setPopup({
          message: "Entrada registrada com sucesso. Bom trabalho!",
          description: `Registrado às ${hora} | Hash: ${hashRegistro.substring(0, 12)}...`,
        });
      } else if (campo === "saida") {
        setPopup({
          message: "Ponto de saída confirmado com sucesso. Tenha um ótimo descanso!",
          description: `Registrado às ${hora} | Comprovante gerado`,
        });
      } else {
        setPopup({
          message: `${label} registrado com sucesso!`,
          description: `Registrado às ${hora} | Hash: ${hashRegistro.substring(0, 12)}...`,
        });
      }

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

  const generateComprovante = async (userId: string, data: string, registro: any, ip: string, geo: string) => {
    const pausas: any[] = [];
    if (registro.saida_pausa_1) pausas.push({ tipo: 'Pausa 1', saida: registro.saida_pausa_1, retorno: registro.retorno_pausa_1 });
    if (registro.saida_almoco) pausas.push({ tipo: 'Almoço', saida: registro.saida_almoco, retorno: registro.retorno_almoco });
    if (registro.saida_pausa_2) pausas.push({ tipo: 'Pausa 2', saida: registro.saida_pausa_2, retorno: registro.retorno_pausa_2 });

    const comprovanteData = `${registro.id}|${userId}|${data}|${registro.entrada}|${registro.saida}|${registro.total_horas}|${registro.horas_extras}|${Date.now()}`;
    const hashComprovante = await generateHash(comprovanteData);
    const assinaturaDigital = await generateHash(`ASSINATURA|${hashComprovante}|${registro.hash_registro}|GRUPO_ATIVA_REP_A`);

    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'rzcjwfxmogfsmfbwtwfc';
    
    const comprovanteBody = {
      user_id: userId,
      data_jornada: data,
      horario_entrada: registro.entrada,
      horario_saida: registro.saida,
      pausas,
      total_horas: registro.total_horas,
      total_horas_extras: registro.horas_extras,
      hash_comprovante: hashComprovante,
      assinatura_digital: assinaturaDigital,
      ip_address: ip,
      user_agent: navigator.userAgent,
      geolocation: geo,
      origem: 'web',
    };

    const results = await restPost('comprovantes_ponto', comprovanteBody);
    const saved = results?.[0];
    
    if (saved) {
      // Build QR code data with verification URL
      const verificationUrl = `${window.location.origin}/verificar-comprovante/${saved.id}`;
      const qrData = JSON.stringify({
        id: saved.id,
        hash: hashComprovante,
        url: verificationUrl,
      });

      // Update with qr_code_data
      await restPatch(`comprovantes_ponto?id=eq.${saved.id}`, {
        qr_code_data: qrData,
      });

      setComprovante({
        ...saved,
        qr_code_data: qrData,
        registro,
        profile,
      });
    }
  };

  // Sequential enforcement: each marking requires the previous one to be completed.
  // Exception: "Saída" is always available after "Entrada" (end-of-shift).
  const hasPendingPause1 = !!registroHoje?.saida_pausa_1 && !registroHoje?.retorno_pausa_1;
  const hasPendingAlmoco = !!registroHoje?.saida_almoco && !registroHoje?.retorno_almoco;
  const hasPendingPause2 = !!registroHoje?.saida_pausa_2 && !registroHoje?.retorno_pausa_2;
  const hasAnyPendingPause = hasPendingPause1 || hasPendingAlmoco || hasPendingPause2;

  // Determine the current "step" — only the next sequential action is enabled
  const getSequentialDisabled = () => {
    const r = registroHoje;
    if (!r) return { canOnlyEntrada: true };

    // If a pause is open, only the matching return is allowed (+ saída as exception)
    if (hasPendingPause1) return { onlyAllow: ["retorno_pausa_1", "saida"] };
    if (hasPendingAlmoco) return { onlyAllow: ["retorno_almoco", "saida"] };
    if (hasPendingPause2) return { onlyAllow: ["retorno_pausa_2", "saida"] };

    // Determine next step in sequence
    if (!r.entrada) return { onlyAllow: ["entrada"] };
    if (r.entrada && !r.saida) {
      // After entrada, allow next departure or saída (end shift)
      const allowed: string[] = ["saida"]; // saída always available
      if (!r.saida_pausa_1) allowed.push("saida_pausa_1");
      else if (r.retorno_pausa_1 && !r.saida_almoco) allowed.push("saida_almoco");
      else if (r.retorno_almoco && !r.saida_pausa_2) allowed.push("saida_pausa_2");
      return { onlyAllow: allowed };
    }
    if (r.saida && !r.inicio_he) return { onlyAllow: ["inicio_he"] };
    if (r.inicio_he && !r.fim_he) return { onlyAllow: ["fim_he"] };

    return { onlyAllow: [] as string[] }; // All done
  };

  const seqState = getSequentialDisabled();
  const allowedFields = 'onlyAllow' in seqState ? seqState.onlyAllow : [];
  const onlyEntrada = 'canOnlyEntrada' in seqState;

  const botoes = [
    { campo: "entrada", label: "Entrada", icon: LogIn, variant: "default" as const, disabled: onlyEntrada ? false : !allowedFields.includes("entrada") || !!registroHoje?.entrada },
    { campo: "saida_pausa_1", label: "Saída Pausa 1", icon: Coffee, variant: "outline" as const, disabled: !allowedFields.includes("saida_pausa_1") || !!registroHoje?.saida_pausa_1 },
    { campo: "retorno_pausa_1", label: "Retorno Pausa 1", icon: CornerDownLeft, variant: "outline" as const, disabled: !allowedFields.includes("retorno_pausa_1") || !!registroHoje?.retorno_pausa_1 },
    { campo: "saida_almoco", label: "Saída Almoço", icon: Utensils, variant: "secondary" as const, disabled: !allowedFields.includes("saida_almoco") || !!registroHoje?.saida_almoco },
    { campo: "retorno_almoco", label: "Retorno Almoço", icon: CornerDownLeft, variant: "secondary" as const, disabled: !allowedFields.includes("retorno_almoco") || !!registroHoje?.retorno_almoco },
    { campo: "saida_pausa_2", label: "Saída Pausa 2", icon: Coffee, variant: "outline" as const, disabled: !allowedFields.includes("saida_pausa_2") || !!registroHoje?.saida_pausa_2 },
    { campo: "retorno_pausa_2", label: "Retorno Pausa 2", icon: CornerDownLeft, variant: "outline" as const, disabled: !allowedFields.includes("retorno_pausa_2") || !!registroHoje?.retorno_pausa_2 },
    { campo: "saida", label: "Saída", icon: LogOut, variant: "destructive" as const, disabled: !allowedFields.includes("saida") || !!registroHoje?.saida },
    { campo: "inicio_he", label: "Início HE", icon: Clock, variant: "outline" as const, disabled: !allowedFields.includes("inicio_he") || !!registroHoje?.inicio_he },
    { campo: "fim_he", label: "Fim HE", icon: Clock, variant: "outline" as const, disabled: !allowedFields.includes("fim_he") || !!registroHoje?.fim_he },
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

      {popup && (
        <ConfirmacaoPontoPopup
          message={popup.message}
          description={popup.description}
          duration={3000}
          onClose={() => setPopup(null)}
        />
      )}

      {comprovante && (
        <ComprovantePontoModal
          comprovante={comprovante}
          onClose={() => setComprovante(null)}
        />
      )}
    </Card>
  );
};
