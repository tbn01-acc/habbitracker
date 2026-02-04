// Pomodoro Timer types
export interface PomodoroSettings {
  workDuration: number; // minutes
  shortBreakDuration: number; // minutes
  longBreakDuration: number; // minutes
  sessionsBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
}

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  sessionsBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
};

export type PomodoroPhase = 'work' | 'short_break' | 'long_break';

export interface PomodoroSession {
  id: string;
  taskId?: string;
  subtaskId?: string;
  startTime: string;
  endTime?: string;
  phase: PomodoroPhase;
  completed: boolean;
}

// Time Tracker types
export interface TimeEntry {
  id: string;
  taskId: string;
  subtaskId?: string;
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  description?: string;
  // Goal and sphere linking
  goalId?: string;
  sphereId?: number;
}

// Currency types
export interface CurrencyRate {
  code: string;
  name: string;
  rate: number;
  change?: number;
  symbol: string;
}

export const CURRENCIES = [
  { code: 'USD', name: 'Доллар США', symbol: '$' },
  { code: 'EUR', name: 'Евро', symbol: '€' },
  { code: 'GBP', name: 'Фунт стерлингов', symbol: '£' },
  { code: 'CNY', name: 'Китайский юань', symbol: '¥' },
];
