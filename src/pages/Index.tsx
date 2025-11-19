import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, BarChart3, Clock, FileText, Shield, Calendar, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  useMetricasRealtime, 
  useFuncionariosRealtime, 
  useComunicadosRealtime 
} from "@/hooks/useRealtimeUpdates";

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
      icon: Shield,
      path: "/admins",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
    });
  }

  return (
    <div className="min-h-[calc(100vh-180px)] bg-[#4DD0D4] relative overflow-hidden">
      {/* Cabeçalho */}
      <div className="text-center pt-8 pb-4 space-y-2 relative z-10">
        <h1 className="text-4xl md:text-5xl font-bold text-black">Dashboard</h1>
        <p className="text-lg text-black/70">
          Acesso rápido aos módulos
        </p>
      </div>

      {/* Container central com logo e módulos circulares */}
      <div className="relative w-full h-[calc(100vh-280px)] min-h-[600px] flex items-center justify-center">
        {/* Logo Central */}
        <div className="absolute inset-0 flex items-center justify-center opacity-20">
          <div className="text-center">
            <div className="text-[#2BA7AB] font-bold text-8xl mb-4">
              <svg viewBox="0 0 200 200" className="w-64 h-64 mx-auto">
                <polygon points="100,20 180,180 20,180" fill="currentColor" />
              </svg>
            </div>
            <div className="text-6xl font-bold text-[#2BA7AB] tracking-widest">ATIVA</div>
            <div className="text-2xl font-semibold text-red-500 mt-2">GRUPO ATIVA</div>
          </div>
        </div>

        {/* Módulos em Layout Circular */}
        <div className="relative w-full max-w-5xl h-full">
          {/* Funcionários - Top Left */}
          <div 
            className="absolute left-[15%] top-[8%] cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate("/funcionarios")}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex flex-col items-center justify-center">
              <Users className="w-12 h-12 text-[#4DD0D4] mb-2" />
            </div>
            <p className="text-center mt-2 font-semibold text-black">Funcionários</p>
          </div>

          {/* Banco de Talentos - Top Right */}
          <div 
            className="absolute right-[15%] top-[8%] cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate("/banco-talentos")}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex flex-col items-center justify-center">
              <Briefcase className="w-12 h-12 text-[#4DD0D4] mb-2" />
            </div>
            <p className="text-center mt-2 font-semibold text-black">Banco de Talentos</p>
          </div>

          {/* Relatórios - Left */}
          <div 
            className="absolute left-[8%] top-[35%] cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate("/relatorios")}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex flex-col items-center justify-center">
              <BarChart3 className="w-12 h-12 text-[#4DD0D4] mb-2" />
            </div>
            <p className="text-center mt-2 font-semibold text-black">Relatórios e Análises</p>
          </div>

          {/* Folha de Ponto - Right */}
          <div 
            className="absolute right-[8%] top-[35%] cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate("/folha-ponto")}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex flex-col items-center justify-center">
              <Clock className="w-12 h-12 text-[#4DD0D4] mb-2" />
            </div>
            <p className="text-center mt-2 font-semibold text-black">Folha de Ponto</p>
          </div>

          {/* Holerites - Bottom Left */}
          <div 
            className="absolute left-[15%] bottom-[15%] cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate("/holerites")}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex flex-col items-center justify-center">
              <FileText className="w-12 h-12 text-[#4DD0D4] mb-2" />
            </div>
            <p className="text-center mt-2 font-semibold text-black">Holerites</p>
          </div>

          {/* Comunicados - Bottom Right */}
          <div 
            className="absolute right-[15%] bottom-[15%] cursor-pointer hover:scale-110 transition-transform"
            onClick={() => navigate("/comunicados")}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex flex-col items-center justify-center">
              <Bell className="w-12 h-12 text-[#4DD0D4] mb-2" />
            </div>
            <p className="text-center mt-2 font-semibold text-black">Comunicados</p>
          </div>

          {/* Gerenciar Admins - Bottom Center */}
          {isAdmin && (
            <div 
              className="absolute left-1/2 -translate-x-1/2 bottom-[8%] cursor-pointer hover:scale-110 transition-transform"
              onClick={() => navigate("/admins")}
            >
              <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex flex-col items-center justify-center">
                <Shield className="w-12 h-12 text-[#4DD0D4] mb-2" />
              </div>
              <p className="text-center mt-2 font-semibold text-black">Gerenciar Admins</p>
            </div>
          )}

          {/* Controle de Férias - Positioned based on admin status */}
          <div 
            className={`absolute left-1/2 -translate-x-1/2 cursor-pointer hover:scale-110 transition-transform ${
              isAdmin ? 'bottom-[32%]' : 'bottom-[15%]'
            }`}
            onClick={() => navigate("/controle-ferias")}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6 w-32 h-32 flex flex-col items-center justify-center">
              <Calendar className="w-12 h-12 text-[#4DD0D4] mb-2" />
            </div>
            <p className="text-center mt-2 font-semibold text-black">Controle de Férias</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
