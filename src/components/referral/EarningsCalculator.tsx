import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calculator, Users, DollarSign, Gift, Sparkles, TrendingUp, Star } from 'lucide-react';
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

// Affiliate 2.0 Commission Structure
// Level 1 (1-50): 20% + milestone bonuses (500₽ at 10,20,30,40; 1000₽ at 50)
// Level 2 (51+): 30% + 1000₽ every 25 referrals
// VIP (200+): One-time 5000₽ bonus

function calculateAffiliateEarnings(paidReferrals: number, avgPayment: number) {
  let commissions = 0;
  let milestones = 0;
  
  // Calculate commissions
  for (let i = 1; i <= paidReferrals; i++) {
    const commission = i <= 50 ? 0.20 : 0.30;
    commissions += avgPayment * commission;
  }
  
  // Calculate milestone bonuses
  if (paidReferrals >= 10) milestones += 500;
  if (paidReferrals >= 20) milestones += 500;
  if (paidReferrals >= 30) milestones += 500;
  if (paidReferrals >= 40) milestones += 500;
  if (paidReferrals >= 50) milestones += 1000;
  
  // Level 2 milestones (every 25 after 50)
  if (paidReferrals > 50) {
    const level2Milestones = Math.floor((paidReferrals - 50) / 25);
    milestones += level2Milestones * 1000;
  }
  
  // VIP bonus
  if (paidReferrals >= 200) {
    milestones += 5000;
  }
  
  return {
    commissions: Math.round(commissions),
    milestones,
    total: Math.round(commissions) + milestones,
    level: paidReferrals <= 50 ? 1 : 2,
    commissionPercent: paidReferrals <= 50 ? 20 : 30,
    isVIP: paidReferrals >= 200
  };
}

export function EarningsCalculator({ isPro }: EarningsCalculatorProps) {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  
  const [referralCount, setReferralCount] = useState([25]);
  const [paidPercent, setPaidPercent] = useState([60]);
  const [avgPayment, setAvgPayment] = useState([2988]);

  const calculations = useMemo(() => {
    const total = referralCount[0];
    const paid = Math.floor(total * (paidPercent[0] / 100));
    
    const earnings = calculateAffiliateEarnings(paid, avgPayment[0]);
    
    // Conversion bonus (1:1.5)
    const withConversion = Math.round(earnings.total * 1.5);
    
    return {
      ...earnings,
      paid,
      total,
      withConversion
    };
  }, [referralCount, paidPercent, avgPayment]);

  // Generate chart data
  const chartData = useMemo(() => {
    const data = [];
    for (let i = 0; i <= 200; i += 10) {
      const paid = Math.floor(i * (paidPercent[0] / 100));
      const earnings = calculateAffiliateEarnings(paid, avgPayment[0]);
      
      data.push({
        referrals: i,
        commissions: earnings.commissions,
        milestones: earnings.milestones,
        total: earnings.total,
      });
    }
    return data;
  }, [paidPercent, avgPayment]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4 text-purple-500" />
          {isRussian ? 'Калькулятор Affiliate 2.0' : 'Affiliate 2.0 Calculator'}
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
              max={250}
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

        {/* Level indicator */}
        <div className="flex items-center justify-center gap-4">
          <Badge 
            variant={calculations.level === 1 ? "default" : "outline"} 
            className={calculations.level === 1 ? "bg-purple-500" : ""}
          >
            {isRussian ? 'Уровень 1: 20%' : 'Level 1: 20%'}
          </Badge>
          <Badge 
            variant={calculations.level === 2 ? "default" : "outline"}
            className={calculations.level === 2 ? "bg-amber-500 text-black" : ""}
          >
            {isRussian ? 'Уровень 2: 30%' : 'Level 2: 30%'}
          </Badge>
          {calculations.isVIP && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
              <Star className="w-3 h-3 mr-1" />
              VIP
            </Badge>
          )}
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
              {isRussian ? 'Ваш потенциальный доход' : 'Your potential earnings'}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-purple-500">
                {calculations.commissions.toLocaleString()}₽
              </div>
              <div className="text-xs text-muted-foreground">
                {isRussian ? 'Комиссии' : 'Commissions'}
              </div>
              <div className="text-xs text-purple-500 mt-1">
                {calculations.commissionPercent}% × {calculations.paid}
              </div>
            </div>

            <div className="text-center p-3 rounded-lg bg-background/50">
              <div className="text-xl font-bold text-amber-500">
                +{calculations.milestones.toLocaleString()}₽
              </div>
              <div className="text-xs text-muted-foreground">
                {isRussian ? 'Бонусы за вехи' : 'Milestone bonuses'}
              </div>
            </div>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-center">
            <div className="text-2xl font-bold text-green-500">
              {calculations.total.toLocaleString()}₽
            </div>
            <div className="text-xs text-muted-foreground">
              {isRussian ? 'Итого' : 'Total'}
            </div>
          </div>

          <div className="mt-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30 text-center">
            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground">
                {isRussian ? 'С коэффициентом 1:1.5' : 'With 1:1.5 conversion'}
              </span>
              <Badge className="bg-purple-500">
                {calculations.withConversion.toLocaleString()}₽
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {isRussian 
                ? 'При оплате подписки или подарочного кода'
                : 'When paying for subscription or gift code'}
            </div>
          </div>
        </motion.div>

        {/* Chart */}
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="commissionGradient2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="milestoneGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
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
                tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelFormatter={(value) => `${value} ${isRussian ? 'рефералов' : 'referrals'}`}
                formatter={(value: number) => [`${value.toLocaleString()}₽`]}
              />
              <Area
                type="monotone"
                dataKey="commissions"
                stroke="#8b5cf6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#commissionGradient2)"
                name={isRussian ? 'Комиссии' : 'Commissions'}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={0.2}
                fill="#10b981"
                name={isRussian ? 'Итого' : 'Total'}
              />
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
