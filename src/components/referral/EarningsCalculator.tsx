import { useState, useMemo, useCallback } from 'react';
import { APP_URL } from '@/lib/constants';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, Users, Sparkles, Share2, Crown,
  TrendingUp, Zap, Info, Gift, Star, AlertTriangle, Clock, Target
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface EarningsCalculatorProps {
  isPro: boolean;
}

// Commission engine
// BASIC:   Tier1 15%, Tier2 20%, L2 1.5%, milestones 250/500
// PREMIUM: Tier1 25%, Tier2 30%, L2 2.5%, milestones 500/1000

function getCommRates(isPro: boolean, l1Count: number) {
  const tier = l1Count <= 50 ? 1 : 2;
  if (isPro) {
    return { l1: tier === 1 ? 0.25 : 0.30, l2: 0.025, tier };
  }
  return { l1: tier === 1 ? 0.15 : 0.20, l2: 0.015, tier };
}

function calcMilestones(l1Count: number, isPro: boolean) {
  const bonusT1 = isPro ? 500 : 250;
  const bonusT2 = isPro ? 1000 : 500;
  let total = 0;
  const achieved: number[] = [];

  // Tier 1 milestones: every 10 up to 50
  for (let t = 10; t <= Math.min(l1Count, 50); t += 10) {
    total += bonusT1;
    achieved.push(t);
  }
  // Tier 2 milestones: every 25 after 50
  if (l1Count > 50) {
    for (let t = 75; t <= l1Count; t += 25) {
      total += bonusT2;
      achieved.push(t);
    }
  }
  return { total, achieved };
}

// All possible milestone thresholds for badge display
const MILESTONE_THRESHOLDS = [10, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200];

