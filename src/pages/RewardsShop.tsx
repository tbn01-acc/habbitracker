import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';
import { useRewardsShop } from '@/hooks/useRewardsShop';
import { useStars } from '@/hooks/useStars';
import { AppHeader } from '@/components/AppHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, Snowflake, Percent, ShoppingBag, CheckCircle, Clock, Gift, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function RewardsShop() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const { 
    rewards, 
    purchasedRewards, 
    loading, 
    userStars, 
    purchaseReward, 
    useReward,
    getUnusedRewards 
  } = useRewardsShop();
  const { userStars: starsData } = useStars();

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'freeze': return <Snowflake className="h-8 w-8 text-blue-500" />;
      case 'pro_discount': return <Percent className="h-8 w-8 text-green-500" />;
      default: return <Gift className="h-8 w-8 text-primary" />;
    }
  };

  const unusedRewards = getUnusedRewards();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <ShoppingBag className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">
              {isRussian ? 'Магазин наград' : 'Rewards Shop'}
            </h1>
          </div>
          
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
            {userStars}
          </Badge>
        </div>

        {/* Stars info */}
        {starsData && (
          <Card className="mb-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <Star className="h-6 w-6 mx-auto mb-1 text-yellow-500 fill-yellow-500" />
                  <p className="text-2xl font-bold">{starsData.total_stars}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Всего звёзд' : 'Total stars'}</p>
                </div>
                <div>
                  <Clock className="h-6 w-6 mx-auto mb-1 text-blue-500" />
                  <p className="text-2xl font-bold">{starsData.current_streak_days}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Дней подряд' : 'Day streak'}</p>
                </div>
                <div>
                  <Gift className="h-6 w-6 mx-auto mb-1 text-purple-500" />
                  <p className="text-2xl font-bold">{unusedRewards.length}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Награды' : 'Rewards'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="shop">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="shop">
              <ShoppingBag className="h-4 w-4 mr-2" />
              {isRussian ? 'Магазин' : 'Shop'}
            </TabsTrigger>
            <TabsTrigger value="inventory">
              <Gift className="h-4 w-4 mr-2" />
              {isRussian ? 'Мои награды' : 'My Rewards'}
              {unusedRewards.length > 0 && (
                <Badge variant="secondary" className="ml-2">{unusedRewards.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="shop">
            {loading ? (
              <div className="grid gap-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid gap-4">
                {rewards.map((reward, index) => {
                  const canAfford = userStars >= reward.price_stars;
                  
                  return (
                    <motion.div
                      key={reward.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className={!canAfford ? 'opacity-60' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="p-3 bg-muted rounded-lg">
                              {getRewardIcon(reward.reward_type)}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className="font-semibold">{reward.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {reward.description}
                              </p>
                              
                              {reward.reward_type === 'freeze' && (
                                <Badge variant="outline" className="mt-2">
                                  {isRussian ? '1 раз в месяц' : 'Once per month'}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="text-right">
                              <div className="flex items-center gap-1 text-lg font-bold mb-2">
                                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                {reward.price_stars}
                              </div>
                              
                              <Button
                                size="sm"
                                disabled={!canAfford}
                                onClick={() => purchaseReward(reward.id)}
                              >
                                {isRussian ? 'Купить' : 'Buy'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}

                {rewards.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {isRussian ? 'Магазин пока пуст' : 'Shop is empty'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="inventory">
            <div className="space-y-4">
              {purchasedRewards.length > 0 ? (
                purchasedRewards.map((pr, index) => (
                  <motion.div
                    key={pr.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={pr.is_used ? 'opacity-60' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-muted rounded-lg">
                            {pr.reward && getRewardIcon(pr.reward.reward_type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{pr.reward?.name}</h3>
                              {pr.is_used ? (
                                <Badge variant="secondary">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  {isRussian ? 'Использовано' : 'Used'}
                                </Badge>
                              ) : (
                                <Badge variant="default">
                                  {isRussian ? 'Доступно' : 'Available'}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(pr.created_at), 'dd MMM yyyy', { locale: ru })}
                            </p>
                          </div>
                          
                          {!pr.is_used && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => useReward(pr.id)}
                            >
                              {isRussian ? 'Использовать' : 'Use'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <Gift className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      {isRussian ? 'У вас пока нет наград' : 'No rewards yet'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRussian ? 'Заработайте звёзды и купите награды!' : 'Earn stars and buy rewards!'}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
