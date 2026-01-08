import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, ArrowLeft, Copy, Check, Gift, Crown,
  Wallet, TrendingUp, Clock, Info,
  DollarSign, Zap, BarChart3, Share2, Calculator
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useReferralProgram } from '@/hooks/useReferralProgram';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { ReferralProgressChart } from '@/components/referral/ReferralProgressChart';
import { EarningsCalculator } from '@/components/referral/EarningsCalculator';
import { ReferralModal } from '@/components/ReferralModal';

export default function PartnerProgram() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isProActive, subscription } = useSubscription();
  const { stats, periodStats, wallet, calculateBonus, getNextReferralBonus, loading } = useReferralProgram();
  const isRussian = language === 'ru';

  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  const referralCode = profile?.referral_code;
  const referralLink = referralCode ? `${window.location.origin}/auth?ref=${referralCode}` : '';

  const isPro = isProActive && !subscription?.is_trial;
  const isLifetime = subscription?.period === 'lifetime';
  const { bonusWeeks, commissionPercent } = calculateBonus();
  const nextBonus = getNextReferralBonus();

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(isRussian ? '🎉 Ссылка скопирована!' : '🎉 Link copied!');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#8b5cf6', '#a855f7', '#c084fc', '#d8b4fe'],
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRussian ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {isRussian ? 'Загрузка...' : 'Loading...'}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Партнёрская программа' : 'Partner Program'}
              </h1>
            </div>
          </div>
        </div>

        {/* User Type Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className={`border-2 ${isPro ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent' : 'border-blue-500/50 bg-gradient-to-br from-blue-500/10 to-transparent'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPro ? 'bg-amber-500/20' : 'bg-blue-500/20'}`}>
                    {isPro ? <Crown className="w-6 h-6 text-amber-500" /> : <Users className="w-6 h-6 text-blue-500" />}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {isPro ? (isRussian ? 'PRO Партнёр' : 'PRO Partner') : (isRussian ? 'Партнёр' : 'Partner')}
                      {isLifetime && <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs">Lifetime</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isPro 
                        ? (isRussian ? 'Получайте до 15% с оплат рефералов' : 'Earn up to 15% from referral payments')
                        : (isRussian ? 'Получайте недели PRO за рефералов' : 'Earn PRO weeks for referrals')
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Invite Button & Referral Link */}
        {user ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-500" />
                  {isRussian ? 'Ваша реферальная ссылка' : 'Your Referral Link'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <div className="bg-white p-2 rounded-lg shrink-0">
                    <QRCodeSVG value={referralLink} size={80} />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs font-mono truncate">
                        {referralLink}
                      </div>
                      <Button variant="outline" size="icon" onClick={handleCopy}>
                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>
                    <Button 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={() => setShowInviteModal(true)}
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {isRussian ? 'Пригласить друзей' : 'Invite Friends'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <Card className="mb-6">
            <CardContent className="pt-6 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                {isRussian 
                  ? 'Войдите в аккаунт, чтобы получить реферальную ссылку'
                  : 'Sign in to get your referral link'}
              </p>
              <Button onClick={() => navigate('/auth')}>
                {isRussian ? 'Войти' : 'Sign In'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="stats" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="stats" className="text-xs">
              <BarChart3 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="levels" className="text-xs">
              <TrendingUp className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="calculator" className="text-xs">
              <Calculator className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="wallet" className="text-xs">
              <Wallet className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            {/* Current Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">{stats.activeReferrals}</div>
                  <div className="text-xs text-muted-foreground">
                    {isRussian ? 'Активных рефералов' : 'Active Referrals'}
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs text-green-500 border-green-500/30">
                    <Gift className="w-3 h-3 mr-1" />
                    +{isPro ? stats.activeReferrals * 2 : stats.activeReferrals} {isRussian ? 'нед.' : 'weeks'}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-foreground mb-1">{stats.paidReferrals}</div>
                  <div className="text-xs text-muted-foreground">
                    {isRussian ? 'Оплативших PRO' : 'Paid for PRO'}
                  </div>
                  {isPro && commissionPercent > 0 && (
                    <Badge variant="outline" className="mt-2 text-xs text-amber-500 border-amber-500/30">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {commissionPercent}% {isRussian ? 'комиссия' : 'commission'}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Pending Activation */}
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">
                    {isRussian ? 'Ожидают активации' : 'Pending Activation'}
                  </span>
                  <span className="font-semibold">{stats.pendingActivation}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRussian 
                    ? 'Реферал становится активным после 7 дней и 30 минут в приложении'
                    : 'Referral becomes active after 7 days and 30 minutes in the app'}
                </p>
              </CardContent>
            </Card>

            {/* Period Stats */}
            {periodStats && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">
                    {isRussian ? 'Статистика по периодам' : 'Period Statistics'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">
                        {isRussian ? 'Месяц' : 'Month'}
                      </div>
                      <div className="font-bold">{periodStats.month.totalReferrals}</div>
                      <div className="text-xs text-green-500">+{periodStats.month.activeReferrals} акт.</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">
                        {isRussian ? 'Квартал' : 'Quarter'}
                      </div>
                      <div className="font-bold">{periodStats.quarter.totalReferrals}</div>
                      <div className="text-xs text-green-500">+{periodStats.quarter.activeReferrals} акт.</div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50">
                      <div className="text-xs text-muted-foreground mb-1">
                        {isRussian ? 'Год' : 'Year'}
                      </div>
                      <div className="font-bold">{periodStats.year.totalReferrals}</div>
                      <div className="text-xs text-green-500">+{periodStats.year.activeReferrals} акт.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Total Bonus */}
            <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-muted-foreground">
                      {isRussian ? 'Ваш бонус PRO' : 'Your PRO Bonus'}
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      +{bonusWeeks} {isRussian ? 'недель' : 'weeks'}
                    </div>
                  </div>
                  <Gift className="w-10 h-10 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Levels Tab */}
          <TabsContent value="levels" className="space-y-4">
            {/* Progress to Next Level */}
            {nextBonus.type === 'commission' ? (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    {isRussian ? 'Прогресс комиссии' : 'Commission Progress'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{isRussian ? 'Текущая комиссия:' : 'Current:'}</span>
                      <Badge className="bg-amber-500 text-black">{nextBonus.currentPercent}%</Badge>
                    </div>
                    {nextBonus.refsToNext > 0 && (
                      <>
                        <Progress value={((stats.paidReferrals % (nextBonus.refsToNext + stats.paidReferrals)) / (nextBonus.refsToNext + stats.paidReferrals)) * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          {isRussian 
                            ? `Ещё ${nextBonus.refsToNext} оплативших до ${nextBonus.nextPercent}%`
                            : `${nextBonus.refsToNext} more paid referrals to ${nextBonus.nextPercent}%`}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    {isRussian ? 'Прогресс бонусов' : 'Bonus Progress'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{isRussian ? 'За оплатившего:' : 'Per paid:'}</span>
                      <Badge variant="outline" className="text-green-500 border-green-500/30">
                        +{nextBonus.currentWeeks} {isRussian ? 'нед.' : 'weeks'}
                      </Badge>
                    </div>
                    {nextBonus.refsToNext > 0 && (
                      <>
                        <Progress value={((stats.paidReferrals % 10) / 10) * 100} className="h-2" />
                        <p className="text-sm text-muted-foreground">
                          {isRussian 
                            ? `Ещё ${nextBonus.refsToNext} оплативших до +${nextBonus.nextWeeks} нед./реферал`
                            : `${nextBonus.refsToNext} more to +${nextBonus.nextWeeks} weeks/referral`}
                        </p>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bonus Tiers - FREE Users */}
            {!isPro && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-500" />
                    {isRussian ? 'Бонусы FREE пользователей' : 'FREE User Bonuses'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {isRussian ? 'За активных рефералов:' : 'For active referrals:'}
                    </h4>
                    <div className="p-3 rounded-lg bg-muted/50 text-center">
                      <div className="text-lg font-bold text-green-500">+1 {isRussian ? 'неделя' : 'week'}</div>
                      <div className="text-xs text-muted-foreground">
                        {isRussian ? 'за каждого активного реферала' : 'per active referral'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {isRussian ? 'За оплативших рефералов:' : 'For paid referrals:'}
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={`text-center p-2 rounded ${stats.paidReferrals >= 1 && stats.paidReferrals < 11 ? 'bg-green-500/20 border border-green-500/30' : 'bg-muted/50'}`}>
                        <div className="font-medium">1-10</div>
                        <div className="text-green-500 mt-1">+2 нед.</div>
                      </div>
                      <div className={`text-center p-2 rounded ${stats.paidReferrals >= 11 && stats.paidReferrals < 26 ? 'bg-green-500/20 border border-green-500/30' : 'bg-muted/50'}`}>
                        <div className="font-medium">11-25</div>
                        <div className="text-green-500 mt-1">+3 нед.</div>
                      </div>
                      <div className={`text-center p-2 rounded ${stats.paidReferrals >= 26 ? 'bg-green-500/20 border border-green-500/30' : 'bg-muted/50'}`}>
                        <div className="font-medium">26+</div>
                        <div className="text-green-500 mt-1">+4 нед.</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bonus Tiers - PRO Users */}
            {isPro && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-500" />
                    {isRussian ? 'Бонусы PRO пользователей' : 'PRO User Bonuses'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {isRussian ? 'За активных рефералов:' : 'For active referrals:'}
                    </h4>
                    <div className="p-3 rounded-lg bg-amber-500/10 text-center border border-amber-500/30">
                      <div className="text-lg font-bold text-amber-500">+2 {isRussian ? 'недели' : 'weeks'}</div>
                      <div className="text-xs text-muted-foreground">
                        {isRussian ? 'за каждого активного реферала' : 'per active referral'}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">
                      {isRussian ? 'Комиссия с оплат:' : 'Payment commission:'}
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className={`text-center p-2 rounded ${stats.paidReferrals >= 1 && stats.paidReferrals < 11 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-muted/50'}`}>
                        <div className="font-medium">1-10</div>
                        <div className="text-amber-500 mt-1">5%</div>
                      </div>
                      <div className={`text-center p-2 rounded ${stats.paidReferrals >= 11 && stats.paidReferrals < 26 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-muted/50'}`}>
                        <div className="font-medium">11-25</div>
                        <div className="text-amber-500 mt-1">10%</div>
                      </div>
                      <div className={`text-center p-2 rounded ${stats.paidReferrals >= 26 ? 'bg-amber-500/20 border border-amber-500/30' : 'bg-muted/50'}`}>
                        <div className="font-medium">26+</div>
                        <div className="text-amber-500 mt-1">15%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activation Conditions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  {isRussian ? 'Условия активации реферала' : 'Referral Activation'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Clock className="w-5 h-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-sm">
                        {isRussian ? '7 дней активности' : '7 days of activity'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isRussian ? 'Реферал должен заходить в приложение' : 'Referral must log into the app'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Zap className="w-5 h-5 text-amber-500" />
                    <div>
                      <div className="font-medium text-sm">
                        {isRussian ? '30 минут в приложении' : '30 minutes in the app'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isRussian ? 'Суммарное время использования' : 'Total usage time'}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calculator Tab */}
          <TabsContent value="calculator" className="space-y-4">
            <EarningsCalculator isPro={isPro} />
          </TabsContent>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-4">
            {user ? (
              <>
                {/* Balance */}
                <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <Wallet className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <div className="text-sm text-muted-foreground mb-1">
                        {isRussian ? 'Доступно к выводу' : 'Available for withdrawal'}
                      </div>
                      <div className="text-4xl font-bold text-foreground">
                        {(wallet?.balance_rub || 0).toLocaleString()} ₽
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Wallet Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {(wallet?.total_earned_rub || 0).toLocaleString()} ₽
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isRussian ? 'Всего заработано' : 'Total earned'}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {wallet?.bonus_weeks_earned || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isRussian ? 'Бонусных недель' : 'Bonus weeks'}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Withdrawal Options */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">
                      {isRussian ? 'Вывод средств' : 'Withdrawal'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 rounded-lg border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <DollarSign className="w-5 h-5 text-green-500" />
                        <div>
                          <div className="font-medium text-sm">
                            {isRussian ? 'На карту' : 'To card'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isRussian ? 'Мин. 1000 ₽' : 'Min. 1000 ₽'}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        disabled={(wallet?.balance_rub || 0) < 1000}
                      >
                        {isRussian ? 'Вывести' : 'Withdraw'}
                      </Button>
                    </div>

                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <div>
                          <div className="font-medium text-sm">
                            {isRussian ? 'Оплатить подписку' : 'Pay subscription'}
                          </div>
                          <div className="text-xs text-amber-500">
                            {isRussian ? 'Коэф. 1:2 (выгодно!)' : 'Rate 1:2 (profitable!)'}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-amber-500/30 text-amber-500"
                        disabled={(wallet?.balance_rub || 0) < 100}
                      >
                        {isRussian ? 'Оплатить' : 'Pay'}
                      </Button>
                    </div>

                    <div className="p-3 rounded-lg border border-purple-500/30 bg-purple-500/5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Gift className="w-5 h-5 text-purple-500" />
                        <div>
                          <div className="font-medium text-sm">
                            {isRussian ? 'Подарочный сертификат' : 'Gift certificate'}
                          </div>
                          <div className="text-xs text-purple-500">
                            {isRussian ? 'Коэф. 1:2' : 'Rate 1:2'}
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-purple-500/30 text-purple-500"
                        disabled={(wallet?.balance_rub || 0) < 100}
                      >
                        {isRussian ? 'Создать' : 'Create'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {isRussian 
                      ? 'Войдите в аккаунт, чтобы увидеть кошелёк'
                      : 'Sign in to see your wallet'}
                  </p>
                  <Button onClick={() => navigate('/auth')}>
                    {isRussian ? 'Войти' : 'Sign In'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Referral Modal */}
        <ReferralModal open={showInviteModal} onOpenChange={setShowInviteModal} />
      </div>
    </div>
  );
}
