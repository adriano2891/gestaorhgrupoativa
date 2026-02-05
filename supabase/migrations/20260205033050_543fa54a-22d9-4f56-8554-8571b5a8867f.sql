-- Add new columns for employee registration
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS endereco TEXT,
ADD COLUMN IF NOT EXISTS rg TEXT,
ADD COLUMN IF NOT EXISTS numero_pis TEXT;