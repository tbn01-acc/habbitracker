import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Trophy, Lock, Zap, Target, CheckCircle2, Star, TrendingUp, Crown, ShoppingBag, Sparkles, Medal, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Achievements as AchievementsComponent } from '@/components/Achievements';
import { AchievementsPanel } from '@/components/AchievementsPanel';
import { RewardsShopTab } from '@/components/rewards/RewardsShopTab';
import { StarProgram } from '@/components/rewards/StarProgram';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useUserLevel } from '@/hooks/useUserLevel';
import { useRewardsShop } from '@/hooks/useRewardsShop';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useState } from 'react';

export default function AchievementsPage() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const { currentPlan, loading: subLoading } = useSubscription();
  const { levelInfo, loading: levelLoading, getLevelTitle, getLevelColor, XP_REWARDS } = useUserLevel();
  const { rewards, purchasedRewards, loading: rewardsLoading, userStars, purchaseReward, useReward, getUnusedRewards } = useRewardsShop();
  const isRussian = language === 'ru';
  const isPro = currentPlan === 'pro';

  // Get initial tab from URL params
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl === 'star-program' ? 'star-program' : 'badges-level');
  const [badgesSubTab, setBadgesSubTab] = useState<'badges' | 'level'>('badges');

  useEffect(() => {
    if (tabFromUrl === 'star-program') {
      setActiveTab('star-program');
    }
  }, [tabFromUrl]);

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {isRussian ? 'Загрузка...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Награды и достижения' : 'Rewards & Achievements'}
              </h1>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="badges-level">
              <Award className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{isRussian ? 'Бейджи' : 'Badges'}</span>
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Medal className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{isRussian ? 'Достижения' : 'Achievements'}</span>
            </TabsTrigger>
            <TabsTrigger value="shop">
              <ShoppingBag className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{isRussian ? 'Магазин' : 'Shop'}</span>
            </TabsTrigger>
            <TabsTrigger value="star-program">
              <Sparkles className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{isRussian ? 'Звёзды' : 'Stars'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Badges & Level Tab */}
          <TabsContent value="badges-level">
            {/* Sub-tabs for Badges and Level */}
            <div className="flex gap-2 mb-4 border-b">
              <button
                onClick={() => setBadgesSubTab('badges')}
                className={`pb-2 px-3 text-sm font-medium transition-all border-b-2 ${
                  badgesSubTab === 'badges'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {isRussian ? 'Бейджи' : 'Badges'}
              </button>
              <button
                onClick={() => setBadgesSubTab('level')}
                className={`pb-2 px-3 text-sm font-medium transition-all border-b-2 flex items-center gap-1 ${
                  badgesSubTab === 'level'
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {isRussian ? 'Уровень' : 'Level'}
                {!isPro && <Lock className="w-3 h-3" />}
              </button>
            </div>

            {badgesSubTab === 'badges' ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AchievementsComponent />
              </motion.div>
            ) : (
              // Level content
              !isPro ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5">
                    <CardContent className="p-6 text-center space-y-4">
                      <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                        <Crown className="w-8 h-8 text-amber-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-foreground mb-2">
                          {isRussian ? 'Система уровней — PRO функция' : 'Level System — PRO Feature'}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          {isRussian 
                            ? 'Получайте XP за выполненные задачи и привычки, повышайте уровень и открывайте новые титулы!'
                            : 'Earn XP for completed tasks and habits, level up and unlock new titles!'}
                        </p>
                      </div>
                      <Button onClick={() => navigate('/upgrade')} className="bg-gradient-to-r from-amber-500 to-yellow-500">
                        <Crown className="w-4 h-4 mr-2" />
                        {isRussian ? 'Перейти на PRO' : 'Upgrade to PRO'}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : levelLoading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-32 bg-muted rounded-xl" />
                  <div className="h-24 bg-muted rounded-xl" />
                </div>
              ) : levelInfo ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Level Card */}
                  <Card className={`border-0 bg-gradient-to-br ${getLevelColor(levelInfo.level)} text-white overflow-hidden relative`}>
                    <div className="absolute inset-0 bg-black/20" />
                    <CardContent className="p-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-3xl font-bold">{levelInfo.level}</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm opacity-80 mb-1">
                            {isRussian ? 'Ваш уровень' : 'Your Level'}
                          </div>
                          <div className="text-2xl font-bold mb-2">
                            {getLevelTitle(levelInfo.level, language)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress 
                              value={levelInfo.progressPercent} 
                              className="h-2 flex-1 bg-white/20"
                            />
                            <span className="text-xs opacity-80">
                              {levelInfo.xpInCurrentLevel}/{levelInfo.xpToNextLevel} XP
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* XP Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                          <Zap className="w-5 h-5 text-blue-500" />
                        </div>
                        <div className="text-xl font-bold text-foreground">{levelInfo.totalXp}</div>
                        <div className="text-xs text-muted-foreground">
                          {isRussian ? 'Всего XP' : 'Total XP'}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto rounded-full bg-green-500/20 flex items-center justify-center mb-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        </div>
                        <div className="text-xl font-bold text-foreground">{levelInfo.tasksCompleted}</div>
                        <div className="text-xs text-muted-foreground">
                          {isRussian ? 'Задач' : 'Tasks'}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                          <Target className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="text-xl font-bold text-foreground">{levelInfo.habitsCompleted}</div>
                        <div className="text-xs text-muted-foreground">
                          {isRussian ? 'Привычек' : 'Habits'}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* XP Rewards Info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Star className="w-4 h-4 text-amber-500" />
                        {isRussian ? 'Как получать XP' : 'How to earn XP'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRussian ? 'Выполнить задачу' : 'Complete a task'}
                        </span>
                        <span className="font-medium text-primary">+{XP_REWARDS.task} XP</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRussian ? 'Выполнить привычку' : 'Complete a habit'}
                        </span>
                        <span className="font-medium text-primary">+{XP_REWARDS.habit} XP</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRussian ? 'Получить звезду' : 'Earn a star'}
                        </span>
                        <span className="font-medium text-primary">+{XP_REWARDS.star} XP</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRussian ? 'Серия 7 дней' : '7-day streak'}
                        </span>
                        <span className="font-medium text-primary">+{XP_REWARDS.streak_7} XP</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {isRussian ? 'Серия 30 дней' : '30-day streak'}
                        </span>
                        <span className="font-medium text-primary">+{XP_REWARDS.streak_30} XP</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : null
            )}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AchievementsPanel />
            </motion.div>
          </TabsContent>

          {/* Shop Tab */}
          <TabsContent value="shop">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <RewardsShopTab
                rewards={rewards}
                purchasedRewards={purchasedRewards}
                loading={rewardsLoading}
                userStars={userStars}
                purchaseReward={purchaseReward}
                useReward={useReward}
                getUnusedRewards={getUnusedRewards}
              />
            </motion.div>
          </TabsContent>

          {/* Star Program Tab */}
          <TabsContent value="star-program">
            <StarProgram isRussian={isRussian} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
