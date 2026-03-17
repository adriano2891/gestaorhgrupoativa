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
            backgroundImage: `url(${loginBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: preloaderFading ? 0 : 1,
            transition: 'opacity 0.7s ease-in-out',
          }}
        >
          {/* Logo with shine sweep */}
          <div className="relative mb-10 overflow-hidden rounded-2xl" style={{ padding: '8px' }}>
            <img
              src={logoAtiva}
              alt="Logo Grupo Ativa"
              className="w-40 sm:w-48 md:w-56 h-auto relative z-10"
              style={{
                filter: 'drop-shadow(0 4px 24px rgba(30,180,170,0.3))',
                animation: 'preloader-logo-breathe 2s ease-in-out infinite',
              }}
            />
            {/* Shine sweep overlay */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                borderRadius: '1rem',
                zIndex: 20,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '-20%',
                  left: '-60%',
                  width: '40%',
                  height: '140%',
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.08) 80%, transparent 100%)',
                  transform: 'skewX(-18deg)',
                  animation: 'preloader-shine 2.5s ease-in-out infinite',
                }}
              />
            </div>
          </div>

          {/* Loading bar */}
          <div
            style={{
              width: '180px',
              height: '3px',
              borderRadius: '2px',
              background: 'rgba(255,255,255,0.2)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: '40%',
                height: '100%',
                borderRadius: '2px',
                background: 'linear-gradient(90deg, hsl(174, 72%, 56%), hsl(174, 72%, 70%))',
                animation: 'preloader-bar 1.4s ease-in-out infinite',
              }}
            />
          </div>

          <p
            style={{
              marginTop: '16px',
              color: 'hsl(174, 40%, 25%)',
              fontSize: '13px',
              fontFamily: 'Arial, sans-serif',
              letterSpacing: '0.04em',
              opacity: 0.7,
            }}
          >
            Carregando sistema...
          </p>

          <style>{`
            @keyframes preloader-logo-breathe {
              0%, 100% { opacity: 0.85; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.02); }
            }
            @keyframes preloader-shine {
              0% { left: -60%; }
              100% { left: 120%; }
            }
            @keyframes preloader-bar {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(200%); }
              100% { transform: translateX(200%); }
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
                  onChange={(e) =>
                    setLoginData({ ...loginData, email: e.target.value })
                  }
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
                  onChange={(e) =>
                    setLoginData({ ...loginData, password: e.target.value })
                  }
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
