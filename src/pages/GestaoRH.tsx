import { LogOut, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  useMetricasRealtime, 
  useFuncionariosRealtime, 
  useComunicadosRealtime 
} from "@/hooks/useRealtimeUpdates";
import { useIsMobile } from "@/hooks/use-mobile";
import logoAtiva from "@/assets/logo-ativa.png";
import iconFuncionarios from "@/assets/icon-rh-funcionarios.png";
import iconTalentos from "@/assets/icon-rh-talentos.png";
import iconRelatorios from "@/assets/icon-rh-relatorios.png";
import iconPonto from "@/assets/icon-rh-ponto.png";
import iconHolerites from "@/assets/icon-rh-holerites.png";
import iconComunicados from "@/assets/icon-rh-comunicados.png";
import iconAdmins from "@/assets/icon-rh-admins.png";

interface ModuleItem {
  title: string;
  description: string;
  iconSrc: string;
  path: string;
}

const GestaoRH = () => {
  const navigate = useNavigate();
  const { roles, signOut } = useAuth();
  const isMobile = useIsMobile();
  
  useMetricasRealtime();
  useFuncionariosRealtime();
  useComunicadosRealtime();
  const isAdmin = roles.includes("admin") || roles.includes("rh") || roles.includes("gestor");

  const modules: ModuleItem[] = [
    { title: "Funcionários", description: "Gestão de colaboradores", iconSrc: iconFuncionarios, path: "/funcionarios" },
    { title: "Banco de Talentos", description: "Candidatos e recrutamento", iconSrc: iconTalentos, path: "/banco-talentos" },
    { title: "Relatórios", description: "Análises e indicadores", iconSrc: iconRelatorios, path: "/relatorios" },
    { title: "Folha de Ponto", description: "Controle de jornada", iconSrc: iconPonto, path: "/folha-ponto" },
    { title: "Holerites", description: "Gestão de pagamentos", iconSrc: iconHolerites, path: "/holerites" },
    { title: "Comunicados", description: "Avisos e notificações internas", iconSrc: iconComunicados, path: "/comunicados" },
  ];

  if (isAdmin) {
    modules.push({ title: "Gerenciar Admins", description: "Controle de administradores", iconSrc: iconAdmins, path: "/admins" });
  }

  const handleLogout = async () => {
    await signOut();
  };

  // Calculate circular position
  const getModulePosition = (index: number, total: number, radius: number) => {
    const angleStep = (2 * Math.PI) / total;
    const angle = -Math.PI / 2 + index * angleStep;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    };
  };

  // Mobile/Tablet layout
  if (isMobile) {
    return (
      <div className="min-h-screen relative overflow-hidden safe-bottom" style={{ backgroundColor: '#40E0D0' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-1 text-white hover:opacity-80 transition-opacity touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Voltar</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-white hover:opacity-80 transition-opacity touch-target"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sair</span>
          </button>
        </div>

        {/* Título */}
        <div className="text-center py-3 px-4">
          <h1 
            className="text-2xl sm:text-3xl text-white"
            style={{ 
              fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
              fontStyle: 'italic',
              textShadow: '1px 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            Gestão RH
          </h1>
        </div>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img src={logoAtiva} alt="Logo Grupo Ativa" className="w-24 sm:w-32 h-auto opacity-40" />
        </div>

        {/* Grid de Módulos */}
        <div className="px-4 pb-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto">
            {modules.map((module) => (
              <div
                key={module.path}
                className="cursor-pointer active:scale-95 transition-transform duration-200 flex flex-col items-center"
                onClick={() => navigate(module.path)}
              >
                <div className="rounded-full shadow-lg overflow-hidden w-20 h-20 sm:w-24 sm:h-24 ring-2 ring-white/30">
                  <img src={module.iconSrc} alt={module.title} className="w-full h-full object-cover" />
                </div>
                <p 
                  className="text-center mt-2 font-semibold text-white text-[10px] sm:text-xs leading-tight max-w-[90px]"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
                >
                  {module.title}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout (circular)
  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#40E0D0' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 lg:px-8 pt-4 lg:pt-6">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <ArrowLeft className="w-5 h-5 lg:w-6 lg:h-6" />
          <span className="text-sm lg:text-lg">Voltar</span>
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity"
        >
          <LogOut className="w-5 h-5 lg:w-6 lg:h-6" />
          <span className="text-sm lg:text-lg font-medium">Sair</span>
        </button>
      </div>

      {/* Título */}
      <div className="text-center pt-2 lg:pt-4 pb-4 lg:pb-8">
        <h1 
          className="text-3xl md:text-4xl lg:text-5xl text-white"
          style={{ 
            fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
            fontStyle: 'italic',
            textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          Gestão RH
        </h1>
      </div>

      {/* Container central */}
      <div className="relative w-full flex items-center justify-center px-4" style={{ height: 'calc(100vh - 180px)', minHeight: '400px' }}>
        
        {/* Logo Central */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          <img 
            src={logoAtiva} 
            alt="Logo Grupo Ativa" 
            className="w-48 md:w-64 lg:w-80 xl:w-96 h-auto opacity-90"
          />
        </div>

        {/* Layout Circular - XL */}
        <div className="hidden xl:block relative" style={{ width: '700px', height: '500px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 260);
            return (
              <div
                key={module.path}
                className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
                style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                onClick={() => navigate(module.path)}
              >
                <div className="rounded-full shadow-lg overflow-hidden w-28 h-28 ring-4 ring-white/30 hover:ring-white/50">
                  <img src={module.iconSrc} alt={module.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-center mt-3 font-semibold text-white text-sm max-w-[120px]" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Layout Circular - LG */}
        <div className="hidden lg:block xl:hidden relative" style={{ width: '600px', height: '450px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 220);
            return (
              <div
                key={module.path}
                className="absolute cursor-pointer hover:scale-110 transition-transform duration-200"
                style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                onClick={() => navigate(module.path)}
              >
                <div className="rounded-full shadow-lg overflow-hidden w-24 h-24 ring-3 ring-white/30">
                  <img src={module.iconSrc} alt={module.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-center mt-2 font-semibold text-white text-xs max-w-[100px]" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Layout Circular - MD */}
        <div className="hidden md:block lg:hidden relative" style={{ width: '500px', height: '400px' }}>
          {modules.map((module, index) => {
            const { x, y } = getModulePosition(index, modules.length, 180);
            return (
              <div
                key={module.path}
                className="absolute cursor-pointer hover:scale-105 transition-transform duration-200"
                style={{ left: '50%', top: '50%', transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                onClick={() => navigate(module.path)}
              >
                <div className="rounded-full shadow-lg overflow-hidden w-20 h-20 ring-2 ring-white/30">
                  <img src={module.iconSrc} alt={module.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-center mt-2 font-semibold text-white text-[10px] max-w-[80px]" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            );
          })}
        </div>

        {/* Layout Grid - SM (tablets pequenos) */}
        <div className="block md:hidden relative">
          <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
            {modules.map((module) => (
              <div
                key={module.path}
                className="cursor-pointer hover:scale-105 transition-transform duration-200 flex flex-col items-center"
                onClick={() => navigate(module.path)}
              >
                <div className="rounded-full shadow-lg overflow-hidden w-20 h-20 ring-2 ring-white/30">
                  <img src={module.iconSrc} alt={module.title} className="w-full h-full object-cover" />
                </div>
                <p className="text-center mt-2 font-semibold text-white text-[10px] max-w-[70px] leading-tight" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>
                  {module.title}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GestaoRH;
