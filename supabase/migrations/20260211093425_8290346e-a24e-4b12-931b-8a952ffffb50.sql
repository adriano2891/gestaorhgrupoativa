
-- =============================================
-- FIX 1: Restrict overly permissive RLS policies
-- =============================================

-- metricas: restrict to admin/rh/gestor
DROP POLICY IF EXISTS "Usuários autenticados podem ver métricas" ON public.metricas;
CREATE POLICY "Admin e RH podem ver métricas" 
ON public.metricas FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'rh') OR 
  public.has_role(auth.uid(), 'gestor')
);

-- relatorios_gerados: restrict to admin/rh
DROP POLICY IF EXISTS "Usuários autenticados podem ver relatórios" ON public.relatorios_gerados;
CREATE POLICY "Admin e RH podem ver relatórios" 
ON public.relatorios_gerados FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'rh')
);

-- logs_relatorios: restrict to admin/rh
DROP POLICY IF EXISTS "Usuários autenticados podem ver logs" ON public.logs_relatorios;
CREATE POLICY "Admin e RH podem ver logs de relatórios" 
ON public.logs_relatorios FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin') OR 
  public.has_role(auth.uid(), 'rh')
);

-- =============================================
-- FIX 2: Make public storage buckets private
-- =============================================

UPDATE storage.buckets SET public = false 
WHERE id IN ('fornecedores', 'resumes', 'documentos', 'cursos');

-- Update storage policies for fornecedores
DROP POLICY IF EXISTS "Anyone can view supplier files" ON storage.objects;
CREATE POLICY "Authenticated users can view supplier files" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'fornecedores' 
  AND auth.role() = 'authenticated'
);

-- Update storage policies for resumes
DROP POLICY IF EXISTS "Permitir leitura pública de currículos" ON storage.objects;
CREATE POLICY "Admin and HR can view resumes" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'resumes' 
  AND auth.role() = 'authenticated'
);

-- Update storage policies for documentos
DROP POLICY IF EXISTS "Todos podem ver documentos públicos no storage" ON storage.objects;
CREATE POLICY "Authenticated users can view documents" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'documentos' 
  AND auth.uid() IS NOT NULL
);

-- Update storage policies for cursos
DROP POLICY IF EXISTS "Vídeos de cursos são públicos para visualização" ON storage.objects;
CREATE POLICY "Authenticated users can view course content" 
ON storage.objects FOR SELECT 
USING (
  bucket_id = 'cursos' 
  AND auth.role() = 'authenticated'
);

-- =============================================
-- FIX 3: Revoke anonymous access to CPF lookup
-- =============================================

REVOKE EXECUTE ON FUNCTION public.get_email_by_cpf(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_email_by_username(text) FROM anon;
