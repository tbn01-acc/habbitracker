import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, LogIn, Edit2, Bell, Tags } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { NotificationSettings } from '@/components/NotificationSettings';
import { SyncHistoryPanel } from '@/components/SyncHistory';
import { SubscriptionSection } from '@/components/profile/SubscriptionSection';
import { ReferralSection } from '@/components/profile/ReferralSection';
import { TrialStatusCard } from '@/components/profile/TrialStatusCard';
import { ProfileEditDialog } from '@/components/profile/ProfileEditDialog';
import { CommonTagsManager } from '@/components/profile/CommonTagsManager';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useSubscription } from '@/hooks/useSubscription';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const { isSyncing, syncAll, syncHistory } = useSupabaseSync();
  const { subscription, referralStats, currentPlan, referralCode, isInTrial, trialDaysLeft, trialBonusMonths } = useSubscription();
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

  // Force re-fetch profile on update
  const handleProfileUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PageHeader 
          showTitle
          icon={<User className="w-5 h-5 text-muted-foreground" />}
          iconBgClass="bg-muted"
          title={t('profile')}
          subtitle={t('profileSettings')}
        />

        <div className="flex flex-col items-center justify-center py-8">
          {user ? (
            <>
              <div className="relative mb-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {(profile?.display_name || user.email)?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => setEditDialogOpen(true)}
                  className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {profile?.display_name || user.email?.split('@')[0]}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">{user.email}</p>
              
              {/* Trial Status Card */}
              {isInTrial && (
                <div className="w-full max-w-md mb-6">
                  <TrialStatusCard 
                    isInTrial={isInTrial}
                    trialDaysLeft={trialDaysLeft}
                    trialBonusMonths={trialBonusMonths}
                  />
                </div>
              )}
              
              {/* Sync History Panel */}
              <div className="w-full max-w-md mb-6">
                <SyncHistoryPanel 
                  history={syncHistory}
                  onSync={syncAll}
                  isSyncing={isSyncing}
                />
              </div>

              <Button variant="outline" onClick={handleSignOut} className="gap-2">
                <LogOut className="w-4 h-4" />
                {t('signOut')}
              </Button>
              
              {/* Profile Edit Dialog */}
              <ProfileEditDialog 
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                currentDisplayName={profile?.display_name || null}
                currentAvatarUrl={profile?.avatar_url || null}
                userId={user.id}
                onUpdate={handleProfileUpdate}
              />
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="w-12 h-12 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">{t('guest')}</h2>
              <p className="text-sm text-muted-foreground text-center max-w-xs mb-6">
                {t('profileDescription')}
              </p>
              <Button onClick={handleSignIn} className="gap-2">
                <LogIn className="w-4 h-4" />
                {t('signIn')}
              </Button>
            </>
          )}
        </div>

        {/* Subscription Section */}
        {user && (
          <div className="mt-8">
            <SubscriptionSection 
              currentPlan={currentPlan}
              expiresAt={subscription?.expires_at}
              bonusDays={subscription?.bonus_days}
            />
          </div>
        )}

        {/* Referral Section */}
        {user && (
          <div className="mt-8">
            <ReferralSection 
              referralCode={referralCode}
              currentPlan={currentPlan}
              referralStats={referralStats}
            />
          </div>
        )}

        {/* Notification Settings */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t('notificationSettings')}</h2>
          </div>
          <NotificationSettings />
        </div>

        {/* Common Tags Section */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Tags className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t('commonTags')}</h2>
          </div>
          <CommonTagsManager />
        </div>
      </div>
    </div>
  );
}
