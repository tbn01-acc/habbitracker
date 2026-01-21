import { Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { GoalWithStats } from '@/types/goal';
import { GoalCard } from './GoalCard';
import { useTranslation } from '@/contexts/LanguageContext';

interface GoalsListProps {
  goals: GoalWithStats[];
  loading: boolean;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onComplete: (id: string) => void;
}

export function GoalsList({ goals, loading, onUpdate, onDelete, onComplete }: GoalsListProps) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-12 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-2">
            {isRussian ? 'Нет целей' : 'No goals yet'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {isRussian 
              ? 'Создайте свою первую цель и начните путь к её достижению'
              : 'Create your first goal and start your journey'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const archivedGoals = goals.filter(g => g.status === 'archived');

  return (
    <div className="space-y-6">
      {activeGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {isRussian ? 'Активные цели' : 'Active Goals'}
          </h3>
          <div className="space-y-3">
            {activeGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onComplete={onComplete}
              />
            ))}
          </div>
        </div>
      )}

      {completedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {isRussian ? 'Завершённые' : 'Completed'}
          </h3>
          <div className="space-y-3">
            {completedGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onComplete={onComplete}
              />
            ))}
          </div>
        </div>
      )}

      {archivedGoals.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            {isRussian ? 'Архив' : 'Archived'}
          </h3>
          <div className="space-y-3">
            {archivedGoals.map((goal, index) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                index={index}
                onUpdate={onUpdate}
                onDelete={onDelete}
                onComplete={onComplete}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
