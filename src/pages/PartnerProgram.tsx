import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Copy, Check, Gift, Crown,
  Wallet, TrendingUp, Clock,
  DollarSign, Zap, BarChart3, Share2, Calculator,
  Star, Award, Target, X, ArrowLeft
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { AppHeader } from '@/components/AppHeader';
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
import { supabase } from '@/integrations/supabase/client';

export default function PartnerProgram() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { isProActive, subscription } = useSubscription();
  const { stats, loading, getProgressToNextMilestone, getConversionBonus, calculatePotentialEarnings } = useAffiliateV2();
  const isRussian = language === 'ru';

  const [copied, setCopied] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showActiveList, setShowActiveList] = useState(false);
  const [showPaidList, setShowPaidList] = useState(false);
  const [referralsList, setReferralsList] = useState<Array<{ id: string; displayName: string; isActive: boolean; hasPaid: boolean }>>([]);

  const referralCode = profile?.referral_code;
  const referralLink = referralCode ? `${window.location.origin}/auth?ref=${referralCode}` : '';

  const isPro = isProActive && !subscription?.is_trial;
  const isLifetime = subscription?.period === 'lifetime';

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
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-500" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Партнёрская программа 2.0' : 'Partner Program 2.0'}
              </h1>
            </div>
          </div>
        </div>

        {/* Level Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className={`border-2 ${stats.currentLevel === 2 || stats.isVIP ? 'border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-transparent' : 'border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-transparent'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stats.isVIP ? 'bg-gradient-to-br from-amber-500 to-orange-500' : stats.currentLevel === 2 ? 'bg-amber-500/20' : 'bg-purple-500/20'}`}>
                    {stats.isVIP ? (
                      <Star className="w-6 h-6 text-white" />
                    ) : stats.currentLevel === 2 ? (
                      <Crown className="w-6 h-6 text-amber-500" />
                    ) : (
                      <Users className="w-6 h-6 text-purple-500" />
                    )}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      {stats.isVIP ? (
                        <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">VIP Partner</Badge>
                      ) : (
                        <>
                          {isRussian ? `Уровень ${stats.currentLevel}` : `Level ${stats.currentLevel}`}
                          {isLifetime && <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-xs">Lifetime</Badge>}
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {stats.currentLevel === 1 
                        ? (isRussian ? '20% комиссия с платежей' : '20% commission on payments')
                        : (isRussian ? '30% комиссия с платежей' : '30% commission on payments')
                      }
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{stats.commissionPercent}%</div>
                  <div className="text-xs text-muted-foreground">{isRussian ? 'комиссия' : 'commission'}</div>
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
            {/* Current Stats - only Active and Paid, clickable */}
            <div className="grid grid-cols-2 gap-3">
              <Card 
                className="cursor-pointer hover:ring-2 hover:ring-green-500/30 transition-all"
                onClick={() => setShowActiveList(true)}
              >
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-green-500">{stats.activeReferrals}</div>
                  <div className="text-xs text-muted-foreground">
                    {isRussian ? 'Активных' : 'Active'}
                  </div>
                </CardContent>
              </Card>
              <Card 
                className="cursor-pointer hover:ring-2 hover:ring-amber-500/30 transition-all"
                onClick={() => setShowPaidList(true)}
              >
                <CardContent className="pt-4 text-center">
                  <div className="text-2xl font-bold text-amber-500">{stats.paidReferrals}</div>
                  <div className="text-xs text-muted-foreground">
                    {isRussian ? 'Оплатили' : 'Paid'}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Summary */}
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

            {/* Conversion Bonus Info */}
            <Card className="border-purple-500/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {isRussian ? 'Коэффициент 1:1.5' : '1:1.5 Conversion'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isRussian 
                        ? 'При оплате подписки или покупке подарочного кода'
                        : 'When paying for subscription or gift code'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-purple-500 border-purple-500/30">
                      +50%
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => navigate('/upgrade?bonus=true')}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs"
                    >
                      {isRussian ? 'Оплатить' : 'Pay'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Levels Tab */}
          <TabsContent value="levels" className="space-y-4">
            {/* Progress to Next Milestone */}
            {stats.nextMilestone && (
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
                      <span>{stats.paidReferrals} / {stats.nextMilestone.threshold}</span>
                      <Badge className="bg-amber-500 text-black">
                        +{stats.nextMilestone.bonus}₽
                      </Badge>
                    </div>
                    <Progress value={progress.progress} className="h-3" />
                    <p className="text-xs text-muted-foreground">
                      {isRussian 
                        ? `Ещё ${progress.remaining} оплативших до бонуса`
                        : `${progress.remaining} more paid referrals to bonus`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* VIP Status */}
            {stats.paidReferrals >= 150 && (
              <Card className={`border-2 ${stats.isVIP ? 'border-amber-500 bg-gradient-to-br from-amber-500/20 to-orange-500/20' : 'border-dashed border-amber-500/50'}`}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                      <Star className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold flex items-center gap-2">
                        VIP Status
                        {stats.isVIP && <Check className="w-4 h-4 text-green-500" />}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {stats.isVIP 
                          ? (isRussian ? 'Индивидуальные условия активны' : 'Individual terms active')
                          : (isRussian ? `${200 - stats.paidReferrals} оплативших до VIP` : `${200 - stats.paidReferrals} paid referrals to VIP`)
                        }
                      </p>
                    </div>
                    {stats.isVIP && !stats.vipBonusClaimed && (
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                        +5000₽
                      </Badge>
                    )}
                  </div>
                  {!stats.isVIP && (
                    <Progress 
                      value={(stats.paidReferrals / 200) * 100} 
                      className="h-2 mt-3" 
                    />
                  )}
                </CardContent>
              </Card>
            )}

            {/* Level 1 Commission Structure */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="w-4 h-4 text-purple-500" />
                  {isRussian ? 'Уровень 1: 1-50 рефералов' : 'Level 1: 1-50 Referrals'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <span className="font-medium">
                    {isRussian ? 'Комиссия' : 'Commission'}
                  </span>
                  <Badge className="bg-purple-500 text-white text-lg px-3">20%</Badge>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Gift className="w-4 h-4 text-green-500" />
                    {isRussian ? 'Денежные бонусы:' : 'Cash Bonuses:'}
                  </h4>
                  <div className="grid grid-cols-5 gap-2">
                    {[10, 20, 30, 40, 50].map((threshold) => {
                      const achieved = stats.paidReferrals >= threshold;
                      const bonus = threshold === 50 ? 1000 : 500;
                      return (
                        <div 
                          key={threshold}
                          className={`text-center p-2 rounded-lg ${achieved ? 'bg-green-500/20 border border-green-500/50' : 'bg-muted/50'}`}
                        >
                          <div className="text-xs font-medium">{threshold}</div>
                          <div className={`text-sm font-bold ${achieved ? 'text-green-500' : 'text-muted-foreground'}`}>
                            +{bonus}₽
                          </div>
                          {achieved && <Check className="w-3 h-3 mx-auto text-green-500 mt-1" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level 2 Commission Structure */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Crown className="w-4 h-4 text-amber-500" />
                  {isRussian ? 'Уровень 2: 51+ рефералов' : 'Level 2: 51+ Referrals'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <span className="font-medium">
                    {isRussian ? 'Комиссия' : 'Commission'}
                  </span>
                  <Badge className="bg-amber-500 text-black text-lg px-3">30%</Badge>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium">
                      {isRussian ? 'Бонус каждые 25 рефералов' : 'Bonus every 25 referrals'}
                    </span>
                  </div>
                  <div className="text-lg font-bold text-amber-500">+1000₽</div>
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

          <TabsContent value="wallet" className="space-y-4">
            {user ? (
              <WithdrawalForm />
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

        {/* Referrals List Modal */}
        <ReferralsListModal 
          open={showActiveList} 
          onClose={() => setShowActiveList(false)}
          title={isRussian ? 'Активные рефералы' : 'Active Referrals'}
          userId={user?.id}
          filterType="active"
        />
        <ReferralsListModal 
          open={showPaidList} 
          onClose={() => setShowPaidList(false)}
          title={isRussian ? 'Оплатившие рефералы' : 'Paid Referrals'}
          userId={user?.id}
          filterType="paid"
        />
      </div>
    </div>
  );
}

// Referrals List Modal Component
function ReferralsListModal({ 
  open, 
  onClose, 
  title, 
  userId,
  filterType 
}: { 
  open: boolean; 
  onClose: () => void; 
  title: string;
  userId?: string;
  filterType: 'active' | 'paid';
}) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const [referrals, setReferrals] = useState<Array<{ id: string; displayName: string; userId: string }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && userId) {
      fetchReferrals();
    }
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
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', referredIds);

        setReferrals(
          (profiles || []).map(p => ({
            id: p.user_id,
            displayName: p.display_name || 'User',
            userId: p.user_id
          }))
        );
      } else {
        setReferrals([]);
      }
    } catch (err) {
      console.error('Error fetching referrals:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReferralClick = (referralUserId: string) => {
    onClose();
    navigate(`/rating?user=${referralUserId}`);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-x-4 top-[20%] max-w-md mx-auto bg-card rounded-2xl p-5 shadow-lg z-50 max-h-[60vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {isRussian ? 'Загрузка...' : 'Loading...'}
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-4">
              {filterType === 'active' 
                ? (isRussian ? 'Пока нет активных рефералов' : 'No active referrals yet')
                : (isRussian ? 'Пока никто не оплатил подписку' : 'No paid referrals yet')
              }
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {isRussian 
                ? '🚀 Приглашайте друзей и зарабатывайте до 30% с каждой их оплаты!' 
                : '🚀 Invite friends and earn up to 30% from their payments!'}
            </p>
            <div className="p-4 rounded-lg bg-muted/50 text-left space-y-2 text-sm">
              <p className="font-medium">{isRussian ? 'Правила программы:' : 'Program rules:'}</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• {isRussian ? '20% комиссия (1-50 рефералов)' : '20% commission (1-50 referrals)'}</li>
                <li>• {isRussian ? '30% комиссия (51+ рефералов)' : '30% commission (51+ referrals)'}</li>
                <li>• {isRussian ? '+500₽ за каждые 10 оплативших' : '+500₽ for every 10 paid'}</li>
                <li>• {isRussian ? '+1000₽ за 50 оплативших' : '+1000₽ for 50 paid'}</li>
              </ul>
              <button 
                onClick={() => { onClose(); navigate('/partner-program?tab=calculator'); }}
                className="mt-3 text-primary underline text-sm"
              >
                {isRussian ? '📊 Открыть калькулятор дохода' : '📊 Open earnings calculator'}
              </button>
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
                onClick={() => handleReferralClick(referral.userId)}
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
