import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Users, DollarSign, Gift, Sparkles, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/contexts/LanguageContext';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface EarningsCalculatorProps {
  isPro: boolean;
}

export function EarningsCalculator({ isPro }: EarningsCalculatorProps) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  
  const [referralCount, setReferralCount] = useState([15]);
  const [paidPercent, setPaidPercent] = useState([50]);

  const calculations = useMemo(() => {
    const total = referralCount[0];
    const paid = Math.floor(total * (paidPercent[0] / 100));
    const active = total;

    // Calculate weeks bonus
    let weeks = 0;
    let commission = 0;
    let commissionPercent = 0;

    if (isPro) {
      // PRO: 2 weeks per active
      weeks = active * 2;
      
      // Commission calculation
      if (paid >= 26) commissionPercent = 15;
      else if (paid >= 11) commissionPercent = 10;
      else if (paid >= 1) commissionPercent = 5;
      
      const avgPayment = 2988; // Average annual plan
      commission = (avgPayment * commissionPercent / 100) * paid;
    } else {
      // FREE: 1 week per active + paid bonuses
      weeks = active;
      
      if (paid >= 26) {
        weeks += 10 * 2 + 15 * 3 + (paid - 25) * 4;
      } else if (paid >= 11) {
        weeks += 10 * 2 + (paid - 10) * 3;
      } else if (paid >= 1) {
        weeks += paid * 2;
      }
    }

    const months = Math.floor(weeks / 4);
    const years = (weeks / 52).toFixed(1);

    return { weeks, commission, commissionPercent, months, years, active, paid };
  }, [referralCount, paidPercent, isPro]);

  // Generate chart data
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= 50; i += 5) {
      const paid = Math.floor(i * (paidPercent[0] / 100));
      let weeks = isPro ? i * 2 : i;
      
      if (!isPro) {
        if (paid >= 26) weeks += 10 * 2 + 15 * 3 + (paid - 25) * 4;
        else if (paid >= 11) weeks += 10 * 2 + (paid - 10) * 3;
        else if (paid >= 1) weeks += paid * 2;
      }

      let commission = 0;
      if (isPro && paid > 0) {
        let percent = 5;
        if (paid >= 26) percent = 15;
        else if (paid >= 11) percent = 10;
        commission = (2988 * percent / 100) * paid;
      }

      data.push({
        referrals: i,
        weeks,
        commission: Math.round(commission),
      });
    }
    return data;
  }, [paidPercent, isPro]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4 text-purple-500" />
          {isRussian ? 'Калькулятор доходности' : 'Earnings Calculator'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sliders */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                {isRussian ? 'Приглашённых друзей' : 'Invited friends'}
              </label>
              <Badge variant="outline" className="text-lg font-bold">
                {referralCount[0]}
              </Badge>
            </div>
            <Slider
              value={referralCount}
              onValueChange={setReferralCount}
              max={100}
              min={1}
              step={1}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                {isRussian ? 'Оплатят PRO (%)' : 'Will pay for PRO (%)'}
              </label>
              <Badge variant="outline" className="text-lg font-bold">
                {paidPercent[0]}%
              </Badge>
            </div>
            <Slider
              value={paidPercent}
              onValueChange={setPaidPercent}
              max={100}
              min={0}
              step={5}
              className="w-full"
            />
          </div>
        </div>

        {/* Results */}
        <motion.div
          key={`${referralCount[0]}-${paidPercent[0]}`}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-500/10 border border-purple-500/20"
        >
          <div className="text-center mb-4">
            <Sparkles className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <div className="text-sm text-muted-foreground">
              {isRussian ? 'Ваш доход' : 'Your earnings'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-2xl font-bold text-foreground">
                +{calculations.weeks}
              </div>
              <div className="text-xs text-muted-foreground">
                {isRussian ? 'недель PRO' : 'weeks of PRO'}
              </div>
              <div className="text-xs text-green-500 mt-1">
                ≈ {calculations.months} {isRussian ? 'мес.' : 'mo.'} / {calculations.years} {isRussian ? 'лет' : 'yr'}
              </div>
            </div>

            {isPro && calculations.commission > 0 && (
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-amber-500">
                  +{calculations.commission.toLocaleString()} ₽
                </div>
                <div className="text-xs text-muted-foreground">
                  {isRussian ? 'комиссия' : 'commission'}
                </div>
                <div className="text-xs text-amber-500 mt-1">
                  {calculations.commissionPercent}% {isRussian ? 'от оплат' : 'of payments'}
                </div>
              </div>
            )}

            {!isPro && (
              <div className="text-center p-3 rounded-lg bg-background/50">
                <div className="text-2xl font-bold text-green-500">
                  {calculations.paid}
                </div>
                <div className="text-xs text-muted-foreground">
                  {isRussian ? 'оплатят PRO' : 'will pay for PRO'}
                </div>
                <div className="text-xs text-green-500 mt-1">
                  = +{calculations.paid * 2} {isRussian ? 'доп. нед.' : 'extra weeks'}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="weekGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                {isPro && (
                  <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                )}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="referrals" 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => `${value} ${isRussian ? 'рефералов' : 'referrals'}`}
              />
              <Area
                type="monotone"
                dataKey="weeks"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#weekGradient)"
                name={isRussian ? 'Недели PRO' : 'PRO Weeks'}
              />
              {isPro && (
                <Area
                  type="monotone"
                  dataKey="commission"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#commissionGradient)"
                  name={isRussian ? 'Комиссия (₽)' : 'Commission (₽)'}
                />
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          {isRussian 
            ? '* Расчёт на основе средней стоимости годового тарифа (2 988 ₽)'
            : '* Based on average annual plan cost (2,988 ₽)'}
        </p>
      </CardContent>
    </Card>
  );
}
