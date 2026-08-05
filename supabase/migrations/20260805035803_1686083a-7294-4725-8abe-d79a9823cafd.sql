ALTER TABLE public.ideas
  ADD COLUMN IF NOT EXISTS analysis_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS applied_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS reminder_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reminder_interval_days integer NOT NULL DEFAULT 7,
  ADD COLUMN IF NOT EXISTS reminder_time time without time zone NOT NULL DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS reminder_channel text NOT NULL DEFAULT 'push',
  ADD COLUMN IF NOT EXISTS reminder_note text;