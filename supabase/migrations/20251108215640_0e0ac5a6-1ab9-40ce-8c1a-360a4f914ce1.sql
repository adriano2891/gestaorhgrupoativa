-- Criar tabela para logs de envio de holerites
CREATE TABLE IF NOT EXISTS public.logs_envio_holerites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  holerite_id UUID NOT NULL REFERENCES public.holerites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  email_destino TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sucesso', 'erro', 'pendente')),
  mensagem_erro TEXT,
  tentativas INTEGER NOT NULL DEFAULT 1,
  enviado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX idx_logs_envio_holerite_id ON public.logs_envio_holerites(holerite_id);
CREATE INDEX idx_logs_envio_user_id ON public.logs_envio_holerites(user_id);
CREATE INDEX idx_logs_envio_status ON public.logs_envio_holerites(status);

-- RLS policies
ALTER TABLE public.logs_envio_holerites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins e RH podem ver todos os logs"
  ON public.logs_envio_holerites
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

CREATE POLICY "Admins e RH podem inserir logs"
  ON public.logs_envio_holerites
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

CREATE POLICY "Sistema pode inserir logs"
  ON public.logs_envio_holerites
  FOR INSERT
  WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_logs_envio_holerites_updated_at
  BEFORE UPDATE ON public.logs_envio_holerites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();