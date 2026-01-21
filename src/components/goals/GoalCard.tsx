import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Clock, DollarSign, CheckSquare, Users, MoreVertical, 
  Trash2, Archive, Check, ChevronDown, ChevronUp, Calendar
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { GoalWithStats } from '@/types/goal';
import { useTranslation } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useSpheres } from '@/hooks/useSpheres';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format, parseISO } from 'date-fns';

interface GoalCardProps {
  goal: GoalWithStats;
  index: number;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

export function GoalCard({ goal, index, onUpdate, onDelete, onComplete }: GoalCardProps) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const navigate = useNavigate();
  const { spheres } = useSpheres();
  const [expanded, setExpanded] = useState(false);
  const nameRef = useRef<HTMLDivElement>(null);
  const [needsMarquee, setNeedsMarquee] = useState(false);

  const goalSphere = spheres.find(s => s.id === (goal as any).sphere_id);

  const progress = goal.tasks_count > 0 
    ? Math.round((goal.tasks_completed / goal.tasks_count) * 100)
    : goal.progress_percent;

  // Check if name needs marquee
  useEffect(() => {
    if (nameRef.current) {
      setNeedsMarquee(nameRef.current.scrollWidth > nameRef.current.clientWidth);
    }
  }, [goal.name]);

  const isCompleted = goal.status === 'completed';
  const isArchived = goal.status === 'archived';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "bg-card shadow-card border border-border transition-all overflow-hidden",
        (isCompleted || isArchived) && "opacity-60"
      )}
      style={{ 
        borderRadius: 'var(--radius-card)', 
        borderLeftColor: goal.color, 
        borderLeftWidth: 4 
      }}
    >
      {/* Row 1: Icon, Name, Progress %, Chevron */}
      <div 
        className="flex items-center gap-2 p-3 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Icon */}
        <span className="text-lg flex-shrink-0">{goal.icon}</span>

        {/* Name with marquee if needed */}
        <div 
          ref={nameRef}
          className={cn(
            "flex-1 min-w-0 font-medium text-foreground overflow-hidden whitespace-nowrap",
            isCompleted && "line-through text-muted-foreground",
            needsMarquee && !expanded && "animate-marquee"
          )}
        >
          {goal.name}
        </div>

        {/* Progress percent */}
        <span className="text-sm font-medium text-muted-foreground flex-shrink-0">
          {progress}%
        </span>

        {/* Chevron */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="p-1 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
        >
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Row 2: Progress bar */}
            <div className="px-3 pb-2" onClick={(e) => e.stopPropagation()}>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Row 3: Stats - Tasks, Habits, Budget, Time, Contacts */}
            <div className="flex items-center gap-3 px-3 pb-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <CheckSquare className="w-3.5 h-3.5" />
                <span>{goal.tasks_completed}/{goal.tasks_count}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="w-3.5 h-3.5" />
                <span>{goal.habits_count}</span>
              </div>
              {goal.total_spent > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{goal.total_spent.toLocaleString()}₽</span>
                </div>
              )}
              {goal.total_time_minutes > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{Math.round(goal.total_time_minutes / 60)}ч</span>
                </div>
              )}
              {goal.contacts_count > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3.5 h-3.5" />
                  <span>{goal.contacts_count}</span>
                </div>
              )}

              {/* Menu */}
              <div className="ml-auto">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => navigate(`/goals/${goal.id}`)}>
                      <Target className="w-4 h-4 mr-2" />
                      {isRussian ? 'Открыть' : 'Open'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onComplete(goal.id)}>
                      <Check className="w-4 h-4 mr-2" />
                      {isRussian ? 'Завершить' : 'Complete'}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onUpdate(goal.id, { status: 'archived', archived_at: new Date().toISOString() })}>
                      <Archive className="w-4 h-4 mr-2" />
                      {isRussian ? 'Архивировать' : 'Archive'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(goal.id)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {isRussian ? 'Удалить' : 'Delete'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Row 4: Sphere, Target Date, Description */}
            <div className="flex items-center gap-1.5 px-3 pb-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
              {goalSphere && (
                <span 
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: goalSphere.color + '20', color: goalSphere.color }}
                >
                  {goalSphere.icon} {isRussian ? goalSphere.name_ru : goalSphere.name_en}
                </span>
              )}
              {goal.target_date && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(parseISO(goal.target_date), 'dd.MM.yyyy')}
                </span>
              )}
              {goal.budget_goal && goal.budget_goal > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {isRussian ? 'Бюджет:' : 'Budget:'} {goal.budget_goal.toLocaleString()}₽
                </span>
              )}
              {goal.time_goal_minutes && goal.time_goal_minutes > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {isRussian ? 'Время:' : 'Time:'} {Math.round(goal.time_goal_minutes / 60)}ч
                </span>
              )}
            </div>

            {/* Row 5: Description (if exists) */}
            {goal.description && (
              <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {goal.description}
                </p>
              </div>
            )}

            {/* Row 6: Open button */}
            <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => navigate(`/goals/${goal.id}`)}
                className="w-full py-2 text-xs font-medium rounded-lg bg-muted hover:bg-muted/80 transition-colors"
              >
                {isRussian ? 'Открыть цель' : 'Open Goal'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom progress bar (collapsed state) */}
      {!expanded && (
        <div className="h-1 bg-muted">
          <div 
            className="h-full transition-all duration-300"
            style={{ 
              width: `${progress}%`,
              backgroundColor: goal.color 
            }}
          />
        </div>
      )}
    </motion.div>
  );
}
