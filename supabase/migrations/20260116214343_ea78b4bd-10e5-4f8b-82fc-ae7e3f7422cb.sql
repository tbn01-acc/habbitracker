-- Enable pg_cron and pg_net extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant usage to postgres role
GRANT USAGE ON SCHEMA cron TO postgres;

-- Schedule the cleanup function to run daily at 3:00 AM
SELECT cron.schedule(
  'cleanup-old-notifications-daily',
  '0 3 * * *', -- Every day at 3:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://jexrtsyokhegjxnvqjur.supabase.co/functions/v1/cleanup-old-notifications',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHJ0c3lva2hlZ2p4bnZxanVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0MDA4MTcsImV4cCI6MjA4MDk3NjgxN30.tI3L5GGJMtlXwlNEM-6EsxyQ5BRNrsoP-jk4mzD01_o"}'::jsonb,
      body := '{}'::jsonb
    ) AS request_id;
  $$
);