import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Star, Percent, ShieldCheck, FileText, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { LoyaltyRulesDocument } from './LoyaltyRulesDocument';

interface LoyaltyProgramProps {
  isRegistered: boolean;
}

export function LoyaltyProgram({ isRegistered }: LoyaltyProgramProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const isRu = language === 'ru';
  const [showRules, setShowRules] = useState(false);

  // Cashback tiers
  const tiers = [
    { name: isRu ? 'Бронза' : 'Bronze', minSpend: 0, cashback: 3, color: 'text-amber-700' },
    { name: isRu ? 'Серебро' : 'Silver', minSpend: 5000, cashback: 5, color: 'text-gray-400' },
    { name: isRu ? 'Золото' : 'Gold', minSpend: 15000, cashback: 7, color: 'text-yellow-500' },
    { name: isRu ? 'Платина' : 'Platinum', minSpend: 50000, cashback: 10, color: 'text-cyan-400' },
  ];

  if (!isRegistered) {
    return (
      <div className="space-y-4">
        <Card className="border-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-500" />
              {isRu ? 'Программа лояльности' : 'Loyalty Program'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {isRu
                ? 'Кэшбек до 10% на все покупки в ТопФокус. Доступна для физических лиц без статуса "Самозанятый".'
                : 'Cashback up to 10% on all purchases in TopFocus. Available for individuals.'}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {tiers.map((tier, i) => (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="border border-border/50">
                    <CardContent className="pt-3 text-center">
                      <div className={`text-xl font-bold ${tier.color}`}>{tier.cashback}%</div>
                      <div className="text-xs font-medium">{tier.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {tier.minSpend > 0 ? `${isRu ? 'от' : 'from'} ${tier.minSpend.toLocaleString()}₽` : isRu ? 'Старт' : 'Start'}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Кэшбек начисляется бонусными баллами на внутренний счёт' : 'Cashback is credited as bonus points to your account'}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Уровень повышается автоматически при достижении порога накоплений' : 'Level upgrades automatically when spending threshold is reached'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowRules(true)}
              className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {isRu ? 'Правила Программы лояльности' : 'Loyalty Program Rules'}
            </button>
          </CardContent>
        </Card>

        <LoyaltyRulesDocument open={showRules} onOpenChange={setShowRules} />
      </div>
    );
  }

  // Registered loyalty user view
  return (
    <div className="space-y-4">
      <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-transparent">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-emerald-500" />
              <span className="font-semibold">{isRu ? 'Программа лояльности' : 'Loyalty Program'}</span>
            </div>
            <Badge className="bg-emerald-500 text-white">{isRu ? 'Бронза' : 'Bronze'}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xl font-bold text-emerald-500">3%</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'Кэшбек' : 'Cashback'}</div>
            </div>
            <div>
              <div className="text-xl font-bold">0</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'Баллы' : 'Points'}</div>
            </div>
            <div>
              <div className="text-xl font-bold text-muted-foreground">5 000₽</div>
              <div className="text-[10px] text-muted-foreground">{isRu ? 'До Серебра' : 'To Silver'}</div>
            </div>
          </div>
          <Progress value={0} className="h-1.5 mt-3" />
        </CardContent>
      </Card>

      <button
        onClick={() => setShowRules(true)}
        className="text-xs text-primary underline underline-offset-2"
      >
        {isRu ? 'Правила Программы лояльности' : 'Loyalty Program Rules'}
      </button>
      <LoyaltyRulesDocument open={showRules} onOpenChange={setShowRules} />
    </div>
  );
}
