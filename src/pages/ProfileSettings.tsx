import { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Edit2, Tags, Cloud, Settings, Sliders, Volume2, Sparkles, HardDrive, User, ArrowLeft, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SyncHistoryPanel } from '@/components/SyncHistory';
import { TrialStatusCard } from '@/components/profile/TrialStatusCard';
import { PublicProfileEditDialog } from '@/components/profile/PublicProfileEditDialog';
import { CommonTagsManager } from '@/components/profile/CommonTagsManager';
import { SettingsSection } from '@/components/profile/SettingsSection';
import { ThemeSwitcher } from '@/components/profile/ThemeSwitcher';
import { ProfilePreferencesSection } from '@/components/profile/ProfilePreferencesSection';
import { BackupSection } from '@/components/profile/BackupSection';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useSubscription } from '@/hooks/useSubscription';
import { useCelebrationSettings } from '@/hooks/useCelebrationSettings';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { usePageCaching } from '@/hooks/usePageCaching';
import { useProfile } from '@/hooks/useProfile';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ProfileSettings() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { user, profile: authProfile, signOut, loading, refetchProfile } = useAuth();
  const { isSyncing, syncAll, syncHistory } = useSupabaseSync();
  const { subscription, currentPlan, isInTrial, trialDaysLeft, trialBonusMonths } = useSubscription();
  const { soundEnabled, confettiEnabled, setSoundEnabled, setConfettiEnabled } = useCelebrationSettings();
  const { isAdmin } = useLegalDocuments();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const isRussian = language === 'ru';

  // Use TanStack Query for instant profile updates
  const { data: cachedProfile } = useProfile(user?.id);
  const profile = cachedProfile || authProfile;

  const handleSignOut = async () => {
    await signOut();
    navigate('/profile');
  };

  const handleProfileUpdate = useCallback(async () => {
    // Refetch profile data instead of full page reload
    await refetchProfile();
  }, [refetchProfile]);

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
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Профиль и Настройки' : 'Profile & Settings'}
              </h1>
            </div>
          </div>
        </div>

        {/* Profile Card with Logout under email */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
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
                  <p className="text-sm text-muted-foreground mb-3">{user.email}</p>
                  <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
                    <LogOut className="w-4 h-4" />
                    {t('signOut')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Admin Panel Link (only for admins) */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mb-6"
          >
            <Link to="/admin">
              <Card className="border-red-500/30 bg-gradient-to-r from-red-500/10 to-transparent hover:border-red-500/50 transition-colors cursor-pointer">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <div className="font-medium text-foreground">
                        {isRussian ? 'Панель администратора' : 'Admin Panel'}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {isRussian ? 'Управление пользователями и контентом' : 'Manage users and content'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        )}

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

        {/* Celebration Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {isRussian ? 'Эффекты' : 'Effects'}
            </h2>
          </div>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Volume2 className="w-5 h-5 text-muted-foreground" />
                  <Label htmlFor="sound-enabled" className="text-sm font-medium">
                    {isRussian ? 'Звуковые эффекты' : 'Sound effects'}
                  </Label>
                </div>
                <Switch
                  id="sound-enabled"
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-muted-foreground" />
                  <Label htmlFor="confetti-enabled" className="text-sm font-medium">
                    {isRussian ? 'Анимация конфетти' : 'Confetti animation'}
                  </Label>
                </div>
                <Switch
                  id="confetti-enabled"
                  checked={confettiEnabled}
                  onCheckedChange={setConfettiEnabled}
                />
              </div>
            </CardContent>
          </Card>
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

        {/* Public Profile Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          className="mt-8"
        >
          <Link to="/profile/public">
            <Card className="border-primary/20 hover:border-primary/40 transition-colors cursor-pointer">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-foreground">
                      {isRussian ? 'Публичный профиль' : 'Public Profile'}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isRussian ? 'Предпросмотр и копирование ссылки' : 'Preview and copy link'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </motion.div>

        {/* User Catalog moved to header - removed from here */}

        {/* Backup */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="mt-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <HardDrive className="w-4 h-4 text-blue-500" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              {isRussian ? 'Резервное копирование' : 'Backup'}
            </h2>
          </div>
          <BackupSection />
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

        <PublicProfileEditDialog 
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userId={user.id}
            currentData={{
              display_name: profile?.display_name || null,
              avatar_url: profile?.avatar_url || null,
              bio: profile?.bio || null,
              telegram_username: profile?.telegram_username || null,
              public_email: profile?.public_email || null,
              dob: profile?.dob || null,
              location: profile?.location || null,
              job_title: profile?.job_title || null,
              status_tag: profile?.status_tag || null,
              interests: profile?.interests || [],
              expertise: profile?.expertise || null,
              can_help: profile?.can_help || null,
              phone: profile?.phone || null,
            }}
          onUpdate={handleProfileUpdate}
        />
      </div>
    </div>
  );
}
