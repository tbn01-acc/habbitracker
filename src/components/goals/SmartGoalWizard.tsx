import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronRight, ChevronLeft, Sparkles, Target, Users,
  User, Calendar as CalendarIcon, Clock, DollarSign, Brain,
  AlertTriangle, Zap, CheckCircle2, ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { SPHERES, getSphereName, Sphere } from '@/types/sphere';
import { GOAL_COLORS } from '@/types/goal';
import { useTranslation } from '@/contexts/LanguageContext';
import { format, differenceInDays, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const TOTAL_STEPS = 7;

const SPHERE_CARDS = [
  { sphereId: 1, label: 'Здоровье', labelEn: 'Health', icon: '💪', key: 'body' },
  { sphereId: 5, label: 'Карьера', labelEn: 'Career', icon: '💼', key: 'work' },
  { sphereId: 6, label: 'Финансы', labelEn: 'Finance', icon: '💰', key: 'money' },
  { sphereId: 2, label: 'Образование', labelEn: 'Education', icon: '🧠', key: 'mind' },
  { sphereId: 7, label: 'Семья', labelEn: 'Family', icon: '👨‍👩‍👧', key: 'family' },
  { sphereId: 4, label: 'Отдых', labelEn: 'Rest', icon: '😴', key: 'rest' },
  { sphereId: 3, label: 'Дух', labelEn: 'Spirit', icon: '🧘', key: 'spirit' },
  { sphereId: 8, label: 'Связи', labelEn: 'Social', icon: '🤝', key: 'social' },
];

const RESOURCE_TAGS = [
  { id: 'time', label: 'Время', labelEn: 'Time', icon: Clock },
  { id: 'money', label: 'Деньги', labelEn: 'Money', icon: DollarSign },
  { id: 'team', label: 'Команда', labelEn: 'Team', icon: Users },
  { id: 'knowledge', label: 'Знания', labelEn: 'Knowledge', icon: Brain },
];

interface WizardData {
  sphereId: number | null;
  isTeam: boolean;
  successVision: string;
  metricType: 'number' | 'percent';
  metricValue: string;
  metricUnit: string;
  decompFinal: string;
  decompMiddle: string;
  decompFirst: string;
  resources: string[];
  obstacle: string;
  deadline: Date | undefined;
  color: string;
}

const initialData: WizardData = {
  sphereId: null,
  isTeam: false,
  successVision: '',
  metricType: 'number',
  metricValue: '',
  metricUnit: '',
  decompFinal: '',
  decompMiddle: '',
  decompFirst: '',
  resources: [],
  obstacle: '',
  deadline: undefined,
  color: GOAL_COLORS[0],
};

export interface SmartTask {
  title: string;
  deadline?: string;
  priority: 'low' | 'medium' | 'high';
  phase: number;
  totalPhases: number;
}

interface SmartGoalWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (goalData: any, tasks: SmartTask[]) => void;
}

