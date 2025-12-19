import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useIsMobile } from "@/hooks/use-mobile";
import logoAtiva from "@/assets/logo-ativa.png";
import iconHr from "@/assets/icon-hr-new.png";
import iconClients from "@/assets/icon-clients-new.png";
import iconSuppliers from "@/assets/icon-suppliers-new.png";
import iconBudget from "@/assets/icon-orcamentos-new.png";
import iconInventario from "@/assets/icon-inventario-new.png";
import iconEmBreve from "@/assets/icon-em-breve.png";

interface ModuleItem {
  id: string;
  icon: string;
  label: string;
  route?: string;
  disabled?: boolean;
}

const modules: ModuleItem[] = [
  { id: 'rh', icon: iconHr, label: 'Gestão RH', route: '/gestao-rh' },
  { id: 'clients', icon: iconClients, label: 'Gestão de Controle de Clientes', route: '/gestao-clientes' },
  { id: 'suppliers', icon: iconSuppliers, label: 'Fornecedores', route: '/fornecedores' },
  { id: 'budget', icon: iconBudget, label: 'Orçamentos', route: '/orcamentos' },
  { id: 'inventario', icon: iconInventario, label: 'Inventário de Equipamentos', route: '/inventario' },
  { id: 'soon', icon: iconEmBreve, label: 'Em Breve', disabled: true },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const isMobile = useIsMobile();

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
        className="min-h-screen relative overflow-hidden flex flex-col"
        style={{ backgroundColor: '#40E0D0' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <h1 
            className="text-lg font-bold text-white flex-1 text-center pr-12"
            style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.2)' }}
          >
            Sistema Integrado GRUPO ATIVA
          </h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-white hover:opacity-80 transition-opacity absolute right-4"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sair</span>
          </button>
        </div>

        {/* Logo Central */}
        <div className="flex justify-center py-4">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-32 h-auto"
          />
        </div>

        {/* Grid de Módulos */}
        <div className="flex-1 px-4 pb-6">
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {modules.map((module) => (
              <div
                key={module.id}
                className={`flex flex-col items-center ${module.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-95'} transition-all duration-200`}
                onClick={() => !module.disabled && module.route && navigate(module.route)}
              >
                <div 
                  className="rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-2 ring-white/30"
                  style={{ width: '80px', height: '80px' }}
                >
                  <img 
                    src={module.icon} 
                    alt={module.label} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <p 
                  className="text-center mt-2 font-semibold text-white text-xs max-w-[100px] leading-tight"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {module.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-4 text-white/70 text-xs">
          © {new Date().getFullYear()} Grupo Ativa
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#40E0D0' }}
    >
      <style>{hoverStyles}</style>
      
      {/* Header com título e botão sair */}
      <div className="flex items-start justify-between px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 lg:pt-8 relative z-10">
        <h1 
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-white italic"
          style={{ fontFamily: "'Pacifico', cursive", textShadow: '2px 2px 4px rgba(0,0,0,0.2)' }}
        >
          Sistema Integrado de Gerenciamento GRUPO ATIVA
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 sm:gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <LogOut className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
          <span className="text-sm sm:text-base lg:text-lg font-medium">Sair</span>
        </button>
      </div>

      {/* Container central com logo e módulos */}
      <div className="flex-1 relative w-full flex items-center justify-center px-4 py-2">
        <div className="relative flex items-center justify-center">
          
          {/* Logo Central */}
          <div className="relative z-10 flex items-center justify-center">
            <img 
              src={logoAtiva} 
              alt="Logo Grupo Ativa" 
              className="w-48 md:w-64 lg:w-80 xl:w-96 h-auto drop-shadow-lg opacity-90"
            />
          </div>

          {/* Módulos em círculo - XL screens */}
          <div className="hidden xl:block relative" style={{ width: '700px', height: '500px' }}>
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
                >
                  <div className="flex flex-col items-center">
                    <div 
                      className="icon-ring rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-white/30"
                      style={{ width: '112px', height: '112px' }}
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
                >
                  <div className="flex flex-col items-center">
                    <div 
                      className="icon-ring rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-3 ring-white/30"
                      style={{ width: '96px', height: '96px' }}
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
                >
                  <div className="flex flex-col items-center">
                    <div 
                      className="icon-ring rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-2 ring-white/30"
                      style={{ width: '80px', height: '80px' }}
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
          <div className="hidden sm:block md:hidden relative" style={{ width: '400px', height: '350px' }}>
            {modules.map((module, index) => {
              const { x, y } = getModulePosition(index, modules.length, 150);
              
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
                >
                  <div className="flex flex-col items-center">
                    <div 
                      className="icon-ring rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-2 ring-white/30"
                      style={{ width: '72px', height: '72px' }}
                    >
                      <img src={module.icon} alt={module.label} className="w-full h-full object-cover" />
                    </div>
                    <p 
                      className="text-center mt-2 font-semibold text-white text-[10px] max-w-[80px] leading-tight"
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

      {/* Footer */}
      <div className="text-center pb-3 sm:pb-4 text-white/70 text-[10px] sm:text-xs md:text-sm">
        © {new Date().getFullYear()} Grupo Ativa • Todos os direitos reservados
      </div>
    </div>
  );
};

export default Dashboard;
