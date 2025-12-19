import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  PomodoroSettings, 
  PomodoroPhase, 
  PomodoroSession,
  DEFAULT_POMODORO_SETTINGS 
} from '@/types/service';

const SETTINGS_KEY = 'habitflow_pomodoro_settings';
const SESSIONS_KEY = 'habitflow_pomodoro_sessions';

export function usePomodoro() {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>('work');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_POMODORO_SETTINGS.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>();
  const [currentSubtaskId, setCurrentSubtaskId] = useState<string | undefined>();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  // Load settings and sessions
  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
        setTimeLeft(parsed.workDuration * 60);
      } catch (e) {
        console.error('Failed to parse pomodoro settings:', e);
      }
    }

    const storedSessions = localStorage.getItem(SESSIONS_KEY);
    if (storedSessions) {
      try {
        setSessions(JSON.parse(storedSessions));
      } catch (e) {
        console.error('Failed to parse pomodoro sessions:', e);
      }
    }
  }, []);

  const saveSettings = useCallback((newSettings: PomodoroSettings) => {
    setSettings(newSettings);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(newSettings));
    if (!isRunning) {
      setTimeLeft(newSettings.workDuration * 60);
    }
  }, [isRunning]);

  const saveSessions = useCallback((newSessions: PomodoroSession[]) => {
    setSessions(newSessions);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(newSessions));
  }, []);

  const getPhaseTime = useCallback((phase: PomodoroPhase) => {
    switch (phase) {
      case 'work':
        return settings.workDuration * 60;
      case 'short_break':
        return settings.shortBreakDuration * 60;
      case 'long_break':
        return settings.longBreakDuration * 60;
    }
  }, [settings]);

  const completeSession = useCallback(() => {
    if (sessionStartRef.current && currentPhase === 'work') {
      const newSession: PomodoroSession = {
        id: crypto.randomUUID(),
        taskId: currentTaskId,
        subtaskId: currentSubtaskId,
        startTime: sessionStartRef.current,
        endTime: new Date().toISOString(),
        phase: currentPhase,
        completed: true,
      };
      saveSessions([...sessions, newSession]);
    }
    sessionStartRef.current = null;
  }, [currentPhase, currentTaskId, currentSubtaskId, sessions, saveSessions]);

  const nextPhase = useCallback(() => {
    completeSession();
    
    let nextPhaseType: PomodoroPhase;
    let newCompletedSessions = completedSessions;
    
    if (currentPhase === 'work') {
      newCompletedSessions = completedSessions + 1;
      setCompletedSessions(newCompletedSessions);
      
      if (newCompletedSessions % settings.sessionsBeforeLongBreak === 0) {
        nextPhaseType = 'long_break';
      } else {
        nextPhaseType = 'short_break';
      }
    } else {
      nextPhaseType = 'work';
    }
    
    setCurrentPhase(nextPhaseType);
    setTimeLeft(getPhaseTime(nextPhaseType));
    setIsRunning(false);
    
    // Auto-start if enabled
    if (
      (nextPhaseType !== 'work' && settings.autoStartBreaks) ||
      (nextPhaseType === 'work' && settings.autoStartPomodoros)
    ) {
      setTimeout(() => {
        setIsRunning(true);
        sessionStartRef.current = new Date().toISOString();
      }, 500);
    }
    
    // Play notification sound
    try {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    } catch (e) {}
    
    // Browser notification
    if (Notification.permission === 'granted') {
      new Notification('Pomodoro Timer', {
        body: nextPhaseType === 'work' 
          ? 'Время работать!' 
          : nextPhaseType === 'short_break'
            ? 'Короткий перерыв'
            : 'Длинный перерыв',
        icon: '/pwa-192x192.png'
      });
    }
  }, [currentPhase, completedSessions, settings, getPhaseTime, completeSession]);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            nextPhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, nextPhase]);

  const start = useCallback((taskId?: string, subtaskId?: string) => {
    setCurrentTaskId(taskId);
    setCurrentSubtaskId(subtaskId);
    sessionStartRef.current = new Date().toISOString();
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(getPhaseTime(currentPhase));
    sessionStartRef.current = null;
  }, [currentPhase, getPhaseTime]);

  const skip = useCallback(() => {
    nextPhase();
  }, [nextPhase]);

  const setPhase = useCallback((phase: PomodoroPhase) => {
    if (!isRunning) {
      setCurrentPhase(phase);
      setTimeLeft(getPhaseTime(phase));
    }
  }, [isRunning, getPhaseTime]);

  const requestNotificationPermission = useCallback(async () => {
    if (Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  const getTodaySessions = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return sessions.filter(s => s.startTime.startsWith(today) && s.completed);
  }, [sessions]);

  return {
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
    sessions,
  };
}
