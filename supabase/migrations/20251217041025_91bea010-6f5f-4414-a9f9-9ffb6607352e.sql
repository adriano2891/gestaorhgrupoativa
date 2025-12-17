-- Criar tabela de inventário de equipamentos
CREATE TABLE public.inventario_equipamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_equipamento TEXT NOT NULL UNIQUE,
  nome_equipamento TEXT NOT NULL,
  modelo_marca TEXT,
  cor TEXT,
  localizacao TEXT NOT NULL CHECK (localizacao IN ('central', 'home_office')),
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.inventario_equipamentos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Authenticated users can view equipamentos"
ON public.inventario_equipamentos
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert equipamentos"
ON public.inventario_equipamentos
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update equipamentos"
ON public.inventario_equipamentos
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete equipamentos"
ON public.inventario_equipamentos
FOR DELETE
USING (true);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_inventario_equipamentos_updated_at
BEFORE UPDATE ON public.inventario_equipamentos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();