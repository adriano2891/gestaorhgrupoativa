import loginBackground from "@/assets/login-background.png";

interface PortalBackgroundProps {
  children: React.ReactNode;
}

export const PortalBackground = ({ children }: PortalBackgroundProps) => {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat bg-fixed"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="min-h-screen flex flex-col bg-background/85 backdrop-blur-[2px]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        <div className="flex-1">{children}</div>
        <footer className="py-3 text-center text-[10px] sm:text-xs text-muted-foreground">
          © 2025 Grupo Ativa • Todos os direitos reservados
        </footer>
      </div>
    </div>
  );
};
