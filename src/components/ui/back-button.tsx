import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  to?: string;
  label?: string;
  variant?: "default" | "ghost" | "light";
  className?: string;
  onClick?: () => void;
}

export const BackButton = ({
  to,
  label = "Voltar",
  variant = "default",
  className,
  onClick,
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  const variants = {
    default: "text-foreground hover:text-foreground/80",
    ghost: "text-muted-foreground hover:text-foreground",
    light: "text-white hover:opacity-80",
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleClick}
      className={cn(
        "gap-2 px-2 transition-opacity",
        variants[variant],
        className
      )}
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </Button>
  );
};
