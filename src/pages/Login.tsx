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
import logoAtiva from "@/assets/logo-ativa-login.png";

const Login = () => {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "admin",
    password: "",
  });

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
    <div 
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-cover bg-center bg-no-repeat safe-bottom safe-top"
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
          <form onSubmit={handleLogin} className="space-y-4">
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
                className="h-10 sm:h-11 text-sm sm:text-base"
              />
            </div>
            <Button type="submit" className="w-full h-10 sm:h-11 text-sm sm:text-base" disabled={loading}>
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
