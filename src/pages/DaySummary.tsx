import { useState, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, BarChart3, Printer, Share2, Crown,
  Target, CheckSquare, Wallet, Clock, ChevronDown, ChevronUp,
  Circle, CheckCircle2, XCircle, PauseCircle, Layers, TrendingUp, RefreshCw
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { format, parseISO } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { useHabits, getCompletedReps, isFullyCompleted } from '@/hooks/useHabits';
import { useTasks } from '@/hooks/useTasks';
import { useFinance } from '@/hooks/useFinance';
import { useSpheres } from '@/hooks/useSpheres';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

type GroupBy = 'status' | 'type' | 'sphere';

export default function DaySummaryPage() {
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
  const printRef = useRef<HTMLDivElement>(null);
  
  const isRussian = language === 'ru';
  const locale = isRussian ? ru : enUS;
  const isPro = currentPlan === 'pro';

  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['completed', 'incomplete', 'postponed']));
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

  // Get today's habits with status
  const todayHabits = useMemo(() => {
    return habits
      .filter(h => h.targetDays.includes(dayOfWeek) && !h.archivedAt)
      .map(h => ({
        ...h,
        targetReps: h.targetRepsPerDay || 1,
        completedReps: getCompletedReps(h, dateStr),
        isCompleted: isFullyCompleted(h, dateStr),
        isPostponed: h.postponedUntil && h.postponedUntil > dateStr,
      }));
  }, [habits, dayOfWeek, dateStr]);

  // Get today's tasks with status
  const todayTasks = useMemo(() => {
    return tasks
      .filter(t => t.dueDate === dateStr && !t.archivedAt)
      .map(t => ({
        ...t,
        isPostponed: t.postponedUntil && t.postponedUntil > dateStr,
      }));
  }, [tasks, dateStr]);

  // Get today's transactions with status
  const todayTransactions = useMemo(() => {
    return transactions.filter(t => t.date === dateStr);
  }, [transactions, dateStr]);

  // Calculate stats
  const stats = useMemo(() => {
    const habitsCompleted = todayHabits.filter(h => h.isCompleted).length;
    const habitsIncomplete = todayHabits.filter(h => !h.isCompleted && !h.isPostponed).length;
    const habitsPostponed = todayHabits.filter(h => h.isPostponed).length;

    const tasksCompleted = todayTasks.filter(t => t.completed).length;
    const tasksIncomplete = todayTasks.filter(t => !t.completed && !t.isPostponed).length;
    const tasksPostponed = todayTasks.filter(t => t.isPostponed).length;

    const txCompleted = todayTransactions.filter(t => t.completed).length;
    const txIncomplete = todayTransactions.filter(t => !t.completed).length;

    const totalItems = todayHabits.length + todayTasks.length + todayTransactions.length;
    const completedItems = habitsCompleted + tasksCompleted + txCompleted;
    const incompleteItems = habitsIncomplete + tasksIncomplete + txIncomplete;
    const postponedItems = habitsPostponed + tasksPostponed;

    // Calculate productivity score (0-100)
    const productivityScore = totalItems > 0 
      ? Math.round((completedItems / totalItems) * 100)
      : 0;

    return {
      habitsCompleted, habitsIncomplete, habitsPostponed,
      tasksCompleted, tasksIncomplete, tasksPostponed,
      txCompleted, txIncomplete,
      totalItems, completedItems, incompleteItems, postponedItems,
      productivityScore
    };
  }, [todayHabits, todayTasks, todayTransactions]);

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

  // Export to PDF with light theme, title and all groups expanded
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    
    const prevGroupBy = groupBy;
    const originalSections = new Set(expandedSections);
    
    setGroupBy('status');
    
    const allSections = new Set(['completed', 'incomplete', 'postponed']);
    setExpandedSections(allSections);
    
    const printContainer = printRef.current;
    const originalBackground = printContainer.style.backgroundColor;
    const originalColor = printContainer.style.color;
    printContainer.classList.add('force-light-theme');
    printContainer.style.backgroundColor = '#ffffff';
    printContainer.style.color = '#000000';
    
    const cards = printContainer.querySelectorAll('.bg-background, [class*="bg-"]');
    const originalStyles: { el: Element; bg: string; color: string }[] = [];
    cards.forEach(card => {
      const el = card as HTMLElement;
      originalStyles.push({ el: card, bg: el.style.backgroundColor, color: el.style.color });
      el.style.backgroundColor = '#ffffff';
    });
    
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
      
      pdf.setFontSize(18);
      pdf.setTextColor(0, 0, 0);
      pdf.text(isRussian ? 'Итоги дня' : 'Day Summary', 10, 15);
      pdf.setFontSize(12);
      pdf.setTextColor(100, 100, 100);
      pdf.text(formattedDate, 10, 22);
      
      const imgWidth = 190;
      const imgHeight = (printRef.current.offsetHeight * imgWidth) / printRef.current.offsetWidth;
      
      pdf.addImage(dataUrl, 'PNG', 10, 28, imgWidth, Math.min(imgHeight, 255));
      pdf.save(`day-summary-${dateStr}.pdf`);
      
      toast.success(isRussian ? 'PDF скачан!' : 'PDF downloaded!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error(isRussian ? 'Ошибка экспорта' : 'Export failed');
    } finally {
      printContainer.classList.remove('force-light-theme');
      printContainer.style.backgroundColor = originalBackground;
      printContainer.style.color = originalColor;
      originalStyles.forEach(({ el, bg, color }) => {
        (el as HTMLElement).style.backgroundColor = bg;
        (el as HTMLElement).style.color = color;
      });
      
      setExpandedSections(originalSections);
      setGroupBy(prevGroupBy);
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
      const file = new File([blob], `day-summary-${dateStr}.png`, { type: 'image/png' });
      
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: isRussian ? 'Итоги дня' : 'Day Summary',
          text: formattedDate
        });
      } else {
        const link = document.createElement('a');
        link.download = `day-summary-${dateStr}.png`;
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

  // Get productivity color
  const getProductivityColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-lime-500';
    if (score >= 40) return 'text-amber-500';
    if (score >= 20) return 'text-orange-500';
    return 'text-red-500';
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
  const demoStats = {
    totalItems: 7, completedItems: 4, incompleteItems: 2, postponedItems: 1,
    productivityScore: 57
  };

  // PRO gate - show demo for non-PRO users
  if (!isPro) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-2 py-2">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">
                  {isRussian ? 'Итоги дня' : 'Day Summary'}
                </h1>
                <p className="text-xs text-muted-foreground capitalize">{formattedDate}</p>
              </div>
            </div>
          </div>

          {/* PRO Banner */}
          <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-yellow-500/5 mb-2">
            <CardContent className="p-2 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-foreground">
                  {isRussian ? 'Это демо-версия' : 'This is a demo'}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {isRussian 
                    ? 'Полный функционал доступен для PRO'
                    : 'Full functionality for PRO users'}
                </p>
              </div>
              <Button onClick={() => navigate('/upgrade')} size="sm" className="bg-gradient-to-r from-amber-500 to-yellow-500 shrink-0 h-7 text-xs">
                <Crown className="w-3 h-3 mr-1" />
                PRO
              </Button>
            </CardContent>
          </Card>

          {/* Demo Content with blur overlay */}
          <div className="relative">
            <div className="opacity-60 pointer-events-none">
              {/* Demo Productivity Score */}
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 mb-2">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {isRussian ? 'Моя продуктивность за день' : 'My productivity for the day'}
                      </p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-amber-500">57</span>
                        <span className="text-xl text-muted-foreground">/100</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Demo Stats - 2 per row */}
              <div className="grid grid-cols-2 gap-2 mb-2">
                <Card>
                  <CardContent className="p-2 text-center">
                    <p className="text-xl font-bold">{demoStats.totalItems}</p>
                    <p className="text-[10px] text-muted-foreground">{isRussian ? 'Всего' : 'Total'}</p>
                  </CardContent>
                </Card>
                <Card className="border-green-500/30 bg-green-500/5">
                  <CardContent className="p-2 text-center">
                    <p className="text-xl font-bold text-green-500">{demoStats.completedItems}</p>
                    <p className="text-[10px] text-muted-foreground">{isRussian ? 'Выполнено' : 'Done'}</p>
                  </CardContent>
                </Card>
                <Card className="border-red-500/30 bg-red-500/5">
                  <CardContent className="p-2 text-center">
                    <p className="text-xl font-bold text-red-500">{demoStats.incompleteItems}</p>
                    <p className="text-[10px] text-muted-foreground">{isRussian ? 'Не выполнено' : 'Incomplete'}</p>
                  </CardContent>
                </Card>
                <Card className="border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-2 text-center">
                    <p className="text-xl font-bold text-amber-500">{demoStats.postponedItems}</p>
                    <p className="text-[10px] text-muted-foreground">{isRussian ? 'Отложено' : 'Postponed'}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render item with status icon
  const renderItem = (
    item: { id: string; name: string; icon?: string },
    status: 'completed' | 'incomplete' | 'postponed',
    type: 'habit' | 'task' | 'transaction',
    extra?: React.ReactNode
  ) => (
    <div key={item.id} className="flex items-center gap-2 py-1.5 border-b border-border/50 last:border-0">
      {status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />}
      {status === 'incomplete' && <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
      {status === 'postponed' && <PauseCircle className="w-4 h-4 text-amber-500 shrink-0" />}
      {item.icon && <span className="text-sm">{item.icon}</span>}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", status === 'completed' && "line-through text-muted-foreground")}>
          {item.name}
        </p>
      </div>
      {extra}
      <Badge 
        variant="outline" 
        className={cn(
          "text-[10px] shrink-0",
          type === 'habit' && "border-habit text-habit",
          type === 'task' && "border-task text-task",
          type === 'transaction' && "border-finance text-finance"
        )}
      >
        {type === 'habit' ? (isRussian ? 'Привычка' : 'Habit') :
         type === 'task' ? (isRussian ? 'Задача' : 'Task') :
         (isRussian ? 'Операция' : 'Transaction')}
      </Badge>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-2 py-2">
        {/* Header with Actions */}
        <div className="flex items-center gap-2 mb-2">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                {isRussian ? 'Итоги дня' : 'Day Summary'}
              </h1>
              <p className="text-xs text-muted-foreground capitalize">{formattedDate}</p>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleRefresh} className="h-7 w-7">
                  <RefreshCw className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isRussian ? 'Обновить' : 'Refresh'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleExportPDF} disabled={isExporting} className="h-7 w-7">
                  <Printer className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isRussian ? 'Печать' : 'Print'}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleShare} disabled={isExporting} className="h-7 w-7">
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isRussian ? 'Поделиться' : 'Share'}
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Printable content */}
        <div ref={printRef} className="space-y-2 bg-background">
          {/* Productivity Score - replaced circular indicator with text */}
          <Card className="border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {isRussian ? 'Моя продуктивность за день' : 'My productivity for the day'}
                </p>
                <div className="flex items-baseline gap-0.5">
                  <span className={cn("text-2xl font-bold", getProductivityColor(stats.productivityScore))}>
                    {stats.productivityScore}
                  </span>
                  <span className="text-sm text-muted-foreground">/100</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats - 2 per row with animations */}
          <div className="grid grid-cols-2 gap-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Card className="w-full">
                <CardContent className="p-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{isRussian ? 'Всего' : 'Total'}</span>
                  <p className="text-xl font-bold">{stats.totalItems}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
            >
              <Card className="w-full border-green-500/30 bg-green-500/5">
                <CardContent className="p-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{isRussian ? 'Выполнено' : 'Done'}</span>
                  <p className="text-xl font-bold text-green-500">{stats.completedItems}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <Card className="w-full border-red-500/30 bg-red-500/5">
                <CardContent className="p-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{isRussian ? 'Не выполнено' : 'Incomplete'}</span>
                  <p className="text-xl font-bold text-red-500">{stats.incompleteItems}</p>
                </CardContent>
              </Card>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.25 }}
            >
              <Card className="w-full border-amber-500/30 bg-amber-500/5">
                <CardContent className="p-2 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{isRussian ? 'Отложено' : 'Postponed'}</span>
                  <p className="text-xl font-bold text-amber-500">{stats.postponedItems}</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Detailed breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <Card className="border-habit/30">
              <CardContent className="p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Target className="w-3 h-3 text-habit" />
                  <span className="text-xs font-medium">{isRussian ? 'Привычки' : 'Habits'}</span>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-green-500">✓ {stats.habitsCompleted}</span>
                    <span className="text-red-500">✗ {stats.habitsIncomplete}</span>
                    <span className="text-amber-500">⏸ {stats.habitsPostponed}</span>
                  </div>
                  <Progress value={(stats.habitsCompleted / (todayHabits.length || 1)) * 100} className="h-1" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-task/30">
              <CardContent className="p-2">
                <div className="flex items-center gap-1 mb-1">
                  <CheckSquare className="w-3 h-3 text-task" />
                  <span className="text-xs font-medium">{isRussian ? 'Задачи' : 'Tasks'}</span>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-green-500">✓ {stats.tasksCompleted}</span>
                    <span className="text-red-500">✗ {stats.tasksIncomplete}</span>
                    <span className="text-amber-500">⏸ {stats.tasksPostponed}</span>
                  </div>
                  <Progress value={(stats.tasksCompleted / (todayTasks.length || 1)) * 100} className="h-1" />
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-finance/30">
              <CardContent className="p-2">
                <div className="flex items-center gap-1 mb-1">
                  <Wallet className="w-3 h-3 text-finance" />
                  <span className="text-xs font-medium">{isRussian ? 'Финансы' : 'Finance'}</span>
                </div>
                <div className="space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span className="text-green-500">✓ {stats.txCompleted}</span>
                    <span className="text-red-500">✗ {stats.txIncomplete}</span>
                  </div>
                  <Progress value={(stats.txCompleted / (todayTransactions.length || 1)) * 100} className="h-1" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Group By Selector */}
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{isRussian ? 'Группировка:' : 'Group by:'}</span>
            <Select value={groupBy} onValueChange={(v: GroupBy) => setGroupBy(v)}>
              <SelectTrigger className="h-7 text-xs w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="status">{isRussian ? 'По статусу' : 'By status'}</SelectItem>
                <SelectItem value="type">{isRussian ? 'По типу' : 'By type'}</SelectItem>
                <SelectItem value="sphere">{isRussian ? 'По сфере' : 'By sphere'}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Empty state */}
          {stats.totalItems === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <Circle className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground text-sm">
                  {isRussian ? 'На этот день нет запланированных дел' : 'No items scheduled for this day'}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Grouped sections by status */}
          {groupBy === 'status' && stats.totalItems > 0 && (
            <div className="space-y-2">
              {/* Completed */}
              {stats.completedItems > 0 && (
                <Collapsible open={expandedSections.has('completed')} onOpenChange={() => toggleSection('completed')}>
                  <Card className="border-green-500/30">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between text-sm text-green-500">
                          <span className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {isRussian ? 'Выполнено' : 'Completed'} ({stats.completedItems})
                          </span>
                          {expandedSections.has('completed') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-3 pb-2 pt-0">
                        {todayHabits.filter(h => h.isCompleted).map(h => renderItem(h, 'completed', 'habit'))}
                        {todayTasks.filter(t => t.completed).map(t => renderItem(t, 'completed', 'task'))}
                        {todayTransactions.filter(t => t.completed).map(t => renderItem(t, 'completed', 'transaction'))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Incomplete */}
              {stats.incompleteItems > 0 && (
                <Collapsible open={expandedSections.has('incomplete')} onOpenChange={() => toggleSection('incomplete')}>
                  <Card className="border-red-500/30">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between text-sm text-red-500">
                          <span className="flex items-center gap-2">
                            <XCircle className="w-4 h-4" />
                            {isRussian ? 'Не выполнено' : 'Incomplete'} ({stats.incompleteItems})
                          </span>
                          {expandedSections.has('incomplete') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-3 pb-2 pt-0">
                        {todayHabits.filter(h => !h.isCompleted && !h.isPostponed).map(h => renderItem(h, 'incomplete', 'habit'))}
                        {todayTasks.filter(t => !t.completed && !t.isPostponed).map(t => renderItem(t, 'incomplete', 'task'))}
                        {todayTransactions.filter(t => !t.completed).map(t => renderItem(t, 'incomplete', 'transaction'))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Postponed */}
              {stats.postponedItems > 0 && (
                <Collapsible open={expandedSections.has('postponed')} onOpenChange={() => toggleSection('postponed')}>
                  <Card className="border-amber-500/30">
                    <CollapsibleTrigger asChild>
                      <CardHeader className="py-2 px-3 cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between text-sm text-amber-500">
                          <span className="flex items-center gap-2">
                            <PauseCircle className="w-4 h-4" />
                            {isRussian ? 'Отложено' : 'Postponed'} ({stats.postponedItems})
                          </span>
                          {expandedSections.has('postponed') ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="px-3 pb-2 pt-0">
                        {todayHabits.filter(h => h.isPostponed).map(h => renderItem(h, 'postponed', 'habit'))}
                        {todayTasks.filter(t => t.isPostponed).map(t => renderItem(t, 'postponed', 'task'))}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
            </div>
          )}

          {/* Grouped by type */}
          {groupBy === 'type' && stats.totalItems > 0 && (
            <div className="space-y-2">
              {todayHabits.length > 0 && (
                <Card className="border-habit/30">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="flex items-center gap-2 text-sm text-habit">
                      <Target className="w-4 h-4" />
                      {isRussian ? 'Привычки' : 'Habits'} ({todayHabits.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-2 pt-0">
                    {todayHabits.map(h => renderItem(h, h.isCompleted ? 'completed' : h.isPostponed ? 'postponed' : 'incomplete', 'habit'))}
                  </CardContent>
                </Card>
              )}

              {todayTasks.length > 0 && (
                <Card className="border-task/30">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="flex items-center gap-2 text-sm text-task">
                      <CheckSquare className="w-4 h-4" />
                      {isRussian ? 'Задачи' : 'Tasks'} ({todayTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-2 pt-0">
                    {todayTasks.map(t => renderItem(t, t.completed ? 'completed' : t.isPostponed ? 'postponed' : 'incomplete', 'task'))}
                  </CardContent>
                </Card>
              )}

              {todayTransactions.length > 0 && (
                <Card className="border-finance/30">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="flex items-center gap-2 text-sm text-finance">
                      <Wallet className="w-4 h-4" />
                      {isRussian ? 'Операции' : 'Transactions'} ({todayTransactions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-2 pt-0">
                    {todayTransactions.map(t => renderItem(t, t.completed ? 'completed' : 'incomplete', 'transaction'))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Grouped by sphere */}
          {groupBy === 'sphere' && stats.totalItems > 0 && (
            <div className="space-y-2">
              {Array.from(new Set([
                ...todayHabits.map(h => h.sphereId),
                ...todayTasks.map(t => (t as any).sphereId),
              ])).map(sphereId => {
                const sphereHabits = todayHabits.filter(h => h.sphereId === sphereId);
                const sphereTasks = todayTasks.filter(t => (t as any).sphereId === sphereId);
                const count = sphereHabits.length + sphereTasks.length;
                if (count === 0) return null;
                
                const sphere = spheres.find(s => s.id === sphereId);

                return (
                  <Card key={sphereId || 'none'} style={sphere ? { borderColor: `${sphere.color}40` } : undefined}>
                    <CardHeader className="py-2 px-3">
                      <CardTitle className="flex items-center gap-2 text-sm" style={sphere ? { color: sphere.color } : undefined}>
                        {sphere?.icon && <span>{sphere.icon}</span>}
                        {getSphereName(sphereId)} ({count})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-3 pb-2 pt-0">
                      {sphereHabits.map(h => renderItem(h, h.isCompleted ? 'completed' : h.isPostponed ? 'postponed' : 'incomplete', 'habit'))}
                      {sphereTasks.map(t => renderItem(t, t.completed ? 'completed' : t.isPostponed ? 'postponed' : 'incomplete', 'task'))}
                    </CardContent>
                  </Card>
                );
              })}

              {/* Transactions without sphere */}
              {todayTransactions.length > 0 && (
                <Card className="border-finance/30">
                  <CardHeader className="py-2 px-3">
                    <CardTitle className="flex items-center gap-2 text-sm text-finance">
                      <Wallet className="w-4 h-4" />
                      {isRussian ? 'Финансы' : 'Finance'} ({todayTransactions.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-3 pb-2 pt-0">
                    {todayTransactions.map(t => renderItem(t, t.completed ? 'completed' : 'incomplete', 'transaction'))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
