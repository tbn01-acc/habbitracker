import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { 
  PomodoroSettings, 
  PomodoroPhase, 
  PomodoroSession,
  DEFAULT_POMODORO_SETTINGS 
} from '@/types/service';
import { supabase } from '@/integrations/supabase/client';

const SETTINGS_KEY = 'habitflow_pomodoro_settings';
const SESSIONS_KEY = 'habitflow_pomodoro_sessions';
const STATE_KEY = 'habitflow_pomodoro_state';

interface PomodoroState {
  currentPhase: PomodoroPhase;
  timeLeft: number;
  isRunning: boolean;
  currentTaskId?: string;
  currentSubtaskId?: string;
  currentHabitId?: string;
  sessionStart?: string;
}

interface PomodoroContextType {
  settings: PomodoroSettings;
  saveSettings: (settings: PomodoroSettings) => void;
  currentPhase: PomodoroPhase;
  timeLeft: number;
  isRunning: boolean;
  completedSessions: number;
  currentTaskId?: string;
  currentSubtaskId?: string;
  currentHabitId?: string;
  start: (taskId?: string, subtaskId?: string, habitId?: string) => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setPhase: (phase: PomodoroPhase) => void;
  requestNotificationPermission: () => Promise<void>;
  getTodaySessions: () => PomodoroSession[];
  getTodayPomodoroTime: () => number;
  getPomodoroTimeByPeriod: (period: 'today' | 'week' | 'month') => number;
  getPomodoroTimeByTask: (period: 'today' | 'week' | 'month') => Record<string, number>;
  sessions: PomodoroSession[];
}

const PomodoroContext = createContext<PomodoroContextType | undefined>(undefined);

