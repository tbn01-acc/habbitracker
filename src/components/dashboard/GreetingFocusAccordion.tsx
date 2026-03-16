import { useState, useCallback } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Brain } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { Task, TOTAL_MINUTES_IN_DAY, TOTAL_DEDUCTIONS } from '@/types/task';
import { cn } from '@/lib/utils';
import { ActivityRings } from './ActivityRings';

interface GreetingFocusAccordionProps {
  userName: string;
  formattedDate: string;
  todayTasks: Task[];
  habitsProgress: number;
  tasksProgress: number;
  financeProgress: number;
  dayQuality: number;
  getGreeting: () => string;
  renderDayPlanIcons: () => React.ReactNode;
}

export function GreetingFocusAccordion({
  userName,
  formattedDate,
  todayTasks,
  habitsProgress,
  tasksProgress,
  financeProgress,
  dayQuality,
  getGreeting,
  renderDayPlanIcons,
}: GreetingFocusAccordionProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [activePanel, setActivePanel] = useState<'greeting' | 'focus'>('greeting');

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x < -threshold && activePanel === 'greeting') {
      setActivePanel('focus');
    } else if (info.offset.x > threshold && activePanel === 'focus') {
      setActivePanel('greeting');
    }
  }, [activePanel]);

  // Focus calc
  const baseFocus = TOTAL_MINUTES_IN_DAY - TOTAL_DEDUCTIONS;
  const totalScheduled = todayTasks
    .filter(t => !t.completed && !t.archivedAt)
    .reduce((sum, t) => sum + (t.duration || 30), 0);
  const available = Math.max(0, baseFocus - totalScheduled);
  const percent = Math.round((available / baseFocus) * 100);
  const hours = Math.floor(available / 60);
  const minutes = available % 60;

  const focusColor = percent > 50 ? 'text-emerald-400' : percent > 25 ? 'text-amber-400' : 'text-red-400';
  const focusBg = percent > 50 ? 'from-emerald-500/20 to-teal-500/10' : percent > 25 ? 'from-amber-500/20 to-orange-500/10' : 'from-red-500/20 to-rose-500/10';
  const focusBarColor = percent > 50 ? 'bg-emerald-400' : percent > 25 ? 'bg-amber-400' : 'bg-red-400';

  const FIXED_HEIGHT = 'h-[110px]';

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl border border-border bg-card shadow-card">
      <div className={cn("flex", FIXED_HEIGHT)}>
        {/* Left spine (Focus) - visible when greeting is active */}
        {activePanel === 'greeting' && (
          <button
            onClick={() => setActivePanel('focus')}
            className="flex flex-col items-center justify-center w-8 bg-gradient-to-b from-emerald-500/30 to-teal-500/20 border-r border-border transition-colors hover:from-emerald-500/40 shrink-0"
          >
            <ChevronLeft className="w-4 h-4 text-emerald-400" />
          </button>
        )}

        {/* Content area */}
        <motion.div
          className={cn("flex-1 overflow-hidden", FIXED_HEIGHT)}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
        >
          <AnimatePresence mode="wait">
            {activePanel === 'greeting' ? (
              <motion.div
                key="greeting"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.2 }}
                className={cn("p-4 flex items-center", FIXED_HEIGHT)}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0">
                    <p className="text-base text-muted-foreground leading-tight">{getGreeting()},</p>
                    <h1 className="text-xl font-bold text-foreground truncate">{userName}!</h1>
                    <p className="text-xs text-muted-foreground capitalize mt-0.5">{formattedDate}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ActivityRings
                      habitsProgress={habitsProgress}
                      tasksProgress={tasksProgress}
                      financeProgress={financeProgress}
                      dayQuality={dayQuality}
                    />
                    {renderDayPlanIcons()}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="focus"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 30 }}
                transition={{ duration: 0.2 }}
                className={cn("p-4 bg-gradient-to-br flex items-center", focusBg, FIXED_HEIGHT)}
              >
                <div className="w-full">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl bg-background/50", focusColor)}>
                      <Brain className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground font-medium">
                        {isRu ? 'Чистое время для фокуса' : 'Focus time remaining'}
                      </p>
                      <div className="flex items-baseline gap-1.5">
                        <span className={cn("text-2xl font-bold tabular-nums", focusColor)}>
                          {hours}<span className="text-base">{isRu ? 'ч' : 'h'}</span> {minutes}<span className="text-base">{isRu ? 'мин' : 'm'}</span>
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs text-muted-foreground">
                        {isRu ? 'Запланировано' : 'Scheduled'}
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {Math.floor(totalScheduled / 60)}{isRu ? 'ч' : 'h'} {totalScheduled % 60}{isRu ? 'мин' : 'm'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-background/30 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className={cn("h-full rounded-full", focusBarColor)}
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right spine (Greeting) - visible when focus is active */}
        {activePanel === 'focus' && (
          <button
            onClick={() => setActivePanel('greeting')}
            className="flex flex-col items-center justify-center w-8 bg-gradient-to-b from-blue-500/30 to-indigo-500/20 border-l border-border transition-colors hover:from-blue-500/40 shrink-0"
          >
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </button>
        )}
      </div>
    </div>
  );
}
