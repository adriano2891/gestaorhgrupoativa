import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Cake, PartyPopper, Gift } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface BirthdayPopupProps {
  nome: string;
  dataNascimento: string | null;
}

export const BirthdayPopup = ({ nome, dataNascimento }: BirthdayPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!dataNascimento) return;

    const today = new Date();
    const birthDate = new Date(dataNascimento);
    
    // Verificar se hoje é o aniversário (mesmo dia e mês)
    const isBirthday = 
      today.getDate() === birthDate.getDate() && 
      today.getMonth() === birthDate.getMonth();

    if (!isBirthday) return;

    // Verificar se já foi exibido hoje
    const storageKey = `birthday_popup_${today.toISOString().split('T')[0]}`;
    const alreadyShown = localStorage.getItem(storageKey);

    if (alreadyShown) return;

    // Exibir popup e marcar como exibido
    setIsOpen(true);
    localStorage.setItem(storageKey, 'true');
  }, [dataNascimento]);

  const handleClose = () => {
    setIsOpen(false);
  };

  // Extrair primeiro nome
  const primeiroNome = nome.split(' ')[0];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md border-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 overflow-hidden">
        {/* Decoração de fundo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br from-yellow-300/20 to-orange-300/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-br from-pink-300/20 to-purple-300/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 text-center py-4">
          {/* Ícones decorativos */}
          <div className="flex justify-center items-center gap-3 mb-4">
            <PartyPopper className="h-8 w-8 text-yellow-500 animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
              <Cake className="h-8 w-8 text-primary-foreground" />
            </div>
            <Gift className="h-8 w-8 text-pink-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          </div>

          <DialogTitle className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            🎉 Feliz Aniversário, {primeiroNome}!
          </DialogTitle>

          <DialogDescription asChild>
            <div className="space-y-4">
              {isMobile ? (
                // Versão mobile - mensagem curta
                <p className="text-base text-muted-foreground leading-relaxed">
                  O <span className="font-semibold text-primary">GRUPO ATIVA</span> deseja um dia especial e um novo ano cheio de conquistas! 🎂
                </p>
              ) : (
                // Versão desktop - mensagem completa
                <>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Hoje é um dia especial e queremos parabenizar você por mais um ano de vida.
                  </p>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    Agradecemos por fazer parte do <span className="font-semibold text-primary">GRUPO ATIVA</span> e desejamos um novo ciclo com saúde, conquistas e sucesso.
                  </p>
                  <p className="text-lg font-medium text-foreground">
                    Conte sempre conosco! 🎂🎈
                  </p>
                </>
              )}
            </div>
          </DialogDescription>

          <Button 
            onClick={handleClose}
            className="mt-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-8 py-2 rounded-full shadow-lg transition-all hover:scale-105"
          >
            {isMobile ? "Obrigado(a)!" : "Obrigado(a)! 🎉"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
