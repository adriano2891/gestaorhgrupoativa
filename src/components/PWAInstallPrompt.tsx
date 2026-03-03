import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface Window {
    __installPromptBound?: boolean;
  }
}

let cachedInstallPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined" && !window.__installPromptBound) {
  window.__installPromptBound = true;
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    cachedInstallPrompt = event as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("install-prompt-ready"));
  });
}

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(cachedInstallPrompt);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);

  const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent), []);

  useEffect(() => {
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    if (inStandalone) {
      setIsInstalled(true);
      return;
    }

    const onPromptReady = () => setDeferredPrompt(cachedInstallPrompt);
    const onAppInstalled = () => setIsInstalled(true);

    window.addEventListener("install-prompt-ready", onPromptReady);
    window.addEventListener("appinstalled", onAppInstalled);

    onPromptReady();

    return () => {
      window.removeEventListener("install-prompt-ready", onPromptReady);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  useEffect(() => {
    const shouldShow = !isInstalled && !dismissed && (!!deferredPrompt || isIOS);
    if (!shouldShow) {
      setVisible(false);
      return;
    }

    const timer = window.setTimeout(() => setVisible(true), 200);
    return () => window.clearTimeout(timer);
  }, [deferredPrompt, dismissed, isIOS, isInstalled]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") setIsInstalled(true);

    cachedInstallPrompt = null;
    setDeferredPrompt(null);
  };

  if (isInstalled || dismissed || (!deferredPrompt && !isIOS)) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[99999] pt-[max(env(safe-area-inset-top),0.25rem)]">
      <div
        className={`pointer-events-auto mx-auto w-full transition-all duration-300 ease-out ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"
        }`}
      >
        <div className="border-b border-border/70 bg-background/95 px-3 py-2 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85 sm:px-4">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
            <img
              src="/pwa-icon.png"
              alt="Ícone do app AtivaRH"
              className="h-9 w-9 shrink-0 rounded-lg border border-border/60"
              loading="lazy"
            />

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">Instale o app para uma melhor experiência.</p>
              {isIOS && (
                <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                  Toque em <Share className="h-3.5 w-3.5" /> Compartilhar → Adicionar à Tela de Início
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {!isIOS && deferredPrompt && (
                <Button size="sm" onClick={handleInstall} className="h-8 px-3 text-xs font-semibold">
                  Instalar
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setDismissed(true)}
                className="h-8 px-2.5 text-xs text-muted-foreground"
              >
                Agora não
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PWAInstallPrompt;

