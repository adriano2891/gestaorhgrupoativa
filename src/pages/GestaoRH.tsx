import { useState, useEffect, useMemo } from "react";
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
import iconFuncionarios from "@/assets/icon-rh-funcionarios.png";
import iconTalentos from "@/assets/icon-rh-talentos.png";
import iconRelatorios from "@/assets/icon-rh-relatorios.png";
import iconPonto from "@/assets/icon-rh-ponto.png";
import iconHolerites from "@/assets/icon-rh-holerites.png";
import iconComunicados from "@/assets/icon-rh-comunicados.png";
import iconAdmins from "@/assets/icon-rh-admins.png";
import iconFormularios from "@/assets/icon-rh-formularios.png";
import iconCursos from "@/assets/icon-rh-cursos.png";

interface ModuleItem {
  title: string;
  description: string;
  iconSrc: string;
  path: string;
  scaleIcon?: boolean;
  iconScale?: string;
  badgeKey?: string;
}

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
  const isAdmin = isSuperAdmin || roles.includes("rh") || roles.includes("gestor");

  // Count badges per route
  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((n) => {
      if (n.route) {
        counts[n.route] = (counts[n.route] || 0) + 1;
      }
    });
    return counts;
  }, [notifications]);

  // Trigger entry animation on mount
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const modules: ModuleItem[] = [
    { title: "Funcionários", description: "Gestão de colaboradores", iconSrc: iconFuncionarios, path: "/funcionarios" },
    { title: "Banco de Talentos", description: "Candidatos e recrutamento", iconSrc: iconTalentos, path: "/banco-talentos", scaleIcon: true },
    { title: "Relatórios", description: "Análises e indicadores", iconSrc: iconRelatorios, path: "/relatorios" },
    { title: "Folha de Ponto", description: "Controle de jornada", iconSrc: iconPonto, path: "/folha-ponto", iconScale: "scale-150" },
    { title: "Holerites", description: "Gestão de pagamentos", iconSrc: iconHolerites, path: "/holerites", scaleIcon: true },
    { title: "Comunicados", description: "Avisos e notificações internas", iconSrc: iconComunicados, path: "/comunicados", scaleIcon: true },
    { title: "Formulários", description: "Gestão de Formulários", iconSrc: iconFormularios, path: "/hrflow-pro", scaleIcon: true },
    { title: "Cursos", description: "Treinamentos corporativos", iconSrc: iconCursos, path: "/cursos", scaleIcon: true },
    { title: "Suporte", description: "Chamados dos funcionários", iconSrc: iconComunicados, path: "/suporte-funcionarios", scaleIcon: true, badgeKey: "/suporte-funcionarios" },
  ];

  if (isSuperAdmin) {
    modules.push({ title: "Gerenciar Admins", description: "Controle de administradores", iconSrc: iconAdmins, path: "/admins", scaleIcon: true });
  }

  // Helper to render badge
  const renderBadge = (module: ModuleItem) => {
    const count = badgeCounts[module.path] || 0;
    if (count === 0) return null;
    return (
      <span className="absolute -top-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg animate-pulse z-20 ring-2 ring-white">
        {count > 99 ? "99+" : count}
      </span>
    );
  };

  const handleLogout = async () => {
    await signOut();
  };

  // Calculate circular position
  const getModulePosition = (index: number, total: number, radius: number) => {
    const angleStep = (2 * Math.PI) / total;
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  // Animation styles
  const animationStyles = `
    @keyframes rh-fade-in {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes rh-logo-scale {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 0.4; transform: scale(1); }
    }
    @keyframes rh-module-pop {
      from { opacity: 0; transform: scale(0.7); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes rh-icon-glow {
      0%, 100% { 
        box-shadow: 0 0 20px rgba(255,255,255,0.4), 0 8px 30px rgba(0,0,0,0.2);
        filter: brightness(1);
      }
      50% { 
        box-shadow: 0 0 40px rgba(255,255,255,0.8), 0 0 60px rgba(62,224,207,0.6), 0 12px 40px rgba(0,0,0,0.25);
        filter: brightness(1.15);
      }
    }
    @keyframes rh-shine {
      0% { transform: translateX(-100%) rotate(25deg); }
      100% { transform: translateX(200%) rotate(25deg); }
    }
    .rh-animate-header { animation: rh-fade-in 0.4s ease-out forwards; }
    .rh-animate-title { animation: rh-fade-in 0.5s ease-out 0.1s forwards; opacity: 0; }
    .rh-animate-logo { animation: rh-logo-scale 0.6s ease-out 0.2s forwards; opacity: 0; }
    .rh-animate-module { animation: rh-module-pop 0.4s ease-out forwards; opacity: 0; }
    .rh-module-icon {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .rh-module-icon:hover {
      transform: scale(1.15) translateY(-5px);
    }
    .rh-module-icon:hover .rh-icon-ring {
      animation: rh-icon-glow 1.5s ease-in-out infinite;
    }
    .rh-module-icon:hover .rh-icon-ring::before {
      animation: rh-shine 0.8s ease-out;
    }
    .rh-module-icon:active {
      transform: scale(1.05) translateY(-2px);
    }
    .rh-icon-ring {
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }
    .rh-icon-ring::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 50%;
      height: 200%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255,255,255,0.4),
        transparent
      );
      transform: translateX(-100%) rotate(25deg);
      z-index: 10;
      pointer-events: none;
    }
    .rh-icon-ring:hover {
      box-shadow: 0 0 35px rgba(255,255,255,0.6), 0 0 50px rgba(62,224,207,0.4), 0 10px 35px rgba(0,0,0,0.2);
    }
  `;

  // Mobile/Tablet layout
  if (isMobile) {
    return (
      <div className="min-h-screen relative overflow-x-hidden overflow-y-auto safe-bottom safe-top" style={{ backgroundColor: '#40E0D0' }}>
        <style>{animationStyles}</style>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 pb-2 ${isAnimating ? 'rh-animate-header' : ''}`}>
          <BackButton 
            to="/dashboard" 
            variant="light" 
            className="touch-target"
          />
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-white hover:opacity-80 transition-opacity touch-target"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Sair</span>
          </button>
        </div>

        {/* Título */}
        <div className={`text-center py-2 sm:py-3 px-3 sm:px-4 ${isAnimating ? 'rh-animate-title' : ''}`}>
          <h1 
            className="text-xl sm:text-2xl md:text-3xl text-white font-bold"
            style={{ 
              fontFamily: "Arial, sans-serif",
              textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            Gestão RH
          </h1>
        </div>

        {/* Logo */}
        <div className={`flex justify-center mb-3 sm:mb-4 ${isAnimating ? 'rh-animate-logo' : 'opacity-40'}`}>
          <img src={logoAtiva} alt="Logo Grupo Ativa" className="w-20 sm:w-24 md:w-32 h-auto" />
        </div>

        {/* Grid de Módulos */}
        <div className="px-3 sm:px-4 pb-6 sm:pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 max-w-lg mx-auto">
            {modules.map((module, index) => (
              <div
                key={module.path}
                className={`rh-module-icon cursor-pointer flex flex-col items-center ${isAnimating ? 'rh-animate-module' : ''}`}
                style={isAnimating ? { animationDelay: `${0.3 + index * 0.08}s` } : {}}
                onClick={() => navigate(module.path)}
              >
                <div className="relative">
                  {renderBadge(module)}
                  <div className="rh-icon-ring rounded-full shadow-lg overflow-hidden w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 ring-2 ring-white/30">
                    <img src={module.iconSrc} alt={module.title} className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-125' : '')}`} />
                  </div>
                </div>
                <p 
                  className="text-center mt-1.5 sm:mt-2 font-semibold text-white text-[9px] sm:text-[10px] md:text-xs leading-tight max-w-[80px] sm:max-w-[90px]"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
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
      <style>{animationStyles}</style>
      
      {/* Header */}
      <div className={`flex items-center justify-between px-4 md:px-6 lg:px-8 pt-4 lg:pt-6 ${isAnimating ? 'rh-animate-header' : ''}`}>
        <div className="flex flex-col items-start min-w-0">
          <BackButton 
            to="/dashboard" 
            variant="light"
          />
          {/* Título */}
          <h1 
            className={`text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white mt-2 font-bold truncate ${isAnimating ? 'rh-animate-title' : ''}`}
            style={{ 
              fontFamily: "Arial, sans-serif",
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            Gestão RH
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity self-start flex-shrink-0"
        >
          <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
          <span className="text-sm lg:text-lg font-medium">Sair</span>
        </button>
      </div>

      {/* Container central */}
      <div className="relative w-full flex items-center justify-center px-4 min-h-[400px]" style={{ height: 'calc(100vh - 180px)' }}>
        
        {/* Logo Central */}
        <div className={`absolute inset-0 flex items-center justify-center pointer-events-none z-0 ${isAnimating ? 'rh-animate-logo' : 'opacity-90'}`}>
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-40 md:w-56 lg:w-72 xl:w-80 2xl:w-96 h-auto"
            style={!isAnimating ? { opacity: 0.9 } : {}}
          />
        </div>

        {/* Layout Circular - XL */}
        <div className="hidden xl:block relative" style={{ width: '700px', height: '500px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 260);
            return (
              <div
                key={module.path}
                className={`absolute rh-module-icon cursor-pointer ${isAnimating ? 'rh-animate-module' : ''}`}
                style={{ 
                  left: '50%', 
                  top: '50%', 
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  ...(isAnimating ? { animationDelay: `${0.3 + index * 0.08}s` } : {})
                }}
                onClick={() => navigate(module.path)}
              >
                <div className="relative">
                  {renderBadge(module)}
                  <div className="rh-icon-ring rounded-full shadow-lg overflow-hidden w-28 h-28 ring-4 ring-white/30">
                    <img src={module.iconSrc} alt={module.title} className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-125' : '')}`} />
                  </div>
                </div>
                <p className="text-center mt-3 font-semibold text-white text-sm max-w-[120px]" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Layout Circular - LG */}
        <div className="hidden lg:block xl:hidden relative" style={{ width: '600px', height: '450px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 220);
            return (
              <div
                key={module.path}
                className={`absolute rh-module-icon cursor-pointer ${isAnimating ? 'rh-animate-module' : ''}`}
                style={{ 
                  left: '50%', 
                  top: '50%', 
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  ...(isAnimating ? { animationDelay: `${0.3 + index * 0.08}s` } : {})
                }}
                onClick={() => navigate(module.path)}
              >
                <div className="relative">
                  {renderBadge(module)}
                  <div className="rh-icon-ring rounded-full shadow-lg overflow-hidden w-24 h-24 ring-3 ring-white/30">
                    <img src={module.iconSrc} alt={module.title} className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-125' : '')}`} />
                  </div>
                </div>
                <p className="text-center mt-2 font-semibold text-white text-xs max-w-[100px]" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Layout Circular - MD */}
        <div className="hidden md:block lg:hidden relative" style={{ width: '500px', height: '400px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 180);
            return (
              <div
                key={module.path}
                className={`absolute rh-module-icon cursor-pointer ${isAnimating ? 'rh-animate-module' : ''}`}
                style={{ 
                  left: '50%', 
                  top: '50%', 
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  ...(isAnimating ? { animationDelay: `${0.3 + index * 0.08}s` } : {})
                }}
                onClick={() => navigate(module.path)}
              >
                <div className="relative">
                  {renderBadge(module)}
                  <div className="rh-icon-ring rounded-full shadow-lg overflow-hidden w-20 h-20 ring-2 ring-white/30">
                    <img src={module.iconSrc} alt={module.title} className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-125' : '')}`} />
                  </div>
                </div>
                <p className="text-center mt-2 font-semibold text-white text-[10px] max-w-[80px]" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Layout Grid - SM (tablets pequenos) */}
        <div className="block md:hidden relative">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 max-w-md mx-auto">
            {modules.map((module, index) => (
              <div
                key={module.path}
                className={`rh-module-icon cursor-pointer flex flex-col items-center ${isAnimating ? 'rh-animate-module' : ''}`}
                style={isAnimating ? { animationDelay: `${0.3 + index * 0.08}s` } : {}}
                onClick={() => navigate(module.path)}
              >
                <div className="relative">
                  {renderBadge(module)}
                  <div className="rh-icon-ring rounded-full shadow-lg overflow-hidden w-16 h-16 sm:w-20 sm:h-20 ring-2 ring-white/30">
                    <img src={module.iconSrc} alt={module.title} className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-125' : '')}`} />
                  </div>
                </div>
                <p className="text-center mt-2 font-semibold text-white text-[9px] sm:text-[10px] max-w-[65px] sm:max-w-[70px] leading-tight" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GestaoRH;
