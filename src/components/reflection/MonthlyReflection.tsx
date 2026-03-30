import { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Lightbulb, Archive, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';

const PARETO_TASKS = [
  { name_ru: 'Запуск MVP', name_en: 'MVP Launch', impact: 42 },
  { name_ru: 'Код-ревью команды', name_en: 'Team code review', impact: 28 },
  { name_ru: 'Автоматизация CI/CD', name_en: 'CI/CD automation', impact: 18 },
];

const PIVOT_GOALS = [
  { name_ru: 'Выучить Rust', name_en: 'Learn Rust', daysSpent: 14, progressPercent: 8 },
  { name_ru: 'Написать книгу', name_en: 'Write a book', daysSpent: 30, progressPercent: 5 },
];

const INSIGHTS_RU = [
  'Вы лучше всего работали в тишине по утрам (8-11). Забронируйте слоты Focus Time.',
  'Среда — ваш самый продуктивный день. Планируйте Deep Work на среду.',
  'Уровень стресса падает после 15-минутной прогулки в обед.',
];
const INSIGHTS_EN = [
  'You work best in quiet mornings (8-11). Book Focus Time slots.',
  'Wednesday is your most productive day. Plan Deep Work on Wed.',
  'Stress levels drop after a 15-min lunchtime walk.',
];

export function MonthlyReflection() {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [pivotAnswers, setPivotAnswers] = useState<Record<string, boolean>>({});
  const insights = isRu ? INSIGHTS_RU : INSIGHTS_EN;

  return (
    <div className="space-y-4">
      {/* Pareto Analysis */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <PieChart className="h-4 w-4 text-amber-500" />
          {isRu ? 'Анализ Парето — 20% задач → 80% результата' : 'Pareto — 20% tasks → 80% impact'}
        </h3>
        <div className="space-y-3">
          {PARETO_TASKS.map((t) => (
            <div key={t.name_en} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground">{isRu ? t.name_ru : t.name_en}</span>
                <span className="font-mono text-amber-500">{t.impact}%</span>
              </div>
              <Progress value={t.impact} className="h-2" />
            </div>
          ))}
        </div>
      </Card>

      {/* Pivot Session */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-1 flex items-center gap-2">
          <Archive className="h-4 w-4 text-muted-foreground" />
          {isRu ? 'Pivot-сессия' : 'Pivot Session'}
        </h3>
        <p className="text-[11px] text-muted-foreground mb-3">
          {isRu
            ? '«Если бы вы начинали сегодня, стали бы тратить время?»'
            : '"If you started today, would you still spend time on this?"'}
        </p>
        <div className="space-y-3">
          {PIVOT_GOALS.map((g) => {
            const answered = pivotAnswers[g.name_en] !== undefined;
            const keep = pivotAnswers[g.name_en];
            return (
              <motion.div key={g.name_en} layout className="p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{isRu ? g.name_ru : g.name_en}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {g.progressPercent}% / {g.daysSpent}d
                  </Badge>
                </div>
                {!answered ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs flex-1" onClick={() => setPivotAnswers((p) => ({ ...p, [g.name_en]: true }))}>
                      {isRu ? '✅ Да, продолжу' : '✅ Yes, continue'}
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs flex-1 text-destructive" onClick={() => setPivotAnswers((p) => ({ ...p, [g.name_en]: false }))}>
                      {isRu ? '🗄 Архивировать' : '🗄 Archive'}
                    </Button>
                  </div>
                ) : (
                  <Badge variant={keep ? 'default' : 'secondary'} className="text-xs">
                    {keep ? (isRu ? 'Оставлено' : 'Kept') : (isRu ? 'Архивировано без вины ✨' : 'Archived guilt-free ✨')}
                  </Badge>
                )}
              </motion.div>
            );
          })}
        </div>
      </Card>

      {/* AI Insights */}
      <motion.div animate={{ scale: [1, 1.01, 1] }} transition={{ duration: 5, repeat: Infinity }}>
        <Card className="p-5 border-amber-500/20">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Brain className="h-4 w-4 text-amber-500" />
            {isRu ? 'ИИ-инсайты месяца' : 'AI Monthly Insights'}
          </h3>
          <div className="space-y-2">
            {insights.map((ins, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.15 }}
                className="flex gap-2 text-xs"
              >
                <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                <span className="text-foreground">{ins}</span>
              </motion.div>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            {isRu ? 'Совет сгенерирован на основе ваших данных за 30 дней' : 'Advice generated from your 30-day data'}
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
