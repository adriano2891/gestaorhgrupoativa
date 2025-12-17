-- Add new column for location details (home office name or client name)
ALTER TABLE public.inventario_equipamentos 
ADD COLUMN detalhe_localizacao text;