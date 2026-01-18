import { Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/contexts/LanguageContext';
import { WidgetType, useDashboardWidgets } from '@/hooks/useDashboardWidgets';

const WIDGET_LABELS: Record<WidgetType, { ru: string; en: string; es: string }> = {
  pomodoro: { ru: 'Помодоро таймер', en: 'Pomodoro Timer', es: 'Temporizador Pomodoro' },
  time_stats: { ru: 'Статистика времени', en: 'Time Statistics', es: 'Estadísticas de tiempo' },
  quick_services: { ru: 'Быстрые сервисы', en: 'Quick Services', es: 'Servicios rápidos' },
  habit_counters: { ru: 'Счётчики привычек', en: 'Habit Counters', es: 'Contadores de hábitos' },
  quick_notes: { ru: 'Быстрые заметки', en: 'Quick Notes', es: 'Notas rápidas' },
};

export function WidgetSettings() {
  const { t, language } = useTranslation();
  const { getAllWidgets, toggleWidget } = useDashboardWidgets();
  
  const widgets = getAllWidgets();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('taskSettings')}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {widgets.map((widget) => (
            <div key={widget.id} className="flex items-center justify-between">
              <Label htmlFor={widget.id} className="flex-1">
                {WIDGET_LABELS[widget.type][language as keyof typeof WIDGET_LABELS.pomodoro] || WIDGET_LABELS[widget.type].en}
              </Label>
              <Switch
                id={widget.id}
                checked={widget.enabled}
                onCheckedChange={() => toggleWidget(widget.type)}
              />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
