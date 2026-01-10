import { useState } from 'react';
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
import Dashboard from "./pages/Dashboard";
import Habits from "./pages/Habits";
import Tasks from "./pages/Tasks";
import Finance from "./pages/Finance";
import Services from "./pages/Services";
import Statistics from "./pages/Statistics";
import Profile from "./pages/Profile";
import ProfileSettings from "./pages/ProfileSettings";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  const [habitDialogOpen, setHabitDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);

  // Track user activity for referral activation
  useReferralActivityTracker();
  useReferralNotifications();

  return (
    <>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNavigation 
        onAddHabit={() => setHabitDialogOpen(true)}
        onAddTask={() => setTaskDialogOpen(true)}
        onAddTransaction={() => setTransactionDialogOpen(true)}
      />
    </>
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
