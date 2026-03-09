export const GlobalFooter = () => {
  return (
    <footer
      className="py-1 text-center relative z-10 bg-gradient-to-r from-primary to-primary-dark safe-bottom px-3 sm:px-4 lg:px-6"
      role="contentinfo"
    >
      <p className="text-xs sm:text-sm text-primary-foreground/90 leading-tight" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        © {new Date().getFullYear()} Grupo Ativa Tec • Todos os direitos reservados
      </p>
      <p className="text-[11px] sm:text-xs text-primary-foreground/60 leading-tight mt-0.5 max-w-full" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        Sistema de uso exclusivo e confidencial do Grupo Ativa. Acesso restrito a colaboradores autorizados. O uso indevido está sujeito às sanções previstas na legislação vigente (LGPD — Lei 13.709/2018, Código Penal — Art. 154-A e CLT).
      </p>
    </footer>
  );
};
