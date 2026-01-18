import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { PomodoroProvider } from "@/contexts/PomodoroContext";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useReferralActivityTracker } from "@/hooks/useReferralActivityTracker";
import { useReferralNotifications } from "@/hooks/useReferralNotifications";
import { useCloudSync } from "@/hooks/useCloudSync";
import { CloudRestoreDialog } from "@/components/profile/CloudRestoreDialog";
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
import GroupChats from "./pages/GroupChats";
import Goals from "./pages/Goals";
import GoalDetail from "./pages/GoalDetail";
import LifeFocus from "./pages/LifeFocus";
import SphereDetail from "./pages/SphereDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Cloud sync component that runs in background
const CloudSyncProvider = ({ children }: { children: React.ReactNode }) => {
  const { triggerSync } = useCloudSync();

  // Listen for localStorage changes and trigger sync
  useEffect(() => {
    const handleStorageChange = () => {
      triggerSync();
    };

    // Custom event for internal changes
    window.addEventListener('habitflow-data-changed', handleStorageChange);
    
    return () => {
      window.removeEventListener('habitflow-data-changed', handleStorageChange);
    };
  }, [triggerSync]);

  return <>{children}</>;
};

const AppContent = () => {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  // Track user activity for referral activation
  useReferralActivityTracker();
  useReferralNotifications();

  return (
    <CloudSyncProvider>
      <CloudRestoreDialog />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route 
          path="/habits" 
          element={
            <Habits 
              openDialog={habitDialogOpen} 
              onDialogClose={() => setHabitDialogOpen(false)} 
            />
          } 
        />
        <Route 
          path="/tasks" 
          element={
            <Tasks 
              openDialog={taskDialogOpen} 
              onDialogClose={() => setTaskDialogOpen(false)} 
            />
          } 
        />
        <Route 
          path="/finance" 
          element={
            <Finance 
              openDialog={transactionDialogOpen} 
              onDialogClose={() => setTransactionDialogOpen(false)} 
            />
          } 
        />
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
        <Route path="/chats" element={<GroupChats />} />
        <Route path="/chats/:inviteCode" element={<GroupChats />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/goals/:id" element={<GoalDetail />} />
        <Route path="/life-focus" element={<LifeFocus />} />
        <Route path="/sphere/:sphereKey" element={<SphereDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNavigation 
        onAddHabit={() => setHabitDialogOpen(true)}
        onAddTask={() => setTaskDialogOpen(true)}
        onAddTransaction={() => setTransactionDialogOpen(true)}
      />
    </CloudSyncProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <PomodoroProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </PomodoroProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;