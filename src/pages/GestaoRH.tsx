import { useState, useEffect } from "react";
import { LogOut, Moon, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { 
  useMetricasRealtime, 
  useFuncionariosRealtime, 
  useComunicadosRealtime 
} from "@/hooks/useRealtimeUpdates";
import { useIsMobile } from "@/hooks/use-mobile";
import { BackButton } from "@/components/ui/back-button";
import iconFuncionarios from "@/assets/icon-rh-funcionarios.png";
import iconTalentos from "@/assets/icon-rh-talentos.png";
import iconRelatorios from "@/assets/icon-rh-relatorios.png";
import iconPonto from "@/assets/icon-rh-ponto.png";
import iconHolerites from "@/assets/icon-rh-holerites.png";
import iconComunicados from "@/assets/icon-rh-comunicados.png";
import iconAdmins from "@/assets/icon-rh-admins.png";
import iconFormularios from "@/assets/icon-rh-formularios.png";
import iconCursos from "@/assets/icon-rh-cursos.png";

interface ModuleItem {
  title: string;
  description: string;
  iconSrc: string;
  path: string;
  scaleIcon?: boolean;
  iconScale?: string;
}

const GestaoRH = () => {
  const navigate = useNavigate();
  const { roles, signOut, user } = useAuth();
  const isMobile = useIsMobile();
  const [isAnimating, setIsAnimating] = useState(true);
  
  useMetricasRealtime();
  useFuncionariosRealtime();
  useComunicadosRealtime();
  const isAdmin = roles.includes("admin") || roles.includes("rh") || roles.includes("gestor");

  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => {
      setIsAnimating(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const modules: ModuleItem[] = [
    { title: "Dashboard", description: "Painel principal", iconSrc: iconFormularios, path: "/dashboard" },
    { title: "Funcionários", description: "Gestão de colaboradores", iconSrc: iconFuncionarios, path: "/funcionarios" },
    { title: "Banco de Talentos", description: "Candidatos e recrutamento", iconSrc: iconTalentos, path: "/banco-talentos", scaleIcon: true },
    { title: "Relatórios", description: "Análises e indicadores", iconSrc: iconRelatorios, path: "/relatorios" },
    { title: "Folha de Ponto", description: "Controle de jornada", iconSrc: iconPonto, path: "/folha-ponto", iconScale: "scale-150" },
    { title: "Holerites", description: "Gestão de pagamentos", iconSrc: iconHolerites, path: "/holerites", scaleIcon: true },
    { title: "Comunicados", description: "Avisos e notificações internas", iconSrc: iconComunicados, path: "/comunicados", scaleIcon: true },
  ];

  if (isAdmin) {
    modules.push({ title: "Admins", description: "Controle de administradores", iconSrc: iconAdmins, path: "/admins", scaleIcon: true });
  }

  const handleLogout = async () => {
    await signOut();
  };

  const currentDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const userName = user?.email?.split('@')[0] || 'Usuário';

  const animationStyles = `
    @keyframes rh-fade-in {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes rh-slide-down {
      from { opacity: 0; transform: translateY(-20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .rh-animate-header { animation: rh-fade-in 0.4s ease-out forwards; }
    .rh-animate-nav { animation: rh-slide-down 0.5s ease-out forwards; }
    .rh-module-btn {
      transition: all 0.2s ease;
    }
    .rh-module-btn:hover {
      transform: translateY(-2px);
      background: rgba(255,255,255,0.15);
    }
    .rh-module-btn:active {
      transform: translateY(0);
    }
  `;

  // Mobile layout
  if (isMobile) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5f5' }}>
        <style>{animationStyles}</style>
        
        {/* Header */}
        <header className={`flex items-center justify-between px-3 py-2 bg-white shadow-sm ${isAnimating ? 'rh-animate-header' : ''}`}>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5" style={{ color: '#40E0D0' }} />
            <span className="font-bold text-sm" style={{ color: '#333' }}>AtivaRH</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground hidden sm:block">{currentDate}</span>
            <span className="text-xs font-medium text-foreground">{userName}</span>
            <Moon className="w-4 h-4 text-muted-foreground cursor-pointer" />
            <button onClick={handleLogout} className="p-1">
              <LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </header>

        {/* Navigation Bar */}
        <nav 
          className={`w-full overflow-x-auto ${isAnimating ? 'rh-animate-nav' : ''}`}
          style={{ backgroundColor: '#40E0D0' }}
        >
          <div className="flex items-center gap-1 px-2 py-2 min-w-max">
            {modules.map((module, index) => (
              <button
                key={module.path}
                onClick={() => navigate(module.path)}
                className="rh-module-btn flex items-center gap-1.5 px-2 py-1.5 rounded-md text-white whitespace-nowrap"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="w-5 h-5 rounded-full overflow-hidden bg-white/20 flex-shrink-0">
                  <img 
                    src={module.iconSrc} 
                    alt={module.title} 
                    className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-110' : '')}`}
                  />
                </div>
                <span className="text-[10px] font-medium">{module.title}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-lg font-semibold text-foreground mb-2">Bem-vindo ao AtivaRH</h2>
            <p className="text-sm text-muted-foreground">
              Utilize a barra de navegação acima para acessar os módulos do sistema.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Desktop layout - Top navigation bar
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f5f5f5' }}>
      <style>{animationStyles}</style>
      
      {/* Header */}
      <header className={`flex items-center justify-between px-6 py-3 bg-white shadow-sm ${isAnimating ? 'rh-animate-header' : ''}`}>
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6" style={{ color: '#40E0D0' }} />
          <span className="font-bold text-lg" style={{ color: '#333' }}>AtivaRH</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">{currentDate}</span>
          <span className="text-sm font-medium text-foreground">{userName}</span>
          <Moon className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
          <button 
            onClick={handleLogout} 
            className="p-2 hover:bg-muted rounded-md transition-colors"
            title="Sair"
          >
            <LogOut className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </header>

      {/* Navigation Bar with Icons at Top */}
      <nav 
        className={`w-full ${isAnimating ? 'rh-animate-nav' : ''}`}
        style={{ backgroundColor: '#40E0D0' }}
      >
        <div className="flex items-center justify-center gap-1 md:gap-2 lg:gap-4 px-4 py-3 flex-wrap">
          {modules.map((module, index) => (
            <button
              key={module.path}
              onClick={() => navigate(module.path)}
              className="rh-module-btn flex items-center gap-2 px-3 py-2 rounded-lg text-white transition-all"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="w-7 h-7 lg:w-8 lg:h-8 rounded-full overflow-hidden bg-white/20 flex-shrink-0 ring-2 ring-white/30">
                <img 
                  src={module.iconSrc} 
                  alt={module.title} 
                  className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-110' : '')}`}
                />
              </div>
              <span className="text-xs lg:text-sm font-medium whitespace-nowrap">{module.title}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <BackButton to="/dashboard" />
              <div>
                <h1 className="text-2xl font-bold text-foreground">Gestão de Recursos Humanos</h1>
                <p className="text-muted-foreground">Sistema integrado de gestão de pessoas</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {modules.slice(1).map((module) => (
                <button
                  key={module.path}
                  onClick={() => navigate(module.path)}
                  className="flex items-center gap-4 p-4 bg-muted/30 hover:bg-muted/50 rounded-lg transition-colors text-left"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-white shadow-sm flex-shrink-0">
                    <img 
                      src={module.iconSrc} 
                      alt={module.title} 
                      className={`w-full h-full object-cover ${module.iconScale || (module.scaleIcon ? 'scale-110' : '')}`}
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{module.title}</h3>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GestaoRH;
