import { useState } from "react";
import { usePortalAuth } from "./PortalAuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Clock, LogIn, Eye, EyeOff } from "lucide-react";
import loginBackground from "@/assets/login-background.png";
import logoPortal from "@/assets/logo-portal-funcionario.png";

export const LoginFuncionario = () => {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signInWithCPF } = usePortalAuth();

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 11) {
      return numbers
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return numbers.slice(0, 11);
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCPF(e.target.value);
    setCpf(formatted);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const cpfNumeros = cpf.replace(/\D/g, "");
      
      if (cpfNumeros.length !== 11) {
        toast.error("CPF inválido", {
          description: "Por favor, insira um CPF válido com 11 dígitos"
        });
        return;
      }

      await signInWithCPF(cpf, senha);
      
      toast.success("Login realizado com sucesso!", {
        description: "Bem-vindo ao Portal do Funcionário"
      });
    } catch (error: any) {
      console.error("Erro ao fazer login:", error);
      toast.error("Erro ao fazer login", {
        description: error.message || "Verifique suas credenciais e tente novamente"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <img 
            src={logoPortal} 
            alt="Logo Grupo Ativa" 
            className="w-52 md:w-64 h-auto mx-auto mb-4 object-contain"
          />
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Portal do Funcionário</h1>
          <p className="text-white/90 drop-shadow">Portal do Colaborador 360</p>
        </div>

        {/* Card de Login */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Fazer Login</CardTitle>
            <CardDescription>
              Entre com seu CPF e senha para acessar o sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF</Label>
                <Input
                  id="cpf"
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCPFChange}
                  maxLength={14}
                  required
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="senha">Senha</Label>
                <div className="relative">
                  <Input
                    id="senha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    required
                    className="text-lg pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full text-lg h-12"
                disabled={loading}
              >
                {loading ? (
                  "Entrando..."
                ) : (
                  <>
                    <LogIn className="mr-2 h-5 w-5" />
                    Entrar
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  className="text-sm text-primary hover:underline"
                  onClick={() => toast.info("Entre em contato com o RH para recuperar sua senha")}
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
