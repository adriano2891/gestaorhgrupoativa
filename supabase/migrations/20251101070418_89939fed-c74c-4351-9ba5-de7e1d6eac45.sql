-- Adicionar campo usuario à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN usuario text UNIQUE;

-- Criar índice para busca rápida por usuario
CREATE INDEX idx_profiles_usuario ON public.profiles(usuario);

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.profiles.usuario IS 'Nome de usuário para login alternativo ao email';