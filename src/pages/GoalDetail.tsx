import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Target, CheckSquare, Clock, DollarSign, Users, 
  Plus, Edit, Trash2, MoreVertical, Check, TrendingUp, BarChart3
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useTranslation } from '@/contexts/LanguageContext';
import { useGoals } from '@/hooks/useGoals';
import { useAuth } from '@/hooks/useAuth';
import { GoalDialog } from '@/components/goals/GoalDialog';
import { GoalProgressChart } from '@/components/goals/GoalProgressChart';
import { GoalContactsManager } from '@/components/goals/GoalContactsManager';
import { GoalProgressTab } from '@/components/goals/GoalProgressTab';
import { GoalAnalyticsTab } from '@/components/goals/GoalAnalyticsTab';
import { TaskDialog } from '@/components/TaskDialog';
import { HabitDialog } from '@/components/HabitDialog';
import { TransactionDialog } from '@/components/TransactionDialog';
import { useTasks } from '@/hooks/useTasks';
import { useHabits } from '@/hooks/useHabits';
import { useFinance } from '@/hooks/useFinance';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Task } from '@/types/task';
import { Habit } from '@/types/habit';
import { FinanceTransaction } from '@/types/finance';
import { TimeEntry } from '@/types/service';

// Storage keys for localStorage
const TASKS_KEY = 'habitflow_tasks';
const HABITS_KEY = 'habitflow_habits';
const FINANCE_KEY = 'habitflow_finance';
const TIME_ENTRIES_KEY = 'habitflow_time_entries';

