import { motion } from 'framer-motion';
import { Check, MoreVertical, Flame } from 'lucide-react';
import { Habit } from '@/types/habit';
import { ProgressRing } from './ProgressRing';
import { getTodayString, getWeekDates } from '@/hooks/useHabits';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface HabitCardProps {
  habit: Habit;
  onToggle: (date: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}

export function HabitCard({ habit, onToggle, onEdit, onDelete, index }: HabitCardProps) {
  const today = getTodayString();
  const weekDates = getWeekDates();
  const isCompletedToday = habit.completedDates.includes(today);
  
  const weekProgress = weekDates.filter(date => {
    const dayOfWeek = new Date(date).getDay();
    return habit.targetDays.includes(dayOfWeek) && habit.completedDates.includes(date);
  }).length;
  
  const weekTarget = weekDates.filter(date => {
    const dayOfWeek = new Date(date).getDay();
    return habit.targetDays.includes(dayOfWeek);
  }).length;
  
  const progressPercent = weekTarget > 0 ? (weekProgress / weekTarget) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="bg-card rounded-2xl p-4 shadow-card relative overflow-hidden"
    >
      {/* Background glow when completed */}
      {isCompletedToday && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 opacity-10"
          style={{ background: habit.color }}
        />
      )}
      
      <div className="relative flex items-center gap-4">
        {/* Completion button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onToggle(today)}
          className={`relative w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 ${
            isCompletedToday 
              ? 'text-primary-foreground' 
              : 'bg-muted text-muted-foreground hover:bg-secondary'
          }`}
          style={isCompletedToday ? { background: habit.color } : undefined}
        >
          {isCompletedToday ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            >
              <Check className="w-7 h-7" />
            </motion.div>
          ) : (
            <span className="text-2xl">{habit.icon}</span>
          )}
        </motion.button>

        {/* Habit info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{habit.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            {habit.streak > 0 && (
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-accent/20 text-accent">
                <Flame className="w-3 h-3" />
                {habit.streak}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {weekProgress}/{weekTarget} на этой неделе
            </span>
          </div>
        </div>

        {/* Progress ring */}
        <ProgressRing progress={progressPercent} size={48} strokeWidth={4} color={habit.color}>
          <span className="text-xs font-semibold text-foreground">
            {Math.round(progressPercent)}%
          </span>
        </ProgressRing>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit}>
              Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Week progress dots */}
      <div className="flex justify-between mt-4 px-1">
        {weekDates.map((date, i) => {
          const dayOfWeek = new Date(date).getDay();
          const isTarget = habit.targetDays.includes(dayOfWeek);
          const isCompleted = habit.completedDates.includes(date);
          const isToday = date === today;
          
          return (
            <button
              key={date}
              onClick={() => onToggle(date)}
              disabled={!isTarget}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all ${
                isCompleted
                  ? 'text-primary-foreground'
                  : isTarget
                    ? isToday
                      ? 'bg-secondary text-foreground ring-2 ring-primary/50'
                      : 'bg-secondary text-muted-foreground hover:bg-muted'
                    : 'text-muted-foreground/30'
              }`}
              style={isCompleted ? { background: habit.color } : undefined}
            >
              {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][dayOfWeek]}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
