import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Lock, Eye, EyeOff, Check, X, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import loginBackground from "@/assets/login-background.png";
import logoAtiva from "@/assets/logo-ativa-login.png";

interface TrocarSenhaObrigatoriaProps {
  userId: string;
  nomeUsuario: string;
  onPasswordChanged: () => void;
}

const COMMON_PASSWORDS = [
  "12345678", "password", "123456789", "qwerty123", "abc12345",
  "senha123", "mudar123", "trocar123", "empresa1", "funcionario",
];

const validatePassword = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    notCommon: !COMMON_PASSWORDS.includes(password.toLowerCase()),
  };
};

export const TrocarSenhaObrigatoria = ({ userId, nomeUsuario, onPasswordChanged }: TrocarSenhaObrigatoriaProps) => {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const validation = validatePassword(novaSenha);
  const allValid = Object.values(validation).every(Boolean);
  const passwordsMatch = novaSenha === confirmarSenha && confirmarSenha.length > 0;

  const strength = Object.values(validation).filter(Boolean).length;
  const strengthPercent = (strength / 6) * 100;
  const strengthColor = strengthPercent <= 33 ? "bg-destructive" : strengthPercent <= 66 ? "bg-yellow-500" : "bg-green-500";
  const strengthLabel = strengthPercent <= 33 ? "Fraca" : strengthPercent <= 66 ? "Média" : "Forte";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!allValid) {
      toast.error("A senha não atende todos os requisitos.");
      return;
    }
    if (!passwordsMatch) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password: novaSenha });
      if (updateError) throw updateError;

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ deve_trocar_senha: false } as any)
        .eq("id", userId);
      if (profileError) throw profileError;

      toast.success("Senha alterada com sucesso!");
      onPasswordChanged();
    } catch (error: any) {
      console.error("Erro ao trocar senha:", error);
      toast.error(error.message || "Erro ao alterar a senha.");
    } finally {
      setLoading(false);
    }
  };

  const RequirementItem = ({ met, label }: { met: boolean; label: string }) => (
    <div className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="h-4 w-4 text-green-500 shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground shrink-0" />
      )}
      <span className={met ? "text-green-600" : "text-muted-foreground"}>{label}</span>
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-6">
          <img src={logoAtiva} alt="Logo Grupo Ativa" className="w-40 md:w-48 h-auto mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white drop-shadow-lg">Troca de Senha Obrigatória</h1>
          <p className="text-white/90 text-sm drop-shadow">
            Olá, {nomeUsuario}! Por segurança, altere sua senha no primeiro acesso.
          </p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Nova Senha</CardTitle>
                <CardDescription>Crie uma senha segura para sua conta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="novaSenha">Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="novaSenha"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua nova senha"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {novaSenha.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Força da senha</span>
                    <span className={`font-medium ${strengthPercent <= 33 ? "text-destructive" : strengthPercent <= 66 ? "text-yellow-600" : "text-green-600"}`}>
                      {strengthLabel}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full transition-all duration-300 rounded-full ${strengthColor}`} style={{ width: `${strengthPercent}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmarSenha"
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmarSenha.length > 0 && !passwordsMatch && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>

              {novaSenha.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-medium text-foreground mb-2">Requisitos da senha:</p>
                  <RequirementItem met={validation.minLength} label="Mínimo de 8 caracteres" />
                  <RequirementItem met={validation.hasUppercase} label="Pelo menos uma letra maiúscula" />
                  <RequirementItem met={validation.hasLowercase} label="Pelo menos uma letra minúscula" />
                  <RequirementItem met={validation.hasNumber} label="Pelo menos um número" />
                  <RequirementItem met={validation.hasSpecial} label="Pelo menos um caractere especial" />
                  <RequirementItem met={validation.notCommon} label="Não pode ser uma senha comum" />
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 text-lg"
                disabled={loading || !allValid || !passwordsMatch}
              >
                {loading ? "Alterando..." : "Alterar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-white/80 text-xs mt-6 drop-shadow">
          © {new Date().getFullYear()} Grupo Ativa • Todos os direitos reservados
        </p>
      </div>
    </div>
  );
};
