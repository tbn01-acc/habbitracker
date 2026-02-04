import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useReferralActivityTracker } from "@/hooks/useReferralActivityTracker";
import { useReferralNotifications } from "@/hooks/useReferralNotifications";
import { useCloudSync } from "@/hooks/useCloudSync";
import { useAuth } from "@/hooks/useAuth";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useUnifiedAuth } from "@/hooks/useUnifiedAuth"; 
import { CloudRestoreDialog } from "@/components/profile/CloudRestoreDialog";

// Импорт страниц
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Tasks from "./pages/Tasks";
import Finance from "./pages/Finance";
import Services from "./pages/Services";
import Statistics from "./pages/Statistics";
import Profile from "./pages/Profile";
import ProfileSettings from "./pages/ProfileSettings";
import PublicProfilePreview from "./pages/PublicProfilePreview";
import UserCatalog from "./pages/UserCatalog";
import Achievements from "./pages/Achievements";
import PartnerProgram from "./pages/PartnerProgram";
import AboutApp from "./pages/AboutApp";
import News from "./pages/News";
import Auth from "./pages/Auth";
import Upgrade from "./pages/Upgrade";
import Admin from "./pages/Admin";
import TagPage from "./pages/TagPage";
import Rating from "./pages/Rating";
import RewardsShop from "./pages/RewardsShop";
import StarHistory from "./pages/StarHistory";
import Archive from "./pages/Archive";
import Focus from "./pages/Focus";
import UserProfile from "./pages/UserProfile";
import Notifications from "./pages/Notifications";
import Goals from "./pages/Goals";
import GoalDetail from "./pages/GoalDetail";
import LifeFocus from "./pages/LifeFocus";
import SphereDetail from "./pages/SphereDetail";
import NotFound from "./pages/NotFound";
import DayPlan from "./pages/DayPlan";
import DaySummary from "./pages/DaySummary";

/**
 * 1. Конфигурация QueryClient с поддержкой Offline Mode
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 минут актуальности
      gcTime: 1000 * 60 * 60 * 24, // 24 часа хранения в памяти
      retry: 1,
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst', // Использовать кэш при сбоях сети
    },
  },
});

/**
 * 2. Настройка персистентности (сохранение кэша в LocalStorage)
 * Используем пакеты, уже указанные в package.json
 */
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'TOP_FOCUS_OFFLINE_CACHE',
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24, // Кэш в хранилище живет 24 часа
});

const TelegramAccessBlocked = () => (
  <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-[9999] p-5 text-center">
    <div className="bg-white p-8 rounded-3xl max-w-sm shadow-2xl">
      <h2 className="text-red-600 text-xl font-bold mb-4">Доступ ограничен</h2>
      <p className="text-slate-600 mb-6">
        Для работы синхронизации и уведомлений необходимо разрешить приложению отправку сообщений в настройках Telegram.
      </p>
      <button 
        onClick={() => window.location.reload()} 
        className="w-full py-3 bg-[#0088CC] text-white rounded-xl font-bold hover:bg-[#0077B5] transition-colors"
      >
        Попробовать снова
      </button>
    </div>
  </div>
);

const AppErrorFallback = ({ error }: { error: Error }) => (
  <div className="h-screen flex flex-col items-center justify-center p-6 text-center bg-background">
    <h2 className="text-xl font-bold text-red-500 mb-2">Ошибка инициализации</h2>
    <p className="text-sm text-muted-foreground mb-4">
      Не удалось запустить службы Telegram или базу данных.
    </p>
    <pre className="text-[10px] bg-muted p-2 rounded mb-4 max-w-full overflow-auto text-left">
      {error.message}
    </pre>
    <button 
      onClick={() => window.location.href = '/'}
      className="px-6 py-2 bg-primary text-white rounded-lg font-medium"
    >
      Перезагрузить приложение
    </button>
  </div>
);

const CloudSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { triggerSync } = useCloudSync();

  useEffect(() => {
    const handleStorageChange = () => {
      triggerSync();
    };
    window.addEventListener('habitflow-data-changed', handleStorageChange);
    return () => {
      window.removeEventListener('habitflow-data-changed', handleStorageChange);
    };
  }, [triggerSync]);

  return <>{children}</>;
};

const SubscriptionWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, profile } = useAuth();
  return (
    <SubscriptionProvider user={user} referralCode={profile?.referral_code || null}>
      {children}
    </SubscriptionProvider>
  );
};

const AccessControlWrapper = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { accessControl, loading: settingsLoading } = useAppSettings();
  const location = useLocation();
  
  if (authLoading || settingsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  const publicRoutes = ['/auth', '/admin'];
  if (publicRoutes.includes(location.pathname)) {
    return <>{children}</>;
  }
  
  if (!accessControl.guest_access_enabled && !user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  const { isAccessDenied, isLoading: isTgAuthLoading } = useUnifiedAuth();

  useReferralActivityTracker();
  useReferralNotifications();

  if (isTgAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAccessDenied) {
    return <TelegramAccessBlocked />;
  }

  return (
    <CloudSyncProvider>
      <AccessControlWrapper>
        <CloudRestoreDialog />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/habits" element={<Habits openDialog={habitDialogOpen} onDialogClose={() => setHabitDialogOpen(false)} />} />
          <Route path="/tasks" element={<Tasks openDialog={taskDialogOpen} onDialogClose={() => setTaskDialogOpen(false)} />} />
          <Route path="/finance" element={<Finance openDialog={transactionDialogOpen} onDialogClose={() => setTransactionDialogOpen(false)} />} />
          <Route path="/services" element={<Services />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/settings" element={<ProfileSettings />} />
          <Route path="/profile/public" element={<PublicProfilePreview />} />
          <Route path="/users" element={<UserCatalog />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/partner-program" element={<PartnerProgram />} />
          <Route path="/about" element={<AboutApp />} />
          <Route path="/news" element={<News />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/upgrade" element={<Upgrade />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/tag/:tagId" element={<TagPage />} />
          <Route path="/rating" element={<Rating />} />
          <Route path="/rewards" element={<RewardsShop />} />
          <Route path="/star-history" element={<StarHistory />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/user/:userId" element={<UserProfile />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/goals/:id" element={<GoalDetail />} />
          <Route path="/life-focus" element={<LifeFocus />} />
          <Route path="/sphere/:sphereKey" element={<SphereDetail />} />
          <Route path="/day-plan" element={<DayPlan />} />
          <Route path="/day-summary" element={<DaySummary />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <BottomNavigation
          onAddHabit={() => setHabitDialogOpen(true)}
          onAddTask={() => setTaskDialogOpen(true)}
          onAddTransaction={() => setTransactionDialogOpen(true)}
        />
      </AccessControlWrapper>
    </CloudSyncProvider>
  );
};

const App = () => (
  <ErrorBoundary FallbackComponent={AppErrorFallback}>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <PomodoroProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <SubscriptionWrapper>
                <AppContent />
              </SubscriptionWrapper>
            </BrowserRouter>
          </TooltipProvider>
        </PomodoroProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
