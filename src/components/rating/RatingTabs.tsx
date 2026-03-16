import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users } from 'lucide-react';

export type RatingType = 'stars' | 'likes' | 'referrals';
export type RatingPeriod = 'today' | 'month' | 'year' | 'all';
export type RatingScope = 'personal' | 'team';

interface RatingTabsProps {
  type: RatingType;
  onTypeChange: (type: RatingType) => void;
  period: RatingPeriod;
  onPeriodChange: (period: RatingPeriod) => void;
  scope: RatingScope;
  onScopeChange: (scope: RatingScope) => void;
  isRussian: boolean;
}

const tabVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

export function RatingTabs({ type, onTypeChange, period, onPeriodChange, scope, onScopeChange, isRussian }: RatingTabsProps) {
  return (
    <div className="space-y-3">
      {/* Scope: Personal / Team */}
      <div className="flex gap-2">
        <Button
          variant={scope === 'personal' ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5 flex-1"
          onClick={() => onScopeChange('personal')}
        >
          <User className="w-4 h-4" />
          {isRussian ? 'Персона' : 'Personal'}
        </Button>
        <Button
          variant={scope === 'team' ? 'default' : 'outline'}
          size="sm"
          className="gap-1.5 flex-1"
          onClick={() => onScopeChange('team')}
        >
          <Users className="w-4 h-4" />
          {isRussian ? 'Команда' : 'Team'}
        </Button>
      </div>

      {/* Type tabs - Stars/Likes/Referrals */}
      <Tabs value={type} onValueChange={(v) => onTypeChange(v as RatingType)}>
        <TabsList className="grid w-full grid-cols-3 h-10 bg-muted/50">
          <TabsTrigger value="stars" className="text-sm gap-2 data-[state=active]:bg-background">
            {isRussian ? 'Звёзды' : 'Stars'}
          </TabsTrigger>
          <TabsTrigger value="likes" className="text-sm gap-2 data-[state=active]:bg-background">
            {isRussian ? 'Лайки' : 'Likes'}
          </TabsTrigger>
          <TabsTrigger value="referrals" className="text-sm gap-2 data-[state=active]:bg-background">
            {isRussian ? 'Рефералы' : 'Referrals'}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Period tabs with animation */}
      <AnimatePresence mode="wait">
        <motion.div
          key={type}
          variants={tabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex gap-2 border-b border-border overflow-x-auto"
        >
          {([
            { value: 'today', labelRu: 'Сегодня', labelEn: 'Today' },
            { value: 'month', labelRu: 'Месяц', labelEn: 'Month' },
            { value: 'year', labelRu: 'Год', labelEn: 'Year' },
            { value: 'all', labelRu: 'Всё время', labelEn: 'All time' },
          ] as const).map((p, i) => (
            <motion.button
              key={p.value}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, duration: 0.2 }}
              onClick={() => onPeriodChange(p.value)}
              className={`pb-2 text-sm font-medium transition-all border-b-2 whitespace-nowrap ${
                period === p.value
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {isRussian ? p.labelRu : p.labelEn}
            </motion.button>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
