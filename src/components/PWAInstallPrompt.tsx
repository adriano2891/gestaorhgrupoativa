import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Share, X } from "lucide-react";

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
    const inStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true;

    if (inStandalone) {
      setIsInstalled(true);
      return;
    }

    const timer = setTimeout(() => setVisible(true), 1500);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setIsInstalled(true));

    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", handler);
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
    setTimeout(() => setDismissed(true), 400);
  };

  if (isInstalled || dismissed) return null;
  if (!deferredPrompt && !isIOS) return null;

  const banner = (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        transition: "transform 0.4s cubic-bezier(.4,0,.2,1), opacity 0.4s ease",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "10px 16px",
          paddingTop: "max(10px, env(safe-area-inset-top))",
        }}
      >
        <div
          style={{
            maxWidth: 480,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <img
            src="/pwa-icon.png"
            alt="AtivaRH"
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              flexShrink: 0,
            }}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 600,
                color: "#f1f5f9",
                lineHeight: 1.3,
              }}
            >
              Instale o app para uma melhor experiência.
            </p>
            {isIOS && (
              <p
                style={{
                  margin: "2px 0 0",
                  fontSize: 11,
                  color: "#94a3b8",
                  lineHeight: 1.3,
                }}
              >
                Toque em{" "}
                <Share
                  style={{
                    width: 12,
                    height: 12,
                    display: "inline",
                    verticalAlign: "-1px",
                  }}
                />{" "}
                → <strong>Adicionar à Tela de Início</strong>
              </p>
            )}
          </div>

          {deferredPrompt && (
            <button
              onClick={handleInstall}
              style={{
                padding: "6px 16px",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
                flexShrink: 0,
                letterSpacing: 0.3,
              }}
            >
              Instalar
            </button>
          )}

          <button
            onClick={handleDismiss}
            aria-label="Fechar"
            style={{
              background: "none",
              border: "none",
              color: "#64748b",
              cursor: "pointer",
              padding: 4,
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(banner, document.body);
};

export default PWAInstallPrompt;
