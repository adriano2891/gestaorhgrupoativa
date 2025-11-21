import { Users, Briefcase, BarChart3, Clock, FileText, Settings, Calendar, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  useMetricasRealtime, 
  useFuncionariosRealtime, 
  useComunicadosRealtime 
} from "@/hooks/useRealtimeUpdates";
import logoAtiva from "@/assets/logo-ativa.png";

const Index = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  
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

  return (
    <div className="min-h-[calc(100vh-180px)] relative overflow-hidden" style={{ backgroundColor: '#3EE0CF' }}>
      {/* Cabeçalho */}
      <div className="text-center pt-8 pb-6 space-y-2 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-700 text-base md:text-lg">Acesso rápido aos módulos</p>
      </div>

      {/* Container central com logo e módulos */}
      <div className="relative w-full px-4 md:px-8 pb-8">
        
        {/* Logo Central ATIVA */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-40">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-[300px] sm:w-[400px] md:w-[500px] lg:w-[600px] xl:w-[700px] h-auto max-w-[90vw]"
          />
        </div>

        {/* Grid Responsivo dos Módulos */}
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
            
            {/* Funcionários */}
            <div 
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
              onClick={() => navigate("/funcionarios")}
            >
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#3EE0CF]" />
              </div>
              <p className="text-center mt-2 sm:mt-3 font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Funcionários</p>
            </div>

            {/* Banco de Talentos */}
            <div 
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
              style={{ animationDelay: '0.1s' }}
              onClick={() => navigate("/banco-talentos")}
            >
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#3EE0CF]" />
              </div>
              <p className="text-center mt-2 sm:mt-3 font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Banco de Talentos</p>
            </div>

            {/* Relatórios e Análises */}
            <div 
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
              style={{ animationDelay: '0.2s' }}
              onClick={() => navigate("/relatorios")}
            >
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                <BarChart3 className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#3EE0CF]" />
              </div>
              <p className="text-center mt-2 sm:mt-3 font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Relatórios e Análises</p>
            </div>

            {/* Folha de Ponto */}
            <div 
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
              style={{ animationDelay: '0.3s' }}
              onClick={() => navigate("/folha-ponto")}
            >
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                <Clock className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#3EE0CF]" />
              </div>
              <p className="text-center mt-2 sm:mt-3 font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Folha de Ponto</p>
            </div>

            {/* Holerites */}
            <div 
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
              style={{ animationDelay: '0.4s' }}
              onClick={() => navigate("/holerites")}
            >
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                <FileText className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#3EE0CF]" />
              </div>
              <p className="text-center mt-2 sm:mt-3 font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Holerites</p>
            </div>

            {/* Comunicados */}
            <div 
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
              style={{ animationDelay: '0.5s' }}
              onClick={() => navigate("/comunicados")}
            >
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                <Bell className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#3EE0CF]" />
              </div>
              <p className="text-center mt-2 sm:mt-3 font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Comunicados</p>
            </div>

            {/* Controle de Férias */}
            <div 
              className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
              style={{ animationDelay: '0.6s' }}
              onClick={() => navigate("/controle-ferias")}
            >
              <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#3EE0CF]" />
              </div>
              <p className="text-center mt-2 sm:mt-3 font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Controle de Férias</p>
            </div>

            {/* Gerenciar Admins (apenas para admins) */}
            {isAdmin && (
              <div 
                className="flex flex-col items-center cursor-pointer hover:scale-105 transition-transform duration-200 animate-fade-in"
                style={{ animationDelay: '0.7s' }}
                onClick={() => navigate("/admins")}
              >
                <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                  <Settings className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-[#3EE0CF]" />
                </div>
                <p className="text-center mt-2 sm:mt-3 font-semibold text-gray-800 text-xs sm:text-sm md:text-base">Gerenciar Admins</p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
