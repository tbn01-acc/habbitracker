import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bug, Crown, User, RefreshCw } from 'lucide-react';
import { useDevMode } from '@/hooks/useDevMode';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface DevModeToggleProps {
  variant?: 'full' | 'compact';
  onPlanChange?: () => void;
}

export function DevModeToggle({ variant = 'full', onPlanChange }: DevModeToggleProps) {
  const { isDevUser, forcedPlan, togglePlan, setDevPlan } = useDevMode();
  const [loading, setLoading] = useState(false);

  if (!isDevUser) return null;

  const handleToggle = async () => {
    setLoading(true);
    try {
      const newPlan = await togglePlan();
      toast.success(`Тариф переключён на ${newPlan?.toUpperCase()}`);
      onPlanChange?.();
      // Force page reload to apply changes
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      toast.error('Ошибка переключения тарифа');
    } finally {
      setLoading(false);
    }
  };

  const handleSetPlan = async (plan: 'free' | 'pro') => {
    setLoading(true);
    try {
      await setDevPlan(plan);
      toast.success(`Тариф установлен: ${plan.toUpperCase()}`);
      onPlanChange?.();
      setTimeout(() => window.location.reload(), 500);
    } catch (err) {
      toast.error('Ошибка установки тарифа');
    } finally {
      setLoading(false);
    }
  };

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
          onClick={handleToggle}
          disabled={loading}
          className="bg-amber-500/10 border-amber-500/30 text-amber-600 hover:bg-amber-500/20 gap-2"
        >
          <Bug className="w-4 h-4" />
          {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
            forcedPlan === 'pro' ? <Crown className="w-4 h-4" /> : <User className="w-4 h-4" />
          )}
          {forcedPlan?.toUpperCase() || 'DEV'}
        </Button>
      </motion.div>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
              <Bug className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="font-medium text-foreground flex items-center gap-2">
                Dev Mode
                <Badge variant="outline" className="border-amber-500/50 text-amber-500">
                  {forcedPlan?.toUpperCase() || 'N/A'}
                </Badge>
              </p>
              <p className="text-xs text-muted-foreground">
                Тестовый аккаунт для переключения тарифов
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={forcedPlan === 'free' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSetPlan('free')}
              disabled={loading}
              className={forcedPlan === 'free' ? 'bg-muted' : ''}
            >
              <User className="w-4 h-4 mr-1" />
              FREE
            </Button>
            <Button
              variant={forcedPlan === 'pro' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSetPlan('pro')}
              disabled={loading}
              className={forcedPlan === 'pro' ? 'bg-amber-500 hover:bg-amber-600' : ''}
            >
              <Crown className="w-4 h-4 mr-1" />
              PRO
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
