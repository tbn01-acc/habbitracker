import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ThumbsUp, Zap } from 'lucide-react';

export type LeaderboardType = 'stars' | 'likes' | 'activity';
export type LeaderboardPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

interface LeaderboardTabsProps {
  type: LeaderboardType;
  onTypeChange: (type: LeaderboardType) => void;
  period: LeaderboardPeriod;
  onPeriodChange: (period: LeaderboardPeriod) => void;
  isRussian: boolean;
}

export function LeaderboardTabs({ type, onTypeChange, period, onPeriodChange, isRussian }: LeaderboardTabsProps) {
  return (
    <div className="space-y-3">
      {/* Type tabs */}
      <Tabs value={type} onValueChange={(v) => onTypeChange(v as LeaderboardType)}>
        <TabsList className="grid w-full grid-cols-3 h-9">
          <TabsTrigger value="stars" className="text-xs gap-1">
            <Star className="w-3 h-3" />
            {isRussian ? 'Звёзды' : 'Stars'}
          </TabsTrigger>
          <TabsTrigger value="likes" className="text-xs gap-1">
            <ThumbsUp className="w-3 h-3" />
            {isRussian ? 'Лайки' : 'Likes'}
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs gap-1">
            <Zap className="w-3 h-3" />
            {isRussian ? 'Активность' : 'Activity'}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Period tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {([
          { value: 'today', labelRu: 'Сегодня', labelEn: 'Today' },
          { value: 'week', labelRu: 'Неделя', labelEn: 'Week' },
          { value: 'month', labelRu: 'Месяц', labelEn: 'Month' },
          { value: 'quarter', labelRu: 'Квартал', labelEn: 'Quarter' },
          { value: 'year', labelRu: 'Год', labelEn: 'Year' },
          { value: 'all', labelRu: 'Всё время', labelEn: 'All time' },
        ] as const).map((p) => (
          <button
            key={p.value}
            onClick={() => onPeriodChange(p.value)}
            className={`px-2 py-1 text-xs rounded-md transition-all ${
              period === p.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {isRussian ? p.labelRu : p.labelEn}
          </button>
        ))}
      </div>
    </div>
  );
}
