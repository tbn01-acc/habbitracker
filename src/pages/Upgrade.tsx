import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Crown, Check, CreditCard, Smartphone, Building2, Gift, Clock, Tag, Wallet, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { usePromoCodes } from '@/hooks/usePromoCodes';
import { useReferralProgram } from '@/hooks/useReferralProgram';
import { DevModeToggle } from '@/components/DevModeToggle';
import { toast } from 'sonner';

type PlanPeriod = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'biennial' | 'lifetime';
type PaymentMethod = 'card' | 'sbp' | 'bank' | 'bonus';

interface PricingPlan {
  period: PlanPeriod;
  labelRu: string;
  labelEn: string;
  priceRub: number;
  priceUsd: number;
  monthlyRub: string;
  monthlyUsd: string;
  savings?: string;
  bonusEligible?: boolean;
}

const pricingPlans: PricingPlan[] = [
  { period: 'monthly', labelRu: '1 месяц', labelEn: '1 month', priceRub: 399, priceUsd: 3.99, monthlyRub: '399 ₽/мес', monthlyUsd: '$3.99/mo' },
  { period: 'quarterly', labelRu: '3 месяца', labelEn: '3 months', priceRub: 1047, priceUsd: 10.47, monthlyRub: '349 ₽/мес', monthlyUsd: '$3.49/mo', savings: '-13%' },
  { period: 'semiannual', labelRu: '6 месяцев', labelEn: '6 months', priceRub: 1794, priceUsd: 17.94, monthlyRub: '299 ₽/мес', monthlyUsd: '$2.99/mo', savings: '-25%' },
  { period: 'annual', labelRu: '12 месяцев', labelEn: '12 months', priceRub: 2988, priceUsd: 29.88, monthlyRub: '249 ₽/мес', monthlyUsd: '$2.49/mo', savings: '-38%', bonusEligible: true },
  { period: 'biennial', labelRu: '24 месяца', labelEn: '24 months', priceRub: 4776, priceUsd: 47.76, monthlyRub: '199 ₽/мес', monthlyUsd: '$1.99/mo', savings: '-50%', bonusEligible: true },
  { period: 'lifetime', labelRu: 'Навсегда', labelEn: 'Lifetime', priceRub: 5990, priceUsd: 59.90, monthlyRub: 'навсегда', monthlyUsd: 'forever', savings: '∞' },
];

const proFeatures = [
  { ru: 'Неограниченно привычек, задач, операций', en: 'Unlimited habits, tasks, transactions' },
  { ru: 'Облачная синхронизация', en: 'Cloud sync' },
  { ru: 'Экспорт в PDF/CSV', en: 'Export to PDF/CSV' },
  { ru: 'Бэкап на 7 дней', en: 'Data backup for 7 days' },
  { ru: 'До 3 устройств', en: 'Up to 3 devices' },
  { ru: 'Все 10 мини-приложений', en: 'All 10 mini-apps' },
];

const freeFeatures = [
  { ru: 'До 3 привычек', en: 'Up to 3 habits', limit: true },
  { ru: 'До 5 задач (без подзадач, вложений и регулярности)', en: 'Up to 5 tasks (no subtasks, attachments, recurrence)', limit: true },
  { ru: 'До 15 финансовых операций/мес', en: 'Up to 15 transactions/month', limit: true },
  { ru: 'Локальное хранение данных', en: 'Local data storage' },
  { ru: 'Базовая статистика', en: 'Basic statistics' },
  { ru: '3 мини-приложения', en: '3 mini-apps' },
];

