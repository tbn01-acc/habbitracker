import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gauge, ChevronRight } from 'lucide-react';
import { Task } from '@/types/task';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface FocusDayBannerProps {
  todayTasks: Task[];
}

export function FocusDayBanner({ todayTasks }: FocusDayBannerProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRu = language === 'ru';

  const mainTask = todayTasks.find(t => t.isMain && !t.archivedAt);
  const mainCount = useMemo(() => todayTasks.filter(t => t.isMain && !t.completed && !t.archivedAt).length, [todayTasks]);

  const { indicatorBg } = useMemo(() => {
    if (mainCount <= 1) return { indicatorBg: 'bg-emerald-500' };
    if (mainCount === 2) return { indicatorBg: 'bg-amber-500' };
    return { indicatorBg: 'bg-red-500' };
  }, [mainCount]);

  if (!mainTask) return null;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      onClick={() => navigate('/tasks')}
      className="w-full mb-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-rose-500/10 border border-amber-500/30 p-3 text-left transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5 group"
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
          indicatorBg, "shadow-amber-500/20"
        )}>
          <Gauge className="w-4.5 h-4.5 text-white" />
          <span className="text-xs font-bold text-white ml-0.5">{mainCount}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider text-amber-500 font-semibold mb-0.5">
            {isRu ? 'Фокус дня' : 'Focus of the Day'}
          </p>
          <p className="text-sm font-semibold text-foreground truncate leading-tight">
            {mainTask.icon} {mainTask.name}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-500/60 group-hover:text-amber-500 transition-colors shrink-0" />
      </div>
    </motion.button>
  );
}
