import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import loginBackground from "@/assets/login-background.png";
import logoAtiva from "@/assets/logo-login-adm.png";

const Login = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPreloader, setShowPreloader] = useState(true);
  const [preloaderFading, setPreloaderFading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "admin",
    password: "",
  });

  useEffect(() => {
    // Always show preloader for a minimum of 2.5s, max 4s
    const fadeOut = () => {
      setPreloaderFading(true);
      setTimeout(() => setShowPreloader(false), 700);
    };

    const minTimer = setTimeout(() => {
      fadeOut();
    }, 2500);

    // Hard max at 4s
    const maxTimer = setTimeout(() => {
      fadeOut();
    }, 4000);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signIn(loginData.email, loginData.password);
      toast.success("Login realizado com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showPreloader && (
        <div
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, hsl(174, 60%, 90%) 0%, hsl(174, 50%, 95%) 40%, hsl(0, 0%, 100%) 100%)',
            opacity: preloaderFading ? 0 : 1,
            transition: 'opacity 0.8s ease-in-out',
          }}
        >
          <img
            src={logoAtiva}
            alt="Logo Grupo Ativa"
            className="w-36 sm:w-44 md:w-52 h-auto"
            style={{
              animation: 'pl-fade-in 0.6s ease-out forwards, pl-breathe 2.5s ease-in-out 0.6s infinite',
              opacity: 0,
            }}
          />

          {/* Spinner circular */}
          <div style={{ marginTop: '32px' }}>
            <svg width="36" height="36" viewBox="0 0 36 36" style={{ animation: 'pl-rotate 1.2s linear infinite' }}>
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="hsl(174, 50%, 88%)"
                strokeWidth="2.5"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="hsl(174, 72%, 50%)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="70 30"
                style={{ animation: 'pl-dash 1.2s ease-in-out infinite' }}
              />
            </svg>
          </div>

          <style>{`
            @keyframes pl-fade-in {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes pl-breathe {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.03); }
            }
            @keyframes pl-rotate {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            @keyframes pl-dash {
              0% { stroke-dasharray: 10 90; }
              50% { stroke-dasharray: 70 30; }
              100% { stroke-dasharray: 10 90; }
            }
          `}</style>
        </div>
      )}
      <div
        className="min-h-screen w-full overflow-y-auto bg-cover bg-center bg-no-repeat bg-scroll md:bg-fixed p-4 sm:p-6 lg:p-8 safe-bottom safe-top flex flex-col items-center justify-start sm:justify-center"
        style={{ backgroundImage: `url(${loginBackground})` }}
      >
        <Card className="w-full max-w-[95%] sm:max-w-md">
          <CardHeader className="text-center space-y-2 p-4 sm:p-6">
            <img
              src={logoAtiva}
              alt="Logo Grupo Ativa"
              className="w-32 sm:w-40 md:w-48 h-auto mx-auto mb-2 sm:mb-4"
            />
            <CardTitle className="text-xl sm:text-2xl font-bold">Bem-vindo</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              Insira suas credenciais para acessar o sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0">
            <form onSubmit={handleLogin} className="space-y-4" aria-label="Formulário de login">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-sm sm:text-base">Usuário</Label>
                <Input
                  id="login-email"
                  type="text"
                  placeholder="admin"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  required
                  autoComplete="username"
                  aria-required="true"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-sm sm:text-base">Senha</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  aria-required="true"
                  className="h-10 sm:h-11 text-sm sm:text-base"
                />
              </div>
              <Button type="submit" className="w-full h-11 sm:h-12 text-sm sm:text-base touch-target" disabled={loading}>
                <LogIn className="mr-2 h-4 w-4" aria-hidden="true" />
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default Login;
