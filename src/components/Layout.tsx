import { Building2, Moon, Sun, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "./auth/AuthProvider";

const navItems = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/funcionarios", label: "Funcionários", icon: "👥" },
  { path: "/banco-talentos", label: "Banco de Talentos", icon: "🎯" },
  { path: "/relatorios", label: "Relatórios e Análises", icon: "📈" },
  { path: "/folha-ponto", label: "Folha de Ponto", icon: "🕐" },
  { path: "/holerites", label: "Holerites", icon: "📄" },
  { path: "/comunicados", label: "Comunicados", icon: "📢" },
  { path: "/admins", label: "Gerenciar Admins", icon: "⚙️" },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const { signOut, profile } = useAuth();

  const toggleTheme = () => {
    setIsDark(!isDark);
    document.documentElement.classList.toggle("dark");
  };

  const currentDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AtivaRH</h1>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:block">
              {currentDate}
            </span>
            <span className="text-sm font-medium text-foreground">
              {profile?.nome || "Usuário"}
            </span>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => signOut()}
              title="Sair"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-primary border-b border-primary-foreground/10 sticky top-[73px] z-40">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-4 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? "text-primary-foreground border-primary-foreground"
                      : "text-primary-foreground/70 border-transparent hover:text-primary-foreground hover:border-primary-foreground/30"
                  }`}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  );
};
