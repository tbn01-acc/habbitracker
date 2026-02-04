export interface Goal {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  color: string;
  icon: string;
  target_date?: string | null;
  budget_goal?: number | null;
  time_goal_minutes?: number | null;
  status: 'active' | 'completed' | 'paused' | 'archived';
  progress_percent: number;
  sphere_id?: number | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  archived_at?: string | null;
}

export interface GoalContact {
  id: string;
  goal_id: string;
  user_id: string;
  contact_name: string;
  contact_type?: string | null;
  contact_info?: string | null;
  notes?: string | null;
  created_at: string;
}

export interface GoalWithStats extends Goal {
  tasks_count: number;
  tasks_completed: number;
  habits_count: number;
  total_spent: number;
  total_time_minutes: number;
  contacts_count: number;
}

export const GOAL_COLORS = [
  'hsl(262, 80%, 55%)', // purple
  'hsl(200, 80%, 50%)', // blue
  'hsl(168, 80%, 40%)', // teal
  'hsl(35, 95%, 55%)',  // orange
  'hsl(340, 80%, 55%)', // pink
  'hsl(145, 70%, 45%)', // green
  'hsl(45, 90%, 50%)',  // yellow
  'hsl(0, 70%, 55%)',   // red
];

export const GOAL_ICONS = [
  '🎯', '🏆', '💪', '🚀', '💼', '🎓', '💰', '🏠',
  '✈️', '❤️', '🧘', '📚', '🎨', '🏋️', '🎵', '🌟'
];
