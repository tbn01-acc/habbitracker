import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, HelpCircle, Users, Target, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger
} from '@/components/ui/accordion';
import { useTranslation } from '@/contexts/LanguageContext';

interface FAQItem {
  id: string;
  icon: React.ReactNode;
  question: string;
  answer: string;
  tag?: string;
  tagColor?: string;
}

export function PartnerFAQ() {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [search, setSearch] = useState('');

  const faqItems: FAQItem[] = [
    {
      id: 'active-referral',
      icon: <Users className="w-4 h-4 text-emerald-400" />,
      question: isRu
        ? 'Кто считается «Активным рефералом»?'
        : 'Who counts as an "Active Referral"?',
      answer: isRu
        ? 'Это пользователь с любой оплаченной подпиской. Если срок действия истёк — он временно исключается из расчётов вех и процентов до момента продления.'
        : 'A user with any paid subscription. If the subscription expires, they are temporarily excluded from milestone calculations and commission rates until they renew.',
      tag: isRu ? 'Базовое' : 'Basics',
      tagColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'team-plan',
      icon: <Users className="w-4 h-4 text-amber-400" />,
      question: isRu
        ? 'Как учитывается тариф «Команда» в моей статистике?'
        : 'How does the "Team" plan count in my statistics?',
      answer: isRu
        ? 'Каждый участник команды = 1 активный реферал. Команда из 10 человек = 10 рефералов в счётчик Вех. Это самый быстрый способ роста.'
        : 'Each team member = 1 active referral. A team of 10 = 10 referrals towards your milestones. This is the fastest way to grow.',
      tag: isRu ? 'Команда' : 'Team',
      tagColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'payback',
      icon: <Target className="w-4 h-4 text-purple-400" />,
      question: isRu
        ? 'Через сколько друзей я окуплю свою подписку?'
        : 'How many friends do I need to break even?',
      answer: isRu
        ? 'На статусе Премиум — через 4 активных друга на таком же тарифе. Продажа одной годовой подписки «Команда» на 5+ человек окупает ваш год использования мгновенно.'
        : 'With Premium status — 4 active friends on the same plan. Selling one annual "Team" subscription for 5+ members covers your annual cost instantly.',
      tag: isRu ? 'Окупаемость' : 'ROI',
      tagColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    },
    {
      id: 'units-drop',
      icon: <TrendingDown className="w-4 h-4 text-red-400" />,
      question: isRu
        ? 'Что будет, если число моих активных рефералов упадёт?'
        : 'What happens if my active referral count drops?',
      answer: isRu
        ? 'Вехи привязаны к текущему числу активных людей. Если их стало меньше 10, следующая веха станет доступна только после возврата к росту. Полученные ранее бонусы не забираются.'
        : 'Milestones are tied to the current number of active people. If it drops below 10, the next milestone becomes available only after regaining growth. Previously earned bonuses are never taken away.',
      tag: isRu ? 'Важно' : 'Important',
      tagColor: 'bg-red-500/20 text-red-400 border-red-500/30'
    },
    {
      id: 'level-2',
      icon: <ArrowUpRight className="w-4 h-4 text-blue-400" />,
      question: isRu
        ? 'Как перейти на Уровень 2 с повышенными ставками?'
        : 'How do I advance to Level 2 with higher rates?',
      answer: isRu
        ? 'Наберите 51 активного реферала. С учётом команд (где участники суммируются), это всего 5–6 небольших компаний. На Уровне 2 ставка L1 для Премиум вырастает до 30%. Подробные условия начисления и выплат зафиксированы в Правилах Партнерской программы (доступны по ссылке в футере страницы).'
        : 'Reach 51 active referrals. With teams (where members add up), that\'s just 5–6 small companies. At Level 2, the L1 rate for Premium goes up to 30%. Detailed commission and payout terms are documented in the Affiliate Program Rules (see link in page footer).',
      tag: isRu ? 'Уровень 2' : 'Level 2',
      tagColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'payouts',
      icon: <ArrowUpRight className="w-4 h-4 text-green-400" />,
      question: isRu
        ? 'Как работает механизм выплат?'
        : 'How does the payout mechanism work?',
      answer: isRu
        ? 'Выплата осуществляется по запросу при достижении порога в 1 000 ₽. Период холда — 14 дней (защита от фрода). Для ЮЛ/ИП доступна генерация счетов и актов. Подробные условия начисления и выплат зафиксированы в Правилах ПП.'
        : 'Payouts are processed upon request when the balance reaches 1,000 ₽. Hold period is 14 days (fraud protection). Invoice/act generation is available for legal entities. Full terms are in the Affiliate Program Rules.',
      tag: isRu ? 'Выплаты' : 'Payouts',
      tagColor: 'bg-green-500/20 text-green-400 border-green-500/30'
    }
  ];

  const filtered = search.trim()
    ? faqItems.filter(
        item =>
          item.question.toLowerCase().includes(search.toLowerCase()) ||
          item.answer.toLowerCase().includes(search.toLowerCase())
      )
    : faqItems;

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-bold text-foreground mb-1">
          {isRu ? '❓ FAQ для партнёров' : '❓ Partner FAQ'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Ответы на частые вопросы об активных единицах и вехах' : 'Answers about active units and milestones'}
        </p>
      </motion.div>

      {/* Search */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск по вопросам...' : 'Search questions...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 bg-card/50 border-border/50 backdrop-blur-xl"
          />
        </div>
      </motion.div>

      {/* Accordion */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {filtered.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-xl">
            <CardContent className="pt-6 pb-6 text-center">
              <HelpCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Ничего не найдено' : 'Nothing found'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Accordion type="single" collapsible className="space-y-2">
            {filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                <AccordionItem
                  value={item.id}
                  className="border border-border/50 bg-card/50 backdrop-blur-xl rounded-lg px-4 overflow-hidden"
                >
                  <AccordionTrigger className="hover:no-underline text-left gap-3 py-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="shrink-0">{item.icon}</div>
                      <span className="text-sm font-medium text-foreground">{item.question}</span>
                    </div>
                    {item.tag && (
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${item.tagColor}`}>
                        {item.tag}
                      </Badge>
                    )}
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-sm text-muted-foreground leading-relaxed pl-6.5 pb-1">
                      {item.answer}
                    </p>
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        )}
      </motion.div>
    </div>
  );
}
