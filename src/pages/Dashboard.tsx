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
import { CircularModuleHub, type CircularModule } from "@/components/CircularModuleHub";

const allModules: CircularModule[] = [
  { id: 'rh', iconSrc: iconHr, title: 'Recursos\nHumanos', path: '/gestao-rh', allowedRoles: ['admin', 'rh', 'gestor'] } as any,
  { id: 'clients', iconSrc: iconClients, title: 'Clientes', path: '/gestao-clientes', allowedRoles: ['admin'] } as any,
  { id: 'suppliers', iconSrc: iconSuppliers, title: 'Fornecedores', path: '/fornecedores', allowedRoles: ['admin'] } as any,
  { id: 'budget', iconSrc: iconBudget, title: 'Orçamentos', path: '/orcamentos', allowedRoles: ['admin'] } as any,
  { id: 'inventario', iconSrc: iconInventario, title: 'Inventário', path: '/inventario', allowedRoles: ['admin'] } as any,
  { id: 'documentacoes', iconSrc: iconDocumentacoes, title: 'Documentos', path: '/documentacoes', allowedRoles: ['admin'] } as any,
  { id: 'soon', iconSrc: iconEmBreve, title: 'Em Breve', path: '#', disabled: true, allowedRoles: ['admin'] } as any,
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut, roles, loading, user } = useAuth();
  const isMobile = useIsMobile();

  const prefetchMap: Record<string, () => void> = useMemo(() => ({
    '/gestao-rh': () => import("./GestaoRH"),
    '/gestao-clientes': () => import("./GestaoClientes"),
    '/fornecedores': () => import("./Fornecedores"),
    '/orcamentos': () => import("./OrcamentosDashboard"),
    '/inventario': () => import("./InventarioEquipamentos"),
    '/documentacoes': () => import("./Documentacoes"),
  }), []);

  // Eagerly prefetch ALL module chunks after dashboard renders
  useEffect(() => {
    const timer = setTimeout(() => {
      Object.values(prefetchMap).forEach(fn => fn());
    }, 300);
    return () => clearTimeout(timer);
  }, [prefetchMap]);

  const handlePrefetch = useCallback((path: string) => {
    prefetchMap[path]?.();
  }, [prefetchMap]);

  // Redirecionar funcionários para o portal
  useEffect(() => {
    if (roles.length > 0 && roles.includes("funcionario" as any) && !roles.includes("admin" as any) && !roles.includes("rh" as any) && !roles.includes("gestor" as any)) {
      navigate("/portal-funcionario", { replace: true });
    }
  }, [roles, navigate]);

  // Safety timeout
  const [rolesTimeout, setRolesTimeout] = useState(false);
  useEffect(() => {
    if (user && roles.length === 0) {
      const timer = setTimeout(() => setRolesTimeout(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, roles.length]);

  const rolesReady = roles.length > 0 || rolesTimeout;

  const modules = useMemo(() => allModules.filter((m: any) => {
    if (!m.allowedRoles) return true;
    if (!rolesReady) return true;
    if (rolesTimeout && roles.length === 0) return true;
    return m.allowedRoles.some((r: string) => roles.includes(r as any));
  }), [rolesReady, rolesTimeout, roles]);

  const handleLogout = async () => {
    await signOut();
  };

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
          <img src={logoAtiva} alt="Logo Grupo Ativa" className="w-40 sm:w-32 h-auto" />
        </div>

        {/* Grid de Módulos */}
        <div className="flex-1 px-3 sm:px-4 pb-4 sm:pb-6">
          <div className="grid grid-cols-2 gap-4 sm:gap-5 max-w-sm mx-auto">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`flex flex-col items-center ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-95'} transition-all duration-200`}
                onClick={() => !module.disabled && module.path !== '#' && navigate(module.path)}
                onMouseEnter={() => handlePrefetch(module.path)}
              >
                <div 
                  className="rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-2 ring-white/30"
                  style={{ width: '72px', height: '72px' }}
                >
                  <img src={module.iconSrc} alt={module.title} className="w-full h-full object-cover" />
                </div>
                <p 
                  className="text-center mt-2 font-bold text-white text-[11px] sm:text-xs max-w-[100px] leading-tight whitespace-pre-line"
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

  return (
    <div 
      className="min-h-screen relative overflow-x-hidden overflow-y-auto flex flex-col"
      style={{ backgroundColor: '#40E0D0' }}
    >
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
        
        {/* Logo Central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-44 sm:w-40 md:w-48 lg:w-56 xl:w-64 2xl:w-72 h-auto drop-shadow-lg opacity-90"
          />
        </div>

        <CircularModuleHub
          modules={modules}
          onNavigate={(path) => path !== '#' && navigate(path)}
          onPrefetch={handlePrefetch}
        />
      </div>
    </div>
  );
};

export default Dashboard;
