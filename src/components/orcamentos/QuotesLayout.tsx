import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BackButton } from '@/components/ui/back-button';
import { 
  FileText, 
  PlusCircle, 
  LayoutDashboard, 
  Menu, 
  X, 
  ChevronLeft,
  LogOut,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/auth/AuthProvider';

interface QuotesLayoutProps {
  children: ReactNode;
}

const navItems = [
  { path: '/orcamentos', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/orcamentos/lista', label: 'Orçamentos', icon: FileText },
  { path: '/orcamentos/novo', label: 'Novo Orçamento', icon: PlusCircle },
  { path: '/orcamentos/itens', label: 'Cadastrar Itens', icon: Package },
];

export function QuotesLayout({ children }: QuotesLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#3EE0CF] shadow-md px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6 text-black" />
        </button>
        <h1 className="text-lg font-semibold text-black">Gestão de Orçamentos</h1>
        <button onClick={() => navigate('/dashboard')} className="p-2">
          <ChevronLeft className="w-6 h-6 text-black" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-[#3EE0CF] shadow-xl z-50 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-black">Orçamentos</h2>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-black/10 rounded"
            >
              <X className="w-5 h-5 text-black" />
            </button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left",
                    isActive 
                      ? "bg-black text-white shadow-md" 
                      : "text-black hover:bg-black/10"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-bold">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6">
          <div className="mb-4">
            <BackButton to="/dashboard" label="Voltar ao Dashboard" variant="light" />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
