import { useState } from 'react';
import { APP_URL } from '@/lib/constants';
import { motion } from 'framer-motion';
import { 
  Crown, Radar, Smartphone, Users, Zap, Copy, Check,
  Rocket, Lightbulb, Trophy, Target, ArrowRight
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5 }
  })
};

export function GrowthStrategy() {
  const { language } = useTranslation();
  const { profile } = useAuth();
  const isRu = language === 'ru';
  const [copied, setCopied] = useState(false);

  const referralLink = profile?.referral_code
    ? `${APP_URL}/auth?ref=${profile.referral_code}`
    : '';

  const handleCopy = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success(isRu ? '🎉 Ссылка скопирована!' : '🎉 Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(isRu ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  const steps = [
    {
      icon: Crown,
      color: 'text-purple-400',
      bg: 'bg-purple-500/20',
      border: 'border-purple-500/30',
      title: isRu ? 'Статус Premium — это база' : 'Premium Status is the base',
      text: isRu
        ? 'Даёт ставку 25%. Нужно всего 4 активных реферала на таком же тарифе, чтобы сервис стал бесплатным.'
        : 'Gives you a 25% rate. You only need 4 active referrals on the same plan to make the service free.'
    },
    {
      icon: Radar,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/20',
      border: 'border-emerald-500/30',
      title: isRu ? 'Следите за активностью' : 'Monitor activity',
      text: isRu
        ? 'Доход идёт только от активных подписок. Если подписка друга истекла, он временно выбывает из вех.'
        : 'Income comes only from active subscriptions. If a friend\'s subscription expires, they temporarily drop out of milestones.'
    },
    {
      icon: Smartphone,
      color: 'text-blue-400',
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/30',
      title: isRu ? 'Личный пример' : 'Lead by example',
      text: isRu
        ? 'Искренность важнее спама. Поделитесь своим экраном с настроенными фокусами — это привлекает активных людей.'
        : 'Authenticity beats spam. Share your screen with configured focuses — this attracts active users.'
    }
  ];

  return (
    <div className="space-y-5">
      {/* Page Title */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
        <h2 className="text-lg font-bold text-foreground mb-1">
          {isRu
            ? '🎯 Стратегия быстрого роста'
            : '🎯 Rapid Growth Strategy'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isRu
            ? 'Как гарантированно окупить ТопФокус'
            : 'How to guarantee your TopFocus pays for itself'}
        </p>
      </motion.div>

      {/* Main Secret Card */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={1}>
        <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl" />
          <CardContent className="pt-5 pb-5 relative">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] mb-2">
                  {isRu ? 'ГЛАВНЫЙ СЕКРЕТ' : 'KEY SECRET'}
                </Badge>
                <p className="text-sm text-foreground leading-relaxed font-medium">
                  {isRu
                    ? 'Секрет стабильного дохода — работа с активными рефералами (теми, у кого оплачена подписка в данный момент).'
                    : 'The secret to stable income — work with active referrals (those with a currently paid subscription).'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Team Rush Section */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={2}>
        <Card className="border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-transparent to-amber-500/5 backdrop-blur-xl overflow-hidden relative">
          <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-emerald-500/10 rounded-full blur-3xl" />
          <CardContent className="pt-5 pb-5 relative space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-sm font-bold text-foreground">
                💡 {isRu ? 'Командный рывок' : 'Team Rush'}
              </h3>
              <Badge variant="outline" className="text-[10px] border-emerald-500/40 text-emerald-400">
                {isRu ? 'ЧИТ-КОД' : 'CHEAT CODE'}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isRu
                ? 'Рекомендовать тариф Команда — кратчайший путь к закрытию Вех.'
                : 'Recommending the Team plan is the shortest path to closing milestones.'}
            </p>

            {/* Infographic */}
            <div className="bg-card/60 border border-border/50 rounded-lg p-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-foreground font-medium">
                    1 {isRu ? 'Руководитель' : 'Manager'}
                  </span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Users className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-foreground font-medium">
                    10 {isRu ? 'сотрудников' : 'members'}
                  </span>
                </div>
                <span className="text-emerald-400 font-bold">=</span>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  +10 {isRu ? 'единиц' : 'units'}
                </Badge>
              </div>
            </div>

            {/* Result */}
            <div className="bg-gradient-to-r from-emerald-500/15 to-amber-500/15 border border-emerald-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-xs text-foreground font-semibold">
                  {isRu
                    ? 'Мгновенное закрытие первой Вехи и бонус до 500 ₽ за одну рекомендацию!'
                    : 'Instant first milestone completion and up to 500 ₽ bonus from a single recommendation!'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* 3 Steps Section */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
        <h3 className="text-sm font-bold text-foreground mb-3">
          🚀 {isRu ? 'Три шага к бесплатному сервису' : 'Three steps to a free service'}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              custom={4 + i}
            >
              <Card className={`border ${step.border} bg-card/50 backdrop-blur-xl h-full`}>
                <CardContent className="pt-4 pb-4 space-y-2.5">
                  <div className={`w-10 h-10 rounded-xl ${step.bg} flex items-center justify-center`}>
                    <step.icon className={`w-5 h-5 ${step.color}`} />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Sticky Copy Button */}
      {referralLink && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={7}>
          <Button
            onClick={handleCopy}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {copied ? (
              <><Check className="w-4 h-4 mr-2" /> {isRu ? 'Скопировано!' : 'Copied!'}</>
            ) : (
              <><Copy className="w-4 h-4 mr-2" /> {isRu ? 'Скопировать партнёрскую ссылку' : 'Copy referral link'}</>
            )}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
