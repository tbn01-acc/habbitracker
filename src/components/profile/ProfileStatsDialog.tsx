import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Eye, Heart, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { subDays, subMonths, subYears, format } from 'date-fns';

interface ProfileStatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

interface Subscriber {
  id: string;
  follower_id: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

type Period = 'week' | 'month' | 'year' | 'all';

export function ProfileStatsDialog({ open, onOpenChange, userId }: ProfileStatsDialogProps) {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<Period>('month');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ views: 0, subscribers: 0, likes: 0 });
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [showSubscribers, setShowSubscribers] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;

    const fetchStats = async () => {
      setLoading(true);
      setShowSubscribers(false);

      try {
        // Calculate date range
        let fromDate: Date | null = null;
        if (period === 'week') fromDate = subDays(new Date(), 7);
        if (period === 'month') fromDate = subMonths(new Date(), 1);
        if (period === 'year') fromDate = subYears(new Date(), 1);

        // Fetch subscribers
        let subscribersQuery = supabase
          .from('user_subscriptions')
          .select('*')
          .eq('following_id', userId);
        
        if (fromDate) {
          subscribersQuery = subscribersQuery.gte('created_at', fromDate.toISOString());
        }
        
        const { data: subsData, count: subsCount } = await subscribersQuery;

        // Fetch likes on user's posts
        const { data: postsData } = await supabase
          .from('achievement_posts')
          .select('id')
          .eq('user_id', userId);

        let likesCount = 0;
        if (postsData && postsData.length > 0) {
          const postIds = postsData.map(p => p.id);
          let likesQuery = supabase
            .from('post_reactions')
            .select('id', { count: 'exact', head: true })
            .eq('reaction_type', 'like')
            .in('post_id', postIds);
          
          if (fromDate) {
            likesQuery = likesQuery.gte('created_at', fromDate.toISOString());
          }
          
          const { count } = await likesQuery;
          likesCount = count || 0;
        }

        // Get profiles for subscribers
        if (subsData && subsData.length > 0) {
          const followerIds = subsData.map(s => s.follower_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url')
            .in('user_id', followerIds);

          const profilesMap = (profiles || []).reduce((acc, p) => {
            acc[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
            return acc;
          }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>);

          setSubscribers(subsData.map(s => ({
            ...s,
            profile: profilesMap[s.follower_id]
          })));
        } else {
          setSubscribers([]);
        }

        // Note: Views tracking would require a separate table, using 0 as placeholder
        setStats({
          views: 0, // Would need profile_views table
          subscribers: subsData?.length || 0,
          likes: likesCount
        });
      } catch (error) {
        console.error('Error fetching profile stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [open, userId, period]);

  const handleSubscriberClick = (subscriberId: string) => {
    onOpenChange(false);
    navigate(`/user/${subscriberId}`);
  };

  const periodLabels: Record<Period, string> = {
    week: 'Неделя',
    month: 'Месяц',
    year: 'Год',
    all: 'Всё время'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Статистика профиля</DialogTitle>
        </DialogHeader>

        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="week">Неделя</TabsTrigger>
            <TabsTrigger value="month">Месяц</TabsTrigger>
            <TabsTrigger value="year">Год</TabsTrigger>
            <TabsTrigger value="all">Всё</TabsTrigger>
          </TabsList>

          <TabsContent value={period} className="mt-4">
            {showSubscribers ? (
              <div className="space-y-3">
                <button
                  onClick={() => setShowSubscribers(false)}
                  className="text-sm text-primary hover:underline"
                >
                  ← Назад к статистике
                </button>
                <h4 className="font-medium">Подписчики ({subscribers.length})</h4>
                <ScrollArea className="h-64">
                  {subscribers.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Нет подписчиков за {periodLabels[period].toLowerCase()}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {subscribers.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleSubscriberClick(sub.follower_id)}
                          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors text-left"
                        >
                          <Avatar className="w-8 h-8 rounded-lg">
                            <AvatarImage src={sub.profile?.avatar_url || undefined} />
                            <AvatarFallback className="rounded-lg">
                              {(sub.profile?.display_name || 'U')[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {sub.profile?.display_name || 'Пользователь'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(sub.created_at), 'dd.MM.yyyy')}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {loading ? (
                  <>
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                    <Skeleton className="h-24 rounded-xl" />
                  </>
                ) : (
                  <>
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <Eye className="w-5 h-5 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold">{stats.views}</p>
                        <p className="text-xs text-muted-foreground">Просмотры</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className="text-center cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setShowSubscribers(true)}
                    >
                      <CardContent className="p-4">
                        <Users className="w-5 h-5 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold">{stats.subscribers}</p>
                        <p className="text-xs text-muted-foreground">Подписки</p>
                      </CardContent>
                    </Card>
                    
                    <Card className="text-center">
                      <CardContent className="p-4">
                        <Heart className="w-5 h-5 mx-auto mb-2 text-pink-500" />
                        <p className="text-2xl font-bold">{stats.likes}</p>
                        <p className="text-xs text-muted-foreground">Лайки</p>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
