-- Adicionar campo de data de nascimento na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS data_nascimento DATE;