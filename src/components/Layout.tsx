import { Moon, Sun, LogOut, Menu, X } from "lucide-react";
import logoHeader from "@/assets/logo-header.png";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useState, useCallback, useMemo } from "react";
import { useAuth } from "./auth/AuthProvider";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import loginBackground from "@/assets/login-background.png";
import { AdminNotificationBell } from "./AdminNotificationBell";
import { RHModuleBar, RH_PATHS } from "./RHModuleBar";

const allNavItems = [
  { path: "/", label: "Dashboard", icon: "📊", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/funcionarios", label: "Funcionários", icon: "👥", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/banco-talentos", label: "Banco de Talentos", icon: "🎯", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/relatorios", label: "Relatórios", icon: "📈", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/folha-ponto", label: "Folha de Ponto", icon: "🕐", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/holerites", label: "Holerites", icon: "📄", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/comunicados", label: "Comunicados", icon: "📢", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/formularios-rh", label: "Formulários", icon: "📝", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/cursos", label: "Cursos", icon: "🎓", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/suporte-funcionarios", label: "Suporte", icon: "🎧", allowedRoles: ["admin", "rh", "gestor"] },
  { path: "/admins", label: "Admins", icon: "⚙️", allowedRoles: ["admin"] },
];

export const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { signOut, profile, roles } = useAuth();

  // Filter nav items based on user roles
  const navItems = allNavItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return item.allowedRoles.some((r) => roles.includes(r as any));
  });

  // Prefetch module chunks on hover for instant navigation
  const prefetchMap: Record<string, () => void> = useMemo(() => ({
    '/': () => import("@/pages/Dashboard"),
    '/funcionarios': () => import("@/pages/Funcionarios"),
    '/banco-talentos': () => import("@/pages/BancoTalentos"),
    '/relatorios': () => import("@/pages/Relatorios"),
    '/folha-ponto': () => import("@/pages/FolhaPonto"),
    '/holerites': () => import("@/pages/Holerites"),
    '/comunicados': () => import("@/pages/Comunicados"),
    '/formularios-rh': () => import("@/pages/FormulariosRH"),
    '/cursos': () => import("@/pages/CursosAdmin"),
    '/suporte-funcionarios': () => import("@/pages/SuporteFuncionarios"),
    '/admins': () => import("@/pages/GerenciarAdmins"),
    '/controle-ferias': () => import("@/pages/ControleFerias"),
  }), []);

  const handlePrefetch = useCallback((path: string) => {
    prefetchMap[path]?.();
  }, [prefetchMap]);

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
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <img src={logoHeader} alt="AtivaRH" className="h-8 w-8 sm:h-9 sm:w-9 md:h-10 md:w-10 object-contain flex-shrink-0" />
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-foreground whitespace-nowrap">AtivaRH</h1>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-muted-foreground hidden xl:block">
              {currentDate}
            </span>
            <span className="text-xs md:text-sm font-medium text-foreground hidden md:inline max-w-[150px] truncate">
              {profile?.nome || "Usuário"}
            </span>
            <AdminNotificationBell />
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
                            onMouseEnter={() => handlePrefetch(item.path)}
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

      {/* Module Navigation Bar */}
      {RH_PATHS.has(location.pathname) ? (
        <RHModuleBar />
      ) : (
        <nav className="bg-primary border-b border-primary-foreground/10 sticky top-[44px] sm:top-[48px] md:top-[56px] z-40 hidden md:block">
          <div 
            className="w-full"
            style={{ 
              overflowX: 'auto', 
              overflowY: 'hidden',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <ul 
              className="flex items-center px-4 md:px-6 list-none m-0 p-0"
              style={{ 
                display: 'inline-flex',
                flexWrap: 'nowrap',
                minWidth: '100%',
                width: 'max-content',
              }}
            >
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path} style={{ flexShrink: 0 }}>
                    <Link
                      to={item.path}
                      onMouseEnter={() => handlePrefetch(item.path)}
                      style={{ whiteSpace: 'nowrap' }}
                      className={`inline-flex items-center gap-1.5 px-3 py-3 text-xs lg:text-sm font-medium transition-all border-b-2 ${
                        isActive
                          ? "text-primary-foreground border-primary-foreground"
                          : "text-primary-foreground/70 border-transparent hover:text-primary-foreground hover:border-primary-foreground/30"
                      }`}
                    >
                      <span className="text-base lg:text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
};
