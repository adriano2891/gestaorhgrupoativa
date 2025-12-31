import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  FileText, 
  LayoutTemplate, 
  BarChart3, 
  Sparkles,
  Settings,
  ArrowLeft,
  Plus,
  Search,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HRFlowDashboard } from "@/components/hrflow/HRFlowDashboard";
import { HRFlowFormsList } from "@/components/hrflow/HRFlowFormsList";
import { HRFlowTemplates } from "@/components/hrflow/HRFlowTemplates";
import { HRFlowAnalytics } from "@/components/hrflow/HRFlowAnalytics";
import { HRFlowAI } from "@/components/hrflow/HRFlowAI";
import { HRFlowSettings } from "@/components/hrflow/HRFlowSettings";
import { cn } from "@/lib/utils";

type HRFlowTab = 'dashboard' | 'forms' | 'templates' | 'analytics' | 'ai' | 'settings';

const navItems = [
  { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'forms' as const, label: 'Meus Formulários', icon: FileText },
  { id: 'templates' as const, label: 'Templates', icon: LayoutTemplate },
  { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
  { id: 'ai' as const, label: 'Criar com IA', icon: Sparkles },
  { id: 'settings' as const, label: 'Configurações', icon: Settings },
];

const HRFlowPro = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HRFlowTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <HRFlowDashboard onNavigate={setActiveTab} />;
      case 'forms':
        return <HRFlowFormsList />;
      case 'templates':
        return <HRFlowTemplates />;
      case 'analytics':
        return <HRFlowAnalytics />;
      case 'ai':
        return <HRFlowAI />;
      case 'settings':
        return <HRFlowSettings />;
      default:
        return <HRFlowDashboard onNavigate={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 flex flex-col z-50 transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="animate-fade-in">
                <h1 className="font-bold text-gray-900">HRFlow Pro</h1>
                <p className="text-xs text-gray-500">Gestão de Formulários</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === item.id 
                  ? "bg-[#2563eb] text-white shadow-md shadow-blue-500/20" 
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", item.id === 'ai' && "text-amber-500")} />
              {!sidebarCollapsed && <span className="animate-fade-in">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => navigate("/gestao-rh")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && <span>Voltar</span>}
          </button>
          
          {/* LGPD Badge */}
          {!sidebarCollapsed && (
            <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200 animate-fade-in">
              <div className="flex items-center gap-2 text-green-700">
                <Shield className="w-4 h-4" />
                <span className="text-xs font-medium">Conformidade LGPD</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "flex-1 transition-all duration-300 min-h-screen",
          sidebarCollapsed ? "ml-16" : "ml-64"
        )}
      >
        <div className="p-6 max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Collapse Toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className={cn(
          "fixed top-4 z-50 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all duration-300",
          sidebarCollapsed ? "left-[52px]" : "left-[252px]"
        )}
      >
        <ArrowLeft className={cn("w-3 h-3 text-gray-600 transition-transform", sidebarCollapsed && "rotate-180")} />
      </button>
    </div>
  );
};

export default HRFlowPro;