export default function Upgrade() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { isInTrial, trialDaysLeft, trialBonusMonths } = useSubscription();
  const { language } = useTranslation();
  const { validatePromoCode, usePromoCode } = usePromoCodes();
  const { wallet } = useReferralProgram();
  const isRussian = language === 'ru';

  const [selectedPlan, setSelectedPlan] = useState<PlanPeriod>('annual');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromoId, setAppliedPromoId] = useState<string | null>(null);

  // Check if user came from bonus payment link
  const useBonusPayment = searchParams.get('bonus') === 'true';
  const bonusBalance = wallet?.balance_rub || 0;
  const bonusMultiplier = 1.5;
  const effectiveBonusBalance = bonusBalance * bonusMultiplier;

  useEffect(() => {
    if (useBonusPayment && bonusBalance >= 266) {
      setPaymentMethod('bonus');
    }
  }, [useBonusPayment, bonusBalance]);

  const selectedPlanData = pricingPlans.find(p => p.period === selectedPlan)!;
  const showBonus = isInTrial && trialBonusMonths > 0 && selectedPlanData.bonusEligible;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    const promo = await validatePromoCode(promoCode.trim().toUpperCase());
    setPromoLoading(false);

    if (promo) {
      setPromoDiscount(promo.discount_percent);
      setAppliedPromoId(promo.id);
      toast.success(isRussian ? `Промокод применён: -${promo.discount_percent}%` : `Promo code applied: -${promo.discount_percent}%`);
    }
  };

  const getFinalPrice = () => {
    const basePrice = selectedPlanData.priceRub;
    if (promoDiscount > 0) {
      return Math.round(basePrice * (1 - promoDiscount / 100));
    }
    return basePrice;
  };

  const handlePurchase = async () => {
    if (!user) {
      toast.error(isRussian ? 'Войдите в аккаунт для покупки' : 'Sign in to purchase');
      navigate('/auth');
      return;
    }

    // Mark promo code as used if applied
    if (appliedPromoId) {
      await usePromoCode(appliedPromoId);
    }

    // TODO: Integrate with payment provider
    toast.info(isRussian ? 'Платёжная система в разработке' : 'Payment system coming soon');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Crown className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Перейти на PRO' : 'Upgrade to PRO'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Разблокируйте все возможности' : 'Unlock all features'}
              </p>
            </div>
          </div>
        </div>

        {/* Trial Bonus Banner */}
        {isInTrial && trialBonusMonths > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="mb-6 border-green-500/50 bg-gradient-to-br from-green-500/10 to-transparent">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Gift className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground flex items-center gap-2">
                      {isRussian ? 'Ваш бонус за регистрацию!' : 'Your signup bonus!'}
                      <Badge variant="secondary" className="bg-green-500/20 text-green-500">
                        <Clock className="w-3 h-3 mr-1" />
                        {trialDaysLeft} {isRussian ? 'дн.' : 'days'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRussian 
                        ? `+${trialBonusMonths} мес. бесплатно при покупке годового или 2-летнего тарифа`
                        : `+${trialBonusMonths} mo. free with annual or 2-year plan`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* FREE Plan */}
        <Card className="mb-6 border-muted">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                🆓 FREE
              </span>
              <Badge variant="outline">
                {isRussian ? 'Текущий' : 'Current'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {freeFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <span className={`w-4 h-4 flex-shrink-0 ${feature.limit ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {feature.limit ? '⚠️' : '✓'}
                  </span>
                  <span className="text-muted-foreground">{isRussian ? feature.ru : feature.en}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PRO Features */}
        <Card className="mb-6 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500" />
              {isRussian ? 'Что включено в PRO' : 'What\'s included in PRO'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {proFeatures.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span className="text-foreground">{isRussian ? feature.ru : feature.en}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Plan Selection */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isRussian ? 'Выберите тариф' : 'Choose a plan'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedPlan} onValueChange={(v) => setSelectedPlan(v as PlanPeriod)}>
              <div className="grid gap-3">
                {pricingPlans.map((plan) => (
                  <motion.div
                    key={plan.period}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Label
                      htmlFor={plan.period}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPlan === plan.period 
                          ? 'border-amber-500 bg-amber-500/10' 
                          : 'border-border hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <RadioGroupItem value={plan.period} id={plan.period} />
                        <div>
                          <div className="font-medium text-foreground flex items-center gap-2">
                            {isRussian ? plan.labelRu : plan.labelEn}
                            {plan.savings && (
                              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-500">
                                {plan.savings}
                              </Badge>
                            )}
                            {isInTrial && trialBonusMonths > 0 && plan.bonusEligible && (
                              <Badge variant="secondary" className="text-xs bg-purple-500/20 text-purple-500">
                                +{trialBonusMonths} {isRussian ? 'мес.' : 'mo.'}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {isRussian ? plan.monthlyRub : plan.monthlyUsd}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          {isRussian ? `${plan.priceRub.toLocaleString()} ₽` : `$${plan.priceUsd}`}
                        </div>
                      </div>
                    </Label>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Promo Code */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Tag className="w-4 h-4 text-purple-500" />
              {isRussian ? 'Промокод' : 'Promo Code'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder={isRussian ? 'Введите промокод' : 'Enter promo code'}
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                className="font-mono"
              />
              <Button 
                onClick={handleApplyPromo} 
                disabled={promoLoading || !promoCode.trim()}
                variant="outline"
              >
                {promoLoading ? '...' : (isRussian ? 'Применить' : 'Apply')}
              </Button>
            </div>
            {promoDiscount > 0 && (
              <div className="mt-2 flex items-center gap-2 text-green-500 text-sm">
                <Check className="w-4 h-4" />
                {isRussian ? `Скидка ${promoDiscount}% применена` : `${promoDiscount}% discount applied`}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {isRussian ? 'Способ оплаты' : 'Payment method'}
            </CardTitle>
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
                    <div className="font-medium text-foreground">
                      {isRussian ? 'Банковская карта' : 'Credit/Debit Card'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Visa, Mastercard, Мир
                    </div>
                  </div>
                </Label>

                {isRussian && (
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
                      <div className="text-xs text-muted-foreground">
                        Система быстрых платежей
                      </div>
                    </div>
                  </Label>
                )}

                <Label
                  htmlFor="bank"
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    paymentMethod === 'bank' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="bank" id="bank" />
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-foreground">
                      {isRussian ? 'Банковский перевод' : 'Bank Transfer'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isRussian ? 'Для юридических лиц' : 'For businesses'}
                    </div>
                  </div>
                </Label>

                {/* Bonus balance payment option */}
                {bonusBalance >= 266 && (
                  <Label
                    htmlFor="bonus"
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'bonus' ? 'border-purple-500 bg-purple-500/5' : 'border-border hover:border-purple-500/50'
                    }`}
                  >
                    <RadioGroupItem value="bonus" id="bonus" />
                    <Wallet className="w-5 h-5 text-purple-500" />
                    <div className="flex-1">
                      <div className="font-medium text-foreground flex items-center gap-2">
                        {isRussian ? 'Бонусные рубли' : 'Bonus Rubles'}
                        <Badge className="bg-purple-500/20 text-purple-500 text-xs">
                          x{bonusMultiplier}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {isRussian 
                          ? `${bonusBalance}₽ × ${bonusMultiplier} = ${Math.round(effectiveBonusBalance)}₽ доступно`
                          : `${bonusBalance}₽ × ${bonusMultiplier} = ${Math.round(effectiveBonusBalance)}₽ available`}
                      </div>
                    </div>
                  </Label>
                )}
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Purchase Button */}
        <Card className="border-amber-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm text-muted-foreground">
                  {isRussian ? 'К оплате:' : 'Total:'}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {promoDiscount > 0 ? (
                    <>
                      <span className="line-through text-muted-foreground text-lg mr-2">
                        {selectedPlanData.priceRub.toLocaleString()} ₽
                      </span>
                      {getFinalPrice().toLocaleString()} ₽
                    </>
                  ) : (
                    isRussian 
                      ? `${selectedPlanData.priceRub.toLocaleString()} ₽`
                      : `$${selectedPlanData.priceUsd}`
                  )}
                </div>
                {showBonus && (
                  <div className="text-sm text-green-500 font-medium">
                    +{trialBonusMonths} {isRussian ? 'мес. в подарок' : 'mo. free bonus'}
                  </div>
                )}
              </div>
              <div className="text-right">
                <Badge className="bg-amber-500 text-black">
                  {isRussian ? selectedPlanData.labelRu : selectedPlanData.labelEn}
                </Badge>
                {showBonus && (
                  <div className="mt-1">
                    <Badge variant="outline" className="border-green-500 text-green-500 text-xs">
                      <Gift className="w-3 h-3 mr-1" />
                      {isRussian ? 'Бонус!' : 'Bonus!'}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
            <Button
              onClick={handlePurchase}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-black font-semibold h-12 text-base"
            >
              <Crown className="w-5 h-5 mr-2" />
              {isRussian ? 'Оплатить и получить PRO' : 'Pay and Get PRO'}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {isRussian 
                ? 'Безопасная оплата. Подписка активируется мгновенно.'
                : 'Secure payment. Subscription activates instantly.'}
            </p>
          </CardContent>
        </Card>

        {/* Dev Mode Toggle - only for test account */}
        <DevModeToggle />
      </div>
    </div>
  );
}