export function PomodoroProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PomodoroSettings>(DEFAULT_POMODORO_SETTINGS);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>('work');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_POMODORO_SETTINGS.workDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | undefined>();
  const [currentSubtaskId, setCurrentSubtaskId] = useState<string | undefined>();
  const [currentHabitId, setCurrentHabitId] = useState<string | undefined>();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<string | null>(null);

  // Load settings, sessions, and state
  useEffect(() => {
    const storedSettings = localStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      try {
        const parsed = JSON.parse(storedSettings);
        setSettings(parsed);
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

    // Load running state
    const storedState = localStorage.getItem(STATE_KEY);
    if (storedState) {
      try {
        const state: PomodoroState = JSON.parse(storedState);
        setCurrentPhase(state.currentPhase);
          setIsRunning(state.isRunning);
          setCurrentTaskId(state.currentTaskId);
          setCurrentSubtaskId(state.currentSubtaskId);
          setCurrentHabitId(state.currentHabitId);
        
        if (state.isRunning && state.sessionStart) {
          sessionStartRef.current = state.sessionStart;
          // Calculate remaining time based on elapsed time
          const elapsed = Math.floor((Date.now() - new Date(state.sessionStart).getTime()) / 1000);
          const phaseDuration = state.currentPhase === 'work' 
            ? (JSON.parse(storedSettings || '{}').workDuration || 25) * 60
            : state.currentPhase === 'short_break'
              ? (JSON.parse(storedSettings || '{}').shortBreakDuration || 5) * 60
              : (JSON.parse(storedSettings || '{}').longBreakDuration || 15) * 60;
          const remaining = Math.max(0, phaseDuration - elapsed);
          setTimeLeft(remaining);
        } else {
          setTimeLeft(state.timeLeft);
        }
      } catch (e) {
        console.error('Failed to parse pomodoro state:', e);
        setTimeLeft(settings.workDuration * 60);
      }
    } else {
      setTimeLeft(settings.workDuration * 60);
    }
  }, []);

  // Save state to localStorage whenever it changes
  const saveState = useCallback(() => {
    const state: PomodoroState = {
      currentPhase,
      timeLeft,
      isRunning,
      currentTaskId,
      currentSubtaskId,
      currentHabitId,
      sessionStart: sessionStartRef.current || undefined,
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
    
    // Dispatch storage event for other tabs/components
    window.dispatchEvent(new StorageEvent('storage', {
      key: STATE_KEY,
      newValue: JSON.stringify(state),
    }));
  }, [currentPhase, timeLeft, isRunning, currentTaskId, currentSubtaskId, currentHabitId]);

  // Listen for storage changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STATE_KEY && e.newValue) {
        try {
          const state: PomodoroState = JSON.parse(e.newValue);
          setCurrentPhase(state.currentPhase);
          setTimeLeft(state.timeLeft);
          setIsRunning(state.isRunning);
          setCurrentTaskId(state.currentTaskId);
          setCurrentSubtaskId(state.currentSubtaskId);
          setCurrentHabitId(state.currentHabitId);
          if (state.sessionStart) {
            sessionStartRef.current = state.sessionStart;
          }
        } catch (e) {
          console.error('Failed to parse storage event:', e);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
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

  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
      
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.5);
      }, 300);
    } catch (e) {
      console.error('Failed to play notification sound:', e);
    }
  }, []);

  const triggerVibration = useCallback(() => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (e) {
      console.error('Vibration failed:', e);
    }
  }, []);

  const completeSession = useCallback(async () => {
    if (sessionStartRef.current && currentPhase === 'work') {
      const endTime = new Date().toISOString();
      const startTime = sessionStartRef.current;
      const durationMinutes = Math.floor(
        (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000
      );
      
      const newSession: PomodoroSession = {
        id: crypto.randomUUID(),
        taskId: currentTaskId,
        subtaskId: currentSubtaskId,
        startTime,
        endTime,
        phase: currentPhase,
        completed: true,
      };
      saveSessions([...sessions, newSession]);
      
      // Award stars for completed pomodoro session (minimum 5 minutes)
      const referenceId = currentTaskId || currentHabitId;
      const transactionType = currentHabitId ? 'habit_completion' : 'task_completion';
      
      if (durationMinutes >= 5 && referenceId) {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Check daily limit (max 10 verified tasks per day)
            const today = new Date().toISOString().split('T')[0];
            const { data: dailyData } = await supabase
              .from('daily_verified_tasks')
              .select('verified_count')
              .eq('user_id', user.id)
              .eq('activity_date', today)
              .single();
            
            const currentCount = dailyData?.verified_count || 0;
            if (currentCount < 10) {
              // Award stars: 1 star per 5 minutes, max 5 per session
              const starsToAward = Math.min(Math.floor(durationMinutes / 5), 5);
              
              if (starsToAward > 0) {
                // Insert star transaction
                await supabase.from('star_transactions').insert({
                  user_id: user.id,
                  transaction_type: transactionType,
                  amount: starsToAward,
                  reference_id: referenceId,
                  timer_minutes: durationMinutes,
                  description: currentHabitId 
                    ? `Pomodoro привычка: ${durationMinutes} мин` 
                    : `Pomodoro: ${durationMinutes} min`
                });
                
                // Update user stars
                const { data: userStars } = await supabase
                  .from('user_stars')
                  .select('total_stars')
                  .eq('user_id', user.id)
                  .single();
                
                if (userStars) {
                  await supabase
                    .from('user_stars')
                    .update({ 
                      total_stars: userStars.total_stars + starsToAward,
                      updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.id);
                }
                
                // Update daily verified count
                await supabase.from('daily_verified_tasks').upsert({
                  user_id: user.id,
                  activity_date: today,
                  verified_count: currentCount + 1
                }, { onConflict: 'user_id,activity_date' });
                
                console.log(`Awarded ${starsToAward} stars for ${durationMinutes} min pomodoro (${transactionType})`);
              }
            }
          }
        } catch (err) {
          console.error('Failed to award stars:', err);
        }
      }
    }
    sessionStartRef.current = null;
  }, [currentPhase, currentTaskId, currentSubtaskId, currentHabitId, sessions, saveSessions]);

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
    
    if (
      (nextPhaseType !== 'work' && settings.autoStartBreaks) ||
      (nextPhaseType === 'work' && settings.autoStartPomodoros)
    ) {
      setTimeout(() => {
        setIsRunning(true);
        sessionStartRef.current = new Date().toISOString();
        saveState();
      }, 500);
    }
    
    playNotificationSound();
    triggerVibration();
    
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
  }, [currentPhase, completedSessions, settings, getPhaseTime, completeSession, playNotificationSound, triggerVibration, saveState]);

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

  // Save state when running state changes
  useEffect(() => {
    saveState();
  }, [isRunning, currentPhase, currentTaskId, currentHabitId, saveState]);

  const start = useCallback((taskId?: string, subtaskId?: string, habitId?: string) => {
    setCurrentTaskId(taskId);
    setCurrentSubtaskId(subtaskId);
    setCurrentHabitId(habitId);
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

  const getTodayPomodoroTime = useCallback(() => {
    const todaySessions = getTodaySessions();
    return todaySessions.reduce((sum, s) => {
      if (s.startTime && s.endTime) {
        const duration = Math.floor(
          (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000
        );
        return sum + duration;
      }
      return sum;
    }, 0);
  }, [getTodaySessions]);

  const getPomodoroTimeByPeriod = useCallback((period: 'today' | 'week' | 'month') => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = startOfToday;
        break;
      case 'week':
        startDate = new Date(startOfToday);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(startOfToday);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    return sessions
      .filter(s => s.completed && s.phase === 'work' && new Date(s.startTime) >= startDate)
      .reduce((sum, s) => {
        if (s.startTime && s.endTime) {
          const duration = Math.floor(
            (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000
          );
          return sum + duration;
        }
        return sum;
      }, 0);
  }, [sessions]);

  const getPomodoroTimeByTask = useCallback((period: 'today' | 'week' | 'month') => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let startDate: Date;
    switch (period) {
      case 'today':
        startDate = startOfToday;
        break;
      case 'week':
        startDate = new Date(startOfToday);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(startOfToday);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    const groups: Record<string, number> = {};
    sessions
      .filter(s => s.completed && s.phase === 'work' && new Date(s.startTime) >= startDate)
      .forEach(s => {
        if (s.startTime && s.endTime) {
          const duration = Math.floor(
            (new Date(s.endTime).getTime() - new Date(s.startTime).getTime()) / 1000
          );
          const taskId = s.taskId || 'no_task';
          groups[taskId] = (groups[taskId] || 0) + duration;
        }
      });

    return groups;
  }, [sessions]);

  return (
    <PomodoroContext.Provider value={{
      settings,
      saveSettings,
      currentPhase,
      timeLeft,
      isRunning,
      completedSessions,
      currentTaskId,
      currentSubtaskId,
      currentHabitId,
      start,
      pause,
      reset,
      skip,
      setPhase,
      requestNotificationPermission,
      getTodaySessions,
      getTodayPomodoroTime,
      getPomodoroTimeByPeriod,
      getPomodoroTimeByTask,
      sessions,
    }}>
      {children}
    </PomodoroContext.Provider>
  );
}

export function usePomodoro() {
  const context = useContext(PomodoroContext);
  if (context === undefined) {
    throw new Error('usePomodoro must be used within a PomodoroProvider');
  }
  return context;
}
