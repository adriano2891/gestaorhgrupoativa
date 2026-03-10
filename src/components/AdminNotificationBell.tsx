import { useState, useRef, useEffect } from "react";
import { Bell, Calendar, Headphones, Send, Globe, ExternalLink, RefreshCw } from "lucide-react";
import { useAdminNotifications, type AdminNotification } from "@/hooks/useAdminNotifications";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { EnviarNotificacaoDialog } from "@/components/admin/EnviarNotificacaoDialog";

const ICON_MAP: Record<string, React.ReactNode> = {
  ferias: <Calendar className="h-4 w-4 text-amber-500" />,
  suporte: <Headphones className="h-4 w-4 text-blue-500" />,
  chamado: <Headphones className="h-4 w-4 text-blue-500" />,
  web: <Globe className="h-4 w-4 text-yellow-600" />,
};

export const AdminNotificationBell = () => {
  const {
    notifications,
    badgeCount,
    marcarWebComoLida,
    buscarAtualizacoesWeb,
    dismissWebNotifications,
  } = useAdminNotifications();
  const [open, setOpen] = useState(false);
  const [enviarDialogOpen, setEnviarDialogOpen] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    setOpen((o) => {
      if (!o) {
        // Dismiss web notifications from badge on first open
        dismissWebNotifications();
      }
      return !o;
    });
  };

  const handleClick = (notif: AdminNotification) => {
    if (notif.type === "web") {
      const realId = notif.id.replace("web-", "");
      marcarWebComoLida(realId);
      if (notif.url && notif.url !== "#") {
        window.open(notif.url, "_blank", "noopener,noreferrer");
      }
    } else if (notif.route) {
      navigate(notif.route);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className="relative h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        title="Notificações"
      >
        <Bell className={`h-4 w-4 md:h-5 md:w-5 ${badgeCount > 0 && !open ? "text-amber-500 animate-bounce" : badgeCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
        {badgeCount > 0 && !open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-lg animate-pulse">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+3.75rem)] z-[120] w-[min(calc(100vw-1rem),24rem)] -translate-x-1/2 max-h-[calc(100dvh-env(safe-area-inset-top)-4.5rem)] overflow-y-auto overscroll-contain rounded-lg border bg-card shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-h-96 sm:translate-x-0">
          <div className="p-2.5 sm:p-3 border-b flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                {notifications.length > 0 ? `${notifications.length} pendente${notifications.length > 1 ? "s" : ""}` : "Tudo em dia!"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Buscar atualizações da web"
                onClick={() => buscarAtualizacoesWeb()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2.5 text-[11px] sm:text-xs gap-1"
                onClick={() => {
                  setOpen(false);
                  setEnviarDialogOpen(true);
                }}
              >
                <Send className="h-3 w-3" />
                Enviar
              </Button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="p-5 sm:p-6 text-center text-muted-foreground text-sm">
              Nenhuma notificação pendente 🎉
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 15).map((notif, idx) => {
                const isFirstWeb = notif.type === "web" && (idx === 0 || notifications[idx - 1].type !== "web");
                return (
                  <div key={notif.id}>
                    {isFirstWeb && notifications.some(n => n.type !== "web") && (
                      <div className="px-3 py-1.5 bg-muted/30 border-t">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Notícias Externas</p>
                      </div>
                    )}
                    <button
                      onClick={() => handleClick(notif)}
                      className={`w-full text-left p-2.5 sm:p-3 hover:bg-muted/50 transition-colors flex gap-2.5 sm:gap-3 items-start ${
                        notif.type === "web" ? "bg-yellow-50/80 dark:bg-yellow-950/20 border-l-4 border-l-yellow-400" : ""
                      }`}
                    >
                      <div className="mt-0.5 flex-shrink-0">
                        {ICON_MAP[notif.type] || <Bell className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[13px] sm:text-sm font-medium text-foreground break-words leading-snug flex-1">
                            {notif.title}
                          </p>
                          {notif.type === "web" && (
                            <ExternalLink className="h-3 w-3 text-yellow-600 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] sm:text-xs text-muted-foreground break-words leading-snug mt-0.5">
                          {notif.description}
                        </p>
                        {notif.type === "web" && notif.fonte && (
                          <p className="text-[10px] font-medium text-yellow-700 dark:text-yellow-400 mt-0.5">
                            📌 {notif.fonte}
                          </p>
                        )}
                        <p className="text-[10px] text-muted-foreground/70 mt-1">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                        </p>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <EnviarNotificacaoDialog open={enviarDialogOpen} onOpenChange={setEnviarDialogOpen} />
    </div>
  );
};
