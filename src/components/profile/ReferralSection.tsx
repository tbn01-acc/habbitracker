import { Users, Copy, Gift, Check, Trophy, Crown, Medal } from 'lucide-react';
import { APP_URL } from '@/lib/constants';
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ReferralSectionProps {
  referralCode: string | null;
  currentPlan: 'free' | 'pro';
  referralStats: {
    totalReferrals: number;
    paidReferrals: number;
  };
}

interface LeaderboardEntry {
  position: number;
  total_referrals: number;
  paid_referrals: number;
  bonus_days: number;
  isCurrentUser?: boolean;
}

export function ReferralSection({ referralCode, currentPlan, referralStats }: ReferralSectionProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [userPosition, setUserPosition] = useState<number | null>(null);
  const isRussian = language === 'ru';

  const referralLink = referralCode ? `${APP_URL}/auth?ref=${referralCode}` : '';

  // Fetch leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('referrer_id, referred_has_paid');

      if (error || !data) return;

      // Group by referrer
      const counts: Record<string, { total: number; paid: number }> = {};
      data.forEach(ref => {
        if (!counts[ref.referrer_id]) {
          counts[ref.referrer_id] = { total: 0, paid: 0 };
        }
        counts[ref.referrer_id].total++;
        if (ref.referred_has_paid) {
          counts[ref.referrer_id].paid++;
        }
      });

      // Convert to array and sort
      const sorted = Object.entries(counts)
        .map(([id, stats]) => ({
          id,
          ...stats,
          bonus: calculateBonusDays(stats.total, stats.paid, true),
        }))
        .sort((a, b) => b.total - a.total);

      // Find user position
      if (user) {
        const pos = sorted.findIndex(s => s.id === user.id);
        if (pos >= 0) {
          setUserPosition(pos + 1);
        }
      }

      // Take top 5 for leaderboard
      const top5: LeaderboardEntry[] = sorted.slice(0, 5).map((entry, idx) => ({
        position: idx + 1,
        total_referrals: entry.total,
        paid_referrals: entry.paid,
        bonus_days: entry.bonus,
        isCurrentUser: user ? entry.id === user.id : false,
      }));

      setLeaderboard(top5);
    };

    fetchLeaderboard();
  }, [user]);

  const calculateBonusDays = (total: number, paid: number, isPro: boolean) => {
    let regBonus = 0;
    let paidBonus = 0;

    if (total >= 25) regBonus = isPro ? 42 : 28;
    else if (total >= 11) regBonus = isPro ? 35 : 21;
    else if (total >= 6) regBonus = isPro ? 28 : 14;
    else if (total >= 1) regBonus = isPro ? 21 : 7;

    if (paid >= 25) paidBonus = isPro ? 120 : 90;
    else if (paid >= 11) paidBonus = isPro ? 120 : 90;
    else if (paid >= 6) paidBonus = isPro ? 90 : 60;
    else if (paid >= 1) paidBonus = isPro ? 60 : 30;

    return regBonus + paidBonus;
  };

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
        colors: ['#f59e0b', '#f97316', '#fbbf24', '#fcd34d'],
      });

      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRussian ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  const getRegistrationBonus = (count: number, isPro: boolean) => {
    if (count >= 25) return isPro ? 6 : 4;
    if (count >= 11) return isPro ? 5 : 3;
    if (count >= 6) return isPro ? 4 : 2;
    if (count >= 1) return isPro ? 3 : 1;
    return 0;
  };

  const getPaidBonus = (count: number, isPro: boolean) => {
    if (count >= 25) return isPro ? 4 : 3;
    if (count >= 11) return isPro ? 4 : 3;
    if (count >= 6) return isPro ? 3 : 2;
    if (count >= 1) return isPro ? 2 : 1;
    return 0;
  };

  const isPro = currentPlan === 'pro';
  const regBonus = getRegistrationBonus(referralStats.totalReferrals, isPro);
  const paidBonus = getPaidBonus(referralStats.paidReferrals, isPro);

  const registrationTiers = [
    { range: '1-5', free: '1 неделя', pro: '3 недели' },
    { range: '6-10', free: '2 недели', pro: '4 недели' },
    { range: '11-25', free: '3 недели', pro: '5 недель' },
    { range: '25+', free: '4 недели', pro: '6 недель' },
  ];

  const paidTiers = [
    { range: '1-5', free: '+1 месяц', pro: '+2 месяца' },
    { range: '6-10', free: '+2 месяца', pro: '+3 месяца' },
    { range: '11-25', free: '+3 месяца', pro: '+4 месяца' },
    { range: '25+', free: '+3 месяца', pro: '+4 месяца' },
  ];

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return <Crown className="w-4 h-4 text-amber-500" />;
      case 2: return <Medal className="w-4 h-4 text-gray-400" />;
      case 3: return <Medal className="w-4 h-4 text-amber-700" />;
      default: return <span className="text-xs font-bold text-muted-foreground">{position}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Users className="w-4 h-4 text-blue-500" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          {isRussian ? 'Партнёрская программа' : 'Referral Program'}
        </h2>
      </div>

      {/* Referral Link with QR */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isRussian ? 'Ваша реферальная ссылка' : 'Your Referral Link'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referralCode ? (
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
                <p className="text-xs text-muted-foreground">
                  {isRussian 
                    ? 'Поделитесь ссылкой с друзьями и получайте бонусы!'
                    : 'Share with friends and earn bonuses!'}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {isRussian 
                ? 'Войдите в аккаунт, чтобы получить реферальную ссылку'
                : 'Sign in to get your referral link'}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-foreground mb-1">{referralStats.totalReferrals}</div>
            <div className="text-xs text-muted-foreground">
              {isRussian ? 'Зарегистрировано' : 'Registered'}
            </div>
            {regBonus > 0 && (
              <Badge variant="outline" className="mt-2 text-xs text-green-500 border-green-500/30">
                <Gift className="w-3 h-3 mr-1" />
                +{regBonus} {isRussian ? 'нед.' : 'weeks'}
              </Badge>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-foreground mb-1">{referralStats.paidReferrals}</div>
            <div className="text-xs text-muted-foreground">
              {isRussian ? 'Оплатили PRO' : 'Paid for PRO'}
            </div>
            {paidBonus > 0 && (
              <Badge variant="outline" className="mt-2 text-xs text-amber-500 border-amber-500/30">
                <Gift className="w-3 h-3 mr-1" />
                +{paidBonus} {isRussian ? 'мес.' : 'months'}
              </Badge>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              {isRussian ? 'Лидерборд партнёров' : 'Partner Leaderboard'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {leaderboard.map((entry) => (
              <div 
                key={entry.position}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  entry.isCurrentUser 
                    ? 'bg-primary/10 border border-primary/30' 
                    : 'bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 flex items-center justify-center">
                    {getPositionIcon(entry.position)}
                  </div>
                  <div>
                    <span className="text-sm font-medium">
                      {entry.isCurrentUser 
                        ? (isRussian ? 'Вы' : 'You')
                        : `${isRussian ? 'Партнёр' : 'Partner'} #${entry.position}`
                      }
                    </span>
                    <div className="text-xs text-muted-foreground">
                      {entry.total_referrals} {isRussian ? 'друзей' : 'friends'} • {entry.paid_referrals} {isRussian ? 'оплатили' : 'paid'}
                    </div>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs text-green-500 border-green-500/30">
                  +{entry.bonus_days} {isRussian ? 'дн.' : 'days'}
                </Badge>
              </div>
            ))}

            {userPosition && userPosition > 5 && (
              <div className="pt-2 border-t border-border mt-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-primary/10 border border-primary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <span className="text-xs font-bold text-primary">{userPosition}</span>
                    </div>
                    <span className="text-sm font-medium">{isRussian ? 'Ваша позиция' : 'Your position'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {referralStats.totalReferrals} {isRussian ? 'друзей' : 'friends'}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bonus Tiers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="w-4 h-4 text-green-500" />
            {isRussian ? 'Бонусы за рефералов' : 'Referral Bonuses'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              {isRussian ? 'За регистрацию рефералов:' : 'For registered referrals:'}
            </h4>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {registrationTiers.map((tier, idx) => (
                <div key={idx} className="text-center p-2 rounded bg-muted/50">
                  <div className="font-medium text-foreground">{tier.range}</div>
                  <div className="text-muted-foreground mt-1">
                    {isPro ? tier.pro : tier.free}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2 text-muted-foreground">
              {isRussian ? 'За оплативших рефералов:' : 'For paid referrals:'}
            </h4>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {paidTiers.map((tier, idx) => (
                <div key={idx} className="text-center p-2 rounded bg-muted/50">
                  <div className="font-medium text-foreground">{tier.range}</div>
                  <div className="text-amber-500 mt-1">
                    {isPro ? tier.pro : tier.free}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            {isRussian 
              ? 'Бонусы для PRO-пользователей выше! Приглашайте друзей и продлевайте подписку бесплатно.'
              : 'PRO users get higher bonuses! Invite friends and extend your subscription for free.'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
