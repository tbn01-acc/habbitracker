import { useState, useEffect } from 'react';
import { Droplets, Footprints, Plus, Minus, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';

interface Counter {
  id: string;
  value: number;
  goal: number;
}

const COUNTERS_KEY = 'habitflow_habit_counters';
const COUNTERS_DATE_KEY = 'habitflow_habit_counters_date';

export function HabitCounters() {
  const { t } = useTranslation();
  const [counters, setCounters] = useState<{ water: Counter; steps: Counter }>({
    water: { id: 'water', value: 0, goal: 8 },
    steps: { id: 'steps', value: 0, goal: 10000 },
  });

  // Load counters
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const savedDate = localStorage.getItem(COUNTERS_DATE_KEY);
    
    if (savedDate !== today) {
      // Reset counters for new day
      localStorage.setItem(COUNTERS_DATE_KEY, today);
      localStorage.removeItem(COUNTERS_KEY);
    } else {
      const saved = localStorage.getItem(COUNTERS_KEY);
      if (saved) {
        try {
          setCounters(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse counters:', e);
        }
      }
    }
  }, []);

  // Save counters
  useEffect(() => {
    localStorage.setItem(COUNTERS_KEY, JSON.stringify(counters));
  }, [counters]);

  const updateCounter = (type: 'water' | 'steps', delta: number) => {
    setCounters(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        value: Math.max(0, prev[type].value + delta),
      },
    }));
  };

  const resetCounter = (type: 'water' | 'steps') => {
    setCounters(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        value: 0,
      },
    }));
  };

  const waterProgress = Math.min(100, (counters.water.value / counters.water.goal) * 100);
  const stepsProgress = Math.min(100, (counters.steps.value / counters.steps.goal) * 100);

  return (
    <div className="space-y-4">
      {/* Water Counter */}
      <Card className="border-service/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              {t('water')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetCounter('water')}
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {t('resetCounter')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateCounter('water', -1)}
              className="h-12 w-12 rounded-full"
            >
              <Minus className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <span className="text-4xl font-bold text-blue-500">{counters.water.value}</span>
              <span className="text-muted-foreground ml-1">/ {counters.water.goal}</span>
              <p className="text-sm text-muted-foreground">{t('cups')}</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateCounter('water', 1)}
              className="h-12 w-12 rounded-full bg-blue-500/10 border-blue-500/30 hover:bg-blue-500/20"
            >
              <Plus className="w-5 h-5 text-blue-500" />
            </Button>
          </div>
          <Progress value={waterProgress} className="h-2" />
        </CardContent>
      </Card>

      {/* Steps Counter */}
      <Card className="border-service/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Footprints className="w-4 h-4 text-orange-500" />
              {t('steps')}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => resetCounter('steps')}
              className="h-8 px-2 text-xs"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              {t('resetCounter')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateCounter('steps', -100)}
              className="h-12 w-12 rounded-full"
            >
              <Minus className="w-5 h-5" />
            </Button>
            <div className="text-center">
              <span className="text-4xl font-bold text-orange-500">
                {counters.steps.value.toLocaleString()}
              </span>
              <p className="text-sm text-muted-foreground">
                {t('goal')}: {counters.steps.goal.toLocaleString()}
              </p>
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={() => updateCounter('steps', 100)}
              className="h-12 w-12 rounded-full bg-orange-500/10 border-orange-500/30 hover:bg-orange-500/20"
            >
              <Plus className="w-5 h-5 text-orange-500" />
            </Button>
          </div>
          <Progress value={stepsProgress} className="h-2" />
        </CardContent>
      </Card>
    </div>
  );
}
