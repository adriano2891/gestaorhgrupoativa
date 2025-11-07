-- Tabela de Holerites
CREATE TABLE IF NOT EXISTS public.holerites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
  ano INTEGER NOT NULL CHECK (ano >= 2000),
  salario_bruto NUMERIC(10, 2) NOT NULL,
  descontos NUMERIC(10, 2) DEFAULT 0,
  salario_liquido NUMERIC(10, 2) NOT NULL,
  arquivo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mes, ano)
);

-- Enable RLS
ALTER TABLE public.holerites ENABLE ROW LEVEL SECURITY;

-- RLS Policies para holerites
CREATE POLICY "Funcionários podem ver seus próprios holerites"
  ON public.holerites
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins e RH podem ver todos os holerites"
  ON public.holerites
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

CREATE POLICY "Admins e RH podem inserir holerites"
  ON public.holerites
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

CREATE POLICY "Admins e RH podem atualizar holerites"
  ON public.holerites
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- Tabela de Comunicados
CREATE TABLE IF NOT EXISTS public.comunicados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'informativo',
  prioridade VARCHAR(20) NOT NULL DEFAULT 'normal',
  destinatarios TEXT[] DEFAULT ARRAY['todos'],
  criado_por UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  data_expiracao TIMESTAMPTZ,
  ativo BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

-- RLS Policies para comunicados
CREATE POLICY "Todos funcionários autenticados podem ver comunicados ativos"
  ON public.comunicados
  FOR SELECT
  USING (
    ativo = true AND 
    (data_expiracao IS NULL OR data_expiracao > now()) AND
    ('todos' = ANY(destinatarios) OR 
     (SELECT departamento FROM profiles WHERE id = auth.uid()) = ANY(destinatarios))
  );

CREATE POLICY "Admins e RH podem gerenciar comunicados"
  ON public.comunicados
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- Tabela de Leitura de Comunicados
CREATE TABLE IF NOT EXISTS public.comunicados_lidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  comunicado_id UUID NOT NULL REFERENCES public.comunicados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lido_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(comunicado_id, user_id)
);

-- Enable RLS
ALTER TABLE public.comunicados_lidos ENABLE ROW LEVEL SECURITY;

-- RLS Policies para comunicados_lidos
CREATE POLICY "Usuários podem ver suas próprias leituras"
  ON public.comunicados_lidos
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem marcar comunicados como lidos"
  ON public.comunicados_lidos
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_holerites_updated_at
  BEFORE UPDATE ON public.holerites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comunicados_updated_at
  BEFORE UPDATE ON public.comunicados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.holerites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicados;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comunicados_lidos;