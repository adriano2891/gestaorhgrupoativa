
-- Tabela de chamados de suporte
CREATE TABLE public.chamados_suporte (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  categoria VARCHAR NOT NULL DEFAULT 'outros',
  assunto TEXT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de mensagens dos chamados
CREATE TABLE public.mensagens_chamado (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chamado_id UUID NOT NULL REFERENCES public.chamados_suporte(id) ON DELETE CASCADE,
  remetente_id UUID NOT NULL,
  conteudo TEXT NOT NULL,
  arquivo_url TEXT,
  arquivo_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.chamados_suporte ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mensagens_chamado ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chamados_suporte
CREATE POLICY "Funcionários podem ver seus próprios chamados"
ON public.chamados_suporte FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins e RH podem ver todos os chamados"
ON public.chamados_suporte FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

CREATE POLICY "Funcionários podem criar chamados"
ON public.chamados_suporte FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Funcionários podem atualizar seus chamados"
ON public.chamados_suporte FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins e RH podem atualizar chamados"
ON public.chamados_suporte FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- RLS Policies for mensagens_chamado
CREATE POLICY "Funcionários podem ver mensagens dos seus chamados"
ON public.mensagens_chamado FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.chamados_suporte c 
  WHERE c.id = chamado_id AND c.user_id = auth.uid()
));

CREATE POLICY "Admins e RH podem ver todas as mensagens"
ON public.mensagens_chamado FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

CREATE POLICY "Funcionários podem enviar mensagens nos seus chamados"
ON public.mensagens_chamado FOR INSERT
WITH CHECK (
  auth.uid() = remetente_id AND
  EXISTS (
    SELECT 1 FROM public.chamados_suporte c 
    WHERE c.id = chamado_id AND c.user_id = auth.uid() AND c.status != 'encerrado'
  )
);

CREATE POLICY "Admins e RH podem enviar mensagens"
ON public.mensagens_chamado FOR INSERT
WITH CHECK (
  auth.uid() = remetente_id AND
  (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role))
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_chamados_suporte_updated_at
BEFORE UPDATE ON public.chamados_suporte
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para anexos dos chamados
INSERT INTO storage.buckets (id, name, public) VALUES ('chamados-anexos', 'chamados-anexos', false);

-- Storage policies
CREATE POLICY "Autenticados podem fazer upload de anexos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'chamados-anexos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Autenticados podem ver anexos"
ON storage.objects FOR SELECT
USING (bucket_id = 'chamados-anexos' AND auth.uid() IS NOT NULL);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chamados_suporte;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mensagens_chamado;
