import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Target, CheckSquare, Wallet, Sparkles, Calendar, BarChart3, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useHabits, getTodayString } from "@/hooks/useHabits";
import { useTasks } from "@/hooks/useTasks";
import { useFinance } from "@/hooks/useFinance";
import { useTranslation } from "@/contexts/LanguageContext";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { TodoSection } from "@/components/dashboard/TodoSection";
import { FinanceWidget } from "@/components/dashboard/FinanceWidget";
import { TopWidgetsSection } from "@/components/dashboard/TopWidgetsSection";
import { OverdueWidget } from "@/components/dashboard/OverdueWidget";
import { GreetingFocusAccordion } from "@/components/dashboard/GreetingFocusAccordion";
import { FocusDayBanner } from "@/components/dashboard/FocusDayBanner";
import { TeamWorkTab } from "@/components/dashboard/TeamWorkTab";
import { useOverdueNotifications } from "@/hooks/useOverdueNotifications";
import { ReflectionModal, useReflectionCheck } from "@/components/ReflectionModal";
import { GuestModeBanner } from "@/components/GuestModeBanner";
import { useAuth } from "@/hooks/useAuth";
import { useTrialNotifications } from "@/hooks/useTrialNotifications";
import { useStars } from "@/hooks/useStars";
import { useSubscription } from "@/hooks/useSubscription";
import { useTeam } from "@/hooks/useTeam";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
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
  const { isProActive, currentPlan } = useSubscription();
  const { team } = useTeam();
  const isTeamUser = !!team;
  const dailyLoginRecordedRef = useRef(false);
  const needsReflection = useReflectionCheck();
  const [reflectionOpen, setReflectionOpen] = useState(false);
  
  useTrialNotifications();
  useOverdueNotifications({ tasks, habits, transactions });
  
  useEffect(() => {
    if (user && !dailyLoginRecordedRef.current) {
      dailyLoginRecordedRef.current = true;
      recordDailyLogin();
    }
  }, [user, recordDailyLogin]);

  useEffect(() => {
    if (needsReflection && user) {
      const timer = setTimeout(() => setReflectionOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [needsReflection, user]);

  const today = getTodayString();
  const dayOfWeek = new Date().getDay();
  const userName = profile?.display_name || user?.email?.split("@")[0] || t("guest");

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 6) return t("goodNight");
    if (hour < 12) return t("goodMorning");
    if (hour < 18) return t("goodAfternoon");
    return t("goodEvening");
  }, [t]);

  const todayTasks = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate === todayStr && !t.archivedAt);
  }, [tasks]);

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

  const todayTransactions = useMemo(() => 
    getTodayTransactions(),
    [getTodayTransactions]
  );
  
  const completedTransactions = useMemo(() => 
    todayTransactions.filter((t) => t.completed),
    [todayTransactions]
  );

  const { todayIncome, todayExpense } = useMemo(() => ({
    todayIncome: todayTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
    todayExpense: todayTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)
  }), [todayTransactions]);

  const overdueStats = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const overdueHabits = habits.filter(h => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      const yesterdayDayOfWeek = yesterday.getDay();
      return h.targetDays.includes(yesterdayDayOfWeek) && !h.completedDates.includes(yesterdayStr);
    }).length;
    const overdueTasks = tasks.filter(t => {
      if (t.completed || t.status === 'done') return false;
      const dueDate = startOfDay(parseISO(t.dueDate));
      return isBefore(dueDate, todayStart);
    }).length;
    const overdueTransactions = transactions.filter(t => {
      if (t.completed) return false;
      const transDate = startOfDay(parseISO(t.date));
      return isBefore(transDate, todayStart);
    }).length;
    return { overdueHabits, overdueTasks, overdueTransactions };
  }, [habits, tasks, transactions]);

  const totalItems = todayHabits.length + todayTasks.length + todayTransactions.length;
  const completedItems = completedHabits.length + completedTasks.length + completedTransactions.length;
  const dayQuality = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const habitsProgress = todayHabits.length > 0 ? Math.round((completedHabits.length / todayHabits.length) * 100) : 0;
  const tasksProgress = todayTasks.length > 0 ? Math.round((completedTasks.length / todayTasks.length) * 100) : 0;
  const financeProgress = todayTransactions.length > 0 ? Math.round((completedTransactions.length / todayTransactions.length) * 100) : 0;

  const formattedDate = new Date().toLocaleDateString(
    language === "ru" ? "ru-RU" : language === "es" ? "es-ES" : "en-US",
    { day: "numeric", month: "long", weekday: "long" },
  );

  const colors = {
    habits: "hsl(var(--habit))",
    tasks: "hsl(var(--task))",
    finance: "hsl(var(--finance))",
  };

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

  const handleOpenTaskFromReflection = useCallback((prefillDate: string) => {
    navigate('/tasks', { state: { openDialog: true, prefillDate } });
  }, [navigate]);

  const renderDayPlanIcons = useCallback(() => (
    <div className="flex flex-col justify-between h-[84px]">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => navigate('/day-plan')} className="hover:bg-primary/10 h-8 w-8">
            <Calendar className="w-5 h-5 text-primary" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {language === 'ru' ? 'План на день' : 'Day Plan'}
          {!isProActive && <span className="ml-1 text-amber-500">(PRO)</span>}
        </TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => navigate('/day-summary')} className="hover:bg-primary/10 h-8 w-8">
            <BarChart3 className="w-5 h-5 text-primary" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {language === 'ru' ? 'Итоги дня' : 'Day Summary'}
          {!isProActive && <span className="ml-1 text-amber-500">(PRO)</span>}
        </TooltipContent>
      </Tooltip>
    </div>
  ), [navigate, language, isProActive]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <GuestModeBanner />

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

        {/* Combined Greeting + Focus Accordion */}
        <GreetingFocusAccordion
          userName={userName}
          formattedDate={formattedDate}
          todayTasks={todayTasks}
          habitsProgress={habitsProgress}
          tasksProgress={tasksProgress}
          financeProgress={financeProgress}
          dayQuality={dayQuality}
          getGreeting={getGreeting}
          renderDayPlanIcons={renderDayPlanIcons}
        />

        {/* Focus Day Banner */}
        <FocusDayBanner todayTasks={todayTasks} />

        {/* Section: Сделать/Выполнено (Tabbed) */}
        <Tabs defaultValue="todo" className="mb-6">
          <TabsList className={`grid w-full mb-4 ${isTeamUser ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <TabsTrigger value="todo">{t("todoTab")}</TabsTrigger>
            <TabsTrigger value="done">{t("doneTab")}</TabsTrigger>
            {isTeamUser && (
              <TabsTrigger value="team" className="gap-1">
                <Users className="w-4 h-4" />
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="todo" className="mt-0">
            <div className="space-y-3">
              <AnimatePresence mode="wait">
                {expandedSection === null && (
                  <>
                    <div className="grid grid-cols-4 gap-3">
                      <div className="col-span-2">
                        <TodoSection
                          title={t("habits")}
                          items={todayHabits.map((h) => ({
                            id: h.id, name: h.name, icon: h.icon,
                            completed: h.completedDates.includes(today),
                          }))}
                          color={colors.habits}
                          icon={<Target className="w-4 h-4" />}
                          onToggle={(id) => toggleHabitCompletion(id, today)}
                          isExpanded={false}
                          onExpand={() => setExpandedSection("habits")}
                          compact
                        />
                      </div>
                      <div className="col-span-2">
                        <TodoSection
                          title={t("tasks")}
                          items={todayTasks.map((t) => ({
                            id: t.id, name: t.name, icon: t.icon, completed: t.completed,
                          }))}
                          color={colors.tasks}
                          icon={<CheckSquare className="w-4 h-4" />}
                          onToggle={toggleTaskCompletion}
                          isExpanded={false}
                          onExpand={() => setExpandedSection("tasks")}
                          compact
                        />
                      </div>
                      <div className="col-span-4">
                        <FinanceWidget
                          income={todayIncome}
                          expense={todayExpense}
                          onExpand={() => setExpandedSection("finance")}
                        />
                      </div>
                    </div>
                  </>
                )}

                {expandedSection === "habits" && (
                  <TodoSection
                    key="habits-expanded"
                    title={t("habits")}
                    items={todayHabits.map((h) => ({
                      id: h.id, name: h.name, icon: h.icon,
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
                      id: t.id, name: t.name, icon: t.icon, completed: t.completed,
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
            <div className="bg-card p-4 shadow-card border border-border space-y-3" style={{ borderRadius: 'var(--radius-card)' }}>
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

          {isTeamUser && (
            <TabsContent value="team" className="mt-0">
              <TeamWorkTab />
            </TabsContent>
          )}
        </Tabs>

        <TopWidgetsSection />
      </div>

      {/* Reflection Modal */}
      <AnimatePresence>
        {reflectionOpen && (
          <ReflectionModal
            open={reflectionOpen}
            onClose={() => setReflectionOpen(false)}
            userId={user?.id}
            onOpenTaskDialog={handleOpenTaskFromReflection}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
