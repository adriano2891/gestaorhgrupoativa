-- Tornar o bucket de cursos público para permitir reprodução de vídeos
UPDATE storage.buckets 
SET public = true 
WHERE id = 'cursos';