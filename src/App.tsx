import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";

const queryClient = new QueryClient();

import { Layout } from "./components/Layout";
import { AuthProvider } from "./components/auth/AuthProvider";
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/criar-admin" element={<CreateAdmin />} />
            <Route path="/portal-funcionario" element={<PortalFuncionario />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Index />
                  </Layout>
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
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
