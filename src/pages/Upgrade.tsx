import { useState, useRef, useEffect } from 'react';
import { APP_URL } from '@/lib/constants';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown, Check, ArrowLeft, Users, Zap, Shield, Brain,
  Cloud, Clock, Smartphone, Star, TrendingUp, AlertTriangle,
  CreditCard, Building2, Tag, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePromoCodes } from '@/hooks/usePromoCodes';
import { useReferralProgram } from '@/hooks/useReferralProgram';
import { DevModeToggle } from '@/components/DevModeToggle';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type PaymentMethod = 'card' | 'sbp' | 'bank' | 'bonus';

// ─── Types ───
type BillingPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'biennial' | 'lifetime';

interface PlanTier {
  id: string;
  name: string;
  tagline: string;
  color: string;          // tailwind ring/border color token
  gradient: string;       // card bg gradient
  badgeClass: string;
  prices: Record<BillingPeriod, number>;   // total price per period (₽)
  baseMonthly: number;                     // 1-month price for discount calc
  limits: { label: string; warn?: boolean }[];
  features: { label: string; included: boolean }[];
  affiliate: { label: string; l1: number; l2: number; milestone: number; payback?: string };
  recommended?: boolean;
  isTeam?: boolean;
}

// ─── Billing periods ───
const periods: { key: BillingPeriod; label: string; shortLabel: string; months: number }[] = [
  { key: 'monthly', label: '1 месяц', shortLabel: '1 мес', months: 1 },
  { key: 'quarterly', label: '3 месяца', shortLabel: '3 мес', months: 3 },
  { key: 'semiannual', label: '6 месяцев', shortLabel: '6 мес', months: 6 },
  { key: 'annual', label: '12 месяцев', shortLabel: '12 мес', months: 12 },
  { key: 'biennial', label: '24 месяца', shortLabel: '24 мес', months: 24 },
  { key: 'lifetime', label: 'Навсегда', shortLabel: '∞', months: 0 },
];

// ─── Plan data ───
const plans: PlanTier[] = [
  {
    id: 'focus',
    name: 'Фокус',
    tagline: 'Для ознакомления и простых задач',
    color: 'border-muted',
    gradient: 'from-muted/30 to-transparent',
    badgeClass: 'bg-muted text-muted-foreground',
    baseMonthly: 0,
    prices: { monthly: 0, quarterly: 0, semiannual: 0, annual: 0, biennial: 0, lifetime: 0 },
    limits: [
      { label: 'До 3 привычек', warn: true },
      { label: 'До 5 задач (без подзадач, вложений и регулярности)', warn: true },
      { label: 'До 15 финансовых операций в месяц', warn: true },
    ],
    features: [
      { label: 'Локальное хранение данных', included: true },
      { label: 'Базовая статистика', included: true },
      { label: '3 мини-приложения (Помодоро, Учёт времени, Мировое время)', included: true },
      { label: 'Обязательный просмотр рекламы для запуска сессий', included: false },
    ],
    affiliate: { label: 'Базовый', l1: 15, l2: 1.5, milestone: 250 },
  },
  {
    id: 'profi',
    name: 'Профи',
    tagline: 'Для продвинутых пользователей',
    color: 'border-blue-500/50',
    gradient: 'from-blue-500/10 to-blue-900/5',
    badgeClass: 'bg-blue-500/20 text-blue-400',
    baseMonthly: 349,
    prices: { monthly: 349, quarterly: 995, semiannual: 1780, annual: 3350, biennial: 5863, lifetime: 7490 },
    limits: [
      { label: 'До 7 привычек', warn: true },
      { label: 'До 10 задач (без подзадач)', warn: true },
      { label: 'До 30 финансовых операций в месяц', warn: true },
    ],
    features: [
      { label: 'Облачная синхронизация (раз в 7 дней)', included: true },
      { label: 'Бэкап (7 дней)', included: true },
      { label: '6 мини-приложений (+Конвертер, Курсы валют)', included: true },
      { label: 'Обязательный просмотр рекламы', included: false },
    ],
    affiliate: { label: 'Профи', l1: 20, l2: 2, milestone: 375, payback: 'Окупаемость: 5 активных рефералов' },
  },
  {
    id: 'premium',
    name: 'Премиум',
    tagline: 'Максимум возможностей без рекламы',
    color: 'border-purple-500/50',
    gradient: 'from-purple-600/15 to-violet-900/10',
    badgeClass: 'bg-purple-500/20 text-purple-400',
    baseMonthly: 449,
    prices: { monthly: 449, quarterly: 1280, semiannual: 2290, annual: 4310, biennial: 7543, lifetime: 9990 },
    limits: [
      { label: 'До 15 привычек', warn: true },
      { label: 'До 10 задач', warn: true },
      { label: 'До 60 финансовых операций в месяц', warn: true },
    ],
    features: [
      { label: 'Облако (раз в 3 дня)', included: true },
      { label: 'Бэкап (15 дней)', included: true },
      { label: 'Все 10 мини-приложений + ИИ-аналитика', included: true },
      { label: 'Без рекламы (кроме заставки при запуске)', included: true },
    ],
    affiliate: { label: 'Премиум', l1: 25, l2: 2.5, milestone: 500, payback: 'Окупаемость: 4 активных реферала' },
    recommended: true,
  },
  {
    id: 'team',
    name: 'Команда',
    tagline: 'Совместная работа от 5 человек',
    color: 'border-amber-500/50',
    gradient: 'from-amber-500/10 to-yellow-900/5',
    badgeClass: 'bg-amber-500/20 text-amber-400',
    baseMonthly: 399,
    prices: { monthly: 399, quarterly: 1138, semiannual: 2035, annual: 3832, biennial: 6697, lifetime: 8790 },
    limits: [],
    features: [
      { label: 'Всё из Премиум', included: true },
      { label: 'Совместная работа (Привычки, Задачи, Цели)', included: true },
      { label: 'Модуль «Спринт»', included: true },
      { label: 'Каждый участник = +1 Активная единица', included: true },
    ],
    affiliate: { label: 'Премиум', l1: 25, l2: 2.5, milestone: 500 },
    isTeam: true,
  },
];

