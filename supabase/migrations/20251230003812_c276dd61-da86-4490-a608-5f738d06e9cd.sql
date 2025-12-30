-- Criar enum para tipos de documentos
CREATE TYPE public.documento_tipo AS ENUM ('pdf', 'docx', 'xlsx', 'pptx', 'imagem', 'video', 'audio', 'outro');

-- Tabela principal de categorias de documentos
CREATE TABLE public.documentos_categorias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria_pai_id UUID REFERENCES public.documentos_categorias(id),
  cor TEXT DEFAULT '#3B82F6',
  icone TEXT DEFAULT 'folder',
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela principal de documentos
CREATE TABLE public.documentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.documentos_categorias(id),
  tipo documento_tipo NOT NULL DEFAULT 'outro',
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  arquivo_tamanho BIGINT,
  mime_type TEXT,
  tags TEXT[],
  versao_atual INTEGER NOT NULL DEFAULT 1,
  criado_por UUID REFERENCES public.profiles(id),
  atualizado_por UUID REFERENCES public.profiles(id),
  visualizacoes INTEGER DEFAULT 0,
  publico BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de versões de documentos
CREATE TABLE public.documentos_versoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  versao INTEGER NOT NULL,
  arquivo_url TEXT NOT NULL,
  arquivo_nome TEXT NOT NULL,
  arquivo_tamanho BIGINT,
  alteracoes TEXT,
  criado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de comentários em documentos
CREATE TABLE public.documentos_comentarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  conteudo TEXT NOT NULL,
  parent_id UUID REFERENCES public.documentos_comentarios(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de favoritos
CREATE TABLE public.documentos_favoritos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(documento_id, user_id)
);

-- Tabela de permissões por documento
CREATE TABLE public.documentos_permissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  departamento TEXT,
  pode_visualizar BOOLEAN DEFAULT true,
  pode_editar BOOLEAN DEFAULT false,
  pode_excluir BOOLEAN DEFAULT false,
  pode_comentar BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT user_or_dept CHECK (user_id IS NOT NULL OR departamento IS NOT NULL)
);

-- Tabela de log de acessos
CREATE TABLE public.documentos_acessos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  documento_id UUID NOT NULL REFERENCES public.documentos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  acao TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documentos_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_versoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_comentarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_favoritos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_permissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_acessos ENABLE ROW LEVEL SECURITY;

-- Políticas para categorias (admins e RH podem gerenciar, todos podem ver)
CREATE POLICY "Todos podem ver categorias" ON public.documentos_categorias
  FOR SELECT USING (true);

CREATE POLICY "Admins e RH podem gerenciar categorias" ON public.documentos_categorias
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Políticas para documentos
CREATE POLICY "Usuários podem ver documentos públicos" ON public.documentos
  FOR SELECT USING (publico = true);

CREATE POLICY "Usuários podem ver documentos que criaram" ON public.documentos
  FOR SELECT USING (criado_por = auth.uid());

CREATE POLICY "Admins e RH podem ver todos documentos" ON public.documentos
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Usuários podem ver documentos com permissão" ON public.documentos
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documentos_permissoes dp
      WHERE dp.documento_id = id 
      AND (dp.user_id = auth.uid() OR dp.departamento = (SELECT departamento FROM public.profiles WHERE id = auth.uid()))
      AND dp.pode_visualizar = true
    )
  );

CREATE POLICY "Autenticados podem inserir documentos" ON public.documentos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Criador pode atualizar documento" ON public.documentos
  FOR UPDATE USING (criado_por = auth.uid());

CREATE POLICY "Admins e RH podem atualizar documentos" ON public.documentos
  FOR UPDATE USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Criador pode deletar documento" ON public.documentos
  FOR DELETE USING (criado_por = auth.uid());

CREATE POLICY "Admins podem deletar documentos" ON public.documentos
  FOR DELETE USING (has_role(auth.uid(), 'admin'));

-- Políticas para versões
CREATE POLICY "Usuários podem ver versões de documentos que podem ver" ON public.documentos_versoes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documentos d WHERE d.id = documento_id 
      AND (d.publico = true OR d.criado_por = auth.uid() OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'))
    )
  );

CREATE POLICY "Autenticados podem inserir versões" ON public.documentos_versoes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Políticas para comentários
CREATE POLICY "Usuários podem ver comentários" ON public.documentos_comentarios
  FOR SELECT USING (true);

CREATE POLICY "Autenticados podem comentar" ON public.documentos_comentarios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus comentários" ON public.documentos_comentarios
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Usuários podem deletar seus comentários" ON public.documentos_comentarios
  FOR DELETE USING (user_id = auth.uid() OR has_role(auth.uid(), 'admin'));

-- Políticas para favoritos
CREATE POLICY "Usuários podem ver seus favoritos" ON public.documentos_favoritos
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Usuários podem adicionar favoritos" ON public.documentos_favoritos
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuários podem remover seus favoritos" ON public.documentos_favoritos
  FOR DELETE USING (user_id = auth.uid());

-- Políticas para permissões
CREATE POLICY "Admins e RH podem gerenciar permissões" ON public.documentos_permissoes
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

CREATE POLICY "Criadores podem ver permissões de seus docs" ON public.documentos_permissoes
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.documentos d WHERE d.id = documento_id AND d.criado_por = auth.uid())
  );

-- Políticas para acessos
CREATE POLICY "Sistema pode inserir acessos" ON public.documentos_acessos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins e RH podem ver acessos" ON public.documentos_acessos
  FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Trigger para updated_at
CREATE TRIGGER update_documentos_categorias_updated_at
  BEFORE UPDATE ON public.documentos_categorias
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_updated_at
  BEFORE UPDATE ON public.documentos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documentos_comentarios_updated_at
  BEFORE UPDATE ON public.documentos_comentarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Criar bucket de storage para documentos
INSERT INTO storage.buckets (id, name, public) VALUES ('documentos', 'documentos', true);

-- Políticas de storage
CREATE POLICY "Usuários autenticados podem fazer upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Todos podem ver documentos públicos no storage" ON storage.objects
  FOR SELECT USING (bucket_id = 'documentos');

CREATE POLICY "Usuários podem deletar seus próprios arquivos" ON storage.objects
  FOR DELETE USING (bucket_id = 'documentos' AND auth.uid() IS NOT NULL);