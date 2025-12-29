-- Enum para tipos de campos de formulário
CREATE TYPE public.form_field_type AS ENUM ('text', 'textarea', 'select', 'checkbox', 'date', 'file', 'number', 'email', 'phone');

-- Enum para status do formulário
CREATE TYPE public.form_status AS ENUM ('rascunho', 'pendente_aprovacao', 'aprovado', 'publicado', 'arquivado');

-- Enum para categorias de formulários de RH
CREATE TYPE public.form_category AS ENUM ('admissao', 'desligamento', 'avaliacao_desempenho', 'feedback', 'solicitacao', 'treinamento', 'documentos', 'outro');

-- Tabela principal de formulários
CREATE TABLE public.formularios_rh (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria form_category NOT NULL DEFAULT 'outro',
  status form_status NOT NULL DEFAULT 'rascunho',
  is_template BOOLEAN NOT NULL DEFAULT false,
  template_origem_id UUID REFERENCES public.formularios_rh(id) ON DELETE SET NULL,
  criado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  aprovado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  data_aprovacao TIMESTAMP WITH TIME ZONE,
  departamento_destino TEXT,
  requer_assinatura BOOLEAN NOT NULL DEFAULT false,
  arquivo_externo_url TEXT,
  arquivo_externo_nome TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de campos do formulário
CREATE TABLE public.formulario_campos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID NOT NULL REFERENCES public.formularios_rh(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  tipo form_field_type NOT NULL DEFAULT 'text',
  obrigatorio BOOLEAN NOT NULL DEFAULT false,
  ordem INTEGER NOT NULL DEFAULT 0,
  opcoes JSONB, -- Para campos do tipo select
  placeholder TEXT,
  valor_padrao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de atribuições de formulários a colaboradores
CREATE TABLE public.formulario_atribuicoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  formulario_id UUID NOT NULL REFERENCES public.formularios_rh(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status VARCHAR NOT NULL DEFAULT 'pendente',
  data_limite DATE,
  assinado BOOLEAN NOT NULL DEFAULT false,
  data_assinatura TIMESTAMP WITH TIME ZONE,
  ip_assinatura TEXT,
  notificado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(formulario_id, user_id)
);

-- Tabela de respostas dos formulários
CREATE TABLE public.formulario_respostas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  atribuicao_id UUID NOT NULL REFERENCES public.formulario_atribuicoes(id) ON DELETE CASCADE,
  campo_id UUID NOT NULL REFERENCES public.formulario_campos(id) ON DELETE CASCADE,
  valor TEXT,
  arquivo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.formularios_rh ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulario_campos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulario_atribuicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.formulario_respostas ENABLE ROW LEVEL SECURITY;

-- Políticas para formularios_rh
CREATE POLICY "Admins e RH podem ver todos os formulários" 
ON public.formularios_rh FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Admins e RH podem criar formulários" 
ON public.formularios_rh FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Admins e RH podem atualizar formulários" 
ON public.formularios_rh FOR UPDATE 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Admins podem deletar formulários" 
ON public.formularios_rh FOR DELETE 
USING (has_role(auth.uid(), 'admin'));

-- Políticas para formulario_campos
CREATE POLICY "Admins e RH podem ver campos" 
ON public.formulario_campos FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Admins e RH podem gerenciar campos" 
ON public.formulario_campos FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Políticas para formulario_atribuicoes
CREATE POLICY "Admins e RH podem ver todas atribuições" 
ON public.formulario_atribuicoes FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Usuários podem ver suas próprias atribuições" 
ON public.formulario_atribuicoes FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins e RH podem gerenciar atribuições" 
ON public.formulario_atribuicoes FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Usuários podem atualizar suas atribuições" 
ON public.formulario_atribuicoes FOR UPDATE 
USING (auth.uid() = user_id);

-- Políticas para formulario_respostas
CREATE POLICY "Admins e RH podem ver todas respostas" 
ON public.formulario_respostas FOR SELECT 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Usuários podem ver suas próprias respostas" 
ON public.formulario_respostas FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.formulario_atribuicoes fa 
    WHERE fa.id = formulario_respostas.atribuicao_id 
    AND fa.user_id = auth.uid()
  )
);

CREATE POLICY "Usuários podem inserir suas respostas" 
ON public.formulario_respostas FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.formulario_atribuicoes fa 
    WHERE fa.id = formulario_respostas.atribuicao_id 
    AND fa.user_id = auth.uid()
  )
);

CREATE POLICY "Admins e RH podem gerenciar respostas" 
ON public.formulario_respostas FOR ALL 
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Triggers para updated_at
CREATE TRIGGER update_formularios_rh_updated_at
BEFORE UPDATE ON public.formularios_rh
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formulario_campos_updated_at
BEFORE UPDATE ON public.formulario_campos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formulario_atribuicoes_updated_at
BEFORE UPDATE ON public.formulario_atribuicoes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_formulario_respostas_updated_at
BEFORE UPDATE ON public.formulario_respostas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket para arquivos de formulários
INSERT INTO storage.buckets (id, name, public) VALUES ('formularios', 'formularios', false);

-- Políticas de storage para formulários
CREATE POLICY "Admins e RH podem fazer upload de formulários" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'formularios' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh')));

CREATE POLICY "Admins e RH podem ver formulários" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'formularios' AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh')));

CREATE POLICY "Usuários podem ver formulários atribuídos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'formularios');

CREATE POLICY "Admins podem deletar formulários" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'formularios' AND has_role(auth.uid(), 'admin'));