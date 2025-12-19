import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Settings2, Coffee, Brain, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { usePomodoro } from '@/hooks/usePomodoro';
import { PomodoroSettings, PomodoroPhase } from '@/types/service';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export function PomodoroTimer() {
  const { t } = useTranslation();
  const {
    settings,
    saveSettings,
    currentPhase,
    timeLeft,
    isRunning,
    completedSessions,
    start,
    pause,
    reset,
    skip,
    setPhase,
    requestNotificationPermission,
    getTodaySessions,
  } = usePomodoro();
  
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<PomodoroSettings>(settings);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseInfo = (phase: PomodoroPhase) => {
    switch (phase) {
      case 'work':
        return { 
          label: t('work') || 'Работа', 
          icon: Brain, 
          color: 'hsl(var(--service))',
          bgClass: 'bg-service/10'
        };
      case 'short_break':
        return { 
          label: t('shortBreak') || 'Короткий перерыв', 
          icon: Coffee, 
          color: 'hsl(var(--success))',
          bgClass: 'bg-success/10'
        };
      case 'long_break':
        return { 
          label: t('longBreak') || 'Длинный перерыв', 
          icon: Zap, 
          color: 'hsl(var(--accent))',
          bgClass: 'bg-accent/10'
        };
    }
  };

  const phaseInfo = getPhaseInfo(currentPhase);
  const PhaseIcon = phaseInfo.icon;
  const progress = timeLeft / (
    currentPhase === 'work' 
      ? settings.workDuration * 60 
      : currentPhase === 'short_break' 
        ? settings.shortBreakDuration * 60 
        : settings.longBreakDuration * 60
  );

  const todaySessions = getTodaySessions();

  const handleSaveSettings = () => {
    saveSettings(tempSettings);
    setSettingsOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Phase selector */}
      <div className="flex justify-center gap-2">
        {(['work', 'short_break', 'long_break'] as PomodoroPhase[]).map((phase) => {
          const info = getPhaseInfo(phase);
          const Icon = info.icon;
          return (
            <button
              key={phase}
              onClick={() => !isRunning && setPhase(phase)}
              disabled={isRunning}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                currentPhase === phase 
                  ? "text-white" 
                  : "text-muted-foreground hover:text-foreground disabled:opacity-50"
              )}
              style={currentPhase === phase ? { backgroundColor: info.color } : undefined}
            >
              <Icon className="w-4 h-4" />
              {info.label}
            </button>
          );
        })}
      </div>

      {/* Timer display */}
      <div className="relative flex justify-center">
        <div className="relative w-64 h-64">
          {/* Progress ring */}
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={phaseInfo.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 45}`}
              strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress)}`}
              initial={false}
              animate={{ strokeDashoffset: `${2 * Math.PI * 45 * (1 - progress)}` }}
              transition={{ duration: 0.5 }}
            />
          </svg>
          
          {/* Timer content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <PhaseIcon className="w-8 h-8 mb-2" style={{ color: phaseInfo.color }} />
            <span className="text-5xl font-bold tracking-tight text-foreground">
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-muted-foreground mt-1">
              {phaseInfo.label}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={reset}
          className="w-12 h-12 rounded-full"
        >
          <RotateCcw className="w-5 h-5" />
        </Button>
        
        <Button
          size="icon"
          onClick={() => isRunning ? pause() : start()}
          className="w-16 h-16 rounded-full"
          style={{ backgroundColor: phaseInfo.color }}
        >
          {isRunning ? (
            <Pause className="w-7 h-7" />
          ) : (
            <Play className="w-7 h-7 ml-1" />
          )}
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={skip}
          className="w-12 h-12 rounded-full"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      {/* Session counter & settings */}
      <div className="flex items-center justify-between px-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{completedSessions}</div>
          <div className="text-xs text-muted-foreground">
            {t('sessionsToday') || 'Сессий сегодня'}
          </div>
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings2 className="w-5 h-5" />
        </Button>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-foreground">{todaySessions.length}</div>
          <div className="text-xs text-muted-foreground">
            {t('pomodorosCompleted') || 'Помодоро выполнено'}
          </div>
        </div>
      </div>

      {/* Settings dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('pomodoroSettings') || 'Настройки Помодоро'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('workDuration') || 'Работа (мин)'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={tempSettings.workDuration}
                  onChange={(e) => setTempSettings({ ...tempSettings, workDuration: parseInt(e.target.value) || 25 })}
                />
              </div>
              <div>
                <Label>{t('shortBreakDuration') || 'Короткий перерыв (мин)'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={tempSettings.shortBreakDuration}
                  onChange={(e) => setTempSettings({ ...tempSettings, shortBreakDuration: parseInt(e.target.value) || 5 })}
                />
              </div>
              <div>
                <Label>{t('longBreakDuration') || 'Длинный перерыв (мин)'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={tempSettings.longBreakDuration}
                  onChange={(e) => setTempSettings({ ...tempSettings, longBreakDuration: parseInt(e.target.value) || 15 })}
                />
              </div>
              <div>
                <Label>{t('sessionsBeforeLongBreak') || 'Сессий до длинного'}</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={tempSettings.sessionsBeforeLongBreak}
                  onChange={(e) => setTempSettings({ ...tempSettings, sessionsBeforeLongBreak: parseInt(e.target.value) || 4 })}
                />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>{t('autoStartBreaks') || 'Авто-старт перерывов'}</Label>
                <Switch
                  checked={tempSettings.autoStartBreaks}
                  onCheckedChange={(checked) => setTempSettings({ ...tempSettings, autoStartBreaks: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>{t('autoStartPomodoros') || 'Авто-старт помодоро'}</Label>
                <Switch
                  checked={tempSettings.autoStartPomodoros}
                  onCheckedChange={(checked) => setTempSettings({ ...tempSettings, autoStartPomodoros: checked })}
                />
              </div>
            </div>
            
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                {t('cancel') || 'Отмена'}
              </Button>
              <Button onClick={handleSaveSettings}>
                {t('save') || 'Сохранить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
