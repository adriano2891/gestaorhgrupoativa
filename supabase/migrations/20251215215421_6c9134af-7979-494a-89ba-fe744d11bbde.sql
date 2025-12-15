-- Create fornecedores table
CREATE TABLE public.fornecedores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT,
  cpf_cnpj TEXT NOT NULL UNIQUE,
  tipo_fornecedor TEXT NOT NULL CHECK (tipo_fornecedor IN ('produto', 'servico', 'ambos')),
  responsavel TEXT NOT NULL,
  telefone TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  condicoes_pagamento TEXT,
  prazo_medio_entrega INTEGER,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create enderecos_fornecedor table
CREATE TABLE public.enderecos_fornecedor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  cep TEXT,
  logradouro TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itens_fornecedor table
CREATE TABLE public.itens_fornecedor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT,
  categoria TEXT,
  valor NUMERIC NOT NULL DEFAULT 0,
  unidade TEXT,
  prazo_entrega INTEGER,
  imagem_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documentos_fornecedor table
CREATE TABLE public.documentos_fornecedor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  fornecedor_id UUID NOT NULL REFERENCES public.fornecedores(id) ON DELETE CASCADE,
  tipo_documento TEXT NOT NULL,
  nome_arquivo TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create historico_precos_fornecedor table for price history
CREATE TABLE public.historico_precos_fornecedor (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.itens_fornecedor(id) ON DELETE CASCADE,
  valor_anterior NUMERIC,
  valor_novo NUMERIC NOT NULL,
  alterado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.fornecedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enderecos_fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itens_fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico_precos_fornecedor ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fornecedores
CREATE POLICY "Authenticated users can view fornecedores" ON public.fornecedores FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert fornecedores" ON public.fornecedores FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update fornecedores" ON public.fornecedores FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete fornecedores" ON public.fornecedores FOR DELETE USING (true);

-- RLS Policies for enderecos_fornecedor
CREATE POLICY "Authenticated users can view enderecos" ON public.enderecos_fornecedor FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert enderecos" ON public.enderecos_fornecedor FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update enderecos" ON public.enderecos_fornecedor FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete enderecos" ON public.enderecos_fornecedor FOR DELETE USING (true);

-- RLS Policies for itens_fornecedor
CREATE POLICY "Authenticated users can view itens" ON public.itens_fornecedor FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert itens" ON public.itens_fornecedor FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update itens" ON public.itens_fornecedor FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete itens" ON public.itens_fornecedor FOR DELETE USING (true);

-- RLS Policies for documentos_fornecedor
CREATE POLICY "Authenticated users can view documentos" ON public.documentos_fornecedor FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert documentos" ON public.documentos_fornecedor FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can delete documentos" ON public.documentos_fornecedor FOR DELETE USING (true);

-- RLS Policies for historico_precos_fornecedor
CREATE POLICY "Authenticated users can view historico" ON public.historico_precos_fornecedor FOR SELECT USING (true);
CREATE POLICY "System can insert historico" ON public.historico_precos_fornecedor FOR INSERT WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_fornecedores_updated_at BEFORE UPDATE ON public.fornecedores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_enderecos_fornecedor_updated_at BEFORE UPDATE ON public.enderecos_fornecedor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_itens_fornecedor_updated_at BEFORE UPDATE ON public.itens_fornecedor FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to record price history
CREATE OR REPLACE FUNCTION public.registrar_historico_preco_fornecedor()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.valor IS DISTINCT FROM OLD.valor THEN
    INSERT INTO public.historico_precos_fornecedor (item_id, valor_anterior, valor_novo, alterado_por)
    VALUES (NEW.id, OLD.valor, NEW.valor, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER registrar_preco_fornecedor BEFORE UPDATE ON public.itens_fornecedor FOR EACH ROW EXECUTE FUNCTION public.registrar_historico_preco_fornecedor();

-- Create storage bucket for supplier documents
INSERT INTO storage.buckets (id, name, public) VALUES ('fornecedores', 'fornecedores', true);

-- Storage policies
CREATE POLICY "Authenticated users can upload supplier files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fornecedores');
CREATE POLICY "Anyone can view supplier files" ON storage.objects FOR SELECT USING (bucket_id = 'fornecedores');
CREATE POLICY "Authenticated users can delete supplier files" ON storage.objects FOR DELETE USING (bucket_id = 'fornecedores');