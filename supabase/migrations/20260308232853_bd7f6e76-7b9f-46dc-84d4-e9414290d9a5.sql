-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

-- Schedule daily snapshot at 23:59 Moscow time (20:59 UTC)
SELECT cron.schedule(
  'sprint-daily-snapshot',
  '59 20 * * *',
  $$SELECT public.create_sprint_daily_snapshots()$$
);