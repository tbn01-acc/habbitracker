
-- Fix search_path for calculate_subscription_end
CREATE OR REPLACE FUNCTION public.calculate_subscription_end(start_date TIMESTAMP WITH TIME ZONE, period TEXT)
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
    RETURN CASE 
        WHEN period = 'month' THEN start_date + INTERVAL '1 month'
        WHEN period = 'quarter' THEN start_date + INTERVAL '3 months'
        WHEN period = 'year' THEN start_date + INTERVAL '1 year'
        ELSE start_date + INTERVAL '1 month'
    END;
END;
$$;
