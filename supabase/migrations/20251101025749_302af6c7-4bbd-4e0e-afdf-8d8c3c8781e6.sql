-- Corrigir search_path nas funções criadas
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
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total INTERVAL := '0 hours'::INTERVAL;
  pausa_almoco INTERVAL := '0 hours'::INTERVAL;
  pausa_1 INTERVAL := '0 hours'::INTERVAL;
  pausa_2 INTERVAL := '0 hours'::INTERVAL;
BEGIN
  IF p_entrada IS NOT NULL AND p_saida IS NOT NULL THEN
    total := p_saida - p_entrada;
    
    IF p_saida_almoco IS NOT NULL AND p_retorno_almoco IS NOT NULL THEN
      pausa_almoco := p_retorno_almoco - p_saida_almoco;
      total := total - pausa_almoco;
    END IF;
    
    IF p_saida_pausa_1 IS NOT NULL AND p_retorno_pausa_1 IS NOT NULL THEN
      pausa_1 := p_retorno_pausa_1 - p_saida_pausa_1;
      total := total - pausa_1;
    END IF;
    
    IF p_saida_pausa_2 IS NOT NULL AND p_retorno_pausa_2 IS NOT NULL THEN
      pausa_2 := p_retorno_pausa_2 - p_saida_pausa_2;
      total := total - pausa_2;
    END IF;
  END IF;
  
  RETURN total;
END;
$$;

CREATE OR REPLACE FUNCTION public.atualizar_calculo_ponto()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jornada_padrao INTERVAL := '8 hours'::INTERVAL;
  horas_trabalhadas INTERVAL;
  horas_he INTERVAL := '0 hours'::INTERVAL;
BEGIN
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
  
  IF NEW.inicio_he IS NOT NULL AND NEW.fim_he IS NOT NULL THEN
    horas_he := NEW.fim_he - NEW.inicio_he;
  END IF;
  
  IF horas_trabalhadas > jornada_padrao THEN
    horas_he := horas_he + (horas_trabalhadas - jornada_padrao);
  END IF;
  
  NEW.horas_extras := horas_he;
  
  RETURN NEW;
END;
$$;