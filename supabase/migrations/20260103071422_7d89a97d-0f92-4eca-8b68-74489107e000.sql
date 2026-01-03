
-- Criar bucket para vídeos dos cursos
INSERT INTO storage.buckets (id, name, public) VALUES ('cursos', 'cursos', false)
ON CONFLICT (id) DO NOTHING;

-- Policies para o bucket de cursos
CREATE POLICY "Admins e RH podem fazer upload de vídeos" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'cursos' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh')));

CREATE POLICY "Admins e RH podem deletar vídeos" ON storage.objects
FOR DELETE USING (bucket_id = 'cursos' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh')));

CREATE POLICY "Admins e RH podem atualizar vídeos" ON storage.objects
FOR UPDATE USING (bucket_id = 'cursos' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh')));

CREATE POLICY "Usuários matriculados podem ver vídeos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'cursos' AND (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'rh') OR
    auth.uid() IS NOT NULL
  )
);
