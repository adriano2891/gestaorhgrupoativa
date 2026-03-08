import { useNavigate } from "react-router-dom";
import logoAtiva from "@/assets/logo-ativa-3d.png";
import { Users, ShieldCheck } from "lucide-react";


const AppSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)" }}>
      {/* Logo */}
      <div className="mb-8 animate-fade-in">
        <img src={logoAtiva} alt="Grupo Ativa" className="w-40 md:w-52 h-auto drop-shadow-2xl" />
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-white mb-2 text-center">
        Bem-vindo ao AtivaRH
      </h1>
      <p className="text-white/60 text-sm md:text-base mb-10 text-center">
        Selecione como deseja acessar o sistema
      </p>

      {/* Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        {/* Funcionário */}
        <button
          onClick={() => navigate("/portal-funcionario")}
          className="flex-1 group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:bg-primary/20 hover:border-primary/50 hover:scale-105 hover:shadow-[0_0_40px_hsl(174_72%_56%/0.2)]"
        >
          <div className="w-16 h-16 rounded-full bg-[#3EE0CF]/20 flex items-center justify-center group-hover:bg-[#3EE0CF]/30 transition-colors">
            <Users className="w-8 h-8 text-[#3EE0CF]" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white mb-1">Sou Funcionário</h2>
            <p className="text-white/50 text-xs">Portal do colaborador</p>
          </div>
        </button>

        {/* Administrador */}
        <button
          onClick={() => navigate("/login")}
          className="flex-1 group relative bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 flex flex-col items-center gap-4 transition-all duration-300 hover:bg-amber-500/20 hover:border-amber-500/50 hover:scale-105 hover:shadow-[0_0_40px_rgba(245,158,11,0.2)]"
        >
          <div className="w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
            <ShieldCheck className="w-8 h-8 text-amber-400" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-bold text-white mb-1">Sou Administrador</h2>
            <p className="text-white/50 text-xs">Painel de gestão</p>
          </div>
        </button>
      </div>


      <p className="mt-auto pb-6 pt-10 text-white/30 text-xs">
        © {new Date().getFullYear()} Grupo Ativa — Todos os direitos reservados
      </p>
    </div>
  );
};

export default AppSelector;
