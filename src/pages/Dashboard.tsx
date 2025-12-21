import { useState } from "react";
import { Target, CheckSquare, Wallet, Sparkles, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHabits, getTodayString } from "@/hooks/useHabits";
import { useTasks } from "@/hooks/useTasks";
import { useFinance } from "@/hooks/useFinance";
import { useTranslation } from "@/contexts/LanguageContext";
import { ProgressBar } from "@/components/dashboard/ProgressBar";
import { TodoSection } from "@/components/dashboard/TodoSection";
import { FinanceWidget } from "@/components/dashboard/FinanceWidget";
import { PageHeader } from "@/components/PageHeader";
import { DayQualityRing } from "@/components/dashboard/DayQualityRing";
import { useWeather, getWeatherIcon } from "@/hooks/useWeather";
import { useDashboardWidgets } from "@/hooks/useDashboardWidgets";
import { PomodoroWidget } from "@/components/dashboard/PomodoroWidget";
import { TimeStatsWidget } from "@/components/dashboard/TimeStatsWidget";
import { WidgetSettings } from "@/components/dashboard/WidgetSettings";

export default function Dashboard() {
  const [isCompletedExpanded, setIsCompletedExpanded] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [isWidgetsExpanded, setIsWidgetsExpanded] = useState(false);
  const { habits, toggleHabitCompletion } = useHabits();
  const { tasks, toggleTaskCompletion, getTodayTasks } = useTasks();
  const { transactions, toggleTransactionCompletion, getTodayTransactions } = useFinance();
  const { t, language } = useTranslation();
  const { weather, loading: weatherLoading } = useWeather();
  const { getEnabledWidgets } = useDashboardWidgets();

  const today = getTodayString();
  const dayOfWeek = new Date().getDay();

  // Habits for today
  const todayHabits = habits.filter((h) => h.targetDays.includes(dayOfWeek));
  const completedHabits = todayHabits.filter((h) => h.completedDates.includes(today));

  // Tasks for today
  const todayTasks = getTodayTasks();
  const completedTasks = todayTasks.filter((t) => t.completed);

  // Transactions for today
  const todayTransactions = getTodayTransactions();
  const completedTransactions = todayTransactions.filter((t) => t.completed);
  
  // Calculate today's income and expense
  const todayIncome = todayTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const todayExpense = todayTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate Day Quality (0-100)
  const totalItems = todayHabits.length + todayTasks.length + todayTransactions.length;
  const completedItems = completedHabits.length + completedTasks.length + completedTransactions.length;
  const dayQuality = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

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

  const enabledWidgets = getEnabledWidgets();

  const renderWidget = (widgetType: string) => {
    switch (widgetType) {
      case "pomodoro":
        return <PomodoroWidget key="pomodoro" />;
      case "time_stats":
        return <TimeStatsWidget key="time_stats" />;
      default:
        return null;
    }
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <PageHeader />

        {/* Section: Сегодня with Day Quality Ring */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t("today")}</h1>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
              {!weatherLoading && weather && (
                <span className="text-sm text-muted-foreground">
                  {getWeatherIcon(weather.weatherCode, weather.isDay)}
                  {weather.temperature}°
                </span>
              )}
            </div>
          </div>
          <DayQualityRing value={dayQuality} />
        </div>

        {/* Widgets Section */}
        {enabledWidgets.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setIsWidgetsExpanded(!isWidgetsExpanded)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3 hover:text-foreground transition-colors w-full justify-between"
            >
              <div className="flex items-center gap-2">
                {t("services")}:
                {isWidgetsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
              <WidgetSettings />
            </button>
            <AnimatePresence initial={false}>
              {isWidgetsExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {enabledWidgets
                      .filter((w) => w.type !== "quick_services")
                      .map((widget) => renderWidget(widget.type))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Section: Выполнено (Collapsible) */}
        <div className="mb-6">
          <button
            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-3 hover:text-foreground transition-colors"
          >
            {t("completed")}:
            {isCompletedExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence initial={true}>
            {isCompletedExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                className="overflow-hidden"
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Section: Сделать */}
        <h2 className="text-sm font-medium text-muted-foreground mb-3">{t("toDo")}:</h2>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {expandedSection === null && (
              <>
                {/* Row 1: Habits and Tasks */}
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
      </div>
    </div>
  );
}
