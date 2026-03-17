import { useState, useEffect } from "react";
import logoAtiva from "@/assets/logo-ativa-3d.png";

export const DashboardPreloader = ({ onFinish }: { onFinish: () => void }) => {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2500);
    const removeTimer = setTimeout(() => onFinish(), 3300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [onFinish]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0d1b2a 0%, #1b2d3e 40%, #0f2027 100%)",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.8s ease-in-out",
      }}
    >
      <img
        src={logoAtiva}
        alt="Logo Grupo Ativa"
        className="w-40 sm:w-52 md:w-60 h-auto"
        style={{
          animation: "pl-fade-in 0.6s ease-out forwards, pl-breathe 2.5s ease-in-out 0.6s infinite",
          opacity: 0,
          filter: "drop-shadow(0 0 30px rgba(62,224,207,0.35))",
        }}
      />
      <div style={{ marginTop: 32 }}>
        <svg width="36" height="36" viewBox="0 0 36 36" style={{ animation: "pl-rotate 1.2s linear infinite" }}>
          <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(62,224,207,0.25)" strokeWidth="2.5" />
          <circle
            cx="18" cy="18" r="15" fill="none" stroke="#3ee0cf" strokeWidth="2.5"
            strokeLinecap="round" strokeDasharray="70 30"
            style={{ animation: "pl-dash 1.2s ease-in-out infinite" }}
          />
        </svg>
      </div>
      <style>{`
        @keyframes pl-fade-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pl-breathe { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.03); } }
        @keyframes pl-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pl-dash { 0% { stroke-dasharray: 10 90; } 50% { stroke-dasharray: 70 30; } 100% { stroke-dasharray: 10 90; } }
      `}</style>
    </div>
  );
};
