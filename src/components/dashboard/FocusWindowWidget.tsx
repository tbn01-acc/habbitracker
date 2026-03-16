import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock, Brain } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Task, TOTAL_MINUTES_IN_DAY, TOTAL_DEDUCTIONS } from '@/types/task';
import { cn } from '@/lib/utils';

interface FocusWindowWidgetProps {
  todayTasks: Task[];
}

export function FocusWindowWidget({ todayTasks }: FocusWindowWidgetProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';

  const { availableMinutes, totalScheduled, percent } = useMemo(() => {
    const baseFocus = TOTAL_MINUTES_IN_DAY - TOTAL_DEDUCTIONS; // 540 min = 9h
    const totalScheduled = todayTasks
      .filter(t => !t.completed && !t.archivedAt)
      .reduce((sum, t) => sum + (t.duration || 30), 0); // default 30 min per task
    const available = Math.max(0, baseFocus - totalScheduled);
    const percent = Math.round((available / baseFocus) * 100);
    return { availableMinutes: available, totalScheduled, percent };
  }, [todayTasks]);

  const hours = Math.floor(availableMinutes / 60);
  const minutes = availableMinutes % 60;

  const getColor = () => {
    if (percent > 50) return 'text-emerald-400';
    if (percent > 25) return 'text-amber-400';
    return 'text-red-400';
  };

  const getBgColor = () => {
    if (percent > 50) return 'from-emerald-500/20 to-teal-500/10';
    if (percent > 25) return 'from-amber-500/20 to-orange-500/10';
    return 'from-red-500/20 to-rose-500/10';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-gradient-to-br border border-border p-4 shadow-card",
        getBgColor()
      )}
      style={{ borderRadius: 'var(--radius-card)' }}
    >
      <div className="flex items-center gap-3">
        <div className={cn("p-2 rounded-xl bg-background/50", getColor())}>
          <Brain className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground font-medium">
            {isRu ? 'Чистое время для фокуса' : 'Focus time remaining'}
          </p>
          <div className="flex items-baseline gap-1.5">
            <span className={cn("text-2xl font-bold tabular-nums", getColor())}>
              {hours}<span className="text-base">ч</span> {minutes}<span className="text-base">мин</span>
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground">
            {isRu ? 'Запланировано' : 'Scheduled'}
          </div>
          <div className="text-sm font-semibold text-foreground">
            {Math.floor(totalScheduled / 60)}ч {totalScheduled % 60}мин
          </div>
        </div>
      </div>
      {/* Mini progress bar */}
      <div className="mt-3 h-1.5 rounded-full bg-background/30 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={cn(
            "h-full rounded-full",
            percent > 50 ? "bg-emerald-400" : percent > 25 ? "bg-amber-400" : "bg-red-400"
          )}
        />
      </div>
    </motion.div>
  );
}
