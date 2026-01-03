
-- Enum para status do curso
CREATE TYPE public.curso_status AS ENUM ('rascunho', 'publicado', 'arquivado');

-- Enum para nível do curso
CREATE TYPE public.curso_nivel AS ENUM ('basico', 'intermediario', 'avancado');

-- Categorias de cursos
CREATE TABLE public.categorias_curso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT DEFAULT 'book',
  cor TEXT DEFAULT '#3B82F6',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Cursos
CREATE TABLE public.cursos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  categoria_id UUID REFERENCES public.categorias_curso(id) ON DELETE SET NULL,
  nivel curso_nivel DEFAULT 'basico',
  status curso_status DEFAULT 'rascunho',
  capa_url TEXT,
  carga_horaria INTEGER DEFAULT 0, -- em minutos
  instrutor TEXT,
  obrigatorio BOOLEAN DEFAULT false,
  recorrente BOOLEAN DEFAULT false,
  meses_recorrencia INTEGER, -- a cada X meses deve refazer
  nota_minima NUMERIC(5,2) DEFAULT 70, -- nota mínima para aprovação
  departamentos_permitidos TEXT[], -- NULL = todos
  cargos_permitidos TEXT[], -- NULL = todos
  criado_por UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Módulos do curso
CREATE TABLE public.modulos_curso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Aulas
CREATE TABLE public.aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  modulo_id UUID REFERENCES public.modulos_curso(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  video_url TEXT,
  duracao INTEGER DEFAULT 0, -- em segundos
  ordem INTEGER DEFAULT 0,
  tempo_minimo INTEGER, -- tempo mínimo em segundos para marcar como assistida
  material_apoio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Matrículas
CREATE TABLE public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'em_andamento', -- em_andamento, concluido, cancelado
  progresso NUMERIC(5,2) DEFAULT 0,
  data_inicio TIMESTAMPTZ DEFAULT now(),
  data_conclusao TIMESTAMPTZ,
  nota_final NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(curso_id, user_id)
);

-- Progresso das aulas
CREATE TABLE public.progresso_aulas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aula_id UUID REFERENCES public.aulas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  tempo_assistido INTEGER DEFAULT 0, -- em segundos
  posicao_video INTEGER DEFAULT 0, -- posição atual do vídeo
  concluida BOOLEAN DEFAULT false,
  data_conclusao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(aula_id, user_id)
);

-- Avaliações/Quizzes
CREATE TABLE public.avaliacoes_curso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE,
  aula_id UUID REFERENCES public.aulas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  tipo TEXT DEFAULT 'quiz', -- quiz, prova
  tempo_limite INTEGER, -- em minutos, NULL = sem limite
  tentativas_permitidas INTEGER DEFAULT 3,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Perguntas das avaliações
CREATE TABLE public.perguntas_avaliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID REFERENCES public.avaliacoes_curso(id) ON DELETE CASCADE NOT NULL,
  pergunta TEXT NOT NULL,
  tipo TEXT DEFAULT 'multipla_escolha', -- multipla_escolha, verdadeiro_falso, dissertativa
  opcoes JSONB, -- array de opções para múltipla escolha
  resposta_correta TEXT,
  pontuacao NUMERIC(5,2) DEFAULT 1,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tentativas de avaliação
