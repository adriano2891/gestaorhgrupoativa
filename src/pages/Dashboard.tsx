import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import logoAtiva from "@/assets/logo-ativa.png";
import iconHr from "@/assets/icon-hr-new.png";
import iconClients from "@/assets/icon-clients-new.png";
import iconSuppliers from "@/assets/icon-suppliers-new.png";
import iconBudget from "@/assets/icon-orcamentos-new.png";
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
  { id: 'soon', icon: iconEmBreve, label: 'Em Breve', disabled: true },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  // Calculate position for each module in a circle
  const getModulePosition = (index: number, total: number, radius: number) => {
    // Start from top (-90deg) and distribute evenly
    const angleStep = (2 * Math.PI) / total;
    const angle = -Math.PI / 2 + index * angleStep;
    
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    
    return { x, y };
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#40E0D0' }}
    >
      {/* Título central no topo */}
      <div className="text-center pt-6 md:pt-8 pb-2 md:pb-4 relative z-10 px-4">
        <h1 
          className="text-xl sm:text-2xl md:text-3xl lg:text-4xl text-white font-bold"
          style={{ 
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
          }}
        >
          Sistema Integrado de Gerenciamento GRUPO ATIVA
        </h1>
      </div>

      {/* Botão Sair no canto superior direito */}
      <button
        onClick={handleLogout}
        className="absolute top-4 md:top-6 right-4 md:right-8 flex items-center gap-2 text-white hover:opacity-80 transition-opacity z-20"
      >
        <LogOut className="w-5 h-5 md:w-6 md:h-6" />
        <span className="text-base md:text-lg font-medium">Sair</span>
      </button>

      {/* Container central com logo e módulos */}
      <div className="flex-1 relative w-full flex items-center justify-center px-4 py-4">
        <div className="relative flex items-center justify-center">
          
          {/* Logo Central */}
          <div className="relative z-10 flex items-center justify-center">
            <img 
              src={logoAtiva} 
              alt="Logo Grupo Ativa" 
              className="w-40 h-auto sm:w-48 md:w-64 lg:w-80 xl:w-96 drop-shadow-lg"
            />
          </div>

          {/* Módulos em círculo - Desktop */}
          <div className="hidden md:block">
            {modules.map((module, index) => {
              const { x, y } = getModulePosition(index, modules.length, 220);
              
              return (
                <div
                  key={module.id}
                  className={`absolute ${module.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-110'} transition-all duration-300`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                  onClick={() => !module.disabled && module.route && navigate(module.route)}
                >
                  <div className="flex flex-col items-center">
                    <div 
                      className="rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-white/30 hover:ring-white/50 transition-all"
                      style={{ 
                        width: '110px', 
                        height: '110px',
                      }}
                    >
                      <img 
                        src={module.icon} 
                        alt={module.label} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <p 
                      className="text-center mt-3 font-semibold text-white text-sm max-w-[130px] leading-tight"
                      style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}
                    >
                      {module.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Módulos em círculo - Tablet */}
          <div className="hidden sm:block md:hidden">
            {modules.map((module, index) => {
              const { x, y } = getModulePosition(index, modules.length, 160);
              
              return (
                <div
                  key={module.id}
                  className={`absolute ${module.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-110'} transition-all duration-300`}
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                  }}
                  onClick={() => !module.disabled && module.route && navigate(module.route)}
                >
                  <div className="flex flex-col items-center">
                    <div 
                      className="rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-white/30"
                      style={{ 
                        width: '90px', 
                        height: '90px',
                      }}
                    >
                      <img 
                        src={module.icon} 
                        alt={module.label} 
                        className="w-full h-full object-cover"
                      />
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

          {/* Módulos - Mobile (Grid) */}
          <div className="sm:hidden absolute inset-0 flex items-center justify-center">
            <div className="grid grid-cols-2 gap-6 mt-48">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className={`flex flex-col items-center ${module.disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer active:scale-95'} transition-all duration-200`}
                  onClick={() => !module.disabled && module.route && navigate(module.route)}
                >
                  <div 
                    className="rounded-full flex items-center justify-center shadow-xl overflow-hidden ring-3 ring-white/30"
                    style={{ 
                      width: '80px', 
                      height: '80px',
                    }}
                  >
                    <img 
                      src={module.icon} 
                      alt={module.label} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p 
                    className="text-center mt-2 font-semibold text-white text-xs max-w-[90px] leading-tight"
                    style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.4)' }}
                  >
                    {module.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-4 text-white/70 text-xs md:text-sm">
        © {new Date().getFullYear()} Grupo Ativa • Todos os direitos reservados
      </div>
    </div>
  );
};

export default Dashboard;
