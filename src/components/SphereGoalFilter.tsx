import { useState } from 'react';
import { Target, Globe } from 'lucide-react';
import { useSpheres } from '@/hooks/useSpheres';
import { useGoals } from '@/hooks/useGoals';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

interface SphereGoalFilterProps {
  selectedSphereId: number | null;
  selectedGoalId: string | null;
  onSphereChange: (sphereId: number | null) => void;
  onGoalChange: (goalId: string | null) => void;
  accentColor?: string;
}

export function SphereGoalFilter({
  selectedSphereId,
  selectedGoalId,
  onSphereChange,
  onGoalChange,
  accentColor = 'hsl(var(--primary))',
}: SphereGoalFilterProps) {
  const { spheres } = useSpheres();
  const { goals } = useGoals();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const [sphereOpen, setSphereOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);

  const activeSpheres = spheres.filter(s => s.group_type !== 'system');
  const activeGoals = goals.filter(g => g.status === 'active');

  // Filter goals by selected sphere
  const filteredGoals = selectedSphereId
    ? activeGoals.filter(g => g.sphere_id === selectedSphereId)
    : activeGoals;

  const selectedSphere = selectedSphereId 
    ? spheres.find(s => s.id === selectedSphereId)
    : null;

  const selectedGoal = selectedGoalId 
    ? goals.find(g => g.id === selectedGoalId)
    : null;

  const hasFilters = selectedSphereId || selectedGoalId;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Sphere Filter */}
      <Popover open={sphereOpen} onOpenChange={setSphereOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              selectedSphereId && "border-2"
            )}
            style={selectedSphereId ? { borderColor: selectedSphere?.color } : undefined}
          >
            <Globe className="w-3.5 h-3.5" />
            {selectedSphere ? (
              <span className="flex items-center gap-1">
                <span>{selectedSphere.icon}</span>
                <span className="max-w-[80px] truncate">
                  {isRussian ? selectedSphere.name_ru : selectedSphere.name_en}
                </span>
              </span>
            ) : (
              <span>{isRussian ? 'Сфера' : 'Sphere'}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-2" align="start">
          <div className="space-y-1">
            <button
              onClick={() => {
                onSphereChange(null);
                onGoalChange(null); // Reset goal when sphere is cleared
                setSphereOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                !selectedSphereId 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted"
              )}
            >
              <Globe className="w-4 h-4" />
              {isRussian ? 'Все сферы' : 'All spheres'}
            </button>
            {activeSpheres.map(sphere => (
              <button
                key={sphere.id}
                onClick={() => {
                  onSphereChange(sphere.id);
                  onGoalChange(null); // Reset goal when sphere changes
                  setSphereOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  selectedSphereId === sphere.id 
                    ? "bg-primary/10" 
                    : "hover:bg-muted"
                )}
                style={selectedSphereId === sphere.id ? { color: sphere.color } : undefined}
              >
                <span>{sphere.icon}</span>
                <span className="truncate">
                  {isRussian ? sphere.name_ru : sphere.name_en}
                </span>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      {/* Goal Filter */}
      <Popover open={goalOpen} onOpenChange={setGoalOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-xs",
              selectedGoalId && "border-2"
            )}
            style={selectedGoalId ? { borderColor: selectedGoal?.color } : undefined}
          >
            <Target className="w-3.5 h-3.5" />
            {selectedGoal ? (
              <span className="flex items-center gap-1">
                <span>{selectedGoal.icon}</span>
                <span className="max-w-[100px] truncate">{selectedGoal.name}</span>
              </span>
            ) : (
              <span>{isRussian ? 'Цель' : 'Goal'}</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="space-y-1 max-h-64 overflow-y-auto">
            <button
              onClick={() => {
                onGoalChange(null);
                setGoalOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                !selectedGoalId 
                  ? "bg-primary/10 text-primary" 
                  : "hover:bg-muted"
              )}
            >
              <Target className="w-4 h-4" />
              {isRussian ? 'Все цели' : 'All goals'}
            </button>
            {filteredGoals.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                {isRussian ? 'Нет активных целей' : 'No active goals'}
                {selectedSphereId && (
                  <span className="block mt-1">
                    {isRussian ? 'в выбранной сфере' : 'in selected sphere'}
                  </span>
                )}
              </div>
            ) : (
              filteredGoals.map(goal => (
                <button
                  key={goal.id}
                  onClick={() => {
                    onGoalChange(goal.id);
                    // Auto-set sphere if goal has one
                    if (goal.sphere_id && goal.sphere_id !== selectedSphereId) {
                      onSphereChange(goal.sphere_id);
                    }
                    setGoalOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                    selectedGoalId === goal.id 
                      ? "bg-primary/10" 
                      : "hover:bg-muted"
                  )}
                  style={selectedGoalId === goal.id ? { color: goal.color } : undefined}
                >
                  <span>{goal.icon}</span>
                  <span className="truncate flex-1 text-left">{goal.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {goal.tasks_completed}/{goal.tasks_count}
                  </span>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs text-muted-foreground"
          onClick={() => {
            onSphereChange(null);
            onGoalChange(null);
          }}
        >
          {isRussian ? '✕ Сбросить' : '✕ Clear'}
        </Button>
      )}

      {/* Active filter badges */}
      {hasFilters && (
        <div className="flex gap-1">
          {selectedSphere && (
            <Badge 
              variant="outline" 
              className="text-[10px] h-5"
              style={{ borderColor: selectedSphere.color, color: selectedSphere.color }}
            >
              {selectedSphere.icon} {isRussian ? selectedSphere.name_ru : selectedSphere.name_en}
            </Badge>
          )}
          {selectedGoal && (
            <Badge 
              variant="outline" 
              className="text-[10px] h-5"
              style={{ borderColor: selectedGoal.color, color: selectedGoal.color }}
            >
              {selectedGoal.icon} {selectedGoal.name}
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}