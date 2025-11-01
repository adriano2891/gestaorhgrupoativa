-- Adicionar campo telefone na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telefone TEXT;