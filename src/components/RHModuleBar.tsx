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
];

const rhPaths = new Set(rhModules.map(m => m.path));
rhPaths.add("/admins");
rhPaths.add("/gestao-rh");

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
    <nav className="bg-[#3EE0CF] border-b border-[#2bc4b5] sticky top-[49px] sm:top-[53px] md:top-[65px] z-40 hidden md:block">
      <div className="w-full px-2 md:px-4">
        <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 py-1.5 lg:gap-x-4">
          {allModules.map((mod) => {
            const isActive = location.pathname === mod.path;
            const badge = badgeCounts[mod.path] || 0;

            return (
              <button
                key={mod.path}
                onClick={() => navigate(mod.path)}
                onMouseEnter={() => handlePrefetch(mod.path)}
                className={`relative flex flex-col items-center gap-0.5 transition-all duration-200 group ${
                  isActive ? "opacity-100" : "opacity-75 hover:opacity-100"
                }`}
              >
                <div
                  className={`relative flex-shrink-0 rounded-full overflow-hidden transition-all duration-200 ${
                    isActive
                      ? "ring-2 ring-white shadow-lg scale-105"
                      : "ring-1 ring-white/40 group-hover:ring-2 group-hover:ring-white group-hover:scale-105"
                  }`}
                  style={{ width: 30, height: 30 }}
                >
                  <img
                    src={mod.iconSrc}
                    alt={mod.title}
                    className={`w-full h-full object-cover ${mod.iconScale || (mod.scaleIcon ? "scale-110" : "")}`}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-500 text-white text-[7px] font-bold shadow z-10 ring-1 ring-white">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] leading-tight text-white font-medium whitespace-nowrap max-w-[60px] truncate ${isActive ? "font-bold" : ""}`}>
                  {mod.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
