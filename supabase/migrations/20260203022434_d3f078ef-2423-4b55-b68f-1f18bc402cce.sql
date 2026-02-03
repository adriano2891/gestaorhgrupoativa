-- Criar tabela de dependentes de funcionários
CREATE TABLE public.dependentes_funcionario (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome VARCHAR(100) NOT NULL,
  idade INTEGER,
  tipo_dependencia VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dependentes_funcionario ENABLE ROW LEVEL SECURITY;

-- Create policies for dependentes_funcionario
CREATE POLICY "Admins e RH podem visualizar todos os dependentes"
ON public.dependentes_funcionario
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'rh')
  )
);

CREATE POLICY "Admins e RH podem inserir dependentes"
ON public.dependentes_funcionario
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'rh')
  )
);

CREATE POLICY "Admins e RH podem atualizar dependentes"
ON public.dependentes_funcionario
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'rh')
  )
);

CREATE POLICY "Admins e RH podem deletar dependentes"
ON public.dependentes_funcionario
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'rh')
  )
);

-- Funcionários podem ver seus próprios dependentes
CREATE POLICY "Funcionários podem ver seus próprios dependentes"
ON public.dependentes_funcionario
FOR SELECT
USING (user_id = auth.uid());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dependentes_funcionario_updated_at
BEFORE UPDATE ON public.dependentes_funcionario
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();