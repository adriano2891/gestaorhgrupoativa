import { useEffect, useMemo, useCallback, useState } from "react";
import { LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import logoAtiva from "@/assets/logo-ativa-3d.png";
import iconHr from "@/assets/icon-rh-new-v2.png";
import iconClients from "@/assets/icon-clients-new.png";
import iconSuppliers from "@/assets/icon-suppliers-new.png";
import iconBudget from "@/assets/icon-orcamentos-new.png";
import iconInventario from "@/assets/icon-inventario-new.png";
import iconDocumentacoes from "@/assets/icon-documentacoes.png";
import iconEmBreve from "@/assets/icon-em-breve.png";
import iconBackups from "@/assets/icon-backups-new.png";
const dashboardBgDesktop = "/dashboard-background-desktop.png";
const dashboardBgMobile = "/dashboard-background-mobile.png";

interface ModuleItem {
  id: string;
  icon: string;
  label: string;
  route?: string;
  disabled?: boolean;
  allowedRoles?: string[]; // roles that can see this module
  rawIcon?: boolean; // if true, render icon image directly without turquoise circle wrapper
}

// Map permission IDs to dashboard module IDs
const PERMISSION_TO_MODULE: Record<string, string> = {
  "gestao-rh": "rh",
  "gestao-clientes": "clients",
  "fornecedores": "suppliers",
  "orcamentos": "budget",
  "inventario": "inventario",
  "documentacoes": "documentacoes",
  "gestao-backups": "backups",
};

const allModules: ModuleItem[] = [
  { id: 'rh', icon: iconHr, label: 'Recursos Humanos', route: '/gestao-rh', allowedRoles: ['admin', 'rh', 'gestor'], rawIcon: true },
  { id: 'clients', icon: iconClients, label: 'Gestão de Clientes', route: '/gestao-clientes', allowedRoles: ['admin', 'gestor'], rawIcon: true },
  { id: 'suppliers', icon: iconSuppliers, label: 'Gestão de Fornecedores', route: '/fornecedores', allowedRoles: ['admin', 'gestor'], rawIcon: true },
  { id: 'budget', icon: iconBudget, label: 'Gestão de Orçamentos', route: '/orcamentos', allowedRoles: ['admin', 'gestor'], rawIcon: true },
  { id: 'inventario', icon: iconInventario, label: 'Gestão de Inventário', route: '/inventario', allowedRoles: ['admin', 'gestor'], rawIcon: true },
  { id: 'documentacoes', icon: iconDocumentacoes, label: 'Gestão de Documentos', route: '/documentacoes-sistema', allowedRoles: ['admin', 'gestor'], rawIcon: true },
  { id: 'backups', icon: iconBackups, label: 'Gestão de Backups', route: '/gestao-backups', allowedRoles: ['admin', 'gestor'], rawIcon: true },
  { id: 'soon', icon: iconEmBreve, label: 'Em Breve', disabled: true, allowedRoles: ['admin'], rawIcon: true },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, roles, loading, user } = useAuth();
  const isMobile = useIsMobile();

  // Prefetch module chunks on hover for instant navigation
  const prefetchMap: Record<string, () => void> = useMemo(() => ({
    '/gestao-rh': () => import("./GestaoRH"),
    '/gestao-clientes': () => import("./GestaoClientes"),
    '/fornecedores': () => import("./Fornecedores"),
    '/orcamentos': () => import("./OrcamentosDashboard"),
    '/inventario': () => import("./InventarioEquipamentos"),
    '/documentacoes-sistema': () => import("./DocumentacoesSistema"),
    '/gestao-backups': () => import("./GestaoBackups"),
  }), []);

  // Eagerly prefetch ALL module chunks after dashboard renders
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.values(prefetchMap).forEach(fn => fn());
    }, 300); // slight delay to not block initial render
    return () => clearTimeout(timer);
  }, [prefetchMap]);

  const handlePrefetch = useCallback((path?: string) => {
    if (path) prefetchMap[path]?.();
  }, [prefetchMap]);

  // Redirecionar funcionários para o portal
  useEffect(() => {
    if (roles.length > 0 && roles.includes("funcionario" as any) && !roles.includes("admin" as any) && !roles.includes("rh" as any) && !roles.includes("gestor" as any)) {
      navigate("/portal-funcionario", { replace: true });
    }
  }, [roles, navigate]);

  // Safety timeout: don't stay on loading forever if roles fail to load
  const [rolesTimeout, setRolesTimeout] = useState(false);
  useEffect(() => {
    if (user && roles.length === 0) {
      const timer = setTimeout(() => setRolesTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, roles.length]);

  const isGestor = roles.includes("gestor" as any) && !roles.includes("admin" as any) && !roles.includes("rh" as any);

  // Load gestor permissions
  const { data: gestorPermissions } = useQuery({
    queryKey: ["gestor-permissions", user?.id],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from("gestor_permissions")
        .select("modulo")
        .eq("user_id", user?.id);
      return (data as any[])?.map((d: any) => d.modulo) || [];
    },
    enabled: isGestor && !!user?.id,
  });

  // While roles are loading, show all modules (will filter once loaded)
  const rolesReady = roles.length > 0 || rolesTimeout;

  // Build allowed module IDs for gestor
  const gestorAllowedModuleIds = useMemo(() => {
    if (!isGestor || !gestorPermissions) return null;
    return new Set(gestorPermissions.map((p: string) => PERMISSION_TO_MODULE[p] || p));
  }, [isGestor, gestorPermissions]);

  const modules = allModules.filter((m) => {
    if (!m.allowedRoles) return true;
    if (!rolesReady) return true;
    if (rolesTimeout && roles.length === 0) return true;
    const hasRole = m.allowedRoles.some((r) => roles.includes(r as any));
    if (!hasRole) return false;
    // For gestor, additionally check granular permissions
    if (isGestor && gestorAllowedModuleIds) {
      return gestorAllowedModuleIds.has(m.id);
    }
    return true;
  });

  const handleLogout = async () => {
    await signOut();
  };

  // Calculate position for each module in a circle
  const getModulePosition = (index: number, total: number, radius: number) => {
    const angleStep = (2 * Math.PI) / total;
    const angle = -Math.PI / 2 + index * angleStep;
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return { x, y };
  };

  // Hover animation styles
  const hoverStyles = `
    @keyframes icon-glow {
      0%, 100% { box-shadow: 0 0 20px rgba(62,224,207,0.3), 0 8px 30px rgba(0,0,0,0.15); }
      50% { box-shadow: 0 0 35px rgba(62,224,207,0.5), 0 12px 40px rgba(0,0,0,0.2); }
    }
    .module-icon-container {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .module-icon-container:hover {
      transform: scale(1.12) translateY(-6px);
    }
    .module-icon-container:hover .icon-ring {
      animation: icon-glow 1.5s ease-in-out infinite;
    }
    .module-icon-container:active {
      transform: scale(1.05) translateY(-2px);
    }
    .icon-ring {
      transition: all 0.3s ease;
    }
    .module-label-card {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(62,224,207,0.25);
      border-radius: 10px;
      padding: 6px 10px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.08);
    }
  `;

  // Mobile layout - Grid based
  if (isMobile) {
    return (
      <div className="min-h-[100dvh] relative overflow-x-hidden overflow-y-auto flex flex-col safe-top safe-bottom">
        {/* Background */}
        <div
          className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
          style={{ backgroundImage: `url(${dashboardBgMobile})` }}
        />
        <div className="fixed inset-0 bg-gradient-to-b from-black/40 via-black/25 to-black/50 -z-10" />

        {/* Header */}
        <div className="flex items-center justify-between px-3 pt-3 pb-2 relative">
          <h1 
            className="text-[13px] 2xs:text-sm font-bold text-white flex-1 text-center px-10 leading-tight"
            style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.5)' }}
          >
            Sistema Integrado GRUPO ATIVA
          </h1>
          <button
            onClick={handleLogout}
            aria-label="Sair do sistema"
            className="flex items-center gap-1 text-white hover:opacity-80 transition-opacity absolute right-3 touch-target focus-ring rounded-md"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            <span className="text-xs">Sair</span>
          </button>
        </div>

        {/* Logo Central */}
        <div className="flex justify-center py-2 2xs:py-3">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-36 2xs:w-40 xxs:w-44 h-auto drop-shadow-lg"
          />
        </div>

        {/* Grid de Módulos */}
        <main className="flex-1 px-2 2xs:px-3 pb-4" role="main">
          <div className="grid grid-cols-2 xxs:grid-cols-3 gap-2 2xs:gap-3 max-w-md mx-auto" role="list" aria-label="Módulos do sistema">
            {modules.map((module) => (
              <button
                key={module.id}
                role="listitem"
                disabled={module.disabled}
                className={`flex flex-col items-center p-2 2xs:p-3 rounded-2xl ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-95'} transition-all duration-200 focus-ring touch-target`}
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(62,224,207,0.3)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                }}
                onClick={() => !module.disabled && module.route && navigate(module.route)}
                onMouseEnter={() => handlePrefetch(module.route)}
                aria-label={module.disabled ? `${module.label} - Em breve` : module.label}
              >
                {module.rawIcon ? (
                  <div className="flex items-center justify-center w-[72px] h-[72px] 2xs:w-20 2xs:h-20 xxs:w-[88px] xxs:h-[88px]">
                    <img 
                      src={module.icon} 
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="w-full h-full object-contain drop-shadow-md"
                    />
                  </div>
                ) : (
                  <div 
                    className="rounded-full flex items-center justify-center overflow-hidden w-16 h-16 2xs:w-[72px] 2xs:h-[72px] xxs:w-20 xxs:h-20 p-2"
                    style={{ backgroundColor: '#40e0d0', boxShadow: '0 4px 15px rgba(64,224,208,0.4), 0 0 0 3px rgba(64,224,208,0.3)' }}
                  >
                    <img 
                      src={module.icon} 
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </button>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Helper to render module button for circle layouts
  const renderCircleModule = (module: ModuleItem, index: number, total: number, radius: number, iconSize: number, ringWidth: string, fontSize: string, maxLabelW: string) => {
    const { x, y } = getModulePosition(index, total, radius);
    return (
      <button
        key={module.id}
        disabled={module.disabled}
        className={`absolute module-icon-container focus-ring rounded-xl ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
        onClick={() => !module.disabled && module.route && navigate(module.route)}
        onMouseEnter={() => handlePrefetch(module.route)}
        aria-label={module.disabled ? `${module.label} - Em breve` : module.label}
      >
        <div className="flex flex-col items-center">
          {module.rawIcon ? (
            <div
              className="icon-ring rounded-full flex items-center justify-center overflow-hidden"
              style={{ width: `${iconSize}px`, height: `${iconSize}px`, minWidth: `${iconSize}px`, minHeight: `${iconSize}px` }}
            >
              <img src={module.icon} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-contain drop-shadow-lg" />
            </div>
          ) : (
            <div
              className={`icon-ring rounded-full flex items-center justify-center overflow-hidden ${ringWidth} p-2`}
              style={{ width: `${iconSize}px`, height: `${iconSize}px`, backgroundColor: '#40e0d0', boxShadow: '0 6px 24px rgba(0,0,0,0.15), 0 0 0 3px rgba(64,224,208,0.3)' }}
            >
              <img src={module.icon} alt="" aria-hidden="true" loading="lazy" className="w-full h-full object-contain" />
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col">
      {/* Background image */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: `url(${dashboardBgDesktop})` }}
      />
      {/* Dark overlay for contrast */}
      <div className="fixed inset-0 bg-gradient-to-b from-black/35 via-black/20 to-black/45 -z-10" />

      <style>{hoverStyles}</style>
      
      {/* Header */}
      <div className="flex items-start justify-between px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 relative z-10">
        <h1 
          className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white italic max-w-[70%]"
          style={{ fontFamily: "'Pacifico', cursive", textShadow: '2px 2px 6px rgba(0,0,0,0.5)' }}
        >
          Sistema Integrado de Gerenciamento GRUPO ATIVA
        </h1>
        <button
          onClick={handleLogout}
          aria-label="Sair do sistema"
          className="flex items-center gap-1 sm:gap-2 text-white hover:opacity-80 transition-opacity flex-shrink-0 focus-ring rounded-md"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" aria-hidden="true" />
          <span className="text-xs sm:text-sm lg:text-lg font-medium" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}>Sair</span>
        </button>
      </div>

      {/* Container central */}
      <div className="flex-1 relative w-full flex items-center justify-center px-4 py-2 min-h-[400px]">
        
        {/* Logo Central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-56 sm:w-52 md:w-60 lg:w-72 xl:w-80 2xl:w-96 h-auto drop-shadow-2xl opacity-90"
          />
        </div>

        {/* XL */}
        <div className="hidden xl:block relative" style={{ width: '700px', height: '500px' }}>
          {modules.map((m, i) => renderCircleModule(m, i, modules.length, 260, 112, 'ring-4', 'text-sm', '120px'))}
        </div>

        {/* LG */}
        <div className="hidden lg:block xl:hidden relative" style={{ width: '600px', height: '450px' }}>
          {modules.map((m, i) => renderCircleModule(m, i, modules.length, 220, 96, 'ring-3', 'text-xs', '100px'))}
        </div>

        {/* MD */}
        <div className="hidden md:block lg:hidden relative" style={{ width: '500px', height: '400px' }}>
          {modules.map((m, i) => renderCircleModule(m, i, modules.length, 180, 80, 'ring-2', 'text-[10px]', '80px'))}
        </div>

        {/* SM */}
        <div className="hidden sm:block md:hidden relative" style={{ width: '380px', height: '340px' }}>
          {modules.map((m, i) => renderCircleModule(m, i, modules.length, 140, 68, 'ring-2', 'text-[9px]', '70px'))}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
