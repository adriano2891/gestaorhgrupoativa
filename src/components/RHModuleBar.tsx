import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useMemo, useCallback } from "react";

import iconFuncionarios from "@/assets/icon-rh-funcionarios.png";
import iconTalentos from "@/assets/icon-rh-talentos.png";
import iconRelatorios from "@/assets/icon-rh-relatorios.png";
import iconPonto from "@/assets/icon-rh-ponto.png";
import iconHolerites from "@/assets/icon-rh-holerites.png";
import iconComunicados from "@/assets/icon-rh-comunicados.png";
import iconAdmins from "@/assets/icon-rh-admins.png";
import iconFormularios from "@/assets/icon-rh-formularios.png";
import iconCursos from "@/assets/icon-rh-cursos.png";
import iconFerias from "@/assets/icon-rh-ferias.png";
import iconSuporte from "@/assets/icon-rh-suporte.png";
import iconDocumentos from "@/assets/icon-rh-documentos.png";
import iconSST from "@/assets/icon-rh-sst.png";

interface RHModule {
  title: string;
  iconSrc: string;
  path: string;
  iconScale?: string;
  scaleIcon?: boolean;
}

const rhModules: RHModule[] = [
  { title: "Funcionários", iconSrc: iconFuncionarios, path: "/funcionarios", iconScale: "scale-[1.3]" },
  { title: "Banco de Talentos", iconSrc: iconTalentos, path: "/banco-talentos", scaleIcon: true },
  { title: "Relatórios", iconSrc: iconRelatorios, path: "/relatorios", iconScale: "scale-[1.3]" },
  { title: "Controle de Ponto", iconSrc: iconPonto, path: "/folha-ponto", iconScale: "scale-[1.2]" },
  { title: "Holerites", iconSrc: iconHolerites, path: "/holerites", scaleIcon: true },
  { title: "Comunicados", iconSrc: iconComunicados, path: "/comunicados", scaleIcon: true },
  { title: "Formulários", iconSrc: iconFormularios, path: "/hrflow-pro", iconScale: "scale-[1.3]" },
  { title: "Cursos", iconSrc: iconCursos, path: "/cursos", iconScale: "scale-[1.3]" },
  { title: "Controle de Férias", iconSrc: iconFerias, path: "/controle-ferias", scaleIcon: true },
  { title: "Suporte", iconSrc: iconSuporte, path: "/suporte-funcionarios", iconScale: "scale-[1.3]" },
  { title: "Documentos", iconSrc: iconDocumentos, path: "/documentacoes", iconScale: "scale-[1.3]" },
  { title: "Saúde e Segurança", iconSrc: iconSST, path: "/saude-seguranca", iconScale: "scale-[1.3]" },
];

const rhPaths = new Set(rhModules.map(m => m.path));
rhPaths.add("/admins");
rhPaths.add("/gestao-rh");
rhPaths.add("/formularios-rh");
rhPaths.add("/saude-seguranca");

export const RH_PATHS = rhPaths;

export const RHModuleBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { roles } = useAuth();
  const { notifications } = useAdminNotifications();
  const isSuperAdmin = roles.includes("admin");

  const allModules = useMemo(() => {
    const mods = [...rhModules];
    if (isSuperAdmin) {
      mods.push({ title: "Admins", iconSrc: iconAdmins, path: "/admins", scaleIcon: true });
    }
    return mods;
  }, [isSuperAdmin]);

  const badgeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    notifications.forEach((n) => {
      if (n.route) counts[n.route] = (counts[n.route] || 0) + 1;
    });
    return counts;
  }, [notifications]);

  const prefetchMap: Record<string, () => void> = useMemo(() => ({
    '/funcionarios': () => import("@/pages/Funcionarios"),
    '/banco-talentos': () => import("@/pages/BancoTalentos"),
    '/relatorios': () => import("@/pages/Relatorios"),
    '/folha-ponto': () => import("@/pages/FolhaPonto"),
    '/holerites': () => import("@/pages/Holerites"),
    '/comunicados': () => import("@/pages/Comunicados"),
    '/hrflow-pro': () => import("@/pages/HRFlowPro"),
    '/cursos': () => import("@/pages/CursosAdmin"),
    '/controle-ferias': () => import("@/pages/ControleFerias"),
    '/suporte-funcionarios': () => import("@/pages/SuporteFuncionarios"),
    '/documentacoes': () => import("@/pages/Documentacoes"),
    '/admins': () => import("@/pages/GerenciarAdmins"),
  }), []);

  const handlePrefetch = useCallback((path: string) => {
    prefetchMap[path]?.();
  }, [prefetchMap]);

  return (
    <>
      <nav
        className="bg-primary border-b border-primary-foreground/10 fixed top-[44px] sm:top-[48px] md:top-[56px] left-0 right-0 z-40 shadow-md"
        role="navigation"
        aria-label="Módulos de RH"
      >
        <div className="w-full relative overflow-x-auto overflow-y-hidden scrollbar-hide" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="inline-flex min-w-max items-center gap-2 2xs:gap-3 md:gap-4 px-2 2xs:px-3 md:px-5 py-2.5 sm:py-3">
            {allModules.map((mod) => {
              const isActive = location.pathname === mod.path;
              const badge = badgeCounts[mod.path] || 0;

              return (
                <button
                  key={mod.path}
                  onClick={() => navigate(mod.path)}
                  onMouseEnter={() => handlePrefetch(mod.path)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`${mod.title}${badge > 0 ? ` (${badge} notificações)` : ''}`}
                  className={`relative inline-flex shrink-0 items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all duration-200 group focus-ring rounded-md ${
                    isActive ? "opacity-100" : "opacity-75 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`relative shrink-0 rounded-full overflow-hidden transition-all duration-200 ${
                      isActive
                        ? "ring-2 ring-primary-foreground shadow-lg scale-105"
                        : "ring-1 ring-primary-foreground/40 group-hover:ring-2 group-hover:ring-primary-foreground group-hover:scale-105"
                    }`}
                    style={{ width: 28, height: 28 }}
                  >
                    <img
                      src={mod.iconSrc}
                      alt=""
                      aria-hidden="true"
                      loading="lazy"
                      className={`w-full h-full object-cover ${mod.iconScale || (mod.scaleIcon ? "scale-110" : "")}`}
                    />
                    {badge > 0 && (
                      <span
                        className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[8px] font-bold shadow z-10 ring-1 ring-primary-foreground"
                        aria-hidden="true"
                      >
                        {badge > 9 ? "9+" : badge}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs sm:text-sm leading-tight text-primary-foreground font-medium whitespace-nowrap ${isActive ? "font-bold" : ""}`}>
                    {mod.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      {/* Spacer to prevent content from being hidden behind the fixed bar */}
      <div className="h-[48px] sm:h-[54px] md:h-[56px]" />
    </>
  );
};
