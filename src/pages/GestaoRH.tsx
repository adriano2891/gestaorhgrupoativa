import { LogOut, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  useMetricasRealtime, 
  useFuncionariosRealtime, 
  useComunicadosRealtime 
} from "@/hooks/useRealtimeUpdates";
import { useIsMobile } from "@/hooks/use-mobile";
import logoAtiva from "@/assets/logo-ativa.png";
import iconFuncionarios from "@/assets/icon-rh-funcionarios.png";
import iconTalentos from "@/assets/icon-rh-talentos.png";
import iconRelatorios from "@/assets/icon-rh-relatorios.png";
import iconPonto from "@/assets/icon-rh-ponto.png";
import iconHolerites from "@/assets/icon-rh-holerites.png";
import iconComunicados from "@/assets/icon-rh-comunicados.png";
import iconAdmins from "@/assets/icon-rh-admins.png";

const GestaoRH = () => {
  const navigate = useNavigate();
  const { roles, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  // Sincronização em tempo real para todos os módulos
  useMetricasRealtime();
  useFuncionariosRealtime();
  useComunicadosRealtime();
  const isAdmin = roles.includes("admin") || roles.includes("rh") || roles.includes("gestor");

  const modules = [
    {
      title: "Funcionários",
      description: "Gestão de colaboradores",
      iconSrc: iconFuncionarios,
      path: "/funcionarios",
    },
    {
      title: "Banco de Talentos",
      description: "Candidatos e recrutamento",
      iconSrc: iconTalentos,
      path: "/banco-talentos",
    },
    {
      title: "Relatórios",
      description: "Análises e indicadores",
      iconSrc: iconRelatorios,
      path: "/relatorios",
    },
    {
      title: "Folha de Ponto",
      description: "Controle de jornada",
      iconSrc: iconPonto,
      path: "/folha-ponto",
    },
    {
      title: "Holerites",
      description: "Gestão de pagamentos",
      iconSrc: iconHolerites,
      path: "/holerites",
    },
    {
      title: "Comunicados",
      description: "Avisos e notificações internas",
      iconSrc: iconComunicados,
      path: "/comunicados",
    },
  ];

  // Adicionar Gerenciar Admins apenas para admins
  if (isAdmin) {
    modules.push({
      title: "Gerenciar Admins",
      description: "Controle de administradores",
      iconSrc: iconAdmins,
      path: "/admins",
    });
  }

  const handleLogout = async () => {
    await signOut();
  };

  // Layout mobile/tablet
  if (isMobile) {
    const topModules = modules.slice(0, 4);
    const bottomModules = modules.slice(4);
    
    return (
      <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#40E0D0' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Voltar</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
          >
            <LogOut className="w-5 h-5" />
            <span>Sair</span>
          </button>
        </div>

        {/* Título */}
        <div className="text-center pt-4 pb-6 space-y-1 relative z-10 px-4">
          <h1 
            className="text-3xl md:text-4xl text-white"
            style={{ 
              fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
              fontStyle: 'italic'
            }}
          >
            Gestão RH
          </h1>
        </div>

        {/* Logo Central */}
        <div className="flex justify-center mb-6 px-4">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-32 md:w-48 h-auto opacity-40"
          />
        </div>

        {/* Grid de Módulos */}
        <div className="px-4 pb-8 space-y-4">
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {topModules.map((module) => (
              <div
                key={module.path}
                className="cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => navigate(module.path)}
              >
                <div className="rounded-full shadow-lg overflow-hidden w-28 h-28 mx-auto">
                  <img 
                    src={module.iconSrc} 
                    alt={module.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center mt-2 font-semibold text-white text-xs leading-tight" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto">
            {bottomModules.map((module) => (
              <div
                key={module.path}
                className="cursor-pointer hover:scale-105 transition-transform duration-200"
                onClick={() => navigate(module.path)}
              >
                <div className="rounded-full shadow-lg overflow-hidden w-20 h-20 mx-auto">
                  <img 
                    src={module.iconSrc} 
                    alt={module.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center mt-2 font-semibold text-white text-[9px] leading-tight" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Layout desktop (circular)
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#40E0D0' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-6 h-6" />
          <span className="text-lg">Voltar</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-lg font-medium">Sair</span>
        </button>
      </div>

      {/* Título */}
      <div className="text-center pt-4 pb-8 space-y-2 relative z-10">
        <h1 
          className="text-4xl lg:text-5xl text-white"
          style={{ 
            fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
            fontStyle: 'italic',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Gestão RH
        </h1>
      </div>

      {/* Container central com logo e módulos */}
      <div className="relative w-full flex items-center justify-center px-8" style={{ height: 'calc(100vh - 200px)', minHeight: '500px' }}>
        
        {/* Logo Central ATIVA */}
        <div className="absolute inset-0 flex items-start justify-center pointer-events-none z-0" style={{ paddingTop: '20px' }}>
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-[280px] h-auto opacity-90"
          />
        </div>

        {/* Layout Circular dos Módulos */}
        <div className="relative w-full max-w-6xl mx-auto" style={{ height: '500px' }}>
          
          {/* Funcionários - Superior Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ left: '18%', top: '5%' }}
            onClick={() => navigate("/funcionarios")}
          >
            <div className="rounded-full shadow-lg overflow-hidden w-28 h-28 lg:w-32 lg:h-32">
              <img 
                src={iconFuncionarios} 
                alt="Funcionários"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Funcionários
            </p>
          </div>

          {/* Banco de Talentos - Superior Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ right: '18%', top: '5%' }}
            onClick={() => navigate("/banco-talentos")}
          >
            <div className="rounded-full shadow-lg overflow-hidden w-28 h-28 lg:w-32 lg:h-32">
              <img 
                src={iconTalentos} 
                alt="Banco de Talentos"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Banco de Talentos
            </p>
          </div>

          {/* Relatórios - Meio Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ left: '5%', top: '40%' }}
            onClick={() => navigate("/relatorios")}
          >
            <div className="rounded-full shadow-lg overflow-hidden w-28 h-28 lg:w-32 lg:h-32">
              <img 
                src={iconRelatorios} 
                alt="Relatórios"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Relatórios
            </p>
          </div>

          {/* Folha de Ponto - Meio Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ right: '5%', top: '40%' }}
            onClick={() => navigate("/folha-ponto")}
          >
            <div className="rounded-full shadow-lg overflow-hidden w-28 h-28 lg:w-32 lg:h-32">
              <img 
                src={iconPonto} 
                alt="Folha de Ponto"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Folha de Ponto
            </p>
          </div>

          {/* Holerites - Inferior Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ left: '18%', bottom: '5%' }}
            onClick={() => navigate("/holerites")}
          >
            <div className="rounded-full shadow-lg overflow-hidden w-28 h-28 lg:w-32 lg:h-32">
              <img 
                src={iconHolerites} 
                alt="Holerites"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Holerites
            </p>
          </div>

          {/* Gerenciar Admins - Inferior Centro */}
          {isAdmin && (
            <div 
              className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
              style={{ left: '50%', transform: 'translateX(-50%)', bottom: '5%' }}
              onClick={() => navigate("/admins")}
            >
              <div className="rounded-full shadow-lg overflow-hidden w-28 h-28 lg:w-32 lg:h-32">
                <img 
                  src={iconAdmins} 
                  alt="Gerenciar Admins"
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                Gerenciar Admins
              </p>
            </div>
          )}

          {/* Comunicados - Inferior Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
            style={{ right: '18%', bottom: '5%' }}
            onClick={() => navigate("/comunicados")}
          >
            <div className="rounded-full shadow-lg overflow-hidden w-28 h-28 lg:w-32 lg:h-32">
              <img 
                src={iconComunicados} 
                alt="Comunicados"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-center mt-3 font-semibold text-white text-sm lg:text-base" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
              Comunicados
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GestaoRH;
