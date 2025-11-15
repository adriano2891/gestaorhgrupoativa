-- Atualizar política RLS para permitir que funcionários vejam comunicados direcionados especificamente a eles
DROP POLICY IF EXISTS "Todos funcionários autenticados podem ver comunicados ativos" ON comunicados;

CREATE POLICY "Todos funcionários autenticados podem ver comunicados ativos"
ON comunicados
FOR SELECT
USING (
  ativo = true 
  AND (data_expiracao IS NULL OR data_expiracao > now())
  AND (
    'todos'::text = ANY (destinatarios) 
    OR (SELECT departamento FROM profiles WHERE id = auth.uid()) = ANY (destinatarios)
    OR auth.uid()::text = ANY (destinatarios)
  )
);