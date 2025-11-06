-- Adicionar campo para marcar solicitações como visualizadas pelo admin
ALTER TABLE public.solicitacoes_ferias 
ADD COLUMN visualizada_admin BOOLEAN NOT NULL DEFAULT false;

-- Adicionar índice para melhorar performance de consultas
CREATE INDEX idx_solicitacoes_visualizada ON public.solicitacoes_ferias(visualizada_admin, status);

-- Habilitar realtime para a tabela de solicitações
ALTER PUBLICATION supabase_realtime ADD TABLE public.solicitacoes_ferias;