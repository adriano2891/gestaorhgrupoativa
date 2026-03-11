import { useNavigate, useLocation } from "react-router-dom";
import { useMemo, useCallback } from "react";

import iconClients from "@/assets/icon-clients-new.png";
import iconSuppliers from "@/assets/icon-suppliers-new.png";
import iconBudget from "@/assets/icon-orcamentos-new.png";
import iconInventario from "@/assets/icon-inventario-new.png";
import iconDocumentacoes from "@/assets/icon-documentacoes.png";
import iconBackups from "@/assets/icon-backups-new.png";

interface SIModule {
  title: string;
  iconSrc: string;
  path: string;
  iconScale?: string;
}

const siModules: SIModule[] = [
  { title: "Clientes", iconSrc: iconClients, path: "/gestao-clientes" },
  { title: "Fornecedores", iconSrc: iconSuppliers, path: "/fornecedores" },
  { title: "Orçamentos", iconSrc: iconBudget, path: "/orcamentos" },
  { title: "Inventário", iconSrc: iconInventario, path: "/inventario" },
  { title: "Documentos", iconSrc: iconDocumentacoes, path: "/documentacoes-sistema" },
  { title: "Backups", iconSrc: iconBackups, path: "/gestao-backups" },
];

// All paths that belong to "Sistema Integrado" module
const siPaths = new Set(siModules.map(m => m.path));
// Add sub-routes
siPaths.add("/orcamentos/lista");
siPaths.add("/orcamentos/novo");
siPaths.add("/orcamentos/itens");
siPaths.add("/orcamentos/clientes/novo");
siPaths.add("/fornecedores/novo");

export const SI_PATHS = siPaths;

/** Check if a given pathname belongs to Sistema Integrado */
export const isSIPath = (pathname: string): boolean => {
  if (siPaths.has(pathname)) return true;
  // Match dynamic routes like /orcamentos/:id, /fornecedores/:id
  if (/^\/orcamentos\/[^/]+/.test(pathname)) return true;
  if (/^\/fornecedores\/[^/]+/.test(pathname)) return true;
  return false;
};

export const SistemaIntegradoModuleBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const prefetchMap: Record<string, () => void> = useMemo(() => ({
    '/gestao-clientes': () => import("@/pages/GestaoClientes"),
    '/fornecedores': () => import("@/pages/Fornecedores"),
    '/orcamentos': () => import("@/pages/OrcamentosDashboard"),
    '/inventario': () => import("@/pages/InventarioEquipamentos"),
    '/documentacoes-sistema': () => import("@/pages/DocumentacoesSistema"),
    '/gestao-backups': () => import("@/pages/GestaoBackups"),
  }), []);

  const handlePrefetch = useCallback((path: string) => {
    prefetchMap[path]?.();
  }, [prefetchMap]);

  const isActive = (path: string) => {
    if (location.pathname === path) return true;
    // Highlight parent for sub-routes
    if (path === "/orcamentos" && location.pathname.startsWith("/orcamentos")) return true;
    if (path === "/fornecedores" && location.pathname.startsWith("/fornecedores")) return true;
    return false;
  };

  return (
    <>
      <nav
        className="bg-primary border-b border-primary-foreground/10 fixed top-[44px] sm:top-[48px] md:top-[56px] left-0 right-0 z-40 shadow-md"
        role="navigation"
        aria-label="Módulos do Sistema Integrado"
      >
        <div className="w-full relative overflow-x-auto overflow-y-hidden rh-module-scrollbar" style={{ WebkitOverflowScrolling: "touch" }}>
          <div className="inline-flex min-w-max items-center gap-2 2xs:gap-3 md:gap-4 px-2 2xs:px-3 md:px-5 py-2.5 sm:py-3">
            {siModules.map((mod) => {
              const active = isActive(mod.path);

              return (
                <button
                  key={mod.path}
                  onClick={() => navigate(mod.path)}
                  onMouseEnter={() => handlePrefetch(mod.path)}
                  aria-current={active ? "page" : undefined}
                  aria-label={mod.title}
                  className={`relative inline-flex shrink-0 items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all duration-200 group focus-ring rounded-md ${
                    active ? "opacity-100" : "opacity-75 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`relative shrink-0 rounded-full overflow-hidden transition-all duration-200 ${
                      active
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
                      className={`w-full h-full object-cover ${mod.iconScale || ""}`}
                    />
                  </div>
                  <span className={`text-xs sm:text-sm leading-tight text-primary-foreground font-medium whitespace-nowrap ${active ? "font-bold" : ""}`}>
                    {mod.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>
      {/* Spacer */}
      <div className="h-[48px] sm:h-[54px] md:h-[56px]" />
    </>
  );
};
