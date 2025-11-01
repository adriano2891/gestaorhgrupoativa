-- Adicionar coluna de salário na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS salario NUMERIC(10, 2);

-- Adicionar comentário na coluna
COMMENT ON COLUMN public.profiles.salario IS 'Salário do funcionário';