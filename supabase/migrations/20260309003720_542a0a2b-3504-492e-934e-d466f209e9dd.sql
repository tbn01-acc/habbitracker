
-- 1. Add new role values to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'focus';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'profi';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'premium';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_member';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'team_owner';
