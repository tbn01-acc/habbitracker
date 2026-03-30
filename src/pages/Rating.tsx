import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';
import { useLeaderboard, PublicProfile } from '@/hooks/useLeaderboard';
import { useLeaderboardFiltered, LeaderboardPeriod, LeaderboardSortType } from '@/hooks/useLeaderboardFiltered';
import { useStars } from '@/hooks/useStars';
import { useAuth } from '@/hooks/useAuth';
import { fetchUserRewardItemsBatch, UserRewardItems } from '@/hooks/useUserRewardItems';

import { PublicProfileEditDialog } from '@/components/profile/PublicProfileEditDialog';
import { ContactsGatedDialog } from '@/components/profile/ContactsGatedDialog';
import { RatingPodium } from '@/components/rating/RatingPodium';
import { RatingTabs, RatingType, RatingPeriod, RatingScope } from '@/components/rating/RatingTabs';
import { UserStatsCards } from '@/components/rating/UserStatsCards';
import { RatingList } from '@/components/rating/RatingList';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trophy, Star, Flame, User, Settings, Users, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatarWithFrame } from '@/components/rewards/UserAvatarWithFrame';
import { UserBadges } from '@/components/rewards/UserBadges';

export default function Rating() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const { user, profile } = useAuth();
  const { getPublicProfile } = useLeaderboard();
  const { userStars } = useStars();

  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showProfileEditDialog, setShowProfileEditDialog] = useState(false);
  const [showContactsDialog, setShowContactsDialog] = useState(false);
  const [contactsProfile, setContactsProfile] = useState<PublicProfile | null>(null);
  const [userRewards, setUserRewards] = useState<Map<string, UserRewardItems>>(new Map());

  const [ratingType, setRatingType] = useState<RatingType>('stars');
  const [ratingPeriod, setRatingPeriod] = useState<RatingPeriod>('all');
  const [ratingScope, setRatingScope] = useState<RatingScope>('personal');

  // Use filtered leaderboard hook with sort type
  const { leaderboard, currentUserRank, loading: leaderboardLoading } = useLeaderboardFiltered(ratingPeriod as LeaderboardPeriod, ratingType as LeaderboardSortType);

  // Fetch reward items for leaderboard users
  useEffect(() => {
    if (leaderboard.length > 0) {
      const userIds = leaderboard.map(u => u.user_id);
      fetchUserRewardItemsBatch(userIds).then(setUserRewards);
    }
  }, [leaderboard]);

  const navigate = useNavigate();

  const handleUserClick = (userId: string) => {
    navigate(`/user/${userId}`);
  };

  const handleGetContacts = (profile: PublicProfile) => {
    setContactsProfile(profile);
    setShowContactsDialog(true);
    setSelectedProfile(null);
  };

  // Team leaderboard placeholder (same structure as personal for now)
  const isTeamView = ratingScope === 'team';

  return (
    <div className="min-h-screen bg-background pb-20">
      
      <main className="container max-w-2xl mx-auto px-4 py-6">
        {/* Page Title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Trophy className="h-7 w-7 text-yellow-500" />
            <h1 className="text-2xl font-bold">
              {isRussian ? 'Рейтинг' : 'Rating'}
            </h1>
          </div>
          
          {user && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowProfileEditDialog(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Rating Type, Period & Scope Tabs */}
        <div className="mb-4">
          <RatingTabs
            type={ratingType}
            onTypeChange={setRatingType}
            period={ratingPeriod}
            onPeriodChange={setRatingPeriod}
            scope={ratingScope}
            onScopeChange={setRatingScope}
            isRussian={isRussian}
          />
        </div>

        {isTeamView ? (
          /* Team Leaderboard */
          <div className="space-y-4">
            {/* Demo team data */}
            {(() => {
              const demoTeams = [
                { id: '1', name: isRussian ? 'Альфа Команда' : 'Alpha Team', logo: '🚀', score: 9850, members: 8, velocity: 94 },
                { id: '2', name: isRussian ? 'Кибер Волки' : 'Cyber Wolves', logo: '🐺', score: 8720, members: 6, velocity: 88 },
                { id: '3', name: isRussian ? 'Квантум' : 'Quantum', logo: '⚡', score: 7650, members: 5, velocity: 82 },
                { id: '4', name: isRussian ? 'Феникс' : 'Phoenix', logo: '🔥', score: 6540, members: 7, velocity: 76 },
                { id: '5', name: isRussian ? 'Инновация' : 'Innovation', logo: '💡', score: 5430, members: 4, velocity: 71 },
              ];
              const medals = ['🥇', '🥈', '🥉'];

              return (
                <>
                  {/* Podium */}
                  <div className="flex items-end justify-center gap-3 py-4">
                    {[1, 0, 2].map(idx => {
                      const t = demoTeams[idx];
                      if (!t) return null;
                      const isFirst = idx === 0;
                      return (
                        <motion.div
                          key={t.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className={`flex flex-col items-center ${isFirst ? 'order-1' : idx === 1 ? 'order-0' : 'order-2'}`}
                        >
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-1 ${
                            isFirst ? 'bg-yellow-500/20 ring-2 ring-yellow-500/40 shadow-lg' : 'bg-muted'
                          }`}>
                            {t.logo}
                          </div>
                          <p className="text-xs font-bold text-center max-w-[80px] truncate">{t.name}</p>
                          <span className="text-lg">{medals[idx]}</span>
                          <span className="text-xs font-bold text-primary">{t.score.toLocaleString()}</span>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* List */}
                  <div className="space-y-2">
                    {demoTeams.map((t, i) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border/50"
                      >
                        <span className="w-6 text-center text-sm font-bold text-muted-foreground">
                          {i < 3 ? medals[i] : `#${i + 1}`}
                        </span>
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-xl">
                          {t.logo}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{t.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {t.members} {isRussian ? 'участников' : 'members'} • {isRussian ? 'скорость' : 'velocity'} {t.velocity}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-primary">{t.score.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">{isRussian ? 'очков' : 'pts'}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <Card className="border-dashed border-primary/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        {isRussian
                          ? 'Рейтинг формируется на основе интегральной метрики из раздела «Фокус команды»'
                          : 'Ranking based on integrated metrics from "Team Focus" section'}
                      </p>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        ) : (
          <>
            {/* Top 3 Podium */}
            {!leaderboardLoading && leaderboard.length > 0 && (
              <RatingPodium
                users={leaderboard}
                userRewards={userRewards}
                type={ratingType}
                isRussian={isRussian}
                onUserClick={handleUserClick}
              />
            )}

            {/* User Stats Cards */}
            <UserStatsCards
              userStars={userStars?.total_stars || 0}
              userRank={currentUserRank?.rank || null}
              isRussian={isRussian}
            />

            {/* Leaderboard List */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${ratingType}-${ratingPeriod}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25, ease: 'easeOut' as const }}
              >
                {leaderboardLoading ? (
                  <div className="space-y-3">
                    {[...Array(10)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <RatingList
                      users={leaderboard}
                      userRewards={userRewards}
                      type={ratingType}
                      isRussian={isRussian}
                      onUserClick={handleUserClick}
                    />

                    {/* Current user if not in top 100 */}
                    {currentUserRank && currentUserRank.rank > 100 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">
                          {isRussian ? 'Ваша позиция' : 'Your position'}
                        </p>
                        <Card className="ring-2 ring-primary">
                          <CardContent className="flex items-center gap-4 p-4">
                            <div className="w-8 flex justify-center">
                              <span className="text-sm font-medium">#{currentUserRank.rank}</span>
                            </div>
                            
                            <Avatar>
                              <AvatarImage src={currentUserRank.avatar_url || undefined} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1">
                              <p className="font-medium">{currentUserRank.display_name}</p>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Flame className="h-3 w-3 text-orange-500" />
                                {currentUserRank.current_streak_days}d
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 text-lg font-semibold">
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                              {currentUserRank.total_stars}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {leaderboard.length === 0 && (
                      <Card>
                        <CardContent className="text-center py-12">
                          <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                          <p className="text-muted-foreground">
                            {isRussian ? 'Рейтинг пока пуст' : 'Leaderboard is empty'}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </main>

      {/* Profile Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isRussian ? 'Профиль' : 'Profile'}</DialogTitle>
          </DialogHeader>
          
          {profileLoading ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-20 rounded-full mx-auto" />
              <Skeleton className="h-6 w-32 mx-auto" />
              <Skeleton className="h-4 w-48 mx-auto" />
            </div>
          ) : selectedProfile && (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center">
                <UserAvatarWithFrame
                  avatarUrl={selectedProfile.avatar_url}
                  displayName={selectedProfile.display_name}
                  frameId={userRewards.get(selectedProfile.user_id)?.activeFrame}
                  size="lg"
                />
                <div className="mt-3 flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{selectedProfile.display_name}</h3>
                  <UserBadges 
                    badgeIds={userRewards.get(selectedProfile.user_id)?.activeBadges || []}
                    maxDisplay={3}
                  />
                </div>
                {selectedProfile.bio && (
                  <p className="text-sm text-muted-foreground text-center mt-2">
                    {selectedProfile.bio}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-lg bg-muted">
                  <Star className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                  <p className="font-semibold">{selectedProfile.total_stars}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Звёзды' : 'Stars'}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <Flame className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                  <p className="font-semibold">{selectedProfile.current_streak_days}</p>
                  <p className="text-xs text-muted-foreground">{isRussian ? 'Серия' : 'Streak'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      {user && profile && (
        <PublicProfileEditDialog
          open={showProfileEditDialog}
          onOpenChange={setShowProfileEditDialog}
          userId={user.id}
          currentData={{
            display_name: profile.display_name,
            avatar_url: profile.avatar_url,
            bio: profile.bio,
            telegram_username: profile.telegram_username,
            public_email: profile.public_email,
            dob: profile.dob,
            location: profile.location,
            job_title: profile.job_title,
            status_tag: profile.status_tag,
            interests: profile.interests,
            expertise: profile.expertise,
            can_help: profile.can_help,
            phone: profile.phone
          }}
          onUpdate={() => {}}
        />
      )}

      {/* Contacts Gated Dialog */}
      {contactsProfile && (
        <ContactsGatedDialog
          open={showContactsDialog}
          onOpenChange={setShowContactsDialog}
          telegramUsername={contactsProfile.telegram_username}
          email={contactsProfile.public_email}
          displayName={contactsProfile.display_name}
        />
      )}
    </div>
  );
}
