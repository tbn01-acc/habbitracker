import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Edit2, Tags, ArrowLeft, Cloud, Settings, Sliders } from 'lucide-react';
import { SyncHistoryPanel } from '@/components/SyncHistory';
import { TrialStatusCard } from '@/components/profile/TrialStatusCard';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { CommonTagsManager } from '@/components/profile/CommonTagsManager';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { ThemeSwitcher } from '@/components/profile/ThemeSwitcher';
import { ProfilePreferencesSection } from '@/components/profile/ProfilePreferencesSection';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';

export default function ProfileSettings() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const { isSyncing, syncAll, syncHistory } = useSupabaseSync();
  const { subscription, currentPlan, isInTrial, trialDaysLeft, trialBonusMonths } = useSubscription();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const isRussian = language === 'ru';

  const handleSignOut = async () => {
    await signOut();
    navigate('/profile');
  };

  const handleProfileUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (!user) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Профиль и Настройки' : 'Profile & Settings'}
              </h1>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={profile?.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                      {(profile?.display_name || user.email)?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setEditDialogOpen(true)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-semibold text-foreground">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </h2>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  {t('signOut')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Trial Status */}
        {isInTrial && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <TrialStatusCard 
              isInTrial={isInTrial}
              trialDaysLeft={trialDaysLeft}
              trialBonusMonths={trialBonusMonths}
            />
          </motion.div>
        )}

        {/* Sync */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Cloud className="w-4 h-4 text-green-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {isRussian ? 'Синхронизация' : 'Sync'}
            </h2>
          </div>
          <SyncHistoryPanel 
            history={syncHistory}
            onSync={syncAll}
            isSyncing={isSyncing}
          />
        </motion.div>

        {/* Theme Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8"
        >
          <ThemeSwitcher />
        </motion.div>

        {/* Profile Preferences (First day of week, Frames, Badges) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
              <Sliders className="w-4 h-4 text-indigo-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {isRussian ? 'Персонализация' : 'Personalization'}
            </h2>
          </div>
          <ProfilePreferencesSection />
        </motion.div>

        {/* Common Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tags className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t('commonTags')}</h2>
          </div>
          <CommonTagsManager />
        </motion.div>

        {/* Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <SettingsSection />
        </motion.div>

        <ProfileEditDialog 
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          currentDisplayName={profile?.display_name || null}
          currentAvatarUrl={profile?.avatar_url || null}
          userId={user.id}
          onUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  );
}
