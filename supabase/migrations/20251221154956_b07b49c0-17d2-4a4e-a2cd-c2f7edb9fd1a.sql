-- Remove a constraint antiga que não inclui 'cliente'
ALTER TABLE public.inventario_equipamentos DROP CONSTRAINT inventario_equipamentos_localizacao_check;

-- Adiciona a nova constraint incluindo 'cliente' como valor válido
ALTER TABLE public.inventario_equipamentos 
ADD CONSTRAINT inventario_equipamentos_localizacao_check 
CHECK (localizacao = ANY (ARRAY['central'::text, 'home_office'::text, 'cliente'::text]));