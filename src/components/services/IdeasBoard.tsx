import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb, Sparkles, Loader2, Trash2, Plus, ChevronDown, ChevronUp,
  Target, CheckSquare, Repeat, Wallet, User, Bell, Rocket, Pencil, History, Check,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useIdeas, Idea, IdeaAction, IdeaActionType, IDEA_CRITERIA } from '@/hooks/useIdeas';
import { cn } from '@/lib/utils';

const ACTION_META: Record<IdeaActionType, { icon: typeof Target; label: string }> = {
  goal: { icon: Target, label: 'Цель' },
  task: { icon: CheckSquare, label: 'Задача' },
  habit: { icon: Repeat, label: 'Привычка' },
  finance: { icon: Wallet, label: 'Финансы' },
  contact: { icon: User, label: 'Контакт' },
  note: { icon: Lightbulb, label: 'Заметка' },
};

const STATUS_META: Record<string, { label: string; className: string }> = {
  new: { label: 'Новая', className: 'bg-muted text-muted-foreground' },
  analyzed: { label: 'Оценена', className: 'bg-primary/15 text-primary' },
  in_progress: { label: 'В работе', className: 'bg-amber-500/15 text-amber-500' },
  approved: { label: 'Применена', className: 'bg-amber-500/15 text-amber-500' },
  completed: { label: 'Реализована', className: 'bg-success/15 text-success' },
  archived: { label: 'В архиве', className: 'bg-muted text-muted-foreground' },
};

const actionKey = (a: IdeaAction) => `${a.type}:${a.title}`;

function scoreTone(score: number) {
  if (score >= 70) return 'text-success';
  if (score >= 40) return 'text-primary';
  return 'text-destructive';
}

interface IdeaCardProps {
  idea: Idea;
  analyzingId: string | null;
  hook: ReturnType<typeof useIdeas>;
}

