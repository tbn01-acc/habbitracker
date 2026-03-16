import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, SkipForward, Settings2, Coffee, Brain, Zap, ListTodo, X, Timer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { useTasks } from '@/hooks/useTasks';
import { PomodoroSettings, PomodoroPhase } from '@/types/service';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

type TimerMode = 'pomodoro' | 'stopwatch';

export function PomodoroTimer() {
  const { t } = useTranslation();
  const {
    settings,
    saveSettings,
    currentPhase,
    timeLeft,
    isRunning,
    completedSessions,
    currentTaskId,
    start,
    pause,
    reset,
    skip,
    setPhase,
    requestNotificationPermission,
    getTodaySessions,
  } = usePomodoro();
  
  const { tasks } = useTasks();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState<PomodoroSettings>(settings);
  const [selectedTaskId, setSelectedTaskId] = useState<string | undefined>(currentTaskId);
  const [timerMode, setTimerMode] = useState<TimerMode>('pomodoro');
  
  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState(0);
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchStartTime, setStopwatchStartTime] = useState<number | null>(null);
  const stopwatchRef = useRef<TimerId | null>(null);

  // Sync with context's currentTaskId
  useEffect(() => {
    setSelectedTaskId(currentTaskId);
  }, [currentTaskId]);

  useEffect(() => {
    setTempSettings(settings);
  }, [settings]);

  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Stopwatch logic with background support
  useEffect(() => {
    if (stopwatchRunning && stopwatchStartTime) {
      // Use interval to update display
      stopwatchRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - stopwatchStartTime) / 1000);
        setStopwatchTime(elapsed);
      }, 100); // Update more frequently for smoother display
      
      // Handle visibility change
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && stopwatchStartTime) {
          const elapsed = Math.floor((Date.now() - stopwatchStartTime) / 1000);
          setStopwatchTime(elapsed);
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      return () => {
        if (stopwatchRef.current) {
          clearInterval(stopwatchRef.current);
        }
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      if (stopwatchRef.current) {
        clearInterval(stopwatchRef.current);
      }
    }
    return () => {
      if (stopwatchRef.current) {
        clearInterval(stopwatchRef.current);
      }
    };
  }, [stopwatchRunning, stopwatchStartTime]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
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
  
  // Get incomplete tasks for selection
  const incompleteTasks = tasks.filter(t => !t.completed);
  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const handleStart = () => {
    if (isRunning) {
      pause();
    } else {
      start(selectedTaskId);
    }
  };

  const handleClearTask = () => {
    if (!isRunning) {
      setSelectedTaskId(undefined);
    }
  };

  const handleSaveSettings = () => {
    saveSettings(tempSettings);
    setSettingsOpen(false);
  };

  // Stopwatch handlers
  const handleStopwatchToggle = () => {
    if (stopwatchRunning) {
      // Pausing - save accumulated time
      setStopwatchRunning(false);
      setStopwatchStartTime(null);
    } else {
      // Starting - record start time, adjusting for already elapsed time
      setStopwatchStartTime(Date.now() - stopwatchTime * 1000);
      setStopwatchRunning(true);
    }
  };

  const handleStopwatchReset = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
    setStopwatchStartTime(null);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <Tabs value={timerMode} onValueChange={(v) => setTimerMode(v as TimerMode)} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pomodoro" className="gap-2">
            <Timer className="w-4 h-4" />
            Помодоро
          </TabsTrigger>
          <TabsTrigger value="stopwatch" className="gap-2">
            <Clock className="w-4 h-4" />
            Секундомер
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pomodoro" className="mt-4 space-y-4">
          {/* Task selector */}
          <div className="px-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Привязанная задача
            </Label>
            <div className="flex gap-2">
              <Select
                value={selectedTaskId || 'none'}
                onValueChange={(value) => !isRunning && setSelectedTaskId(value === 'none' ? undefined : value)}
                disabled={isRunning}
              >
                <SelectTrigger className="flex-1">
                  <div className="flex items-center gap-2 truncate">
                    <ListTodo className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder={t('selectTask') || 'Выберите задачу'} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Без задачи</span>
                  </SelectItem>
                  {incompleteTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <span className="truncate">{task.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTaskId && !isRunning && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClearTask}
                  className="shrink-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {selectedTask && (
              <p className="text-xs text-muted-foreground mt-1 truncate">
                Время будет записано для: {selectedTask.name}
              </p>
            )}
          </div>

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

          {/* Timer display - compact with controls on the right */}
          <div className="flex items-center justify-center gap-6">
            {/* Compact timer ring (1/4 size) */}
            <div className="relative w-32 h-32">
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
                <PhaseIcon className="w-5 h-5 mb-1" style={{ color: phaseInfo.color }} />
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Controls on the right */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={reset}
                className="w-10 h-10 rounded-full"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                size="icon"
                onClick={handleStart}
                className="w-14 h-14 rounded-full"
                style={{ backgroundColor: phaseInfo.color }}
              >
                {isRunning ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
              
              <Button
                variant="outline"
                size="icon"
                onClick={skip}
                className="w-10 h-10 rounded-full"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Session counter & settings */}
          <div className="flex items-center justify-between px-4">
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{completedSessions}</div>
              <div className="text-xs text-muted-foreground">
                {t('sessionsToday') || 'Сессий сегодня'}
              </div>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 className="w-4 h-4" />
            </Button>
            
            <div className="text-center">
              <div className="text-xl font-bold text-foreground">{todaySessions.length}</div>
              <div className="text-xs text-muted-foreground">
                {t('pomodorosCompleted') || 'Помодоро выполнено'}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stopwatch" className="mt-4 space-y-4">
          {/* Task selector for stopwatch */}
          <div className="px-4">
            <Label className="text-xs text-muted-foreground mb-1.5 block">
              Привязанная задача
            </Label>
            <div className="flex gap-2">
              <Select
                value={selectedTaskId || 'none'}
                onValueChange={(value) => !stopwatchRunning && setSelectedTaskId(value === 'none' ? undefined : value)}
                disabled={stopwatchRunning}
              >
                <SelectTrigger className="flex-1">
                  <div className="flex items-center gap-2 truncate">
                    <ListTodo className="w-4 h-4 shrink-0 text-muted-foreground" />
                    <SelectValue placeholder={t('selectTask') || 'Выберите задачу'} />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">Без задачи</span>
                  </SelectItem>
                  {incompleteTasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      <span className="truncate">{task.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stopwatch display */}
          <div className="flex items-center justify-center gap-6">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="6"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 45}`}
                  strokeDashoffset={`${2 * Math.PI * 45 * (1 - (stopwatchTime % 60) / 60)}`}
                />
              </svg>
              
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Clock className="w-5 h-5 mb-1 text-primary" />
                <span className="text-2xl font-bold tracking-tight text-foreground">
                  {formatTime(stopwatchTime)}
                </span>
              </div>
            </div>

            {/* Stopwatch controls */}
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleStopwatchReset}
                className="w-10 h-10 rounded-full"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              
              <Button
                size="icon"
                onClick={handleStopwatchToggle}
                className="w-14 h-14 rounded-full bg-primary hover:bg-primary/90"
              >
                {stopwatchRunning ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </Button>
            </div>
          </div>

          {/* Stopwatch info */}
          <div className="text-center text-sm text-muted-foreground">
            {stopwatchRunning ? 'Секундомер запущен' : 'Секундомер остановлен'}
          </div>
        </TabsContent>
      </Tabs>

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