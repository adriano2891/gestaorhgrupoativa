import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, User } from "lucide-react";
import { usePortalAuth } from "./PortalAuthProvider";
import { PortalBackground } from "./PortalBackground";

interface PortalPerfilProps {
  onBack: () => void;
}

export const PortalPerfil = ({ onBack }: PortalPerfilProps) => {
  const { profile } = usePortalAuth();

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
              <div className="flex items-center gap-3">
                <User className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Perfil do Funcionário</CardTitle>
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
                    <Input id="nome" defaultValue={profile?.nome} />
                  </div>
                  <div>
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" type="email" defaultValue={profile?.email} />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" defaultValue={profile?.cpf} disabled />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input id="telefone" placeholder="(00) 00000-0000" />
                  </div>
                  <div>
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input id="cargo" defaultValue={profile?.cargo} disabled />
                  </div>
                  <div>
                    <Label htmlFor="departamento">Departamento</Label>
                    <Input id="departamento" defaultValue={profile?.departamento} disabled />
                  </div>
                </div>
                <Button className="w-full">Salvar Alterações</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PortalBackground>
  );
};
