-- Remove public RLS policies from candidates table
DROP POLICY IF EXISTS "Permitir leitura pública de candidatos" ON candidates;
DROP POLICY IF EXISTS "Permitir inserção pública de candidatos" ON candidates;
DROP POLICY IF EXISTS "Permitir atualização pública de candidatos" ON candidates;
DROP POLICY IF EXISTS "Permitir exclusão pública de candidatos" ON candidates;

-- Create role-based policies for candidates table
CREATE POLICY "Admins e RH podem ver candidatos" ON candidates
  FOR SELECT USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'rh')
  );

CREATE POLICY "Admins e RH podem inserir candidatos" ON candidates
  FOR INSERT WITH CHECK (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'rh')
  );

CREATE POLICY "Admins e RH podem atualizar candidatos" ON candidates
  FOR UPDATE USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'rh')
  );

CREATE POLICY "Admins podem deletar candidatos" ON candidates
  FOR DELETE USING (has_role(auth.uid(), 'admin'));