import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, Crown, User, RefreshCw, Users, Star, Zap } from 'lucide-react';
import { useDevMode, DevPlan, TeamRole } from '@/hooks/useDevMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DevModeToggleProps {
  variant?: 'full' | 'compact';
  onPlanChange?: () => void;
}

const PLANS: { key: DevPlan; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'focus', label: 'Фокус', icon: <User className="w-4 h-4" />, color: '' },
  { key: 'profi', label: 'Профи', icon: <Zap className="w-4 h-4" />, color: 'bg-blue-500 hover:bg-blue-600 text-white' },
  { key: 'premium', label: 'Премиум', icon: <Crown className="w-4 h-4" />, color: 'bg-amber-500 hover:bg-amber-600 text-black' },
  { key: 'team', label: 'Команда', icon: <Users className="w-4 h-4" />, color: 'bg-purple-500 hover:bg-purple-600 text-white' },
];

const TEAM_ROLES: { key: TeamRole; label: string }[] = [
  { key: 'team_owner', label: 'Владелец' },
  { key: 'team_member', label: 'Участник' },
];

export function DevModeToggle({ variant = 'full', onPlanChange }: DevModeToggleProps) {
  const { isDevUser, forcedPlan, teamRole, setDevPlan } = useDevMode();
  const [loading, setLoading] = useState(false);

  if (!isDevUser) return null;

  const handleSetPlan = async (plan: DevPlan, role?: TeamRole) => {
    setLoading(true);
    try {
      await setDevPlan(plan, role);
      const label = PLANS.find(p => p.key === plan)?.label || plan;
      const roleLabel = role ? ` (${TEAM_ROLES.find(r => r.key === role)?.label})` : '';
      toast.success(`Тариф: ${label}${roleLabel}`);
      onPlanChange?.();
      setTimeout(() => window.location.reload(), 500);
    } catch {
      toast.error('Ошибка установки тарифа');
    } finally {
      setLoading(false);
    }
  };

  const currentLabel = PLANS.find(p => p.key === forcedPlan)?.label || 'N/A';

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-28 left-4 z-50"
      >
        <Button
          variant="outline"
          size="sm"
          disabled={loading}
          className="bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20 gap-2"
        >
          <Bug className="w-4 h-4" />
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : currentLabel}
        </Button>
      </motion.div>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Bug className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="font-medium text-foreground flex items-center gap-2">
              Тарифы 2.0
              <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                {currentLabel}
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground">
              Тестовый аккаунт суперадмина
            </p>
          </div>
        </div>

        {/* Plan buttons */}
        <div className="grid grid-cols-2 gap-2">
          {PLANS.map((plan) => (
            <Button
              key={plan.key}
              variant={forcedPlan === plan.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => plan.key === 'team' ? handleSetPlan('team', teamRole) : handleSetPlan(plan.key)}
              disabled={loading}
              className={forcedPlan === plan.key ? plan.color : ''}
            >
              {plan.icon}
              <span className="ml-1">{plan.label}</span>
            </Button>
          ))}
        </div>

        {/* Team role selector — visible when team plan is active */}
        {forcedPlan === 'team' && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Роль в команде:</p>
            <div className="flex gap-2">
              {TEAM_ROLES.map((role) => (
                <Button
                  key={role.key}
                  variant={teamRole === role.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSetPlan('team', role.key)}
                  disabled={loading}
                  className={teamRole === role.key ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}
                >
                  {role.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
