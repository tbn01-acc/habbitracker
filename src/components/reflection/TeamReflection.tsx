import { motion } from 'framer-motion';
import { Shield, AlertTriangle, MessageCircle, ThumbsUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTranslation } from '@/contexts/LanguageContext';

const ENPS_SCORE = 42;
const TEAM_SIZE = 8;
const BURNOUT_PCT = 25; // %

const OBSTACLE_CLOUD = [
  { word_ru: 'Митинги', word_en: 'Meetings', weight: 5 },
  { word_ru: 'Дедлайны', word_en: 'Deadlines', weight: 3 },
  { word_ru: 'Техдолг', word_en: 'Tech debt', weight: 4 },
  { word_ru: 'Документация', word_en: 'Docs', weight: 2 },
  { word_ru: 'Коммуникация', word_en: 'Communication', weight: 3 },
  { word_ru: 'Инструменты', word_en: 'Tooling', weight: 2 },
  { word_ru: 'Согласования', word_en: 'Approvals', weight: 4 },
  { word_ru: 'Микроменеджмент', word_en: 'Micromanagement', weight: 1 },
];

const PULSE_METRICS = [
  { label_ru: 'Энергия', label_en: 'Energy', value: 3.4, max: 5 },
  { label_ru: 'Стресс', label_en: 'Stress', value: 2.8, max: 5 },
  { label_ru: 'Автономность', label_en: 'Autonomy', value: 4.1, max: 5 },
  { label_ru: 'Ясность целей', label_en: 'Goal clarity', value: 3.9, max: 5 },
];

export function TeamReflection() {
  const { language } = useTranslation();
  const isRu = language === 'ru';

  return (
    <div className="space-y-4">
      <p className="text-[11px] text-muted-foreground px-1">
        {isRu
          ? `Данные агрегированы анонимно (мин. 3 человека). Команда: ${TEAM_SIZE} чел.`
          : `Data aggregated anonymously (min 3 people). Team: ${TEAM_SIZE} members`}
      </p>

      {/* eNPS */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
          <ThumbsUp className="h-4 w-4 text-amber-500" />
          {isRu ? 'Индекс eNPS' : 'eNPS Index'}
        </h3>
        <div className="flex items-baseline gap-2 mb-2">
          <span className="text-3xl font-bold" style={{ color: ENPS_SCORE >= 30 ? '#F4B942' : 'hsl(var(--destructive))' }}>
            {ENPS_SCORE}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
        <Progress value={ENPS_SCORE} className="h-2 mb-1" />
        <p className="text-[10px] text-muted-foreground">
          {isRu ? '«Порекомендуете ли работу в команде другу?» 0-10' : '"Would you recommend working here to a friend?" 0-10'}
        </p>
      </Card>

      {/* Team Pulse */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          {isRu ? 'Командный пульс' : 'Team Pulse'}
        </h3>
        <div className="space-y-3">
          {PULSE_METRICS.map((m) => (
            <div key={m.label_en} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-foreground">{isRu ? m.label_ru : m.label_en}</span>
                <span className="font-mono text-muted-foreground">{m.value}/{m.max}</span>
              </div>
              <Progress value={(m.value / m.max) * 100} className="h-1.5" />
            </div>
          ))}
        </div>
      </Card>

      {/* Obstacle Cloud */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
          {isRu ? 'Облако препятствий' : 'Obstacle Cloud'}
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {OBSTACLE_CLOUD.sort((a, b) => b.weight - a.weight).map((o) => (
            <motion.span
              key={o.word_en}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-foreground font-medium"
              style={{ fontSize: `${10 + o.weight * 3}px`, opacity: 0.5 + o.weight * 0.1 }}
            >
              {isRu ? o.word_ru : o.word_en}
            </motion.span>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2">
          {isRu ? 'Размер = частота упоминания в блокерах' : 'Size = mention frequency in blockers'}
        </p>
      </Card>

      {/* Burnout Alert */}
      {BURNOUT_PCT >= 30 ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-4 border-destructive/30 bg-destructive/5">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">
                  {isRu ? 'Риск коллективного выгорания' : 'Collective burnout risk'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isRu
                    ? `${BURNOUT_PCT}% команды в зоне «Низкая энергия + Высокий стресс». Рекомендуется ретроспектива процессов.`
                    : `${BURNOUT_PCT}% of team in "Low energy + High stress" zone. Process retrospective recommended.`}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      ) : (
        <Card className="p-4 border-amber-500/20">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-foreground">
              {isRu
                ? `${BURNOUT_PCT}% в зоне риска — в пределах нормы`
                : `${BURNOUT_PCT}% at risk — within normal range`}
            </span>
          </div>
        </Card>
      )}
    </div>
  );
}
