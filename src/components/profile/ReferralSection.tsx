import { Users, Copy, Gift, Check } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
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

export function ReferralSection({ referralCode, currentPlan, referralStats }: ReferralSectionProps) {
  const { language } = useTranslation();
  const [copied, setCopied] = useState(false);
  const isRussian = language === 'ru';

  const referralLink = referralCode ? `${window.location.origin}/auth?ref=${referralCode}` : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(isRussian ? 'Ссылка скопирована!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRussian ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  // Bonus calculation based on referral tiers
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

      {/* Referral Link */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isRussian ? 'Ваша реферальная ссылка' : 'Your Referral Link'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {referralCode ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm font-mono truncate">
                  {referralLink}
                </div>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {isRussian 
                  ? 'Поделитесь ссылкой с друзьями и получайте бонусы за каждого приглашённого!'
                  : 'Share this link with friends and earn bonuses for each referral!'}
              </p>
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

      {/* Bonus Tiers */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Gift className="w-4 h-4 text-green-500" />
            {isRussian ? 'Бонусы за рефералов' : 'Referral Bonuses'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Registration bonuses */}
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

          {/* Paid bonuses */}
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
