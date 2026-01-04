import React from "react";

interface CursosBackgroundProps {
  children: React.ReactNode;
}

export const CursosBackground = ({ children }: CursosBackgroundProps) => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient base */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900" />
      
      {/* Animated gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Primary orb - top left */}
        <div 
          className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full opacity-30 animate-pulse"
          style={{
            background: "radial-gradient(circle, hsl(280 70% 50%) 0%, transparent 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        
        {/* Secondary orb - top right */}
        <div 
          className="absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, hsl(200 80% 50%) 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />
        
        {/* Accent orb - bottom left */}
        <div 
          className="absolute bottom-0 left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(320 70% 45%) 0%, transparent 70%)",
            animation: "float 12s ease-in-out infinite",
          }}
        />
        
        {/* Highlight orb - center right */}
        <div 
          className="absolute top-1/3 right-0 w-[350px] h-[350px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, hsl(170 80% 45%) 0%, transparent 70%)",
            animation: "float 9s ease-in-out infinite reverse",
          }}
        />
        
        {/* Small accent orbs */}
        <div 
          className="absolute top-1/2 left-10 w-[150px] h-[150px] rounded-full opacity-30"
          style={{
            background: "radial-gradient(circle, hsl(45 90% 55%) 0%, transparent 70%)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
        
        <div 
          className="absolute bottom-1/4 right-1/4 w-[200px] h-[200px] rounded-full opacity-25"
          style={{
            background: "radial-gradient(circle, hsl(260 70% 60%) 0%, transparent 70%)",
            animation: "pulse 5s ease-in-out infinite reverse",
          }}
        />
      </div>
      
      {/* Grid pattern overlay */}
      <div 
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
        }}
      />
      
      {/* Noise texture for depth */}
      <div 
        className="fixed inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Glassmorphism overlay for content readability */}
      <div className="fixed inset-0 bg-background/40 backdrop-blur-[1px] pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.05);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.95);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 0.2;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(1.1);
          }
        }
      `}</style>
    </div>
  );
};
