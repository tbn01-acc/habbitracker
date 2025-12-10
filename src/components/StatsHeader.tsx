import { motion } from 'framer-motion';
import { Calendar, Flame, Target } from 'lucide-react';
import { Habit } from '@/types/habit';
import { getTodayString, getWeekDates } from '@/hooks/useHabits';
import { ProgressRing } from './ProgressRing';

interface StatsHeaderProps {
  habits: Habit[];
}

export function StatsHeader({ habits }: StatsHeaderProps) {
  const today = getTodayString();
  const weekDates = getWeekDates();
  
  // Today's stats
  const todayTasks = habits.filter(h => {
    const dayOfWeek = new Date(today).getDay();
    return h.targetDays.includes(dayOfWeek);
  });
  const completedToday = todayTasks.filter(h => h.completedDates.includes(today)).length;
  const todayProgress = todayTasks.length > 0 ? (completedToday / todayTasks.length) * 100 : 0;
  
  // Total streak
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
  
  // Week stats
  const weekCompleted = habits.reduce((sum, h) => {
    return sum + weekDates.filter(date => {
      const dayOfWeek = new Date(date).getDay();
      return h.targetDays.includes(dayOfWeek) && h.completedDates.includes(date);
    }).length;
  }, 0);
  
  const weekTarget = habits.reduce((sum, h) => {
    return sum + weekDates.filter(date => {
      const dayOfWeek = new Date(date).getDay();
      return h.targetDays.includes(dayOfWeek);
    }).length;
  }, 0);

  const stats = [
    {
      icon: Flame,
      label: 'Серия',
      value: totalStreak,
      color: 'hsl(var(--accent))',
    },
    {
      icon: Target,
      label: 'Неделя',
      value: `${weekCompleted}/${weekTarget}`,
      color: 'hsl(var(--primary))',
    },
    {
      icon: Calendar,
      label: 'Привычки',
      value: habits.length,
      color: 'hsl(var(--success))',
    },
  ];

  const todayFormatted = new Date().toLocaleDateString('ru-RU', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  return (
    <div className="space-y-6">
      {/* Date and greeting */}
      <div>
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold text-foreground"
        >
          {getGreeting()}
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground capitalize mt-1"
        >
          {todayFormatted}
        </motion.p>
      </div>

      {/* Today's progress card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="gradient-primary rounded-2xl p-6 shadow-glow"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-foreground/80 text-sm font-medium">Сегодня выполнено</p>
            <p className="text-4xl font-bold text-primary-foreground mt-1">
              {completedToday}/{todayTasks.length}
            </p>
            {todayProgress === 100 && todayTasks.length > 0 && (
              <p className="text-primary-foreground/90 text-sm mt-2">
                🎉 Отличная работа!
              </p>
            )}
          </div>
          <ProgressRing 
            progress={todayProgress} 
            size={80} 
            strokeWidth={6}
            color="rgba(255,255,255,0.9)"
          >
            <span className="text-lg font-bold text-primary-foreground">
              {Math.round(todayProgress)}%
            </span>
          </ProgressRing>
        </div>
      </motion.div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="bg-card rounded-xl p-4 shadow-card text-center"
          >
            <stat.icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
            <p className="text-xl font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Доброй ночи! 🌙';
  if (hour < 12) return 'Доброе утро! ☀️';
  if (hour < 18) return 'Добрый день! 👋';
  return 'Добрый вечер! 🌆';
}
