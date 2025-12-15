import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  FileText, 
  PlusCircle, 
  LayoutDashboard, 
  Menu, 
  X, 
  ChevronLeft,
  LogOut 
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
    <div className="min-h-screen" style={{ backgroundColor: '#3ee0cf' }}>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-white/20 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="p-2">
          <Menu className="w-6 h-6 text-zinc-700" />
        </button>
        <h1 className="text-lg font-semibold text-zinc-800">Gestão de Orçamentos</h1>
        <button onClick={() => navigate('/dashboard')} className="p-2">
          <ChevronLeft className="w-6 h-6 text-zinc-700" />
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
          "fixed top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-md border-r border-white/20 shadow-xl z-50 transition-transform duration-300",
          "lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold text-zinc-800">Orçamentos</h2>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-zinc-100 rounded"
            >
              <X className="w-5 h-5 text-zinc-600" />
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
                      ? "bg-[#006fee] text-white shadow-md" 
                      : "text-zinc-600 hover:bg-zinc-100"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-zinc-200">
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-all mb-2"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Voltar ao Dashboard</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
