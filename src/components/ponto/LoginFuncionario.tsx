import { useState } from "react";
import { usePortalAuth } from "./PortalAuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Clock, LogIn, Eye, EyeOff } from "lucide-react";
import loginBackground from "@/assets/login-background.png";
import logoPortal from "@/assets/logo-portal-funcionario-new.png";
import { EsqueciSenhaDialog } from "./EsqueciSenhaDialog";


export const LoginFuncionario = () => {
  const [cpf, setCpf] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [esqueciSenhaOpen, setEsqueciSenhaOpen] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);
  const [termosOpen, setTermosOpen] = useState(false);
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

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="termos"
                  checked={aceitouTermos}
                  onCheckedChange={(checked) => setAceitouTermos(checked === true)}
                  className="mt-0.5"
                />
                <label htmlFor="termos" className="text-sm leading-snug text-muted-foreground cursor-pointer select-none">
                  Li e aceito os{" "}
                  <button
                    type="button"
                    className="text-primary font-medium hover:underline"
                    onClick={(e) => { e.preventDefault(); setTermosOpen(true); }}
                  >
                    Termos de Uso da Plataforma
                  </button>
                </label>
              </div>

              <Button 
                type="submit" 
                className="w-full text-lg h-12"
                disabled={loading || !aceitouTermos}
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
                  onClick={() => setEsqueciSenhaOpen(true)}
                >
                  Esqueci minha senha
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <EsqueciSenhaDialog open={esqueciSenhaOpen} onOpenChange={setEsqueciSenhaOpen} />

        {/* Modal Termos de Uso */}
        <Dialog open={termosOpen} onOpenChange={setTermosOpen}>
          <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] p-0">
            <DialogHeader className="p-4 sm:p-6 pb-0">
              <DialogTitle className="text-lg sm:text-xl">Termos de Uso – Portal do Funcionário</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">Última atualização: 04/03/2026</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] px-4 sm:px-6 pb-4 sm:pb-6">
              <div className="space-y-4 text-sm leading-relaxed text-muted-foreground pr-2">
                <section>
                  <h3 className="font-semibold text-foreground mb-1">1. Aceitação dos Termos</h3>
                  <p>Ao acessar e utilizar o Portal do Funcionário, o usuário declara ter lido, compreendido e concordado integralmente com estes Termos de Uso.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-1">2. Finalidade da Plataforma</h3>
                  <p>O portal tem como objetivo disponibilizar ao colaborador acesso a informações funcionais, tais como:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-0.5">
                    <li>Dados cadastrais</li>
                    <li>Holerites</li>
                    <li>Relatórios internos</li>
                    <li>Comunicados</li>
                    <li>Solicitações administrativas</li>
                  </ul>
                  <p className="mt-1">O uso é exclusivo para fins profissionais relacionados à empresa.</p>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-1">3. Acesso e Credenciais</h3>
                  <ul className="list-disc pl-5 space-y-0.5">
                    <li>O acesso é individual e intransferível.</li>
                    <li>O usuário é responsável pela confidencialidade de sua senha.</li>
                    <li>É proibido compartilhar credenciais com terceiros.</li>
                    <li>Em caso de suspeita de uso indevido, o colaborador deve comunicar imediatamente a administração.</li>
                  </ul>
                </section>
                <section>
                  <h3 className="font-semibold text-foreground mb-1">4. Proteção de Dados</h3>
                  <p>Os dados pessoais tratados na plataforma seguem as diretrizes da Lei Geral de Proteção de Dados Pessoais (LGPD – Lei nº 13.709/2018). A empresa se compromete a tratar os dados de forma transparente, segura e para finalidades legítimas.</p>
                </section>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
};
