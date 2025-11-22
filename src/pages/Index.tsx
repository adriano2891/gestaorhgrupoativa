import { Users, Briefcase, BarChart3, Clock, FileText, Settings, Calendar, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  useMetricasRealtime, 
  useFuncionariosRealtime, 
  useComunicadosRealtime 
} from "@/hooks/useRealtimeUpdates";
import { useIsMobile } from "@/hooks/use-mobile";
import logoAtiva from "@/assets/logo-ativa.png";

const Index = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
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
      icon: Users,
      path: "/funcionarios",
      color: "text-blue-500",
      bgColor: "bg-blue-50 dark:bg-blue-950",
    },
    {
      title: "Banco de Talentos",
      description: "Candidatos e recrutamento",
      icon: Briefcase,
      path: "/banco-talentos",
      color: "text-purple-500",
      bgColor: "bg-purple-50 dark:bg-purple-950",
    },
    {
      title: "Relatórios",
      description: "Análises e indicadores",
      icon: BarChart3,
      path: "/relatorios",
      color: "text-green-500",
      bgColor: "bg-green-50 dark:bg-green-950",
    },
    {
      title: "Folha de Ponto",
      description: "Controle de jornada",
      icon: Clock,
      path: "/folha-ponto",
      color: "text-orange-500",
      bgColor: "bg-orange-50 dark:bg-orange-950",
    },
    {
      title: "Holerites",
      description: "Gestão de pagamentos",
      icon: FileText,
      path: "/holerites",
      color: "text-cyan-500",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
    },
    {
      title: "Controle de Férias",
      description: "Gerenciamento de férias",
      icon: Calendar,
      path: "/controle-ferias",
      color: "text-pink-500",
      bgColor: "bg-pink-50 dark:bg-pink-950",
    },
    {
      title: "Comunicados",
      description: "Avisos e notificações internas",
      icon: Bell,
      path: "/comunicados",
      color: "text-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950",
    },
  ];

  // Adicionar Gerenciar Admins apenas para admins
  if (isAdmin) {
    modules.push({
      title: "Gerenciar Admins",
      description: "Controle de administradores",
      icon: Settings,
      path: "/admins",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
    });
  }

  // Layout mobile/tablet
  if (isMobile) {
    return (
      <div className="min-h-[calc(100vh-180px)] relative overflow-hidden" style={{ backgroundColor: '#3EE0CF' }}>
        {/* Cabeçalho */}
        <div className="text-center pt-8 pb-6 space-y-1 relative z-10 px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-700 text-sm md:text-base">Acesso rápido aos módulos</p>
        </div>

        {/* Logo Central */}
        <div className="flex justify-center mb-6 px-4">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-48 md:w-64 h-auto opacity-40"
          />
        </div>

        {/* Grid de Módulos */}
        <div className="px-4 pb-8">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {modules.map((module, index) => (
              <div
                key={module.path}
                className="cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => navigate(module.path)}
              >
                <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col items-center justify-center min-h-[120px]">
                  <module.icon className="w-12 h-12 md:w-14 md:h-14 text-[#3EE0CF] mb-2" />
                  <p className="text-center font-semibold text-gray-800 text-xs md:text-sm leading-tight">
                    {module.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Layout desktop (circular original)
  return (
    <div className="min-h-[calc(100vh-180px)] relative overflow-hidden" style={{ backgroundColor: '#3EE0CF' }}>
      {/* Cabeçalho */}
      <div className="text-center pt-12 pb-8 space-y-2 relative z-10">
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-700 text-base lg:text-lg">Acesso rápido aos módulos</p>
      </div>

      {/* Container central com logo e módulos */}
      <div className="relative w-full flex items-center justify-center px-8" style={{ height: 'calc(100vh - 350px)', minHeight: '600px' }}>
        
        {/* Logo Central ATIVA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <div className="flex flex-col items-center">
            <img 
              src={logoAtiva} 
              alt="Logo Grupo Ativa" 
              className="w-[600px] xl:w-[768px] h-auto opacity-40"
            />
          </div>
        </div>

        {/* Layout Circular dos Módulos */}
        <div className="relative w-full max-w-6xl mx-auto" style={{ height: '600px' }}>
          
          {/* Funcionários - Topo Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '15%', top: '5%' }}
            onClick={() => navigate("/funcionarios")}
          >
            <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8 w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <Users className="w-12 h-12 lg:w-16 lg:h-16 text-[#3EE0CF]" />
            </div>
            <p className="text-center mt-3 font-semibold text-gray-800 text-sm lg:text-base">Funcionários</p>
          </div>

          {/* Banco de Talentos - Topo Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '15%', top: '5%', animationDelay: '0.1s' }}
            onClick={() => navigate("/banco-talentos")}
          >
            <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8 w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <Briefcase className="w-12 h-12 lg:w-16 lg:h-16 text-[#3EE0CF]" />
            </div>
            <p className="text-center mt-3 font-semibold text-gray-800 text-sm lg:text-base">Banco de Talentos</p>
          </div>

          {/* Relatórios e Análises - Meio Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '5%', top: '38%', animationDelay: '0.2s' }}
            onClick={() => navigate("/relatorios")}
          >
            <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8 w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <BarChart3 className="w-12 h-12 lg:w-16 lg:h-16 text-[#3EE0CF]" />
            </div>
            <p className="text-center mt-3 font-semibold text-gray-800 text-sm lg:text-base">Relatórios e Análises</p>
          </div>

          {/* Folha de Ponto - Meio Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '5%', top: '38%', animationDelay: '0.3s' }}
            onClick={() => navigate("/folha-ponto")}
          >
            <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8 w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <Clock className="w-12 h-12 lg:w-16 lg:h-16 text-[#3EE0CF]" />
            </div>
            <p className="text-center mt-3 font-semibold text-gray-800 text-sm lg:text-base">Folha de Ponto</p>
          </div>

          {/* Holerites - Inferior Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '20%', bottom: '8%', animationDelay: '0.4s' }}
            onClick={() => navigate("/holerites")}
          >
            <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8 w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <FileText className="w-12 h-12 lg:w-16 lg:h-16 text-[#3EE0CF]" />
            </div>
            <p className="text-center mt-3 font-semibold text-gray-800 text-sm lg:text-base">Holerites</p>
          </div>

          {/* Comunicados - Inferior Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '20%', bottom: '8%', animationDelay: '0.5s' }}
            onClick={() => navigate("/comunicados")}
          >
            <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8 w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
              <Bell className="w-12 h-12 lg:w-16 lg:h-16 text-[#3EE0CF]" />
            </div>
            <p className="text-center mt-3 font-semibold text-gray-800 text-sm lg:text-base">Comunicados</p>
          </div>

          {/* Gerenciar Admins - Inferior Centro (apenas para admins) */}
          {isAdmin && (
            <div 
              className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
              style={{ left: '50%', transform: 'translateX(-50%)', bottom: '2%', animationDelay: '0.6s' }}
              onClick={() => navigate("/admins")}
            >
              <div className="bg-white rounded-3xl shadow-lg p-6 lg:p-8 w-28 h-28 lg:w-32 lg:h-32 flex items-center justify-center">
                <Settings className="w-12 h-12 lg:w-16 lg:h-16 text-[#3EE0CF]" />
              </div>
              <p className="text-center mt-3 font-semibold text-gray-800 text-sm lg:text-base">Gerenciar Admins</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Index;
