import { Calendar, Flame, Tag, Edit2, Trash2, Timer, Repeat } from 'lucide-react';
import { Habit } from '@/types/habit';
import { useTranslation } from '@/contexts/LanguageContext';
import { useUserTags } from '@/hooks/useUserTags';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { ProgressRing } from './ProgressRing';
import { getTodayString, getWeekDates, getCompletedReps } from '@/hooks/useHabits';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface HabitDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit;
  onEdit: () => void;
  onDelete: () => void;
  onTagClick?: (tagId: string) => void;
}

export function HabitDetailDialog({ open, onOpenChange, habit, onEdit, onDelete, onTagClick }: HabitDetailDialogProps) {
  const { t } = useTranslation();
  const { tags: userTags } = useUserTags();
  const { start: startPomodoro, isRunning } = usePomodoro();
  const weekDates = getWeekDates();
  const today = getTodayString();
  
  // Repetitions for today
  const targetReps = habit.targetRepsPerDay || 1;
  const completedReps = getCompletedReps(habit, today);
  const repsPercent = Math.min((completedReps / targetReps) * 100, 100);
  
  // Week progress with repetitions
  const weekProgress = weekDates.reduce((sum, date) => {
    const dayOfWeek = new Date(date).getDay();
    if (!habit.targetDays.includes(dayOfWeek)) return sum;
    const reps = getCompletedReps(habit, date);
    return sum + Math.min(reps / targetReps, 1);
  }, 0);
  
  const weekTarget = weekDates.filter(date => {
    const dayOfWeek = new Date(date).getDay();
    return habit.targetDays.includes(dayOfWeek);
  }).length;
  
  const progressPercent = weekTarget > 0 ? (weekProgress / weekTarget) * 100 : 0;
  const habitTags = userTags.filter(tag => habit.tagIds?.includes(tag.id));
  const handleStartPomodoro = () => {
    if (isRunning) {
      toast.error('Pomodoro уже запущен');
      return;
    }
    startPomodoro(undefined, undefined, habit.id);
    toast.success('Pomodoro запущен!', { description: habit.name });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: habit.color + '30' }}
            >
              {habit.icon}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{habit.name}</h2>
              <p className="text-sm text-muted-foreground font-normal">{t('habit')}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div>
                <p className="text-sm text-muted-foreground">{t('thisWeek')}</p>
                <p className="text-2xl font-bold">{weekProgress}/{weekTarget}</p>
              </div>
              <ProgressRing progress={progressPercent} size={64} strokeWidth={6} color={habit.color}>
                <span className="text-sm font-semibold">{Math.round(progressPercent)}%</span>
              </ProgressRing>
            </div>

            {/* Daily Repetitions */}
            {targetReps > 1 && (
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-3">
                  <Repeat className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('todayReps')}</p>
                    <p className="text-xl font-bold">{completedReps}/{targetReps}</p>
                  </div>
                </div>
                <ProgressRing progress={repsPercent} size={48} strokeWidth={5} color={habit.color}>
                  <span className="text-xs font-semibold">{Math.round(repsPercent)}%</span>
                </ProgressRing>
              </div>
            )}

            {/* Streak */}
            <div className="flex items-center gap-3 p-4 bg-accent/10 rounded-xl">
              <Flame className="w-6 h-6 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">{t('streak')}</p>
                <p className="text-xl font-bold">{habit.streak} {t('days')}</p>
              </div>
            </div>

            {/* Target Days */}
            <div className="p-4 bg-muted/30 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">{t('targetDays')}</span>
              </div>
              <div className="flex gap-2">
                {['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'].map((day, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      habit.targetDays.includes(i) 
                        ? 'text-primary-foreground' 
                        : 'bg-muted text-muted-foreground'
                    }`}
                    style={habit.targetDays.includes(i) ? { backgroundColor: habit.color } : undefined}
                  >
                    {day}
                  </div>
                ))}
              </div>
            </div>

            {/* Tags */}
            {habitTags.length > 0 && (
              <div className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{t('tagsLabel')}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {habitTags.map(tag => (
                    <button
                      key={tag.id}
                      onClick={() => { onTagClick?.(tag.id); onOpenChange(false); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors"
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: tag.color }} />
                      <span className="text-sm">{tag.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Created At */}
            <div className="text-xs text-muted-foreground text-center">
              {t('createdAt')}: {new Date(habit.createdAt).toLocaleDateString()}
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => { onEdit(); onOpenChange(false); }}>
            <Edit2 className="w-4 h-4 mr-2" />
            {t('edit')}
          </Button>
          <Button variant="destructive" onClick={() => { onDelete(); onOpenChange(false); }}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <Button 
          variant="outline" 
          className="w-full mt-2"
          onClick={handleStartPomodoro}
          disabled={isRunning}
        >
          <Timer className="w-4 h-4 mr-2" />
          Запустить Pomodoro
        </Button>
      </DialogContent>
    </Dialog>
  );
}
