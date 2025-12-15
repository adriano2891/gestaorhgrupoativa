-- Create items/products table for quotes
CREATE TABLE public.itens_orcamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco_base NUMERIC(10, 2) NOT NULL DEFAULT 0,
  categoria TEXT,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.itens_orcamento ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view items" 
ON public.itens_orcamento 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert items" 
ON public.itens_orcamento 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update items" 
ON public.itens_orcamento 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete items" 
ON public.itens_orcamento 
FOR DELETE 
TO authenticated
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_itens_orcamento_updated_at
BEFORE UPDATE ON public.itens_orcamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();