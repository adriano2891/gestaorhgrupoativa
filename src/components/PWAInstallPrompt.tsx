import { useState, useEffect } from "react";
import { Download, Share, Plus, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = window.matchMedia("(display-mode: standalone)").matches
    || (navigator as any).standalone === true;

  useEffect(() => {
    if (isInStandaloneMode) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
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

  if (isInstalled || dismissed) return null;

  // Native install prompt available (Chrome/Android)
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-md flex justify-center safe-bottom">
        <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-xl max-w-sm w-full">
          <Download className="w-6 h-6 text-primary shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Instalar App</p>
            <p className="text-xs text-muted-foreground">Acesse direto da tela inicial</p>
          </div>
          <button
            onClick={handleInstall}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Instalar
          </button>
          <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground ml-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // iOS Safari — always show guide
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-black/40 backdrop-blur-md flex justify-center safe-bottom">
        <div className="bg-white rounded-2xl px-5 py-4 shadow-xl max-w-sm w-full relative">
          <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
          {!showIOSGuide ? (
            <button
              onClick={() => setShowIOSGuide(true)}
              className="flex items-center gap-3 w-full"
            >
              <Download className="w-6 h-6 text-primary shrink-0" />
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-foreground">Instalar App</p>
                <p className="text-xs text-muted-foreground">Toque para ver como instalar</p>
              </div>
            </button>
          ) : (
            <div>
              <p className="font-bold text-sm text-foreground mb-3">Para instalar no iPhone/iPad:</p>
              <div className="space-y-3 text-muted-foreground text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Share className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span>Toque no botão <strong className="text-foreground">Compartilhar</strong> na barra do Safari</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Plus className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span>Selecione <strong className="text-foreground">"Adicionar à Tela de Início"</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Download className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span>Toque em <strong className="text-foreground">"Adicionar"</strong> para confirmar</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Desktop/other browsers without native prompt — don't show anything
  return null;
};

export default PWAInstallPrompt;
