import { useState, useEffect, useMemo, useCallback } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  useMetricasRealtime, 
  useFuncionariosRealtime, 
  useComunicadosRealtime 
} from "@/hooks/useRealtimeUpdates";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/ui/back-button";
import logoAtiva from "@/assets/logo-ativa.png";
import logoCenterRH from "@/assets/logo-gestao-rh-center.png";
import iconFuncionarios from "@/assets/icon-rh-funcionarios.png";
import iconTalentos from "@/assets/icon-rh-talentos.png";
import iconRelatorios from "@/assets/icon-rh-relatorios.png";
import iconPonto from "@/assets/icon-rh-ponto.png";
import iconHolerites from "@/assets/icon-rh-holerites.png";
import iconComunicados from "@/assets/icon-rh-comunicados.png";
import iconAdmins from "@/assets/icon-rh-admins.png";
import iconFormularios from "@/assets/icon-rh-formularios.png";
import iconCursos from "@/assets/icon-rh-cursos.png";
import iconFerias from "@/assets/icon-rh-ferias.png";
import iconSuporte from "@/assets/icon-rh-suporte.png";
import iconDocumentos from "@/assets/icon-rh-documentos.png";
import { CircularModuleHub, type CircularModule } from "@/components/CircularModuleHub";

const GestaoRH = () => {
  const navigate = useNavigate();
  const { roles, signOut } = useAuth();
  const isMobile = useIsMobile();
  const [isAnimating, setIsAnimating] = useState(true);
  
  useMetricasRealtime();
  useFuncionariosRealtime();
  useComunicadosRealtime();
  const { notifications } = useAdminNotifications();
  const isSuperAdmin = roles.includes("admin");

  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((n) => {
      if (n.route) counts[n.route] = (counts[n.route] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const modules: CircularModule[] = useMemo(() => {
    const mods: CircularModule[] = [
      { id: "funcionarios", title: "Funcionários", iconSrc: iconFuncionarios, path: "/funcionarios", iconScale: "scale-[1.4]" },
      { id: "talentos", title: "Banco de\nTalentos", iconSrc: iconTalentos, path: "/banco-talentos", scaleIcon: true },
      { id: "relatorios", title: "Relatórios", iconSrc: iconRelatorios, path: "/relatorios", iconScale: "scale-[1.4]" },
      { id: "ponto", title: "Controle\nde Ponto", iconSrc: iconPonto, path: "/folha-ponto", iconScale: "scale-[1.3]" },
      { id: "holerites", title: "Holerites", iconSrc: iconHolerites, path: "/holerites", scaleIcon: true },
      { id: "comunicados", title: "Comunicados", iconSrc: iconComunicados, path: "/comunicados", scaleIcon: true },
      { id: "formularios", title: "Formulários", iconSrc: iconFormularios, path: "/hrflow-pro", iconScale: "scale-[1.4]" },
      { id: "cursos", title: "Cursos", iconSrc: iconCursos, path: "/cursos", iconScale: "scale-[1.4]" },
      { id: "ferias", title: "Controle\nde Férias", iconSrc: iconFerias, path: "/controle-ferias", scaleIcon: true },
      { id: "suporte", title: "Suporte ao\nFuncionário", iconSrc: iconSuporte, path: "/suporte-funcionarios", iconScale: "scale-[1.4]" },
      { id: "documentos", title: "Documentos", iconSrc: iconDocumentos, path: "/documentacoes", iconScale: "scale-[1.4]" },
    ];
    if (isSuperAdmin) {
      mods.push({ id: "admins", title: "Gerenciar\nAdmins", iconSrc: iconAdmins, path: "/admins", scaleIcon: true });
    }
    return mods;
  }, [isSuperAdmin]);

  const prefetchMap: Record<string, () => void> = useMemo(() => ({
    '/funcionarios': () => import("./Funcionarios"),
    '/banco-talentos': () => import("./BancoTalentos"),
    '/relatorios': () => import("./Relatorios"),
    '/folha-ponto': () => import("./FolhaPonto"),
    '/holerites': () => import("./Holerites"),
    '/comunicados': () => import("./Comunicados"),
    '/hrflow-pro': () => import("./HRFlowPro"),
    '/cursos': () => import("./CursosAdmin"),
    '/controle-ferias': () => import("./ControleFerias"),
    '/suporte-funcionarios': () => import("./SuporteFuncionarios"),
    '/documentacoes': () => import("./Documentacoes"),
    '/admins': () => import("./GerenciarAdmins"),
  }), []);

  // Eagerly prefetch ALL module chunks after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.values(prefetchMap).forEach(fn => fn());
    }, 300);
    return () => clearTimeout(timer);
  }, [prefetchMap]);

  const handlePrefetch = useCallback((path: string) => {
    prefetchMap[path]?.();
  }, [prefetchMap]);

  const handleLogout = async () => {
    await signOut();
  };

  // Mobile/Tablet layout
  if (isMobile) {
    return (
      <div className="min-h-screen relative overflow-x-hidden overflow-y-auto safe-bottom safe-top" style={{ backgroundColor: '#40E0D0' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
          <BackButton to="/dashboard" variant="light" className="touch-target" />
          <button onClick={handleLogout} className="flex items-center gap-1 text-white hover:opacity-80 transition-opacity touch-target">
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Sair</span>
          </button>
        </div>

        <div className="text-center py-2 sm:py-3 px-3 sm:px-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl text-white font-bold" style={{ fontFamily: "Arial, sans-serif", textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}>
            Gestão RH
          </h1>
        </div>

        <div className="flex justify-center mb-3 sm:mb-4 opacity-40">
          <img src={logoAtiva} alt="Logo Grupo Ativa" className="w-20 sm:w-24 md:w-32 h-auto" />
        </div>

        {/* Grid de Módulos */}
        <div className="px-3 sm:px-4 pb-6 sm:pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5 max-w-lg mx-auto">
            {modules.map((module) => (
              <div
                key={module.id}
                className="cursor-pointer flex flex-col items-center transition-transform duration-200 hover:scale-105 active:scale-95"
                onClick={() => navigate(module.path)}
                onMouseEnter={() => handlePrefetch(module.path)}
              >
                <div className="relative">
                  {(badgeCounts[module.path] || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold shadow-lg z-20 ring-2 ring-white">
                      {(badgeCounts[module.path] || 0) > 99 ? "99+" : badgeCounts[module.path]}
                    </span>
                  )}
                  <div className="rounded-full shadow-lg overflow-hidden w-[68px] h-[68px] sm:w-20 sm:h-20 ring-2 ring-white/30">
                    <img src={module.iconSrc} alt={module.title} className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-125' : '')}`} />
                  </div>
                </div>
                <p 
                  className="text-center mt-2 font-bold text-white text-[11px] sm:text-xs leading-tight max-w-[100px] whitespace-pre-line"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)', fontFamily: 'Arial, Helvetica, sans-serif' }}
                >
                  {module.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout (circular)
  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto" style={{ backgroundColor: '#40E0D0' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-4 lg:pt-6">
        <div className="flex flex-col items-start min-w-0">
          <BackButton to="/dashboard" variant="light" />
          <h1 
            className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white mt-2 font-bold truncate"
            style={{ fontFamily: "Arial, sans-serif", textShadow: '2px 2px 4px rgba(0,0,0,0.1)' }}
          >
            Gestão RH
          </h1>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity self-start flex-shrink-0">
          <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
          <span className="text-sm lg:text-lg font-medium">Sair</span>
        </button>
      </div>

      {/* Container central */}
      <div className="relative w-full flex items-center justify-center px-4 min-h-[400px]" style={{ height: 'calc(100vh - 180px)' }}>
        
        {/* Logo Central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-90">
          <div className="rh-logo-sweep rounded-2xl">
            <img 
              src={logoCenterRH} 
              alt="Logo Grupo Ativa" 
              className="w-40 md:w-56 lg:w-72 xl:w-80 2xl:w-96 h-auto"
              style={{ opacity: 0.9 }}
            />
          </div>
        </div>

        <CircularModuleHub
          modules={modules}
          badgeCounts={badgeCounts}
          onNavigate={(path) => navigate(path)}
          onPrefetch={handlePrefetch}
        />
      </div>

      <style>{`
        @keyframes rh-logo-light-sweep {
          0% { left: -60%; }
          100% { left: 120%; }
        }
        .rh-logo-sweep {
          position: relative;
          overflow: hidden;
        }
        .rh-logo-sweep::after {
          content: '';
          position: absolute;
          top: -20%;
          left: -60%;
          width: 40%;
          height: 140%;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.08) 80%, transparent 100%);
          transform: skewX(-18deg);
          animation: rh-logo-light-sweep 3.5s ease-in-out infinite;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>
    </div>
  );
};

export default GestaoRH;
