import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/contexts/LanguageContext';
import { GOAL_COLORS, GOAL_ICONS } from '@/types/goal';
import { cn } from '@/lib/utils';
import { SphereSelector } from '@/components/spheres/SphereSelector';
import { useAuth } from '@/hooks/useAuth';

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export function GoalDialog({ open, onOpenChange, onSave, initialData }: GoalDialogProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const isRussian = language === 'ru';

  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [color, setColor] = useState(initialData?.color || GOAL_COLORS[0]);
  const [icon, setIcon] = useState(initialData?.icon || GOAL_ICONS[0]);
  const [targetDate, setTargetDate] = useState(initialData?.target_date || '');
  const [budgetGoal, setBudgetGoal] = useState(initialData?.budget_goal || '');
  const [timeGoal, setTimeGoal] = useState(initialData?.time_goal_minutes ? String(Math.round(initialData.time_goal_minutes / 60)) : '');
  const [sphereId, setSphereId] = useState<number | null>(initialData?.sphere_id ?? null);

  // Reset form when dialog opens with new data
  useEffect(() => {
    if (open) {
      setName(initialData?.name || '');
      setDescription(initialData?.description || '');
      setColor(initialData?.color || GOAL_COLORS[0]);
      setIcon(initialData?.icon || GOAL_ICONS[0]);
      setTargetDate(initialData?.target_date || '');
      setBudgetGoal(initialData?.budget_goal || '');
      setTimeGoal(initialData?.time_goal_minutes ? String(Math.round(initialData.time_goal_minutes / 60)) : '');
      setSphereId(initialData?.sphere_id ?? null);
    }
  }, [open, initialData]);

  const isValid = name.trim() && (user ? sphereId !== null : true);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) return;

    onSave({
      name: name.trim(),
      description: description.trim() || null,
      color,
      icon,
      target_date: targetDate || null,
      budget_goal: budgetGoal ? parseFloat(budgetGoal) : null,
      time_goal_minutes: timeGoal ? parseInt(timeGoal) * 60 : null,
      sphere_id: sphereId,
      status: 'active',
    });
    // Dialog will be closed by parent after successful save
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData 
              ? (isRussian ? 'Редактировать цель' : 'Edit Goal')
              : (isRussian ? 'Новая цель' : 'New Goal')
            }
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Icon & Color selection */}
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              {icon}
            </div>
            <div className="flex-1 space-y-2">
              <Label>{isRussian ? 'Иконка' : 'Icon'}</Label>
              <div className="flex flex-wrap gap-1">
                {GOAL_ICONS.map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIcon(i)}
                    className={cn(
                      "w-8 h-8 rounded-lg text-lg hover:bg-muted transition-colors",
                      icon === i && "bg-primary/10 ring-2 ring-primary"
                    )}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>{isRussian ? 'Цвет' : 'Color'}</Label>
            <div className="flex gap-2">
              {GOAL_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    color === c && "ring-2 ring-offset-2 ring-primary"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label>{isRussian ? 'Название' : 'Name'}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={isRussian ? 'Например: Выучить английский' : 'e.g., Learn English'}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>{isRussian ? 'Описание' : 'Description'}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isRussian ? 'Опишите вашу цель...' : 'Describe your goal...'}
              rows={2}
            />
          </div>

          {/* Target date */}
          <div className="space-y-2">
            <Label>{isRussian ? 'Целевая дата' : 'Target Date'}</Label>
            <Input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          {/* Budget goal */}
          <div className="space-y-2">
            <Label>{isRussian ? 'Бюджет (₽)' : 'Budget (₽)'}</Label>
            <Input
              type="number"
              value={budgetGoal}
              onChange={(e) => setBudgetGoal(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Time goal */}
          <div className="space-y-2">
            <Label>{isRussian ? 'Время (часов)' : 'Time (hours)'}</Label>
            <Input
              type="number"
              value={timeGoal}
              onChange={(e) => setTimeGoal(e.target.value)}
              placeholder="0"
            />
          </div>

          {/* Sphere - Required */}
          {user && (
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                {isRussian ? 'Сфера жизни' : 'Life Sphere'}
                <span className="text-destructive">*</span>
              </Label>
              <SphereSelector 
                value={sphereId} 
                onChange={setSphereId}
              />
              {sphereId === null && (
                <p className="text-xs text-destructive">
                  {isRussian ? 'Выберите сферу жизни' : 'Please select a life sphere'}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              {isRussian ? 'Отмена' : 'Cancel'}
            </Button>
            <Button type="submit" className="flex-1" disabled={!isValid}>
              {initialData
                ? (isRussian ? 'Сохранить' : 'Save')
                : (isRussian ? 'Создать' : 'Create')
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
