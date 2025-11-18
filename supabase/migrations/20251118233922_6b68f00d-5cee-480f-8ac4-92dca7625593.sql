-- Permitir que Admins e RH atualizem perfis de funcionários
-- mantendo a política atual de que o próprio usuário pode atualizar seu perfil

-- Criar política específica para UPDATE por Admin/RH
CREATE POLICY "Admins e RH podem atualizar perfis"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));