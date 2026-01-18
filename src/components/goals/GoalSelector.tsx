import { useState, useEffect } from 'react';
import { Target } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Goal {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  sphere_id: number | null;
}

interface GoalSelectorProps {
  value: string | null | undefined;
  onChange: (value: string | null, sphereId?: number | null) => void;
  label?: string;
  isRussian?: boolean;
}

export function GoalSelector({ value, onChange, label, isRussian = true }: GoalSelectorProps) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGoals = async () => {
      if (!user) {
        setGoals([]);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('goals')
          .select('id, name, icon, color, sphere_id')
          .eq('user_id', user.id)
          .eq('status', 'active')
          .order('name');

        if (error) throw error;
        setGoals(data || []);
      } catch (err) {
        console.error('Error fetching goals:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGoals();
  }, [user]);

  // Get current goal's sphere_id
  const getGoalSphereId = (goalId: string | null): number | null => {
    if (!goalId) return null;
    const goal = goals.find(g => g.id === goalId);
    return goal?.sphere_id ?? null;
  };

  const handleChange = (val: string) => {
    const goalId = val === 'none' ? null : val;
    const sphereId = getGoalSphereId(goalId);
    onChange(goalId, sphereId);
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          {label || (isRussian ? 'Цель' : 'Goal')}
        </Label>
        <div className="h-10 bg-muted rounded-lg animate-pulse" />
      </div>
    );
  }

  if (goals.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Target className="w-4 h-4" />
        {label || (isRussian ? 'Цель' : 'Goal')}
      </Label>
      <Select
        value={value || 'none'}
        onValueChange={handleChange}
      >
        <SelectTrigger>
          <SelectValue placeholder={isRussian ? 'Без цели' : 'No goal'} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            {isRussian ? 'Без цели' : 'No goal'}
          </SelectItem>
          {goals.map((goal) => (
            <SelectItem key={goal.id} value={goal.id}>
              <div className="flex items-center gap-2">
                {goal.icon && <span>{goal.icon}</span>}
                <span 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: goal.color || 'hsl(262, 80%, 55%)' }}
                />
                {goal.name}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
