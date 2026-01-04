-- Criar bucket para armazenamento de vídeos dos cursos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cursos',
  'cursos',
  true,
  524288000, -- 500MB limite
  ARRAY['video/mp4', 'video/webm', 'video/quicktime', 'video/x-m4v', 'video/x-msvideo', 'video/x-matroska', 'video/x-ms-wmv', 'application/pdf', 'image/jpeg', 'image/png', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Política para visualização pública
CREATE POLICY "Vídeos de cursos são públicos para visualização"
ON storage.objects FOR SELECT
USING (bucket_id = 'cursos');

-- Política para upload por usuários autenticados
CREATE POLICY "Usuários autenticados podem fazer upload de vídeos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'cursos' AND auth.role() = 'authenticated');

-- Política para deleção por usuários autenticados
CREATE POLICY "Usuários autenticados podem deletar vídeos"
ON storage.objects FOR DELETE
USING (bucket_id = 'cursos' AND auth.role() = 'authenticated');

-- Política para atualização por usuários autenticados
CREATE POLICY "Usuários autenticados podem atualizar vídeos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'cursos' AND auth.role() = 'authenticated');