GRANT SELECT, INSERT, UPDATE, DELETE ON public.ideas TO authenticated;
GRANT ALL ON public.ideas TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.idea_followups TO authenticated;
GRANT ALL ON public.idea_followups TO service_role;