export function SmartGoalWizard({ open, onOpenChange, onSave }: SmartGoalWizardProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>({ ...initialData });
  const [direction, setDirection] = useState(1);

  const accent = data.isTeam ? 'blue' : 'emerald';

  const update = useCallback(<K extends keyof WizardData>(key: K, value: WizardData[K]) => {
    setData(prev => ({ ...prev, [key]: value }));
  }, []);

  const next = () => {
    if (step < TOTAL_STEPS) {
      setDirection(1);
      setStep(s => s + 1);
    }
  };
  const prev = () => {
    if (step > 1) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return data.sphereId !== null;
      case 2: return data.successVision.trim().length > 0;
      case 3: return data.metricValue.trim().length > 0;
      case 4: return data.decompFirst.trim().length > 0;
      case 5: return data.resources.length > 0;
      case 6: return data.deadline !== undefined;
      default: return true;
    }
  };

  const handleFinalize = () => {
    const sphere = SPHERES.find(s => s.id === data.sphereId);
    const goalName = data.successVision.trim();
    
    // Build decomposition tasks with phase metadata
    const decomp: SmartTask[] = [];
    const totalDays = data.deadline ? Math.max(1, differenceInDays(data.deadline, new Date())) : 30;
    const phases = [data.decompFirst, data.decompMiddle, data.decompFinal].filter(t => t.trim());
    const totalPhases = phases.length;
    let phaseIndex = 0;

    if (data.decompFirst.trim()) {
      phaseIndex++;
      decomp.push({
        title: data.decompFirst.trim(),
        deadline: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
        priority: 'high' as const,
        phase: phaseIndex,
        totalPhases,
      });
    }
    if (data.decompMiddle.trim()) {
      phaseIndex++;
      decomp.push({
        title: data.decompMiddle.trim(),
        deadline: data.deadline ? format(addDays(new Date(), Math.floor(totalDays / 2)), 'yyyy-MM-dd') : undefined,
        priority: 'medium' as const,
        phase: phaseIndex,
        totalPhases,
      });
    }
    if (data.decompFinal.trim()) {
      phaseIndex++;
      decomp.push({
        title: data.decompFinal.trim(),
        deadline: data.deadline ? format(addDays(data.deadline, -Math.max(1, Math.floor(totalDays * 0.15))), 'yyyy-MM-dd') : undefined,
        priority: 'medium' as const,
        phase: phaseIndex,
        totalPhases,
      });
    }

    const goalPayload = {
      name: goalName,
      description: [
        data.metricValue ? `${isRu ? 'Метрика' : 'Metric'}: ${data.metricValue} ${data.metricUnit}` : '',
        data.obstacle ? `${isRu ? 'Препятствие' : 'Obstacle'}: ${data.obstacle}` : '',
        data.resources.length ? `${isRu ? 'Ресурсы' : 'Resources'}: ${data.resources.join(', ')}` : '',
      ].filter(Boolean).join('\n'),
      color: sphere?.color || data.color,
      icon: sphere?.icon || '🎯',
      target_date: data.deadline ? format(data.deadline, 'yyyy-MM-dd') : null,
      sphere_id: data.sphereId,
      is_team: data.isTeam,
      status: 'active',
      budget_goal: null,
      time_goal_minutes: null,
    };

    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ['#10b981', '#14b8a6', '#6366f1'] });
    toast.success(isRu ? '🎯 Цель создана! +50 XP' : '🎯 Goal created! +50 XP');
    onSave(goalPayload, decomp);

    // Reset
    setStep(1);
    setData({ ...initialData });
    onOpenChange(false);
  };

  const handleClose = () => {
    setStep(1);
    setData({ ...initialData });
    onOpenChange(false);
  };

  if (!open) return null;

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  const progressPercent = (step / TOTAL_STEPS) * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          "relative w-full max-w-lg max-h-[92vh] overflow-y-auto",
          "rounded-[32px] border border-white/10",
          "bg-zinc-950/80 backdrop-blur-xl shadow-2xl",
          "flex flex-col"
        )}
      >
        {/* Progress bar */}
        <div className="sticky top-0 z-10 px-6 pt-5 pb-2 bg-zinc-950/60 backdrop-blur-md rounded-t-[32px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-muted-foreground">
              {isRu ? `Шаг ${step} из ${TOTAL_STEPS}` : `Step ${step} of ${TOTAL_STEPS}`}
            </span>
            <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
          <div className="h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                data.isTeam
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                  : "bg-gradient-to-r from-emerald-400 to-teal-600"
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 px-6 py-4 overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              {step === 1 && <Step1Sphere data={data} update={update} isRu={isRu} accent={accent} />}
              {step === 2 && <Step2Vision data={data} update={update} isRu={isRu} accent={accent} />}
              {step === 3 && <Step3Metric data={data} update={update} isRu={isRu} accent={accent} />}
              {step === 4 && <Step4Decomp data={data} update={update} isRu={isRu} accent={accent} />}
              {step === 5 && <Step5Resources data={data} update={update} isRu={isRu} accent={accent} />}
              {step === 6 && <Step6Timeline data={data} update={update} isRu={isRu} accent={accent} />}
              {step === 7 && <Step7Summary data={data} isRu={isRu} accent={accent} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 px-6 pb-5 pt-3 bg-zinc-950/60 backdrop-blur-md rounded-b-[32px] flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={prev} className="gap-1 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10">
              <ChevronLeft className="w-4 h-4" />
              {isRu ? 'Назад' : 'Back'}
            </Button>
          )}
          <div className="flex-1" />
          {step < TOTAL_STEPS ? (
            <Button
              onClick={next}
              disabled={!canProceed()}
              className={cn(
                "gap-1 rounded-2xl text-white",
                data.isTeam
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
                "disabled:opacity-40"
              )}
            >
              {isRu ? 'Далее' : 'Next'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleFinalize}
              className={cn(
                "gap-2 rounded-2xl text-white font-semibold",
                data.isTeam
                  ? "bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                  : "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700"
              )}
            >
              <Zap className="w-4 h-4" />
              {isRu ? 'Начать первый этап ⚡️' : 'Start first phase ⚡️'}
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── STEP 1: SPHERE ─── */
function Step1Sphere({ data, update, isRu, accent }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {isRu ? 'В какой сфере ставим цель?' : 'Which life area is this goal for?'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Выберите сферу жизни для вашей цели' : 'Choose a life sphere for your goal'}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {SPHERE_CARDS.map(card => {
          const selected = data.sphereId === card.sphereId;
          const sphere = SPHERES.find(s => s.id === card.sphereId);
          return (
            <motion.button
              key={card.sphereId}
              whileTap={{ scale: 0.95 }}
              onClick={() => update('sphereId', card.sphereId)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all duration-200",
                selected
                  ? accent === 'blue'
                    ? "border-blue-500/60 bg-blue-500/10 ring-2 ring-blue-500/30"
                    : "border-emerald-500/60 bg-emerald-500/10 ring-2 ring-emerald-500/30"
                  : "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20"
              )}
            >
              <span className="text-3xl">{card.icon}</span>
              <span className="text-sm font-medium text-foreground">
                {isRu ? card.label : card.labelEn}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── STEP 2: VISION ─── */
function Step2Vision({ data, update, isRu, accent }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {isRu ? 'Как выглядит успех?' : 'What does success look like?'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Опишите желаемый результат максимально конкретно' : 'Describe your desired outcome as specifically as possible'}
        </p>
      </div>
      <Textarea
        value={data.successVision}
        onChange={e => update('successVision', e.target.value)}
        placeholder={isRu ? 'Например: Пробежать марафон за 4 часа к сентябрю 2026' : 'e.g., Run a marathon in under 4 hours by September 2026'}
        rows={4}
        className="rounded-2xl border-white/10 bg-white/5 resize-none placeholder:text-muted-foreground/50"
      />
      <div className="flex items-center justify-between p-4 rounded-2xl border border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          {data.isTeam ? (
            <Users className={cn("w-5 h-5", "text-blue-400")} />
          ) : (
            <User className={cn("w-5 h-5", "text-emerald-400")} />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {data.isTeam
                ? (isRu ? 'Командная цель' : 'Team goal')
                : (isRu ? 'Личная цель' : 'Personal goal')
              }
            </p>
            <p className="text-xs text-muted-foreground">
              {data.isTeam
                ? (isRu ? 'Синяя тема' : 'Blue theme')
                : (isRu ? 'Зелёная тема' : 'Green theme')
              }
            </p>
          </div>
        </div>
        <Switch
          checked={data.isTeam}
          onCheckedChange={v => update('isTeam', v)}
        />
      </div>
    </div>
  );
}

/* ─── STEP 3: S+M METRIC ─── */
function Step3Metric({ data, update, isRu, accent }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {isRu ? 'Добавим точности' : 'Add precision'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Как вы измерите прогресс?' : 'How will you measure progress?'}
        </p>
      </div>

      <div className="flex gap-3">
        {(['number', 'percent'] as const).map(t => (
          <button
            key={t}
            onClick={() => update('metricType', t)}
            className={cn(
              "flex-1 py-3 rounded-2xl border text-sm font-medium transition-all",
              data.metricType === t
                ? accent === 'blue'
                  ? "border-blue-500/60 bg-blue-500/10 text-blue-400"
                  : "border-emerald-500/60 bg-emerald-500/10 text-emerald-400"
                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
            )}
          >
            {t === 'number' ? (isRu ? 'Число' : 'Number') : (isRu ? 'Процент' : 'Percent')}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">{isRu ? 'Целевое значение' : 'Target value'}</Label>
          <Input
            type="number"
            value={data.metricValue}
            onChange={e => update('metricValue', e.target.value)}
            placeholder={data.metricType === 'percent' ? '100' : '42'}
            className="rounded-2xl border-white/10 bg-white/5"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-muted-foreground text-xs">{isRu ? 'Единица измерения' : 'Unit'}</Label>
          <Input
            value={data.metricUnit}
            onChange={e => update('metricUnit', e.target.value)}
            placeholder={data.metricType === 'percent' ? '%' : (isRu ? 'км, кг, часов...' : 'km, kg, hours...')}
            className="rounded-2xl border-white/10 bg-white/5"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── STEP 4: BACKWARDS DECOMPOSITION ─── */
function Step4Decomp({ data, update, isRu, accent }: StepProps) {
  const [revealedCount, setRevealedCount] = useState(1);

  const borderColor = accent === 'blue' ? 'border-blue-500/40' : 'border-emerald-500/40';
  const dotColor = accent === 'blue' ? 'bg-blue-500' : 'bg-emerald-500';
  const lineColor = accent === 'blue' ? 'bg-blue-500/30' : 'bg-emerald-500/30';

  const handleBlur = (idx: number) => {
    if (idx >= revealedCount - 1 && revealedCount < 3) {
      setRevealedCount(prev => Math.min(prev + 1, 3));
    }
  };

  const blocks = [
    {
      label: isRu ? '🏁 Предфинальный этап' : '🏁 Pre-final stage',
      sub: isRu ? 'Что сделать за шаг до финиша?' : 'What to do one step before the finish?',
      value: data.decompFinal,
      key: 'decompFinal' as const,
      placeholder: isRu ? 'Генеральная репетиция, финальное тестирование...' : 'Final rehearsal, last test run...',
    },
    {
      label: isRu ? '⚡ Промежуточная веха' : '⚡ Midway milestone',
      sub: isRu ? 'Центральная точка пути' : 'The center of your path',
      value: data.decompMiddle,
      key: 'decompMiddle' as const,
      placeholder: isRu ? 'Завершить основной модуль, набрать базу...' : 'Complete core module, build foundation...',
    },
    {
      label: isRu ? '🚀 Первый шаг' : '🚀 First step',
      sub: isRu ? 'Что сделать сегодня?' : 'What to do today?',
      value: data.decompFirst,
      key: 'decompFirst' as const,
      placeholder: isRu ? 'Составить план, изучить материалы...' : 'Make a plan, study materials...',
    },
  ];

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {isRu ? 'Обратная декомпозиция' : 'Backwards Planning'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Спланируйте путь от финиша к старту' : 'Plan the path from finish to start'}
        </p>
      </div>

      <div className="relative space-y-0">
        {/* Vertical timeline line */}
        <div className={cn("absolute left-4 top-6 bottom-6 w-0.5", lineColor)} />

        {blocks.map((block, idx) => (
          <AnimatePresence key={block.key}>
            {idx < revealedCount && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: idx === revealedCount - 1 ? 0.15 : 0 }}
                className="relative pl-10 pb-5"
              >
                {/* Dot */}
                <div className={cn("absolute left-2.5 top-3 w-3 h-3 rounded-full z-10 ring-2 ring-zinc-950", dotColor)} />

                <div className={cn("p-4 rounded-2xl border bg-white/5 space-y-2", borderColor)}>
                  <p className="text-sm font-semibold text-foreground">{block.label}</p>
                  <p className="text-xs text-muted-foreground">{block.sub}</p>
                  <Input
                    value={block.value}
                    onChange={e => update(block.key, e.target.value)}
                    onBlur={() => handleBlur(idx)}
                    placeholder={block.placeholder}
                    className="rounded-xl border-white/10 bg-white/5 text-sm"
                  />
                </div>

                {idx < 2 && idx < revealedCount - 1 && (
                  <div className="flex justify-center py-1">
                    <ArrowDown className="w-4 h-4 text-muted-foreground/40" />
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        ))}
      </div>
    </div>
  );
}

/* ─── STEP 5: RESOURCES (A+R) ─── */
function Step5Resources({ data, update, isRu, accent }: StepProps) {
  const toggleResource = (id: string) => {
    const current = data.resources;
    update('resources', current.includes(id) ? current.filter(r => r !== id) : [...current, id]);
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {isRu ? 'Ресурсы и достижимость' : 'Resources & Achievability'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Что потребуется для достижения цели?' : 'What will it take to achieve this goal?'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {RESOURCE_TAGS.map(tag => {
          const selected = data.resources.includes(tag.id);
          const Icon = tag.icon;
          return (
            <motion.button
              key={tag.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleResource(tag.id)}
              className={cn(
                "flex items-center gap-3 p-4 rounded-2xl border transition-all",
                selected
                  ? accent === 'blue'
                    ? "border-blue-500/60 bg-blue-500/10"
                    : "border-emerald-500/60 bg-emerald-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              )}
            >
              <Icon className={cn("w-5 h-5", selected ? (accent === 'blue' ? 'text-blue-400' : 'text-emerald-400') : 'text-muted-foreground')} />
              <span className="text-sm font-medium text-foreground">{isRu ? tag.label : tag.labelEn}</span>
            </motion.button>
          );
        })}
      </div>

      <div className="space-y-2">
        <Label className="text-muted-foreground text-xs flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5" />
          {isRu ? 'Главное препятствие' : 'Main obstacle'}
        </Label>
        <Input
          value={data.obstacle}
          onChange={e => update('obstacle', e.target.value)}
          placeholder={isRu ? 'Что может помешать?' : 'What could go wrong?'}
          className="rounded-2xl border-white/10 bg-white/5"
        />
      </div>
    </div>
  );
}

/* ─── STEP 6: TIMELINE ─── */
function Step6Timeline({ data, update, isRu, accent }: StepProps) {
  const milestones = data.deadline ? (() => {
    const total = differenceInDays(data.deadline, new Date());
    if (total <= 0) return [];
    return [
      { label: isRu ? '🚀 Первый шаг' : '🚀 First step', date: addDays(new Date(), 1) },
      { label: isRu ? '⚡ Промежуточная веха' : '⚡ Midway', date: addDays(new Date(), Math.floor(total / 2)) },
      { label: isRu ? '🏁 Предфинальный этап' : '🏁 Pre-final', date: addDays(data.deadline, -Math.floor(total * 0.15)) },
      { label: isRu ? '🏆 Финиш' : '🏆 Finish', date: data.deadline },
    ];
  })() : [];

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {isRu ? 'Временные рамки' : 'Timeline'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Выберите дедлайн — даты этапов рассчитаются автоматически' : 'Pick a deadline — milestones are calculated automatically'}
        </p>
      </div>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start rounded-2xl border-white/10 bg-white/5 text-left h-12",
              !data.deadline && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="w-4 h-4 mr-2" />
            {data.deadline
              ? format(data.deadline, 'dd MMMM yyyy', { locale: isRu ? ru : undefined })
              : (isRu ? 'Выберите дедлайн' : 'Pick a deadline')
            }
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={data.deadline}
            onSelect={d => update('deadline', d)}
            disabled={d => d < new Date()}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      {milestones.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">{isRu ? 'Расчётные даты этапов' : 'Calculated milestones'}</Label>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border",
                  accent === 'blue' ? 'border-blue-500/20 bg-blue-500/5' : 'border-emerald-500/20 bg-emerald-500/5'
                )}
              >
                <span className="text-sm text-foreground">{m.label}</span>
                <Badge variant="outline" className="text-xs border-white/10">
                  {format(m.date, 'dd.MM.yyyy')}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── STEP 7: SUMMARY ─── */
function Step7Summary({ data, isRu, accent }: Omit<StepProps, 'update'>) {
  const sphere = SPHERES.find(s => s.id === data.sphereId);
  const borderGlow = accent === 'blue' ? 'border-blue-500/30 shadow-blue-500/10' : 'border-emerald-500/30 shadow-emerald-500/10';
  const headerBg = accent === 'blue' ? 'from-blue-500/20 to-indigo-600/20' : 'from-emerald-400/20 to-teal-600/20';

  return (
    <div className="space-y-5">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold text-foreground">
          {isRu ? 'Ваша цель готова!' : 'Your goal is ready!'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Проверьте и запустите' : 'Review and launch'}
        </p>
      </div>

      <div className={cn("rounded-2xl border overflow-hidden shadow-lg", borderGlow)}>
        {/* Header */}
        <div className={cn("p-4 bg-gradient-to-r", headerBg)}>
          <div className="flex items-center gap-3">
            <span className="text-3xl">{sphere?.icon || '🎯'}</span>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-foreground truncate">{data.successVision}</p>
              <p className="text-xs text-muted-foreground">
                {sphere ? (isRu ? sphere.name_ru : sphere.name_en) : ''}
                {data.isTeam && (
                  <Badge variant="outline" className="ml-2 text-[10px] border-blue-500/40 text-blue-400">
                    {isRu ? 'Команда' : 'Team'}
                  </Badge>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-4 space-y-3 bg-white/[0.02]">
          {data.metricValue && (
            <SummaryRow
              icon={<Target className="w-4 h-4" />}
              label={isRu ? 'Метрика' : 'Metric'}
              value={`${data.metricValue} ${data.metricUnit}`}
            />
          )}
          {data.deadline && (
            <SummaryRow
              icon={<CalendarIcon className="w-4 h-4" />}
              label={isRu ? 'Дедлайн' : 'Deadline'}
              value={format(data.deadline, 'dd.MM.yyyy')}
            />
          )}
          {data.resources.length > 0 && (
            <SummaryRow
              icon={<Sparkles className="w-4 h-4" />}
              label={isRu ? 'Ресурсы' : 'Resources'}
              value={data.resources.map(r => RESOURCE_TAGS.find(t => t.id === r)?.label || r).join(', ')}
            />
          )}
          {data.obstacle && (
            <SummaryRow
              icon={<AlertTriangle className="w-4 h-4" />}
              label={isRu ? 'Препятствие' : 'Obstacle'}
              value={data.obstacle}
            />
          )}

          {/* Decomposition */}
          <div className="pt-2 border-t border-white/10 space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {isRu ? 'Этапы' : 'Phases'}
            </p>
            {[data.decompFirst, data.decompMiddle, data.decompFinal].filter(Boolean).map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className={cn("w-3.5 h-3.5", accent === 'blue' ? 'text-blue-400' : 'text-emerald-400')} />
                <span className="text-sm text-foreground">{d}</span>
              </div>
            ))}
          </div>

          {/* XP Badge */}
          <div className="flex justify-center pt-2">
            <Badge className={cn(
              "px-4 py-1.5 text-sm font-bold",
              accent === 'blue'
                ? "bg-blue-500/20 text-blue-400 border-blue-500/40"
                : "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
            )}>
              +50 XP
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Helpers ─── */

function SummaryRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-muted-foreground mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</p>
        <p className="text-sm text-foreground">{value}</p>
      </div>
    </div>
  );
}

interface StepProps {
  data: WizardData;
  update: <K extends keyof WizardData>(key: K, value: WizardData[K]) => void;
  isRu: boolean;
  accent: string;
}
