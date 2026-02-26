import React, { useState, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import { QuotesProvider } from "./contexts/QuotesContext";
import SplashScreen from "./components/SplashScreen";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Skeleton } from "@/components/ui/skeleton";

// Eagerly loaded (critical path)
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

// Lazy loaded pages
const GestaoRH = lazy(() => import("./pages/GestaoRH"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Holerites = lazy(() => import("./pages/Holerites"));
const Funcionarios = lazy(() => import("./pages/Funcionarios"));
const BancoTalentos = lazy(() => import("./pages/BancoTalentos"));
const Relatorios = lazy(() => import("./pages/Relatorios"));
const FolhaPonto = lazy(() => import("./pages/FolhaPonto"));
const GerenciarAdmins = lazy(() => import("./pages/GerenciarAdmins"));
const PortalFuncionario = lazy(() => import("./pages/PortalFuncionario"));
const CreateAdmin = lazy(() => import("./pages/CreateAdmin"));
const ControleFerias = lazy(() => import("./pages/ControleFerias"));
const Comunicados = lazy(() => import("./pages/Comunicados"));
const OrcamentosDashboard = lazy(() => import("./pages/OrcamentosDashboard"));
const OrcamentosLista = lazy(() => import("./pages/OrcamentosLista"));
const OrcamentosBuilder = lazy(() => import("./pages/OrcamentosBuilder"));
const OrcamentosDetail = lazy(() => import("./pages/OrcamentosDetail"));
const OrcamentosPublic = lazy(() => import("./pages/OrcamentosPublic"));
const ItensOrcamento = lazy(() => import("./pages/ItensOrcamento"));
const OrcamentosClienteForm = lazy(() => import("./pages/OrcamentosClienteForm"));
const GestaoClientes = lazy(() => import("./pages/GestaoClientes"));
const Fornecedores = lazy(() => import("./pages/Fornecedores"));
const FornecedorForm = lazy(() => import("./pages/FornecedorForm"));
const FornecedorDetalhes = lazy(() => import("./pages/FornecedorDetalhes"));
const InventarioEquipamentos = lazy(() => import("./pages/InventarioEquipamentos"));
const FormulariosRH = lazy(() => import("./pages/FormulariosRH"));
const FormularioDetalhes = lazy(() => import("./pages/FormularioDetalhes"));
const HRFlowPro = lazy(() => import("./pages/HRFlowPro"));
const Documentacoes = lazy(() => import("./pages/Documentacoes"));
const CursosAdmin = lazy(() => import("./pages/CursosAdmin"));
const SuporteFuncionarios = lazy(() => import("./pages/SuporteFuncionarios"));
const PortalCursoPlayerLazy = lazy(() => import("./components/ponto/PortalCursoPlayer").then(m => ({ default: m.PortalCursoPlayer })));

// Lazy loaded layout
const Layout = lazy(() => import("./components/Layout").then(m => ({ default: m.Layout })));
const GlobalFooter = lazy(() => import("./components/GlobalFooter").then(m => ({ default: m.GlobalFooter })));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="space-y-4 p-8">
    <Skeleton className="h-12 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);

const LazyLayout = ({ children }: { children: React.ReactNode }) => (
  <Suspense fallback={<PageLoader />}>
    <Layout>{children}</Layout>
  </Suspense>
);

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    const hasSeenSplash = sessionStorage.getItem('hasSeenSplash');
    return !hasSeenSplash;
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('hasSeenSplash', 'true');
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <QuotesProvider>
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/criar-admin" element={<CreateAdmin />} />
                    <Route path="/portal-funcionario" element={<PortalFuncionario />} />
                    <Route path="/portal-funcionario/cursos/:cursoId" element={<PortalCursoPlayerLazy />} />
                    <Route path="/public/:publicId" element={<OrcamentosPublic />} />
                    <Route
                      path="/"
                      element={
                        <ProtectedRoute>
                          <Navigate to="/dashboard" replace />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute>
                          <Dashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/gestao-rh"
                      element={
                        <ProtectedRoute>
                          <GestaoRH />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/funcionarios"
                      element={
                        <ProtectedRoute>
                          <LazyLayout>
                            <Funcionarios />
                          </LazyLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/banco-talentos"
                      element={
                        <ProtectedRoute>
                          <LazyLayout>
                            <BancoTalentos />
                          </LazyLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/relatorios"
                      element={
                        <ProtectedRoute>
                          <LazyLayout>
                            <Relatorios />
                          </LazyLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/folha-ponto"
                      element={
                        <ProtectedRoute>
                          <LazyLayout>
                            <FolhaPonto />
                          </LazyLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/holerites"
                      element={
                        <ProtectedRoute>
                          <LazyLayout>
                            <Holerites />
                          </LazyLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/admins"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <LazyLayout>
                            <GerenciarAdmins />
                          </LazyLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/controle-ferias"
                      element={
                        <ProtectedRoute>
                          <LazyLayout>
                            <ControleFerias />
                          </LazyLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/comunicados"
                      element={
                        <ProtectedRoute>
                          <LazyLayout>
                            <Comunicados />
                          </LazyLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/gestao-clientes"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <GestaoClientes />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orcamentos"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <OrcamentosDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orcamentos/lista"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <OrcamentosLista />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orcamentos/novo"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <OrcamentosBuilder />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orcamentos/:id"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <OrcamentosDetail />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orcamentos/:id/editar"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <OrcamentosBuilder />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orcamentos/itens"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <ItensOrcamento />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/orcamentos/clientes/novo"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <OrcamentosClienteForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fornecedores"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <Fornecedores />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fornecedores/novo"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <FornecedorForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fornecedores/:id"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <FornecedorDetalhes />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/fornecedores/:id/editar"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <FornecedorForm />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/inventario"
                      element={
                        <ProtectedRoute requiredRoles={["admin"]}>
                          <InventarioEquipamentos />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/formularios-rh"
                      element={
                        <ProtectedRoute>
                          <FormulariosRH />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/formularios-rh/:id"
                      element={
                        <ProtectedRoute>
                          <FormularioDetalhes />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/hrflow-pro"
                      element={
                        <ProtectedRoute>
                          <HRFlowPro />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/documentacoes"
                      element={
                        <ProtectedRoute>
                          <LazyLayout>
                            <Documentacoes />
                          </LazyLayout>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/cursos"
                      element={
                        <ProtectedRoute>
                          <CursosAdmin />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/suporte-funcionarios"
                      element={
                        <ProtectedRoute>
                          <SuporteFuncionarios />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </div>
              <Suspense fallback={null}>
                <GlobalFooter />
              </Suspense>
            </div>
          </QuotesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;