export default function GoalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { user } = useAuth();
  const isRussian = language === 'ru';
  const { goals, updateGoal, deleteGoal, completeGoal, addContact, getGoalContacts, deleteContact } = useGoals();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [timeEntries, setTimeEntries] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);

  const { addTask, categories: taskCategories, tags: taskTags } = useTasks();
  const { addHabit, categories: habitCategories, tags: habitTags } = useHabits();
  const { addTransaction, categories: finCategories, tags: finTags } = useFinance();

  const goal = goals.find(g => g.id === id);

  // Helper to load from localStorage
  const loadFromLocalStorage = useCallback(() => {
    if (!id) return;

    try {
      // Load tasks
      const storedTasks = localStorage.getItem(TASKS_KEY);
      if (storedTasks) {
        const allTasks: Task[] = JSON.parse(storedTasks);
        const goalTasks = allTasks.filter(t => t.goalId === id);
        setTasks(goalTasks.map(t => ({
          id: t.id,
          name: t.name,
          icon: t.icon,
          completed: t.completed,
          due_date: t.dueDate,
          priority: t.priority,
          status: t.status,
          subtasks: t.subtasks,
        })));
      }

      // Load habits
      const storedHabits = localStorage.getItem(HABITS_KEY);
      if (storedHabits) {
        const allHabits: Habit[] = JSON.parse(storedHabits);
        const goalHabits = allHabits.filter(h => h.goalId === id);
        setHabits(goalHabits.map(h => ({
          id: h.id,
          name: h.name,
          icon: h.icon,
          completed_dates: h.completedDates,
          streak: h.streak,
        })));
      }

      // Load transactions
      const storedFinance = localStorage.getItem(FINANCE_KEY);
      if (storedFinance) {
        const allTransactions: FinanceTransaction[] = JSON.parse(storedFinance);
        const goalTransactions = allTransactions.filter(t => t.goalId === id);
        setTransactions(goalTransactions.map(t => ({
          id: t.id,
          name: t.name,
          type: t.type,
          amount: t.amount,
          date: t.date,
        })));
      }

      // Load time entries
      const storedTimeEntries = localStorage.getItem(TIME_ENTRIES_KEY);
      if (storedTimeEntries) {
        const allTimeEntries: TimeEntry[] = JSON.parse(storedTimeEntries);
        const goalTimeEntries = allTimeEntries.filter(t => t.goalId === id);
        setTimeEntries(goalTimeEntries.map(t => ({
          id: t.id,
          task_name: t.description,
          start_time: t.startTime,
          duration: t.duration,
        })));
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, [id]);

  const fetchRelatedData = useCallback(async () => {
    if (!id) return;

    // First load from localStorage (instant)
    loadFromLocalStorage();

    // Then try to fetch from Supabase if user is authenticated
    if (user) {
      try {
        const [tasksRes, habitsRes, transactionsRes, timeRes, contactsRes] = await Promise.all([
          supabase.from('tasks').select('*').eq('goal_id', id).order('created_at', { ascending: false }),
          supabase.from('habits').select('*').eq('goal_id', id).order('created_at', { ascending: false }),
          supabase.from('transactions').select('*').eq('goal_id', id).order('date', { ascending: false }),
          supabase.from('time_entries').select('*').eq('goal_id', id).order('start_time', { ascending: false }),
          getGoalContacts(id),
        ]);

        // Use Supabase data if available, otherwise keep localStorage data
        if (tasksRes.data && tasksRes.data.length > 0) {
          setTasks(tasksRes.data);
        }
        if (habitsRes.data && habitsRes.data.length > 0) {
          setHabits(habitsRes.data);
        }
        if (transactionsRes.data && transactionsRes.data.length > 0) {
          setTransactions(transactionsRes.data);
        }
        if (timeRes.data && timeRes.data.length > 0) {
          setTimeEntries(timeRes.data);
        }
        setContacts(contactsRes);
      } catch (e) {
        console.error('Error fetching from Supabase:', e);
        // Keep localStorage data on error
      }
    } else {
      // Load contacts for non-authenticated users too
      const contactsData = await getGoalContacts(id);
      setContacts(contactsData);
    }
  }, [id, user, getGoalContacts, loadFromLocalStorage]);

  // Reload when localStorage changes
  useEffect(() => {
    const handleDataChange = () => {
      loadFromLocalStorage();
    };

    window.addEventListener('habitflow-data-changed', handleDataChange);
    return () => window.removeEventListener('habitflow-data-changed', handleDataChange);
  }, [loadFromLocalStorage]);

  useEffect(() => {
    fetchRelatedData();
  }, [fetchRelatedData]);

  if (!goal) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="text-muted-foreground">
          {isRussian ? 'Цель не найдена' : 'Goal not found'}
        </div>
      </div>
    );
  }

  const progress = goal.tasks_count > 0 
    ? Math.round((goal.tasks_completed / goal.tasks_count) * 100)
    : goal.progress_percent;

  const totalSpent = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalTime = timeEntries.reduce((sum, t) => sum + t.duration, 0);
  const totalHours = Math.round(totalTime / 3600);
  const totalMinutes = Math.round((totalTime % 3600) / 60);

  // Calculate days remaining
  const daysRemaining = goal.target_date 
    ? differenceInDays(new Date(goal.target_date), new Date())
    : null;

  // Budget progress
  const budgetProgress = goal.budget_goal 
    ? Math.min(100, Math.round((totalSpent / goal.budget_goal) * 100))
    : null;

  // Time progress
  const timeProgress = goal.time_goal_minutes
    ? Math.min(100, Math.round((totalTime / 60 / goal.time_goal_minutes) * 100))
    : null;

  const handleDelete = async () => {
    await deleteGoal(goal.id);
    navigate('/goals');
  };

  const handleComplete = async () => {
    await completeGoal(goal.id);
  };

  const handleUpdate = async (data: any) => {
    await updateGoal(goal.id, data);
    setEditDialogOpen(false);
  };

  const handleAddContact = async (contact: any) => {
    const result = await addContact(contact);
    if (result) {
      await fetchRelatedData();
    }
    return result;
  };

  const handleDeleteContact = async (contactId: string) => {
    await deleteContact(contactId);
    await fetchRelatedData();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${goal.color}20` }}
          >
            {goal.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{goal.name}</h1>
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="w-4 h-4 mr-2" />
                {isRussian ? 'Редактировать' : 'Edit'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleComplete}>
                <Check className="w-4 h-4 mr-2" />
                {isRussian ? 'Завершить' : 'Complete'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                {isRussian ? 'Удалить' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Main progress card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6" style={{ borderColor: `${goal.color}40` }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">
                  {isRussian ? 'Общий прогресс' : 'Overall Progress'}
                </span>
                <span className="font-bold text-lg">{progress}%</span>
              </div>
              <Progress value={progress} className="h-3" />
              
              {/* Stats grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{goal.tasks_completed}/{goal.tasks_count}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <CheckSquare className="w-3 h-3" />
                    {isRussian ? 'Задач' : 'Tasks'}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{goal.habits_count}</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Target className="w-3 h-3" />
                    {isRussian ? 'Привычек' : 'Habits'}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{totalSpent.toLocaleString()}₽</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    {isRussian ? 'Потрачено' : 'Spent'}
                  </div>
                </div>
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <div className="text-2xl font-bold">{totalHours}ч {totalMinutes}м</div>
                  <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {isRussian ? 'Времени' : 'Time'}
                  </div>
                </div>
              </div>

              {/* Goals progress (budget & time) */}
              {(budgetProgress !== null || timeProgress !== null || daysRemaining !== null) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                  {budgetProgress !== null && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{isRussian ? 'Бюджет' : 'Budget'}</span>
                        <span>{totalSpent.toLocaleString()} / {goal.budget_goal?.toLocaleString()}₽</span>
                      </div>
                      <Progress value={budgetProgress} className="h-2" />
                    </div>
                  )}
                  {timeProgress !== null && (
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{isRussian ? 'Время' : 'Time'}</span>
                        <span>{totalHours}ч / {Math.round(goal.time_goal_minutes! / 60)}ч</span>
                      </div>
                      <Progress value={timeProgress} className="h-2" />
                    </div>
                  )}
                  {daysRemaining !== null && (
                    <div className="text-center">
                      <div className={`text-lg font-bold ${daysRemaining < 0 ? 'text-destructive' : daysRemaining < 7 ? 'text-orange-500' : ''}`}>
                        {daysRemaining < 0 
                          ? (isRussian ? 'Просрочено' : 'Overdue')
                          : `${daysRemaining} ${isRussian ? 'дн.' : 'days'}`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(goal.target_date!), 'dd MMM yyyy', { locale: isRussian ? ru : enUS })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Charts section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <GoalProgressChart
            tasks={tasks}
            habits={habits}
            transactions={transactions}
            timeEntries={timeEntries}
            goalColor={goal.color}
          />
        </motion.div>

        {/* Main Tabs - Progress, Analytics, Items */}
        <Tabs defaultValue="progress">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="progress" className="gap-1">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Прогресс' : 'Progress'}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Аналитика' : 'Analytics'}</span>
            </TabsTrigger>
            <TabsTrigger value="items" className="gap-1">
              <CheckSquare className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Элементы' : 'Items'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="progress">
            <GoalProgressTab
              goal={goal}
              tasks={tasks}
              habits={habits}
              isRussian={isRussian}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <GoalAnalyticsTab
              goal={goal}
              timeEntries={timeEntries}
              transactions={transactions}
              habits={habits}
              isRussian={isRussian}
            />
          </TabsContent>

          <TabsContent value="items">
            {/* Nested Tabs for items */}
            <Tabs defaultValue="tasks">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="tasks" className="text-xs">
                  <CheckSquare className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{tasks.length}</span>
                </TabsTrigger>
                <TabsTrigger value="habits" className="text-xs">
                  <Target className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{habits.length}</span>
                </TabsTrigger>
                <TabsTrigger value="finance" className="text-xs">
                  <DollarSign className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{transactions.length}</span>
                </TabsTrigger>
                <TabsTrigger value="time" className="text-xs">
                  <Clock className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{timeEntries.length}</span>
                </TabsTrigger>
                <TabsTrigger value="contacts" className="text-xs">
                  <Users className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{contacts.length}</span>
                </TabsTrigger>
              </TabsList>

          <TabsContent value="tasks">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {isRussian ? 'Задачи' : 'Tasks'}
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setTaskDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    {isRussian ? 'Добавить' : 'Add'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRussian ? 'Нет связанных задач' : 'No linked tasks'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <div key={task.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <span className="text-lg">{task.icon || '📋'}</span>
                        <div className="flex-1">
                          <span className={task.completed ? 'line-through text-muted-foreground' : ''}>
                            {task.name}
                          </span>
                          {task.due_date && (
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(task.due_date), 'dd MMM', { locale: isRussian ? ru : enUS })}
                            </div>
                          )}
                        </div>
                        {task.completed && <Badge variant="secondary">✓</Badge>}
                        {task.priority === 'high' && !task.completed && (
                          <Badge variant="destructive" className="text-xs">!</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="habits">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {isRussian ? 'Привычки' : 'Habits'}
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setHabitDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    {isRussian ? 'Добавить' : 'Add'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {habits.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRussian ? 'Нет связанных привычек' : 'No linked habits'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {habits.map((habit) => (
                      <div key={habit.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                        <span className="text-lg">{habit.icon || '🎯'}</span>
                        <div className="flex-1">
                          <span>{habit.name}</span>
                          <div className="text-xs text-muted-foreground">
                            {habit.completed_dates?.length || 0} {isRussian ? 'выполнений' : 'completions'}
                          </div>
                        </div>
                        <Badge variant="outline" className="gap-1">
                          <span>🔥</span> {habit.streak}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="finance">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {isRussian ? 'Финансы' : 'Finance'}
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setTransactionDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    {isRussian ? 'Добавить' : 'Add'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                {transactions.length > 0 && (
                  <div className="flex gap-4 mb-4 p-3 rounded-lg bg-muted/50">
                    <div className="flex-1 text-center">
                      <div className="text-sm text-destructive font-medium">-{totalSpent.toLocaleString()}₽</div>
                      <div className="text-xs text-muted-foreground">{isRussian ? 'Расходы' : 'Expenses'}</div>
                    </div>
                    <div className="flex-1 text-center">
                      <div className="text-sm text-chart-2 font-medium">+{totalIncome.toLocaleString()}₽</div>
                      <div className="text-xs text-muted-foreground">{isRussian ? 'Доходы' : 'Income'}</div>
                    </div>
                  </div>
                )}
                
                {transactions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRussian ? 'Нет связанных транзакций' : 'No linked transactions'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((tx) => (
                      <div key={tx.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div>
                          <span className="text-sm">{tx.name}</span>
                          <div className="text-xs text-muted-foreground">{tx.date}</div>
                        </div>
                        <span className={`font-medium ${tx.type === 'income' ? 'text-chart-2' : 'text-destructive'}`}>
                          {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}₽
                        </span>
                      </div>
                    ))}
                    {transactions.length > 10 && (
                      <p className="text-xs text-center text-muted-foreground pt-2">
                        +{transactions.length - 10} {isRussian ? 'ещё' : 'more'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="time">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {isRussian ? 'Время' : 'Time'}
                  </CardTitle>
                  <Button size="sm" variant="outline" onClick={() => navigate('/services')}>
                    <Plus className="w-4 h-4 mr-1" />
                    {isRussian ? 'Добавить' : 'Add'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Summary */}
                {timeEntries.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4 p-3 rounded-lg bg-muted/50">
                    <Clock className="w-5 h-5 text-primary" />
                    <span className="text-lg font-bold">{totalHours}ч {totalMinutes}м</span>
                    <span className="text-sm text-muted-foreground">
                      ({isRussian ? 'всего' : 'total'})
                    </span>
                  </div>
                )}
                
                {timeEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {isRussian ? 'Нет записей времени' : 'No time entries'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {timeEntries.slice(0, 10).map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                        <div>
                          <span className="text-sm">{entry.task_name || (isRussian ? 'Без названия' : 'Untitled')}</span>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(entry.start_time), 'dd MMM HH:mm', { locale: isRussian ? ru : enUS })}
                          </div>
                        </div>
                        <span className="text-muted-foreground font-medium">
                          {Math.round(entry.duration / 60)} {isRussian ? 'мин' : 'min'}
                        </span>
                      </div>
                    ))}
                    {timeEntries.length > 10 && (
                      <p className="text-xs text-center text-muted-foreground pt-2">
                        +{timeEntries.length - 10} {isRussian ? 'ещё' : 'more'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts">
            <GoalContactsManager
              contacts={contacts}
              goalId={goal.id}
              onAddContact={handleAddContact}
              onDeleteContact={handleDeleteContact}
            />
          </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>

        <GoalDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          onSave={handleUpdate}
          initialData={goal}
        />

        <TaskDialog
          open={taskDialogOpen}
          onClose={() => setTaskDialogOpen(false)}
          onSave={async (taskData) => {
            await addTask({ ...taskData, goalId: goal.id, sphereId: goal.sphere_id });
            setTaskDialogOpen(false);
            fetchRelatedData();
          }}
          categories={taskCategories}
          tags={taskTags}
          prefillSphereId={goal.sphere_id}
          prefillGoalId={goal.id}
        />

        <HabitDialog
          open={habitDialogOpen}
          onClose={() => setHabitDialogOpen(false)}
          onSave={async (habitData) => {
            await addHabit({ ...habitData, goalId: goal.id, sphereId: goal.sphere_id });
            setHabitDialogOpen(false);
            fetchRelatedData();
          }}
          categories={habitCategories}
          tags={habitTags}
          prefillSphereId={goal.sphere_id}
          prefillGoalId={goal.id}
        />

        <TransactionDialog
          open={transactionDialogOpen}
          onClose={() => setTransactionDialogOpen(false)}
          onSave={async (txData) => {
            await addTransaction({ ...txData, goalId: goal.id, sphereId: goal.sphere_id } as any);
            setTransactionDialogOpen(false);
            fetchRelatedData();
          }}
          categories={finCategories}
          tags={finTags}
          prefillSphereId={goal.sphere_id}
          prefillGoalId={goal.id}
        />
      </div>
    </div>
  );
}
