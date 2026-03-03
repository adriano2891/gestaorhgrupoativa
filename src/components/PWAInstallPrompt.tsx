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
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [mounted, setMounted] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;

  useEffect(() => {
    setMounted(true);

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
  }, [isInStandaloneMode]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setIsInstalled(true);
      setDeferredPrompt(null);
    }
  };

  if (!mounted || isInstalled || dismissed) return null;

  // Native install prompt available (Chrome/Android)
  if (deferredPrompt) {
    return createPortal(
      <div className="fixed inset-x-0 bottom-0 z-[120] p-4 flex justify-center safe-bottom pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 bg-white rounded-2xl px-5 py-3 shadow-xl max-w-sm w-full">
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
      </div>,
      document.body,
    );
  }

  // iOS Safari — always show guide
  if (isIOS) {
    return createPortal(
      <div className="fixed inset-x-0 bottom-0 z-[120] p-4 flex justify-center safe-bottom pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-2xl px-5 py-4 shadow-xl max-w-sm w-full relative">
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
      </div>,
      document.body,
    );
  }

  // Desktop browsers — show install guide
  const isChromium = /Chrome|Chromium|Edg/.test(navigator.userAgent);

  return createPortal(
    <div className="fixed inset-x-0 bottom-0 z-[120] p-4 flex justify-center safe-bottom pointer-events-none">
      <div className="pointer-events-auto bg-white rounded-2xl px-5 py-4 shadow-xl max-w-sm w-full relative">
        <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <Download className="w-6 h-6 text-primary shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Instalar App no Desktop</p>
            <p className="text-xs text-muted-foreground">Use como um aplicativo nativo</p>
          </div>
        </div>
        <div className="space-y-2 text-xs text-muted-foreground">
          {isChromium ? (
            <>
              <p>No <strong className="text-foreground">Chrome ou Edge</strong>:</p>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">1</span>
                </div>
                <span>Clique no ícone <strong className="text-foreground">⋮</strong> (menu) no canto superior direito</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-primary">2</span>
                </div>
                <span>Selecione <strong className="text-foreground">"Instalar AtivaRH"</strong></span>
              </div>
            </>
          ) : (
            <p>Abra este site no <strong className="text-foreground">Google Chrome</strong> ou <strong className="text-foreground">Microsoft Edge</strong> para instalar como app.</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default PWAInstallPrompt;
