import { Users, Briefcase, BarChart3, Clock, FileText, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";

const Index = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("rh") || roles.includes("gestor");

  const modules = [
    {
      title: "Funcionários",
      description: "Listar e gerenciar equipe",
      icon: Users,
      path: "/funcionarios",
    },
    {
      title: "Banco de Talentos",
      description: "Gerenciar e buscar currículos",
      icon: Briefcase,
      path: "/banco-talentos",
    },
    {
      title: "Relatórios",
      description: "Análises e indicadores",
      icon: BarChart3,
      path: "/relatorios",
    },
    {
      title: "Folha de Ponto",
      description: "Visualizar registros de ponto",
      icon: Clock,
      path: "/folha-ponto",
    },
    {
      title: "Holerites",
      description: "Consultar recibos de pagamento",
      icon: FileText,
      path: "/holerites",
    },
  ];

  // Adicionar Gerenciar Admins apenas para admins
  if (isAdmin) {
    modules.push({
      title: "Gerenciar Administradores",
      description: "Adicionar ou remover acessos",
      icon: Shield,
      path: "/admins",
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(174,72%,56%)] to-[hsl(186,85%,45%)] px-4 py-12">
      <div className="w-full max-w-7xl mx-auto space-y-12">
        {/* Título */}
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-white drop-shadow-lg">
            Acesso Rápido
          </h1>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module) => (
            <div
              key={module.path}
              onClick={() => navigate(module.path)}
              className="group cursor-pointer"
            >
              <div className="relative bg-[hsl(174,45%,20%)]/40 backdrop-blur-sm rounded-3xl p-8 
                            shadow-[0_8px_32px_rgba(0,0,0,0.3)] 
                            hover:shadow-[0_12px_48px_rgba(0,0,0,0.4)]
                            hover:bg-[hsl(174,45%,20%)]/50
                            transition-all duration-300 
                            border border-white/10
                            hover:scale-[1.02]
                            flex flex-col items-center justify-center text-center space-y-6
                            min-h-[280px]">
                {/* Ícone */}
                <div className="relative">
                  <div className="absolute inset-0 bg-[hsl(174,72%,56%)] blur-2xl opacity-30 rounded-full" />
                  <module.icon className="w-16 h-16 text-[hsl(174,72%,66%)] relative z-10 
                                        group-hover:scale-110 transition-transform duration-300" 
                              strokeWidth={1.5} />
                </div>

                {/* Texto */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white">
                    {module.title}
                  </h3>
                  <p className="text-base text-white/80">
                    {module.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
