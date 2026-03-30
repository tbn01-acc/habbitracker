import { useState } from 'react';
import { motion } from 'framer-motion';
import { Battery, BatteryLow, BatteryMedium, BatteryFull, Zap, Sun, Moon, AlertTriangle, Trophy, Ban } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/contexts/LanguageContext';

const ENERGY_ICONS = [BatteryLow, BatteryMedium, Battery, BatteryFull, Zap];
const ENERGY_COLORS = ['hsl(0,72%,51%)', 'hsl(25,95%,53%)', 'hsl(48,96%,53%)', 'hsl(142,71%,45%)', 'hsl(44,93%,54%)'];

const BLOCKERS_RU = ['Технические проблемы', 'Неясные ТЗ', 'Отвлечения', 'Коллеги', 'Личное'];
const BLOCKERS_EN = ['Tech issues', 'Unclear specs', 'Distractions', 'Colleagues', 'Personal'];

const breathe = {
  animate: {
    scale: [1, 1.02, 1],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

export function DailyReflection() {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [mode, setMode] = useState<'morning' | 'evening'>('morning');

  // Morning
  const [energy, setEnergy] = useState([3]);
  const [intention, setIntention] = useState('');
  const [sleepQuality, setSleepQuality] = useState([3]);

  // Evening
  const [stress, setStress] = useState([2]);
  const [winText, setWinText] = useState('');
  const [selectedBlockers, setSelectedBlockers] = useState<string[]>([]);

  const energyLevel = energy[0];
  const EnergyIcon = ENERGY_ICONS[Math.min(energyLevel - 1, 4)];

  const toggleBlocker = (b: string) =>
    setSelectedBlockers((prev) => (prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]));

  const blockers = isRu ? BLOCKERS_RU : BLOCKERS_EN;

  return (
    <div className="space-y-4">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === 'morning' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('morning')}
          className="gap-1.5"
          style={mode === 'morning' ? { backgroundColor: '#F4B942', color: '#1a1a1a' } : {}}
        >
          <Sun className="h-4 w-4" />
          {isRu ? 'Утренний Check-in' : 'Morning Check-in'}
        </Button>
        <Button
          variant={mode === 'evening' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setMode('evening')}
          className="gap-1.5"
          style={mode === 'evening' ? { backgroundColor: 'hsl(var(--primary))', color: 'white' } : {}}
        >
          <Moon className="h-4 w-4" />
          {isRu ? 'Вечерний Check-out' : 'Evening Check-out'}
        </Button>
      </div>

      {mode === 'morning' ? (
        <>
          {/* Energy Score */}
          <motion.div {...breathe}>
            <Card className="p-5 border-amber-500/20">
              <div className="flex items-center gap-2 mb-3">
                <EnergyIcon className="h-5 w-5" style={{ color: ENERGY_COLORS[energyLevel - 1] }} />
                <span className="font-semibold text-sm text-foreground">
                  {isRu ? 'Уровень энергии' : 'Energy Level'}
                </span>
                <Badge variant="outline" className="ml-auto text-xs" style={{ borderColor: ENERGY_COLORS[energyLevel - 1], color: ENERGY_COLORS[energyLevel - 1] }}>
                  {energyLevel}/5
                </Badge>
              </div>
              <Slider value={energy} onValueChange={setEnergy} min={1} max={5} step={1} className="mb-2" />
              <p className="text-[11px] text-muted-foreground">
                {isRu
                  ? energyLevel <= 2
                    ? '⚠️ ИИ предложит перенести сложные задачи'
                    : energyLevel >= 4
                      ? '⚡ Отличный ресурс для Deep Work!'
                      : 'Средний уровень — обычный рабочий день'
                  : energyLevel <= 2
                    ? '⚠️ AI will suggest rescheduling complex tasks'
                    : energyLevel >= 4
                      ? '⚡ Great resource for Deep Work!'
                      : 'Average level — normal workday'}
              </p>
            </Card>
          </motion.div>

          {/* Main Intention */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-sm text-foreground">
                {isRu ? 'Главное намерение дня' : 'Main Intention'}
              </span>
            </div>
            <Textarea
              placeholder={isRu ? 'Одна ключевая задача на сегодня...' : 'One key task for today...'}
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              className="min-h-[60px] text-sm"
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              {isRu
                ? '🔕 Уведомления по остальным задачам будут приглушены до прогресса'
                : '🔕 Other task notifications muted until progress confirmed'}
            </p>
          </Card>

          {/* Sleep Quality */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="h-4 w-4 text-indigo-400" />
              <span className="font-semibold text-sm text-foreground">
                {isRu ? 'Качество сна' : 'Sleep Quality'}
              </span>
              <Badge variant="outline" className="ml-auto text-xs">
                {sleepQuality[0]}/5
              </Badge>
            </div>
            <Slider value={sleepQuality} onValueChange={setSleepQuality} min={1} max={5} step={1} />
            <p className="text-[11px] text-muted-foreground mt-2">
              {isRu ? 'Или подключите Apple Health / Google Fit' : 'Or connect Apple Health / Google Fit'}
            </p>
          </Card>

          <Button className="w-full" style={{ backgroundColor: '#F4B942', color: '#1a1a1a' }}>
            {isRu ? '☀️ Начать день осознанно' : '☀️ Start day mindfully'}
          </Button>
        </>
      ) : (
        <>
          {/* Stress Detector */}
          <motion.div {...breathe}>
            <Card className="p-5 border-red-500/20">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4" style={{ color: stress[0] >= 4 ? 'hsl(0,72%,51%)' : 'hsl(var(--muted-foreground))' }} />
                <span className="font-semibold text-sm text-foreground">
                  {isRu ? 'Детектор стресса' : 'Stress Detector'}
                </span>
                <Badge variant="outline" className="ml-auto text-xs" style={{ borderColor: stress[0] >= 4 ? 'hsl(0,72%,51%)' : undefined, color: stress[0] >= 4 ? 'hsl(0,72%,51%)' : undefined }}>
                  {stress[0]}/5
                </Badge>
              </div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{isRu ? 'Спокоен' : 'Calm'}</span>
                <span>{isRu ? 'На пределе' : 'Overwhelmed'}</span>
              </div>
              <Slider value={stress} onValueChange={setStress} min={1} max={5} step={1} />
              {stress[0] >= 4 && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-destructive mt-2 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {isRu
                    ? 'ИИ предлагает «Разгрузочный завтра» — перенос части задач'
                    : 'AI suggests "Relief Day" — reschedule some tasks'}
                </motion.p>
              )}
            </Card>
          </motion.div>

          {/* Win of the Day */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4 text-amber-500" />
              <span className="font-semibold text-sm text-foreground">
                {isRu ? 'Победа дня' : 'Win of the Day'}
              </span>
            </div>
            <Textarea
              placeholder={isRu ? 'Что удалось сегодня? Выберите из задач или напишите...' : 'What went well today?'}
              value={winText}
              onChange={(e) => setWinText(e.target.value)}
              className="min-h-[60px] text-sm"
            />
          </Card>

          {/* Blockers */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Ban className="h-4 w-4 text-muted-foreground" />
              <span className="font-semibold text-sm text-foreground">
                {isRu ? 'Блокеры' : 'Blockers'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {blockers.map((b) => (
                <Badge
                  key={b}
                  variant={selectedBlockers.includes(b) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs transition-all"
                  onClick={() => toggleBlocker(b)}
                >
                  {b}
                </Badge>
              ))}
            </div>
          </Card>

          <Button className="w-full bg-primary text-primary-foreground">
            {isRu ? '🌙 Завершить день' : '🌙 End the day'}
          </Button>
        </>
      )}
    </div>
  );
}
