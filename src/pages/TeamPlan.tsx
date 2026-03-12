import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users, Shield, TrendingUp, Zap, Crown, BarChart3,
  Clock, Cloud, ArrowLeft, Check, Star, Wallet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { useTranslation } from '@/contexts/LanguageContext';

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.4 },
});

export default function TeamPlan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const refCode = searchParams.get('ref');

  const benefits = isRussian
    ? [
        { icon: Users, title: 'Единая подписка на всю команду', desc: 'Один платёж — доступ для всех сотрудников. Без отдельных счетов и лишней бюрократии.' },
        { icon: BarChart3, title: 'Аналитика продуктивности', desc: 'Отслеживайте выполнение задач, привычек и целей всей команды в реальном времени.' },
        { icon: Shield, title: 'Контроль и безопасность', desc: 'Управляйте доступом участников. Данные каждого сотрудника защищены и изолированы.' },
        { icon: Cloud, title: 'Облачная синхронизация', desc: 'Все данные синхронизируются между устройствами мгновенно. Работайте откуда угодно.' },
        { icon: TrendingUp, title: 'Рост вовлечённости', desc: 'Геймификация, звёзды и рейтинги мотивируют сотрудников развиваться каждый день.' },
        { icon: Clock, title: 'Экономия времени руководителя', desc: 'Автоматические отчёты и дашборды. Минимум ручного контроля, максимум результата.' },
      ]
    : [
        { icon: Users, title: 'One subscription for the whole team', desc: 'Single payment — access for all employees. No separate invoices or extra paperwork.' },
        { icon: BarChart3, title: 'Productivity analytics', desc: 'Track task completion, habits and goals for the entire team in real-time.' },
        { icon: Shield, title: 'Control & security', desc: 'Manage member access. Each employee\'s data is protected and isolated.' },
        { icon: Cloud, title: 'Cloud sync', desc: 'All data syncs between devices instantly. Work from anywhere.' },
        { icon: TrendingUp, title: 'Engagement growth', desc: 'Gamification, stars and leaderboards motivate employees to grow every day.' },
        { icon: Clock, title: 'Save manager\'s time', desc: 'Automated reports and dashboards. Minimum manual oversight, maximum results.' },
      ];

  const pricing = [
    { size: 5, monthly: 199, label: isRussian ? '5 человек' : '5 people' },
    { size: 10, monthly: 179, label: isRussian ? '10 человек' : '10 people', popular: true },
    { size: 25, monthly: 149, label: isRussian ? '25 человек' : '25 people' },
    { size: 50, monthly: 129, label: isRussian ? '50 человек' : '50 people' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back */}
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="mb-4">
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Hero */}
        <motion.div {...fadeUp()} className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {isRussian ? 'ТопФокус для команд' : 'TopFocus for Teams'}
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            {isRussian
              ? 'Повышайте продуктивность всей команды с единой подпиской. Задачи, привычки, цели и аналитика — в одном месте.'
              : 'Boost your entire team\'s productivity with a single subscription. Tasks, habits, goals and analytics — all in one place.'}
          </p>
          {refCode && (
            <Badge className="mt-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
              {isRussian ? `Приглашение от партнёра` : `Partner invitation`}
            </Badge>
          )}
        </motion.div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
          {benefits.map((b, i) => (
            <motion.div key={i} {...fadeUp(0.1 + i * 0.05)}>
              <Card className="border border-border/50 backdrop-blur-xl bg-card/50 h-full">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <b.icon className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground mb-0.5">{b.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{b.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pricing */}
        <motion.div {...fadeUp(0.4)} className="mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4 text-center">
            {isRussian ? 'Тарифы для команд' : 'Team Pricing'}
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {pricing.map((p, i) => (
              <Card
                key={i}
                className={`border backdrop-blur-xl relative overflow-hidden ${
                  p.popular
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50 bg-card/50'
                }`}
              >
                {p.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-primary text-primary-foreground text-[9px] px-2">
                      {isRussian ? 'Популярный' : 'Popular'}
                    </Badge>
                  </div>
                )}
                <CardContent className="pt-5 text-center space-y-2">
                  <div className="text-xs text-muted-foreground">{p.label}</div>
                  <div className="flex items-baseline justify-center gap-0.5">
                    <span className="text-2xl font-bold text-foreground">{p.monthly}₽</span>
                    <span className="text-xs text-muted-foreground">
                      /{isRussian ? 'чел/мес' : 'user/mo'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(p.monthly * p.size).toLocaleString()}₽/{isRussian ? 'мес' : 'mo'}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        {/* Partner Advantage */}
        <motion.div {...fadeUp(0.5)} className="mb-8">
          <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-transparent backdrop-blur-xl">
            <CardContent className="pt-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-emerald-500 flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">
                    {isRussian ? 'Выгода для партнёра' : 'Partner Advantage'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {isRussian ? '1 участник команды = 1 активная единица' : '1 team member = 1 active unit'}
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <span>{isRussian
                    ? 'Команда из 10 человек = 10 активных единиц мгновенно'
                    : 'Team of 10 people = 10 active units instantly'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <span>{isRussian
                    ? 'Закрытая веха и денежный бонус 250–500₽'
                    : 'Reached milestone and cash bonus 250–500₽'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  <span>{isRussian
                    ? 'Комиссия до 25% с каждого платежа команды'
                    : 'Up to 25% commission from every team payment'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA */}
        <motion.div {...fadeUp(0.6)} className="space-y-3">
          <Button
            size="lg"
            className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 hover:from-blue-600 hover:to-emerald-600 text-white text-base h-12"
            onClick={() => navigate(`/upgrade${refCode ? `?ref=${refCode}` : ''}`)}
          >
            <Crown className="w-5 h-5 mr-2" />
            {isRussian ? 'Оформить командный тариф' : 'Get Team Plan'}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">
            {isRussian
              ? 'Есть вопросы? Напишите нам в Telegram @topfocus_support'
              : 'Have questions? Contact us at Telegram @topfocus_support'}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
