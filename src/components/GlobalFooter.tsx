export const GlobalFooter = () => {
  return (
    <footer
      className="py-1.5 sm:py-2 text-center text-[11px] sm:text-xs text-primary-foreground/90 relative z-10 bg-gradient-to-r from-primary to-primary-dark safe-bottom"
      role="contentinfo"
    >
      © {new Date().getFullYear()} Grupo Ativa • Todos os direitos reservados
    </footer>
  );
};
