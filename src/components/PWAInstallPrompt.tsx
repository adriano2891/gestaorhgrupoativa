import { useState, useEffect } from "react";
import { Download, Share, Plus, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

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

  // iOS Safari guide
  if (isIOS && !deferredPrompt) {
    return (
      <>
        {!showIOSGuide ? (
          <button
            onClick={() => setShowIOSGuide(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#3EE0CF] text-gray-900 font-semibold rounded-xl hover:bg-[#3EE0CF]/90 transition-all hover:scale-105 animate-fade-in text-sm"
          >
            <Download className="w-5 h-5" />
            Instalar App
          </button>
        ) : (
          <div className="relative bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-5 max-w-xs animate-fade-in">
            <button onClick={() => setDismissed(true)} className="absolute top-2 right-2 text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
            <p className="text-white font-bold text-sm mb-3">Para instalar no iPhone/iPad:</p>
            <div className="space-y-3 text-white/80 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#3EE0CF]/20 flex items-center justify-center shrink-0">
                  <Share className="w-3.5 h-3.5 text-[#3EE0CF]" />
                </div>
                <span>Toque no botão <strong>Compartilhar</strong> na barra do Safari</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#3EE0CF]/20 flex items-center justify-center shrink-0">
                  <Plus className="w-3.5 h-3.5 text-[#3EE0CF]" />
                </div>
                <span>Selecione <strong>"Adicionar à Tela de Início"</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#3EE0CF]/20 flex items-center justify-center shrink-0">
                  <Download className="w-3.5 h-3.5 text-[#3EE0CF]" />
                </div>
                <span>Toque em <strong>"Adicionar"</strong> para confirmar</span>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Chrome/Android prompt
  if (deferredPrompt) {
    return (
      <button
        onClick={handleInstall}
        className="flex items-center gap-2 px-5 py-3 bg-[#3EE0CF] text-gray-900 font-semibold rounded-xl hover:bg-[#3EE0CF]/90 transition-all hover:scale-105 animate-fade-in text-sm"
      >
        <Download className="w-5 h-5" />
        Instalar App
      </button>
    );
  }

  return null;
};

export default PWAInstallPrompt;