// ─── Helpers ───
function discountPercent(baseMonthly: number, totalPrice: number, months: number): number {
  if (baseMonthly <= 0 || months <= 0) return 0;
  const fullPrice = baseMonthly * months;
  return Math.round(((fullPrice - totalPrice) / fullPrice) * 100);
}

function formatPrice(v: number): string {
  return v.toLocaleString('ru-RU');
}

// ─── CountUp mini component ───
function CountUp({ value, duration = 600 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const from = prev.current;
    const diff = value - from;
    if (diff === 0) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      setDisplay(Math.round(from + diff * t));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    prev.current = value;
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{formatPrice(display)}</>;
}

// ─── Limit updater (post-purchase) ───
async function updateProfileLimits(userId: string, planId: string) {
  const limitsMap: Record<string, object> = {
    focus: { max_habits: 3, max_tasks: 5, max_fin_ops: 15, cloud_sync_interval_days: 0, has_ai_analytics: false, affiliate_level: 'basic' },
    profi: { max_habits: 7, max_tasks: 10, max_fin_ops: 30, cloud_sync_interval_days: 7, has_ai_analytics: false, affiliate_level: 'pro' },
    premium: { max_habits: 15, max_tasks: 10, max_fin_ops: 60, cloud_sync_interval_days: 3, has_ai_analytics: true, affiliate_level: 'premium' },
    team: { max_habits: 15, max_tasks: 10, max_fin_ops: 60, cloud_sync_interval_days: 3, has_ai_analytics: true, affiliate_level: 'premium' },
  };
  const updates = limitsMap[planId];
  if (!updates) return;
  await supabase.from('profiles').update(updates).eq('user_id', userId);
}

// ─── Component ───
export default function Upgrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isInTrial, trialDaysLeft, trialBonusMonths } = useSubscription();
  const { validatePromoCode, usePromoCode, redeemPromoCode } = usePromoCodes();
  const { wallet } = useReferralProgram();

  const [period, setPeriod] = useState<BillingPeriod>('annual');
  const [teamSize, setTeamSize] = useState(5);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromoId, setAppliedPromoId] = useState<string | null>(null);

  const useBonusPayment = searchParams.get('bonus') === 'true';
  const bonusBalance = wallet?.balance_rub || 0;
  const bonusMultiplier = 1.5;
  const effectiveBonusBalance = bonusBalance * bonusMultiplier;

  useEffect(() => {
    if (useBonusPayment && bonusBalance >= 266) {
      setPaymentMethod('bonus');
    }
  }, [useBonusPayment, bonusBalance]);

  const activePeriod = periods.find(p => p.key === period)!;

  const getPrice = (plan: PlanTier) => {
    const base = plan.prices[period];
    if (plan.isTeam) return base * teamSize;
    return base;
  };

  const getDiscount = (plan: PlanTier) => {
    if (period === 'monthly' || period === 'lifetime') return 0;
    return discountPercent(plan.baseMonthly, plan.prices[period], activePeriod.months);
  };

  // Footer revenue estimator
  const footerPlan = plans.find(p => p.id === (hoveredPlan || 'premium'))!;
  const footerPrice = footerPlan.prices[period] || footerPlan.baseMonthly;
  const revenueEstimate = Math.round(footerPrice * (footerPlan.affiliate.l1 / 100) * 10) + footerPlan.affiliate.milestone;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    const promo = await validatePromoCode(promoCode.trim().toUpperCase());
    setPromoLoading(false);
    if (promo) {
      setPromoDiscount(promo.discount_percent);
      setAppliedPromoId(promo.id);
      toast.success(`Промокод применён: -${promo.discount_percent}%`);
    }
  };

  const getFinalPrice = (planId: string) => {
    const plan = plans.find(p => p.id === planId);
    if (!plan) return 0;
    const base = getPrice(plan);
    if (promoDiscount > 0) return Math.round(base * (1 - promoDiscount / 100));
    return base;
  };

  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async (planId: string) => {
    if (!user) {
      toast.error('Войдите в аккаунт для покупки');
      navigate('/auth');
      return;
    }

    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    // Redeem promo code atomically
    if (promoCode.trim() && !appliedPromoId) {
      const result = await redeemPromoCode(promoCode.trim());
      if (!result.success) return;
      setAppliedPromoId(result.promo_code_id || null);
    } else if (appliedPromoId) {
      const result = await redeemPromoCode(promoCode.trim());
      if (!result.success) return;
    }

    const finalPrice = getFinalPrice(planId);

    // Bank transfer → redirect to invoice page for legal entities
    if (paymentMethod === 'bank') {
      navigate('/pricing/team');
      return;
    }

    // Bonus payment → apply from partner balance (TODO: implement server-side)
    if (paymentMethod === 'bonus') {
      await updateProfileLimits(user.id, planId);
      toast.info('Оплата бонусным балансом в разработке');
      return;
    }

    // Card / SBP → call YooKassa edge function
    setPurchasing(true);
    try {
      const paymentMethodType = paymentMethod === 'sbp' ? 'sbp' : 'bank_card';

      const { data, error } = await supabase.functions.invoke('yookassa-create-payment', {
        body: {
          amount: finalPrice,
          period,
          description: `ТопФокус «${plan.name}» — ${activePeriod.label}`,
          returnUrl: `${APP_URL}/profile/settings?payment=success`,
          paymentMethodType,
        },
      });

      if (error) {
        console.error('Payment creation error:', error);
        toast.error('Не удалось создать платёж. Попробуйте позже.');
        return;
      }

      if (data?.confirmation_url) {
        // Redirect to YooKassa payment page
        window.location.href = data.confirmation_url;
      } else {
        toast.error('Ошибка получения ссылки на оплату');
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Ошибка при создании платежа');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-44">
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Crown className="w-6 h-6 text-amber-500" />
              Тарифы 2.0
            </h1>
            <p className="text-sm text-muted-foreground">Выберите план, который подходит именно вам</p>
          </div>
        </div>

        {/* ─── Billing Slider ─── */}
        <div className="mb-8">
          <div className="bg-card/60 backdrop-blur-sm border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-foreground">Период оплаты</span>
              {(() => {
                const refDiscount = period !== 'monthly' && period !== 'lifetime'
                  ? discountPercent(449, plans[2].prices[period], periods.find(p => p.key === period)!.months)
                  : 0;
                return refDiscount > 0 ? (
                  <Badge className="bg-green-500/15 text-green-500 border-green-500/30 text-xs font-bold">
                    Скидка {refDiscount}%
                  </Badge>
                ) : null;
              })()}
            </div>
            <Slider
              value={[periods.findIndex(p => p.key === period)]}
              onValueChange={([v]) => setPeriod(periods[v].key)}
              min={0}
              max={periods.length - 1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between mt-2">
              {periods.map((p, i) => {
                const isActive = period === p.key;
                return (
                  <button
                    key={p.key}
                    onClick={() => setPeriod(p.key)}
                    className={`text-[11px] sm:text-xs font-medium transition-colors px-1
                      ${isActive ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {p.shortLabel}
                  </button>
                );
              })}
            </div>
            <div className="text-center mt-3">
              <span className="text-lg font-bold text-foreground">{periods.find(p => p.key === period)!.label}</span>
            </div>
          </div>
        </div>

        {/* ─── Plan Cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {plans.map((plan, idx) => {
            const price = getPrice(plan);
            const disc = getDiscount(plan);
            const isFree = plan.id === 'focus';

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08, duration: 0.4 }}
                onMouseEnter={() => setHoveredPlan(plan.id)}
                onMouseLeave={() => setHoveredPlan(null)}
                className={`relative rounded-2xl border-2 ${plan.color} bg-gradient-to-br ${plan.gradient} p-5 flex flex-col
                  ${plan.recommended ? 'ring-2 ring-purple-500/40 shadow-lg shadow-purple-500/10' : ''}`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white text-xs px-3 py-0.5 shadow">⭐ Рекомендуемый</Badge>
                  </div>
                )}

                {/* Plan Header */}
                <div className="mb-4 pt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${plan.badgeClass} text-xs`}>{plan.name}</Badge>
                    {disc > 0 && <Badge className="bg-green-500/20 text-green-400 text-xs">-{disc}%</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.tagline}</p>
                </div>

                {/* Price */}
                <div className="mb-4">
                  {isFree ? (
                    <div className="text-3xl font-bold text-foreground">Бесплатно</div>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-foreground">
                        <CountUp value={price} /> <span className="text-base font-normal text-muted-foreground">₽</span>
                      </div>
                      {period !== 'lifetime' && period !== 'monthly' && (
                        <div className="text-xs text-muted-foreground">
                          ≈ {formatPrice(Math.round(price / (plan.isTeam ? teamSize : 1) / activePeriod.months))} ₽/мес
                          {plan.isTeam && ` × ${teamSize} чел.`}
                        </div>
                      )}
                      {period === 'lifetime' && (
                        <div className="text-xs text-muted-foreground">разовая оплата</div>
                      )}
                    </>
                  )}
                </div>

                {/* Team slider */}
                {plan.isTeam && (
                  <div className="mb-4 p-3 rounded-xl bg-card/50 border border-border">
                    <div className="flex justify-between text-xs text-muted-foreground mb-2">
                      <span>Участников</span>
                      <span className="font-semibold text-foreground">{teamSize}</span>
                    </div>
                    <Slider
                      value={[teamSize]}
                      onValueChange={([v]) => setTeamSize(v)}
                      min={5}
                      max={50}
                      step={1}
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>5</span><span>50</span>
                    </div>
                  </div>
                )}

                {/* Limits */}
                <div className="space-y-1.5 mb-3">
                  {plan.limits.map((l, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{l.label}</span>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="space-y-1.5 mb-4 flex-1">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      {f.included ? (
                        <Check className="w-3.5 h-3.5 text-green-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-400 shrink-0 mt-0.5" />
                      )}
                      <span className={f.included ? 'text-foreground' : 'text-muted-foreground'}>{f.label}</span>
                    </div>
                  ))}
                </div>

                {/* Affiliate info */}
                <div className="p-2.5 rounded-lg bg-card/60 border border-border mb-4 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Users className="w-3 h-3" />
                    Партнёр «{plan.affiliate.label}»
                  </div>
                  <div className="text-muted-foreground">
                    L1: {plan.affiliate.l1}% · L2: {plan.affiliate.l2}%
                  </div>
                  <div className="text-muted-foreground">
                    Бонус за веху (10 ед): <span className="text-foreground font-semibold">{plan.affiliate.milestone} ₽</span>
                  </div>
                  {plan.affiliate.payback && (
                    <div className="text-green-400 font-medium">{plan.affiliate.payback}</div>
                  )}
                </div>

                {/* CTA */}
                <motion.div whileTap={{ scale: 0.97 }}>
                  <Button
                    className={`w-full rounded-xl font-semibold ${
                      plan.recommended
                        ? 'bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white shadow-lg shadow-purple-500/20'
                        : plan.id === 'profi'
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : plan.id === 'team'
                            ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                    onClick={() => !isFree && setSelectedPlanId(plan.id)}
                    disabled={isFree}
                  >
                    {isFree ? 'Текущий план' : selectedPlanId === plan.id ? '✓ Выбран' : 'Выбрать'}
                  </Button>
                  {plan.isTeam && (
                    <button
                      onClick={() => navigate('/pricing/team')}
                      className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2 transition-colors"
                    >
                      Оформить по счёту для юр. лиц →
                    </button>
                  )}
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* ─── Promo Code ─── */}
        {selectedPlanId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-500" />
                  Промокод
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    placeholder="Введите промокод"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="font-mono"
                  />
                  <Button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    variant="outline"
                  >
                    {promoLoading ? '...' : 'Применить'}
                  </Button>
                </div>
                {promoDiscount > 0 && (
                  <div className="mt-2 flex items-center gap-2 text-green-500 text-sm">
                    <Check className="w-4 h-4" />
                    Скидка {promoDiscount}% применена
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Payment Method ─── */}
        {selectedPlanId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="mb-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Способ оплаты</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
                  <div className="grid gap-3">
                    <Label
                      htmlFor="card"
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="card" id="card" />
                      <CreditCard className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">Банковская карта</div>
                        <div className="text-xs text-muted-foreground">Visa, Mastercard, Мир</div>
                      </div>
                    </Label>

                    <Label
                      htmlFor="sbp"
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'sbp' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="sbp" id="sbp" />
                      <Smartphone className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">СБП</div>
                        <div className="text-xs text-muted-foreground">Система быстрых платежей</div>
                      </div>
                    </Label>

                    <Label
                      htmlFor="bank"
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        paymentMethod === 'bank' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="bank" id="bank" />
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-foreground">Банковский перевод</div>
                        <div className="text-xs text-muted-foreground">Для юридических лиц</div>
                      </div>
                    </Label>

                    {bonusBalance >= 266 && (
                      <Label
                        htmlFor="bonus"
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          paymentMethod === 'bonus' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <RadioGroupItem value="bonus" id="bonus" />
                        <Wallet className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-foreground">Партнёрский баланс</div>
                          <div className="text-xs text-muted-foreground">
                            Баланс: {bonusBalance.toFixed(0)} ₽ (×1.5 = {effectiveBonusBalance.toFixed(0)} ₽)
                          </div>
                        </div>
                      </Label>
                    )}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Checkout Summary ─── */}
        {selectedPlanId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="mb-6 border-primary/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">К оплате</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const plan = plans.find(p => p.id === selectedPlanId);
                  const basePrice = plan ? getPrice(plan) : 0;
                  const finalPrice = getFinalPrice(selectedPlanId);
                  return (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Тариф «{plan?.name}» · {activePeriod.label}</span>
                        <span className="text-foreground">{formatPrice(basePrice)} ₽</span>
                      </div>
                      {promoDiscount > 0 && (
                        <div className="flex justify-between text-sm text-green-500">
                          <span>Скидка {promoDiscount}%</span>
                          <span>-{formatPrice(basePrice - finalPrice)} ₽</span>
                        </div>
                      )}
                      <div className="border-t border-border pt-2 flex justify-between font-bold text-lg">
                        <span>Итого</span>
                        <span className="text-primary">{formatPrice(finalPrice)} ₽</span>
                      </div>
                    </div>
                  );
                })()}

                <Button
                  className="w-full mt-4 rounded-xl font-semibold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black"
                  onClick={() => handlePurchase(selectedPlanId)}
                  disabled={purchasing}
                >
                  {purchasing ? (
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                  ) : (
                    <Crown className="w-4 h-4 mr-2" />
                  )}
                  {purchasing ? 'Перенаправление...' : 'Оплатить'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* ─── Dev Mode ─── */}
        <DevModeToggle />
      </div>

      {/* Spacer for sticky footer + bottom nav */}
      <div className="h-40" />

      {/* ─── Sticky Footer (Revenue Estimator) ─── */}
      <div className="fixed bottom-16 left-0 right-0 z-40">
        <div className="backdrop-blur-xl bg-card/80 border-t border-border shadow-2xl">
          <div className="max-w-5xl mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 shrink-0">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
              </div>
              <div className="text-center sm:text-left flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">
                  Ваш статус «{footerPlan.affiliate.label}» партнёра
                </div>
                <div className="text-sm text-foreground">
                  Пригласите 10 активных друзей на тариф <span className="font-semibold">{footerPlan.name}</span>{' '}
                  и заработайте{' '}
                  <span className="text-lg font-bold text-primary">
                    <CountUp value={revenueEstimate} /> ₽
                  </span>
                  {' '}+ бонус за веху!
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
