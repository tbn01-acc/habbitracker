import { useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Calendar, RefreshCw, Printer, Share2, Crown,
  Target, CheckSquare, Wallet, Clock, ChevronDown, ChevronUp,
  Circle, CheckCircle2, Tag, Layers
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useHabits, getCompletedReps, isFullyCompleted } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFinance } from '@/hooks/useFinance';
import { useSpheres } from '@/hooks/useSpheres';
import { useUserTags } from '@/hooks/useUserTags';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

type GroupBy = 'sphere' | 'type';

export default function DayPlanPage() {
  const { language } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const { user, loading } = useAuth();
  const { currentPlan, loading: subLoading } = useSubscription();
  const { habits } = useHabits();
  const { tasks } = useTasks();
  const { transactions } = useFinance();
  const { spheres } = useSpheres();
  const { tags: userTags } = useUserTags();
  const printRef = useRef<HTMLDivElement>(null);
  
  const isRussian = language === 'ru';
  const locale = isRussian ? ru : enUS;
  const isPro = currentPlan === 'pro';

  const [groupBy, setGroupBy] = useState<GroupBy>('type');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['habits', 'tasks', 'finance']));
  const [isExporting, setIsExporting] = useState(false);

  // Get the date to display (from params or today)
  const displayDate = useMemo(() => {
    if (dateParam) {
      try {
        return parseISO(dateParam);
      } catch {
        return new Date();
      }
    }
    return new Date();
  }, [dateParam]);

  const dateStr = format(displayDate, 'yyyy-MM-dd');
  const dayOfWeek = displayDate.getDay();
  const formattedDate = format(displayDate, "d MMMM yyyy, EEEE", { locale });

  // Get today's habits (scheduled for this day of week)
  const todayHabits = useMemo(() => {
    return habits
      .filter(h => h.targetDays.includes(dayOfWeek) && !h.archivedAt)
      .map(h => ({
        ...h,
        targetReps: h.targetRepsPerDay || 1,
        completedReps: getCompletedReps(h, dateStr),
        isCompleted: isFullyCompleted(h, dateStr),
      }));
  }, [habits, dayOfWeek, dateStr]);

  // Get today's tasks
  const todayTasks = useMemo(() => {
    return tasks.filter(t => t.dueDate === dateStr && !t.archivedAt);
  }, [tasks, dateStr]);

  // Get today's transactions
  const todayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === dateStr);
  }, [transactions, dateStr]);

  // Get sphere name helper
  const getSphereName = (sphereId?: number) => {
    if (!sphereId) return isRussian ? 'Без сферы' : 'No sphere';
    const sphere = spheres.find(s => s.id === sphereId);
    return sphere ? (isRussian ? sphere.name_ru : sphere.name_en) : '';
  };

  // Toggle section expand
  const toggleSection = (key: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Refresh handler
  const handleRefresh = () => {
    window.location.reload();
    toast.success(isRussian ? 'Обновлено!' : 'Refreshed!');
  };

  // Export to PDF with light theme and title
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    
    // Store original sections state
    const originalSections = new Set(expandedSections);
    
    // Expand all sections for PDF
    const allSections = new Set(['habits', 'tasks', 'finance']);
    setExpandedSections(allSections);
    
    // Temporarily force light theme on the print container
    const printContainer = printRef.current;
    const originalBackground = printContainer.style.backgroundColor;
    const originalColor = printContainer.style.color;
    printContainer.classList.add('force-light-theme');
    printContainer.style.backgroundColor = '#ffffff';
    printContainer.style.color = '#000000';
    
    // Also force light theme on all cards inside
    const cards = printContainer.querySelectorAll('.bg-background, [class*="bg-"]');
    const originalStyles: { el: Element; bg: string; color: string }[] = [];
    cards.forEach(card => {
      const el = card as HTMLElement;
      originalStyles.push({ el: card, bg: el.style.backgroundColor, color: el.style.color });
      el.style.backgroundColor = '#ffffff';
    });
    
    // Wait for sections to expand and styles to apply
    await new Promise(resolve => setTimeout(resolve, 150));
    
    try {
      const dataUrl = await toPng(printRef.current, { 
        quality: 1.0,
        backgroundColor: '#ffffff',
        style: {
          padding: '20px',
          color: '#000000',
        }
      });
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title and date header
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(isRussian ? 'План на день' : 'Day Plan', 10, 15);
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(formattedDate, 10, 22);
      
      const imgWidth = 190;
      const imgHeight = (printRef.current.offsetHeight * imgWidth) / printRef.current.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 10, 28, imgWidth, Math.min(imgHeight, 255));
      pdf.save(`day-plan-${dateStr}.pdf`);
      
      toast.success(isRussian ? 'PDF скачан!' : 'PDF downloaded!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(isRussian ? 'Ошибка экспорта' : 'Export failed');
    } finally {
      // Restore original styles
      printContainer.classList.remove('force-light-theme');
      printContainer.style.backgroundColor = originalBackground;
      printContainer.style.color = originalColor;
      originalStyles.forEach(({ el, bg, color }) => {
        (el as HTMLElement).style.backgroundColor = bg;
        (el as HTMLElement).style.color = color;
      });
      
      // Restore original sections state
      setExpandedSections(originalSections);
      setIsExporting(false);
    }
  };

  // Share handler
  const handleShare = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    
    try {
      const dataUrl = await toPng(printRef.current, {
        quality: 0.95,
        backgroundColor: '#ffffff'
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `day-plan-${dateStr}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: isRussian ? 'План на день' : 'Day Plan',
          text: formattedDate
        });
      } else {
        // Fallback: download as image
        const link = document.createElement('a');
        link.download = `day-plan-${dateStr}.png`;
        link.href = dataUrl;
        link.click();
        toast.success(isRussian ? 'Изображение скачано!' : 'Image downloaded!');
      }
    } catch (error) {
      console.error('Share error:', error);
      toast.error(isRussian ? 'Ошибка' : 'Error');
    } finally {
      setIsExporting(false);
    }
  };

  if (loading || subLoading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {isRussian ? 'Загрузка...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/profile');
    return null;
  }

  // Demo data for non-PRO users
  const demoHabits = [
    { id: 'demo-1', name: isRussian ? 'Утренняя зарядка' : 'Morning workout', icon: '🏃', targetReps: 1, completedReps: 0, isCompleted: false, sphereId: 1 },
    { id: 'demo-2', name: isRussian ? 'Чтение книги' : 'Read a book', icon: '📚', targetReps: 1, completedReps: 1, isCompleted: true, sphereId: 2 },
    { id: 'demo-3', name: isRussian ? 'Медитация' : 'Meditation', icon: '🧘', targetReps: 2, completedReps: 1, isCompleted: false, sphereId: 1 },
  ];
  
  const demoTasks = [
    { id: 'demo-t1', name: isRussian ? 'Подготовить отчёт' : 'Prepare report', icon: '📊', priority: 'high' as const, completed: false, subtasks: [
      { id: 'st1', name: isRussian ? 'Собрать данные' : 'Collect data', completed: true },
      { id: 'st2', name: isRussian ? 'Написать выводы' : 'Write conclusions', completed: false },
    ]},
    { id: 'demo-t2', name: isRussian ? 'Позвонить клиенту' : 'Call client', icon: '📞', priority: 'medium' as const, completed: true, subtasks: [] },
  ];
  
  const demoTransactions = [
    { id: 'demo-tx1', name: isRussian ? 'Зарплата' : 'Salary', type: 'income' as const, amount: 50000, completed: true },
    { id: 'demo-tx2', name: isRussian ? 'Продукты' : 'Groceries', type: 'expense' as const, amount: 3500, completed: false },
  ];

  // PRO gate - show demo for non-PRO users
  if (!isPro) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  {isRussian ? 'План на день' : 'Day Plan'}
                </h1>
                <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* PRO Banner */}
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 mb-4">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Crown className="w-6 h-6 text-amber-500" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">
                  {isRussian ? 'Это демо-версия' : 'This is a demo'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isRussian 
                    ? 'Полный функционал доступен только для PRO-пользователей'
                    : 'Full functionality is available only for PRO users'}
                </p>
              </div>
              <Button onClick={() => navigate('/upgrade')} size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 shrink-0">
                <Crown className="w-4 h-4 mr-1" />
                PRO
              </Button>
            </CardContent>
          </Card>

          {/* Demo Content with blur overlay */}
          <div className="relative">
            <div className="opacity-60 pointer-events-none">
              {/* Demo Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card className="border-habit/30 bg-habit/5">
                  <CardContent className="p-3 text-center">
                    <Target className="w-5 h-5 mx-auto text-habit mb-1" />
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-muted-foreground">{isRussian ? 'Привычек' : 'Habits'}</p>
                  </CardContent>
                </Card>
                <Card className="border-task/30 bg-task/5">
                  <CardContent className="p-3 text-center">
                    <CheckSquare className="w-5 h-5 mx-auto text-task mb-1" />
                    <p className="text-2xl font-bold">2</p>
                    <p className="text-xs text-muted-foreground">{isRussian ? 'Задач' : 'Tasks'}</p>
                  </CardContent>
                </Card>
                <Card className="border-finance/30 bg-finance/5">
                  <CardContent className="p-3 text-center">
                    <Wallet className="w-5 h-5 mx-auto text-finance mb-1" />
                    <p className="text-2xl font-bold">2</p>
                    <p className="text-xs text-muted-foreground">{isRussian ? 'Операций' : 'Operations'}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Demo Habits */}
              <Card className="border-habit/30 mb-3">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="w-5 h-5 text-habit" />
                    {isRussian ? 'Привычки' : 'Habits'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {demoHabits.map(h => (
                    <div key={h.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      {h.isCompleted ? <CheckCircle2 className="w-5 h-5 text-green-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                      <span className="text-lg">{h.icon}</span>
                      <span className={cn("flex-1", h.isCompleted && "line-through text-muted-foreground")}>{h.name}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Demo Tasks */}
              <Card className="border-task/30 mb-3">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckSquare className="w-5 h-5 text-task" />
                    {isRussian ? 'Задачи' : 'Tasks'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {demoTasks.map(t => (
                    <div key={t.id} className="py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center gap-3">
                        {t.completed ? <CheckCircle2 className="w-5 h-5 text-blue-500" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                        <span className="text-lg">{t.icon}</span>
                        <span className={cn("flex-1", t.completed && "line-through text-muted-foreground")}>{t.name}</span>
                      </div>
                      {t.subtasks.length > 0 && (
                        <div className="ml-10 mt-2 space-y-1">
                          {t.subtasks.map(st => (
                            <div key={st.id} className="flex items-center gap-2 text-sm">
                              {st.completed ? <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" /> : <Circle className="w-3.5 h-3.5 text-muted-foreground" />}
                              <span className={cn(st.completed && "line-through text-muted-foreground")}>{st.name}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Demo Transactions */}
              <Card className="border-finance/30">
                <CardHeader className="py-3 px-4">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wallet className="w-5 h-5 text-finance" />
                    {isRussian ? 'Финансы' : 'Finance'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  {demoTransactions.map(tx => (
                    <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      {tx.completed ? <CheckCircle2 className="w-5 h-5 text-finance" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                      <span className="flex-1">{tx.name}</span>
                      <span className={tx.type === 'income' ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}₽
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Group items by sphere
  const groupBySphere = () => {
    const groups: Record<string, { habits: typeof todayHabits; tasks: typeof todayTasks; transactions: typeof todayTransactions }> = {};
    
    todayHabits.forEach(h => {
      const key = h.sphereId?.toString() || 'none';
      if (!groups[key]) groups[key] = { habits: [], tasks: [], transactions: [] };
      groups[key].habits.push(h);
    });
    
    todayTasks.forEach(t => {
      const key = (t as any).sphereId?.toString() || 'none';
      if (!groups[key]) groups[key] = { habits: [], tasks: [], transactions: [] };
      groups[key].tasks.push(t);
    });
    
    todayTransactions.forEach(t => {
      const key = (t as any).sphereId?.toString() || 'none';
      if (!groups[key]) groups[key] = { habits: [], tasks: [], transactions: [] };
      groups[key].transactions.push(t);
    });
    
    return groups;
  };

  // Render habit item
  const renderHabitItem = (habit: typeof todayHabits[0]) => (
    <div key={habit.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      {habit.isCompleted ? (
        <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
      )}
      <span className="text-lg">{habit.icon}</span>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate", habit.isCompleted && "line-through text-muted-foreground")}>
          {habit.name}
        </p>
        {habit.targetReps > 1 && (
          <p className="text-xs text-muted-foreground">
            {habit.completedReps} / {habit.targetReps} {isRussian ? 'повторений' : 'reps'}
          </p>
        )}
      </div>
      {habit.sphereId && (
        <Badge variant="outline" className="text-xs shrink-0">
          {getSphereName(habit.sphereId)}
        </Badge>
      )}
    </div>
  );

  // Render task item with subtasks
  const renderTaskItem = (task: typeof todayTasks[0]) => (
    <div key={task.id} className="py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        {task.completed ? (
          <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
        )}
        <span className="text-lg">{task.icon}</span>
        <div className="flex-1 min-w-0">
          <p className={cn("font-medium truncate", task.completed && "line-through text-muted-foreground")}>
            {task.name}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={cn(
            "text-xs shrink-0",
            task.priority === 'high' && "border-red-500 text-red-500",
            task.priority === 'medium' && "border-amber-500 text-amber-500"
          )}
        >
          {task.priority === 'high' ? '!' : task.priority === 'medium' ? '!!' : ''}
          {isRussian ? (task.priority === 'high' ? 'Высокий' : task.priority === 'medium' ? 'Средний' : 'Низкий') : task.priority}
        </Badge>
      </div>
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="ml-10 mt-2 space-y-1">
          {task.subtasks.map((st: any) => (
            <div key={st.id} className="flex items-center gap-2 text-sm">
              {st.completed ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-muted-foreground" />
              )}
              <span className={cn(st.completed && "line-through text-muted-foreground")}>
                {st.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render transaction item
  const renderTransactionItem = (tx: typeof todayTransactions[0]) => (
    <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      {tx.completed ? (
        <CheckCircle2 className="w-5 h-5 text-finance shrink-0" />
      ) : (
        <Circle className="w-5 h-5 text-muted-foreground shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate", tx.completed && "text-muted-foreground")}>
          {tx.name}
        </p>
      </div>
      <span className={cn(
        "font-bold",
        tx.type === 'income' ? "text-green-500" : "text-red-500"
      )}>
        {tx.type === 'income' ? '+' : '-'}{tx.amount.toLocaleString()}₽
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header with Actions */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'План на день' : 'Day Plan'}
              </h1>
              <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
            </div>
          </div>
          
          {/* Actions - vertical in header section */}
          <div className="flex flex-col gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-8 w-8">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isRussian ? 'Обновить' : 'Refresh'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleExportPDF} disabled={isExporting} className="h-8 w-8">
                  <Printer className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isRussian ? 'Печать' : 'Print'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleShare} disabled={isExporting} className="h-8 w-8">
                  <Share2 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isRussian ? 'Поделиться' : 'Share'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Group by selector */}
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {isRussian ? 'Группировать:' : 'Group by:'}
          </span>
          <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
            <SelectTrigger className="w-40 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type">{isRussian ? 'По типу' : 'By type'}</SelectItem>
              <SelectItem value="sphere">{isRussian ? 'По сфере' : 'By sphere'}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Printable content */}
        <div ref={printRef} className="space-y-4 bg-background">
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-habit/30 bg-habit/5">
              <CardContent className="p-3 text-center">
                <Target className="w-5 h-5 mx-auto text-habit mb-1" />
                <p className="text-2xl font-bold">{todayHabits.length}</p>
                <p className="text-xs text-muted-foreground">{isRussian ? 'Привычек' : 'Habits'}</p>
              </CardContent>
            </Card>
            <Card className="border-task/30 bg-task/5">
              <CardContent className="p-3 text-center">
                <CheckSquare className="w-5 h-5 mx-auto text-task mb-1" />
                <p className="text-2xl font-bold">{todayTasks.length}</p>
                <p className="text-xs text-muted-foreground">{isRussian ? 'Задач' : 'Tasks'}</p>
              </CardContent>
            </Card>
            <Card className="border-finance/30 bg-finance/5">
              <CardContent className="p-3 text-center">
                <Wallet className="w-5 h-5 mx-auto text-finance mb-1" />
                <p className="text-2xl font-bold">{todayTransactions.length}</p>
                <p className="text-xs text-muted-foreground">{isRussian ? 'Операций' : 'Operations'}</p>
              </CardContent>
            </Card>
          </div>

          {/* Grouped content - by type */}
          {groupBy === 'type' && (
            <>
              {/* Habits section */}
              {todayHabits.length > 0 && (
                <Collapsible open={expandedSections.has('habits')} onOpenChange={() => toggleSection('habits')}>
                  <Card className="border-habit/30">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-habit" />
                            <CardTitle className="text-base">{isRussian ? 'Привычки' : 'Habits'}</CardTitle>
                            <Badge variant="secondary" className="ml-2">{todayHabits.length}</Badge>
                          </div>
                          {expandedSections.has('habits') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {todayHabits.map(renderHabitItem)}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Tasks section */}
              {todayTasks.length > 0 && (
                <Collapsible open={expandedSections.has('tasks')} onOpenChange={() => toggleSection('tasks')}>
                  <Card className="border-task/30">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CheckSquare className="w-5 h-5 text-task" />
                            <CardTitle className="text-base">{isRussian ? 'Задачи' : 'Tasks'}</CardTitle>
                            <Badge variant="secondary" className="ml-2">{todayTasks.length}</Badge>
                          </div>
                          {expandedSections.has('tasks') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {todayTasks
                          .sort((a, b) => {
                            // Sort by priority
                            const priorityOrder = { high: 0, medium: 1, low: 2 };
                            return priorityOrder[a.priority] - priorityOrder[b.priority];
                          })
                          .map(renderTaskItem)}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Transactions section */}
              {todayTransactions.length > 0 && (
                <Collapsible open={expandedSections.has('finance')} onOpenChange={() => toggleSection('finance')}>
                  <Card className="border-finance/30">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-finance" />
                            <CardTitle className="text-base">{isRussian ? 'Финансы' : 'Finance'}</CardTitle>
                            <Badge variant="secondary" className="ml-2">{todayTransactions.length}</Badge>
                          </div>
                          {expandedSections.has('finance') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0">
                        {todayTransactions.map(renderTransactionItem)}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
            </>
          )}

          {/* Grouped by sphere */}
          {groupBy === 'sphere' && (
            <>
              {Object.entries(groupBySphere()).map(([sphereId, items]) => {
                const sphereName = sphereId === 'none' ? (isRussian ? 'Без сферы' : 'No sphere') : getSphereName(parseInt(sphereId));
                const totalItems = items.habits.length + items.tasks.length + items.transactions.length;
                if (totalItems === 0) return null;
                
                return (
                  <Collapsible key={sphereId} open={expandedSections.has(sphereId)} onOpenChange={() => toggleSection(sphereId)}>
                    <Card>
                      <CollapsibleTrigger asChild>
                        <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors py-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{sphereName}</CardTitle>
                              <Badge variant="secondary">{totalItems}</Badge>
                            </div>
                            {expandedSections.has(sphereId) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </CardHeader>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="pt-0 space-y-3">
                          {items.habits.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <Target className="w-3 h-3" /> {isRussian ? 'Привычки' : 'Habits'}
                              </p>
                              {items.habits.map(renderHabitItem)}
                            </div>
                          )}
                          {items.tasks.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <CheckSquare className="w-3 h-3" /> {isRussian ? 'Задачи' : 'Tasks'}
                              </p>
                              {items.tasks.map(renderTaskItem)}
                            </div>
                          )}
                          {items.transactions.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                                <Wallet className="w-3 h-3" /> {isRussian ? 'Операции' : 'Operations'}
                              </p>
                              {items.transactions.map(renderTransactionItem)}
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                );
              })}
            </>
          )}

          {/* Empty state */}
          {todayHabits.length === 0 && todayTasks.length === 0 && todayTransactions.length === 0 && (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{isRussian ? 'На этот день ничего не запланировано' : 'Nothing planned for this day'}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
