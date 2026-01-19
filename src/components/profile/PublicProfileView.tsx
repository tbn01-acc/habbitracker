import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MapPin, Briefcase, Calendar, MessageCircle, Mail, Phone, Lock, 
  Heart, Users, Star, Clock, ArrowLeft, ExternalLink 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SubscribeButton } from '@/components/profile/SubscribeButton';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, differenceInMonths, differenceInYears, parseISO, format } from 'date-fns';
import { ru } from 'date-fns/locale';

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
  // Stats
  likes_count?: number;
  referrals_count?: number;
  total_stars?: number;
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

export function PublicProfileView({ profile: initialProfile, userId, onBack, onViewFeed }: PublicProfileViewProps) {
  const navigate = useNavigate();
  const { isProActive } = useSubscription();
  const { user } = useAuth();
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(initialProfile || null);
  const [loading, setLoading] = useState(!initialProfile && !!userId);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // ALL HOOKS MUST BE CALLED BEFORE ANY CONDITIONAL RETURNS
  // Calculate age from DOB - must be before any returns
  const age = useMemo(() => {
    if (!profile?.dob) return null;
    try {
      const birthDate = parseISO(profile.dob);
      return differenceInYears(new Date(), birthDate);
    } catch {
      return null;
    }
  }, [profile?.dob]);

  // Calculate membership duration - must be before any returns
  const membershipDuration = useMemo(() => {
    if (!profile?.created_at) return '';
    try {
      const createdDate = parseISO(profile.created_at);
      const years = differenceInYears(new Date(), createdDate);
      const months = differenceInMonths(new Date(), createdDate) % 12;
      const days = differenceInDays(new Date(), createdDate) % 30;

      if (years > 0) {
        return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
      } else if (months > 0) {
        return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
      } else {
        return `${days} ${days === 1 ? 'день' : days < 5 ? 'дня' : 'дней'}`;
      }
    } catch {
      return '';
    }
  }, [profile?.created_at]);

  const isOwnProfile = user?.id === profile?.user_id;
  const userInitials = useMemo(() => 
    (profile?.display_name || 'U').slice(0, 2).toUpperCase(),
    [profile?.display_name]
  );

  useEffect(() => {
    if (userId && !initialProfile) {
      const fetchProfile = async () => {
        setLoading(true);
        setFetchError(null);
        try {
          // All profiles are public - fetch directly
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

          // Fetch stats
          const [postsRes, referralsRes, starsRes] = await Promise.all([
            supabase.from('achievement_posts').select('id').eq('user_id', userId),
            supabase.from('referrals').select('id', { count: 'exact' }).eq('referrer_id', userId),
            supabase.from('user_stars').select('total_stars').eq('user_id', userId).single(),
          ]);

          // Get likes count separately
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

          setProfile({
            ...data,
            likes_count: likesCount,
            referrals_count: referralsRes.count || 0,
            total_stars: starsRes.data?.total_stars || 0,
          });
        } catch (err: any) {
          console.error('Error fetching profile:', err);
          // With RLS, a "hidden" profile often looks like "0 rows".
          const details = String(err?.details || '');
          const message = String(err?.message || '');
          if (err?.code === 'PGRST116' || /0 rows/i.test(details) || /0 rows/i.test(message)) {
            setFetchError('Профиль не найден или скрыт пользователем');
          } else {
            setFetchError('Профиль временно недоступен');
          }
          setProfile(null);
        } finally {
          setLoading(false);
        }
      };

      fetchProfile();
    }
  }, [userId, initialProfile]);

  // NOW conditional returns are allowed - after all hooks
  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex flex-col items-center">
          <Skeleton className="w-32 h-32 rounded-full mb-4" />
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
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

  // userInitials is defined above via useMemo

  const handleContactClick = () => {
    if (isProActive || isOwnProfile) {
      setContactModalOpen(true);
    } else {
      navigate('/upgrade');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <h1 className="font-semibold">Профиль</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Avatar and Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center"
        >
          <Avatar className="w-32 h-32 border-4 border-primary/20 mb-4 rounded-xl">
            <AvatarImage src={profile.avatar_url || undefined} className="object-cover rounded-xl" />
            <AvatarFallback className="bg-primary/10 text-primary text-4xl rounded-xl">
              {userInitials}
            </AvatarFallback>
          </Avatar>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mb-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-lg font-bold">
                <Heart className="w-4 h-4 text-pink-500" />
                {profile.likes_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">Лайки</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-lg font-bold">
                <Users className="w-4 h-4 text-blue-500" />
                {profile.referrals_count || 0}
              </div>
              <p className="text-xs text-muted-foreground">Рефералы</p>
            </div>
            <div className="text-center">
              <div className="flex items-center gap-1 text-lg font-bold">
                <Star className="w-4 h-4 text-yellow-500" />
                {profile.total_stars || 0}
              </div>
              <p className="text-xs text-muted-foreground">Звёзды</p>
            </div>
          </div>

          {/* Membership Duration */}
          <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
            <Clock className="w-4 h-4" />
            С нами {membershipDuration}
          </div>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center space-y-2"
        >
          <h2 className="text-2xl font-bold">
            {profile.display_name || 'Пользователь'}
            {age && <span className="text-muted-foreground font-normal">, {age}</span>}
          </h2>

          {profile.location && (
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {profile.location}
            </div>
          )}

          {profile.job_title && (
            <div className="flex items-center justify-center gap-1 text-muted-foreground">
              <Briefcase className="w-4 h-4" />
              {profile.job_title}
            </div>
          )}

          {profile.status_tag && (
            <Badge variant="secondary" className="mt-2">
              {STATUS_LABELS[profile.status_tag] || profile.status_tag}
            </Badge>
          )}
        </motion.div>

        {/* Interests */}
        {profile.interests && profile.interests.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="overflow-x-auto pb-2"
          >
            <div className="flex gap-2 min-w-max">
              {profile.interests.slice(0, 8).map((interest) => (
                <Badge key={interest} variant="outline" className="shrink-0">
                  {interest}
                </Badge>
              ))}
              {profile.interests.length > 8 && (
                <Badge variant="outline" className="shrink-0">
                  +{profile.interests.length - 8}
                </Badge>
              )}
            </div>
          </motion.div>
        )}

        {/* Subscribe and Contact Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex gap-3"
        >
          {!isOwnProfile && (
            <SubscribeButton userId={profile.user_id} variant="outline" size="lg" />
          )}
          <Button 
            onClick={handleContactClick}
            className="flex-1 gap-2"
            size="lg"
          >
            {isProActive || isOwnProfile ? (
              <>
                <MessageCircle className="w-5 h-5" />
                Получить контакты
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Только для PRO
              </>
            )}
          </Button>
        </motion.div>

        {/* Content Sections */}
        <div className="space-y-4">
          {profile.expertise && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    Экспертиза
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{profile.expertise}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {profile.can_help && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    Чем могу помочь
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground">{profile.can_help}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {profile.bio && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground font-medium">
                    О себе
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-foreground whitespace-pre-wrap">{profile.bio}</p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* User Feed Button */}
        {onViewFeed && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={onViewFeed}
            >
              <ExternalLink className="w-4 h-4" />
              Посмотреть посты пользователя
            </Button>
          </motion.div>
        )}

        {/* Referrer Section */}
        {profile.referred_by && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="text-center text-sm text-muted-foreground"
          >
            <Users className="w-4 h-4 inline mr-1" />
            Приглашён пользователем
          </motion.div>
        )}
      </div>

      {/* Contact Modal */}
      <Dialog open={contactModalOpen} onOpenChange={setContactModalOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Контакты</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {profile.telegram_username && (
              <a
                href={`https://t.me/${profile.telegram_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-[#229ED9]/10 hover:bg-[#229ED9]/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-[#229ED9] flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Telegram</p>
                  <p className="text-sm text-muted-foreground">@{profile.telegram_username}</p>
                </div>
              </a>
            )}

            {profile.public_email && (
              <a
                href={`mailto:${profile.public_email}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{profile.public_email}</p>
                </div>
              </a>
            )}

            {profile.phone && (
              <a
                href={`tel:${profile.phone}`}
                className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 hover:bg-green-500/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Телефон</p>
                  <p className="text-sm text-muted-foreground">{profile.phone}</p>
                </div>
              </a>
            )}

            {!profile.telegram_username && !profile.public_email && !profile.phone && (
              <p className="text-center text-muted-foreground py-4">
                Пользователь не указал контактные данные
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}