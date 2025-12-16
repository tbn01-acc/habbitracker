import { useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Award, Target, Flame, Dumbbell, CheckCircle2, Lock, Share2 } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useHabits } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFitness } from '@/hooks/useFitness';
import { format, subMonths, startOfDay, isWithinInterval, parseISO } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

type BadgePeriod = 1 | 3 | 6 | 12;

interface Badge {
  id: string;
  type: 'habits' | 'tasks' | 'exercises';
  period: BadgePeriod;
  target: number;
  earned: boolean;
  progress: number;
  icon: typeof Award;
}

export function Achievements() {
  const { t } = useTranslation();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { workouts, completions } = useFitness();
  const earnedBadgesRef = useRef<Set<string>>(new Set());
  const isFirstRender = useRef(true);

  const badges = useMemo(() => {
    const today = startOfDay(new Date());
    const periods: BadgePeriod[] = [1, 3, 6, 12];
    const result: Badge[] = [];

    periods.forEach(period => {
      const startDate = subMonths(today, period);
      const interval = { start: startDate, end: today };

      // Habits badge
      const habitsCompleted = habits.reduce((sum, h) => {
        return sum + h.completedDates.filter(d => {
          const date = parseISO(d);
          return isWithinInterval(date, interval);
        }).length;
      }, 0);
      const habitsTarget = period * 30;
      result.push({
        id: `habits-${period}`,
        type: 'habits',
        period,
        target: habitsTarget,
        earned: habitsCompleted >= habitsTarget,
        progress: Math.min(100, Math.round((habitsCompleted / habitsTarget) * 100)),
        icon: Target,
      });

      // Tasks badge
      const tasksCompleted = tasks.filter(t => {
        if (!t.completed) return false;
        const dueDate = parseISO(t.dueDate.split('T')[0]);
        return isWithinInterval(dueDate, interval);
      }).length;
      const tasksTarget = period * 20;
      result.push({
        id: `tasks-${period}`,
        type: 'tasks',
        period,
        target: tasksTarget,
        earned: tasksCompleted >= tasksTarget,
        progress: Math.min(100, Math.round((tasksCompleted / tasksTarget) * 100)),
        icon: CheckCircle2,
      });

      // Exercises badge
      const exercisesCompleted = completions.filter(c => {
        const date = parseISO(c.date);
        return isWithinInterval(date, interval);
      }).reduce((sum, c) => sum + c.completedExercises.length, 0);
      const exercisesTarget = period * 40;
      result.push({
        id: `exercises-${period}`,
        type: 'exercises',
        period,
        target: exercisesTarget,
        earned: exercisesCompleted >= exercisesTarget,
        progress: Math.min(100, Math.round((exercisesCompleted / exercisesTarget) * 100)),
        icon: Dumbbell,
      });
    });

    return result;
  }, [habits, tasks, completions]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'habits': return 'habit';
      case 'tasks': return 'task';
      case 'exercises': return 'fitness';
      default: return 'primary';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'habits': return t('habits');
      case 'tasks': return t('tasks');
      case 'exercises': return t('exercises');
      default: return '';
    }
  };

  const getPeriodLabel = (period: BadgePeriod) => {
    switch (period) {
      case 1: return t('months1');
      case 3: return t('months3');
      case 6: return t('months6');
      case 12: return t('months12');
    }
  };

  // Notify on new achievements
  useEffect(() => {
    if (isFirstRender.current) {
      // Initialize with current earned badges on first render
      earnedBadgesRef.current = new Set(badges.filter(b => b.earned).map(b => b.id));
      isFirstRender.current = false;
      return;
    }

    const newlyEarned = badges.filter(b => b.earned && !earnedBadgesRef.current.has(b.id));
    
    if (newlyEarned.length > 0) {
      newlyEarned.forEach(badge => {
        toast.success(`🏆 ${t('newAchievement')} ${getTypeLabel(badge.type)} - ${getPeriodLabel(badge.period)}`, {
          duration: 5000,
        });
      });
    }
    
    earnedBadgesRef.current = new Set(badges.filter(b => b.earned).map(b => b.id));
  }, [badges, t]);

  const shareAchievement = (badge: Badge) => {
    const text = `🏆 ${t('achievementUnlocked')}: ${getTypeLabel(badge.type)} - ${getPeriodLabel(badge.period)}!`;
    const url = window.location.origin;
    
    if (navigator.share) {
      navigator.share({ title: t('achievements'), text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      toast.success(t('linkCopied'));
    }
  };

  const shareAllAchievements = () => {
    const earnedBadges = badges.filter(b => b.earned);
    const text = `🏆 ${t('achievements')}: ${earnedBadges.length}/${badges.length}\n${earnedBadges.map(b => `• ${getTypeLabel(b.type)} - ${getPeriodLabel(b.period)}`).join('\n')}`;
    const url = window.location.origin;
    
    if (navigator.share) {
      navigator.share({ title: t('achievements'), text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text}\n${url}`);
      toast.success(t('linkCopied'));
    }
  };

  const earnedCount = badges.filter(b => b.earned).length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Award className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <div className="text-xl font-bold text-foreground">{earnedCount}/{badges.length}</div>
          <div className="text-sm text-muted-foreground">{t('achievementsEarned')}</div>
        </div>
        {earnedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={shareAllAchievements}
            className="text-xs"
          >
            <Share2 className="w-4 h-4 mr-1" />
            {t('share')}
          </Button>
        )}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-3 gap-3">
        {badges.map((badge, index) => {
          const color = getTypeColor(badge.type);
          const Icon = badge.icon;
          
          return (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`relative p-3 rounded-xl border cursor-pointer ${
                badge.earned 
                  ? `bg-${color}/20 border-${color}/40` 
                  : 'bg-muted/30 border-border'
              }`}
              onClick={() => badge.earned && shareAchievement(badge)}
            >
              {/* Badge Icon */}
              <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
                badge.earned 
                  ? `bg-${color} text-${color}-foreground` 
                  : 'bg-muted text-muted-foreground'
              }`}
              style={badge.earned ? { backgroundColor: `hsl(var(--${color}))` } : undefined}
              >
                {badge.earned ? (
                  <Icon className="w-5 h-5 text-white" />
                ) : (
                  <Lock className="w-4 h-4" />
                )}
              </div>

              {/* Progress Ring (if not earned) */}
              {!badge.earned && (
                <div className="absolute top-2 right-2">
                  <span className="text-[10px] text-muted-foreground">{badge.progress}%</span>
                </div>
              )}

              {/* Share indicator for earned */}
              {badge.earned && (
                <div className="absolute top-2 right-2">
                  <Share2 className="w-3 h-3 text-muted-foreground" />
                </div>
              )}

              {/* Badge Info */}
              <div className="text-center">
                <div className={`text-[10px] font-medium ${
                  badge.earned ? 'text-foreground' : 'text-muted-foreground'
                }`}>
                  {getTypeLabel(badge.type)}
                </div>
                <div className={`text-[10px] ${
                  badge.earned ? 'text-foreground/70' : 'text-muted-foreground/70'
                }`}>
                  {getPeriodLabel(badge.period)}
                </div>
              </div>

              {/* Earned indicator */}
              {badge.earned && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Flame className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
