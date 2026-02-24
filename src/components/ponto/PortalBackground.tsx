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
      <div className="min-h-screen bg-background/85 backdrop-blur-[2px]" style={{ fontFamily: "Arial, Helvetica, sans-serif" }}>
        {children}
      </div>
    </div>
  );
};
