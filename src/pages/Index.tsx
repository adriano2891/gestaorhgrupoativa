import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { Icon3D } from "@/components/dashboard/Icon3D";

const Index = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
  const isAdmin = roles.includes("admin") || roles.includes("rh") || roles.includes("gestor");

  type ModuleShape = "box" | "sphere" | "torus" | "cone" | "octahedron" | "dodecahedron";
  
  const modules: Array<{
    title: string;
    description: string;
    shape: ModuleShape;
    path: string;
    color: string;
    gradient: string;
  }> = [
    {
      title: "Funcionários",
      description: "Gestão de colaboradores",
      shape: "sphere",
      path: "/funcionarios",
      color: "#3b82f6",
      gradient: "from-blue-400 to-blue-600",
    },
    {
      title: "Banco de Talentos",
      description: "Candidatos e recrutamento",
      shape: "dodecahedron",
      path: "/banco-talentos",
      color: "#a855f7",
      gradient: "from-purple-400 to-purple-600",
    },
    {
      title: "Relatórios",
      description: "Análises e indicadores",
      shape: "octahedron",
      path: "/relatorios",
      color: "#10b981",
      gradient: "from-green-400 to-green-600",
    },
    {
      title: "Folha de Ponto",
      description: "Controle de jornada",
      shape: "torus",
      path: "/folha-ponto",
      color: "#f97316",
      gradient: "from-orange-400 to-orange-600",
    },
    {
      title: "Holerites",
      description: "Gestão de pagamentos",
      shape: "box",
      path: "/holerites",
      color: "#06b6d4",
      gradient: "from-cyan-400 to-cyan-600",
    },
  ];

  // Adicionar Gerenciar Admins apenas para admins
  if (isAdmin) {
    modules.push({
      title: "Gerenciar Admins",
      description: "Controle de administradores",
      shape: "cone",
      path: "/admins",
      color: "#ef4444",
      gradient: "from-red-400 to-red-600",
    });
  }

  return (
    <div className="min-h-[calc(100vh-180px)] px-4 py-8">
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Acesso rápido aos módulos do sistema
          </p>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card
              key={module.path}
              className="cursor-pointer hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary group relative overflow-hidden"
              onClick={() => navigate(module.path)}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${module.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
              />

              <CardHeader className="space-y-4 relative z-10">
                {/* 3D Icon Container */}
                <div className="w-32 h-32 mx-auto group-hover:scale-110 transition-transform duration-500">
                  <Icon3D color={module.color} shape={module.shape} />
                </div>

                <div className="text-center">
                  <CardTitle className="text-2xl font-bold group-hover:text-primary transition-colors duration-300">
                    {module.title}
                  </CardTitle>
                  <CardDescription className="mt-2 text-base">
                    {module.description}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
