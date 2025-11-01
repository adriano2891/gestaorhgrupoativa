-- Criar função para buscar email por CPF (usada no login do portal)
-- Esta função permite que o portal encontre o email associado a um CPF
-- para realizar o login, sem expor dados sensíveis
CREATE OR REPLACE FUNCTION public.get_email_by_cpf(cpf_input text)
RETURNS TABLE (email text, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT p.email, p.id
  FROM public.profiles p
  WHERE p.cpf = cpf_input
  LIMIT 1;
END;
$$;

-- Conceder permissão para usuários anônimos e autenticados
GRANT EXECUTE ON FUNCTION public.get_email_by_cpf(text) TO anon, authenticated;