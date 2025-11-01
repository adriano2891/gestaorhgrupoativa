-- Criar tabela de histórico de salários se não existir
CREATE TABLE IF NOT EXISTS public.historico_salarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salario_anterior NUMERIC,
  salario_novo NUMERIC NOT NULL,
  data_alteracao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  motivo TEXT,
  alterado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices se não existirem
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_historico_salarios_user_id') THEN
    CREATE INDEX idx_historico_salarios_user_id ON public.historico_salarios(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_historico_salarios_data') THEN
    CREATE INDEX idx_historico_salarios_data ON public.historico_salarios(data_alteracao DESC);
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.historico_salarios ENABLE ROW LEVEL SECURITY;

-- Remover políticas existentes se houver
DROP POLICY IF EXISTS "Admins e RH podem ver todo o histórico" ON public.historico_salarios;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio histórico" ON public.historico_salarios;
DROP POLICY IF EXISTS "Admins e RH podem inserir histórico" ON public.historico_salarios;

-- Criar políticas RLS
CREATE POLICY "Admins e RH podem ver todo o histórico"
ON public.historico_salarios
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Usuários podem ver seu próprio histórico"
ON public.historico_salarios
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins e RH podem inserir histórico"
ON public.historico_salarios
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Criar função para registrar alteração de salário automaticamente
CREATE OR REPLACE FUNCTION public.registrar_alteracao_salario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Só registrar se o salário mudou
  IF NEW.salario IS DISTINCT FROM OLD.salario AND NEW.salario IS NOT NULL THEN
    INSERT INTO public.historico_salarios (user_id, salario_anterior, salario_novo, alterado_por)
    VALUES (NEW.id, OLD.salario, NEW.salario, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS trigger_registrar_alteracao_salario ON public.profiles;

-- Criar trigger para registrar alterações de salário
CREATE TRIGGER trigger_registrar_alteracao_salario
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.registrar_alteracao_salario();