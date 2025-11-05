-- Criar tabela de períodos aquisitivos
CREATE TABLE public.periodos_aquisitivos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_direito INTEGER NOT NULL DEFAULT 30,
  dias_usados INTEGER NOT NULL DEFAULT 0,
  dias_disponiveis INTEGER GENERATED ALWAYS AS (dias_direito - dias_usados) STORED,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de solicitações de férias
CREATE TABLE public.solicitacoes_ferias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  periodo_aquisitivo_id UUID NOT NULL REFERENCES public.periodos_aquisitivos(id) ON DELETE CASCADE,
  data_inicio DATE NOT NULL,
  data_fim DATE NOT NULL,
  dias_solicitados INTEGER NOT NULL,
  tipo VARCHAR(50) NOT NULL DEFAULT 'ferias' CHECK (tipo IN ('ferias', 'ferias_coletivas', 'abono_pecuniario')),
  status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'em_andamento', 'reprovado', 'concluido', 'cancelado')),
  observacao TEXT,
  aprovado_por UUID REFERENCES public.profiles(id),
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  motivo_reprovacao TEXT,
  notificado_em TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de histórico de férias
CREATE TABLE public.historico_ferias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitacao_id UUID NOT NULL REFERENCES public.solicitacoes_ferias(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  acao VARCHAR(100) NOT NULL,
  status_anterior VARCHAR(50),
  status_novo VARCHAR(50),
  realizado_por UUID REFERENCES public.profiles(id),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.periodos_aquisitivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitacoes_ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_ferias ENABLE ROW LEVEL SECURITY;

-- Políticas para periodos_aquisitivos
CREATE POLICY "Usuários podem ver seus próprios períodos aquisitivos"
ON public.periodos_aquisitivos FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins e RH podem ver todos os períodos aquisitivos"
ON public.periodos_aquisitivos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

CREATE POLICY "Gestores podem ver períodos do seu departamento"
ON public.periodos_aquisitivos FOR SELECT
USING (
  has_role(auth.uid(), 'gestor'::app_role) AND
  user_id IN (
    SELECT id FROM public.profiles 
    WHERE departamento = get_user_departamento(auth.uid())
  )
);

CREATE POLICY "Admins e RH podem gerenciar períodos aquisitivos"
ON public.periodos_aquisitivos FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

-- Políticas para solicitacoes_ferias
CREATE POLICY "Usuários podem ver suas próprias solicitações"
ON public.solicitacoes_ferias FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem criar suas próprias solicitações"
ON public.solicitacoes_ferias FOR INSERT
WITH CHECK (auth.uid() = user_id AND status = 'pendente');

CREATE POLICY "Usuários podem atualizar suas próprias solicitações pendentes"
ON public.solicitacoes_ferias FOR UPDATE
USING (auth.uid() = user_id AND status = 'pendente');

CREATE POLICY "Admins e RH podem ver todas as solicitações"
ON public.solicitacoes_ferias FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

CREATE POLICY "Gestores podem ver solicitações do seu departamento"
ON public.solicitacoes_ferias FOR SELECT
USING (
  has_role(auth.uid(), 'gestor'::app_role) AND
  user_id IN (
    SELECT id FROM public.profiles 
    WHERE departamento = get_user_departamento(auth.uid())
  )
);

CREATE POLICY "Admins, RH e Gestores podem gerenciar solicitações"
ON public.solicitacoes_ferias FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'rh'::app_role) OR
  (has_role(auth.uid(), 'gestor'::app_role) AND
   user_id IN (
     SELECT id FROM public.profiles 
     WHERE departamento = get_user_departamento(auth.uid())
   ))
);

-- Políticas para historico_ferias
CREATE POLICY "Usuários podem ver seu próprio histórico"
ON public.historico_ferias FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins e RH podem ver todo o histórico"
ON public.historico_ferias FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'rh'::app_role));

CREATE POLICY "Gestores podem ver histórico do seu departamento"
ON public.historico_ferias FOR SELECT
USING (
  has_role(auth.uid(), 'gestor'::app_role) AND
  user_id IN (
    SELECT id FROM public.profiles 
    WHERE departamento = get_user_departamento(auth.uid())
  )
);

CREATE POLICY "Sistema pode inserir histórico"
ON public.historico_ferias FOR INSERT
WITH CHECK (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_periodos_aquisitivos_updated_at
BEFORE UPDATE ON public.periodos_aquisitivos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solicitacoes_ferias_updated_at
BEFORE UPDATE ON public.solicitacoes_ferias
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para registrar mudanças de status no histórico
CREATE OR REPLACE FUNCTION public.registrar_historico_ferias()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
    INSERT INTO public.historico_ferias (
      solicitacao_id,
      user_id,
      acao,
      status_anterior,
      status_novo,
      realizado_por,
      observacao
    ) VALUES (
      NEW.id,
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'aprovado' THEN 'Solicitação aprovada'
        WHEN NEW.status = 'reprovado' THEN 'Solicitação reprovada'
        WHEN NEW.status = 'em_andamento' THEN 'Férias iniciadas'
        WHEN NEW.status = 'concluido' THEN 'Férias concluídas'
        WHEN NEW.status = 'cancelado' THEN 'Solicitação cancelada'
        ELSE 'Status alterado'
      END,
      OLD.status,
      NEW.status,
      auth.uid(),
      NEW.observacao
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_registrar_historico_ferias
AFTER UPDATE ON public.solicitacoes_ferias
FOR EACH ROW
EXECUTE FUNCTION public.registrar_historico_ferias();

-- Trigger para atualizar dias usados ao aprovar férias
CREATE OR REPLACE FUNCTION public.atualizar_dias_usados()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (NEW.status = 'aprovado' AND OLD.status = 'pendente') THEN
    UPDATE public.periodos_aquisitivos
    SET dias_usados = dias_usados + NEW.dias_solicitados
    WHERE id = NEW.periodo_aquisitivo_id;
  ELSIF (NEW.status = 'cancelado' AND OLD.status = 'aprovado') THEN
    UPDATE public.periodos_aquisitivos
    SET dias_usados = dias_usados - NEW.dias_solicitados
    WHERE id = NEW.periodo_aquisitivo_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_atualizar_dias_usados
AFTER UPDATE ON public.solicitacoes_ferias
FOR EACH ROW
EXECUTE FUNCTION public.atualizar_dias_usados();

-- Índices para performance
CREATE INDEX idx_periodos_aquisitivos_user_id ON public.periodos_aquisitivos(user_id);
CREATE INDEX idx_solicitacoes_ferias_user_id ON public.solicitacoes_ferias(user_id);
CREATE INDEX idx_solicitacoes_ferias_status ON public.solicitacoes_ferias(status);
CREATE INDEX idx_solicitacoes_ferias_data_inicio ON public.solicitacoes_ferias(data_inicio);
CREATE INDEX idx_historico_ferias_solicitacao_id ON public.historico_ferias(solicitacao_id);