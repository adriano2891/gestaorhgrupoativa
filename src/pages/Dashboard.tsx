import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import logoAtiva from "@/assets/logo-ativa.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex flex-col"
      style={{ backgroundColor: '#40E0D0' }}
    >
      {/* Título central no topo */}
      <div className="text-center pt-8 pb-4 relative z-10">
        <h1 
          className="text-4xl md:text-5xl text-white"
          style={{ 
            fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
            fontStyle: 'italic',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Escolha um módulo e navegue
        </h1>
      </div>

      {/* Botão Sair no canto superior direito */}
      <button
        onClick={handleLogout}
        className="absolute top-6 right-8 flex items-center gap-2 text-white hover:opacity-80 transition-opacity z-20"
      >
        <LogOut className="w-6 h-6" />
        <span className="text-lg font-medium">Sair</span>
      </button>

      {/* Container central com logo e módulos */}
      <div className="flex-1 relative w-full flex items-center justify-center px-4">
        
        {/* Logo Central ATIVA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div 
            className="rounded-full flex items-center justify-center"
            style={{ 
              backgroundColor: 'rgba(127, 255, 212, 0.5)',
              width: '320px',
              height: '320px',
            }}
          >
            <img 
              src={logoAtiva} 
              alt="Logo Grupo Ativa" 
              className="w-[280px] h-auto"
            />
          </div>
        </div>

        {/* Layout Circular dos Módulos */}
        <div className="relative w-full max-w-5xl mx-auto" style={{ height: '600px' }}>
          
          {/* Gestão RH - Esquerda Superior */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ left: '5%', top: '15%' }}
            onClick={() => navigate("/gestao-rh")}
          >
            <div 
              className="rounded-full flex items-center justify-center shadow-lg"
              style={{ 
                width: '120px', 
                height: '120px',
                background: 'linear-gradient(180deg, #2C5F5D 0%, #1A3D3C 100%)'
              }}
            >
              <div className="flex flex-col items-center justify-center">
                <div className="flex -space-x-2 mb-1">
                  <div className="w-6 h-8 bg-gray-300 rounded-t-full"></div>
                  <div className="w-6 h-8 bg-gray-400 rounded-t-full"></div>
                  <div className="w-6 h-8 bg-gray-300 rounded-t-full"></div>
                </div>
                <div className="bg-white text-gray-700 text-xs px-2 py-0.5 rounded font-bold">HR</div>
              </div>
            </div>
            <p 
              className="text-center mt-2 font-semibold text-white text-sm"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              Gestão RH
            </p>
          </div>

          {/* Gestão de Controle de Clientes - Centro Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ left: '18%', top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => navigate("/gestao-clientes")}
          >
            <div 
              className="rounded-full flex items-center justify-center shadow-lg"
              style={{ 
                width: '120px', 
                height: '120px',
                background: 'linear-gradient(180deg, #2C5F5D 0%, #1A3D3C 100%)'
              }}
            >
              <div className="flex flex-col items-center">
                <div className="flex items-end gap-1 mb-1">
                  <div className="w-4 h-10 bg-gray-300 rounded-sm"></div>
                  <div className="w-4 h-8 bg-gray-400 rounded-sm"></div>
                  <div className="w-4 h-6 bg-gray-300 rounded-sm"></div>
                </div>
                <div className="flex -space-x-1">
                  <div className="w-4 h-5 bg-teal-400 rounded-full"></div>
                  <div className="w-4 h-5 bg-teal-300 rounded-full"></div>
                  <div className="w-4 h-5 bg-teal-400 rounded-full"></div>
                </div>
              </div>
            </div>
            <p 
              className="text-center mt-2 font-semibold text-white text-sm max-w-[120px]"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              Gestão de Controle de Clientes
            </p>
          </div>

          {/* Fornecedores - Centro Inferior */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ left: '50%', bottom: '5%', transform: 'translateX(-50%)' }}
            onClick={() => navigate("/fornecedores")}
          >
            <div 
              className="rounded-full flex items-center justify-center shadow-lg mx-auto"
              style={{ 
                width: '120px', 
                height: '120px',
                background: 'linear-gradient(180deg, #2C5F5D 0%, #1A3D3C 100%)'
              }}
            >
              <div className="relative">
                <div className="w-12 h-8 bg-gray-300 rounded-sm"></div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-6 h-4 bg-teal-400 rounded-sm flex items-center justify-center">
                    <span className="text-white text-xs">↗</span>
                  </div>
                </div>
              </div>
            </div>
            <p 
              className="text-center mt-2 font-semibold text-white text-sm"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              Fornecedores
            </p>
          </div>

          {/* Orçamentos - Centro Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ right: '18%', top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => navigate("/orcamentos")}
          >
            <div 
              className="rounded-full flex items-center justify-center shadow-lg"
              style={{ 
                width: '120px', 
                height: '120px',
                background: 'linear-gradient(180deg, #2C5F5D 0%, #1A3D3C 100%)'
              }}
            >
              <div className="bg-white rounded-sm p-1">
                <div className="w-10 h-12 flex flex-col items-center justify-center">
                  <div className="w-6 h-0.5 bg-gray-400 mb-1"></div>
                  <div className="w-6 h-0.5 bg-gray-400 mb-1"></div>
                  <div className="text-teal-500 font-bold text-lg">$</div>
                </div>
              </div>
            </div>
            <p 
              className="text-center mt-2 font-semibold text-white text-sm"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              Orçamentos
            </p>
          </div>

          {/* Em Breve - Direita Superior */}
          <div 
            className="absolute cursor-not-allowed opacity-80"
            style={{ right: '5%', top: '15%' }}
          >
            <div 
              className="rounded-full flex items-center justify-center shadow-lg"
              style={{ 
                width: '120px', 
                height: '120px',
                background: 'linear-gradient(180deg, #2C5F5D 0%, #1A3D3C 100%)'
              }}
            >
              <span 
                className="text-white text-xl"
                style={{ 
                  fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                  fontStyle: 'italic'
                }}
              >
                em<br/>Breve
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
