import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Email that has dev mode access for testing plan toggle
const DEV_MODE_EMAIL = 'serge101.pro@gmail.com';

export type DevPlan = 'focus' | 'profi' | 'premium' | 'team';
export type TeamRole = 'team_owner' | 'team_member';

// Map dev plans to subscription plan values
const PLAN_TO_SUB: Record<DevPlan, 'free' | 'pro'> = {
  focus: 'free',
  profi: 'pro',
  premium: 'pro',
  team: 'pro',
};

export function useDevMode() {
  const { user } = useAuth();
  const [isDevUser, setIsDevUser] = useState(false);
  const [forcedPlan, setForcedPlan] = useState<DevPlan | null>(null);
  const [teamRole, setTeamRole] = useState<TeamRole>('team_owner');

  useEffect(() => {
    if (user?.email === DEV_MODE_EMAIL) {
      setIsDevUser(true);
      const saved = localStorage.getItem('dev_forced_plan') as DevPlan | null;
      if (saved && ['focus', 'profi', 'premium', 'team'].includes(saved)) {
        setForcedPlan(saved);
      }
      const savedRole = localStorage.getItem('dev_team_role') as TeamRole | null;
      if (savedRole && ['team_owner', 'team_member'].includes(savedRole)) {
        setTeamRole(savedRole);
      }
    } else {
      setIsDevUser(false);
      setForcedPlan(null);
    }
  }, [user]);

  const setDevPlan = async (plan: DevPlan, role?: TeamRole) => {
    if (!isDevUser || !user) return;

    setForcedPlan(plan);
    localStorage.setItem('dev_forced_plan', plan);

    if (role) {
      setTeamRole(role);
      localStorage.setItem('dev_team_role', role);
    }

    const subPlan = PLAN_TO_SUB[plan];
    const updates: any = { plan: subPlan };

    if (subPlan === 'pro') {
      updates.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      updates.expires_at = null;
      updates.is_trial = false;
    }

    await supabase
      .from('subscriptions')
      .update(updates)
      .eq('user_id', user.id);

    // Update user_roles for team plan
    if (plan === 'team') {
      const selectedRole = role || teamRole;
      // Remove existing team/admin roles, then insert
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);

      await supabase
        .from('user_roles')
        .insert({ user_id: user.id, role: selectedRole === 'team_owner' ? 'admin' : 'team' });
    } else {
      // Remove team roles for non-team plans
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
    }
  };

  return {
    isDevUser,
    forcedPlan,
    teamRole,
    setDevPlan,
    DEV_MODE_EMAIL,
  };
}
