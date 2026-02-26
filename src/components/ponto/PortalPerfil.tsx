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

interface PortalPerfilProps {
  onBack: () => void;
}

export const PortalPerfil = ({ onBack }: PortalPerfilProps) => {
  const { profile, user } = usePortalAuth();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [fotoUrl, setFotoUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || "");
      setEmail(profile.email || "");
      setTelefone(profile.telefone || "");
      setEndereco((profile as any).endereco || "");
      // Fetch foto via signed URL
      const fetchFoto = async () => {
        const userId = user?.id || profile?.id;
        if (!userId) return;
        try {
          const { data } = await supabase.from("profiles").select("foto_url").eq("id", userId).maybeSingle() as { data: any };
          if (data?.foto_url) {
            // Extract path from stored URL or use as path directly
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

      // Show instant preview via local URL
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

      // Store the path reference in profile
      const storedUrl = `fotos-funcionarios/${filePath}`;
      await supabase.from("profiles").update({ foto_url: storedUrl } as any).eq("id", user.id);

      // Get signed URL for display
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
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id || user?.id;
    if (!userId) { setSaving(false); return; }
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
          endereco: endereco.trim(),
        })
        .eq("id", userId);

      if (error) throw error;

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
                    <Input
                      id="nome"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      defaultValue={profile?.cpf || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      placeholder="(00) 00000-0000"
                      value={telefone}
                      onChange={(e) => setTelefone(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      defaultValue={profile?.cargo || ""}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  <div>
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input
                      id="departamento"
                      defaultValue={profile?.departamento || ""}
                      disabled
                      className="bg-muted"
                    />
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
