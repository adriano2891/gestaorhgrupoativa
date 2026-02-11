-- Make chamados-anexos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chamados-anexos';

-- Fix overly permissive storage policies for resumes bucket
-- Remove public update/delete policies
DROP POLICY IF EXISTS "Permitir atualização pública de currículos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir exclusão pública de currículos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir upload público de currículos" ON storage.objects;

-- Recreate with role-based access
CREATE POLICY "HR e Admins podem fazer upload de currículos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'resumes' AND 
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'))
);

CREATE POLICY "HR e Admins podem atualizar currículos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'resumes' AND 
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'))
);

CREATE POLICY "HR e Admins podem deletar currículos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'resumes' AND 
  (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'))
);