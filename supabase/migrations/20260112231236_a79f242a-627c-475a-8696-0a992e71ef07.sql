-- Add columns for postpone and archive functionality to habits table
ALTER TABLE public.habits 
ADD COLUMN IF NOT EXISTS postpone_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS postponed_until date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL;

-- Add columns to tasks table for postpone
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS postpone_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS postponed_until date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone DEFAULT NULL;

-- Add post_type values for success stories and ideas (already have 'activity' as default)
-- The post_type column already exists with default 'activity'

-- Add votes_count to idea_votes for tracking (already exists on achievement_posts)

-- Create table for user daily activity aggregates (for leaderboard by likes and activity)
-- This already exists as user_daily_activity

-- Add dev_mode flag to specific user for testing
-- We'll handle this in code instead

-- Add notification preference columns if not exist
ALTER TABLE public.notification_settings 
ADD COLUMN IF NOT EXISTS overdue_notification_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS weather_notification_enabled boolean DEFAULT false;