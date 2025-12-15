-- Create clients table for quotes
CREATE TABLE public.clientes_orcamentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome_condominio TEXT NOT NULL,
  nome_sindico TEXT NOT NULL,
  email TEXT NOT NULL,
  telefone TEXT,
  cep TEXT,
  rua TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  observacoes TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.clientes_orcamentos ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view clients"
  ON public.clientes_orcamentos
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON public.clientes_orcamentos
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON public.clientes_orcamentos
  FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete clients"
  ON public.clientes_orcamentos
  FOR DELETE
  USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_clientes_orcamentos_updated_at
  BEFORE UPDATE ON public.clientes_orcamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();