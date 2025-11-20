import { Users, Briefcase, BarChart3, Clock, FileText, Shield, Calendar, Bell } from "lucide-react";
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
      icon: Shield,
      path: "/admins",
      color: "text-red-500",
      bgColor: "bg-red-50 dark:bg-red-950",
    });
  }

  return (
    <div className="min-h-[calc(100vh-180px)] bg-background relative overflow-hidden">
      {/* Cabeçalho */}
      <div className="text-center pt-12 pb-8 space-y-2 relative z-10">
        <h1 className="text-5xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Container central com logo e módulos */}
      <div className="relative w-full flex items-center justify-center px-8" style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}>
        
        {/* Logo Central ATIVA - Real */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-80 h-auto opacity-30"
          />
        </div>

        {/* Layout Circular dos Módulos */}
        <div className="relative w-full max-w-5xl mx-auto" style={{ height: '500px' }}>
          
          {/* Funcionários - Topo Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '18%', top: '8%' }}
            onClick={() => navigate("/funcionarios")}
          >
            <div className="bg-white rounded-full shadow-lg p-6 w-24 h-24 flex items-center justify-center">
              <Users className="w-12 h-12 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-medium text-foreground text-sm">Funcionários</p>
          </div>

          {/* Banco de Talentos - Topo Centro */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '50%', transform: 'translateX(-50%)', top: '2%', animationDelay: '0.1s' }}
            onClick={() => navigate("/banco-talentos")}
          >
            <div className="bg-white rounded-full shadow-lg p-6 w-24 h-24 flex items-center justify-center">
              <Briefcase className="w-12 h-12 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-medium text-foreground text-sm">Banco de Talentos</p>
          </div>

          {/* Folha de Ponto - Topo Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '18%', top: '8%', animationDelay: '0.2s' }}
            onClick={() => navigate("/folha-ponto")}
          >
            <div className="bg-white rounded-full shadow-lg p-6 w-24 h-24 flex items-center justify-center">
              <Clock className="w-12 h-12 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-medium text-foreground text-sm">Folha de Ponto</p>
          </div>

          {/* Relatórios e Análises - Meio Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '8%', top: '42%', animationDelay: '0.3s' }}
            onClick={() => navigate("/relatorios")}
          >
            <div className="bg-white rounded-full shadow-lg p-6 w-24 h-24 flex items-center justify-center">
              <BarChart3 className="w-12 h-12 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-medium text-foreground text-sm">Relatórios e Análises</p>
          </div>

          {/* Comunicados - Meio Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '8%', top: '42%', animationDelay: '0.4s' }}
            onClick={() => navigate("/comunicados")}
          >
            <div className="bg-white rounded-full shadow-lg p-6 w-24 h-24 flex items-center justify-center">
              <Bell className="w-12 h-12 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-medium text-foreground text-sm">Comunicados</p>
          </div>

          {/* Holerites - Inferior Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '25%', bottom: '5%', animationDelay: '0.5s' }}
            onClick={() => navigate("/holerites")}
          >
            <div className="bg-white rounded-full shadow-lg p-6 w-24 h-24 flex items-center justify-center">
              <FileText className="w-12 h-12 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-medium text-foreground text-sm">Holerites</p>
          </div>

          {/* Controle de Férias - Inferior Centro */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '50%', transform: 'translateX(-50%)', bottom: '5%', animationDelay: '0.6s' }}
            onClick={() => navigate("/controle-ferias")}
          >
            <div className="bg-white rounded-full shadow-lg p-6 w-24 h-24 flex items-center justify-center">
              <Calendar className="w-12 h-12 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-medium text-foreground text-sm">Controle de Férias</p>
          </div>

          {/* Gerenciar Admins - Inferior Direita (apenas para admins) */}
          {isAdmin && (
            <div 
              className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
              style={{ right: '25%', bottom: '5%', animationDelay: '0.7s' }}
              onClick={() => navigate("/admins")}
            >
              <div className="bg-white rounded-full shadow-lg p-6 w-24 h-24 flex items-center justify-center">
                <Shield className="w-12 h-12 text-[#4DD0D4]" />
              </div>
              <p className="text-center mt-3 font-medium text-foreground text-sm">Gerenciar Admins</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Index;
