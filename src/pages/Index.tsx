import React from "react";
import { Users, Briefcase, BarChart3, Clock, FileText, Settings, Calendar, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthProvider";
import { useMetricasRealtime, useFuncionariosRealtime, useComunicadosRealtime } from "../hooks/useRealtimeUpdates";

// URL da logo atualizada (fundo transparente)
const logoAtiva =
  "https://i.ibb.co/ZpcFHYzR/Certificado-De-Curso-De-Gest-o-Empresarial-Para-Empresas-Simples-Cinza-1-1.png";

const Dashboard: React.FC = () => {
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

  const totalModules = isAdmin ? 8 : 7;

  // Calcular posições circulares
  const getCircularPosition = (index: number, total: number) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2; // começar do topo
    // O raio é definido como porcentagem do container pai para ser responsivo
    const percentageRadius = 38;
    const x = 50 + percentageRadius * Math.cos(angle);
    const y = 50 + percentageRadius * Math.sin(angle);
    return { x, y };
  };

  return (
    <div className="min-h-screen w-full overflow-hidden flex flex-col" style={{ backgroundColor: "#3EE0CF" }}>
      {/* Cabeçalho */}
      <div className="text-center pt-12 pb-4 space-y-2 relative z-10 px-4">
        <h1 className="text-4xl md:text-6xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-800 text-lg md:text-xl font-medium opacity-90">Acesso rápido aos módulos</p>
      </div>

      {/* Container central com logo e módulos */}
      <div className="relative flex-grow flex items-center justify-center px-4" style={{ minHeight: "600px" }}>
        {/* Módulos em Layout Circular */}
        <div className="relative w-[600px] h-[600px] max-w-full max-h-full">
          {/* Logo Central ATIVA - Tamanho Aumentado */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-0">
            <img
              src={logoAtiva}
              alt="Logo Grupo Ativa"
              className="w-[300px] sm:w-[360px] md:w-[420px] h-auto opacity-40"
            />
          </div>

          {/* Renderização dos Módulos */}
          {modules.map((mod, index) => {
            const pos = getCircularPosition(index, totalModules);

            // Atraso na animação para efeito cascata
            const delay = `${index * 0.1}s`;

            return (
              <div
                key={mod.path}
                className="absolute cursor-pointer hover:scale-110 transition-transform duration-200 animate-fade-in group"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: "translate(-50%, -50%)",
                  animationDelay: delay,
                }}
                onClick={() => navigate(mod.path)}
              >
                <div className="bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-shadow p-4 sm:p-5 w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center mx-auto relative z-10">
                  <mod.icon className="w-8 h-8 sm:w-10 sm:h-10 text-[#3EE0CF]" />
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-max max-w-[120px] text-center">
                  <p className="font-bold text-gray-900 text-xs sm:text-sm whitespace-nowrap drop-shadow-sm">
                    {mod.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rodapé */}
      <div className="text-center pb-6 text-[#1a5f58] opacity-60 text-sm">
        © {new Date().getFullYear()} Grupo Ativa. Todos os direitos reservados.
      </div>
    </div>
  );
};

export default Dashboard;
