import { Users, Package, Truck, FileText, Clock, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  useMetricasRealtime, 
  useFuncionariosRealtime, 
  useComunicadosRealtime 
} from "@/hooks/useRealtimeUpdates";
import { useIsMobile } from "@/hooks/use-mobile";
import logoAtiva from "@/assets/logo-ativa.png";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isMobile = useIsMobile();
  
  // Sincronização em tempo real para todos os módulos
  useMetricasRealtime();
  useFuncionariosRealtime();
  useComunicadosRealtime();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso");
    navigate("/login");
  };

  const modules = [
    {
      title: "Gestão RH",
      icon: Users,
      path: "/funcionarios",
      position: { left: '15%', top: '35%' },
    },
    {
      title: "Gestão de Controle de Clientes",
      icon: Package,
      path: "/relatorios",
      position: { right: '15%', top: '35%' },
    },
    {
      title: "Fornecedores",
      icon: Truck,
      path: "/banco-talentos",
      position: { left: '20%', bottom: '15%' },
    },
    {
      title: "Orçamentos",
      icon: FileText,
      path: "/holerites",
      position: { right: '20%', bottom: '15%' },
    },
    {
      title: "Em breve",
      icon: Clock,
      path: "#",
      position: { left: '50%', bottom: '5%', transform: 'translateX(-50%)' },
      disabled: true,
    },
  ];

  // Layout mobile/tablet
  if (isMobile) {
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#4DD0C5' }}>
        {/* Botão Sair */}
        <button 
          onClick={handleLogout}
          className="absolute top-6 right-6 z-20 flex flex-col items-center text-white hover:scale-110 transition-transform"
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <LogOut className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs mt-1 font-medium">Sair</span>
        </button>

        {/* Título */}
        <div className="text-center pt-16 pb-8 px-4">
          <h1 
            className="text-2xl md:text-3xl text-white"
            style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontWeight: 'normal' }}
          >
            Escolha um módulo e navegue
          </h1>
        </div>

        {/* Logo Central */}
        <div className="flex justify-center mb-8">
          <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center p-2 overflow-hidden">
            <img 
              src={logoAtiva} 
              alt="Logo Grupo Ativa" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Grid de Módulos */}
        <div className="px-6 pb-8">
          <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            {modules.slice(0, 4).map((module, index) => (
              <div
                key={module.path + index}
                className={`cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in ${module.disabled ? 'opacity-60' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => !module.disabled && navigate(module.path)}
              >
                <div className="bg-white rounded-full shadow-lg w-24 h-24 mx-auto flex items-center justify-center">
                  <module.icon className="w-10 h-10 text-[#4DD0C5]" />
                </div>
                <p className="text-center mt-2 font-medium text-white text-xs leading-tight px-2">
                  {module.title}
                </p>
              </div>
            ))}
          </div>
          
          {/* Em breve - centralizado */}
          <div className="flex justify-center mt-6">
            <div
              className="cursor-not-allowed opacity-60 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
            >
              <div className="bg-white rounded-full shadow-lg w-24 h-24 mx-auto flex items-center justify-center">
                <Clock className="w-10 h-10 text-[#4DD0C5]" />
              </div>
              <p className="text-center mt-2 font-medium text-white text-xs">
                Em breve
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout desktop (circular como na imagem)
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#4DD0C5' }}>
      {/* Botão Sair - Superior Direito */}
      <button 
        onClick={handleLogout}
        className="absolute top-8 right-12 z-20 flex flex-col items-center text-white hover:scale-110 transition-transform cursor-pointer"
      >
        <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
          <LogOut className="w-8 h-8 text-white" />
        </div>
        <span className="text-sm mt-2 font-medium">Sair</span>
      </button>

      {/* Título Superior */}
      <div className="text-center pt-12 pb-4">
        <h1 
          className="text-4xl lg:text-5xl xl:text-6xl text-white"
          style={{ fontFamily: "'Brush Script MT', 'Segoe Script', cursive", fontWeight: 'normal' }}
        >
          Escolha um módulo e navegue
        </h1>
      </div>

      {/* Container central com logo e módulos */}
      <div className="relative w-full flex items-center justify-center" style={{ height: 'calc(100vh - 180px)', minHeight: '500px' }}>
        
        {/* Logo Central ATIVA - Circular */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="w-48 h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64 rounded-full bg-white shadow-2xl flex items-center justify-center p-4 overflow-hidden">
            <img 
              src={logoAtiva} 
              alt="Logo Grupo Ativa" 
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Layout Circular dos Módulos */}
        <div className="relative w-full max-w-5xl mx-auto" style={{ height: '100%' }}>
          
          {/* Gestão RH - Esquerda Superior */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '12%', top: '25%' }}
            onClick={() => navigate("/funcionarios")}
          >
            <div className="bg-white rounded-full shadow-lg w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <Users className="w-12 h-12 lg:w-14 lg:h-14 text-[#4DD0C5]" />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base">Gestão RH</p>
          </div>

          {/* Gestão de Controle de Clientes - Direita Superior */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '12%', top: '25%', animationDelay: '0.1s' }}
            onClick={() => navigate("/relatorios")}
          >
            <div className="bg-white rounded-full shadow-lg w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <Package className="w-12 h-12 lg:w-14 lg:h-14 text-[#4DD0C5]" />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base max-w-[140px]">
              Gestão de Controle<br />de Clientes
            </p>
          </div>

          {/* Fornecedores - Esquerda Inferior */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '18%', bottom: '15%', animationDelay: '0.2s' }}
            onClick={() => navigate("/banco-talentos")}
          >
            <div className="bg-white rounded-full shadow-lg w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <Truck className="w-12 h-12 lg:w-14 lg:h-14 text-[#4DD0C5]" />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base">Fornecedores</p>
          </div>

          {/* Orçamentos - Direita Inferior */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '18%', bottom: '15%', animationDelay: '0.3s' }}
            onClick={() => navigate("/holerites")}
          >
            <div className="bg-white rounded-full shadow-lg w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <FileText className="w-12 h-12 lg:w-14 lg:h-14 text-[#4DD0C5]" />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base">Orçamentos</p>
          </div>

          {/* Em breve - Centro Inferior */}
          <div 
            className="absolute cursor-not-allowed opacity-70 animate-fade-in"
            style={{ left: '50%', transform: 'translateX(-50%)', bottom: '5%', animationDelay: '0.4s' }}
          >
            <div className="bg-white rounded-full shadow-lg w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <Clock className="w-12 h-12 lg:w-14 lg:h-14 text-[#4DD0C5]" />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base">Em breve</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Index;
