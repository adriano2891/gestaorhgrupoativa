
-- Add missing foreign key for remetente_id to enable PostgREST joins
ALTER TABLE public.mensagens_chamado
  ADD CONSTRAINT mensagens_chamado_remetente_id_fkey
  FOREIGN KEY (remetente_id) REFERENCES public.profiles(id);
