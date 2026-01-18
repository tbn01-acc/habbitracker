import React from 'react';
import { motion } from 'framer-motion';
import { Star, Gift, Flame, Target, CheckCircle2, Users, Trophy, Zap, Award, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useStars } from '@/hooks/useStars';

interface StarProgramProps {
  isRussian: boolean;
}

export function StarProgram({ isRussian }: StarProgramProps) {
  const { userStars, loading } = useStars();

  const earnMethods = [
    {
      icon: CheckCircle2,
      title: isRussian ? 'Выполнение задач' : 'Complete tasks',
      description: isRussian ? 'Получайте звёзды за каждую выполненную задачу' : 'Earn stars for each completed task',
      stars: 1,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      icon: Target,
      title: isRussian ? 'Выполнение привычек' : 'Complete habits',
      description: isRussian ? 'Ежедневные привычки приносят звёзды' : 'Daily habits bring you stars',
      stars: 1,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    },
    {
      icon: Flame,
      title: isRussian ? 'Серия дней' : 'Day streaks',
      description: isRussian ? 'Бонусные звёзды за непрерывные серии' : 'Bonus stars for continuous streaks',
      stars: '2-10',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10'
    },
    {
      icon: Users,
      title: isRussian ? 'Приглашение друзей' : 'Invite friends',
      description: isRussian ? 'Получайте звёзды за каждого приглашённого друга' : 'Earn stars for each invited friend',
      stars: 50,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      icon: Trophy,
      title: isRussian ? 'Достижения' : 'Achievements',
      description: isRussian ? 'Разблокируйте достижения для получения наград' : 'Unlock achievements for rewards',
      stars: '10-100',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    },
    {
      icon: Zap,
      title: isRussian ? 'Таймер Pomodoro' : 'Pomodoro timer',
      description: isRussian ? 'Звёзды за сессии фокусировки' : 'Stars for focus sessions',
      stars: 1,
      color: 'text-red-500',
      bgColor: 'bg-red-500/10'
    },
    {
      icon: Award,
      title: isRussian ? 'Баланс «Устойчивость»' : 'Balance "Stability"',
      description: isRussian ? 'Достижение Spread ≤ 10 между сферами жизни' : 'Achieve Spread ≤ 10 between life spheres',
      stars: 25,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      icon: Crown,
      title: isRussian ? 'Баланс «Топ Фокус»' : 'Balance "Top Focus"',
      description: isRussian ? 'Достижение Spread ≤ 5 — идеальный баланс!' : 'Achieve Spread ≤ 5 — perfect balance!',
      stars: 50,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10'
    }
  ];

  const spendMethods = [
    {
      icon: Gift,
      title: isRussian ? 'Заморозка серии' : 'Streak freeze',
      description: isRussian ? 'Защитите свою серию на один день' : 'Protect your streak for one day',
      stars: 50,
      color: 'text-blue-400'
    },
    {
      icon: Award,
      title: isRussian ? 'Эксклюзивные рамки' : 'Exclusive frames',
      description: isRussian ? 'Уникальные рамки для профиля' : 'Unique frames for your profile',
      stars: '100-500',
      color: 'text-pink-500'
    },
    {
      icon: Crown,
      title: isRussian ? 'Премиум аватары' : 'Premium avatars',
      description: isRussian ? 'Особые аватары для вашего профиля' : 'Special avatars for your profile',
      stars: '200-1000',
      color: 'text-amber-500'
    }
  ];

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-24 bg-muted rounded-xl" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Current Stars Card */}
      <Card className="bg-gradient-to-br from-yellow-500/20 to-amber-500/10 border-yellow-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                {isRussian ? 'Ваш баланс' : 'Your balance'}
              </p>
              <div className="flex items-center gap-2">
                <Star className="h-8 w-8 text-yellow-500 fill-yellow-500" />
                <span className="text-4xl font-bold text-yellow-500">
                  {userStars?.total_stars || 0}
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">
                {isRussian ? 'Серия' : 'Streak'}
              </p>
              <div className="flex items-center gap-1 justify-end">
                <Flame className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold">
                  {userStars?.current_streak_days || 0}
                </span>
                <span className="text-muted-foreground text-sm">
                  {isRussian ? 'дн.' : 'days'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How to earn stars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-500" />
            {isRussian ? 'Как заработать звёзды' : 'How to earn stars'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {earnMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className={`p-2 rounded-lg ${method.bgColor}`}>
                <method.icon className={`w-5 h-5 ${method.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{method.title}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
              <div className="flex items-center gap-1 text-yellow-500 font-bold">
                <Star className="w-4 h-4 fill-yellow-500" />
                +{method.stars}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* How to spend stars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="w-4 h-4 text-pink-500" />
            {isRussian ? 'На что потратить звёзды' : 'How to spend stars'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {spendMethods.map((method, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="p-2 rounded-lg bg-muted">
                <method.icon className={`w-5 h-5 ${method.color}`} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{method.title}</p>
                <p className="text-xs text-muted-foreground">{method.description}</p>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground font-medium text-sm">
                <Star className="w-4 h-4" />
                {method.stars}
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      {/* Streak bonuses */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            {isRussian ? 'Бонусы за серии' : 'Streak bonuses'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {[
            { days: 7, bonus: 5 },
            { days: 14, bonus: 10 },
            { days: 30, bonus: 25 },
            { days: 60, bonus: 50 },
            { days: 100, bonus: 100 }
          ].map((streak, index) => {
            const progress = Math.min(100, ((userStars?.current_streak_days || 0) / streak.days) * 100);
            const achieved = (userStars?.current_streak_days || 0) >= streak.days;
            
            return (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${achieved ? 'bg-green-500/10 border border-green-500/30' : 'bg-muted/50'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${achieved ? 'text-green-500' : ''}`}>
                    {streak.days} {isRussian ? 'дней' : 'days'}
                  </span>
                  <span className={`flex items-center gap-1 font-bold ${achieved ? 'text-green-500' : 'text-yellow-500'}`}>
                    {achieved ? '✓' : <><Star className="w-3 h-3 fill-yellow-500" />+{streak.bonus}</>}
                  </span>
                </div>
                {!achieved && (
                  <Progress value={progress} className="h-1" />
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
