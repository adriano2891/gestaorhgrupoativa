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
    const maxTimer = setTimeout(() => {
      setPreloaderFading(true);
      setTimeout(() => setShowPreloader(false), 600);
    }, 3400);

    const onLoad = () => {
      setPreloaderFading(true);
      setTimeout(() => setShowPreloader(false), 600);
    };

    if (document.readyState === "complete") {
      onLoad();
    } else {
      window.addEventListener("load", onLoad);
    }

    return () => {
      clearTimeout(maxTimer);
      window.removeEventListener("load", onLoad);
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
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-600 ${preloaderFading ? 'opacity-0' : 'opacity-100'}`}
          style={{
            backgroundImage: `url(${loginBackground})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <img
            src={logoAtiva}
            alt="Logo Grupo Ativa"
            className="w-36 sm:w-44 md:w-52 h-auto mb-8 animate-pulse"
            style={{ filter: 'drop-shadow(0 4px 20px rgba(30,180,170,0.35))' }}
          />
          <div className="flex items-center gap-2">
            <span className="preloader-dot" style={{ animationDelay: '0s' }} />
            <span className="preloader-dot" style={{ animationDelay: '0.2s' }} />
            <span className="preloader-dot" style={{ animationDelay: '0.4s' }} />
          </div>
          <style>{`
            .preloader-dot {
              width: 10px;
              height: 10px;
              border-radius: 50%;
              background: hsl(174, 72%, 56%);
              animation: preloader-bounce 1.2s ease-in-out infinite;
            }
            @keyframes preloader-bounce {
              0%, 80%, 100% { transform: scale(0.4); opacity: 0.4; }
              40% { transform: scale(1); opacity: 1; }
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
