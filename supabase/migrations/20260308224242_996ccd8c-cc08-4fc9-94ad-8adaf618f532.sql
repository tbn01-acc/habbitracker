
-- Teams table
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT DEFAULT upper(substr(md5(random()::text), 1, 8)),
  max_members INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Team members
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'observer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  presence_status TEXT DEFAULT 'offline' CHECK (presence_status IN ('online', 'focus', 'away', 'offline')),
  UNIQUE(team_id, user_id)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Sprints
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  goal TEXT,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  total_sp_planned INTEGER DEFAULT 0,
  total_sp_completed INTEGER DEFAULT 0,
  xp_pool INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;

-- Sprint participants
CREATE TABLE public.sprint_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'lead', 'observer')),
  sp_contributed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(sprint_id, user_id)
);

ALTER TABLE public.sprint_participants ENABLE ROW LEVEL SECURITY;

-- Sprint daily stats (for burndown chart)
CREATE TABLE public.sprint_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  record_date DATE NOT NULL DEFAULT CURRENT_DATE,
  remaining_sp INTEGER NOT NULL DEFAULT 0,
  completed_sp INTEGER NOT NULL DEFAULT 0,
  UNIQUE(sprint_id, record_date)
);

ALTER TABLE public.sprint_daily_stats ENABLE ROW LEVEL SECURITY;

-- Sprint tasks
CREATE TABLE public.sprint_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in_progress', 'review', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  story_points INTEGER DEFAULT 1,
  assignee_id UUID REFERENCES auth.users(id),
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  sprint_order INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sprint_tasks ENABLE ROW LEVEL SECURITY;

-- Sprint retrospective feedback
CREATE TABLE public.sprint_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  went_well TEXT,
  to_improve TEXT,
  action_items TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.sprint_feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for teams
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create teams" ON public.teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update their teams" ON public.teams
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete their teams" ON public.teams
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS for team_members
CREATE POLICY "Team members can view members" ON public.team_members
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners admins can add members" ON public.team_members
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    ) OR user_id = auth.uid()
  );

CREATE POLICY "Team owners admins can update members" ON public.team_members
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Members can leave or owners can remove" ON public.team_members
  FOR DELETE USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS for sprints
CREATE POLICY "Team members can view sprints" ON public.sprints
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team owners admins can create sprints" ON public.sprints
  FOR INSERT WITH CHECK (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team owners admins can update sprints" ON public.sprints
  FOR UPDATE USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Team owners can delete sprints" ON public.sprints
  FOR DELETE USING (
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role = 'owner'
    )
  );

