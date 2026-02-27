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
import { toast } from "sonner";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

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
      // Authenticate via REST (does NOT affect current session)
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!authRes.ok) {
        const errBody = await authRes.json().catch(() => ({}));
        throw new Error(errBody.error_description || errBody.msg || "Credenciais inválidas");
      }

      const authData = await authRes.json();
      const adminToken = authData.access_token;
      const adminUserId = authData.user?.id;

      if (!adminUserId || !adminToken) {
        throw new Error("Usuário não encontrado");
      }

      // Check admin role via REST using the admin's own token
      const roleRes = await fetch(
        `${SUPABASE_URL}/rest/v1/user_roles?select=role&user_id=eq.${adminUserId}&role=eq.admin&limit=1`,
        {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      );

      if (!roleRes.ok) throw new Error("Erro ao verificar permissões");
      const roles = await roleRes.json();

      if (!roles || roles.length === 0) {
        throw new Error("Usuário não possui permissão de Super Administrador");
      }

      // Get admin name via REST
      let adminName = email;
      try {
        const profileRes = await fetch(
          `${SUPABASE_URL}/rest/v1/profiles?select=nome&id=eq.${adminUserId}&limit=1`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${adminToken}`,
            },
          }
        );

        if (profileRes.ok) {
          const profiles = await profileRes.json();
          if (profiles?.[0]?.nome) adminName = profiles[0].nome;
        }
      } catch {
        // ignore profile fetch errors, use email as name
      }

      toast.success(`Autorizado por: ${adminName}`);
      const savedAdminId = adminUserId;
      const savedAdminName = adminName;
      setEmail("");
      setPassword("");
      setLoading(false);
      onOpenChange(false);
      // Call onAuthorized after state updates
      setTimeout(() => onAuthorized(savedAdminId, savedAdminName), 50);
    } catch (error: any) {
      console.error("SuperAdmin auth error:", error);
      toast.error(error.message || "Erro na autenticação");
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
