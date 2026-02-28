import { useState, lazy, Suspense } from "react";
import { PortalAuthProvider, usePortalAuth } from "@/components/ponto/PortalAuthProvider";
import { LoginFuncionario } from "@/components/ponto/LoginFuncionario";
import { TrocarSenhaObrigatoria } from "@/components/ponto/TrocarSenhaObrigatoria";
import { PortalDashboard } from "@/components/ponto/PortalDashboard";
import { PortalBeneficios } from "@/components/ponto/PortalBeneficios";
import { Skeleton } from "@/components/ui/skeleton";
import { useHoleritesRealtime, useComunicadosRealtime, useFeriasRealtime } from "@/hooks/useRealtimeUpdates";
import { usePortalTheme } from "@/hooks/usePortalTheme";

// Lazy load heavy portal sections
const PainelPonto = lazy(() => import("@/components/ponto/PainelPonto").then(m => ({ default: m.PainelPonto })));
const PortalHolerite = lazy(() => import("@/components/ponto/PortalHolerite").then(m => ({ default: m.PortalHolerite })));
const PortalFerias = lazy(() => import("@/components/ponto/PortalFerias").then(m => ({ default: m.PortalFerias })));
const PortalComunicados = lazy(() => import("@/components/ponto/PortalComunicados").then(m => ({ default: m.PortalComunicados })));
const PortalPerfil = lazy(() => import("@/components/ponto/PortalPerfil").then(m => ({ default: m.PortalPerfil })));
const PortalCursos = lazy(() => import("@/components/ponto/PortalCursos").then(m => ({ default: m.PortalCursos })));
const PortalSuporte = lazy(() => import("@/components/ponto/PortalSuporte").then(m => ({ default: m.PortalSuporte })));

const SectionLoader = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#40E0D0' }}>
    <div className="space-y-4 w-full max-w-md p-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </div>
);

const RealtimeSubscriptions = () => {
  useHoleritesRealtime();
  useComunicadosRealtime();
  useFeriasRealtime();
  return null;
};

const PortalContent = () => {
  const { user, profile, loading } = usePortalAuth();
  const [currentSection, setCurrentSection] = useState<string>("dashboard");
  const [senhaAlterada, setSenhaAlterada] = useState(false);
  // Initialize theme on portal mount (applies dark class to <html>)
  usePortalTheme();

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

  // Troca de senha obrigatória desativada - fluxo via chamado de suporte

  const handleNavigate = (section: string) => {
    setCurrentSection(section);
  };

  const handleBack = () => {
    setCurrentSection("dashboard");
  };

  // Dashboard loads eagerly, everything else lazy
  if (currentSection === "dashboard") {
    return (
      <>
        <RealtimeSubscriptions />
        <PortalDashboard onNavigate={handleNavigate} />
      </>
    );
  }

  // Benefícios is a static component, render eagerly
  if (currentSection === "beneficios") {
    return (
      <>
        <RealtimeSubscriptions />
        <PortalBeneficios onBack={handleBack} />
      </>
    );
  }

  const sectionMap: Record<string, JSX.Element> = {
    ponto: <PainelPonto onBack={handleBack} />,
    holerite: <PortalHolerite onBack={handleBack} />,
    ferias: <PortalFerias onBack={handleBack} />,
    comunicados: <PortalComunicados onBack={handleBack} />,
    perfil: <PortalPerfil onBack={handleBack} />,
    cursos: <PortalCursos onBack={handleBack} />,
    suporte: <PortalSuporte onBack={handleBack} />,
  };

  return (
    <Suspense fallback={<SectionLoader />}>
      <RealtimeSubscriptions />
      {sectionMap[currentSection] || <PortalDashboard onNavigate={handleNavigate} />}
    </Suspense>
  );
};

const PortalFuncionario = () => {
  return (
    <PortalAuthProvider>
      <PortalContent />
    </PortalAuthProvider>
  );
};

export default PortalFuncionario;