export function EarningsCalculator({ isPro: defaultIsPro }: EarningsCalculatorProps) {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  // Status toggle
  const [simPro, setSimPro] = useState(defaultIsPro);

  // Sliders
  const [l1Count, setL1Count] = useState([25]);
  const [l2Mult, setL2Mult] = useState([2]);
  const [avgPrice, setAvgPrice] = useState([1990]);

  const calc = useMemo(() => {
    const l1 = l1Count[0];
    const l2Total = l1 * l2Mult[0];
    const price = avgPrice[0];
    const monthlyPrice = price; // monthly subscription price

    const rates = getCommRates(simPro, l1);
    const ratesBasic = getCommRates(false, l1);
    const ratesPremium = getCommRates(true, l1);

    const directIncome = l1 * monthlyPrice * rates.l1;
    const passiveIncome = l2Total * monthlyPrice * rates.l2;
    const milestones = calcMilestones(l1, simPro);

    // Premium ghost (what you'd earn with premium)
    const premDirect = l1 * monthlyPrice * ratesPremium.l1;
    const premPassive = l2Total * monthlyPrice * ratesPremium.l2;
    const premMilestones = calcMilestones(l1, true);
    const premTotal = premDirect + premPassive + premMilestones.total;

    // Basic earnings (for comparison)
    const basicDirect = l1 * monthlyPrice * ratesBasic.l1;
    const basicPassive = l2Total * monthlyPrice * ratesBasic.l2;
    const basicMilestones = calcMilestones(l1, false);
    const basicTotal = basicDirect + basicPassive + basicMilestones.total;

    const totalMonthly = directIncome + passiveIncome + milestones.total;

    // ROI / Payback
    const subCost = 1990; // monthly subscription cost
    const paybackBasic = ratesBasic.l1 > 0 ? Math.ceil(subCost / (monthlyPrice * ratesBasic.l1)) : 999;
    const paybackPremium = ratesPremium.l1 > 0 ? Math.ceil(subCost / (monthlyPrice * ratesPremium.l1)) : 999;

    const difference = premTotal - basicTotal;

    return {
      l1, l2Total, price: monthlyPrice,
      rates,
      directIncome: Math.round(directIncome),
      passiveIncome: Math.round(passiveIncome),
      milestonesTotal: milestones.total,
      milestonesAchieved: milestones.achieved,
      totalMonthly: Math.round(totalMonthly),
      premTotal: Math.round(premTotal),
      difference: Math.round(difference),
      paybackBasic,
      paybackPremium,
      tier: rates.tier,
      l1Percent: Math.round(rates.l1 * 100),
      l2Percent: rates.l2 * 100,
    };
  }, [l1Count, l2Mult, avgPrice, simPro]);

  const handleShare = useCallback(async () => {
    const status = simPro ? 'Premium' : (isRu ? 'Базовый' : 'Basic');
    const text = isRu
      ? `💰 Калькулятор ТопФокус 2.0 (${status}):\n👥 ${calc.l1} друзей → ${calc.totalMonthly.toLocaleString()}₽/мес\n💜 Прямые: ${calc.directIncome.toLocaleString()}₽\n🔗 Пассив (L2): ${calc.passiveIncome.toLocaleString()}₽\n🏆 Бонусы: ${calc.milestonesTotal.toLocaleString()}₽\n\n${APP_URL}/partner`
      : `💰 TopFocus 2.0 Calculator (${status}):\n👥 ${calc.l1} friends → ${calc.totalMonthly.toLocaleString()}₽/mo\n💜 Direct: ${calc.directIncome.toLocaleString()}₽\n🔗 Passive (L2): ${calc.passiveIncome.toLocaleString()}₽\n🏆 Bonuses: ${calc.milestonesTotal.toLocaleString()}₽\n\n${APP_URL}/partner`;

    if (navigator.share) {
      try { await navigator.share({ title: 'TopFocus Affiliate Calculator', text }); return; } catch {}
    }
    await navigator.clipboard.writeText(text);
    toast.success(isRu ? 'Скопировано!' : 'Copied!');
  }, [calc, simPro, isRu]);

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Main Calculator Card */}
        <Card className="border-2 border-purple-500/30 bg-gradient-to-br from-purple-500/5 via-background to-indigo-500/5 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-500" />
              {isRu ? 'Калькулятор дохода' : 'Revenue Calculator'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Status Toggle */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setSimPro(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !simPro
                    ? 'bg-muted text-foreground ring-2 ring-primary/50 shadow-sm'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                {isRu ? 'Базовый' : 'Basic'} (15%)
              </button>
              <button
                onClick={() => setSimPro(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  simPro
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white ring-2 ring-amber-500/50 shadow-lg'
                    : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <Crown className="w-3.5 h-3.5 inline mr-1" />
                Premium (25%)
              </button>
            </div>

            {/* Tier Badge */}
            <div className="flex items-center justify-center gap-3">
              <Badge variant={calc.tier === 1 ? "default" : "outline"} className={calc.tier === 1 ? "bg-purple-500 text-white" : ""}>
                {isRu ? `Ур.1: ${calc.tier === 1 ? calc.l1Percent : (simPro ? 25 : 15)}%` : `T1: ${calc.tier === 1 ? calc.l1Percent : (simPro ? 25 : 15)}%`}
              </Badge>
              <Badge variant={calc.tier === 2 ? "default" : "outline"} className={calc.tier === 2 ? "bg-amber-500 text-black" : ""}>
                {isRu ? `Ур.2: ${calc.tier === 2 ? calc.l1Percent : (simPro ? 30 : 20)}%` : `T2: ${calc.tier === 2 ? calc.l1Percent : (simPro ? 30 : 20)}%`}
              </Badge>
            </div>

            {/* Sliders */}
            <div className="space-y-5">
              {/* Slider 1: L1 Friends */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-500" />
                    {isRu ? 'Активных друзей (L1)' : 'Active Friends (L1)'}
                  </label>
                  <Badge variant="outline" className="text-lg font-bold tabular-nums">{l1Count[0]}</Badge>
                </div>
                <Slider value={l1Count} onValueChange={setL1Count} max={200} min={1} step={1} className="w-full" />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>1</span>
                  <span className={l1Count[0] > 50 ? 'text-amber-500 font-medium' : ''}>50 →Ур.2</span>
                  <span>200</span>
                </div>
              </div>

              {/* Slider 2: L2 Multiplier */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-indigo-500" />
                    {isRu ? 'Друзья друзей (L2 множ.)' : 'Friends of friends (L2 avg)'}
                  </label>
                  <Badge variant="outline" className="text-lg font-bold tabular-nums">×{l2Mult[0]}</Badge>
                </div>
                <Slider value={l2Mult} onValueChange={setL2Mult} max={20} min={0} step={1} className="w-full" />
                <div className="text-[10px] text-muted-foreground mt-1 text-right">
                  {isRu ? `= ${calc.l2Total} рефералов 2-го уровня` : `= ${calc.l2Total} L2 referrals`}
                </div>
              </div>

              {/* Slider 3: Avg Subscription Price */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-500" />
                    {isRu ? 'Ср. стоимость подписки' : 'Avg Subscription Price'}
                  </label>
                  <Badge variant="outline" className="text-lg font-bold tabular-nums">{avgPrice[0].toLocaleString()}₽</Badge>
                </div>
                <Slider value={avgPrice} onValueChange={setAvgPrice} max={450} min={200} step={25} className="w-full" />
              </div>
            </div>

            {/* Progressive Milestone Badges */}
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Gift className="w-3.5 h-3.5" />
                {isRu ? 'Вехи' : 'Milestones'}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {MILESTONE_THRESHOLDS.filter(t => t <= Math.max(l1Count[0] + 25, 50)).map(t => {
                  const isAchieved = calc.milestonesAchieved.includes(t);
                  const bonus = t <= 50
                    ? (simPro ? 500 : 250)
                    : (simPro ? 1000 : 500);
                  return (
                    <Tooltip key={t}>
                      <TooltipTrigger>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${
                          isAchieved
                            ? 'bg-amber-500/20 text-amber-500 ring-1 ring-amber-500/40'
                            : 'bg-muted/40 text-muted-foreground'
                        }`}>
                          {isAchieved ? <Star className="w-3 h-3" /> : <span className="w-3 h-3 rounded-full border border-muted-foreground/30 inline-block" />}
                          {t}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">{isAchieved ? '✅' : '🔒'} {t} {isRu ? 'друзей' : 'friends'} → +{bonus}₽</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>

            {/* Milestone Progress Bar */}
            {(() => {
              const l1 = l1Count[0];
              let nextTarget: number;
              let prevTarget: number;
              if (l1 <= 50) {
                prevTarget = Math.floor(l1 / 10) * 10;
                nextTarget = prevTarget + 10;
              } else {
                // After 50: targets are 75, 100, 125, 150...
                const l2Targets = [75, 100, 125, 150, 175, 200];
                nextTarget = l2Targets.find(t => t > l1) || l1 + 25;
                prevTarget = l2Targets.filter(t => t <= l1).pop() || 50;
              }
              const progressVal = ((l1 - prevTarget) / (nextTarget - prevTarget)) * 100;
              const milestoneBonus = nextTarget <= 50
                ? (simPro ? 500 : 250)
                : (simPro ? 1000 : 500);

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" />
                      {isRu ? 'До следующей вехи' : 'Next milestone'}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {l1} / {nextTarget} → +{milestoneBonus}₽
                    </Badge>
                  </div>
                  <Progress value={Math.min(progressVal, 100)} className="h-2.5" />
                  {l1 > 50 && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center"
                    >
                      <p className="text-xs font-medium text-amber-500">
                        🎉 {isRu
                          ? `Уровень 2 разблокирован! Следующий бонус за ${nextTarget} активных друзей`
                          : `Level 2 unlocked! Next big milestone bonus at ${nextTarget} active friends`}
                      </p>
                    </motion.div>
                  )}
                </div>
              );
            })()}

            {/* Financial Overview — Big Counter */}
            <motion.div
              key={`${l1Count[0]}-${l2Mult[0]}-${avgPrice[0]}-${simPro}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="rounded-xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-violet-500/10 border border-purple-500/20 p-4"
            >
              <div className="text-center mb-3">
                <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-1" />
                <div className="text-xs text-muted-foreground">
                  {isRu ? 'Ваш расчётный доход в месяц' : 'Your Estimated Monthly Profit'}
                </div>
              </div>

              <motion.div
                key={calc.totalMonthly}
                initial={{ scale: 1.1, color: 'hsl(142, 70%, 50%)' }}
                animate={{ scale: 1, color: 'hsl(142, 70%, 45%)' }}
                className="text-center"
              >
                <div className="text-4xl font-extrabold tracking-tight" style={{ color: 'hsl(142, 70%, 45%)' }}>
                  {calc.totalMonthly.toLocaleString()}₽
                </div>
                <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
                  {isRu ? '/мес' : '/mo'}
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3 h-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-[200px]">
                        {isRu
                          ? '⏳ Холд 14 дней — средства доступны к выводу через 14 дней после оплаты рефералом.'
                          : '⏳ 14-day hold — funds available for withdrawal 14 days after referral payment.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </motion.div>

              {/* Breakdown */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="text-lg font-bold text-purple-500">{calc.directIncome.toLocaleString()}₽</div>
                  <div className="text-[10px] text-muted-foreground">{isRu ? 'Прямые L1' : 'Direct L1'}</div>
                  <div className="text-[10px] text-purple-500">{calc.l1Percent}% × {calc.l1}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="text-lg font-bold text-indigo-500">{calc.passiveIncome.toLocaleString()}₽</div>
                  <div className="text-[10px] text-muted-foreground">{isRu ? 'Пассив L2' : 'Passive L2'}</div>
                  <div className="text-[10px] text-indigo-500">{calc.l2Percent}% × {calc.l2Total}</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-background/50">
                  <div className="text-lg font-bold text-amber-500">+{calc.milestonesTotal.toLocaleString()}₽</div>
                  <div className="text-[10px] text-muted-foreground">{isRu ? 'Бонусы' : 'Bonuses'}</div>
                </div>
              </div>
            </motion.div>

            {/* FOMO Loss Indicator — only if simulating Basic */}
            <AnimatePresence>
              {!simPro && calc.difference > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 rounded-xl border-2 border-dashed border-amber-500/40 bg-amber-500/5 space-y-2">
                    <div className="flex items-center gap-2 text-amber-500">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span className="text-xs font-semibold">
                        {isRu
                          ? `⚠️ Вы теряете ${calc.difference.toLocaleString()}₽/мес без Premium!`
                          : `⚠️ You are losing ${calc.difference.toLocaleString()}₽/mo without Premium!`}
                      </span>
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {isRu
                        ? `Потенциальный доход с Premium: ${calc.premTotal.toLocaleString()}₽/мес`
                        : `Potential Premium earnings: ${calc.premTotal.toLocaleString()}₽/mo`}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => navigate('/upgrade')}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs"
                    >
                      <Crown className="w-3.5 h-3.5 mr-1" />
                      {isRu ? 'Перейти на Premium и получить 100% прибыли' : 'Upgrade to Premium & claim 100% profit'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* ROI & Payback Card */}
        <Card className="border border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-green-500" />
              {isRu ? 'Путь к бесплатной подписке' : 'Path to Free Subscription'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">{isRu ? 'Базовый' : 'Basic'}</div>
                <div className="text-2xl font-bold text-foreground">{calc.paybackBasic}</div>
                <div className="text-[10px] text-muted-foreground">{isRu ? 'друзей для окупаемости' : 'friends to break even'}</div>
              </div>
              <div className="text-center p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <div className="text-xs text-amber-500 font-medium mb-1">Premium ⭐</div>
                <div className="text-2xl font-bold text-amber-500">{calc.paybackPremium}</div>
                <div className="text-[10px] text-muted-foreground">{isRu ? 'друзей для окупаемости' : 'friends to break even'}</div>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              {isRu
                ? `С Premium подписка окупается за ${calc.paybackPremium} рекомендации вместо ${calc.paybackBasic}!`
                : `With Premium, subscription pays for itself in ${calc.paybackPremium} referrals instead of ${calc.paybackBasic}!`}
            </p>
          </CardContent>
        </Card>

        {/* CTA Buttons */}
        <div className="flex flex-col gap-2">
          {!defaultIsPro && (
            <Button
              onClick={() => navigate('/upgrade')}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              {isRu ? '🔥 Перейти на Premium и увеличить доход' : '🔥 Upgrade to Premium & Boost Income'}
            </Button>
          )}
          <Button variant="outline" className="w-full gap-2" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            {isRu ? 'Скопировать реферальную ссылку' : 'Copy Referral Link'}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
