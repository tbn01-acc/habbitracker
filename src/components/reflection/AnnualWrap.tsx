import { motion } from 'framer-motion';
import { Sparkles, Trophy, TrendingUp, Calendar, Brain } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';

const SKILLS = [
  { name_ru: 'Лидерство', name_en: 'Leadership', level: 4 },
  { name_ru: 'Делегирование', name_en: 'Delegation', level: 3 },
  { name_ru: 'React', name_en: 'React', level: 5 },
  { name_ru: 'Коммуникация', name_en: 'Communication', level: 4 },
  { name_ru: 'Управление стрессом', name_en: 'Stress management', level: 2 },
];

const TIMELINE = [
  { month_ru: 'Январь', month_en: 'January', event_ru: 'Запуск проекта Alpha', event_en: 'Alpha project launch', sp: 120 },
  { month_ru: 'Март', month_en: 'March', event_ru: 'Первый клиент', event_en: 'First customer', sp: 180 },
  { month_ru: 'Июнь', month_en: 'June', event_ru: 'Масштабирование команды', event_en: 'Team scaling', sp: 250 },
  { month_ru: 'Сентябрь', month_en: 'September', event_ru: 'Релиз v2.0', event_en: 'v2.0 release', sp: 310 },
  { month_ru: 'Декабрь', month_en: 'December', event_ru: 'Выполнение годовых OKR', event_en: 'Annual OKR achieved', sp: 290 },
];

const NARRATIVE_RU = 'Это был год прорыва в лидерстве. Вы успешно справились с 12 кризисными ситуациями и научились делегировать, что снизило ваш уровень стресса на 20% к декабрю. Главное достижение — переход от индивидуального вклада к управлению командой из 8 человек.';
const NARRATIVE_EN = 'This was a breakthrough year in leadership. You successfully handled 12 crisis situations and learned to delegate, reducing your stress level by 20% by December. Key achievement — transitioning from individual contributor to managing a team of 8.';

export function AnnualWrap() {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const maxSP = Math.max(...TIMELINE.map((t) => t.sp));

  return (
    <div className="space-y-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-3">
        <Sparkles className="h-8 w-8 mx-auto mb-2" style={{ color: '#F4B942' }} />
        <h2 className="text-lg font-bold text-foreground">
          {isRu ? 'Ваш год в цифрах' : 'Your Year in Numbers'}
        </h2>
        <p className="text-xs text-muted-foreground">{isRu ? 'Аналог Spotify Wrapped для продуктивности' : 'Like Spotify Wrapped for productivity'}</p>
      </motion.div>

      {/* Skill Tree */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          {isRu ? 'Карта роста навыков' : 'Skill Growth Map'}
        </h3>
        <div className="space-y-2.5">
          {SKILLS.map((s, i) => (
            <motion.div key={s.name_en} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
              <div className="flex justify-between text-xs mb-0.5">
                <span className="text-foreground">{isRu ? s.name_ru : s.name_en}</span>
                <span className="text-muted-foreground">Lv.{s.level}</span>
              </div>
              <Progress value={s.level * 20} className="h-2" />
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Timeline */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          {isRu ? 'Таймлайн триумфов' : 'Triumph Timeline'}
        </h3>
        <div className="space-y-3 relative">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
          {TIMELINE.map((t, i) => (
            <motion.div
              key={t.month_en}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12 }}
              className="flex gap-3 relative"
            >
              <div className="w-4 h-4 rounded-full border-2 border-amber-500 bg-background shrink-0 mt-0.5 z-10" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-foreground">{isRu ? t.month_ru : t.month_en}</span>
                  <Badge variant="outline" className="text-[9px]">{t.sp} SP</Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">{isRu ? t.event_ru : t.event_en}</p>
                <div className="h-1.5 rounded-full mt-1" style={{ width: `${(t.sp / maxSP) * 100}%`, backgroundColor: '#F4B942' }} />
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* AI Narrative */}
      <motion.div animate={{ scale: [1, 1.015, 1] }} transition={{ duration: 6, repeat: Infinity }}>
        <Card className="p-5 border-amber-500/20">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Brain className="h-4 w-4 text-amber-500" />
            {isRu ? 'ИИ-резюме года' : 'AI Year Summary'}
          </h3>
          <p className="text-xs text-foreground leading-relaxed italic">
            «{isRu ? NARRATIVE_RU : NARRATIVE_EN}»
          </p>
        </Card>
      </motion.div>

      {/* Key Numbers */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { n: '1,150', label_ru: 'Story Points', label_en: 'Story Points' },
          { n: '12', label_ru: 'Кризисов', label_en: 'Crises handled' },
          { n: '-20%', label_ru: 'Стресс к дек.', label_en: 'Stress by Dec' },
        ].map((s) => (
          <Card key={s.label_en} className="p-3 text-center">
            <div className="text-lg font-bold" style={{ color: '#F4B942' }}>{s.n}</div>
            <div className="text-[9px] text-muted-foreground">{isRu ? s.label_ru : s.label_en}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}
