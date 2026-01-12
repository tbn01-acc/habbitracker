import { useAuth } from './useAuth';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Email that has dev mode access for testing FREE/PRO toggle
const DEV_MODE_EMAIL = 'serge101.pro@gmail.com';

export function useDevMode() {
  const { user } = useAuth();
  const [isDevUser, setIsDevUser] = useState(false);
  const [forcedPlan, setForcedPlan] = useState<'free' | 'pro' | null>(null);

  useEffect(() => {
    if (user?.email === DEV_MODE_EMAIL) {
      setIsDevUser(true);
      // Load saved forced plan from localStorage
      const saved = localStorage.getItem('dev_forced_plan');
      if (saved === 'free' || saved === 'pro') {
        setForcedPlan(saved);
      }
    } else {
      setIsDevUser(false);
      setForcedPlan(null);
    }
  }, [user]);

  const togglePlan = async () => {
    if (!isDevUser) return;
    
    const newPlan = forcedPlan === 'pro' ? 'free' : 'pro';
    setForcedPlan(newPlan);
    localStorage.setItem('dev_forced_plan', newPlan);
    
    // Also update in database for consistency
    if (user) {
      await supabase
        .from('subscriptions')
        .update({ plan: newPlan })
        .eq('user_id', user.id);
    }
    
    return newPlan;
  };

  const setDevPlan = async (plan: 'free' | 'pro') => {
    if (!isDevUser) return;
    
    setForcedPlan(plan);
    localStorage.setItem('dev_forced_plan', plan);
    
    if (user) {
      const updates: any = { plan };
      if (plan === 'pro') {
        // Set expiration to far future for pro
        updates.expires_at = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      } else {
        // Clear pro fields for free
        updates.expires_at = null;
        updates.is_trial = false;
      }
      
      await supabase
        .from('subscriptions')
        .update(updates)
        .eq('user_id', user.id);
    }
  };

  return {
    isDevUser,
    forcedPlan,
    togglePlan,
    setDevPlan,
    DEV_MODE_EMAIL,
  };
}
