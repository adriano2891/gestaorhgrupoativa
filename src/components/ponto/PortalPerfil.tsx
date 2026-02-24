import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, User, Loader2, Camera, Upload } from "lucide-react";
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
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setNome(profile.nome || "");
      setEmail(profile.email || "");
      setTelefone(profile.telefone || "");
      setEndereco((profile as any).endereco || "");
      // Fetch foto_url
      const fetchFoto = async () => {
        if (user) {
          const { data } = await supabase.from("profiles").select("foto_url").eq("id", user.id).maybeSingle() as { data: any };
          if (data?.foto_url) setFotoUrl(data.foto_url);
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
    
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/foto.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('fotos-funcionarios')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      toast.error("Erro ao fazer upload da foto.");
      return;
    }
    
    const { data: urlData } = supabase.storage
      .from('fotos-funcionarios')
      .getPublicUrl(filePath);
    
    const newUrl = urlData.publicUrl + '?t=' + Date.now();
    await supabase.from("profiles").update({ foto_url: newUrl } as any).eq("id", user.id);
    setFotoUrl(newUrl);
    toast.success("Foto atualizada!");
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          nome: nome.trim(),
          email: email.trim(),
          telefone: telefone.trim(),
          endereco: endereco.trim(),
        })
        .eq("id", user.id);

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
                <div className="relative group cursor-pointer" onClick={() => photoRef.current?.click()}>
                  <Avatar className="h-16 w-16 border-2 border-primary/20">
                    {fotoUrl ? <AvatarImage src={fotoUrl} alt={nome} /> : null}
                    <AvatarFallback className="bg-primary/10">
                      <User className="h-8 w-8 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="h-5 w-5 text-white" />
                  </div>
                  <input
                    ref={photoRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoUpload(file);
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
