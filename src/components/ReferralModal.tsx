import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Copy, Check, Share2, Trophy, Users, Star, ExternalLink, Crown } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface ReferralModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface TopPartner {
  total_referrals: number;
  paid_referrals: number;
  bonus_days: number;
}

export function ReferralModal({ open, onOpenChange }: ReferralModalProps) {
  const { t, language } = useTranslation();
  const { profile, user } = useAuth();
  const { referralStats, currentPlan, referralCode } = useSubscription();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [topPartner, setTopPartner] = useState<TopPartner | null>(null);
  const isRussian = language === 'ru';

  // Shortened referral link
  const baseUrl = window.location.origin;
  const shortCode = referralCode || '';
  const referralLink = shortCode ? `${baseUrl}/auth?ref=${shortCode}` : '';
  const displayLink = shortCode ? `${baseUrl.replace('https://', '').split('.')[0]}...?ref=${shortCode}` : '';

  // Fetch top partner stats
  useEffect(() => {
    const fetchTopPartner = async () => {
      const { data, error } = await supabase
        .from('referrals')
        .select('referrer_id')
        .limit(1000);

      if (error || !data) return;

      // Group by referrer and count
      const counts: Record<string, { total: number; paid: number }> = {};
      data.forEach(ref => {
        if (!counts[ref.referrer_id]) {
          counts[ref.referrer_id] = { total: 0, paid: 0 };
        }
        counts[ref.referrer_id].total++;
      });

      // Get paid referrals count
      const { data: paidData } = await supabase
        .from('referrals')
        .select('referrer_id')
        .eq('referred_has_paid', true);

      paidData?.forEach(ref => {
        if (counts[ref.referrer_id]) {
          counts[ref.referrer_id].paid++;
        }
      });

      // Find top partner
      let maxReferrals = 0;
      let topStats = { total: 0, paid: 0 };
      Object.values(counts).forEach(c => {
        if (c.total > maxReferrals) {
          maxReferrals = c.total;
          topStats = c;
        }
      });

      if (maxReferrals > 0) {
        // Calculate approximate bonus (simplified)
        const bonus = calculateBonusDays(topStats.total, topStats.paid, true);
        setTopPartner({
          total_referrals: topStats.total,
          paid_referrals: topStats.paid,
          bonus_days: bonus,
        });
      }
    };

    if (open) {
      fetchTopPartner();
    }
  }, [open]);

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
      
      // Confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#f97316', '#fbbf24', '#fcd34d'],
      });

      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast.error(isRussian ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  const handleShare = async () => {
    if (!referralLink) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TopFocus',
          text: isRussian 
            ? 'Присоединяйся к TopFocus и получи бонус!' 
            : 'Join TopFocus and get a bonus!',
          url: referralLink,
        });
      } catch (err) {
        // User cancelled
      }
    } else {
      handleCopy();
    }
  };

  const myBonusDays = calculateBonusDays(
    referralStats.totalReferrals, 
    referralStats.paidReferrals, 
    currentPlan === 'pro'
  );

  return (
    <AnimatePresence>
      {open && (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-sm p-0 gap-0 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header with gradient */}
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white">
                <DialogHeader className="text-left">
                  <DialogTitle className="text-white flex items-center gap-2 text-lg">
                    <Gift className="w-5 h-5" />
                    {isRussian ? 'Партнёрская программа' : 'Referral Program'}
                  </DialogTitle>
                </DialogHeader>
                <p className="text-white/90 text-xs mt-1">
                  {isRussian 
                    ? 'Приглашай друзей и получай до 6 месяцев PRO бесплатно!' 
                    : 'Invite friends and get up to 6 months PRO free!'}
                </p>
              </div>

              <div className="p-4 space-y-4">
                {/* User Stats */}
                {user && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 rounded-xl p-3 text-center border border-green-500/20">
                      <Users className="w-4 h-4 mx-auto mb-1 text-green-500" />
                      <div className="text-xl font-bold text-foreground">{referralStats.totalReferrals}</div>
                      <div className="text-[10px] text-muted-foreground">{isRussian ? 'Друзей' : 'Friends'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl p-3 text-center border border-amber-500/20">
                      <Star className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                      <div className="text-xl font-bold text-foreground">{referralStats.paidReferrals}</div>
                      <div className="text-[10px] text-muted-foreground">{isRussian ? 'Оплатили' : 'Paid'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl p-3 text-center border border-purple-500/20">
                      <Gift className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                      <div className="text-xl font-bold text-foreground">+{myBonusDays}</div>
                      <div className="text-[10px] text-muted-foreground">{isRussian ? 'Дней' : 'Days'}</div>
                    </div>
                  </div>
                )}

                {/* QR Code & Link */}
                {referralCode ? (
                  <div className="flex gap-3 items-center">
                    <div className="bg-white p-2 rounded-lg shrink-0">
                      <QRCodeSVG value={referralLink} size={80} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="bg-muted rounded-lg px-3 py-2 text-xs font-mono truncate">
                        {displayLink}
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1 h-8 text-xs gap-1"
                          onClick={handleCopy}
                        >
                          {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                          {copied ? (isRussian ? 'Готово!' : 'Done!') : (isRussian ? 'Копировать' : 'Copy')}
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1 h-8 text-xs gap-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                          onClick={handleShare}
                        >
                          <Share2 className="w-3 h-3" />
                          {isRussian ? 'Поделиться' : 'Share'}
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      {isRussian 
                        ? 'Войдите в аккаунт, чтобы получить реферальную ссылку' 
                        : 'Sign in to get your referral link'}
                    </p>
                    <Button 
                      className="mt-3" 
                      size="sm"
                      onClick={() => {
                        onOpenChange(false);
                        navigate('/auth');
                      }}
                    >
                      {isRussian ? 'Войти' : 'Sign In'}
                    </Button>
                  </div>
                )}

                {/* Top Partner */}
                {topPartner && topPartner.total_referrals > 0 && (
                  <div className="bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 rounded-xl p-3 border border-amber-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {isRussian ? 'Лучший партнёр' : 'Top Partner'}
                      </span>
                      <Badge variant="outline" className="text-[10px] ml-auto border-amber-500/30 text-amber-600">
                        {isRussian ? 'Анонимно' : 'Anonymous'}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="font-bold text-foreground">{topPartner.total_referrals}</div>
                        <div className="text-muted-foreground text-[10px]">{isRussian ? 'друзей' : 'friends'}</div>
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{topPartner.paid_referrals}</div>
                        <div className="text-muted-foreground text-[10px]">{isRussian ? 'оплатили' : 'paid'}</div>
                      </div>
                      <div>
                        <div className="font-bold text-green-500">+{topPartner.bonus_days}</div>
                        <div className="text-muted-foreground text-[10px]">{isRussian ? 'дней' : 'days'}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Link to full page */}
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-muted-foreground hover:text-foreground gap-1"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/profile');
                  }}
                >
                  {isRussian ? 'Подробнее о программе' : 'Learn more'}
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </motion.div>
          </DialogContent>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
