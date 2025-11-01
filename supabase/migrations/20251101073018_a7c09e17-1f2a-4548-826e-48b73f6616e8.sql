-- Criar função segura para buscar email por username
CREATE OR REPLACE FUNCTION public.get_email_by_username(username_input text)
RETURNS TABLE(email text, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.email, p.id
  FROM public.profiles p
  WHERE p.usuario = username_input
  LIMIT 1;
END;
$$;