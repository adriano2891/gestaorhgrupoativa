-- Habilitar realtime para tabelas existentes
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.registros_ponto;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.metricas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;