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
      <div className="text-center pt-12 pb-8 space-y-2 relative z-10">
        <h1 className="text-5xl font-bold text-black">Dashboard</h1>
        <p className="text-base text-black/60">
          Acesso rápido aos módulos
        </p>
      </div>

      {/* Container central com logo e módulos */}
      <div className="relative w-full flex items-center justify-center px-8" style={{ height: 'calc(100vh - 350px)', minHeight: '500px' }}>
        
        {/* Logo Central ATIVA */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <div className="text-center -mt-8">
            <svg viewBox="0 0 200 80" className="w-80 h-32 mx-auto mb-2">
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#2BA7AB', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#3DBEC2', stopOpacity: 1 }} />
                </linearGradient>
              </defs>
              <polygon points="40,10 80,70 0,70" fill="url(#logoGradient)" transform="rotate(-15 40 40)" />
              <text x="90" y="55" fill="#2BA7AB" fontSize="48" fontWeight="bold" letterSpacing="4">ATIVA</text>
            </svg>
            <div className="text-2xl font-semibold tracking-wide" style={{ color: '#E74C3C' }}>GRUPO ATIVA</div>
          </div>
        </div>

        {/* Layout Circular dos Módulos */}
        <div className="relative w-full max-w-4xl mx-auto" style={{ height: '450px' }}>
          
          {/* Funcionários - Topo Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '20%', top: '5%' }}
            onClick={() => navigate("/funcionarios")}
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 w-28 h-28 flex items-center justify-center">
              <Users className="w-14 h-14 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-semibold text-black text-sm">Funcionários</p>
          </div>

          {/* Banco de Talentos - Topo Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '20%', top: '5%', animationDelay: '0.1s' }}
            onClick={() => navigate("/banco-talentos")}
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 w-28 h-28 flex items-center justify-center">
              <Briefcase className="w-14 h-14 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-semibold text-black text-sm">Banco de Talentos</p>
          </div>

          {/* Relatórios e Análises - Meio Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '8%', top: '38%', animationDelay: '0.2s' }}
            onClick={() => navigate("/relatorios")}
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 w-28 h-28 flex items-center justify-center">
              <BarChart3 className="w-14 h-14 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-semibold text-black text-sm">Relatórios e Análises</p>
          </div>

          {/* Folha de Ponto - Meio Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '8%', top: '38%', animationDelay: '0.3s' }}
            onClick={() => navigate("/folha-ponto")}
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 w-28 h-28 flex items-center justify-center">
              <Clock className="w-14 h-14 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-semibold text-black text-sm">Folha de Ponto</p>
          </div>

          {/* Holerites - Inferior Esquerda */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ left: '20%', bottom: '8%', animationDelay: '0.4s' }}
            onClick={() => navigate("/holerites")}
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 w-28 h-28 flex items-center justify-center">
              <FileText className="w-14 h-14 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-semibold text-black text-sm">Holerites</p>
          </div>

          {/* Comunicados - Inferior Direita */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ right: '20%', bottom: '8%', animationDelay: '0.5s' }}
            onClick={() => navigate("/comunicados")}
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 w-28 h-28 flex items-center justify-center">
              <Bell className="w-14 h-14 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-semibold text-black text-sm">Comunicados</p>
          </div>

          {/* Gerenciar Admins - Inferior Centro */}
          {isAdmin && (
            <div 
              className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
              style={{ left: '50%', transform: 'translateX(-50%)', bottom: '8%', animationDelay: '0.6s' }}
              onClick={() => navigate("/admins")}
            >
              <div className="bg-white rounded-3xl shadow-xl p-8 w-28 h-28 flex items-center justify-center">
                <Shield className="w-14 h-14 text-[#4DD0D4]" />
              </div>
              <p className="text-center mt-3 font-semibold text-black text-sm">Gerenciar Admins</p>
            </div>
          )}

          {/* Controle de Férias - Posicionamento condicional */}
          <div 
            className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in"
            style={{ 
              left: '50%', 
              transform: 'translateX(-50%)', 
              bottom: isAdmin ? '35%' : '8%',
              animationDelay: '0.7s'
            }}
            onClick={() => navigate("/controle-ferias")}
          >
            <div className="bg-white rounded-3xl shadow-xl p-8 w-28 h-28 flex items-center justify-center">
              <Calendar className="w-14 h-14 text-[#4DD0D4]" />
            </div>
            <p className="text-center mt-3 font-semibold text-black text-sm">Controle de Férias</p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Index;
