import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar as CalendarIcon, List, Moon, Zap, Trophy, MessageSquare, Edit3, Send, Star, X } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { PageHeader } from '@/components/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, parseISO, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, endOfWeek, eachDayOfInterval, eachWeekOfInterval, isWithinInterval } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { toast } from 'sonner';
import { useStars } from '@/hooks/useStars';
import { useAuth } from '@/hooks/useAuth';

const REFLECTION_KEY = 'topfocus_reflections';
const SLEEP_EMOJIS = ['😫', '😴', '😐', '😊', '🤩'];

interface ReflectionEntry {
  id: string;
  userId: string;
  date: string;
  sleepScore: number;
  stressScore: number;
  victoryNote: string;
  blockers: string[];
  mainTaskId?: string;
  additionalNotes?: string;
  type?: string;
  createdAt: string;
}

function getReflections(): ReflectionEntry[] {
  try {
    const stored = localStorage.getItem(REFLECTION_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveReflections(data: ReflectionEntry[]) {
  localStorage.setItem(REFLECTION_KEY, JSON.stringify(data));
}

export default function SuccessDiary() {
  const { language } = useTranslation();
  const { user } = useAuth();
  const { addStars } = useStars();
  const isRu = language === 'ru';
  const loc = isRu ? ru : enUS;
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [calendarScale, setCalendarScale] = useState<'month' | 'quarter' | 'year' | 'all'>('month');
  const [selectedEntry, setSelectedEntry] = useState<ReflectionEntry | null>(null);
  const [editEntry, setEditEntry] = useState<ReflectionEntry | null>(null);
  const [editNotes, setEditNotes] = useState('');
  const [editVictory, setEditVictory] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const reflections = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = refreshKey;
    const data = getReflections();
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [refreshKey]);

  const stressColor = (score: number) => {
    const colors = ['hsl(145, 70%, 45%)', 'hsl(80, 70%, 45%)', 'hsl(45, 90%, 50%)', 'hsl(25, 90%, 50%)', 'hsl(0, 70%, 55%)'];
    return colors[score - 1] || colors[2];
  };

  // Integral score 1..5: combines sleep, inverse stress, and victory presence
  const integralScore = (r: ReflectionEntry): number => {
    const sleep = r.sleepScore || 3;
    const stressInv = 6 - (r.stressScore || 3);
    const victoryBonus = r.victoryNote?.trim() ? 1 : 0;
    const raw = (sleep + stressInv) / 2 + victoryBonus * 0.3;
    return Math.max(1, Math.min(5, Math.round(raw)));
  };

  const scoreColor = (score: number): string => {
    const colors = ['hsl(0, 70%, 55%)', 'hsl(25, 90%, 50%)', 'hsl(45, 90%, 50%)', 'hsl(80, 70%, 45%)', 'hsl(145, 70%, 45%)'];
    return colors[score - 1] || colors[2];
  };

  const calendarData = useMemo(() => {
    const map = new Map<string, ReflectionEntry>();
    reflections.forEach(r => map.set(r.date, r));
    return map;
  }, [reflections]);

  const handleDateClick = (dateStr: string) => {
    const entry = calendarData.get(dateStr);
    if (entry) {
      setSelectedEntry(entry);
    }
  };

  const handleEdit = (entry: ReflectionEntry) => {
    setEditEntry(entry);
    setEditVictory(entry.victoryNote);
    setEditNotes(entry.additionalNotes || '');
    setSelectedEntry(null);
  };

  const handleSaveEdit = () => {
    if (!editEntry) return;
    const all = getReflections();
    const idx = all.findIndex(r => r.id === editEntry.id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], victoryNote: editVictory, additionalNotes: editNotes };
      saveReflections(all);
      setRefreshKey(k => k + 1);
      toast.success(isRu ? 'Запись обновлена' : 'Entry updated');
    }
    setEditEntry(null);
  };

  const handlePublish = async (entry: ReflectionEntry) => {
    if (!user) {
      toast.error(isRu ? 'Необходимо войти в аккаунт' : 'Login required');
      return;
    }
    try {
      // Deduct 1 star
      await addStars(-1, 'publish_reflection');
      toast.success(isRu ? 'Опубликовано в ленте «Успехи»! (-1 ⭐)' : 'Published to Achievements feed! (-1 ⭐)');
    } catch {
      toast.error(isRu ? 'Недостаточно звёзд' : 'Not enough stars');
    }
  };

  const renderEntryCard = (r: ReflectionEntry, i: number) => (
    <motion.div
      key={r.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.03 }}
      className="bg-card rounded-2xl border border-border p-4 shadow-card cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => setSelectedEntry(r)}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          {format(parseISO(r.date), 'd MMMM yyyy', { locale: loc })}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-lg">{SLEEP_EMOJIS[r.sleepScore - 1]}</span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
            style={{ backgroundColor: scoreColor(integralScore(r)) }}
            title={isRu ? `Интегральная оценка дня: ${integralScore(r)}/5` : `Day score: ${integralScore(r)}/5`}
          >
            {integralScore(r)}
          </div>
        </div>
      </div>

      {/* All reflection stages */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <div className="flex items-center gap-1">
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-xs text-muted-foreground">{isRu ? 'Сон' : 'Sleep'}: <strong className="text-foreground">{r.sleepScore}/5</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" style={{ color: stressColor(r.stressScore) }} />
            <span className="text-xs text-muted-foreground">{isRu ? 'Стресс' : 'Stress'}: <strong className="text-foreground">{r.stressScore}/5</strong></span>
          </div>
          {r.blockers && r.blockers.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {r.blockers.slice(0, 3).map(b => (
                <span key={b} className="text-[10px] px-1.5 py-0.5 rounded-full bg-destructive/10 text-destructive">
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2">
          <Trophy className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className={cn("text-xs line-clamp-2", r.victoryNote ? "text-foreground" : "text-muted-foreground italic")}>
            {r.victoryNote || (isRu ? 'Победа дня не указана' : 'No victory recorded')}
          </p>
        </div>

        <div className="flex items-start gap-2">
          <Star className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          <p className={cn("text-xs line-clamp-1", r.mainTaskId ? "text-foreground" : "text-muted-foreground italic")}>
            {r.mainTaskId
              ? (isRu ? 'Главная задача дня выбрана' : 'Main task assigned')
              : (isRu ? 'Главная задача не выбрана' : 'No main task')}
          </p>
        </div>

        {r.additionalNotes && (
          <div className="flex items-start gap-2">
            <MessageSquare className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground line-clamp-2">{r.additionalNotes}</p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderCalendarMonth = () => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const dayHeaders = isRu ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

    return (
      <>
        <div className="grid grid-cols-7 gap-1">
          {dayHeaders.map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground py-1">{d}</div>
          ))}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const entry = calendarData.get(dateStr);
            const isToday = dateStr === format(now, 'yyyy-MM-dd');
            const score = entry ? integralScore(entry) : 0;
            return (
              <motion.button
                key={dateStr}
                whileHover={entry ? { scale: 1.05 } : {}}
                whileTap={entry ? { scale: 0.95 } : {}}
                onClick={() => handleDateClick(dateStr)}
                disabled={!entry}
                title={entry ? `${isRu ? 'Оценка' : 'Score'}: ${score}/5` : (isRu ? 'Нет записи' : 'No entry')}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all relative overflow-hidden",
                  !entry && "bg-muted/20 text-muted-foreground/60 cursor-default",
                  entry && "cursor-pointer text-white shadow-sm hover:shadow-md",
                  isToday && "ring-2 ring-primary ring-offset-1 ring-offset-background"
                )}
                style={entry ? { backgroundColor: scoreColor(score) } : undefined}
              >
                <span className="font-semibold leading-none">{format(day, 'd')}</span>
                {entry ? (
                  <span className="text-[10px] font-bold leading-tight mt-0.5">{score}/5</span>
                ) : (
                  <span className="text-[10px] opacity-40 mt-0.5">—</span>
                )}
              </motion.button>
            );
          })}
        </div>
        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-1.5 flex-wrap">
          <span className="text-[10px] text-muted-foreground mr-1">{isRu ? 'Оценка дня:' : 'Day score:'}</span>
          {[1,2,3,4,5].map(n => (
            <div key={n} className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: scoreColor(n) }} />
              <span className="text-[10px] text-muted-foreground">{n}</span>
            </div>
          ))}
        </div>
      </>
    );
  };

  const renderCalendarQuarter = () => {
    const now = new Date();
    const qStart = startOfQuarter(now);
    const qEnd = endOfQuarter(now);
    const weeks = eachWeekOfInterval({ start: qStart, end: qEnd }, { weekStartsOn: 1 });

    return (
      <div className="grid grid-cols-7 gap-1">
        {weeks.map((weekStart, i) => {
          const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
          const weekReflections = reflections.filter(r => {
            const d = parseISO(r.date);
            return isWithinInterval(d, { start: weekStart, end: weekEnd });
          });
          const avgSleep = weekReflections.length > 0
            ? Math.round(weekReflections.reduce((s, r) => s + r.sleepScore, 0) / weekReflections.length)
            : 0;
          return (
            <div
              key={i}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center text-xs",
                weekReflections.length > 0 ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
              )}
            >
              <span className="text-[10px]">W{i + 1}</span>
              {avgSleep > 0 && <span className="text-[10px]">{SLEEP_EMOJIS[avgSleep - 1]}</span>}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 py-6">
        <PageHeader
          showTitle
          icon={<BookOpen className="w-5 h-5 text-primary" />}
          iconBgClass="bg-primary/20"
          title={isRu ? 'Дневник моего успеха' : 'My Success Diary'}
          subtitle={`${reflections.length} ${isRu ? 'записей' : 'entries'}`}
        />

        <Tabs value={view} onValueChange={(v) => setView(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="list" className="gap-1.5">
              <List className="w-4 h-4" />
              {isRu ? 'Список' : 'List'}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5">
              <CalendarIcon className="w-4 h-4" />
              {isRu ? 'Календарь' : 'Calendar'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list">
            {reflections.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {isRu ? 'Пока нет записей. Заполни первую рефлексию!' : 'No entries yet. Complete your first reflection!'}
              </div>
            ) : (
              <div className="space-y-3">
                {reflections.map((r, i) => renderEntryCard(r, i))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar">
            <div className="mb-4">
              <div className="flex gap-2">
                {(['month', 'quarter', 'year', 'all'] as const).map(scale => (
                  <button
                    key={scale}
                    onClick={() => setCalendarScale(scale)}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs font-medium transition-all",
                      calendarScale === scale ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {scale === 'month' ? (isRu ? 'Месяц' : 'Month')
                      : scale === 'quarter' ? (isRu ? 'Квартал' : 'Quarter')
                      : scale === 'year' ? (isRu ? 'Год' : 'Year')
                      : (isRu ? 'Все время' : 'All time')}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
              {calendarScale === 'month' && renderCalendarMonth()}
              {calendarScale === 'quarter' && renderCalendarQuarter()}
              {calendarScale === 'year' && (
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 12 }).map((_, i) => {
                    const monthReflections = reflections.filter(r => {
                      const d = parseISO(r.date);
                      return d.getMonth() === i && d.getFullYear() === new Date().getFullYear();
                    });
                    return (
                      <div
                        key={i}
                        className={cn(
                          "aspect-square rounded-xl flex flex-col items-center justify-center text-xs",
                          monthReflections.length > 0 ? "bg-primary/20 text-primary" : "bg-muted/30 text-muted-foreground"
                        )}
                      >
                        <span className="font-medium">{format(new Date(2024, i, 1), 'MMM', { locale: loc })}</span>
                        <span className="text-[10px]">{monthReflections.length}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              {calendarScale === 'all' && (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  {isRu ? `Всего записей: ${reflections.length}` : `Total entries: ${reflections.length}`}
                  {reflections.length > 0 && (
                    <p className="mt-1">
                      {isRu ? 'Первая запись: ' : 'First entry: '}
                      {format(parseISO(reflections[reflections.length - 1].date), 'd MMM yyyy', { locale: loc })}
                    </p>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Entry Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {selectedEntry && format(parseISO(selectedEntry.date), 'd MMMM yyyy', { locale: loc })}
            </DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm">{isRu ? 'Сон' : 'Sleep'}: {selectedEntry.sleepScore}/5 {SLEEP_EMOJIS[selectedEntry.sleepScore - 1]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: stressColor(selectedEntry.stressScore) }} />
                  <span className="text-sm">{isRu ? 'Стресс' : 'Stress'}: {selectedEntry.stressScore}/5</span>
                </div>
              </div>

              {selectedEntry.victoryNote && (
                <div className="bg-amber-500/10 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-amber-400">{isRu ? 'Победа дня' : 'Victory'}</span>
                  </div>
                  <p className="text-sm">{selectedEntry.victoryNote}</p>
                </div>
              )}

              <div className="bg-primary/10 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{isRu ? 'Главная задача дня' : 'Main task of the day'}</span>
                </div>
                <p className={cn("text-sm", selectedEntry.mainTaskId ? "text-foreground" : "text-muted-foreground italic")}>
                  {selectedEntry.mainTaskId
                    ? (isRu ? '✓ Выбрана и зафиксирована' : '✓ Assigned and locked')
                    : (isRu ? 'Не была выбрана' : 'Was not assigned')}
                </p>
              </div>

              <div className="flex items-center justify-between bg-muted/30 rounded-xl p-3">
                <span className="text-sm text-muted-foreground">{isRu ? 'Интегральная оценка дня' : 'Integral day score'}</span>
                <div
                  className="px-3 py-1 rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: scoreColor(integralScore(selectedEntry)) }}
                >
                  {integralScore(selectedEntry)} / 5
                </div>
              </div>

              {selectedEntry.blockers.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground">{isRu ? 'Блокеры' : 'Blockers'}:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedEntry.blockers.map(b => (
                      <Badge key={b} variant="outline" className="text-xs border-red-500/30 text-red-400">{b}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedEntry.additionalNotes && (
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium">{isRu ? 'Заметки' : 'Notes'}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedEntry.additionalNotes}</p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handleEdit(selectedEntry)}>
                  <Edit3 className="w-3.5 h-3.5" />
                  {isRu ? 'Редактировать' : 'Edit'}
                </Button>
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => handlePublish(selectedEntry)}>
                  <Send className="w-3.5 h-3.5" />
                  {isRu ? 'Опубликовать' : 'Publish'}
                  <Star className="w-3 h-3 text-amber-400" />
                  <span className="text-xs">1</span>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Entry Dialog */}
      <Dialog open={!!editEntry} onOpenChange={() => setEditEntry(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isRu ? 'Редактировать запись' : 'Edit Entry'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{isRu ? 'Победа дня' : 'Victory of the Day'}</Label>
              <Textarea value={editVictory} onChange={e => setEditVictory(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="mt-1" />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setEditEntry(null)}>
                {isRu ? 'Отмена' : 'Cancel'}
              </Button>
              <Button onClick={handleSaveEdit}>
                {isRu ? 'Сохранить' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
