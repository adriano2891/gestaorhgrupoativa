import { Moon, Sun, LogOut, Menu, CalendarDays } from "lucide-react";
import logoSistemaIntegrado from "@/assets/logo-sistema-integrado-header.png";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { useState } from "react";
import { useAuth } from "./auth/AuthProvider";
const sistemaIntegradoBg = "/sistema-integrado-background.png";
import { SistemaIntegradoModuleBar } from "./SistemaIntegradoModuleBar";
import { AgendaPanel } from "./agenda";

export const SistemaIntegradoLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [agendaOpen, setAgendaOpen] = useState(false);
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
    <div className="min-h-screen relative">
      {/* Background layer */}
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: `url(${sistemaIntegradoBg})` }}
      />
      <div className="fixed inset-0 bg-background/85 backdrop-blur-[2px] -z-10" />

      {/* Content layer */}
      <div className="min-h-screen relative">
        {/* Header - same as RH but without Radio and Notifications */}
        <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50 border-b border-border" role="banner">
          <div className="w-full px-2 2xs:px-3 sm:px-4 md:px-6 py-1.5 sm:py-2 md:py-3 flex items-center justify-between">
            <div className="flex items-center gap-1 2xs:gap-1.5 sm:gap-2 shrink min-w-0">
              <img
                src={logoSistemaIntegrado}
                alt="Sistema Integrado Grupo Ativa"
                className="h-7 2xs:h-8 sm:h-9 md:h-10 object-contain flex-shrink-0"
              />
            </div>

            <div className="flex items-center gap-0.5 2xs:gap-1 sm:gap-2 md:gap-3 flex-shrink-0">
              <span className="text-xs md:text-sm text-foreground hidden xl:block">
                {currentDate}
              </span>
              <span className="text-[10px] 2xs:text-xs md:text-sm font-medium text-foreground hidden sm:inline max-w-[100px] md:max-w-[150px] truncate">
                {profile?.nome || "Usuário"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAgendaOpen(true)}
                className="h-7 w-7 2xs:h-8 2xs:w-8 md:h-10 md:w-10 focus-ring"
                style={{ color: '#3ee0cf' }}
                aria-label="Abrir agenda"
              >
                <CalendarDays className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="h-7 w-7 2xs:h-8 2xs:w-8 md:h-10 md:w-10 focus-ring"
                style={{ color: '#3ee0cf' }}
                aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
              >
                {isDark ? <Sun className="h-4 w-4 md:h-5 md:w-5" /> : <Moon className="h-4 w-4 md:h-5 md:w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => signOut()}
                className="h-7 w-7 2xs:h-8 2xs:w-8 md:h-10 md:w-10 focus-ring"
                style={{ color: '#3ee0cf' }}
                aria-label="Sair do sistema"
              >
                <LogOut className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-[40px] 2xs:h-[44px] sm:h-[48px] md:h-[56px]" />

        {/* Module Navigation Bar */}
        <SistemaIntegradoModuleBar />

        {/* Main Content */}
        <main
          id="main-content"
          className="w-full px-2 2xs:px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-6 lg:py-8 mx-auto max-w-7xl"
          role="main"
        >
          {children}
        </main>
      </div>

      <AgendaPanel open={agendaOpen} onOpenChange={setAgendaOpen} />
    </div>
  );
};