function IdeaCard({ idea, analyzingId, hook }: IdeaCardProps) {
  const { analyzeIdea, applyIdea, deleteIdea, editIdea, updateIdea, restoreAnalysis, saveReminderSettings } = hook;
  const [expanded, setExpanded] = useState(false);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [remindOpen, setRemindOpen] = useState(false);
  const [scoreOpen, setScoreOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  const [editTitle, setEditTitle] = useState(idea.title);
  const [editText, setEditText] = useState(idea.raw_text);
  const [editStatus, setEditStatus] = useState(idea.status || 'new');

  const [remEnabled, setRemEnabled] = useState(idea.reminder_enabled);
  const [remDays, setRemDays] = useState(String(idea.reminder_interval_days ?? 7));
  const [remTime, setRemTime] = useState((idea.reminder_time || '09:00').slice(0, 5));
  const [remChannel, setRemChannel] = useState(idea.reminder_channel || 'push');
  const [remNote, setRemNote] = useState(idea.reminder_note || '');

  const [criteria, setCriteria] = useState<string[]>(
    idea.analysis_result?.criteria?.length ? idea.analysis_result.criteria : [...IDEA_CRITERIA]
  );

  const analysis = idea.analysis_result;
  const isAnalyzing = analyzingId === idea.id;
  const actions = analysis?.suggested_actions || [];
  const appliedKeys = new Set(idea.applied_actions || []);
  const appliedCount = actions.filter((a) => appliedKeys.has(actionKey(a))).length;
  const progress = actions.length ? Math.round((appliedCount / actions.length) * 100) : 0;
  const status = STATUS_META[idea.status] || STATUS_META.new;

  const isChecked = (a: IdeaAction) => {
    const k = actionKey(a);
    if (appliedKeys.has(k)) return false;
    return selected[k] !== false;
  };

  const handleApply = async () => {
    const chosen = actions.filter((a) => isChecked(a));
    setApplying(true);
    await applyIdea(idea.id, chosen, chosen.map(actionKey));
    setApplying(false);
  };

  const handleSaveEdit = async () => {
    const ok = await editIdea(idea.id, editTitle.trim() || idea.title, editText.trim(), editStatus);
    if (ok) setEditOpen(false);
  };

  const handleSaveReminder = async () => {
    const ok = await saveReminderSettings(idea.id, {
      reminder_enabled: remEnabled,
      reminder_interval_days: Math.max(1, parseInt(remDays, 10) || 7),
      reminder_time: `${remTime}:00`,
      reminder_channel: remChannel,
      reminder_note: remNote.trim() || null,
    });
    if (ok) setRemindOpen(false);
  };

  const toggleCriterion = (c: string) =>
    setCriteria((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  const handleRecalc = async () => {
    setScoreOpen(false);
    await analyzeIdea(idea, criteria);
  };

  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Lightbulb className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-sm truncate">{idea.title}</h3>
            <Badge className={cn('text-[10px] border-0', status.className)}>{status.label}</Badge>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{idea.raw_text}</p>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditOpen(true)}>
          <Pencil className="w-4 h-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteIdea(idea.id)}>
          <Trash2 className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      {analysis && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Реалистичность</span>
            <span className={cn('font-semibold', scoreTone(analysis.realism_score))}>
              {analysis.realism_score}%
            </span>
          </div>
          <Progress value={analysis.realism_score} className="h-2" />
          {analysis.summary && (
            <p className="text-xs text-muted-foreground">{analysis.summary}</p>
          )}
        </div>
      )}

      {actions.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Реализация плана</span>
            <span className="font-semibold">{appliedCount}/{actions.length}</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!analysis ? (
          <Button size="sm" onClick={() => analyzeIdea(idea, criteria)} disabled={isAnalyzing} className="gap-1.5">
            {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Оценить идею
          </Button>
        ) : (
          <>
            <Button size="sm" variant="outline" onClick={() => setExpanded((v) => !v)} className="gap-1.5">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              Декомпозиция ({actions.length})
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setScoreOpen(true)} disabled={isAnalyzing} className="gap-1.5">
              {isAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Пересчитать оценку
            </Button>
            {idea.analysis_history?.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setHistoryOpen(true)} className="gap-1.5">
                <History className="w-3.5 h-3.5" />
                История ({idea.analysis_history.length})
              </Button>
            )}
          </>
        )}
        <Button size="sm" variant="ghost" onClick={() => setRemindOpen(true)} className="gap-1.5">
          <Bell className={cn('w-3.5 h-3.5', idea.reminder_enabled && 'text-primary')} />
          Напоминания
        </Button>
      </div>

      <AnimatePresence>
        {expanded && analysis && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden space-y-3"
          >
            {(analysis.pros?.length || analysis.risks?.length) && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="space-y-1">
                  {(analysis.pros || []).map((p, i) => (
                    <p key={i} className="text-success">+ {p}</p>
                  ))}
                </div>
                <div className="space-y-1">
                  {(analysis.risks || []).map((r, i) => (
                    <p key={i} className="text-destructive">− {r}</p>
                  ))}
                </div>
              </div>
            )}

            {analysis.first_step && (
              <div className="rounded-lg bg-muted/50 p-2.5 text-xs">
                <span className="text-muted-foreground">Первый шаг: </span>
                {analysis.first_step}
              </div>
            )}

            <div className="space-y-2">
              {actions.map((action, i) => {
                const meta = ACTION_META[action.type] || ACTION_META.note;
                const Icon = meta.icon;
                const k = actionKey(action);
                const applied = appliedKeys.has(k);
                return (
                  <div
                    key={i}
                    className={cn(
                      'flex items-start gap-2.5 rounded-lg border border-border p-2.5',
                      applied && 'opacity-70 bg-muted/40'
                    )}
                  >
                    {applied ? (
                      <Check className="w-4 h-4 text-success mt-0.5" />
                    ) : (
                      <Checkbox
                        checked={selected[k] !== false}
                        onCheckedChange={() => setSelected((p) => ({ ...p, [k]: p[k] === false }))}
                        className="mt-0.5"
                      />
                    )}
                    <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={cn('text-sm font-medium truncate', applied && 'line-through')}>
                          {action.title}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{meta.label}</Badge>
                        {applied && <Badge className="text-[10px] border-0 bg-success/15 text-success">Применено</Badge>}
                      </div>
                      {action.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={handleApply}
              disabled={applying || appliedCount === actions.length}
            >
              {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Rocket className="w-3.5 h-3.5" />}
              {appliedCount === actions.length ? 'Всё применено' : 'Применить выбранное в план'}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Редактировать идею</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Название" />
            <Textarea value={editText} onChange={(e) => setEditText(e.target.value)} rows={4} placeholder="Описание" />
            <div className="space-y-1.5">
              <Label className="text-xs">Статус</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_META).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>Отмена</Button>
            <Button onClick={handleSaveEdit}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder settings */}
      <Dialog open={remindOpen} onOpenChange={setRemindOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Напоминания по идее</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Включить напоминания</Label>
              <Switch checked={remEnabled} onCheckedChange={setRemEnabled} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Через сколько дней</Label>
                <Input type="number" min={1} value={remDays} onChange={(e) => setRemDays(e.target.value)} disabled={!remEnabled} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Время</Label>
                <Input type="time" value={remTime} onChange={(e) => setRemTime(e.target.value)} disabled={!remEnabled} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Канал</Label>
              <Select value={remChannel} onValueChange={setRemChannel} disabled={!remEnabled}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="push">Push-уведомление</SelectItem>
                  <SelectItem value="in_app">В приложении</SelectItem>
                  <SelectItem value="telegram">Telegram</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Текст напоминания</Label>
              <Textarea value={remNote} onChange={(e) => setRemNote(e.target.value)} rows={2} disabled={!remEnabled}
                placeholder="Например: вернуться к идее и оценить прогресс" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRemindOpen(false)}>Отмена</Button>
            <Button onClick={handleSaveReminder}>Сохранить</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recalculate score */}
      <Dialog open={scoreOpen} onOpenChange={setScoreOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Пересчёт оценки реалистичности</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground">
            Выберите критерии — ИИ пояснит плюсы и риски по каждому из них. Текущая оценка сохранится в истории.
          </p>
          <div className="space-y-2">
            {IDEA_CRITERIA.map((c) => (
              <label key={c} className="flex items-center gap-2.5 text-sm">
                <Checkbox checked={criteria.includes(c)} onCheckedChange={() => toggleCriterion(c)} />
                {c}
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setScoreOpen(false)}>Отмена</Button>
            <Button onClick={handleRecalc} disabled={!criteria.length} className="gap-1.5">
              <Sparkles className="w-4 h-4" />
              Пересчитать
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>История оценок</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {(idea.analysis_history || []).map((h, i) => (
              <Card key={i} className="p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {h.created_at ? new Date(h.created_at).toLocaleString('ru-RU') : `Вариант ${i + 1}`}
                  </span>
                  <span className={cn('font-semibold', scoreTone(h.realism_score))}>{h.realism_score}%</span>
                </div>
                {h.summary && <p className="text-xs text-muted-foreground">{h.summary}</p>}
                {h.criteria?.length && (
                  <div className="flex flex-wrap gap-1">
                    {h.criteria.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px]">{c}</Badge>
                    ))}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={async () => {
                    await restoreAnalysis(idea, i);
                    setHistoryOpen(false);
                  }}
                >
                  Сделать текущей
                </Button>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function IdeasBoard() {
  const hook = useIdeas();
  const { ideas, loading, createIdea, analyzingId } = hook;
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const created = await createIdea(title.trim(), text.trim() || title.trim());
    setSaving(false);
    if (created) {
      setTitle('');
      setText('');
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Новая идея</h2>
        </div>
        <Input
          placeholder="Название идеи"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <Textarea
          placeholder="Опишите идею: что, зачем, какой результат хотите получить"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
        />
        <Button onClick={handleCreate} disabled={!title.trim() || saving} className="w-full gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Сохранить идею
        </Button>
      </Card>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : ideas.length === 0 ? (
        <Card className="p-8 text-center space-y-2">
          <Lightbulb className="w-8 h-8 mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Пока нет идей. Запишите первую — оценим реалистичность и разложим на цели, задачи и привычки.
          </p>
        </Card>
      ) : (
        ideas.map((idea) => (
          <IdeaCard key={idea.id} idea={idea} analyzingId={analyzingId} hook={hook} />
        ))
      )}
    </div>
  );
}
