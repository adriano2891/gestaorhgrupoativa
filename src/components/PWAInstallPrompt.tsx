import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, Share, Plus, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  useEffect(() => {
    const inStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (inStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    // Small delay for smooth entrance
    const timer = setTimeout(() => setVisible(true), 1200);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => setDismissed(true), 300);
  };

  if (isInstalled || dismissed) return null;

  const showPrompt = deferredPrompt || isIOS;
  if (!showPrompt) return null;

  const banner = (
    <div
      className={`fixed top-0 inset-x-0 z-[120] transition-all duration-300 ease-out ${
        visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
      }`}
    >
      <div className="bg-card/95 backdrop-blur-md border-b border-border shadow-sm px-4 py-2.5 safe-top">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <img
            src="/pwa-icon.png"
            alt="AtivaRH"
            className="w-9 h-9 rounded-xl shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground leading-tight truncate">
              Instale o AtivaRH
            </p>
            {isIOS ? (
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Toque em <Share className="w-3 h-3 inline -mt-0.5" /> → <strong>Adicionar à Tela de Início</strong>
              </p>
            ) : (
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
                Acesso rápido direto da sua tela inicial
              </p>
            )}
          </div>
          {deferredPrompt && (
            <button
              onClick={handleInstall}
              className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity shrink-0"
            >
              Instalar
            </button>
          )}
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground shrink-0 p-1"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(banner, document.body);
};

export default PWAInstallPrompt;
