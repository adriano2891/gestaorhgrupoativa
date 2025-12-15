import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import logoAtiva from "@/assets/logo-ativa.png";
import iconHr from "@/assets/icon-hr-new.png";
import iconClients from "@/assets/icon-clients-new.png";
import iconSuppliers from "@/assets/icon-suppliers-new.png";
import iconBudget from "@/assets/icon-orcamentos-new.png";
import iconEmBreve from "@/assets/icon-em-breve.png";

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
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-0" style={{ paddingTop: '0px' }}>
          <div 
            className="flex items-center justify-center"
            style={{ 
              width: '500px',
              height: '500px',
            }}
          >
            <img 
              src={logoAtiva} 
              alt="Logo Grupo Ativa" 
              className="w-[480px] h-auto"
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
              className="rounded-full flex items-center justify-center shadow-lg overflow-hidden"
              style={{ 
                width: '120px', 
                height: '120px',
              }}
            >
              <img 
                src={iconHr} 
                alt="Gestão RH" 
                className="w-full h-full object-cover"
              />
            </div>
            <p 
              className="text-center mt-2 font-semibold text-white text-sm"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              Gestão RH
            </p>
          </div>

          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ left: '18%', top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => navigate("/gestao-clientes")}
          >
            <div 
              className="rounded-full flex items-center justify-center shadow-lg overflow-hidden"
              style={{ 
                width: '120px', 
                height: '120px',
              }}
            >
              <img 
                src={iconClients} 
                alt="Gestão de Controle de Clientes" 
                className="w-full h-full object-cover"
              />
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
              className="rounded-full flex items-center justify-center shadow-lg mx-auto overflow-hidden"
              style={{ 
                width: '120px', 
                height: '120px',
              }}
            >
              <img 
                src={iconSuppliers} 
                alt="Fornecedores" 
                className="w-full h-full object-cover"
              />
            </div>
            <p 
              className="text-center mt-2 font-semibold text-white text-sm"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              Fornecedores
            </p>
          </div>

          {/* Orçamentos - Centro Direita (mesmo alinhamento que Clientes) */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ right: '18%', top: '50%', transform: 'translateY(-50%)' }}
            onClick={() => navigate("/orcamentos")}
          >
            <div 
              className="rounded-full flex items-center justify-center shadow-lg overflow-hidden"
              style={{ 
                width: '120px', 
                height: '120px',
              }}
            >
              <img 
                src={iconBudget} 
                alt="Orçamentos" 
                className="w-full h-full object-cover"
              />
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
              className="rounded-full flex items-center justify-center shadow-lg overflow-hidden"
              style={{ 
                width: '120px', 
                height: '120px',
              }}
            >
              <img 
                src={iconEmBreve} 
                alt="Em Breve" 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
