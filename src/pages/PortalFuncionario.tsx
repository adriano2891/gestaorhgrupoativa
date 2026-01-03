import { useState } from "react";
import { PortalAuthProvider, usePortalAuth } from "@/components/ponto/PortalAuthProvider";
import { LoginFuncionario } from "@/components/ponto/LoginFuncionario";
import { PortalDashboard } from "@/components/ponto/PortalDashboard";
import { PainelPonto } from "@/components/ponto/PainelPonto";
import { PortalHolerite } from "@/components/ponto/PortalHolerite";
import { PortalFerias } from "@/components/ponto/PortalFerias";
import { PortalComunicados } from "@/components/ponto/PortalComunicados";
import { PortalPerfil } from "@/components/ponto/PortalPerfil";
import { PortalBeneficios } from "@/components/ponto/PortalBeneficios";
import { PortalCursos } from "@/components/ponto/PortalCursos";
import { PortalSuporte } from "@/components/ponto/PortalSuporte";
import { Skeleton } from "@/components/ui/skeleton";
import { useHoleritesRealtime, useComunicadosRealtime, useFeriasRealtime } from "@/hooks/useRealtimeUpdates";

const PortalContent = () => {
  const { user, loading } = usePortalAuth();
  const [currentSection, setCurrentSection] = useState<string>("dashboard");

  // Habilitar atualizações em tempo real para o portal
  useHoleritesRealtime();
  useComunicadosRealtime();
  useFeriasRealtime();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary via-primary to-primary-dark flex items-center justify-center p-4">
        <div className="space-y-4 w-full max-w-md">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostra tela de login
  if (!user) {
    return <LoginFuncionario />;
  }

  // Navegação entre seções
  const handleNavigate = (section: string) => {
    setCurrentSection(section);
  };

  const handleBack = () => {
    setCurrentSection("dashboard");
  };

  // Renderiza a seção atual
  switch (currentSection) {
    case "dashboard":
      return <PortalDashboard onNavigate={handleNavigate} />;
    case "ponto":
      return <PainelPonto />;
    case "holerite":
      return <PortalHolerite onBack={handleBack} />;
    case "ferias":
      return <PortalFerias onBack={handleBack} />;
    case "comunicados":
      return <PortalComunicados onBack={handleBack} />;
    case "perfil":
      return <PortalPerfil onBack={handleBack} />;
    case "beneficios":
      return <PortalBeneficios onBack={handleBack} />;
    case "cursos":
      return <PortalCursos onBack={handleBack} />;
    case "suporte":
      return <PortalSuporte onBack={handleBack} />;
    default:
      return <PortalDashboard onNavigate={handleNavigate} />;
  }
};

const PortalFuncionario = () => {
  return (
    <PortalAuthProvider>
      <PortalContent />
    </PortalAuthProvider>
  );
};

export default PortalFuncionario;
