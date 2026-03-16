import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Plus, TrendingUp, BarChart3, Target } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GoalsList } from '@/components/goals/GoalsList';
import { useGoals } from '@/hooks/useGoals';
import { GoalsOverviewProgress } from '@/components/goals/GoalsOverviewProgress';
import { GoalsOverviewAnalytics } from '@/components/goals/GoalsOverviewAnalytics';
import { SmartGoalWizard, SmartTask } from '@/components/goals/SmartGoalWizard';
import { useStars } from '@/hooks/useStars';
import { usePomodoro } from '@/contexts/PomodoroContext';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { SPHERES } from '@/types/sphere';
import { TASK_COLORS } from '@/types/task';

export default function Goals() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('goals');
  const [wizardOpen, setWizardOpen] = useState(false);
  const { goals, loading, addGoal, updateGoal, deleteGoal, completeGoal } = useGoals();
  const { addStars } = useStars();
  const { isRunning: isPomodoroRunning, start: startPomodoro } = usePomodoro();

  const handleWizardSave = async (goalData: any, tasks: SmartTask[]) => {
    const result = await addGoal(goalData);
    if (!result) return;

    const sphere = SPHERES.find(s => s.id === goalData.sphere_id);

    // Create decomposition tasks in localStorage with proper Task schema
    if (tasks.length > 0) {
      try {
        const stored = localStorage.getItem('habitflow_tasks');
        const existing = stored ? JSON.parse(stored) : [];
        const newTasks = tasks.map((t) => ({
          id: crypto.randomUUID(),
          name: t.title,
          icon: sphere?.icon || '🎯',
          color: sphere?.color || TASK_COLORS[0],
          dueDate: t.deadline || new Date().toISOString().split('T')[0],
          completed: false,
          createdAt: new Date().toISOString(),
          priority: t.priority,
          status: 'not_started',
          categoryId: undefined,
          tagIds: [],
          recurrence: 'none',
          subtasks: [],
          attachments: [],
          goalId: result.id,
          sphereId: goalData.sphere_id,
          smartGoalPhase: t.phase,
          smartGoalTotal: t.totalPhases,
        }));
        localStorage.setItem('habitflow_tasks', JSON.stringify([...newTasks, ...existing]));
        window.dispatchEvent(new CustomEvent('habitflow-data-changed'));

        // Award 50 XP
        await addStars(50, 'smart_goal', 'SMART-цель создана');

        // Trigger C: Offer Pomodoro for first task
        const firstTask = newTasks[0];
        if (firstTask && !isPomodoroRunning) {
          setTimeout(() => {
            toast(
              isRussian ? '🎯 Цель поставлена! Начнём первый шаг прямо сейчас?' : '🎯 Goal set! Start the first step now?',
              {
                duration: 8000,
                action: {
                  label: isRussian ? '▶ Помодоро' : '▶ Pomodoro',
                  onClick: () => {
                    startPomodoro(firstTask.id);
                    toast.success(isRussian ? 'Помодоро запущен!' : 'Pomodoro started!');
                  },
                },
              }
            );
          }, 1200);
        }

        // Trigger A: Navigate to Tasks page
        setTimeout(() => {
          navigate('/tasks');
        }, 600);
      } catch (e) {
        console.error('Error creating tasks:', e);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <PageHeader 
            showTitle
            icon={<Trophy className="w-5 h-5 text-yellow-500" />}
            iconBgClass="bg-yellow-500/10"
            title={isRussian ? 'Мои цели' : 'My Goals'}
            subtitle={isRussian ? 'Управляйте своими целями' : 'Manage your goals'}
          />
          <Button onClick={() => setWizardOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {isRussian ? 'SMART-цель' : 'SMART Goal'}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="goals" className="gap-1">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Цели' : 'Goals'}</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="gap-1">
              <TrendingUp className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Прогресс' : 'Progress'}</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-1">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Аналитика' : 'Analytics'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="goals">
            <GoalsList 
              goals={goals}
              loading={loading}
              onUpdate={updateGoal}
              onDelete={deleteGoal}
              onComplete={completeGoal}
            />
          </TabsContent>

          <TabsContent value="progress">
            <GoalsOverviewProgress goals={goals} isRussian={isRussian} />
          </TabsContent>

          <TabsContent value="analytics">
            <GoalsOverviewAnalytics goals={goals} isRussian={isRussian} />
          </TabsContent>
        </Tabs>

        <AnimatePresence>
          {wizardOpen && (
            <SmartGoalWizard
              open={wizardOpen}
              onOpenChange={setWizardOpen}
              onSave={handleWizardSave}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
