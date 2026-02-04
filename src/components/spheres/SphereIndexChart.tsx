import React, { useEffect, useState } from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { ru, enUS, es } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SphereIndexChartProps {
  sphereId: number;
  sphereColor: string;
}

interface ChartDataPoint {
  date: string;
  value: number;
  label: string;
}

export function SphereIndexChart({ sphereId, sphereColor }: SphereIndexChartProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable');

  const locale = language === 'ru' ? ru : language === 'es' ? es : enUS;

  const labels = {
    title: { ru: 'Динамика за 30 дней', en: '30-day dynamics', es: 'Dinámica de 30 días' },
    noData: { ru: 'Нет данных', en: 'No data', es: 'Sin datos' },
    trend: {
      up: { ru: 'Рост', en: 'Growing', es: 'Creciendo' },
      down: { ru: 'Падение', en: 'Declining', es: 'Declinando' },
      stable: { ru: 'Стабильно', en: 'Stable', es: 'Estable' },
    },
  };

  useEffect(() => {
    if (user) {
      fetchChartData();
    }
  }, [user, sphereId]);

  const fetchChartData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const now = new Date();
      const startDate = format(subDays(now, 30), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('life_index_history')
        .select('recorded_at, sphere_indices')
        .eq('user_id', user.id)
        .gte('recorded_at', startDate)
        .order('recorded_at', { ascending: true });

      if (error) {
        console.error('Error fetching sphere history:', error);
        return;
      }

      // Extract sphere-specific index values
      const sphereData: ChartDataPoint[] = (data || [])
        .filter(record => record.sphere_indices && typeof record.sphere_indices === 'object')
        .map(record => {
          const indices = record.sphere_indices as Record<string, number>;
          const sphereKey = String(sphereId);
          const value = indices[sphereKey] ?? 0;
          
          return {
            date: record.recorded_at,
            value: Math.round(value),
            label: format(new Date(record.recorded_at), 'd MMM', { locale }),
          };
        });

      setChartData(sphereData);

      // Calculate trend
      if (sphereData.length >= 2) {
        const firstHalf = sphereData.slice(0, Math.floor(sphereData.length / 2));
        const secondHalf = sphereData.slice(Math.floor(sphereData.length / 2));
        
        const avgFirst = firstHalf.reduce((s, d) => s + d.value, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, d) => s + d.value, 0) / secondHalf.length;
        
        const diff = avgSecond - avgFirst;
        if (diff > 3) setTrend('up');
        else if (diff < -3) setTrend('down');
        else setTrend('stable');
      }
    } catch (err) {
      console.error('Error loading chart data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-40 w-full rounded-xl" />;
  }

  if (chartData.length === 0) {
    return (
      <Card className="p-4 text-center text-muted-foreground">
        <p className="text-sm">{labels.noData[language]}</p>
      </Card>
    );
  }

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground';

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium">{labels.title[language]}</h4>
        <div className={`flex items-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-3" />
          <span>{labels.trend[trend][language]}</span>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <XAxis 
            dataKey="label" 
            tick={{ fontSize: 10 }} 
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fontSize: 10 }} 
            tickLine={false}
            axisLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value: number) => [`${value}%`, 'Индекс']}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={sphereColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: sphereColor }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}
