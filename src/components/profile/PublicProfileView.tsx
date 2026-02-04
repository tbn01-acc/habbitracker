import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, MessageCircle, Mail, Phone, Lock, 
  Heart, Users, Star, Clock, Edit2, BarChart3, 
  Target, CheckCircle2, Repeat, Crown, Flag, Trophy,
  ChevronDown, ChevronUp
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { SubscribeButton } from '@/components/profile/SubscribeButton';
import { PublicProfileEditDialog } from '@/components/profile/PublicProfileEditDialog';
import { ProfileStatsDialog } from '@/components/profile/ProfileStatsDialog';
import { UserBadges, USER_BADGES } from '@/components/rewards/UserBadges';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useUserLevel } from '@/hooks/useUserLevel';
import { ACHIEVEMENT_DEFINITIONS } from '@/hooks/useAchievements';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, differenceInMonths, differenceInYears, parseISO } from 'date-fns';

// Country flag mappings
const COUNTRY_FLAGS: Record<string, string> = {
  'Россия': '🇷🇺',
  'Russia': '🇷🇺',
  'Украина': '🇺🇦',
  'Ukraine': '🇺🇦',
  'Беларусь': '🇧🇾',
  'Belarus': '🇧🇾',
  'Казахстан': '🇰🇿',
  'Kazakhstan': '🇰🇿',
  'США': '🇺🇸',
  'USA': '🇺🇸',
  'United States': '🇺🇸',
  'Германия': '🇩🇪',
  'Germany': '🇩🇪',
  'Франция': '🇫🇷',
  'France': '🇫🇷',
  'Великобритания': '🇬🇧',
  'UK': '🇬🇧',
  'Китай': '🇨🇳',
  'China': '🇨🇳',
  'Япония': '🇯🇵',
  'Japan': '🇯🇵',
  'Индия': '🇮🇳',
  'India': '🇮🇳',
  'Турция': '🇹🇷',
  'Turkey': '🇹🇷',
  'Грузия': '🇬🇪',
  'Georgia': '🇬🇪',
  'Армения': '🇦🇲',
  'Armenia': '🇦🇲',
  'Азербайджан': '🇦🇿',
  'Azerbaijan': '🇦🇿',
  'Узбекистан': '🇺🇿',
  'Uzbekistan': '🇺🇿',
};

// Level titles
const LEVEL_TITLES: Record<number, string> = {
  1: 'Новичок',
  2: 'Ученик',
  3: 'Практикант',
  4: 'Исполнитель',
  5: 'Мастер',
  6: 'Эксперт',
  7: 'Профи',
  8: 'Гуру',
  9: 'Легенда',
  10: 'Чемпион',
};

interface ProfileData {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  telegram_username: string | null;
  public_email: string | null;
  dob?: string | null;
  location?: string | null;
  job_title?: string | null;
  status_tag?: string | null;
  interests?: string[] | null;
  expertise?: string | null;
  can_help?: string | null;
  phone?: string | null;
  referred_by?: string | null;
  created_at: string;
  active_badges?: string[] | null;
  active_frame?: string | null;
  // Stats
  likes_count?: number;
  referrals_count?: number;
  total_stars?: number;
  // Level
  user_level?: number;
  // Subscription
  is_pro?: boolean;
  // Activity stats
  unique_habits_count?: number;
  tasks_completed_count?: number;
  goals_achieved_count?: number;
  // Achievements
  earned_achievements?: string[];
}

interface PublicProfileViewProps {
  profile?: ProfileData;
  userId?: string;
  onBack?: () => void;
  onViewFeed?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  student: 'Студент',
  entrepreneur: 'Предприниматель',
  employee: 'Сотрудник',
  freelancer: 'Фрилансер',
  manager: 'Менеджер',
  developer: 'Разработчик',
  designer: 'Дизайнер',
  other: 'Другое',
};

function getCountryFlag(location: string | null): string | null {
  if (!location) return null;
  
  for (const [country, flag] of Object.entries(COUNTRY_FLAGS)) {
    if (location.toLowerCase().includes(country.toLowerCase())) {
      return flag;
    }
  }
  return null;
}

function pluralize(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n);
  if (abs % 10 === 1 && abs % 100 !== 11) return one;
  if (abs % 10 >= 2 && abs % 10 <= 4 && (abs % 100 < 10 || abs % 100 >= 20)) return few;
  return many;
}

