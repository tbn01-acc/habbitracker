import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { DemoData } from '@/lib/demo/testData';

interface DemoBurndownChartProps {
  data: DemoData;
}

export function DemoBurndownChart({ data }: DemoBurndownChartProps) {
  const chartData = useMemo(() => {
    return data.burndown.map(point => ({
      date: point.day,
      ideal: point.ideal,
      actual: point.actual,
    }));
  }, [data.burndown]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload?.length) {
      const actual = payload.find((p: any) => p.dataKey === 'actual');
      const ideal = payload.find((p: any) => p.dataKey === 'ideal');
      return (
        <div className="bg-card border border-border rounded-lg p-2.5 shadow-lg text-xs">
          <p className="font-medium mb-1">{label}</p>
          {ideal && <p className="text-muted-foreground">Идеал: {Math.round(ideal.value)} SP</p>}
          {actual && <p className="text-primary">Факт: {actual.value} SP</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Диаграмма сгорания</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
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
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
