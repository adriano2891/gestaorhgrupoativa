export const GlobalFooter = () => {
  return (
    <footer
      className="py-1.5 sm:py-2 text-center relative z-10 bg-gradient-to-r from-primary to-primary-dark safe-bottom px-4 sm:px-6 lg:px-8"
      role="contentinfo"
    >
      <p className="text-xs sm:text-sm text-primary-foreground/90" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        © {new Date().getFullYear()} Grupo Ativa Tec • Todos os direitos reservados
      </p>
      <p className="text-[10px] sm:text-xs text-primary-foreground/60 mt-0.5 leading-snug max-w-none mx-auto" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>
        Sistema de uso exclusivo e confidencial do Grupo Ativa. Acesso restrito a colaboradores autorizados. O uso indevido está sujeito às sanções previstas na legislação vigente (LGPD — Lei 13.709/2018, Código Penal — Art. 154-A e CLT).
      </p>
    </footer>
  );
};
