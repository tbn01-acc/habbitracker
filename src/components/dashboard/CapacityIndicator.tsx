import { useMemo } from 'react';
import { Gauge } from 'lucide-react';
import { Task } from '@/types/task';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface CapacityIndicatorProps {
  todayTasks: Task[];
}

export function CapacityIndicator({ todayTasks }: CapacityIndicatorProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';

  const mainCount = useMemo(() => {
    return todayTasks.filter(t => t.isMain && !t.completed && !t.archivedAt).length;
  }, [todayTasks]);

  const { color, bgColor, label } = useMemo(() => {
    if (mainCount <= 1) return {
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/15 border-emerald-500/30',
      label: isRu ? 'Фокус чист' : 'Focused',
    };
    if (mainCount === 2) return {
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/15 border-amber-500/30',
      label: isRu ? 'Много приоритетов' : 'Multiple priorities',
    };
    return {
      color: 'text-red-400',
      bgColor: 'bg-red-500/15 border-red-500/30 animate-pulse',
      label: isRu ? 'Перегрузка! Фокус размыт' : 'Overload! Focus blurred',
    };
  }, [mainCount, isRu]);

  if (mainCount === 0) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold cursor-default transition-all",
          bgColor, color
        )}>
          <Gauge className="w-3.5 h-3.5" />
          <span>{mainCount}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">
          {isRu 
            ? `${mainCount} главн. задач(и) на сегодня` 
            : `${mainCount} main task(s) today`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
