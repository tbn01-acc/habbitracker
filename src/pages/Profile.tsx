import { useNavigate } from 'react-router-dom';
import { User, LogOut, LogIn, BarChart3, Award, RefreshCw, Cloud } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { NotificationSettings } from '@/components/NotificationSettings';
import { ProductivityStats } from '@/components/ProductivityStats';
import { Achievements } from '@/components/Achievements';
import { SyncHistoryPanel } from '@/components/SyncHistory';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Profile() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile, signOut, loading } = useAuth();
  const { isSyncing, syncAll, lastSyncTime, syncHistory } = useSupabaseSync();

  const handleSignOut = async () => {
    await signOut();
  };

  const handleSignIn = () => {
    navigate('/auth');
  };

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
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {(profile?.display_name || user.email)?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground mb-2">
                {profile?.display_name || user.email?.split('@')[0]}
              </h2>
              <p className="text-sm text-muted-foreground mb-6">{user.email}</p>
              
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

        {/* Achievements */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Award className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t('achievements')}</h2>
          </div>
          <Achievements />
        </div>

        {/* Productivity Statistics */}
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">{t('productivityStats')}</h2>
          </div>
          <ProductivityStats />
        </div>

        {/* Notification Settings */}
        <div className="mt-8">
          <NotificationSettings />
        </div>
      </div>
    </div>
  );
}
