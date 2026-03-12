import { motion } from 'framer-motion';
import { Eye, FlaskConical, Play, Sparkles, X, RotateCcw, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TeamExperienceMode } from '@/hooks/useTeamExperience';

interface DemoModeBannerProps {
  mode: TeamExperienceMode;
  onExit: () => void;
  onSwitchToTest?: () => void;
  onReset?: () => void;
}

export function DemoModeBanner({ mode, onExit, onSwitchToTest, onReset }: DemoModeBannerProps) {
  if (mode === 'real') return null;

  const isDemoMode = mode === 'demo';

  return (
    <motion.div
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -40, opacity: 0 }}
      className={`sticky top-0 z-50 px-4 py-2 flex items-center justify-between gap-2 backdrop-blur-xl border-b text-xs font-medium ${
        isDemoMode
          ? 'bg-primary/10 border-primary/20 text-primary'
          : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
      }`}
    >
      <div className="flex items-center gap-2">
        {isDemoMode ? <Eye className="w-4 h-4" /> : <FlaskConical className="w-4 h-4" />}
        <span>
          {isDemoMode
            ? 'Вы в режиме Просмотра'
            : 'Вы в режиме Песочницы. Данные не сохраняются.'}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        {isDemoMode && onSwitchToTest && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] gap-1 border-primary/30 text-primary hover:bg-primary/10"
            onClick={onSwitchToTest}
          >
            <Play className="w-3 h-3" />
            Тест-драйв
          </Button>
        )}
        {!isDemoMode && onReset && (
          <Button
            size="sm"
            variant="outline"
            className="h-6 text-[10px] gap-1 border-yellow-500/30 text-yellow-500 hover:bg-yellow-500/10"
            onClick={onReset}
          >
            <RotateCcw className="w-3 h-3" />
            Сбросить
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-6 text-[10px] gap-1"
          onClick={onExit}
        >
          <X className="w-3 h-3" />
          Выйти
        </Button>
      </div>
    </motion.div>
  );
}

interface EmptyStateDemoBannerProps {
  onStartDemo: () => void;
  onStartTest: () => void;
}

export function EmptyStateDemoBanner({ onStartDemo, onStartTest }: EmptyStateDemoBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-6 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-primary/10 to-transparent p-5 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-bold">Посмотрите, что сможет ВАША команда!</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Загляните внутрь готовой команды из 12 специалистов. Канбан-доска, Burndown-чарт, пьедестал почёта и 24 задачи — всё работает.
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={onStartDemo} className="gap-1.5">
          <Eye className="w-4 h-4" />
          Посмотреть Демо
        </Button>
        <Button size="sm" variant="outline" onClick={onStartTest} className="gap-1.5">
          <FlaskConical className="w-4 h-4" />
          Тест-драйв (Песочница)
        </Button>
      </div>
    </motion.div>
  );
}
