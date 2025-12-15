import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./components/auth/AuthProvider";
import { QuotesProvider } from "./contexts/QuotesContext";
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

const queryClient = new QueryClient();

const App = () => (
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
              <Route path="*" element={<NotFound />} />
            </Routes>
          </QuotesProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
