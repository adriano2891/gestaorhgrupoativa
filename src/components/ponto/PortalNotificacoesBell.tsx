import { useState, useRef, useEffect } from "react";
import { Bell, AlertTriangle, Info, CheckCircle2, Megaphone } from "lucide-react";
import { useNotificacoesPortal } from "@/hooks/useNotificacoes";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";

const TIPO_ICONS: Record<string, React.ReactNode> = {
  urgente: <AlertTriangle className="h-4 w-4 text-red-500" />,
  aviso: <Megaphone className="h-4 w-4 text-amber-500" />,
  tarefa: <CheckCircle2 className="h-4 w-4 text-blue-500" />,
  info: <Info className="h-4 w-4 text-primary" />,
};

const PRIORIDADE_COLORS: Record<string, string> = {
  urgente: "border-l-red-500",
  alta: "border-l-amber-500",
  normal: "border-l-blue-500",
  baixa: "border-l-muted-foreground",
};

export const PortalNotificacoesBell = () => {
  const { notificacoes, naoLidas, totalNaoLidas, marcarComoLida, marcarTodasComoLidas } =
    useNotificacoesPortal();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
        title="Notificações"
      >
        <Bell
          className={`h-5 w-5 ${totalNaoLidas > 0 ? "text-amber-500 animate-bounce" : "text-muted-foreground"}`}
        />
        {totalNaoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-lg animate-pulse">
            {totalNaoLidas > 99 ? "99+" : totalNaoLidas}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-h-[70vh] overflow-y-auto bg-card border rounded-lg shadow-xl z-[100]">
          <div className="p-3 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
              <p className="text-xs text-muted-foreground">
                {totalNaoLidas > 0
                  ? `${totalNaoLidas} não lida${totalNaoLidas > 1 ? "s" : ""}`
                  : "Tudo em dia!"}
              </p>
            </div>
            {totalNaoLidas > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => marcarTodasComoLidas()}
              >
                Marcar todas
              </Button>
            )}
          </div>

          {notificacoes.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground text-sm">
              Nenhuma notificação 🎉
            </div>
          ) : (
            <div className="divide-y">
              {notificacoes.slice(0, 20).map((notif) => {
                const isUnread = naoLidas.some((n) => n.id === notif.id);
                return (
                  <button
                    key={notif.id}
                    onClick={() => {
                      if (isUnread) marcarComoLida(notif.id);
                    }}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 items-start border-l-4 ${
                      PRIORIDADE_COLORS[notif.prioridade] || "border-l-transparent"
                    } ${isUnread ? "bg-primary/5" : ""}`}
                  >
                    <div className="mt-0.5 flex-shrink-0">
                      {TIPO_ICONS[notif.tipo] || <Info className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium truncate ${isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                          {notif.titulo}
                        </p>
                        {isUnread && (
                          <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notif.mensagem}
                      </p>
                      <p className="text-[10px] text-muted-foreground/70 mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
