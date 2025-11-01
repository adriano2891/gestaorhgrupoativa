-- Adicionar campo CPF na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT UNIQUE;

-- Criar tabela de registros de ponto
CREATE TABLE IF NOT EXISTS public.registros_ponto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  entrada TIMESTAMP WITH TIME ZONE,
  saida_pausa_1 TIMESTAMP WITH TIME ZONE,
  retorno_pausa_1 TIMESTAMP WITH TIME ZONE,
  saida_almoco TIMESTAMP WITH TIME ZONE,
  retorno_almoco TIMESTAMP WITH TIME ZONE,
  saida_pausa_2 TIMESTAMP WITH TIME ZONE,
  retorno_pausa_2 TIMESTAMP WITH TIME ZONE,
  saida TIMESTAMP WITH TIME ZONE,
  inicio_he TIMESTAMP WITH TIME ZONE,
  fim_he TIMESTAMP WITH TIME ZONE,
  total_horas INTERVAL,
  horas_extras INTERVAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, data)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_registros_ponto_user_id ON public.registros_ponto(user_id);
CREATE INDEX IF NOT EXISTS idx_registros_ponto_data ON public.registros_ponto(data);
CREATE INDEX IF NOT EXISTS idx_profiles_cpf ON public.profiles(cpf);

-- Habilitar RLS
ALTER TABLE public.registros_ponto ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para registros_ponto
-- Funcionários podem ver e atualizar apenas seus próprios registros
CREATE POLICY "Funcionários podem ver seus próprios registros"
  ON public.registros_ponto
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Funcionários podem inserir seus próprios registros"
  ON public.registros_ponto
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Funcionários podem atualizar seus próprios registros"
  ON public.registros_ponto
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins e RH podem ver todos os registros
CREATE POLICY "Admins e RH podem ver todos os registros"
  ON public.registros_ponto
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_registros_ponto_updated_at
  BEFORE UPDATE ON public.registros_ponto
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Função para calcular total de horas trabalhadas
CREATE OR REPLACE FUNCTION public.calcular_horas_trabalhadas(
  p_entrada TIMESTAMP WITH TIME ZONE,
  p_saida TIMESTAMP WITH TIME ZONE,
  p_saida_almoco TIMESTAMP WITH TIME ZONE,
  p_retorno_almoco TIMESTAMP WITH TIME ZONE,
  p_saida_pausa_1 TIMESTAMP WITH TIME ZONE,
  p_retorno_pausa_1 TIMESTAMP WITH TIME ZONE,
  p_saida_pausa_2 TIMESTAMP WITH TIME ZONE,
  p_retorno_pausa_2 TIMESTAMP WITH TIME ZONE
)
RETURNS INTERVAL
LANGUAGE plpgsql
AS $$
DECLARE
  total INTERVAL := '0 hours'::INTERVAL;
  pausa_almoco INTERVAL := '0 hours'::INTERVAL;
  pausa_1 INTERVAL := '0 hours'::INTERVAL;
  pausa_2 INTERVAL := '0 hours'::INTERVAL;
BEGIN
  IF p_entrada IS NOT NULL AND p_saida IS NOT NULL THEN
    total := p_saida - p_entrada;
    
    -- Subtrair tempo de almoço
    IF p_saida_almoco IS NOT NULL AND p_retorno_almoco IS NOT NULL THEN
      pausa_almoco := p_retorno_almoco - p_saida_almoco;
      total := total - pausa_almoco;
    END IF;
    
    -- Subtrair pausa 1
    IF p_saida_pausa_1 IS NOT NULL AND p_retorno_pausa_1 IS NOT NULL THEN
      pausa_1 := p_retorno_pausa_1 - p_saida_pausa_1;
      total := total - pausa_1;
    END IF;
    
    -- Subtrair pausa 2
    IF p_saida_pausa_2 IS NOT NULL AND p_retorno_pausa_2 IS NOT NULL THEN
      pausa_2 := p_retorno_pausa_2 - p_saida_pausa_2;
      total := total - pausa_2;
    END IF;
  END IF;
  
  RETURN total;
END;
$$;

-- Trigger para calcular automaticamente total_horas e horas_extras
CREATE OR REPLACE FUNCTION public.atualizar_calculo_ponto()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  jornada_padrao INTERVAL := '8 hours'::INTERVAL;
  horas_trabalhadas INTERVAL;
  horas_he INTERVAL := '0 hours'::INTERVAL;
BEGIN
  -- Calcular horas trabalhadas
  horas_trabalhadas := calcular_horas_trabalhadas(
    NEW.entrada,
    NEW.saida,
    NEW.saida_almoco,
    NEW.retorno_almoco,
    NEW.saida_pausa_1,
    NEW.retorno_pausa_1,
    NEW.saida_pausa_2,
    NEW.retorno_pausa_2
  );
  
  NEW.total_horas := horas_trabalhadas;
  
  -- Calcular horas extras
  IF NEW.inicio_he IS NOT NULL AND NEW.fim_he IS NOT NULL THEN
    horas_he := NEW.fim_he - NEW.inicio_he;
  END IF;
  
  -- Se trabalhou mais que jornada padrão, também conta como HE
  IF horas_trabalhadas > jornada_padrao THEN
    horas_he := horas_he + (horas_trabalhadas - jornada_padrao);
  END IF;
  
  NEW.horas_extras := horas_he;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_atualizar_calculo_ponto
  BEFORE INSERT OR UPDATE ON public.registros_ponto
  FOR EACH ROW
  EXECUTE FUNCTION public.atualizar_calculo_ponto();