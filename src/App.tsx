import React from "react";
import { HashRouter, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { AuthProvider } from "./components/auth/AuthProvider";
import Dashboard from "./pages/Dashboard";
import { ArrowLeft } from "lucide-react";

// Generic Placeholder for inner pages
const ModulePlaceholder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const moduleName = location.pathname.substring(1).replace("-", " ").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
      >
        <ArrowLeft size={20} />
        Voltar ao Início
      </button>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 flex flex-col items-center justify-center h-[60vh]">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">{moduleName}</h1>
        <p className="text-gray-500">Este módulo está em desenvolvimento.</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/funcionarios" element={<ModulePlaceholder />} />
          <Route path="/banco-talentos" element={<ModulePlaceholder />} />
          <Route path="/relatorios" element={<ModulePlaceholder />} />
          <Route path="/folha-ponto" element={<ModulePlaceholder />} />
          <Route path="/holerites" element={<ModulePlaceholder />} />
          <Route path="/controle-ferias" element={<ModulePlaceholder />} />
          <Route path="/comunicados" element={<ModulePlaceholder />} />
          <Route path="/admins" element={<ModulePlaceholder />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