export function PublicProfileView({ profile: initialProfile, userId, onBack, onViewFeed }: PublicProfileViewProps) {
  const navigate = useNavigate();
  const { isProActive } = useSubscription();
  const { user } = useAuth();
  const { getLevelTitle } = useUserLevel();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile && !!userId);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [achievementsOpen, setAchievementsOpen] = useState(false);

  // Calculate age from DOB
  const age = useMemo(() => {
    if (!profile?.dob) return null;
    try {
      const birthDate = parseISO(profile.dob);
      return differenceInYears(new Date(), birthDate);
    } catch {
      return null;
    }
  }, [profile?.dob]);

  // Calculate membership duration with full format
  const membershipDuration = useMemo(() => {
    if (!profile?.created_at) return '';
    try {
      const createdDate = parseISO(profile.created_at);
      const now = new Date();
      const years = differenceInYears(now, createdDate);
      const months = differenceInMonths(now, createdDate) % 12;
      const days = differenceInDays(now, createdDate) % 30;

      const parts: string[] = [];
      
      if (years > 0) {
        parts.push(`${years} ${pluralize(years, 'год', 'года', 'лет')}`);
      }
      if (months > 0 && years < 2) {
        parts.push(`${months} ${pluralize(months, 'месяц', 'месяца', 'месяцев')}`);
      }
      if (days > 0 && years === 0 && months < 2) {
        parts.push(`${days} ${pluralize(days, 'день', 'дня', 'дней')}`);
      }

      return parts.join(' ') || `${days} ${pluralize(days, 'день', 'дня', 'дней')}`;
    } catch {
      return '';
    }
  }, [profile?.created_at]);

  const isOwnProfile = user?.id === profile?.user_id;
  const userInitials = useMemo(() => 
    (profile?.display_name || 'U').slice(0, 2).toUpperCase(),
    [profile?.display_name]
  );

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setFetchError(null);
    try {
      // Fetch profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      if (!data) {
        setFetchError('Профиль не найден');
        setProfile(null);
        setLoading(false);
        return;
      }

      // Fetch stats in parallel - use public tables that anyone can read
      const [postsRes, referralsRes, starsRes, levelRes, subRes, productivityRes, achievementsRes] = await Promise.all([
        supabase.from('achievement_posts').select('id').eq('user_id', userId),
        supabase.from('referrals').select('id', { count: 'exact' }).eq('referrer_id', userId),
        supabase.from('user_stars').select('total_stars').eq('user_id', userId).single(),
        supabase.from('user_levels').select('current_level, tasks_completed, habits_completed').eq('user_id', userId).single(),
        supabase.from('subscriptions').select('plan, expires_at').eq('user_id', userId).single(),
        // Get productivity stats from public table
        supabase.from('user_productivity_stats').select('unique_habits_count, tasks_completed_count, goals_achieved_count').eq('user_id', userId).single(),
        // User achievements
        supabase.from('user_achievements').select('achievement_key').eq('user_id', userId),
      ]);

      // Get productivity stats from public table
      const productivityData = productivityRes.data;

      // Get likes count
      let likesCount = 0;
      if (postsRes.data && postsRes.data.length > 0) {
        const postIds = postsRes.data.map(p => p.id);
        const { count } = await supabase
          .from('post_reactions')
          .select('id', { count: 'exact', head: true })
          .eq('reaction_type', 'like')
          .in('post_id', postIds);
        likesCount = count || 0;
      }

      // Determine PRO status
      let isPro = false;
      if (subRes.data) {
        const plan = subRes.data.plan;
        const expiresAt = subRes.data.expires_at;
        if (plan === 'pro' && (!expiresAt || new Date(expiresAt) > new Date())) {
          isPro = true;
        }
      }

      setProfile({
        ...data,
        likes_count: likesCount,
        referrals_count: referralsRes.count || 0,
        total_stars: starsRes.data?.total_stars || 0,
        user_level: levelRes.data?.current_level || 1,
        is_pro: isPro,
        unique_habits_count: productivityData?.unique_habits_count || 0,
        tasks_completed_count: productivityData?.tasks_completed_count || 0,
        goals_achieved_count: productivityData?.goals_achieved_count || 0,
        earned_achievements: achievementsRes.data?.map(a => a.achievement_key) || [],
      });
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setFetchError('Профиль временно недоступен');
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (userId && !initialProfile) {
      fetchProfile();
    }
  }, [userId, initialProfile, fetchProfile]);

  // Group achievements by type
  const groupedAchievements = useMemo(() => {
    if (!profile?.earned_achievements) return {};
    
    const groups: Record<string, typeof ACHIEVEMENT_DEFINITIONS> = {};
    
    for (const key of profile.earned_achievements) {
      const def = ACHIEVEMENT_DEFINITIONS.find(d => d.key === key);
      if (def) {
        if (!groups[def.type]) groups[def.type] = [];
        groups[def.type].push(def);
      }
    }
    
    return groups;
  }, [profile?.earned_achievements]);

  const achievementTypeLabels: Record<string, string> = {
    subscription_streak: 'Серии',
    task_master: 'Задачи',
    habit_hero: 'Привычки',
    social_star: 'Соцсети',
  };

  if (loading) {
    return (
      <div className="space-y-4 p-2">
        <div className="flex gap-2">
          <Skeleton className="w-32 h-32 rounded-[0.35rem]" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-around">
              <Skeleton className="w-12 h-10" />
              <Skeleton className="w-12 h-10" />
              <Skeleton className="w-12 h-10" />
            </div>
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Users className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">{fetchError || 'Профиль не найден'}</h3>
      </div>
    );
  }

  const handleContactClick = () => {
    if (isProActive || isOwnProfile) {
      setContactModalOpen(true);
    } else {
      navigate('/upgrade');
    }
  };

  const countryFlag = getCountryFlag(profile.location);
  const levelTitle = LEVEL_TITLES[Math.min(profile.user_level || 1, 10)] || LEVEL_TITLES[10];

  return (
    <div className="space-y-3 p-1">
      {/* Block 1: Avatar + Stats + Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex gap-2"
      >
        {/* Avatar with PRO badge - 128px */}
        <div className="shrink-0">
          <div className="relative">
            <Avatar className="w-32 h-32 rounded-[0.35rem] border-2 border-border">
              <AvatarImage src={profile.avatar_url || undefined} className="object-cover rounded-[0.35rem]" />
              <AvatarFallback className="bg-muted text-3xl rounded-[0.35rem]">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {profile.is_pro && (
              <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg border-2 border-background">
                <Crown className="w-3 h-3 text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Stats + Buttons - stacked */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden gap-1">
          {/* Stats Row - compact */}
          <div className="flex justify-around">
            <div className="text-center px-1">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold">
                <Star className="w-3 h-3 text-yellow-500 shrink-0" />
                <span>{profile.total_stars || 0}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">Звёзды</p>
            </div>
            <div className="text-center px-1">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold">
                <Heart className="w-3 h-3 text-pink-500 shrink-0" />
                <span>{profile.likes_count || 0}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">Лайки</p>
            </div>
            <div className="text-center px-1">
              <div className="flex items-center justify-center gap-0.5 text-sm font-bold">
                <Users className="w-3 h-3 text-blue-500 shrink-0" />
                <span>{profile.referrals_count || 0}</span>
              </div>
              <p className="text-[9px] text-muted-foreground">Рефералы</p>
            </div>
          </div>

          {/* Buttons - stacked vertically */}
          {isOwnProfile ? (
            <div className="flex flex-col gap-1">
              <Button 
                variant="outline" 
                size="sm"
                className="w-full gap-1 text-xs h-8 px-2"
                onClick={() => setEditDialogOpen(true)}
              >
                <Edit2 className="w-3 h-3 shrink-0" />
                Редактировать
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="w-full gap-1 text-xs h-8 px-2"
                onClick={() => setStatsDialogOpen(true)}
              >
                <BarChart3 className="w-3 h-3 shrink-0" />
                Статистика
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <Button 
                variant="outline"
                size="sm"
                className="w-full gap-1 text-xs h-8 px-2"
                onClick={handleContactClick}
              >
                {isProActive ? (
                  <>
                    <Phone className="w-3 h-3 shrink-0" />
                    Контакты
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3 shrink-0" />
                    Контакты
                  </>
                )}
              </Button>
              <SubscribeButton userId={profile.user_id} className="w-full h-8 text-xs" />
            </div>
          )}

          {/* Level + Membership - under buttons */}
          <div className="text-[10px] text-muted-foreground text-center mt-0.5">
            <span className="font-medium text-foreground">Ур. {profile.user_level || 1} — {levelTitle}</span>
            <span className="mx-1">•</span>
            <span>С нами {membershipDuration}</span>
          </div>
        </div>
      </motion.div>

      {/* Block 2: Name, Age, Badges, Location, Status, Interests */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-1.5"
        style={{ lineHeight: '1.5' }}
      >
        {/* Name + Age + Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <h2 className="text-xl font-bold">
            {profile.display_name || 'Пользователь'}
            {age && <span className="text-muted-foreground font-normal">, {age}</span>}
          </h2>
          {profile.active_badges && profile.active_badges.length > 0 && (
            <UserBadges badgeIds={profile.active_badges} size="md" />
          )}
        </div>

        {/* Location + Status/Job - tighter spacing, right aligned */}
        <div className="space-y-0.5 mt-2 text-right">
          {/* Location: Flag -> Country -> City */}
          {profile.location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 justify-end">
              {countryFlag && <span>{countryFlag}</span>}
              {profile.location}
            </p>
          )}

          {/* Status, Job */}
          {(profile.status_tag || profile.job_title) && (
            <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground justify-end">
              {profile.status_tag && (
                <span>{STATUS_LABELS[profile.status_tag] || profile.status_tag}</span>
              )}
              {profile.status_tag && profile.job_title && <span>·</span>}
              {profile.job_title && <span>{profile.job_title}</span>}
            </div>
          )}
        </div>

        {/* Interests - 2 rows of 3 */}
        {profile.interests && profile.interests.length > 0 && (
          <div className="grid grid-cols-3 gap-1.5 mt-2">
            {profile.interests.slice(0, 6).map((interest) => (
              <Badge 
                key={interest} 
                variant="outline" 
                className="justify-center text-xs py-0.5 border-[1px]"
              >
                {interest}
              </Badge>
            ))}
          </div>
        )}
      </motion.div>

      {/* Block 3: Expertise, Can Help, Bio - minimal padding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-2"
      >
        {profile.expertise && (
          <Card>
            <CardHeader className="py-1 px-2">
              <CardTitle className="text-[10px] text-muted-foreground font-medium">
                Экспертиза
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-1.5 pt-0">
              <p className="text-xs text-foreground">{profile.expertise}</p>
            </CardContent>
          </Card>
        )}

        {profile.can_help && (
          <Card>
            <CardHeader className="py-1 px-2">
              <CardTitle className="text-[10px] text-muted-foreground font-medium">
                Чем могу помочь
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-1.5 pt-0">
              <p className="text-xs text-foreground">{profile.can_help}</p>
            </CardContent>
          </Card>
        )}

        {profile.bio && (
          <Card>
            <CardHeader className="py-1 px-2">
              <CardTitle className="text-[10px] text-muted-foreground font-medium">
                О себе
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-1.5 pt-0">
              <p className="text-xs text-foreground whitespace-pre-wrap">{profile.bio}</p>
            </CardContent>
          </Card>
        )}
      </motion.div>

      {/* Block 4: Productivity Stats + Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-2"
      >
        <h3 className="text-sm font-semibold flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-primary" />
          Продуктивность
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <Card className="text-center">
            <CardContent className="p-2">
              <Repeat className="w-4 h-4 mx-auto mb-1 text-green-500" />
              <p className="text-lg font-bold">{profile.unique_habits_count || 0}</p>
              <p className="text-[9px] text-muted-foreground">Привычек</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-2">
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">{profile.tasks_completed_count || 0}</p>
              <p className="text-[9px] text-muted-foreground">Задач</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-2">
              <Target className="w-4 h-4 mx-auto mb-1 text-purple-500" />
              <p className="text-lg font-bold">{profile.goals_achieved_count || 0}</p>
              <p className="text-[9px] text-muted-foreground">Целей</p>
            </CardContent>
          </Card>
        </div>

        {/* Achievements section */}
        {profile.earned_achievements && profile.earned_achievements.length > 0 && (
          <Collapsible open={achievementsOpen} onOpenChange={setAchievementsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between h-8 px-2 text-xs">
                <span className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-yellow-500" />
                  Награды и достижения ({profile.earned_achievements.length})
                </span>
                {achievementsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-1.5 mt-1">
              {Object.entries(groupedAchievements).map(([type, achievements]) => (
                <div key={type} className="space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground px-1">
                    {achievementTypeLabels[type] || type}
                  </p>
                  {achievements.map(ach => (
                    <div key={ach.key} className="flex items-center gap-2 px-2 py-1 bg-muted/30 rounded text-xs">
                      <span>{ach.icon}</span>
                      <span className="flex-1">{ach.name}</span>
                      {ach.reward_stars && (
                        <span className="text-yellow-500 text-[10px]">+{ach.reward_stars} ⭐</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}
      </motion.div>

      {/* Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="sm:max-w-sm p-3">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-base">Контакты</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-2">
            {profile.telegram_username && (
              <a
                href={`https://t.me/${profile.telegram_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg bg-[#229ED9]/10 hover:bg-[#229ED9]/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#229ED9] flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Telegram</p>
                  <p className="text-xs text-muted-foreground">@{profile.telegram_username}</p>
                </div>
              </a>
            )}

            {profile.public_email && (
              <a
                href={`mailto:${profile.public_email}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs text-muted-foreground">{profile.public_email}</p>
                </div>
              </a>
            )}

            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium">Телефон</p>
                  <p className="text-xs text-muted-foreground">{profile.phone}</p>
                </div>
              </a>
            )}

            {!profile.telegram_username && !profile.public_email && !profile.phone && (
              <p className="text-center text-muted-foreground py-4 text-sm">
                Контактная информация не указана
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {isOwnProfile && (
        <PublicProfileEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          userId={profile.user_id}
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
            phone: profile.phone,
          }}
          onUpdate={fetchProfile}
        />
      )}

      {/* Stats Dialog */}
      {isOwnProfile && (
        <ProfileStatsDialog
          open={statsDialogOpen}
          onOpenChange={setStatsDialogOpen}
          userId={profile.user_id}
        />
      )}
    </div>
  );
}
