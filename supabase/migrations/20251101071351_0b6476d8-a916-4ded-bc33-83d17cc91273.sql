-- Permitir que admins e RH vejam todos os user_roles para gerenciar administradores
DROP POLICY IF EXISTS "Usuários podem ver seus próprios roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins podem gerenciar todos os roles" ON public.user_roles;

-- Criar políticas atualizadas
CREATE POLICY "Usuários podem ver seus próprios roles"
ON public.user_roles
FOR SELECT
TO public
USING (user_id = auth.uid());

CREATE POLICY "Admins e RH podem ver todos os roles"
ON public.user_roles
FOR SELECT
TO public
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Admins podem gerenciar todos os roles"
ON public.user_roles
FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));