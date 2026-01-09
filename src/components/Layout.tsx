import { Building2, Moon, Sun, LogOut, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "./auth/AuthProvider";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import loginBackground from "@/assets/login-background.png";

const navItems = [
  { path: "/", label: "Dashboard", icon: "📊" },
  { path: "/funcionarios", label: "Funcionários", icon: "👥" },
  { path: "/banco-talentos", label: "Banco de Talentos", icon: "🎯" },
  { path: "/relatorios", label: "Relatórios", icon: "📈" },
  { path: "/folha-ponto", label: "Folha de Ponto", icon: "🕐" },
  { path: "/holerites", label: "Holerites", icon: "📄" },
  { path: "/comunicados", label: "Comunicados", icon: "📢" },
  { path: "/admins", label: "Admins", icon: "⚙️" },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      {/* Overlay para melhorar legibilidade */}
      <div className="min-h-screen bg-background/85 backdrop-blur-[2px]">
      {/* Header */}
      <header className="bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-primary" />
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">AtivaRH</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-muted-foreground hidden xl:block">
              {currentDate}
            </span>
            <span className="text-xs md:text-sm font-medium text-foreground hidden md:inline max-w-[150px] truncate">
              {profile?.nome || "Usuário"}
            </span>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="h-8 w-8 md:h-10 md:w-10">
              {isDark ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => signOut()}
              title="Sair"
              className="h-8 w-8 md:h-10 md:w-10"
            >
              <LogOut className="h-4 w-4 md:h-5 md:w-5" />
            </Button>
            
            {/* Mobile menu button */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0">
                <div className="flex flex-col h-full">
                  <div className="p-4 border-b flex items-center justify-between">
                    <span className="font-semibold text-foreground">Menu</span>
                  </div>
                  <nav className="flex-1 p-4">
                    <div className="space-y-1">
                      {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors touch-target ${
                              isActive
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground hover:bg-muted"
                            }`}
                          >
                            <span className="text-lg">{item.icon}</span>
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </nav>
                  <div className="p-4 border-t">
                    <p className="text-xs text-muted-foreground truncate">
                      {profile?.nome || "Usuário"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {currentDate}
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Desktop Navigation */}
      <nav className="bg-primary border-b border-primary-foreground/10 fixed top-[49px] sm:top-[53px] md:top-[65px] left-0 right-0 z-40 hidden md:block">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-1 lg:gap-2 px-2 lg:px-4 py-3 lg:py-4 text-xs lg:text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? "text-primary-foreground border-primary-foreground"
                      : "text-primary-foreground/70 border-transparent hover:text-primary-foreground hover:border-primary-foreground/30"
                  }`}
                >
                  <span className="text-base lg:text-lg">{item.icon}</span>
                  <span className="hidden lg:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 lg:py-8 md:pt-20 lg:pt-24">{children}</main>
      </div>
    </div>
  );
};
