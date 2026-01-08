import { motion } from 'framer-motion';
import { TrendingUp, Crown, Gift, Target, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/contexts/LanguageContext';

interface ReferralProgressChartProps {
  paidReferrals: number;
  activeReferrals: number;
  isPro: boolean;
}

interface LevelTier {
  min: number;
  max: number;
  label: string;
  bonus: string;
  color: string;
  icon: React.ReactNode;
}

export function ReferralProgressChart({ paidReferrals, activeReferrals, isPro }: ReferralProgressChartProps) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';

  // Define tiers based on user type
  const tiers: LevelTier[] = isPro ? [
    { min: 0, max: 0, label: isRussian ? 'Старт' : 'Start', bonus: '0%', color: 'bg-muted', icon: <Target className="w-4 h-4" /> },
    { min: 1, max: 10, label: isRussian ? 'Бронза' : 'Bronze', bonus: '5%', color: 'bg-amber-600', icon: <TrendingUp className="w-4 h-4" /> },
    { min: 11, max: 25, label: isRussian ? 'Серебро' : 'Silver', bonus: '10%', color: 'bg-gray-400', icon: <Crown className="w-4 h-4" /> },
    { min: 26, max: Infinity, label: isRussian ? 'Золото' : 'Gold', bonus: '15%', color: 'bg-amber-500', icon: <Crown className="w-4 h-4" /> },
  ] : [
    { min: 0, max: 0, label: isRussian ? 'Старт' : 'Start', bonus: '+0', color: 'bg-muted', icon: <Target className="w-4 h-4" /> },
    { min: 1, max: 10, label: isRussian ? 'Уровень 1' : 'Level 1', bonus: '+2 нед.', color: 'bg-green-500', icon: <Gift className="w-4 h-4" /> },
    { min: 11, max: 25, label: isRussian ? 'Уровень 2' : 'Level 2', bonus: '+3 нед.', color: 'bg-blue-500', icon: <TrendingUp className="w-4 h-4" /> },
    { min: 26, max: Infinity, label: isRussian ? 'Уровень 3' : 'Level 3', bonus: '+4 нед.', color: 'bg-purple-500', icon: <Crown className="w-4 h-4" /> },
  ];

  // Find current tier
  const currentTierIndex = tiers.findIndex((tier, index) => {
    if (index === tiers.length - 1) return paidReferrals >= tier.min;
    return paidReferrals >= tier.min && paidReferrals <= tier.max;
  });

  const currentTier = tiers[Math.max(0, currentTierIndex)];
  const nextTier = tiers[Math.min(currentTierIndex + 1, tiers.length - 1)];

  // Calculate progress to next tier
  const progressToNext = currentTierIndex === tiers.length - 1 
    ? 100 
    : ((paidReferrals - currentTier.min) / (nextTier.min - currentTier.min)) * 100;

  const refsToNextLevel = nextTier.min - paidReferrals;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary" />
          {isRussian ? 'Прогресс уровней' : 'Level Progress'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Level Display */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`p-4 rounded-xl ${currentTier.color}/20 border border-${currentTier.color.replace('bg-', '')}/30`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full ${currentTier.color} flex items-center justify-center text-white`}>
                {currentTier.icon}
              </div>
              <div>
                <div className="font-bold text-foreground">{currentTier.label}</div>
                <div className="text-sm text-muted-foreground">
                  {isPro 
                    ? (isRussian ? `Комиссия: ${currentTier.bonus}` : `Commission: ${currentTier.bonus}`)
                    : (isRussian ? `Бонус: ${currentTier.bonus}` : `Bonus: ${currentTier.bonus}`)}
                </div>
              </div>
            </div>
            <Badge variant="outline" className="text-lg font-bold">
              {paidReferrals}
            </Badge>
          </div>
        </motion.div>

        {/* Progress Bar to Next Level */}
        {currentTierIndex < tiers.length - 1 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {isRussian ? 'До следующего уровня' : 'To next level'}
              </span>
              <span className="font-medium text-foreground">
                {refsToNextLevel} {isRussian ? 'рефералов' : 'referrals'}
              </span>
            </div>
            <div className="relative">
              <Progress value={progressToNext} className="h-3" />
              <motion.div
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="absolute -top-1 -right-1"
                style={{ left: `${Math.min(progressToNext, 95)}%` }}
              >
                <div className="w-5 h-5 rounded-full bg-primary border-2 border-background shadow-lg" />
              </motion.div>
            </div>
            <div className="flex items-center justify-end gap-2 text-sm">
              <span className="text-muted-foreground">{isRussian ? 'Следующий:' : 'Next:'}</span>
              <Badge className={`${nextTier.color} text-white`}>
                {nextTier.label} ({nextTier.bonus})
              </Badge>
            </div>
          </div>
        )}

        {/* Visual Level Steps */}
        <div className="relative">
          <div className="absolute top-4 left-0 right-0 h-1 bg-muted rounded-full" />
          <div className="relative flex justify-between">
            {tiers.map((tier, index) => {
              const isCompleted = paidReferrals >= tier.min;
              const isCurrent = index === currentTierIndex;
              
              return (
                <motion.div
                  key={tier.label}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center"
                >
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all ${
                      isCurrent 
                        ? `${tier.color} text-white ring-4 ring-${tier.color.replace('bg-', '')}/30`
                        : isCompleted 
                          ? `${tier.color} text-white` 
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {tier.icon}
                  </div>
                  <div className={`mt-2 text-xs text-center ${isCurrent ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                    {tier.min === 0 ? '0' : tier.min}+
                  </div>
                  <div className={`text-xs ${isCurrent ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                    {tier.bonus}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Motivational Message */}
        {currentTierIndex < tiers.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-center"
          >
            <p className="text-sm text-foreground">
              {isRussian 
                ? `🎯 Пригласите ещё ${refsToNextLevel} друзей для ${nextTier.bonus}!`
                : `🎯 Invite ${refsToNextLevel} more friends for ${nextTier.bonus}!`}
            </p>
          </motion.div>
        )}

        {currentTierIndex === tiers.length - 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 text-center"
          >
            <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
              🏆 {isRussian ? 'Вы достигли максимального уровня!' : 'You reached the maximum level!'}
            </p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
