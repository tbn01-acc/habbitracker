
-- RLS for telegram_queue (only service_role should write, but allow admin reads)
ALTER TABLE public.telegram_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage telegram queue"
ON public.telegram_queue
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure handle_consent_revoke function exists (idempotent)
CREATE OR REPLACE FUNCTION public.handle_consent_revoke(p_id UUID) 
RETURNS TEXT AS $$
DECLARE rev_count INTEGER;
BEGIN
    SELECT consent_revokes_count INTO rev_count FROM profiles WHERE user_id = p_id;
    IF rev_count >= 2 THEN
        DELETE FROM profiles WHERE user_id = p_id;
        RETURN 'DELETED';
    ELSE
        UPDATE profiles SET consent_revokes_count = rev_count + 1, legal_consents_accepted = FALSE WHERE user_id = p_id;
        RETURN 'BLOCKED';
    END IF;
END; $$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure calculate_subscription_end function exists (idempotent)
CREATE OR REPLACE FUNCTION public.calculate_subscription_end(start_date TIMESTAMP WITH TIME ZONE, period TEXT)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
    RETURN CASE 
        WHEN period = 'month' THEN start_date + INTERVAL '1 month'
        WHEN period = 'quarter' THEN start_date + INTERVAL '3 months'
        WHEN period = 'year' THEN start_date + INTERVAL '1 year'
        ELSE start_date + INTERVAL '1 month'
    END;
END; $$ LANGUAGE plpgsql;
