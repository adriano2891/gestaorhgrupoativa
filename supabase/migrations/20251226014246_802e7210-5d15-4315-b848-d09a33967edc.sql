-- Criar bucket para armazenamento de holerites
INSERT INTO storage.buckets (id, name, public)
VALUES ('holerites', 'holerites', false)
ON CONFLICT (id) DO NOTHING;

-- Política: Admins e RH podem fazer upload de holerites
CREATE POLICY "Admins e RH podem fazer upload de holerites"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'holerites' 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'))
);

-- Política: Admins e RH podem ver todos os holerites
CREATE POLICY "Admins e RH podem ver todos os holerites no storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'holerites' 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'))
);

-- Política: Funcionários podem ver seus próprios holerites
CREATE POLICY "Funcionarios podem ver seus proprios holerites no storage"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'holerites' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Política: Admins e RH podem deletar holerites no storage
CREATE POLICY "Admins e RH podem deletar holerites no storage"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'holerites' 
  AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'))
);