import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Task, TaskCategory, TaskTag } from '@/types/task';
import { useTranslation } from '@/contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { format, subDays } from 'date-fns';

interface TimeEntry {
  id: string;
  taskId: string;
  subtaskId?: string;
  startTime: string;
  endTime?: string;
  duration: number;
  description?: string;
}

interface TaskProgressViewProps {
  tasks: Task[];
  categories: TaskCategory[];
  tags: TaskTag[];
  period: 7 | 14 | 30;
  timeEntries?: TimeEntry[];
  formatDuration?: (seconds: number) => string;
}

export function TaskProgressView({ tasks, categories, period, timeEntries = [], formatDuration }: TaskProgressViewProps) {
  const { t } = useTranslation();

  const periodTasks = useMemo(() => {
    const now = new Date();
    const start = subDays(now, period);
    return tasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      return taskDate >= start && taskDate <= now;
    });
  }, [tasks, period]);

  // Daily completion data for line chart
  const dailyData = useMemo(() => {
    const data: { date: string; completed: number; total: number }[] = [];
    const now = new Date();
    
    for (let i = period - 1; i >= 0; i--) {
      const date = subDays(now, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const dayTasks = tasks.filter(t => t.dueDate === dateStr);
      const completed = dayTasks.filter(t => t.status === 'done').length;
      
      data.push({
        date: format(date, 'dd.MM'),
        completed,
        total: dayTasks.length,
      });
    }
    return data;
  }, [tasks, period]);

  // Category breakdown for pie chart
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    periodTasks.forEach(task => {
      const catId = task.categoryId || 'uncategorized';
      counts[catId] = (counts[catId] || 0) + 1;
    });
    
    return Object.entries(counts).map(([id, count]) => {
      const category = categories.find(c => c.id === id);
      return {
        name: category?.name || t('uncategorized'),
        value: count,
        color: category?.color || 'hsl(200, 30%, 60%)',
      };
    });
  }, [periodTasks, categories, t]);

  // Priority breakdown for bar chart
  const priorityData = useMemo(() => {
    const priorities = { low: 0, medium: 0, high: 0 };
    periodTasks.forEach(task => {
      priorities[task.priority]++;
    });
    
    return [
      { name: t('priorityLow'), value: priorities.low, color: 'hsl(200, 30%, 60%)' },
      { name: t('priorityMedium'), value: priorities.medium, color: 'hsl(45, 90%, 50%)' },
      { name: t('priorityHigh'), value: priorities.high, color: 'hsl(0, 70%, 55%)' },
    ];
  }, [periodTasks, t]);

  // Status breakdown
  const statusData = useMemo(() => {
    const statuses = { not_started: 0, in_progress: 0, done: 0 };
    periodTasks.forEach(task => {
      statuses[task.status]++;
    });
    
    return [
      { name: t('statusNotStarted'), value: statuses.not_started, color: 'hsl(200, 30%, 60%)' },
      { name: t('statusInProgress'), value: statuses.in_progress, color: 'hsl(45, 90%, 50%)' },
      { name: t('statusDone'), value: statuses.done, color: 'hsl(145, 70%, 45%)' },
    ];
  }, [periodTasks, t]);

  const totalCompleted = periodTasks.filter(t => t.status === 'done').length;
  const completionRate = periodTasks.length > 0 
    ? Math.round((totalCompleted / periodTasks.length) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <p className="text-muted-foreground text-sm">{t('totalTasks')}</p>
          <p className="text-2xl font-bold text-foreground">{periodTasks.length}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <p className="text-muted-foreground text-sm">{t('completionRate')}</p>
          <p className="text-2xl font-bold text-task">{completionRate}%</p>
        </motion.div>
      </div>

      {/* Daily Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-4 border border-border"
      >
        <h3 className="text-sm font-medium text-foreground mb-4">{t('dailyProgress')}</h3>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData}>
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="hsl(var(--task))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--task))', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Category Breakdown */}
      {categoryData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <h3 className="text-sm font-medium text-foreground mb-4">{t('byCategory')}</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2 justify-center">
            {categoryData.map((item, index) => (
              <div key={index} className="flex items-center gap-1 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Priority Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-card rounded-2xl p-4 border border-border"
      >
        <h3 className="text-sm font-medium text-foreground mb-4">{t('byPriority')}</h3>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} layout="vertical">
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false} 
                tickLine={false}
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                width={70}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Status Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card rounded-2xl p-4 border border-border"
      >
        <h3 className="text-sm font-medium text-foreground mb-4">{t('byStatus')}</h3>
        <div className="space-y-2">
          {statusData.map((item, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm text-foreground flex-1">{item.name}</span>
              <span className="text-sm font-medium text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Time Analytics */}
      {timeEntries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card rounded-2xl p-4 border border-border"
        >
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-service" />
            <h3 className="text-sm font-medium text-foreground">{t('timeByTask')}</h3>
          </div>
          <div className="space-y-3">
            {tasks
              .filter(task => timeEntries.some(e => e.taskId === task.id))
              .slice(0, 5)
              .map(task => {
                const taskTime = timeEntries
                  .filter(e => e.taskId === task.id)
                  .reduce((sum, e) => sum + e.duration, 0);
                return (
                  <div key={task.id} className="flex items-center gap-3">
                    <span className="text-lg">{task.icon}</span>
                    <span className="text-sm text-foreground flex-1 truncate">{task.name}</span>
                    <span className="text-sm font-medium text-service">
                      {formatDuration ? formatDuration(taskTime) : `${Math.floor(taskTime / 60)}m`}
                    </span>
                  </div>
                );
              })}
            <div className="pt-2 border-t border-border flex justify-between">
              <span className="text-sm text-muted-foreground">{t('totalTimeSpent')}</span>
              <span className="text-sm font-bold text-service">
                {formatDuration 
                  ? formatDuration(timeEntries.reduce((sum, e) => sum + e.duration, 0))
                  : `${Math.floor(timeEntries.reduce((sum, e) => sum + e.duration, 0) / 60)}m`
                }
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
