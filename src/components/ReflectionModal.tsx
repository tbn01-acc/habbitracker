import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Heart, Zap, Trophy, ChevronRight, Plus, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const REFLECTION_KEY = 'topfocus_reflections';
const SLEEP_EMOJIS = ['😫', '😴', '😐', '😊', '🤩'];
const STRESS_COLORS = ['hsl(145, 70%, 45%)', 'hsl(80, 70%, 45%)', 'hsl(45, 90%, 50%)', 'hsl(25, 90%, 50%)', 'hsl(0, 70%, 55%)'];
const BLOCKER_OPTIONS = [
  { id: 'team', label: 'Команда', labelEn: 'Team' },
  { id: 'tech', label: 'Техника', labelEn: 'Tech' },
  { id: 'energy', label: 'Энергия', labelEn: 'Energy' },
  { id: 'unclear', label: 'Неясность', labelEn: 'Unclear' },
];

interface ReflectionModalProps {
  open: boolean;
  onClose: () => void;
  userId?: string;
  onOpenTaskDialog?: (prefillDate: string) => void;
}

export function ReflectionModal({ open, onClose, userId, onOpenTaskDialog }: ReflectionModalProps) {
  const { language } = useTranslation();
  const isRu = language === 'ru';
  const [step, setStep] = useState(0);
  const [sleepScore, setSleepScore] = useState<number | null>(null);
  const [stressScore, setStressScore] = useState<number | null>(null);
  const [victoryNote, setVictoryNote] = useState('');
  const [blockers, setBlockers] = useState<string[]>([]);
  const [selectedMainTaskId, setSelectedMainTaskId] = useState<string | null>(null);
  const [additionalNotes, setAdditionalNotes] = useState('');

  const totalSteps = 5; // sleep, stress, victory+blockers, main task, additional notes

  // Determine target date for "tomorrow's main task"
  const targetDate = useMemo(() => {
    const now = new Date();
    const hour = now.getHours();
    // If before 18:00, tasks for today; otherwise for tomorrow
    if (hour < 18) {
      return now.toISOString().split('T')[0];
    }
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }, []);

  // Get tasks for the target date from localStorage
  const availableTasks = useMemo(() => {
    try {
      const stored = localStorage.getItem('habitflow_tasks');
      if (!stored) return [];
      const tasks = JSON.parse(stored);
      return tasks.filter((t: any) => t.dueDate === targetDate && !t.completed && !t.archivedAt);
    } catch {
      return [];
    }
  }, [targetDate]);

  // Step validation
  const isStepValid = useCallback((s: number): boolean => {
    switch (s) {
      case 0: return sleepScore !== null;
      case 1: return stressScore !== null;
      case 2: return victoryNote.trim().length > 0;
      case 3: return true; // main task is optional
      case 4: return true; // additional notes is optional
      default: return true;
    }
  }, [sleepScore, stressScore, victoryNote]);

  const handleSetMainTask = useCallback((taskId: string) => {
    setSelectedMainTaskId(taskId);
    // Update task in localStorage
    try {
      const stored = localStorage.getItem('habitflow_tasks');
      if (!stored) return;
      const tasks = JSON.parse(stored);
      const updated = tasks.map((t: any) => ({
        ...t,
        isMain: t.id === taskId ? true : (t.dueDate === targetDate ? false : t.isMain),
      }));
      localStorage.setItem('habitflow_tasks', JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('habitflow-data-changed'));
    } catch (e) {
      console.error('Error setting main task:', e);
    }
  }, [targetDate]);

  const handleSave = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem(REFLECTION_KEY);
    const reflections = stored ? JSON.parse(stored) : [];

    const newReflection = {
      id: crypto.randomUUID(),
      userId: userId || 'guest',
      date: today,
      sleepScore: sleepScore!,
      stressScore: stressScore!,
      victoryNote: victoryNote.trim(),
      blockers,
      mainTaskId: selectedMainTaskId || undefined,
      additionalNotes: additionalNotes.trim() || undefined,
      type: 'daily',
      createdAt: new Date().toISOString(),
    };

    reflections.push(newReflection);
    localStorage.setItem(REFLECTION_KEY, JSON.stringify(reflections));

    confetti({ particleCount: 60, spread: 50, origin: { y: 0.7 } });
    toast.success(isRu ? '✨ Рефлексия записана!' : '✨ Reflection saved!');
    onClose();
  }, [sleepScore, stressScore, victoryNote, blockers, selectedMainTaskId, additionalNotes, userId, isRu, onClose]);

  if (!open) return null;

  const slideVariants = {
    enter: { x: 100, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -100, opacity: 0 },
  };

  const isTargetToday = targetDate === new Date().toISOString().split('T')[0];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-zinc-950/90 backdrop-blur-xl shadow-2xl overflow-hidden"
      >
        {/* Progress dots */}
        <div className="flex justify-center gap-2 pt-6 pb-2">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                i <= step ? "bg-primary scale-110" : "bg-white/20"
              )}
            />
          ))}
        </div>

        <div className="px-6 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="min-h-[220px]"
            >
              {/* Step 0: Sleep */}
              {step === 0 && (
                <div className="space-y-4 text-center">
                  <Moon className="w-8 h-8 mx-auto text-indigo-400" />
                  <h2 className="text-lg font-bold text-foreground">
                    {isRu ? 'Как ты спал(а)?' : 'How did you sleep?'}
                  </h2>
                  <div className="flex justify-center gap-3">
                    {SLEEP_EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => setSleepScore(i + 1)}
                        className={cn(
                          "text-3xl p-2 rounded-xl transition-all",
                          sleepScore === i + 1
                            ? "scale-125 bg-primary/20 ring-2 ring-primary/50"
                            : "opacity-50 hover:opacity-80 hover:scale-110"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">{sleepScore !== null ? `${sleepScore}/5` : '-/5'}</p>
                </div>
              )}

              {/* Step 1: Stress */}
              {step === 1 && (
                <div className="space-y-4 text-center">
                  <Zap className="w-8 h-8 mx-auto text-amber-400" />
                  <h2 className="text-lg font-bold text-foreground">
                    {isRu ? 'Твой уровень стресса' : 'Your stress level'}
                  </h2>
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <button
                        key={i}
                        onClick={() => setStressScore(i)}
                        className={cn(
                          "w-12 h-12 rounded-xl font-bold text-lg transition-all border",
                          stressScore === i
                            ? "scale-110 ring-2 ring-white/30 border-transparent"
                            : "border-white/10 opacity-60 hover:opacity-90"
                        )}
                        style={{
                          backgroundColor: stressScore === i ? STRESS_COLORS[i - 1] : 'transparent',
                          color: stressScore === i ? '#fff' : STRESS_COLORS[i - 1],
                        }}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stressScore === null ? '' :
                      stressScore <= 2
                        ? (isRu ? 'Спокойствие 🧘' : 'Calm 🧘')
                        : stressScore <= 3
                        ? (isRu ? 'Нормально' : 'Normal')
                        : (isRu ? 'Напряжение ⚠️' : 'Tension ⚠️')}
                  </p>
                </div>
              )}

              {/* Step 2: Victory + Blockers */}
              {step === 2 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Trophy className="w-8 h-8 mx-auto text-amber-400" />
                    <h2 className="text-lg font-bold text-foreground mt-2">
                      {isRu ? 'Главная победа дня?' : "Today's victory?"}
                    </h2>
                  </div>
                  <Textarea
                    value={victoryNote}
                    onChange={e => setVictoryNote(e.target.value)}
                    placeholder={isRu ? 'Чем ты гордишься сегодня...' : 'What are you proud of today...'}
                    rows={2}
                    className="rounded-xl border-white/10 bg-white/5 resize-none"
                  />
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {isRu ? 'Что мешало?' : 'What blocked you?'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {BLOCKER_OPTIONS.map(b => {
                        const selected = blockers.includes(b.id);
                        return (
                          <button
                            key={b.id}
                            onClick={() => setBlockers(prev =>
                              selected ? prev.filter(x => x !== b.id) : [...prev, b.id]
                            )}
                            className={cn(
                              "px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
                              selected
                                ? "border-red-500/50 bg-red-500/15 text-red-400"
                                : "border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10"
                            )}
                          >
                            {isRu ? b.label : b.labelEn}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Main task selection */}
              {step === 3 && (
                <div className="space-y-4">
                  <div className="text-center">
                    <Heart className="w-8 h-8 mx-auto text-rose-400" />
                    <h2 className="text-lg font-bold text-foreground mt-2">
                      {isRu
                        ? `Главная задача на ${isTargetToday ? 'сегодня' : 'завтра'}?`
                        : `Main task for ${isTargetToday ? 'today' : 'tomorrow'}?`}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {isRu ? 'Выбери из списка или создай новую' : 'Pick from list or create new'}
                    </p>
                  </div>

                  {availableTasks.length > 0 ? (
                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {availableTasks.map((task: any) => (
                        <button
                          key={task.id}
                          onClick={() => handleSetMainTask(task.id)}
                          className={cn(
                            "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            selectedMainTaskId === task.id
                              ? "border-primary/50 bg-primary/10"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          )}
                        >
                          <span className="text-lg">{task.icon || '📝'}</span>
                          <span className="flex-1 text-sm text-foreground truncate">{task.name}</span>
                          {selectedMainTaskId === task.id && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-medium">
                              🎯 {isRu ? 'Главная' : 'Main'}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      {isRu ? 'Нет задач на эту дату' : 'No tasks for this date'}
                    </p>
                  )}

                  {onOpenTaskDialog && (
                    <Button
                      variant="outline"
                      className="w-full rounded-xl border-white/10 bg-white/5 gap-2"
                      onClick={() => {
                        onClose();
                        setTimeout(() => onOpenTaskDialog(targetDate), 300);
                      }}
                    >
                      <Plus className="w-4 h-4" />
                      {isRu ? 'Создать новую задачу' : 'Create new task'}
                    </Button>
                  )}
                </div>
              )}

              {/* Step 4: Additional notes */}
              {step === 4 && (
                <div className="space-y-4 text-center">
                  <MessageSquare className="w-8 h-8 mx-auto text-blue-400" />
                  <h2 className="text-lg font-bold text-foreground">
                    {isRu ? 'Что хотите добавить?' : 'Anything to add?'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isRu ? 'Мысли, заметки, благодарности...' : 'Thoughts, notes, gratitude...'}
                  </p>
                  <Textarea
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    placeholder={isRu ? 'Свободный текст...' : 'Free text...'}
                    rows={3}
                    className="rounded-xl border-white/10 bg-white/5 resize-none"
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-3 mt-4">
            {step > 0 && (
              <Button
                variant="outline"
                onClick={() => setStep(s => s - 1)}
                className="rounded-xl border-white/10 bg-white/5"
              >
                {isRu ? 'Назад' : 'Back'}
              </Button>
            )}
            <div className="flex-1" />
            {step < totalSteps - 1 ? (
              <Button
                onClick={() => setStep(s => s + 1)}
                disabled={!isStepValid(step)}
                className="rounded-xl bg-gradient-to-r from-primary to-primary/80 text-white gap-1"
              >
                {isRu ? 'Далее' : 'Next'}
                <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold"
              >
                {isRu ? '✨ Сохранить' : '✨ Save'}
              </Button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function useReflectionCheck() {
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem('topfocus_reflections');
  if (!stored) return true;
  try {
    const reflections = JSON.parse(stored);
    return !reflections.some((r: any) => r.date === today);
  } catch {
    return true;
  }
}
