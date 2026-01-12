import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Trophy, Lightbulb } from 'lucide-react';

export type FeedType = 'activity' | 'success' | 'ideas';

interface FeedTabsProps {
  type: FeedType;
  onTypeChange: (type: FeedType) => void;
  isRussian: boolean;
}

export function FeedTabs({ type, onTypeChange, isRussian }: FeedTabsProps) {
  return (
    <Tabs value={type} onValueChange={(v) => onTypeChange(v as FeedType)}>
      <TabsList className="grid w-full grid-cols-3 h-9">
        <TabsTrigger value="activity" className="text-xs gap-1">
          <Camera className="w-3 h-3" />
          {isRussian ? 'Актив' : 'Activity'}
        </TabsTrigger>
        <TabsTrigger value="success" className="text-xs gap-1">
          <Trophy className="w-3 h-3" />
          {isRussian ? 'Успехи' : 'Success'}
        </TabsTrigger>
        <TabsTrigger value="ideas" className="text-xs gap-1">
          <Lightbulb className="w-3 h-3" />
          {isRussian ? 'Идеи' : 'Ideas'}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
