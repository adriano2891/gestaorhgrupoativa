import { useEffect, useMemo, useCallback, useState } from "react";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import logoAtiva from "@/assets/logo-ativa-3d.png";
import iconHr from "@/assets/icon-hr-new.png";
import iconClients from "@/assets/icon-clients-new.png";
import iconSuppliers from "@/assets/icon-suppliers-new.png";
import iconBudget from "@/assets/icon-orcamentos-new.png";
import iconInventario from "@/assets/icon-inventario-new.png";
import iconDocumentacoes from "@/assets/icon-documentacoes.png";
import iconEmBreve from "@/assets/icon-em-breve.png";

interface ModuleItem {
  id: string;
  icon: string;
  label: string;
  route?: string;
  disabled?: boolean;
  allowedRoles?: string[]; // roles that can see this module
}

const allModules: ModuleItem[] = [
  { id: 'rh', icon: iconHr, label: 'Recursos Humanos', route: '/gestao-rh', allowedRoles: ['admin', 'rh', 'gestor'] },
  { id: 'clients', icon: iconClients, label: 'Clientes', route: '/gestao-clientes', allowedRoles: ['admin'] },
  { id: 'suppliers', icon: iconSuppliers, label: 'Fornecedores', route: '/fornecedores', allowedRoles: ['admin'] },
  { id: 'budget', icon: iconBudget, label: 'Orçamentos', route: '/orcamentos', allowedRoles: ['admin'] },
  { id: 'inventario', icon: iconInventario, label: 'Inventário', route: '/inventario', allowedRoles: ['admin'] },
  { id: 'documentacoes', icon: iconDocumentacoes, label: 'Documentos', route: '/documentacoes', allowedRoles: ['admin'] },
  { id: 'soon', icon: iconEmBreve, label: 'Em Breve', disabled: true, allowedRoles: ['admin'] },
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
    '/documentacoes': () => import("./Documentacoes"),
  }), []);

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

  // While roles are loading, show all modules (will filter once loaded)
  const rolesReady = roles.length > 0 || rolesTimeout;

  const modules = allModules.filter((m) => {
    if (!m.allowedRoles) return true;
    if (!rolesReady) return true; // show all modules while roles load
    if (rolesTimeout && roles.length === 0) return true;
    return m.allowedRoles.some((r) => roles.includes(r as any));
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
      0%, 100% { box-shadow: 0 0 20px rgba(255,255,255,0.3), 0 8px 30px rgba(0,0,0,0.2); }
      50% { box-shadow: 0 0 35px rgba(255,255,255,0.5), 0 12px 40px rgba(0,0,0,0.25); }
    }
    @keyframes icon-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-8px); }
    }
    @keyframes dash-logo-sweep {
      0% { transform: translateX(-200%) skewX(-15deg); }
      100% { transform: translateX(200%) skewX(-15deg); }
    }
    .module-icon-container {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .module-icon-container:hover {
      transform: scale(1.15) translateY(-5px);
    }
    .module-icon-container:hover .icon-ring {
      animation: icon-glow 1.5s ease-in-out infinite;
      ring-color: rgba(255,255,255,0.6);
    }
    .module-icon-container:active {
      transform: scale(1.05) translateY(-2px);
    }
    .icon-ring {
      transition: all 0.3s ease;
    }
    .icon-ring:hover {
      box-shadow: 0 0 30px rgba(255,255,255,0.4), 0 10px 35px rgba(0,0,0,0.2);
    }
  `;

  // Mobile layout - Grid based
  if (isMobile) {
    return (
      <div 
        className="min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col safe-top safe-bottom"
        style={{ backgroundColor: '#40E0D0' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
          <h1 
            className="text-sm sm:text-base font-bold text-white flex-1 text-center pr-10 sm:pr-12 truncate"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}
          >
            Sistema Integrado GRUPO ATIVA
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-white hover:opacity-80 transition-opacity absolute right-3 sm:right-4 touch-target"
          >
            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm">Sair</span>
          </button>
        </div>

        {/* Logo Central */}
        <div className="flex justify-center py-3 sm:py-4">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-40 sm:w-32 h-auto"
          />
        </div>

        {/* Grid de Módulos */}
        <div className="flex-1 px-3 sm:px-4 pb-4 sm:pb-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-sm mx-auto">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`flex flex-col items-center ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-95'} transition-all duration-200`}
                onClick={() => !module.disabled && module.route && navigate(module.route)}
                onMouseEnter={() => handlePrefetch(module.route)}
              >
                <div 
                  className="rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-2 ring-white/30"
                  style={{ width: '110px', height: '110px' }}
                >
                  <img 
                    src={module.icon} 
                    alt={module.label} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p 
                  className="text-center mt-1.5 sm:mt-2 font-semibold text-white text-[10px] sm:text-xs max-w-[90px] sm:max-w-[100px] leading-tight"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {module.label}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col"
      style={{ backgroundColor: '#40E0D0' }}
    >
      <style>{hoverStyles}</style>
      
      {/* Header com título e botão sair */}
      <div className="flex items-start justify-between px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 relative z-10">
        <h1 
          className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-white italic max-w-[70%]"
          style={{ fontFamily: "'Pacifico', cursive", textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}
        >
          Sistema Integrado de Gerenciamento GRUPO ATIVA
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 sm:gap-2 text-white hover:opacity-80 transition-opacity flex-shrink-0"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          <span className="text-xs sm:text-sm lg:text-lg font-medium">Sair</span>
        </button>
      </div>

      {/* Container central com logo e módulos */}
      <div className="flex-1 relative w-full flex items-center justify-center px-4 py-2 min-h-[400px]">
        
        {/* Logo Central - Absolutamente centralizada */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="relative overflow-hidden">
            <img 
              src={logoAtiva} 
              alt="Logo Grupo Ativa" 
              className="w-44 sm:w-40 md:w-48 lg:w-56 xl:w-64 2xl:w-72 h-auto drop-shadow-lg opacity-90"
            />
            <div
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)',
                width: '60%',
                animation: 'dash-logo-sweep 4s ease-in-out infinite',
              }}
            />
          </div>
        </div>

        {/* Módulos em círculo - XL screens */}
        <div className="hidden xl:block relative" style={{ width: '700px', height: '500px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 300);
            
            return (
              <div
                key={module.id}
                className={`absolute module-icon-container ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
                onClick={() => !module.disabled && module.route && navigate(module.route)}
                onMouseEnter={() => handlePrefetch(module.route)}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className="icon-ring rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-white/30"
                    style={{ width: '170px', height: '170px' }}
                  >
                    <img src={module.icon} alt={module.label} className="w-full h-full object-cover" />
                  </div>
                  <p 
                    className="text-center mt-3 font-semibold text-white text-sm max-w-[120px] leading-tight"
                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}
                  >
                    {module.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Módulos em círculo - LG screens */}
        <div className="hidden lg:block xl:hidden relative" style={{ width: '600px', height: '450px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 260);
            
            return (
              <div
                key={module.id}
                className={`absolute module-icon-container ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
                onClick={() => !module.disabled && module.route && navigate(module.route)}
                onMouseEnter={() => handlePrefetch(module.route)}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className="icon-ring rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-3 ring-white/30"
                    style={{ width: '150px', height: '150px' }}
                  >
                    <img src={module.icon} alt={module.label} className="w-full h-full object-cover" />
                  </div>
                  <p 
                    className="text-center mt-2 font-semibold text-white text-xs max-w-[100px] leading-tight"
                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}
                  >
                    {module.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Módulos em círculo - MD screens */}
        <div className="hidden md:block lg:hidden relative" style={{ width: '500px', height: '400px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 220);
            
            return (
              <div
                key={module.id}
                className={`absolute module-icon-container ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
                onClick={() => !module.disabled && module.route && navigate(module.route)}
                onMouseEnter={() => handlePrefetch(module.route)}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className="icon-ring rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-2 ring-white/30"
                    style={{ width: '130px', height: '130px' }}
                  >
                    <img src={module.icon} alt={module.label} className="w-full h-full object-cover" />
                  </div>
                  <p 
                    className="text-center mt-2 font-semibold text-white text-[10px] max-w-[80px] leading-tight"
                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}
                  >
                    {module.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Módulos em círculo - SM screens (tablet) */}
        <div className="hidden sm:block md:hidden relative" style={{ width: '380px', height: '340px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 180);
            
            return (
              <div
                key={module.id}
                className={`absolute module-icon-container ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
                onClick={() => !module.disabled && module.route && navigate(module.route)}
                onMouseEnter={() => handlePrefetch(module.route)}
              >
                <div className="flex flex-col items-center">
                  <div 
                    className="icon-ring rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-2 ring-white/30"
                    style={{ width: '110px', height: '110px' }}
                  >
                    <img src={module.icon} alt={module.label} className="w-full h-full object-cover" />
                  </div>
                  <p 
                    className="text-center mt-2 font-semibold text-white text-[9px] max-w-[70px] leading-tight"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}
                  >
                    {module.label}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
