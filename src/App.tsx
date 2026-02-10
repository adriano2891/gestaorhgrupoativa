import React, { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./components/auth/AuthProvider";
import { QuotesProvider } from "./contexts/QuotesContext";
import SplashScreen from "./components/SplashScreen";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import GestaoRH from "./pages/GestaoRH";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Holerites from "./pages/Holerites";
import Funcionarios from "./pages/Funcionarios";
import BancoTalentos from "./pages/BancoTalentos";
import Relatorios from "./pages/Relatorios";
import FolhaPonto from "./pages/FolhaPonto";
import GerenciarAdmins from "./pages/GerenciarAdmins";
import PortalFuncionario from "./pages/PortalFuncionario";
import CreateAdmin from "./pages/CreateAdmin";
import ControleFerias from "./pages/ControleFerias";
import Comunicados from "./pages/Comunicados";
import OrcamentosDashboard from "./pages/OrcamentosDashboard";
import OrcamentosLista from "./pages/OrcamentosLista";
import OrcamentosBuilder from "./pages/OrcamentosBuilder";
import OrcamentosDetail from "./pages/OrcamentosDetail";
import OrcamentosPublic from "./pages/OrcamentosPublic";
import ItensOrcamento from "./pages/ItensOrcamento";
import OrcamentosClienteForm from "./pages/OrcamentosClienteForm";
import GestaoClientes from "./pages/GestaoClientes";
import Fornecedores from "./pages/Fornecedores";
import FornecedorForm from "./pages/FornecedorForm";
import FornecedorDetalhes from "./pages/FornecedorDetalhes";
import InventarioEquipamentos from "./pages/InventarioEquipamentos";
import FormulariosRH from "./pages/FormulariosRH";
import FormularioDetalhes from "./pages/FormularioDetalhes";
import HRFlowPro from "./pages/HRFlowPro";
import Documentacoes from "./pages/Documentacoes";
import CursosAdmin from "./pages/CursosAdmin";
import SuporteFuncionarios from "./pages/SuporteFuncionarios";
import { PortalCursoPlayer } from "./components/ponto/PortalCursoPlayer";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(() => {
    // Only show splash once per session
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
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/criar-admin" element={<CreateAdmin />} />
              <Route path="/portal-funcionario" element={<PortalFuncionario />} />
              <Route path="/portal-funcionario/cursos/:cursoId" element={<PortalCursoPlayer />} />
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
                    <Layout>
                      <Funcionarios />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/banco-talentos"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <BancoTalentos />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/relatorios"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Relatorios />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/folha-ponto"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <FolhaPonto />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/holerites"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Holerites />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admins"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <GerenciarAdmins />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/controle-ferias"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <ControleFerias />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/comunicados"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Comunicados />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Gestão de Clientes Route */}
              <Route
                path="/gestao-clientes"
                element={
                  <ProtectedRoute>
                    <GestaoClientes />
                  </ProtectedRoute>
                }
              />
              {/* Orçamentos Routes */}
              <Route
                path="/orcamentos"
                element={
                  <ProtectedRoute>
                    <OrcamentosDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orcamentos/lista"
                element={
                  <ProtectedRoute>
                    <OrcamentosLista />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orcamentos/novo"
                element={
                  <ProtectedRoute>
                    <OrcamentosBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orcamentos/:id"
                element={
                  <ProtectedRoute>
                    <OrcamentosDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orcamentos/:id/editar"
                element={
                  <ProtectedRoute>
                    <OrcamentosBuilder />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orcamentos/itens"
                element={
                  <ProtectedRoute>
                    <ItensOrcamento />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/orcamentos/clientes/novo"
                element={
                  <ProtectedRoute>
                    <OrcamentosClienteForm />
                  </ProtectedRoute>
                }
              />
              {/* Fornecedores Routes */}
              <Route
                path="/fornecedores"
                element={
                  <ProtectedRoute>
                    <Fornecedores />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fornecedores/novo"
                element={
                  <ProtectedRoute>
                    <FornecedorForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fornecedores/:id"
                element={
                  <ProtectedRoute>
                    <FornecedorDetalhes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fornecedores/:id/editar"
                element={
                  <ProtectedRoute>
                    <FornecedorForm />
                  </ProtectedRoute>
                }
              />
              {/* Inventário de Equipamentos Route */}
              <Route
                path="/inventario"
                element={
                  <ProtectedRoute>
                    <InventarioEquipamentos />
                  </ProtectedRoute>
                }
              />
              {/* Formulários RH Routes */}
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
              {/* HRFlow Pro Route */}
              <Route
                path="/hrflow-pro"
                element={
                  <ProtectedRoute>
                    <HRFlowPro />
                  </ProtectedRoute>
                }
              />
              {/* Documentações Route */}
              <Route
                path="/documentacoes"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Documentacoes />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Cursos Admin Route */}
              <Route
                path="/cursos"
                element={
                  <ProtectedRoute>
                    <CursosAdmin />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </QuotesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
