import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from '@/contexts/LanguageContext';
import { Sprint, SprintDailyStat } from '@/hooks/useTeam';
import { format, eachDayOfInterval, parseISO, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

interface SprintBurndownChartProps {
  sprint: Sprint | null;
  dailyStats: SprintDailyStat[];
  isLoading?: boolean;
}

export function SprintBurndownChart({ sprint, dailyStats, isLoading }: SprintBurndownChartProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';

  const chartData = useMemo(() => {
    if (!sprint) return [];

    const start = parseISO(sprint.start_date);
    const end = parseISO(sprint.end_date);
    const days = eachDayOfInterval({ start, end });
    const totalSP = sprint.total_sp_planned;
    const totalDays = differenceInDays(end, start);

    const statsMap = new Map<string, SprintDailyStat>();
    dailyStats.forEach(s => statsMap.set(s.record_date, s));

    let lastKnownRemaining = totalSP;

    return days.map((day, i) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const stat = statsMap.get(dateKey);
      const ideal = Math.max(0, totalSP - (i * (totalSP / Math.max(totalDays, 1))));

      if (stat) {
        lastKnownRemaining = stat.remaining_sp;
      }

      const isToday = format(new Date(), 'yyyy-MM-dd') === dateKey;
      const isFuture = day > new Date();

      return {
        date: format(day, 'dd MMM', { locale: isRu ? ru : undefined }),
        ideal: Math.round(ideal * 10) / 10,
        actual: isFuture ? undefined : lastKnownRemaining,
        fullDate: dateKey,
      };
    });
  }, [sprint, dailyStats, isRu]);

  if (isLoading) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!sprint || sprint.total_sp_planned === 0) {
    return (
      <Card className="border-border/50 bg-card/80 backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{isRu ? 'Диаграмма сгорания' : 'Burndown Chart'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] flex items-center justify-center text-sm text-muted-foreground">
            {isRu
              ? 'Добавьте задачи в спринт, чтобы увидеть прогноз сгорания'
              : 'Add tasks to the sprint to see the burndown forecast'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const actual = payload.find((p: any) => p.dataKey === 'actual');
      const ideal = payload.find((p: any) => p.dataKey === 'ideal');
      const totalSP = sprint?.total_sp_planned || 1;
      const progress = actual?.value != null
        ? Math.round(((totalSP - actual.value) / totalSP) * 100)
        : null;

      return (
        <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs">
          <p className="font-medium mb-1">{label}</p>
          {ideal && <p className="text-muted-foreground">{isRu ? 'Идеал' : 'Ideal'}: {Math.round(ideal.value)} SP</p>}
          {actual && <p className="text-primary">{isRu ? 'Факт' : 'Actual'}: {actual.value} SP</p>}
          {progress != null && <p className="text-green-500">{isRu ? 'Прогресс' : 'Progress'}: {progress}%</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{isRu ? 'Диаграмма сгорания' : 'Burndown Chart'}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="ideal"
                stroke="hsl(var(--muted-foreground))"
                strokeDasharray="5 5"
                strokeWidth={1.5}
                dot={false}
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.15)"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--primary))' }}
                connectNulls={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
