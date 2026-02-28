import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Loader2, Camera } from "lucide-react";
import { usePortalAuth } from "./PortalAuthProvider";
import { PortalBackground } from "./PortalBackground";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

interface PortalPerfilProps {
  onBack: () => void;
}

const getRestConfig = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
  const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID || supabaseUrl.match(/\/\/([^.]+)/)?.[1];
  const storageKey = `sb-${projectRef}-auth-token`;
  let token = anonKey;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      token = parsed?.access_token || parsed?.currentSession?.access_token || parsed?.session?.access_token || anonKey;
    }
  } catch {}
  return {
    url: supabaseUrl,
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };
};

const restPost = async (path: string, body: any) => {
  const { url, headers } = getRestConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`REST POST failed: ${res.status}`);
};

const restPatch = async (path: string, body: any) => {
  const { url, headers } = getRestConfig();
  const res = await fetch(`${url}/rest/v1/${path}`, {
    method: 'PATCH',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`REST PATCH failed: ${res.status}`);
  const data = await res.json();
  if (!data || data.length === 0) {
    throw new Error('Nenhum registro atualizado. Verifique suas permissões.');
  }
  return data;
};

// Campos permitidos para edição pelo funcionário
const CAMPOS_PERMITIDOS = ['nome', 'email', 'telefone', 'endereco'] as const;
const CAMPO_LABELS: Record<string, string> = {
  nome: 'Nome Completo',
  email: 'E-mail',
  telefone: 'Telefone',
  endereco: 'Endereço',
};

const perfilUpdateSchema = z.object({
  nome: z.string().trim().min(2, "Informe um nome válido.").max(100, "Nome muito longo."),
  email: z.string().trim().email("Informe um e-mail válido.").max(255, "E-mail muito longo."),
  telefone: z.string().trim().min(8, "Informe um telefone válido.").max(20, "Telefone muito longo."),
  endereco: z.string().trim().min(5, "Informe um endereço válido.").max(255, "Endereço muito longo."),
});

export const PortalPerfil = ({ onBack }: PortalPerfilProps) => {
  const { profile, user, refreshProfile } = usePortalAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  // Store original values for change detection
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      const origNome = profile.nome || "";
      const origEmail = profile.email || "";
      const origTelefone = profile.telefone || "";
      const origEndereco = profile.endereco || "";

      setNome(origNome);
      setEmail(origEmail);
      setTelefone(origTelefone);
      setEndereco(origEndereco);
      setOriginalValues({ nome: origNome, email: origEmail, telefone: origTelefone, endereco: origEndereco });

      // Fetch foto via signed URL
      const fetchFoto = async () => {
        const userId = user?.id || profile?.id;
        if (!userId) return;
        try {
          const { data } = await supabase.from("profiles").select("foto_url").eq("id", userId).maybeSingle() as { data: any };
          if (data?.foto_url) {
            const pathMatch = data.foto_url.match(/fotos-funcionarios\/(.+?)(\?|$)/);
            const storagePath = pathMatch ? pathMatch[1] : `${userId}/foto.jpg`;
            const { data: signedData } = await supabase.storage.from('fotos-funcionarios').createSignedUrl(storagePath, 3600);
            if (signedData?.signedUrl) {
              setFotoUrl(signedData.signedUrl);
            }
          }
        } catch (e) {
          console.error("Erro ao buscar foto:", e);
        }
      };
      fetchFoto();
    }
  }, [profile, user]);

  const handlePhotoUpload = async (file: File) => {
    if (!user) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Use JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 2MB.");
      return;
    }

    setUploadingPhoto(true);

    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `${user.id}/foto.${ext}`;

      const localPreview = URL.createObjectURL(file);
      setFotoUrl(localPreview);

      const { error: uploadError } = await supabase.storage
        .from('fotos-funcionarios')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        toast.error("Erro ao fazer upload da foto.");
        setFotoUrl(null);
        return;
      }

      const storedUrl = `fotos-funcionarios/${filePath}`;
      await supabase.from("profiles").update({ foto_url: storedUrl } as any).eq("id", user.id);

      const { data: signedData } = await supabase.storage.from('fotos-funcionarios').createSignedUrl(filePath, 3600);
      if (signedData?.signedUrl) {
        setFotoUrl(signedData.signedUrl);
      }

      toast.success("Foto atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar foto:", error);
      toast.error("Erro ao atualizar foto.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    const userId = user?.id;
    if (!userId) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }
    setSaving(true);
    try {
      const parsed = perfilUpdateSchema.safeParse({
        nome,
        email,
        telefone,
        endereco,
      });

      if (!parsed.success) {
        toast.error(parsed.error.issues[0]?.message || "Dados inválidos.");
        setSaving(false);
        return;
      }

      const currentValues: Record<(typeof CAMPOS_PERMITIDOS)[number], string> = {
        nome: parsed.data.nome,
        email: parsed.data.email,
        telefone: parsed.data.telefone,
        endereco: parsed.data.endereco,
      };

      // Detect changed fields
      const changedFields: { campo: string; valor_anterior: string; valor_novo: string }[] = [];
      for (const campo of CAMPOS_PERMITIDOS) {
        if (currentValues[campo] !== originalValues[campo]) {
          changedFields.push({
            campo,
            valor_anterior: originalValues[campo] || '',
            valor_novo: currentValues[campo] || '',
          });
        }
      }

      if (changedFields.length === 0) {
        toast.info("Nenhuma alteração detectada.");
        setSaving(false);
        return;
      }

      // Update profile with tracking metadata
      await restPatch(`profiles?id=eq.${userId}`, {
        nome: currentValues.nome,
        email: currentValues.email,
        telefone: currentValues.telefone,
        endereco: currentValues.endereco,
        perfil_updated_at: new Date().toISOString(),
        perfil_updated_by: 'funcionario',
      });

      // Log each changed field
      await Promise.all(
        changedFields.map((change) =>
          restPost('log_alteracoes_perfil', {
            user_id: userId,
            campo: change.campo,
            valor_anterior: change.valor_anterior,
            valor_novo: change.valor_novo,
            origem: 'funcionario',
          })
        )
      );

      // Update original values to current
      setOriginalValues({ ...currentValues });

      // Refresh profile in context so data persists across navigation
      await refreshProfile();

      toast.success("Dados atualizados com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast.error(error.message || "Erro ao salvar alterações");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PortalBackground>
      <header className="bg-card border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <div className="relative group cursor-pointer" onClick={() => !uploadingPhoto && photoRef.current?.click()}>
                  <Avatar className="h-20 w-20 border-3 border-primary/30 shadow-lg">
                    {fotoUrl ? <AvatarImage src={fotoUrl} alt={nome} className="object-cover" /> : null}
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-10 w-10 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {uploadingPhoto ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
                      e.target.value = '';
                    }}
                  />
                </div>
                <div>
                  <CardTitle className="text-2xl">Perfil do Funcionário</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Clique na foto para alterar</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Atualize suas informações pessoais
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input id="nome" value={nome} onChange={(e) => setNome(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" defaultValue={profile?.cpf || ""} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input id="cargo" defaultValue={profile?.cargo || ""} disabled className="bg-muted" />
                  </div>
                  <div>
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input id="departamento" defaultValue={profile?.departamento || ""} disabled className="bg-muted" />
                   </div>
                 </div>
                 <div>
                   <Label htmlFor="endereco">Endereço</Label>
                   <Input
                     id="endereco"
                     placeholder="Rua, número, bairro, cidade - UF"
                     value={endereco}
                     onChange={(e) => setEndereco(e.target.value)}
                   />
                 </div>
                <Button className="w-full" onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Salvar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PortalBackground>
  );
};
