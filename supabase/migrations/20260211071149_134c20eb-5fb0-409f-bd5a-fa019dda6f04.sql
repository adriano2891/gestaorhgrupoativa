-- Update RLS policy for mensagens_chamado to use 'fechado' instead of 'encerrado'
DROP POLICY IF EXISTS "Funcionários podem enviar mensagens nos seus chamados" ON public.mensagens_chamado;

CREATE POLICY "Funcionários podem enviar mensagens nos seus chamados"
ON public.mensagens_chamado
FOR INSERT
WITH CHECK (
  (auth.uid() = remetente_id) AND (EXISTS (
    SELECT 1 FROM chamados_suporte c
    WHERE c.id = mensagens_chamado.chamado_id
      AND c.user_id = auth.uid()
      AND c.status <> 'fechado'
  ))
);

-- Update existing chamados with old statuses to map to 'aberto'
UPDATE public.chamados_suporte SET status = 'aberto' WHERE status IN ('em_atendimento', 'respondido');
UPDATE public.chamados_suporte SET status = 'fechado' WHERE status = 'encerrado';