CREATE TABLE public.tentativas_avaliacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avaliacao_id UUID REFERENCES public.avaliacoes_curso(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  respostas JSONB, -- {pergunta_id: resposta}
  nota NUMERIC(5,2),
  aprovado BOOLEAN,
  tempo_gasto INTEGER, -- em segundos
  data_inicio TIMESTAMPTZ DEFAULT now(),
  data_conclusao TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Certificados
CREATE TABLE public.certificados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID REFERENCES public.matriculas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE NOT NULL,
  codigo_validacao TEXT UNIQUE NOT NULL,
  data_emissao TIMESTAMPTZ DEFAULT now(),
  url_certificado TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Avaliações do curso pelos alunos
CREATE TABLE public.feedback_curso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  curso_id UUID REFERENCES public.cursos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  nota INTEGER CHECK (nota >= 1 AND nota <= 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(curso_id, user_id)
);

-- Trilhas de aprendizado
CREATE TABLE public.trilhas_aprendizado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  descricao TEXT,
  icone TEXT DEFAULT 'route',
  cor TEXT DEFAULT '#8B5CF6',
  cursos_ids UUID[], -- ordem dos cursos na trilha
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Logs de acesso para auditoria
CREATE TABLE public.logs_acesso_curso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  curso_id UUID REFERENCES public.cursos(id) ON DELETE SET NULL,
  aula_id UUID REFERENCES public.aulas(id) ON DELETE SET NULL,
  acao TEXT NOT NULL, -- visualizou, iniciou_video, pausou_video, etc
  detalhes JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categorias_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_aulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perguntas_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tentativas_avaliacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_curso ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trilhas_aprendizado ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs_acesso_curso ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Categorias: todos podem ver, admins/RH podem gerenciar
CREATE POLICY "Todos podem ver categorias" ON public.categorias_curso FOR SELECT USING (true);
CREATE POLICY "Admins e RH podem gerenciar categorias" ON public.categorias_curso FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Cursos: publicados para todos, admins/RH gerenciam
CREATE POLICY "Ver cursos publicados" ON public.cursos FOR SELECT USING (
  status = 'publicado' OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh')
);
CREATE POLICY "Admins e RH podem gerenciar cursos" ON public.cursos FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Módulos: visíveis se curso é visível
CREATE POLICY "Ver módulos de cursos publicados" ON public.modulos_curso FOR SELECT USING (
  EXISTS (SELECT 1 FROM cursos WHERE id = modulos_curso.curso_id AND (status = 'publicado' OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh')))
);
CREATE POLICY "Admins e RH podem gerenciar módulos" ON public.modulos_curso FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Aulas: visíveis se módulo é visível
CREATE POLICY "Ver aulas de cursos publicados" ON public.aulas FOR SELECT USING (
  EXISTS (SELECT 1 FROM modulos_curso m JOIN cursos c ON c.id = m.curso_id WHERE m.id = aulas.modulo_id AND (c.status = 'publicado' OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh')))
);
CREATE POLICY "Admins e RH podem gerenciar aulas" ON public.aulas FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Matrículas
CREATE POLICY "Usuários veem suas matrículas" ON public.matriculas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins e RH veem todas matrículas" ON public.matriculas FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));
CREATE POLICY "Usuários podem se matricular" ON public.matriculas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins e RH podem gerenciar matrículas" ON public.matriculas FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));
CREATE POLICY "Usuários podem atualizar suas matrículas" ON public.matriculas FOR UPDATE USING (user_id = auth.uid());

-- Progresso
CREATE POLICY "Usuários veem seu progresso" ON public.progresso_aulas FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins e RH veem todo progresso" ON public.progresso_aulas FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));
CREATE POLICY "Usuários podem inserir progresso" ON public.progresso_aulas FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Usuários podem atualizar progresso" ON public.progresso_aulas FOR UPDATE USING (user_id = auth.uid());

-- Avaliações
CREATE POLICY "Ver avaliações de cursos acessíveis" ON public.avaliacoes_curso FOR SELECT USING (true);
CREATE POLICY "Admins e RH gerenciam avaliações" ON public.avaliacoes_curso FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Perguntas
CREATE POLICY "Ver perguntas" ON public.perguntas_avaliacao FOR SELECT USING (true);
CREATE POLICY "Admins e RH gerenciam perguntas" ON public.perguntas_avaliacao FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Tentativas
CREATE POLICY "Usuários veem suas tentativas" ON public.tentativas_avaliacao FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins e RH veem todas tentativas" ON public.tentativas_avaliacao FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));
CREATE POLICY "Usuários podem criar tentativas" ON public.tentativas_avaliacao FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Usuários podem atualizar tentativas" ON public.tentativas_avaliacao FOR UPDATE USING (user_id = auth.uid());

-- Certificados
CREATE POLICY "Usuários veem seus certificados" ON public.certificados FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins e RH veem todos certificados" ON public.certificados FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));
CREATE POLICY "Sistema pode criar certificados" ON public.certificados FOR INSERT WITH CHECK (true);

-- Feedback
CREATE POLICY "Usuários podem avaliar cursos" ON public.feedback_curso FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Ver feedbacks" ON public.feedback_curso FOR SELECT USING (true);
CREATE POLICY "Usuários podem editar seu feedback" ON public.feedback_curso FOR UPDATE USING (user_id = auth.uid());

-- Trilhas
CREATE POLICY "Ver trilhas ativas" ON public.trilhas_aprendizado FOR SELECT USING (ativo = true OR has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));
CREATE POLICY "Admins e RH gerenciam trilhas" ON public.trilhas_aprendizado FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Logs
CREATE POLICY "Sistema pode inserir logs" ON public.logs_acesso_curso FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins e RH veem logs" ON public.logs_acesso_curso FOR SELECT USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'rh'));

-- Triggers para updated_at
CREATE TRIGGER update_categorias_curso_updated_at BEFORE UPDATE ON public.categorias_curso FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cursos_updated_at BEFORE UPDATE ON public.cursos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modulos_curso_updated_at BEFORE UPDATE ON public.modulos_curso FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_aulas_updated_at BEFORE UPDATE ON public.aulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matriculas_updated_at BEFORE UPDATE ON public.matriculas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_progresso_aulas_updated_at BEFORE UPDATE ON public.progresso_aulas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_trilhas_aprendizado_updated_at BEFORE UPDATE ON public.trilhas_aprendizado FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO public.categorias_curso (nome, descricao, icone, cor) VALUES
  ('Segurança do Trabalho', 'NRs e treinamentos de segurança', 'shield', '#EF4444'),
  ('Desenvolvimento Pessoal', 'Soft skills e crescimento profissional', 'user', '#8B5CF6'),
  ('Técnico', 'Treinamentos técnicos e operacionais', 'wrench', '#F59E0B'),
  ('Compliance', 'LGPD, ética e conformidade', 'file-check', '#10B981'),
  ('Liderança', 'Gestão e desenvolvimento de líderes', 'users', '#3B82F6'),
  ('Onboarding', 'Integração de novos colaboradores', 'door-open', '#EC4899');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.matriculas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.progresso_aulas;
