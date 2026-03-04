import { useState, useRef, useEffect } from "react";
import { Bell, Calendar, Headphones, Send } from "lucide-react";
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
};

export const AdminNotificationBell = () => {
  const { notifications, totalCount } = useAdminNotifications();
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

  const handleClick = (notif: AdminNotification) => {
    if (notif.route) {
      navigate(notif.route);
    }
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative h-8 w-8 md:h-10 md:w-10 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
        title="Notificações"
      >
        <Bell className={`h-4 w-4 md:h-5 md:w-5 ${totalCount > 0 && !open ? "text-amber-500 animate-bounce" : totalCount > 0 ? "text-amber-500" : "text-muted-foreground"}`} />
        {totalCount > 0 && !open && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-lg animate-pulse">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+3.75rem)] z-[120] w-[min(calc(100vw-1rem),24rem)] -translate-x-1/2 max-h-[calc(100dvh-env(safe-area-inset-top)-4.5rem)] overflow-y-auto overscroll-contain rounded-lg border bg-card shadow-xl sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-80 sm:max-h-96 sm:translate-x-0">
          <div className="p-2.5 sm:p-3 border-b flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                {totalCount > 0 ? `${totalCount} pendente${totalCount > 1 ? "s" : ""}` : "Tudo em dia!"}
              </p>
            </div>
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

          {notifications.length === 0 ? (
            <div className="p-5 sm:p-6 text-center text-muted-foreground text-sm">
              Nenhuma notificação pendente 🎉
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 15).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className="w-full text-left p-2.5 sm:p-3 hover:bg-muted/50 transition-colors flex gap-2.5 sm:gap-3 items-start"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {ICON_MAP[notif.type] || <Bell className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] sm:text-sm font-medium text-foreground break-words leading-snug">
                      {notif.title}
                    </p>
                    <p className="text-[11px] sm:text-xs text-muted-foreground break-words leading-snug mt-0.5">
                      {notif.description}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <EnviarNotificacaoDialog open={enviarDialogOpen} onOpenChange={setEnviarDialogOpen} />
    </div>
  );
};
