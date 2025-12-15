import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassPanelProps {
  children: ReactNode;
  className?: string;
}

export function GlassPanel({ children, className }: GlassPanelProps) {
  return (
    <div 
      className={cn(
        "bg-white/95 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}
