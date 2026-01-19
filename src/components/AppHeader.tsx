import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { useStars } from '@/hooks/useStars';
import { useNotifications } from '@/hooks/useNotifications';
import { useSubscription } from '@/hooks/useSubscription';
import { useTranslation } from '@/contexts/LanguageContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ReferralModal } from '@/components/ReferralModal';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UserAvatarWithFrame } from '@/components/rewards/UserAvatarWithFrame';
import { UserBadges } from '@/components/rewards/UserBadges';
import { Icon3D } from '@/components/Icon3D';

export function AppHeader() {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { userStars } = useStars();
  const { unreadCount } = useNotifications();
  const { isProActive } = useSubscription();
  const { t } = useTranslation();
  const [referralModalOpen, setReferralModalOpen] = useState(false);

  const userName = profile?.display_name || user?.email?.split('@')[0] || t('guest');
  const isPro = isProActive;

  // Get active frame and badges from profile
  const activeFrame = (profile as any)?.active_frame || null;
  const activeBadges = (profile as any)?.active_badges || [];

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Avatar with frame, PRO badge and user badges */}
            <div className="flex items-center gap-2 shrink-0">
              <UserAvatarWithFrame
                avatarUrl={profile?.avatar_url}
                displayName={userName}
                frameId={activeFrame}
                size="md"
                onClick={() => navigate('/profile')}
                showProBadge={isPro}
              />
              <UserBadges badgeIds={activeBadges} maxDisplay={2} size="sm" />
            </div>

            {/* Center: Streak only */}
            <div className="flex items-center gap-3">
              {userStars && userStars.current_streak_days > 0 && (
                <Badge variant="outline" className="gap-1 px-2 py-1 border-orange-500/50">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                  <span className="font-semibold text-sm">{userStars.current_streak_days}</span>
                </Badge>
              )}
            </div>

            {/* Right: Notifications + News + Users Catalog + Focus + Rating + Theme + Invite */}
            <div className="flex items-center gap-0 sm:gap-0.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/notifications')}
                    className="relative hover:bg-primary/10"
                  >
                    <Icon3D name="notifications" size="sm" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Уведомления
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/news')}
                    className="hover:bg-blue-500/10"
                  >
                    <Icon3D name="news" size="sm" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Новости
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/users')}
                    className="hover:bg-green-500/10"
                  >
                    <Icon3D name="users" size="sm" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Каталог пользователей
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/focus')}
                    className="hover:bg-purple-500/10"
                  >
                    <Icon3D name="focus" size="sm" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Фокус
                </TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/rating')}
                    className="hover:bg-yellow-500/10"
                  >
                    <Icon3D name="rating" size="sm" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {t('rating') || 'Рейтинг'}
                </TooltipContent>
              </Tooltip>
              
              <ThemeToggle />
              
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button
                  onClick={() => setReferralModalOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold shadow-lg shadow-amber-500/25 gap-2 px-4"
                  size="sm"
                >
                  <Gift className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('inviteFriend')}</span>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      <ReferralModal 
        open={referralModalOpen} 
        onOpenChange={setReferralModalOpen} 
      />
    </>
  );
}
