import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Plus, TrendingUp, BarChart3, Target } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { GoalsList } from '@/components/goals/GoalsList';
import { GoalDialog } from '@/components/goals/GoalDialog';
import { useGoals } from '@/hooks/useGoals';
import { GoalsOverviewProgress } from '@/components/goals/GoalsOverviewProgress';
import { GoalsOverviewAnalytics } from '@/components/goals/GoalsOverviewAnalytics';

export default function Goals() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const [activeTab, setActiveTab] = useState('goals');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { goals, loading, addGoal, updateGoal, deleteGoal, completeGoal } = useGoals();

  const handleAddGoal = async (data: any) => {
    await addGoal(data);
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <PageHeader 
            showTitle
            icon={<Trophy className="w-5 h-5 text-yellow-500" />}
            iconBgClass="bg-yellow-500/10"
            title={isRussian ? 'Мои цели' : 'My Goals'}
            subtitle={isRussian ? 'Управляйте своими целями' : 'Manage your goals'}
          />
          <Button onClick={() => setDialogOpen(true)} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            {isRussian ? 'Новая цель' : 'New Goal'}
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

        <GoalDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSave={handleAddGoal}
        />
      </div>
    </div>
  );
}
