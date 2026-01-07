import { useState, useEffect } from "react";
import { 
  FileText, 
  LayoutTemplate, 
  Sparkles,
  Settings,
  ArrowLeft,
  Shield
} from "lucide-react";
import iconFormulariosNew from "@/assets/icon-formularios-new.png";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { HRFlowFormsList } from "@/components/hrflow/HRFlowFormsList";
import { HRFlowTemplates } from "@/components/hrflow/HRFlowTemplates";
import { HRFlowAI } from "@/components/hrflow/HRFlowAI";
import { HRFlowSettings } from "@/components/hrflow/HRFlowSettings";
import { cn } from "@/lib/utils";

type HRFlowTab = 'forms' | 'templates' | 'ai' | 'settings';

const navItems = [
  { id: 'forms' as const, label: 'Meus Formulários', icon: FileText },
  { id: 'templates' as const, label: 'Templates', icon: LayoutTemplate },
  { id: 'ai' as const, label: 'Criar com IA', icon: Sparkles },
  { id: 'settings' as const, label: 'Configurações', icon: Settings },
];

const HRFlowPro = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<HRFlowTab>('forms');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'forms':
        return <HRFlowFormsList />;
      case 'templates':
        return <HRFlowTemplates />;
      case 'ai':
        return <HRFlowAI />;
      case 'settings':
        return <HRFlowSettings />;
      default:
        return <HRFlowFormsList />;
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
            <img 
              src={iconFormulariosNew} 
              alt="HRFlow Pro" 
              className="w-10 h-10 object-contain flex-shrink-0"
            />
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
          <BackButton 
            to="/gestao-rh" 
            label={sidebarCollapsed ? "" : "Voltar"}
            className="w-full justify-start px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100"
          />
          
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
