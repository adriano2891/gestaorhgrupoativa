import React, { createContext, useContext, useState } from "react"; // Added React
import { Users, Briefcase, BarChart3, Clock, FileText, Shield } from "lucide-react";
// Removed: import { useNavigate } from "react-router-dom";
// Removed: import { useAuth } from "@/components/auth/AuthProvider";
// Removed: import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// --- COMPONENTES E HOOKS SIMULADOS (MOCKS) ---

// Simulação dos componentes Card (de shadcn/ui)
// Versões simplificadas com Tailwind
const Card = ({ children, className = "", ...props }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const CardHeader = ({ children, className = "", ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props}>
    {children}
  </h3>
);

const CardDescription = ({ children, className = "", ...props }) => (
  <p className={`text-sm text-muted-foreground ${className}`} {...props}>
    {children}
  </p>
);

// Simulação do AuthProvider
const AuthContext = createContext(null);

const MockAuthProvider = ({ children }) => {
  // Simula um usuário admin para fins de teste
  const auth = {
    roles: ["admin", "user"],
    // Você pode mudar para roles: ["user"] para testar como não-admin
  };
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback caso não esteja envolvido (embora nós vamos envolvê-lo)
    console.warn("useAuth chamado fora de um AuthProvider. Retornando mock de admin.");
    return { roles: ["admin", "user"] };
  }
  return context;
};

// Simulação do useNavigate
const useNavigate = () => {
  return (path) => {
    // Em um app real, isso mudaria a URL.
    // Aqui, apenas logamos no console para mostrar que funciona.
    console.log(`Navegando para: ${path}`);
    // Usamos um 'alert' simples para simular a navegação
    // Não use alert() em produção real.
    // window.alert(`Navegando para: ${path}\n(Funcionalidade de Roteamento Simulada)`);
  };
};

// --- COMPONENTE ORIGINAL (Renomeado de Index para Dashboard) ---

const Dashboard = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();
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
    // Cor de fundo personalizada e classe dark mode
    <div
      className="min-h-[calc(100vh-180px)] px-4 py-8 dark:bg-gray-900"
      style={{ backgroundColor: "#46e1d1" }} // Cor de fundo aplicada
    >
      <div className="w-full max-w-7xl mx-auto space-y-8">
        {/* Cabeçalho */}
        <div className="text-center space-y-2">
          {/* text-foreground -> substituído por cores Tailwind padrão */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Acesso Rápido</h1>
          {/* text-muted-foreground -> substituído por cores Tailwind padrão */}
          <p className="text-lg text-muted-foreground">Acesso rápido aos módulos do sistema</p>
        </div>

        {/* Grid de Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => (
            <Card
              key={module.path}
              // Adicionada cor de borda dark mode
              className="cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-gray-200 dark:border-gray-800 hover:border-primary group"
              onClick={() => navigate(module.path)}
            >
              <CardHeader className="space-y-4">
                <div
                  className={`w-16 h-16 rounded-lg ${module.bgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
                >
                  <module.icon className={`w-8 h-8 ${module.color}`} />
                </div>
                <div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">{module.title}</CardTitle>
                  <CardDescription className="mt-2">{module.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- COMPONENTE PRINCIPAL 'APP' ---
// Criei um componente 'App' para envolver o Dashboard no MockAuthProvider
const App = () => {
  return (
    <MockAuthProvider>
      {/* Definições CSS inline para simular as cores do tema Tailwind
        (text-foreground, bg-card, etc.) que estavam faltando.
      */}
      <style>{`
        :root {
          --card: 0 0% 100%;
          --card-foreground: 222.2 84% 4.9%;
          --muted-foreground: 215.4 16.3% 46.9%;
          --foreground: 222.2 84% 4.9%;
          --border: 214.3 31.8% 91.4%;
          --primary: 173 71% 58%; /* Cor alterada para #46e1d1 */
        }
        
        .dark {
          --card: 222.2 84% 4.9%;
          --card-foreground: 210 40% 98%;
          --muted-foreground: 217.2 32.6% 76.9%;
          --foreground: 210 40% 98%;
          --border: 217.2 32.6% 17.5%;
        }

        .bg-card { background-color: hsl(var(--card)); }
        .text-card-foreground { color: hsl(var(--card-foreground)); }
        .text-muted-foreground { color: hsl(var(--muted-foreground)); }
        .text-foreground { color: hsl(var(--foreground)); }
        .border { border-color: hsl(var(--border)); }
        .hover\\:border-primary:hover { border-color: hsl(var(--primary)) !important; }
        .group-hover\\:text-primary:hover { color: hsl(var(--primary)) !important; }
      `}</style>
      <Dashboard />
    </MockAuthProvider>
  );
};

export default App; // Exporta App como padrão
