import { useState, useEffect, useRef, useMemo } from "react";
import { Target, CheckSquare, Wallet, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHabits, getTodayString } from "@/hooks/useHabits";
import { useTasks } from "@/hooks/useTasks";
import { useFinance } from "@/hooks/useFinance";
import { useTranslation } from "@/contexts/LanguageContext";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { TodoSection } from "@/components/dashboard/TodoSection";
import { ActivityRings } from "@/components/dashboard/ActivityRings";
import { FinanceWidget } from "@/components/dashboard/FinanceWidget";
import { DayQualityRing } from "@/components/dashboard/DayQualityRing";
import { TopWidgetsSection } from "@/components/dashboard/TopWidgetsSection";
import { OverdueWidget } from "@/components/dashboard/OverdueWidget";
import { useOverdueNotifications } from "@/hooks/useOverdueNotifications";

import { GuestModeBanner } from "@/components/GuestModeBanner";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/hooks/useAuth";
import { useTrialNotifications } from "@/hooks/useTrialNotifications";
import { useStars } from "@/hooks/useStars";
import { useOverdueTasks } from "@/hooks/useOverdueTasks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { startOfDay, parseISO, isBefore, addDays } from "date-fns";

export default function Dashboard() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const navigate = useNavigate();
  const { habits, toggleHabitCompletion, updateHabit, deleteHabit } = useHabits();
  const { tasks, toggleTaskCompletion, updateTask, deleteTask } = useTasks();
  const { transactions, toggleTransactionCompletion, getTodayTransactions } = useFinance();
  const { t, language } = useTranslation();
  const { profile, user } = useAuth();
  const { recordDailyLogin } = useStars();
  const dailyLoginRecordedRef = useRef(false);
  
  // Initialize trial notifications
  useTrialNotifications();
  
  // Initialize overdue notifications for tasks, habits, and transactions
  useOverdueNotifications({ tasks, habits, transactions });
  
  // Record daily login for stars and streak
  useEffect(() => {
    if (user && !dailyLoginRecordedRef.current) {
      dailyLoginRecordedRef.current = true;
      recordDailyLogin();
    }
  }, [user, recordDailyLogin]);

  const today = getTodayString();
  const dayOfWeek = new Date().getDay();

  // User name and avatar
  const userName = profile?.display_name || user?.email?.split("@")[0] || t("guest");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return t("goodNight");
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  };

  // Get today tasks (use filter instead of getTodayTasks for updated reference)
  const todayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate === todayStr && !t.archivedAt);
  }, [tasks]);

  // Habits for today - memoized to prevent re-renders
  const todayHabits = useMemo(() => 
    habits.filter((h) => h.targetDays.includes(dayOfWeek) && !h.archivedAt),
    [habits, dayOfWeek]
  );
  
  const completedHabits = useMemo(() => 
    todayHabits.filter((h) => h.completedDates.includes(today)),
    [todayHabits, today]
  );

  const completedTasks = useMemo(() => 
    todayTasks.filter((t) => t.completed),
    [todayTasks]
  );

  // Transactions for today - memoized
  const todayTransactions = useMemo(() => 
    getTodayTransactions(),
    [getTodayTransactions]
  );
  
  const completedTransactions = useMemo(() => 
    todayTransactions.filter((t) => t.completed),
    [todayTransactions]
  );

  // Calculate today's income and expense - memoized
  const { todayIncome, todayExpense } = useMemo(() => ({
    todayIncome: todayTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    todayExpense: todayTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  }), [todayTransactions]);

  // Calculate overdue items
  const overdueStats = useMemo(() => {
    const todayStart = startOfDay(new Date());
    
    // Overdue habits (not completed yesterday when scheduled)
    const overdueHabits = habits.filter(h => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayDayOfWeek = yesterday.getDay();
      return h.targetDays.includes(yesterdayDayOfWeek) && !h.completedDates.includes(yesterdayStr);
    }).length;

    // Overdue tasks
    const overdueTasks = tasks.filter(t => {
      if (t.completed || t.status === 'done') return false;
      const dueDate = startOfDay(parseISO(t.dueDate));
      return isBefore(dueDate, todayStart);
    }).length;

    // Overdue transactions
    const overdueTransactions = transactions.filter(t => {
      if (t.completed) return false;
      const transDate = startOfDay(parseISO(t.date));
      return isBefore(transDate, todayStart);
    }).length;

    return { overdueHabits, overdueTasks, overdueTransactions };
  }, [habits, tasks, transactions]);

  // Calculate Day Quality (0-100)
  const totalItems = todayHabits.length + todayTasks.length + todayTransactions.length;
  const completedItems = completedHabits.length + completedTasks.length + completedTransactions.length;
  const dayQuality = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  // Calculate progress per category
  const habitsProgress = todayHabits.length > 0 ? Math.round((completedHabits.length / todayHabits.length) * 100) : 0;
  const tasksProgress = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;
  const financeProgress = todayTransactions.length > 0 ? Math.round((completedTransactions.length / todayTransactions.length) * 100) : 0;

  // Format date
  const formattedDate = new Date().toLocaleDateString(
    language === "ru" ? "ru-RU" : language === "es" ? "es-ES" : "en-US",
    { day: "numeric", month: "long", weekday: "long" },
  );

  // Colors for modules
  const colors = {
    habits: "hsl(var(--habit))",
    tasks: "hsl(var(--task))",
    finance: "hsl(var(--finance))",
  };

  const isLoading = false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse-soft">
          <Sparkles className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  // Callback handlers for OverdueWidget
  const handlePostponeTask = (id: string, newDate: string) => {
    updateTask(id, { dueDate: newDate });
  };

  const handleArchiveTask = (id: string) => {
    updateTask(id, { archivedAt: new Date().toISOString() });
  };

  const handleDeleteTask = (id: string) => {
    deleteTask(id);
  };

  const handlePostponeHabit = (id: string, days: number) => {
    const newDate = addDays(new Date(), days).toISOString().split('T')[0];
    updateHabit(id, { postponedUntil: newDate });
  };

  const handleArchiveHabit = (id: string) => {
    updateHabit(id, { archivedAt: new Date().toISOString() });
  };

  const handleDeleteHabit = (id: string) => {
    deleteHabit(id);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Guest Mode Banner */}
        <GuestModeBanner />

        {/* Overdue Widget */}
        <OverdueWidget 
          overdueHabits={overdueStats.overdueHabits}
          overdueTasks={overdueStats.overdueTasks}
          overdueTransactions={overdueStats.overdueTransactions}
          habits={habits}
          tasks={tasks}
          transactions={transactions}
          onCompleteHabit={toggleHabitCompletion}
          onCompleteTask={toggleTaskCompletion}
          onCompleteTransaction={toggleTransactionCompletion}
          onPostponeTask={handlePostponeTask}
          onArchiveTask={handleArchiveTask}
          onDeleteTask={handleDeleteTask}
          onPostponeHabit={handlePostponeHabit}
          onArchiveHabit={handleArchiveHabit}
          onDeleteHabit={handleDeleteHabit}
        />

        {/* Section: Greeting and Day Quality Ring */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div>
              <p className="text-lg text-muted-foreground">{getGreeting()},</p>
              <h1 className="text-2xl font-bold text-foreground">{userName}!</h1>
            </div>
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
          </div>
          <ActivityRings 
            habitsProgress={habitsProgress}
            tasksProgress={tasksProgress}
            financeProgress={financeProgress}
            dayQuality={dayQuality}
          />
        </div>

        {/* Section: Сделать/Выполнено (Tabbed) */}
        <Tabs defaultValue="todo" className="mb-6">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="todo">{t("todoTab")}</TabsTrigger>
            <TabsTrigger value="done">{t("doneTab")}</TabsTrigger>
          </TabsList>

          <TabsContent value="todo" className="mt-0">
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {expandedSection === null && (
                  <>
                    {/* Row 1: Habits and Tasks (half height) */}
                    <div className="grid grid-cols-2 gap-3">
                      <TodoSection
                        title={t("habits")}
                        items={todayHabits.map((h) => ({
                          id: h.id,
                          name: h.name,
                          icon: h.icon,
                          completed: h.completedDates.includes(today),
                        }))}
                        color={colors.habits}
                        icon={<Target className="w-4 h-4" />}
                        onToggle={(id) => toggleHabitCompletion(id, today)}
                        isExpanded={false}
                        onExpand={() => setExpandedSection("habits")}
                        compact
                      />

                      <TodoSection
                        title={t("tasks")}
                        items={todayTasks.map((t) => ({
                          id: t.id,
                          name: t.name,
                          icon: t.icon,
                          completed: t.completed,
                        }))}
                        color={colors.tasks}
                        icon={<CheckSquare className="w-4 h-4" />}
                        onToggle={toggleTaskCompletion}
                        isExpanded={false}
                        onExpand={() => setExpandedSection("tasks")}
                        compact
                      />
                    </div>

                    {/* Row 2: Finance Widget (full width) */}
                    <FinanceWidget
                      income={todayIncome}
                      expense={todayExpense}
                      onExpand={() => setExpandedSection("finance")}
                    />
                  </>
                )}

                {expandedSection === "habits" && (
                  <TodoSection
                    key="habits-expanded"
                    title={t("habits")}
                    items={todayHabits.map((h) => ({
                      id: h.id,
                      name: h.name,
                      icon: h.icon,
                      completed: h.completedDates.includes(today),
                    }))}
                    color={colors.habits}
                    icon={<Target className="w-4 h-4" />}
                    onToggle={(id) => toggleHabitCompletion(id, today)}
                    isExpanded={true}
                    onCollapse={() => setExpandedSection(null)}
                    onSwipeLeft={() => setExpandedSection("tasks")}
                    hasPrev={false}
                    hasNext={true}
                  />
                )}

                {expandedSection === "tasks" && (
                  <TodoSection
                    key="tasks-expanded"
                    title={t("tasks")}
                    items={todayTasks.map((t) => ({
                      id: t.id,
                      name: t.name,
                      icon: t.icon,
                      completed: t.completed,
                    }))}
                    color={colors.tasks}
                    icon={<CheckSquare className="w-4 h-4" />}
                    onToggle={toggleTaskCompletion}
                    isExpanded={true}
                    onCollapse={() => setExpandedSection(null)}
                    onSwipeLeft={() => setExpandedSection("finance")}
                    onSwipeRight={() => setExpandedSection("habits")}
                    hasPrev={true}
                    hasNext={true}
                  />
                )}

                {expandedSection === "finance" && (
                  <TodoSection
                    key="finance-expanded"
                    title={t("finance")}
                    items={todayTransactions.map((t) => ({
                      id: t.id,
                      name: `${t.type === "income" ? "+" : "-"}${t.amount}₽ ${t.name}`,
                      completed: t.completed,
                    }))}
                    color={colors.finance}
                    icon={<Wallet className="w-4 h-4" />}
                    onToggle={toggleTransactionCompletion}
                    isExpanded={true}
                    onCollapse={() => setExpandedSection(null)}
                    onSwipeRight={() => setExpandedSection("tasks")}
                    hasPrev={true}
                    hasNext={false}
                  />
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          <TabsContent value="done" className="mt-0">
            <div className="bg-card rounded-2xl p-4 shadow-card border border-border">
              <ProgressBar
                icon={<Target className="w-4 h-4" />}
                completed={completedHabits.length}
                total={todayHabits.length}
                label={t("habitsLabel")}
                color={colors.habits}
              />
              <ProgressBar
                icon={<CheckSquare className="w-4 h-4" />}
                completed={completedTasks.length}
                total={todayTasks.length}
                label={t("tasksLabel")}
                color={colors.tasks}
              />
              <ProgressBar
                icon={<Wallet className="w-4 h-4" />}
                completed={completedTransactions.length}
                total={todayTransactions.length}
                label={t("operationsLabel")}
                color={colors.finance}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Top Widgets Section */}
        <TopWidgetsSection />
      </div>
    </div>
  );
}
