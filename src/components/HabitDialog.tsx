import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Habit, HABIT_ICONS, HABIT_COLORS, WEEKDAYS } from '@/types/habit';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HabitDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (habit: Omit<Habit, 'id' | 'createdAt' | 'completedDates' | 'streak'>) => void;
  habit?: Habit | null;
}

export function HabitDialog({ open, onClose, onSave, habit }: HabitDialogProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(HABIT_ICONS[0]);
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [targetDays, setTargetDays] = useState<number[]>([1, 2, 3, 4, 5]);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setIcon(habit.icon);
      setColor(habit.color);
      setTargetDays(habit.targetDays);
    } else {
      setName('');
      setIcon(HABIT_ICONS[0]);
      setColor(HABIT_COLORS[0]);
      setTargetDays([1, 2, 3, 4, 5]);
    }
  }, [habit, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      icon,
      color,
      frequency: 'weekly',
      targetDays,
    });
    onClose();
  };

  const toggleDay = (day: number) => {
    if (targetDays.includes(day)) {
      setTargetDays(targetDays.filter(d => d !== day));
    } else {
      setTargetDays([...targetDays, day]);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 max-h-[90vh] overflow-auto rounded-t-3xl bg-card shadow-lg"
          >
            <div className="sticky top-0 bg-card z-10 px-6 pt-4 pb-2 flex items-center justify-between border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">
                {habit ? 'Редактировать привычку' : 'Новая привычка'}
              </h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Название</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например: Медитация"
                  className="h-12 text-base"
                />
              </div>

              {/* Icon */}
              <div className="space-y-2">
                <Label>Иконка</Label>
                <div className="grid grid-cols-8 gap-2">
                  {HABIT_ICONS.map((i) => (
                    <button
                      key={i}
                      onClick={() => setIcon(i)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        icon === i
                          ? 'bg-primary text-primary-foreground scale-110'
                          : 'bg-secondary hover:bg-muted'
                      }`}
                    >
                      {i}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color */}
              <div className="space-y-2">
                <Label>Цвет</Label>
                <div className="grid grid-cols-8 gap-2">
                  {HABIT_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-10 h-10 rounded-xl transition-all ${
                        color === c ? 'scale-110 ring-2 ring-foreground ring-offset-2 ring-offset-background' : ''
                      }`}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Days */}
              <div className="space-y-2">
                <Label>Дни недели</Label>
                <div className="flex gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.id}
                      onClick={() => toggleDay(day.id)}
                      className={`flex-1 h-12 rounded-xl font-medium transition-all ${
                        targetDays.includes(day.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              {/* Save button */}
              <Button
                onClick={handleSave}
                disabled={!name.trim() || targetDays.length === 0}
                className="w-full h-14 text-base font-semibold gradient-primary text-primary-foreground"
              >
                {habit ? 'Сохранить' : 'Создать привычку'}
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
