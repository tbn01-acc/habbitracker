import { useState, useEffect } from 'react';
import { APP_URL } from '@/lib/constants';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Copy, Check, Gift, Crown,
  Wallet, TrendingUp, Clock,
  DollarSign, Zap, BarChart3, Share2, Calculator,
  Star, Award, Target, X, ArrowLeft, Shield, Bell, CreditCard, AlertTriangle,
  Lightbulb, HelpCircle
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';

import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useAffiliateV2 } from '@/hooks/useAffiliateV2';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { EarningsCalculator } from '@/components/referral/EarningsCalculator';
import { ReferralModal } from '@/components/ReferralModal';
import { WithdrawalForm } from '@/components/referral/WithdrawalForm';
import { NetworkDashboard } from '@/components/referral/NetworkDashboard';
import { GrowthStrategy } from '@/components/referral/GrowthStrategy';
import { PartnerFAQ } from '@/components/referral/PartnerFAQ';
import { InvoiceGenerator } from '@/components/referral/InvoiceGenerator';
import { AffiliateRulesDocument } from '@/components/referral/AffiliateRulesDocument';
import { supabase } from '@/integrations/supabase/client';

export default function PartnerProgram() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isProActive, subscription } = useSubscription();
  const { stats, loading, isPro, getProgressToNextMilestone } = useAffiliateV2();
  const isRussian = language === 'ru';

  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showActiveList, setShowActiveList] = useState(false);
  const [showPaidList, setShowPaidList] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const referralCode = profile?.referral_code;
  const referralLink = referralCode ? `${APP_URL}/auth?ref=${referralCode}` : '';

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

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {isRussian ? 'Загрузка...' : 'Loading...'}
        </div>
      </div>
    );
  }

  const progress = getProgressToNextMilestone();

  return (
    <div className="min-h-screen bg-background pb-24">
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isRussian ? 'Партнёрская программа ТопФокус 2.0' : 'TopFocus Partner Program 2.0'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isRussian ? 'Превратите рекомендации в доход' : 'Turn recommendations into income'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Card className={`border-2 ${isPro ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent' : 'border-muted bg-gradient-to-br from-muted/30 to-transparent'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isPro ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-muted'}`}>
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {isPro ? (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">Premium</Badge>
                      ) : (
                        <Badge variant="outline">{isRussian ? 'Базовый' : 'Basic'}</Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {isRussian ? `Уровень ${stats.currentLevel}` : `Level ${stats.currentLevel}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-purple-500 font-medium">L1: {stats.commissionL1Percent}%</span>
                      <span className="text-xs text-blue-500 font-medium">L2: {stats.commissionL2Percent}%</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{stats.commissionL1Percent}%</div>
                  <div className="text-xs text-muted-foreground">L1</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Invite Button & Referral Link */}
        {user ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="mb-6 overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gift className="w-4 h-4 text-purple-500" />
                  {isRussian ? 'Ваша ссылка' : 'Your Link'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-1.5 rounded-lg shrink-0">
                    <QRCodeSVG value={referralLink} size={64} />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 bg-muted rounded-lg px-2 py-1.5 text-[11px] font-mono truncate min-w-0">
                        {referralCode ? `...?ref=${referralCode}` : '...'}
                      </div>
                      <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopy}>
                        {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                    <Button 
                      size="sm"
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-sm"
                      onClick={() => setShowInviteModal(true)}
                    >
                      <Share2 className="w-3.5 h-3.5 mr-1.5" />
                      {isRussian ? 'Поделиться' : 'Share'}
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
                {isRussian ? 'Войдите в аккаунт, чтобы получить реферальную ссылку' : 'Sign in to get your referral link'}
              </p>
              <Button onClick={() => navigate('/auth')}>
                {isRussian ? 'Войти' : 'Sign In'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs defaultValue="info" className="space-y-6">
          <TabsList className="grid grid-cols-8 w-full">
            <TabsTrigger value="info" className="text-xs">
              <TrendingUp className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="network" className="text-xs">
              <Users className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="strategy" className="text-xs">
              <Lightbulb className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-xs">
              <HelpCircle className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="stats" className="text-xs">
              <BarChart3 className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="levels" className="text-xs">
              <Award className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="calculator" className="text-xs">
              <Calculator className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="wallet" className="text-xs">
              <Wallet className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {/* Info Tab - Program Description 2.0 */}
          <TabsContent value="info" className="space-y-4">
            {/* Hero Description */}
            <Card className="border-0 bg-gradient-to-br from-purple-500/10 via-transparent to-pink-500/10 backdrop-blur-xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {isRussian
                    ? '🚀 Партнерская программа 2.0: Масштабируйте доход вместе с ТопФокус'
                    : '🚀 Affiliate Program 2.0: Scale Your Income with TopFocus'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isRussian
                    ? 'Ваш доход в ТопФокус теперь напрямую зависит от вашего личного тарифа. Мы создали систему, в которой выгодно не просто приглашать друзей, но и использовать продукт самому.'
                    : 'Your earnings in TopFocus now directly depend on your personal subscription plan. We\'ve designed a system where using the product is as rewarding as promoting it.'}
                </p>
              </CardContent>
            </Card>

            {/* Key Highlights Grid */}
            <div className="grid grid-cols-2 gap-3">
              {/* Direct Income */}
              <Card className="border border-purple-500/30 bg-purple-500/5 backdrop-blur-xl">
                <CardContent className="pt-4 text-center space-y-1.5">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="text-xl font-bold text-purple-500">{isRussian ? 'до 25%' : 'up to 25%'}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {isRussian ? 'Прямой доход (L1)' : 'Direct Income (L1)'}
                  </div>
                </CardContent>
              </Card>

              {/* Network Income */}
              <Card className="border border-blue-500/30 bg-blue-500/5 backdrop-blur-xl">
                <CardContent className="pt-4 text-center space-y-1.5">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="text-xl font-bold text-blue-500">{isRussian ? 'до 2.5%' : 'up to 2.5%'}</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {isRussian ? 'Сетевой доход (L2)' : 'Network Income (L2)'}
                  </div>
                </CardContent>
              </Card>

              {/* Team Multiplier */}
              <Card className="border border-green-500/30 bg-green-500/5 backdrop-blur-xl">
                <CardContent className="pt-4 text-center space-y-1.5">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-green-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="text-xl font-bold text-green-500">1 = 1</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {isRussian ? 'Участник = Единица' : 'Team Member = Unit'}
                  </div>
                </CardContent>
              </Card>

              {/* Milestone Bonuses */}
              <Card className="border border-amber-500/30 bg-amber-500/5 backdrop-blur-xl">
                <CardContent className="pt-4 text-center space-y-1.5">
                  <div className="w-10 h-10 mx-auto rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-amber-500" />
                  </div>
                  <div className="text-xl font-bold text-amber-500">250–500₽</div>
                  <div className="text-[11px] text-muted-foreground leading-tight">
                    {isRussian ? 'Бонус за 10 единиц' : 'Per 10 units bonus'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 3 Pillars */}
            <div className="space-y-3">
              {/* Pillar 1: Status = Rate */}
              <Card className="border border-border/50 backdrop-blur-xl bg-card/50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-purple-500">1</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        {isRussian ? 'Ваш статус — ваш процент' : 'Your Status, Your Rate'}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isRussian
                          ? 'Получайте до 25% (L1) и 2.5% (L2) в зависимости от вашей подписки.'
                          : 'Earn up to 25% (L1) and 2.5% (L2) based on your active subscription.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pillar 2: Team Synergy */}
              <Card className="border border-border/50 backdrop-blur-xl bg-card/50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-green-500">2</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        {isRussian ? 'Магия команд' : 'Team Synergy'}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isRussian
                          ? 'Привлекайте корпоративных клиентов. Каждый участник тарифного плана «Команда» считается как 1 активная единица в вашем счетчике вех. Одна команда на 10 человек = закрытая веха и мгновенный бонус.'
                          : 'Onboard corporate clients. Every member of a "Team" subscription counts as 1 active unit towards your milestones. One 10-person team = a reached milestone and an instant bonus.'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pillar 3: Milestones & Level 2 */}
              <Card className="border border-amber-500/30 backdrop-blur-xl bg-amber-500/5">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-amber-500">3</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-2">
                        {isRussian ? 'Вехи и Уровень 2' : 'Milestones & Level 2'}
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5">
                          <Crown className="w-3 h-3 mr-0.5" /> Elite
                        </Badge>
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {isRussian
                          ? 'Каждые 10 активных рефералов приносят денежный бонус. Наберите 51 активную единицу, чтобы перейти на Уровень 2 с повышенными ставками (до 30% L1).'
                          : 'Every 10 active units bring a cash bonus. Reach 51 active units to unlock Level 2 with boosted rates (up to 30% L1).'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Comparison Table */}
            <Card className="border border-border/50 backdrop-blur-xl bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  💎 {isRussian ? 'Сравнение ставок' : 'Rate Comparison'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 text-xs font-medium text-muted-foreground">{isRussian ? 'Параметр' : 'Parameter'}</th>
                        <th className="text-center py-2 text-xs font-medium text-muted-foreground">{isRussian ? 'Базовый' : 'Basic'}</th>
                        <th className="text-center py-2 text-xs font-medium">
                          <span className="text-amber-500">Premium 🔥</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="text-xs">
                      <tr className="border-b border-border/50">
                        <td className="py-2">{isRussian ? 'L1 (Ур.1 / Ур.2)' : 'L1 (Lv1 / Lv2)'}</td>
                        <td className="text-center py-2 text-muted-foreground">15% / 20%</td>
                        <td className="text-center py-2 font-semibold text-amber-500">25% / 30%</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2">{isRussian ? 'L2 (сеть)' : 'L2 (network)'}</td>
                        <td className="text-center py-2 text-muted-foreground">1.5%</td>
                        <td className="text-center py-2 font-semibold text-amber-500">2.5%</td>
                      </tr>
                      <tr className="border-b border-border/50">
                        <td className="py-2">{isRussian ? 'Бонус Ур.1 (×10)' : 'Lv1 Bonus (×10)'}</td>
                        <td className="text-center py-2 text-muted-foreground">250₽</td>
                        <td className="text-center py-2 font-semibold text-amber-500">500₽</td>
                      </tr>
                      <tr>
                        <td className="py-2">{isRussian ? 'Бонус Ур.2 (×25)' : 'Lv2 Bonus (×25)'}</td>
                        <td className="text-center py-2 text-muted-foreground">500₽</td>
                        <td className="text-center py-2 font-semibold text-amber-500">1000₽</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Level 2 Prestige Goal */}
            <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent backdrop-blur-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
              <CardContent className="pt-4 relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {isRussian ? 'Цель: Уровень 2' : 'Goal: Level 2'}
                    </div>
                    <div className="text-xs text-amber-500 font-medium">
                      51+ {isRussian ? 'активных единиц' : 'active units'}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isRussian
                    ? 'Разблокируйте максимальные ставки: до 30% L1, до 2.5% L2 и бонус 1000₽ за каждые 25 единиц. Престижный статус для топ-партнёров.'
                    : 'Unlock maximum rates: up to 30% L1, up to 2.5% L2 and 1000₽ bonus per 25 units. Prestigious status for top partners.'}
                </p>
                {stats.currentLevel < 2 && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{stats.paidReferrals} / 51</span>
                      <span className="text-amber-500 font-medium">{51 - stats.paidReferrals} {isRussian ? 'осталось' : 'remaining'}</span>
                    </div>
                    <Progress value={Math.min((stats.paidReferrals / 51) * 100, 100)} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rules section */}
            <Card className="border border-border/50 backdrop-blur-xl bg-card/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  🛡️ {isRussian ? 'Прозрачные правила' : 'Transparent Rules'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-start gap-2">
                  <Bell className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {isRussian
                      ? 'Мгновенные Push-уведомления о каждом пополнении баланса.'
                      : 'Instant push notifications for every balance top-up.'}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {isRussian
                      ? 'Безопасный холд 14 дней — защита от возвратов.'
                      : 'Safe 14-day hold — chargeback protection.'}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CreditCard className="w-4 h-4 text-purple-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {isRussian
                      ? 'Вывод от 1000₽ на карты РФ, счета самозанятых или ИП.'
                      : 'Withdrawal from 1000₽ to Russian cards, self-employed or business accounts.'}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    {isRussian
                      ? 'Создание дублей аккаунтов запрещено — ведёт к блокировке аккаунтов и начислений.'
                      : 'Creating duplicate accounts is prohibited — leads to blocking of accounts and earnings.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CTA for non-premium */}
            {!isPro && (
              <Card className="border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent">
                <CardContent className="pt-4 text-center space-y-3">
                  <p className="text-sm">
                    {isRussian
                      ? '💡 Оформите Premium — это инвестиция, которая мгновенно увеличивает комиссии на 10% и удваивает бонусы за вехи.'
                      : '💡 Get Premium — an investment that instantly boosts commissions by 10% and doubles milestone bonuses.'}
                  </p>
                  <Button
                    onClick={() => navigate('/upgrade')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {isRussian ? 'Активировать Premium' : 'Activate Premium'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Network Tab - My Network Dashboard */}
          <TabsContent value="network" className="space-y-4">
            <NetworkDashboard />
          </TabsContent>

          {/* Strategy Tab */}
          <TabsContent value="strategy" className="space-y-4">
            <GrowthStrategy />
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq" className="space-y-4">
            <PartnerFAQ />
          </TabsContent>

          {/* Stats Tab */}
          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Card className="cursor-pointer hover:ring-2 hover:ring-green-500/30 transition-all" onClick={() => setShowActiveList(true)}>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.activeReferrals}</div>
                  <div className="text-xs text-muted-foreground">{isRussian ? 'Активных' : 'Active'}</div>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:ring-2 hover:ring-amber-500/30 transition-all" onClick={() => setShowPaidList(true)}>
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-amber-500">{stats.paidReferrals}</div>
                  <div className="text-xs text-muted-foreground">{isRussian ? 'Оплатили' : 'Paid'}</div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-green-500/30 bg-gradient-to-br from-green-500/10 to-transparent">
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-xl font-bold text-green-500">{stats.totalEarned.toLocaleString()}₽</div>
                    <div className="text-xs text-muted-foreground">{isRussian ? 'Заработано' : 'Earned'}</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-foreground">{stats.pendingBalance.toLocaleString()}₽</div>
                    <div className="text-xs text-muted-foreground">{isRussian ? 'Баланс' : 'Balance'}</div>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-muted-foreground">{stats.withdrawnTotal.toLocaleString()}₽</div>
                    <div className="text-xs text-muted-foreground">{isRussian ? 'Выведено' : 'Withdrawn'}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Levels Tab */}
          <TabsContent value="levels" className="space-y-4">
            {(() => {
              const paid = stats.paidReferrals;
              let nextTarget: number;
              let prevTarget: number;
              if (paid <= 50) {
                prevTarget = Math.floor(paid / 10) * 10;
                nextTarget = prevTarget + 10;
              } else {
                const l2Targets = [75, 100, 125, 150, 175, 200];
                nextTarget = l2Targets.find(t => t > paid) || paid + 25;
                prevTarget = l2Targets.filter(t => t <= paid).pop() || 50;
              }
              const progressVal = nextTarget > prevTarget ? ((paid - prevTarget) / (nextTarget - prevTarget)) * 100 : 100;
              const milestoneBonus = nextTarget <= 50
                ? (isPro ? 500 : 250)
                : (isPro ? 1000 : 500);
              const remaining = nextTarget - paid;

              return (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-500" />
                      {isRussian ? 'До следующего бонуса' : 'Next Milestone'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span>{paid} / {nextTarget}</span>
                        <Badge className="bg-amber-500 text-black">+{milestoneBonus}₽</Badge>
                      </div>
                      <Progress value={Math.min(progressVal, 100)} className="h-3" />
                      <p className="text-xs text-muted-foreground">
                        {isRussian 
                          ? `Ещё ${remaining} оплативших до бонуса`
                          : `${remaining} more paid referrals to bonus`}
                      </p>
                      {paid > 50 && (
                        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                          <p className="text-xs font-medium text-amber-500">
                            🎉 {isRussian
                              ? `Уровень 2 разблокирован! Следующий бонус за ${nextTarget} активных друзей`
                              : `Level 2 unlocked! Next big milestone bonus at ${nextTarget} active friends`}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })()}

            {/* Level 1 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  {isRussian ? 'Уровень 1: 1–50 рефералов' : 'Level 1: 1–50 Referrals'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Commission rates row */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">L1</span>
                    <span className="text-base font-bold text-purple-500">{isPro ? '25%' : '15%'}</span>
                  </div>
                  <div className="flex-1 p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">L2</span>
                    <span className="text-base font-bold text-blue-500">{isPro ? '2,5%' : '1,5%'}</span>
                  </div>
                  <div className="flex-1 p-2.5 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{isRussian ? 'Веха' : 'Bonus'}</span>
                    <span className="text-base font-bold text-green-500">+{isPro ? 500 : 250}₽</span>
                  </div>
                </div>

                {/* Milestone progress badges */}
                <div className="flex items-center gap-1.5">
                  {[10, 20, 30, 40, 50].map((threshold) => {
                    const achieved = stats.paidReferrals >= threshold;
                    return (
                      <div
                        key={threshold}
                        className={`flex-1 text-center py-1.5 rounded-md text-xs font-medium transition-all ${
                          achieved
                            ? 'bg-green-500/20 text-green-500 border border-green-500/40'
                            : 'bg-muted/40 text-muted-foreground'
                        }`}
                      >
                        {achieved ? '✓' : ''} {threshold}
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  {isRussian ? 'Бонус за каждые 10 активных друзей' : 'Bonus for every 10 active friends'}
                </p>
              </CardContent>
            </Card>

            {/* Level 2 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  {isRussian ? 'Уровень 2: 51+ рефералов' : 'Level 2: 51+ Referrals'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                    <div className="text-lg font-bold text-amber-500">{isPro ? '30%' : '20%'}</div>
                    <div className="text-xs text-muted-foreground">L1 {isRussian ? 'комиссия' : 'commission'}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-center">
                    <div className="text-lg font-bold text-blue-500">{isPro ? '2,5%' : '1,5%'}</div>
                    <div className="text-xs text-muted-foreground">L2 {isRussian ? 'комиссия' : 'commission'}</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">
                      {isRussian ? 'Бонус каждые 25 рефералов' : 'Bonus every 25 referrals'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-amber-500">+{isPro ? '1000' : '500'}₽</div>
                  <div className="text-xs text-muted-foreground">
                    {isRussian ? 'За 75, 100, 125, 150...' : 'At 75, 100, 125, 150...'}
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
                <WithdrawalForm />
                <InvoiceGenerator />
              </>
            ) : (
              <Card>
                <CardContent className="pt-6 text-center">
                  <Wallet className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-4">
                    {isRussian ? 'Войдите в аккаунт, чтобы увидеть кошелёк' : 'Sign in to see your wallet'}
                  </p>
                  <Button onClick={() => navigate('/auth')}>
                    {isRussian ? 'Войти' : 'Sign In'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer: Rules acceptance */}
        <div className="mt-8 pt-4 border-t border-border/50 text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            {isRussian ? 'Участвуя в программе, вы принимаете ' : 'By participating, you accept the '}
            <button
              onClick={() => setShowRules(true)}
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {isRussian ? 'Правила Партнерской программы' : 'Affiliate Program Rules'}
            </button>
          </p>
        </div>

        <ReferralModal open={showInviteModal} onOpenChange={setShowInviteModal} />
        <AffiliateRulesDocument open={showRules} onOpenChange={setShowRules} />
        <ReferralsListModal open={showActiveList} onClose={() => setShowActiveList(false)} title={isRussian ? 'Активные рефералы' : 'Active Referrals'} userId={user?.id} filterType="active" isPro={isPro} />
        <ReferralsListModal open={showPaidList} onClose={() => setShowPaidList(false)} title={isRussian ? 'Оплатившие рефералы' : 'Paid Referrals'} userId={user?.id} filterType="paid" isPro={isPro} />
      </div>
    </div>
  );
}

function ReferralsListModal({ open, onClose, title, userId, filterType, isPro }: { 
  open: boolean; onClose: () => void; title: string; userId?: string; filterType: 'active' | 'paid'; isPro: boolean;
}) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const [referrals, setReferrals] = useState<Array<{ id: string; displayName: string; userId: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) fetchReferrals();
  }, [open, userId, filterType]);

  const fetchReferrals = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('referred_id')
        .eq('referrer_id', userId)
        .eq(filterType === 'active' ? 'is_active' : 'referred_has_paid', true);

      if (referralsData && referralsData.length > 0) {
        const referredIds = referralsData.map(r => r.referred_id);
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('user_id, display_name')
          .in('user_id', referredIds);

        setReferrals((profiles || []).map(p => ({ id: p.user_id, displayName: p.display_name || 'User', userId: p.user_id })));
      } else {
        setReferrals([]);
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-x-4 top-[20%] max-w-md mx-auto bg-card rounded-2xl p-5 shadow-lg z-50 max-h-[60vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-5 h-5" /></button>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">{isRussian ? 'Загрузка...' : 'Loading...'}</div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {filterType === 'active' 
                ? (isRussian ? 'Пока нет активных рефералов' : 'No active referrals yet')
                : (isRussian ? 'Пока никто не оплатил подписку' : 'No paid referrals yet')}
            </p>
            <div className="p-4 rounded-lg bg-muted/50 text-left space-y-2 text-sm">
              <p className="font-medium">{isRussian ? 'Ваши ставки:' : 'Your rates:'}</p>
              <ul className="space-y-1 text-muted-foreground text-xs">
                <li>• L1: {isPro ? '25%' : '15%'} {isRussian ? '(прямые рефералы)' : '(direct referrals)'}</li>
                <li>• L2: {isPro ? '2,5%' : '1,5%'} {isRussian ? '(их рефералы)' : '(their referrals)'}</li>
                <li>• {isRussian ? 'Бонус за 10 друзей:' : 'Bonus per 10 friends:'} +{isPro ? '500' : '250'}₽</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((referral, index) => (
              <motion.button
                key={referral.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => { onClose(); navigate(`/rating?user=${referral.userId}`); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted transition-colors text-left"
              >
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <span className="font-medium">{referral.displayName}</span>
              </motion.button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
