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
        <Bell className={`h-4 w-4 md:h-5 md:w-5 ${totalCount > 0 ? "text-amber-500 animate-bounce" : "text-muted-foreground"}`} />
        {totalCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold shadow-lg animate-pulse">
            {totalCount > 99 ? "99+" : totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-y-auto bg-card border rounded-lg shadow-xl z-[100]">
          <div className="p-3 border-b flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-foreground">Notificações</h3>
              <p className="text-xs text-muted-foreground">
                {totalCount > 0 ? `${totalCount} pendente${totalCount > 1 ? "s" : ""}` : "Tudo em dia!"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="text-xs gap-1"
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
            <div className="p-6 text-center text-muted-foreground text-sm">
              Nenhuma notificação pendente 🎉
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 15).map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleClick(notif)}
                  className="w-full text-left p-3 hover:bg-muted/50 transition-colors flex gap-3 items-start"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {ICON_MAP[notif.type] || <Bell className="h-4 w-4 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{notif.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{notif.description}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
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
