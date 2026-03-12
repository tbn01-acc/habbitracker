import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';

export type RatingType = 'stars' | 'likes' | 'referrals';
export type RatingPeriod = 'today' | 'month' | 'year' | 'all';

interface RatingTabsProps {
  type: RatingType;
  onTypeChange: (type: RatingType) => void;
  period: RatingPeriod;
  onPeriodChange: (period: RatingPeriod) => void;
  isRussian: boolean;
}

const tabVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' as const } },
};

export function RatingTabs({ type, onTypeChange, period, onPeriodChange, isRussian }: RatingTabsProps) {
  return (
    <div className="space-y-3">
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
