-- Atualizar função handle_new_user para incluir telefone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Inserir perfil básico incluindo telefone
  INSERT INTO public.profiles (id, nome, email, cpf, telefone, cargo, departamento)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email,
    NULLIF(NEW.raw_user_meta_data->>'cpf', ''),
    NULLIF(NEW.raw_user_meta_data->>'telefone', ''),
    NULLIF(NEW.raw_user_meta_data->>'cargo', ''),
    NULLIF(NEW.raw_user_meta_data->>'departamento', '')
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- Por padrão, novos usuários são funcionários
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionario')
  ON CONFLICT DO NOTHING;
  
  RETURN NEW;
END;
$function$;