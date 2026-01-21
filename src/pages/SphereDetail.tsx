import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Clock, 
  DollarSign, 
  Target, 
  CheckCircle2, 
  ListTodo,
  Users,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppHeader } from '@/components/AppHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSpheres } from '@/hooks/useSpheres';
import { 
  SPHERES, 
  getSphereByKey, 
  getSphereName, 
  SphereKey,
} from '@/types/sphere';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface SphereData {
  goals: any[];
  tasks: any[];
  habits: any[];
  contacts: any[];
  timeMinutes: number;
  income: number;
  expense: number;
}

export default function SphereDetail() {
  const { sphereKey } = useParams<{ sphereKey: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { fetchSphereStats, calculateSphereIndex } = useSpheres();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SphereData | null>(null);
  const [sphereIndex, setSphereIndex] = useState(0);

  const sphere = useMemo(() => {
    return getSphereByKey(sphereKey as SphereKey);
  }, [sphereKey]);

  const labels = {
    goals: { ru: 'Цели', en: 'Goals', es: 'Metas' },
    tasks: { ru: 'Задачи', en: 'Tasks', es: 'Tareas' },
    habits: { ru: 'Привычки', en: 'Habits', es: 'Hábitos' },
    resources: { ru: 'Ресурсы', en: 'Resources', es: 'Recursos' },
    contacts: { ru: 'Люди', en: 'People', es: 'Personas' },
    timeSpent: { ru: 'Время', en: 'Time', es: 'Tiempo' },
    balance: { ru: 'Баланс', en: 'Balance', es: 'Balance' },
    index: { ru: 'Индекс', en: 'Index', es: 'Índice' },
    noGoals: { ru: 'Нет целей', en: 'No goals', es: 'Sin metas' },
    noTasks: { ru: 'Нет задач', en: 'No tasks', es: 'Sin tareas' },
    noHabits: { ru: 'Нет привычек', en: 'No habits', es: 'Sin hábitos' },
    noContacts: { ru: 'Нет контактов', en: 'No contacts', es: 'Sin contactos' },
    addGoal: { ru: 'Добавить цель', en: 'Add Goal', es: 'Añadir meta' },
    addTask: { ru: 'Добавить задачу', en: 'Add Task', es: 'Añadir tarea' },
    addHabit: { ru: 'Добавить привычку', en: 'Add Habit', es: 'Añadir hábito' },
    hours: { ru: 'ч', en: 'h', es: 'h' },
    minutes: { ru: 'мин', en: 'min', es: 'min' },
    income: { ru: 'Доход', en: 'Income', es: 'Ingresos' },
    expense: { ru: 'Расход', en: 'Expense', es: 'Gastos' },
  };

  useEffect(() => {
    if (sphere && user) {
      loadSphereData();
    }
  }, [sphere, user]);

  const loadSphereData = async () => {
    if (!sphere || !user) return;
    
    setLoading(true);
    try {
      // Fetch goals (both active and completed, excluding archived)
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('sphere_id', sphere.id)
        .is('archived_at', null)
        .order('status', { ascending: true })
        .order('created_at', { ascending: false });

      // Fetch tasks
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .eq('sphere_id', sphere.id)
        .is('archived_at', null)
        .order('due_date', { ascending: true });

      // Fetch habits
      const { data: habits } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .eq('sphere_id', sphere.id)
        .is('archived_at', null)
        .order('name');

      // Fetch contacts linked to this sphere
      const { data: contactSpheres } = await supabase
        .from('contact_spheres')
        .select('contact_id')
        .eq('user_id', user.id)
        .eq('sphere_id', sphere.id);

      let contacts: any[] = [];
      if (contactSpheres && contactSpheres.length > 0) {
        const contactIds = contactSpheres.map(cs => cs.contact_id);
        const { data: contactsData } = await supabase
          .from('contacts')
          .select('*')
          .in('id', contactIds);
        contacts = contactsData || [];
      }

      // Fetch time entries
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('duration')
        .eq('user_id', user.id)
        .eq('sphere_id', sphere.id);

      const timeMinutes = Math.round(
        (timeEntries?.reduce((sum, t) => sum + (t.duration || 0), 0) || 0) / 60
      );

      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user.id)
        .eq('sphere_id', sphere.id);

      const income = transactions
        ?.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      const expense = transactions
        ?.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) || 0;

      setData({
        goals: goals || [],
        tasks: tasks || [],
        habits: habits || [],
        contacts,
        timeMinutes,
        income,
        expense,
      });

      // Calculate sphere index
      const stats = await fetchSphereStats(sphere.id);
      const index = calculateSphereIndex(stats);
      setSphereIndex(index);

    } catch (error) {
      console.error('Error loading sphere data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}${labels.hours[language]} ${mins}${labels.minutes[language]}`;
    }
    return `${mins}${labels.minutes[language]}`;
  };

  if (!sphere) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Sphere not found</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="container max-w-md mx-auto px-4 py-6 space-y-4">
          <h1 className="text-2xl font-bold">{getSphereName(sphere, language)}</h1>
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />

      <div className="container max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{getSphereName(sphere, language)}</h1>
            <p className="text-sm text-muted-foreground">
              {sphere.group_type === 'personal' 
                ? (language === 'ru' ? 'Личная сфера' : 'Personal sphere')
                : (language === 'ru' ? 'Социальная сфера' : 'Social sphere')
              }
            </p>
          </div>
          <div 
            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
            style={{ backgroundColor: `${sphere.color}30` }}
          >
            {sphere.icon}
          </div>
        </div>

        {/* Stats Card */}
        <Card 
          className="p-6"
          style={{ 
            background: `linear-gradient(135deg, ${sphere.color}15, ${sphere.color}05)`,
            borderColor: `${sphere.color}30`,
          }}
        >

          {/* Index */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">{labels.index[language]}</span>
              <span className="font-bold" style={{ color: sphere.color }}>
                {sphereIndex}%
              </span>
            </div>
            <Progress value={sphereIndex} className="h-2" />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-sm font-medium">{formatTime(data?.timeMinutes || 0)}</p>
              <p className="text-xs text-muted-foreground">{labels.timeSpent[language]}</p>
            </div>
            <div className="text-center">
              <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              <p className="text-sm font-medium text-emerald-600">+{data?.income?.toLocaleString() || 0}₽</p>
              <p className="text-xs text-muted-foreground">{labels.income[language]}</p>
            </div>
            <div className="text-center">
              <DollarSign className="w-5 h-5 mx-auto mb-1 text-rose-500" />
              <p className="text-sm font-medium text-rose-600">-{data?.expense?.toLocaleString() || 0}₽</p>
              <p className="text-xs text-muted-foreground">{labels.expense[language]}</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="goals" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="goals">
              <Target className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="tasks">
              <ListTodo className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="habits">
              <CheckCircle2 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="contacts">
              <Users className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* Goals Tab */}
          <TabsContent value="goals" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{labels.goals[language]}</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/goals', { state: { prefillSphereId: sphere.id } })}
              >
                <Plus className="w-4 h-4 mr-1" />
                {labels.addGoal[language]}
              </Button>
            </div>
            
            {data?.goals && data.goals.length > 0 ? (
              data.goals.map((goal) => (
                <Card 
                  key={goal.id} 
                  className={cn(
                    "p-4 cursor-pointer hover:shadow-md transition-shadow",
                    goal.status === 'completed' && "opacity-70"
                  )}
                  onClick={() => navigate(`/goals/${goal.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon || '🎯'}</span>
                    <div className="flex-1">
                      <p className={cn("font-medium", goal.status === 'completed' && "line-through")}>
                        {goal.name}
                      </p>
                      {goal.target_date && (
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(goal.target_date), 'dd.MM.yyyy')}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      {goal.status === 'completed' ? (
                        <span className="text-sm font-medium text-success">✓</span>
                      ) : (
                        <span className="text-sm font-medium">{goal.progress_percent || 0}%</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                {labels.noGoals[language]}
              </Card>
            )}
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{labels.tasks[language]}</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/tasks', { state: { prefillSphereId: sphere.id } })}
              >
                <Plus className="w-4 h-4 mr-1" />
                {labels.addTask[language]}
              </Button>
            </div>
            
            {data?.tasks && data.tasks.length > 0 ? (
              data.tasks.slice(0, 5).map((task) => (
                <Card key={task.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground'}`}
                    >
                      {task.completed && <CheckCircle2 className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                        {task.name}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                {labels.noTasks[language]}
              </Card>
            )}
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits" className="mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">{labels.habits[language]}</h3>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => navigate('/habits', { state: { prefillSphereId: sphere.id } })}
              >
                <Plus className="w-4 h-4 mr-1" />
                {labels.addHabit[language]}
              </Button>
            </div>
            
            {data?.habits && data.habits.length > 0 ? (
              data.habits.map((habit) => {
                const today = format(new Date(), 'yyyy-MM-dd');
                const isCompletedToday = habit.completed_dates?.includes(today);
                
                return (
                  <Card key={habit.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-8 h-8 rounded-lg flex items-center justify-center
                          ${isCompletedToday ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'}`}
                      >
                        {habit.icon || '✓'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{habit.name}</p>
                        <p className="text-xs text-muted-foreground">
                          🔥 {habit.streak || 0}
                        </p>
                      </div>
                      {isCompletedToday && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      )}
                    </div>
                  </Card>
                );
              })
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                {labels.noHabits[language]}
              </Card>
            )}
          </TabsContent>

          {/* Contacts Tab */}
          <TabsContent value="contacts" className="mt-4 space-y-3">
            <h3 className="font-semibold">{labels.contacts[language]}</h3>
            
            {data?.contacts && data.contacts.length > 0 ? (
              data.contacts.map((contact) => (
                <Card key={contact.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      {contact.photo_url ? (
                        <img 
                          src={contact.photo_url} 
                          alt={contact.name} 
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{contact.name}</p>
                      {contact.phone && (
                        <p className="text-xs text-muted-foreground">{contact.phone}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card className="p-6 text-center text-muted-foreground">
                {labels.noContacts[language]}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
