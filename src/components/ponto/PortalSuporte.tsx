import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { PortalBackground } from "./PortalBackground";

interface PortalSuporteProps {
  onBack: () => void;
}

export const PortalSuporte = ({ onBack }: PortalSuporteProps) => {
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
                <MessageCircle className="h-8 w-8 text-primary" />
                <CardTitle className="text-2xl">Suporte / Contato RH</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Envie suas dúvidas ou solicitações para o RH
              </p>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="assunto">Assunto</Label>
                  <Input id="assunto" placeholder="Digite o assunto da sua mensagem" />
                </div>
                <div>
                  <Label htmlFor="mensagem">Mensagem</Label>
                  <Textarea
                    id="mensagem"
                    placeholder="Descreva sua dúvida ou solicitação..."
                    className="min-h-[150px]"
                  />
                </div>
                <Button className="w-full">Enviar Mensagem</Button>
              </div>
              
              <div className="mt-8 p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Canais de Contato</p>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>📧 Email: rh@empresa.com.br</p>
                  <p>📞 Telefone: (11) 3000-0000</p>
                  <p>🕐 Horário de Atendimento: Seg-Sex, 9h às 18h</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </PortalBackground>
  );
};
