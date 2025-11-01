
-- Migration: 20251030072617

-- Migration: 20251030065125

-- Migration: 20251030061137

-- Migration: 20251030055951
-- Criar tabela de candidatos
CREATE TABLE public.candidates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  position TEXT NOT NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'disponivel' CHECK (status IN ('disponivel', 'em-processo', 'contratado')),
  resume_url TEXT,
  applied_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para acesso público (como é um banco de talentos interno da empresa)
CREATE POLICY "Permitir leitura pública de candidatos"
ON public.candidates
FOR SELECT
USING (true);

CREATE POLICY "Permitir inserção pública de candidatos"
ON public.candidates
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Permitir atualização pública de candidatos"
ON public.candidates
FOR UPDATE
USING (true);

CREATE POLICY "Permitir exclusão pública de candidatos"
ON public.candidates
FOR DELETE
USING (true);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar trigger para atualizar updated_at
CREATE TRIGGER update_candidates_updated_at
BEFORE UPDATE ON public.candidates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket de storage para currículos
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para currículos
CREATE POLICY "Permitir leitura pública de currículos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resumes');

CREATE POLICY "Permitir upload público de currículos"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Permitir atualização pública de currículos"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'resumes');

CREATE POLICY "Permitir exclusão pública de currículos"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resumes');



-- Migration: 20251030071808
-- Criar enum para roles de usuário
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor', 'rh', 'funcionario');

-- Tabela de perfis de usuário
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  departamento TEXT,
  cargo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Tabela de roles de usuário (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função security definer para verificar roles (evita recursão em RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email),
    NEW.email
  );
  
  -- Por padrão, novos usuários são funcionários
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'funcionario');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Tabela de métricas
CREATE TABLE public.metricas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo DATE NOT NULL,
  taxa_presenca DECIMAL(5,2),
  taxa_retencao DECIMAL(5,2),
  satisfacao_interna DECIMAL(5,2),
  tempo_medio_contratacao INTEGER, -- em dias
  indice_absenteismo DECIMAL(5,2),
  custo_medio_funcionario DECIMAL(12,2),
  horas_extras_percentual DECIMAL(5,2),
  indice_eficiencia DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.metricas ENABLE ROW LEVEL SECURITY;

-- Tabela de relatórios gerados
CREATE TABLE public.relatorios_gerados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL, -- folha_pagamento, frequencia, turnover, contratacoes, ponto
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  gerado_por UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  departamento TEXT,
  formato TEXT NOT NULL, -- pdf, excel, csv
  url_arquivo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.relatorios_gerados ENABLE ROW LEVEL SECURITY;

-- Tabela de logs de acesso a relatórios
CREATE TABLE public.logs_relatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  relatorio_id UUID REFERENCES public.relatorios_gerados(id) ON DELETE CASCADE,
  usuario_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  acao TEXT NOT NULL, -- visualizou, baixou, compartilhou
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.logs_relatorios ENABLE ROW LEVEL SECURITY;

-- RLS Policies para profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins e RH podem ver todos os perfis"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'rh')
  );

CREATE POLICY "Gestores podem ver perfis do seu departamento"
  ON public.profiles FOR SELECT
  USING (
    public.has_role(auth.uid(), 'gestor') AND
    departamento = (SELECT departamento FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies para user_roles
CREATE POLICY "Admins podem gerenciar todos os roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Usuários podem ver seus próprios roles"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

-- RLS Policies para métricas
CREATE POLICY "Admins e RH podem ver todas as métricas"
  ON public.metricas FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'rh')
  );

CREATE POLICY "Gestores podem ver métricas"
  ON public.metricas FOR SELECT
  USING (public.has_role(auth.uid(), 'gestor'));

CREATE POLICY "Admins e RH podem inserir/atualizar métricas"
  ON public.metricas FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'rh')
  );

-- RLS Policies para relatórios_gerados
CREATE POLICY "Admins e RH podem ver todos os relatórios"
  ON public.relatorios_gerados FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'rh')
  );

CREATE POLICY "Gestores podem ver relatórios do seu departamento"
  ON public.relatorios_gerados FOR SELECT
  USING (
    public.has_role(auth.uid(), 'gestor') AND
    (departamento = (SELECT departamento FROM public.profiles WHERE id = auth.uid()) OR departamento IS NULL)
  );

CREATE POLICY "Funcionários podem ver seus próprios relatórios"
  ON public.relatorios_gerados FOR SELECT
  USING (gerado_por = auth.uid());

CREATE POLICY "Admins e RH podem criar relatórios"
  ON public.relatorios_gerados FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'rh')
  );

