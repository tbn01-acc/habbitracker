-- Create a table to store public productivity stats that anyone can view
CREATE TABLE public.user_productivity_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  unique_habits_count INTEGER NOT NULL DEFAULT 0,
  tasks_completed_count INTEGER NOT NULL DEFAULT 0,
  goals_achieved_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_productivity_stats ENABLE ROW LEVEL SECURITY;

-- Anyone can view productivity stats (public)
CREATE POLICY "Anyone can view productivity stats"
  ON public.user_productivity_stats
  FOR SELECT
  USING (true);

-- Users can insert their own stats
CREATE POLICY "Users can insert their own stats"
  ON public.user_productivity_stats
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own stats
CREATE POLICY "Users can update their own stats"
  ON public.user_productivity_stats
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_productivity_stats_user_id ON public.user_productivity_stats(user_id);

-- Create function to update productivity stats
CREATE OR REPLACE FUNCTION public.update_user_productivity_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_unique_habits INTEGER;
  v_tasks_completed INTEGER;
  v_goals_achieved INTEGER;
BEGIN
  -- Get the user_id from the trigger
  IF TG_OP = 'DELETE' THEN
    v_user_id := OLD.user_id;
  ELSE
    v_user_id := NEW.user_id;
  END IF;

  -- Count unique habits with at least one completion
  SELECT COUNT(*) INTO v_unique_habits
  FROM public.habits
  WHERE user_id = v_user_id
    AND archived_at IS NULL
    AND array_length(completed_dates, 1) > 0;

  -- Count completed tasks
  SELECT COUNT(*) INTO v_tasks_completed
  FROM public.tasks
  WHERE user_id = v_user_id
    AND completed = true;

  -- Count achieved goals
  SELECT COUNT(*) INTO v_goals_achieved
  FROM public.goals
  WHERE user_id = v_user_id
    AND status = 'completed';

  -- Upsert the stats
  INSERT INTO public.user_productivity_stats (user_id, unique_habits_count, tasks_completed_count, goals_achieved_count, updated_at)
  VALUES (v_user_id, COALESCE(v_unique_habits, 0), COALESCE(v_tasks_completed, 0), COALESCE(v_goals_achieved, 0), now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    unique_habits_count = COALESCE(v_unique_habits, 0),
    tasks_completed_count = COALESCE(v_tasks_completed, 0),
    goals_achieved_count = COALESCE(v_goals_achieved, 0),
    updated_at = now();

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for habits
CREATE TRIGGER update_productivity_stats_on_habit_change
AFTER INSERT OR UPDATE OR DELETE ON public.habits
FOR EACH ROW EXECUTE FUNCTION public.update_user_productivity_stats();

-- Create triggers for tasks
CREATE TRIGGER update_productivity_stats_on_task_change
AFTER INSERT OR UPDATE OR DELETE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_user_productivity_stats();

-- Create triggers for goals
CREATE TRIGGER update_productivity_stats_on_goal_change
AFTER INSERT OR UPDATE OR DELETE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.update_user_productivity_stats();

-- Initialize stats for existing users
INSERT INTO public.user_productivity_stats (user_id, unique_habits_count, tasks_completed_count, goals_achieved_count)
SELECT 
  p.user_id,
  COALESCE((
    SELECT COUNT(*) 
    FROM public.habits h 
    WHERE h.user_id = p.user_id 
      AND h.archived_at IS NULL 
      AND array_length(h.completed_dates, 1) > 0
  ), 0) as unique_habits_count,
  COALESCE((
    SELECT COUNT(*) 
    FROM public.tasks t 
    WHERE t.user_id = p.user_id 
      AND t.completed = true
  ), 0) as tasks_completed_count,
  COALESCE((
    SELECT COUNT(*) 
    FROM public.goals g 
    WHERE g.user_id = p.user_id 
      AND g.status = 'completed'
  ), 0) as goals_achieved_count
FROM public.profiles p
ON CONFLICT (user_id) DO UPDATE SET
  unique_habits_count = EXCLUDED.unique_habits_count,
  tasks_completed_count = EXCLUDED.tasks_completed_count,
  goals_achieved_count = EXCLUDED.goals_achieved_count,
  updated_at = now();