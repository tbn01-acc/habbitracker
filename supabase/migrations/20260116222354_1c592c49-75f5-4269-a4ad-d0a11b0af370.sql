-- ======================================
-- Life Focus Module: Database Schema
-- ======================================

-- 1. Create spheres table with 8 life spheres + 1 uncategorized
CREATE TABLE public.spheres (
  id INTEGER PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  name_es TEXT NOT NULL,
  group_type TEXT NOT NULL CHECK (group_type IN ('personal', 'social', 'system')),
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the 8 spheres + uncategorized (id=0)
INSERT INTO public.spheres (id, key, name_ru, name_en, name_es, group_type, color, icon, sort_order) VALUES
  (0, 'uncategorized', 'Разное', 'Uncategorized', 'Sin categoría', 'system', 'hsl(220, 15%, 50%)', '📦', 0),
  (1, 'body', 'Тело', 'Body', 'Cuerpo', 'personal', 'hsl(15, 75%, 65%)', '💪', 1),
  (2, 'mind', 'Разум', 'Mind', 'Mente', 'personal', 'hsl(35, 85%, 60%)', '🧠', 2),
  (3, 'spirit', 'Дух', 'Spirit', 'Espíritu', 'personal', 'hsl(350, 70%, 75%)', '🧘', 3),
  (4, 'rest', 'Отдых', 'Rest', 'Descanso', 'personal', 'hsl(270, 60%, 70%)', '😴', 4),
  (5, 'work', 'Дело', 'Work', 'Trabajo', 'social', 'hsl(220, 70%, 50%)', '💼', 5),
  (6, 'money', 'Деньги', 'Money', 'Dinero', 'social', 'hsl(200, 20%, 55%)', '💰', 6),
  (7, 'family', 'Семья', 'Family', 'Familia', 'social', 'hsl(145, 60%, 45%)', '👨‍👩‍👧', 7),
  (8, 'social', 'Связи', 'Social', 'Social', 'social', 'hsl(175, 60%, 45%)', '🤝', 8);

-- Enable RLS
ALTER TABLE public.spheres ENABLE ROW LEVEL SECURITY;

-- Everyone can read spheres (they are static reference data)
CREATE POLICY "Spheres are viewable by everyone" 
  ON public.spheres FOR SELECT 
  USING (true);

-- 2. Create global contacts table
CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  description TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contacts" 
  ON public.contacts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contacts" 
  ON public.contacts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts" 
  ON public.contacts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts" 
  ON public.contacts FOR DELETE 
  USING (auth.uid() = user_id);

-- 3. Create contact_spheres junction table (many-to-many)
CREATE TABLE public.contact_spheres (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  sphere_id INTEGER NOT NULL REFERENCES public.spheres(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, sphere_id)
);

-- Enable RLS
ALTER TABLE public.contact_spheres ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contact spheres" 
  ON public.contact_spheres FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact spheres" 
  ON public.contact_spheres FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact spheres" 
  ON public.contact_spheres FOR DELETE 
  USING (auth.uid() = user_id);

-- 4. Create contact_goals junction table (linking contacts to goals)
CREATE TABLE public.contact_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contact_id, goal_id)
);

-- Enable RLS
ALTER TABLE public.contact_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own contact goals" 
  ON public.contact_goals FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own contact goals" 
  ON public.contact_goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contact goals" 
  ON public.contact_goals FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contact goals" 
  ON public.contact_goals FOR DELETE 
  USING (auth.uid() = user_id);

-- 5. Add sphere_id to goals table
ALTER TABLE public.goals 
  ADD COLUMN sphere_id INTEGER REFERENCES public.spheres(id) DEFAULT 0;

-- 6. Add sphere_id to tasks table
ALTER TABLE public.tasks 
  ADD COLUMN sphere_id INTEGER REFERENCES public.spheres(id) DEFAULT 0;

-- 7. Add sphere_id to habits table
ALTER TABLE public.habits 
  ADD COLUMN sphere_id INTEGER REFERENCES public.spheres(id) DEFAULT 0;

-- 8. Add sphere_id to transactions table
ALTER TABLE public.transactions 
  ADD COLUMN sphere_id INTEGER REFERENCES public.spheres(id) DEFAULT 0;

-- 9. Add sphere_id to time_entries table
ALTER TABLE public.time_entries 
  ADD COLUMN sphere_id INTEGER REFERENCES public.spheres(id) DEFAULT 0;

-- 10. Update existing records to use uncategorized sphere (id=0)
UPDATE public.goals SET sphere_id = 0 WHERE sphere_id IS NULL;
UPDATE public.tasks SET sphere_id = 0 WHERE sphere_id IS NULL;
UPDATE public.habits SET sphere_id = 0 WHERE sphere_id IS NULL;
UPDATE public.transactions SET sphere_id = 0 WHERE sphere_id IS NULL;
UPDATE public.time_entries SET sphere_id = 0 WHERE sphere_id IS NULL;

-- 11. Create indexes for better query performance
CREATE INDEX idx_goals_sphere_id ON public.goals(sphere_id);
CREATE INDEX idx_tasks_sphere_id ON public.tasks(sphere_id);
CREATE INDEX idx_habits_sphere_id ON public.habits(sphere_id);
CREATE INDEX idx_transactions_sphere_id ON public.transactions(sphere_id);
CREATE INDEX idx_time_entries_sphere_id ON public.time_entries(sphere_id);
CREATE INDEX idx_contacts_user_id ON public.contacts(user_id);
CREATE INDEX idx_contact_spheres_contact_id ON public.contact_spheres(contact_id);
CREATE INDEX idx_contact_spheres_sphere_id ON public.contact_spheres(sphere_id);
CREATE INDEX idx_contact_goals_contact_id ON public.contact_goals(contact_id);
CREATE INDEX idx_contact_goals_goal_id ON public.contact_goals(goal_id);