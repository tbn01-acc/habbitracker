import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Heart, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/contexts/LanguageContext';

const RADAR_AXES_RU = ['Работа', 'Сон', 'Здоровье', 'Хобби', 'Отношения', 'Обучение', 'Финансы', 'Духовность'];
const RADAR_AXES_EN = ['Work', 'Sleep', 'Health', 'Hobby', 'Relations', 'Learning', 'Finance', 'Spirit'];
const DEMO_VALUES = [78, 55, 62, 40, 70, 50, 65, 35];
const IDEAL_VALUES = [70, 80, 75, 60, 75, 65, 70, 60];

const VELOCITY_DATA = [
  { day: 'Пн', sp: 5, energy: 4 },
  { day: 'Вт', sp: 8, energy: 3 },
  { day: 'Ср', sp: 3, energy: 2 },
  { day: 'Чт', sp: 7, energy: 4 },
  { day: 'Пт', sp: 6, energy: 3 },
];

function MiniRadar({ axes, values, ideal }: { axes: string[]; values: number[]; ideal: number[] }) {
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 75;

  const getPoint = (i: number, val: number) => {
    const angle = (Math.PI * 2 * i) / axes.length - Math.PI / 2;
    const dist = (val / 100) * r;
    return { x: cx + dist * Math.cos(angle), y: cy + dist * Math.sin(angle) };
  };

  const polygon = (vals: number[]) => vals.map((v, i) => getPoint(i, v)).map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[220px] mx-auto">
      {[25, 50, 75, 100].map((v) => (
        <polygon key={v} points={axes.map((_, i) => getPoint(i, v)).map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" />
      ))}
      {axes.map((_, i) => {
        const p = getPoint(i, 100);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth="0.5" />;
      })}
      <polygon points={polygon(ideal)} fill="hsl(var(--primary) / 0.1)" stroke="hsl(var(--primary))" strokeWidth="1" strokeDasharray="4 2" />
      <polygon points={polygon(values)} fill="hsla(44, 93%, 54%, 0.2)" stroke="#F4B942" strokeWidth="1.5" />
      {axes.map((label, i) => {
        const p = getPoint(i, 115);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" className="fill-muted-foreground" fontSize="7">
            {label}
          </text>
        );
      })}
    </svg>
  );
}

export function WeeklyReflection() {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const axes = isRu ? RADAR_AXES_RU : RADAR_AXES_EN;

  const avgEnergy = (VELOCITY_DATA.reduce((a, d) => a + d.energy, 0) / VELOCITY_DATA.length).toFixed(1);
  const totalSP = VELOCITY_DATA.reduce((a, d) => a + d.sp, 0);

  return (
    <div className="space-y-4">
      {/* Velocity vs Energy */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-500" />
          {isRu ? 'Velocity vs. Энергия' : 'Velocity vs. Energy'}
        </h3>
        <div className="flex gap-6 mb-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{totalSP}</div>
            <div className="text-[10px] text-muted-foreground">SP</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{avgEnergy}</div>
            <div className="text-[10px] text-muted-foreground">{isRu ? 'Ср. энергия' : 'Avg energy'}</div>
          </div>
        </div>
        <div className="space-y-1.5">
          {VELOCITY_DATA.map((d) => (
            <div key={d.day} className="flex items-center gap-2 text-xs">
              <span className="w-6 text-muted-foreground">{d.day}</span>
              <div className="flex-1 flex gap-1">
                <div className="h-3 rounded-full" style={{ width: `${(d.sp / 10) * 100}%`, backgroundColor: '#F4B942' }} />
                <div className="h-3 rounded-full bg-primary/30" style={{ width: `${(d.energy / 5) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        {Number(avgEnergy) <= 2.5 && totalSP >= 25 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-2 rounded-lg bg-destructive/10 text-[11px] text-destructive flex items-center gap-1.5">
            <TrendingDown className="h-3.5 w-3.5" />
            {isRu ? '⚠️ Аномалия: высокая продуктивность при низком сне — риск выгорания' : '⚠️ Anomaly: high velocity at low energy — burnout risk'}
          </motion.div>
        )}
      </Card>

      {/* Balance Radar */}
      <motion.div animate={{ scale: [1, 1.01, 1] }} transition={{ duration: 5, repeat: Infinity }}>
        <Card className="p-5">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Heart className="h-4 w-4 text-pink-500" />
            {isRu ? 'Радар баланса' : 'Balance Radar'}
          </h3>
          <p className="text-[10px] text-muted-foreground mb-2">
            {isRu ? 'Янтарный — вы, Пунктир — идеал по целям' : 'Amber — you, Dashed — ideal from goals'}
          </p>
          <MiniRadar axes={axes} values={DEMO_VALUES} ideal={IDEAL_VALUES} />
        </Card>
      </motion.div>

      {/* Kudos */}
      <Card className="p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
          <Award className="h-4 w-4" style={{ color: '#F4B942' }} />
          {isRu ? 'Благодарность (Kudos)' : 'Kudos'}
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          {isRu ? 'Отправьте «Янтарный Кристалл» коллеге' : 'Send an "Amber Crystal" to a colleague'}
        </p>
        <Textarea placeholder={isRu ? 'За что вы благодарны коллеге?' : 'What are you grateful for?'} className="min-h-[50px] text-sm mb-2" />
        <Button size="sm" style={{ backgroundColor: '#F4B942', color: '#1a1a1a' }}>
          {isRu ? '💎 Отправить Кристалл' : '💎 Send Crystal'}
        </Button>
      </Card>
    </div>
  );
}
