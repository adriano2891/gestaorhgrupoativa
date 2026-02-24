import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SuperAdminAuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAuthorized: (adminId: string, adminName: string) => void;
  actionDescription?: string;
}

export const SuperAdminAuthDialog = ({
  open,
  onOpenChange,
  onAuthorized,
  actionDescription = "editar registros de ponto",
}: SuperAdminAuthDialogProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Preencha o email e a senha do Super Administrador");
      return;
    }

    setLoading(true);
    try {
      // Save current session
      const { data: currentSession } = await supabase.auth.getSession();
      const currentToken = currentSession?.session?.refresh_token;

      // Try to sign in as the super admin
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw new Error("Credenciais inválidas");
      }

      if (!authData.user) {
        throw new Error("Usuário não encontrado");
      }

      // Check if the user has admin role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleError || !roleData) {
        // Restore original session
        if (currentToken) {
          await supabase.auth.refreshSession({ refresh_token: currentToken });
        }
        throw new Error("Usuário não possui permissão de Super Administrador");
      }

      // Get admin name
      const { data: profileData } = await supabase
        .from("profiles")
        .select("nome")
        .eq("id", authData.user.id)
        .maybeSingle();

      const adminName = profileData?.nome || email;
      const adminId = authData.user.id;

      // Restore original session
      if (currentToken) {
        await supabase.auth.refreshSession({ refresh_token: currentToken });
      }

      toast.success(`Autorizado por: ${adminName}`);
      setEmail("");
      setPassword("");
      onOpenChange(false);
      onAuthorized(adminId, adminName);
    } catch (error: any) {
      toast.error(error.message || "Erro na autenticação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <DialogTitle>Autorização de Super Administrador</DialogTitle>
          </div>
          <DialogDescription>
            Para {actionDescription}, é necessário confirmar com a senha de um Super Administrador.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email do Super Administrador</Label>
            <Input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@sistema.com"
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Senha</Label>
            <Input
              id="admin-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Autorizar
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
