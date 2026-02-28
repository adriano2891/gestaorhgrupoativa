import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

interface ConfirmacaoPontoPopupProps {
  message: string;
  description?: string;
  duration?: number;
  onClose: () => void;
}

export const ConfirmacaoPontoPopup = ({
  message,
  description,
  duration = 3000,
  onClose,
}: ConfirmacaoPontoPopupProps) => {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => handleClose(), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setExiting(true);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 pointer-events-none">
      <div
        className={`pointer-events-auto relative bg-white rounded-2xl shadow-2xl border border-border/50 px-8 py-6 max-w-sm w-full text-center transition-all duration-300 ease-out ${
          visible && !exiting
            ? "opacity-100 scale-100"
            : "opacity-0 scale-90"
        }`}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
          <p className="text-base font-semibold text-foreground leading-snug">
            {message}
          </p>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
};
