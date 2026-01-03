-- Criar políticas de storage para o bucket 'cursos'

-- Política para permitir que admins e RH façam upload de vídeos
CREATE POLICY "Admins e RH podem fazer upload em cursos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cursos' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'rh'::app_role)
  )
);

-- Política para permitir que admins e RH atualizem arquivos
CREATE POLICY "Admins e RH podem atualizar arquivos em cursos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'cursos' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'rh'::app_role)
  )
);

-- Política para permitir que admins e RH deletem arquivos
CREATE POLICY "Admins e RH podem deletar arquivos em cursos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'cursos' 
  AND (
    has_role(auth.uid(), 'admin'::app_role) 
    OR has_role(auth.uid(), 'rh'::app_role)
  )
);

-- Política para permitir que usuários autenticados visualizem arquivos de cursos
CREATE POLICY "Usuários autenticados podem ver arquivos de cursos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cursos' 
  AND auth.uid() IS NOT NULL
);