-- RLS for sprint_participants
CREATE POLICY "Team members can view sprint participants" ON public.sprint_participants
  FOR SELECT USING (
    sprint_id IN (
      SELECT s.id FROM public.sprints s
      JOIN public.team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners admins can manage sprint participants" ON public.sprint_participants
  FOR ALL USING (
    sprint_id IN (
      SELECT s.id FROM public.sprints s
      JOIN public.team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid() AND tm.role IN ('owner', 'admin')
    )
  );

-- RLS for sprint_daily_stats
CREATE POLICY "Team members can view sprint stats" ON public.sprint_daily_stats
  FOR SELECT USING (
    sprint_id IN (
      SELECT s.id FROM public.sprints s
      JOIN public.team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "System can insert sprint stats" ON public.sprint_daily_stats
  FOR INSERT WITH CHECK (true);

-- RLS for sprint_tasks
CREATE POLICY "Team members can view sprint tasks" ON public.sprint_tasks
  FOR SELECT USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team members can create sprint tasks" ON public.sprint_tasks
  FOR INSERT WITH CHECK (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Team members can update sprint tasks" ON public.sprint_tasks
  FOR UPDATE USING (
    team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Task creators and admins can delete sprint tasks" ON public.sprint_tasks
  FOR DELETE USING (
    creator_id = auth.uid() OR
    team_id IN (
      SELECT team_id FROM public.team_members 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- RLS for sprint_feedback
CREATE POLICY "Team members can view feedback" ON public.sprint_feedback
  FOR SELECT USING (
    sprint_id IN (
      SELECT s.id FROM public.sprints s
      JOIN public.team_members tm ON tm.team_id = s.team_id
      WHERE tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own feedback" ON public.sprint_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feedback" ON public.sprint_feedback
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger: update sprint SP when task status changes
CREATE OR REPLACE FUNCTION public.handle_sprint_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'done' AND (OLD.status IS DISTINCT FROM 'done') THEN
    UPDATE public.sprints
    SET total_sp_completed = total_sp_completed + COALESCE(NEW.story_points, 1)
    WHERE id = NEW.sprint_id;

    IF NEW.assignee_id IS NOT NULL THEN
      UPDATE public.sprint_participants
      SET sp_contributed = sp_contributed + COALESCE(NEW.story_points, 1),
          xp_earned = xp_earned + (COALESCE(NEW.story_points, 1) * 10)
      WHERE sprint_id = NEW.sprint_id AND user_id = NEW.assignee_id;

      PERFORM public.add_user_xp(NEW.assignee_id, COALESCE(NEW.story_points, 1) * 10, 'sprint_task');
    END IF;

    NEW.completed_at = NOW();
  ELSIF OLD.status = 'done' AND NEW.status IS DISTINCT FROM 'done' THEN
    UPDATE public.sprints
    SET total_sp_completed = GREATEST(0, total_sp_completed - COALESCE(NEW.story_points, 1))
    WHERE id = NEW.sprint_id;

    IF NEW.assignee_id IS NOT NULL THEN
      UPDATE public.sprint_participants
      SET sp_contributed = GREATEST(0, sp_contributed - COALESCE(NEW.story_points, 1)),
          xp_earned = GREATEST(0, xp_earned - (COALESCE(NEW.story_points, 1) * 10))
      WHERE sprint_id = NEW.sprint_id AND user_id = NEW.assignee_id;
    END IF;

    NEW.completed_at = NULL;
  END IF;

  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_sprint_task_status_change
  BEFORE UPDATE ON public.sprint_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_sprint_task_completion();

-- Function to finish a sprint and award bonuses
CREATE OR REPLACE FUNCTION public.finish_sprint(target_sprint_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  sprint_record RECORD;
  bonus_xp INTEGER;
  success_rate NUMERIC;
  participant_record RECORD;
  result_msg TEXT;
BEGIN
  SELECT * INTO sprint_record FROM public.sprints WHERE id = target_sprint_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sprint not found');
  END IF;

  IF sprint_record.status = 'completed' THEN
    RETURN jsonb_build_object('success', false, 'message', 'Sprint already completed');
  END IF;

  IF sprint_record.total_sp_planned > 0 THEN
    success_rate := (sprint_record.total_sp_completed::NUMERIC / sprint_record.total_sp_planned::NUMERIC) * 100;
  ELSE
    success_rate := 0;
  END IF;

  IF success_rate >= 90 THEN
    bonus_xp := 500;
    result_msg := 'Goal achieved! Team bonus awarded.';
  ELSIF success_rate >= 70 THEN
    bonus_xp := 200;
    result_msg := 'Good result. Partial bonus awarded.';
  ELSE
    bonus_xp := 0;
    result_msg := 'Goal not reached. No milestone bonus.';
  END IF;

  FOR participant_record IN 
    SELECT user_id FROM public.sprint_participants WHERE sprint_id = target_sprint_id
  LOOP
    UPDATE public.sprint_participants 
    SET xp_earned = xp_earned + bonus_xp 
    WHERE sprint_id = target_sprint_id AND user_id = participant_record.user_id;

    IF bonus_xp > 0 THEN
      PERFORM public.add_user_xp(participant_record.user_id, bonus_xp, 'sprint_bonus');
    END IF;
  END LOOP;

  UPDATE public.sprints 
  SET status = 'completed'
  WHERE id = target_sprint_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', result_msg, 
    'success_rate', round(success_rate, 2), 
    'bonus_per_user', bonus_xp
  );
END;
$$;

-- Function to create daily snapshots for burndown
CREATE OR REPLACE FUNCTION public.create_sprint_daily_snapshots()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.sprint_daily_stats (sprint_id, record_date, remaining_sp, completed_sp)
  SELECT 
    s.id,
    CURRENT_DATE,
    COALESCE(SUM(CASE WHEN st.status != 'done' THEN st.story_points ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN st.status = 'done' THEN st.story_points ELSE 0 END), 0)
  FROM public.sprints s
  LEFT JOIN public.sprint_tasks st ON st.sprint_id = s.id
  WHERE s.status = 'active'
  GROUP BY s.id
  ON CONFLICT (sprint_id, record_date) 
  DO UPDATE SET 
    remaining_sp = EXCLUDED.remaining_sp,
    completed_sp = EXCLUDED.completed_sp;
END;
$$;

-- Trigger: auto-update total_sp_planned on task insert/delete
CREATE OR REPLACE FUNCTION public.update_sprint_sp_planned()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.sprints
    SET total_sp_planned = total_sp_planned + COALESCE(NEW.story_points, 1)
    WHERE id = NEW.sprint_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.sprints
    SET total_sp_planned = GREATEST(0, total_sp_planned - COALESCE(OLD.story_points, 1))
    WHERE id = OLD.sprint_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

CREATE TRIGGER on_sprint_task_added
  AFTER INSERT OR DELETE ON public.sprint_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sprint_sp_planned();