-- RLS Policies para logs_relatorios
CREATE POLICY "Admins podem ver todos os logs"
  ON public.logs_relatorios FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Todos podem inserir logs"
  ON public.logs_relatorios FOR INSERT
  WITH CHECK (usuario_id = auth.uid());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_metricas_updated_at
  BEFORE UPDATE ON public.metricas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir métricas de exemplo para Outubro 2025
INSERT INTO public.metricas (periodo, taxa_presenca, taxa_retencao, satisfacao_interna, tempo_medio_contratacao, indice_absenteismo, custo_medio_funcionario, horas_extras_percentual, indice_eficiencia)
VALUES 
  ('2025-10-01', 96.5, 94.2, 87.8, 28, 3.5, 8500.00, 5.2, 89.3),
  ('2025-09-01', 94.4, 92.7, 84.6, 30, 5.6, 8350.00, 6.8, 86.1),
  ('2025-08-01', 95.8, 93.5, 86.2, 32, 4.2, 8200.00, 5.9, 88.5);


-- Migration: 20251030072931
-- Remover policies restritivas de leitura e criar acesso total para visualização

-- Remover policies antigas de SELECT da tabela metricas
DROP POLICY IF EXISTS "Admins e RH podem ver todas as métricas" ON public.metricas;
DROP POLICY IF EXISTS "Gestores podem ver métricas" ON public.metricas;

-- Criar policy que permite todos os usuários autenticados verem métricas
CREATE POLICY "Usuários autenticados podem ver métricas"
ON public.metricas
FOR SELECT
TO authenticated
USING (true);

-- Remover policies antigas de SELECT da tabela relatorios_gerados
DROP POLICY IF EXISTS "Admins e RH podem ver todos os relatórios" ON public.relatorios_gerados;
DROP POLICY IF EXISTS "Funcionários podem ver seus próprios relatórios" ON public.relatorios_gerados;
DROP POLICY IF EXISTS "Gestores podem ver relatórios do seu departamento" ON public.relatorios_gerados;

-- Criar policy que permite todos os usuários autenticados verem relatórios
CREATE POLICY "Usuários autenticados podem ver relatórios"
ON public.relatorios_gerados
FOR SELECT
TO authenticated
USING (true);

-- Remover policy antiga de SELECT da tabela logs_relatorios
DROP POLICY IF EXISTS "Admins podem ver todos os logs" ON public.logs_relatorios;

-- Criar policy que permite todos os usuários autenticados verem logs
CREATE POLICY "Usuários autenticados podem ver logs"
ON public.logs_relatorios
FOR SELECT
TO authenticated
USING (true);

-- Migration: 20251030073717
-- Corrigir recursão infinita na tabela profiles

-- Criar função security definer para obter o departamento do usuário
CREATE OR REPLACE FUNCTION public.get_user_departamento(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT departamento
  FROM public.profiles
  WHERE id = _user_id
$$;

-- Remover a política problemática
DROP POLICY IF EXISTS "Gestores podem ver perfis do seu departamento" ON public.profiles;

-- Recriar a política usando a função security definer
CREATE POLICY "Gestores podem ver perfis do seu departamento"
ON public.profiles
FOR SELECT
USING (
  has_role(auth.uid(), 'gestor'::app_role) 
  AND departamento = public.get_user_departamento(auth.uid())
);

-- Migration: 20251030073911
-- Adicionar novos campos à tabela metricas para suportar mais indicadores

ALTER TABLE public.metricas
ADD COLUMN IF NOT EXISTS produtividade_equipe numeric,
ADD COLUMN IF NOT EXISTS custo_beneficios numeric,
ADD COLUMN IF NOT EXISTS satisfacao_gestor numeric,
ADD COLUMN IF NOT EXISTS total_folha_pagamento numeric,
ADD COLUMN IF NOT EXISTS total_encargos numeric,
ADD COLUMN IF NOT EXISTS variacao_mensal numeric;

-- Criar tabela para armazenar relatórios customizados
CREATE TABLE IF NOT EXISTS public.relatorios_customizados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  tipo text NOT NULL,
  descricao text,
  filtros jsonb,
  usuario_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  favorito boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.relatorios_customizados ENABLE ROW LEVEL SECURITY;

-- Policies para relatórios customizados
CREATE POLICY "Usuários podem ver seus próprios relatórios customizados"
ON public.relatorios_customizados
FOR SELECT
USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem criar seus próprios relatórios customizados"
ON public.relatorios_customizados
FOR INSERT
WITH CHECK (usuario_id = auth.uid());

CREATE POLICY "Usuários podem atualizar seus próprios relatórios customizados"
ON public.relatorios_customizados
FOR UPDATE
USING (usuario_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus próprios relatórios customizados"
ON public.relatorios_customizados
FOR DELETE
USING (usuario_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_relatorios_customizados_updated_at
BEFORE UPDATE ON public.relatorios_customizados
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
