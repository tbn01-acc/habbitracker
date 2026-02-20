import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ThumbsUp, ThumbsDown, MessageCircle, Calendar, Image as ImageIcon, Search, Filter, X } from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

interface UserPost {
  id: string;
  user_id: string;
  image_url: string;
  description: string | null;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  created_at: string;
  post_type: string;
  user_reaction?: 'like' | 'dislike' | null;
}

interface UserFeedProps {
  userId: string;
}

type PostTypeFilter = 'all' | 'achievement' | 'success_story' | 'idea';
type DateFilter = 'all' | 'today' | 'week' | 'month' | 'year';

const POST_TYPE_LABELS: Record<PostTypeFilter, string> = {
  all: 'Все типы',
  achievement: 'Достижения',
  success_story: 'Истории успеха',
  idea: 'Идеи',
};

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  all: 'За всё время',
  today: 'Сегодня',
  week: 'За неделю',
  month: 'За месяц',
  year: 'За год',
};

export function UserFeed({ userId }: UserFeedProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [postTypeFilter, setPostTypeFilter] = useState<PostTypeFilter>('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user's posts
        const { data: postsData, error: postsError } = await supabase
          .from('achievement_posts')
          .select('*')
          .eq('user_id', userId)
          .eq('is_visible', true)
          .order('created_at', { ascending: false });

        if (postsError) throw postsError;

        // Fetch profile
        const { data: profileData } = await supabase
          .from('public_profiles')
          .select('display_name, avatar_url')
          .eq('user_id', userId)
          .single();

        setProfile(profileData);

        // Fetch user's reactions if logged in
        let userReactions: Record<string, string> = {};
        if (user && postsData) {
          const postIds = postsData.map(p => p.id);
          const { data: reactions } = await supabase
            .from('post_reactions')
            .select('post_id, reaction_type')
            .eq('user_id', user.id)
            .in('post_id', postIds);

          if (reactions) {
            userReactions = reactions.reduce((acc, r) => {
              acc[r.post_id] = r.reaction_type;
              return acc;
            }, {} as Record<string, string>);
          }
        }

        setPosts((postsData || []).map(post => ({
          ...post,
          user_reaction: userReactions[post.id] as 'like' | 'dislike' | null
        })));
      } catch (err) {
        console.error('Error fetching user feed:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId, user]);

  // Filter posts
  const filteredPosts = useMemo(() => {
    let result = [...posts];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(post => 
        post.description?.toLowerCase().includes(query)
      );
    }

    // Filter by post type
    if (postTypeFilter !== 'all') {
      result = result.filter(post => post.post_type === postTypeFilter);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case 'today':
          startDate = startOfDay(now);
          break;
        case 'week':
          startDate = subDays(now, 7);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        case 'year':
          startDate = subMonths(now, 12);
          break;
        default:
          startDate = new Date(0);
      }

      result = result.filter(post => 
        isAfter(new Date(post.created_at), startDate)
      );
    }

    return result;
  }, [posts, searchQuery, postTypeFilter, dateFilter]);

  const handleReaction = async (postId: string, reactionType: 'like' | 'dislike') => {
    if (!user) {
      toast.error('Войдите для оценки');
      return;
    }

    try {
      const currentReaction = posts.find(p => p.id === postId)?.user_reaction;

      if (currentReaction === reactionType) {
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else if (currentReaction) {
        await supabase
          .from('post_reactions')
          .update({ reaction_type: reactionType })
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user.id,
            reaction_type: reactionType
          });
      }

      // Optimistically update UI
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;

        let newLikes = post.likes_count;
        let newDislikes = post.dislikes_count;
        let newReaction: 'like' | 'dislike' | null = reactionType;

        if (currentReaction === reactionType) {
          if (reactionType === 'like') newLikes--;
          else newDislikes--;
          newReaction = null;
        } else if (currentReaction) {
          if (currentReaction === 'like') {
            newLikes--;
            newDislikes++;
          } else {
            newDislikes--;
            newLikes++;
          }
        } else {
          if (reactionType === 'like') newLikes++;
          else newDislikes++;
        }

        return {
          ...post,
          likes_count: newLikes,
          dislikes_count: newDislikes,
          user_reaction: newReaction
        };
      }));
    } catch (err) {
      console.error('Error reacting to post:', err);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setPostTypeFilter('all');
    setDateFilter('all');
  };

  const hasActiveFilters = searchQuery || postTypeFilter !== 'all' || dateFilter !== 'all';

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="p-4">
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Поиск по описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant={showFilters ? 'default' : 'outline'}
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={postTypeFilter} onValueChange={(v) => setPostTypeFilter(v as PostTypeFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Тип поста" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(POST_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={(v) => setDateFilter(v as DateFilter)}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Период" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATE_FILTER_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-4 w-4" />
                Сбросить
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {filteredPosts.length === posts.length
            ? `Всего публикаций: ${posts.length}`
            : `Найдено: ${filteredPosts.length} из ${posts.length}`
          }
        </span>
      </div>

      {/* Posts */}
      {filteredPosts.length === 0 ? (
        <div className="text-center py-12">
          <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">
            {posts.length === 0 ? 'Нет публикаций' : 'Ничего не найдено'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {posts.length === 0
              ? 'Пользователь еще не опубликовал достижений'
              : 'Попробуйте изменить параметры фильтрации'
            }
          </p>
        </div>
      ) : (
        filteredPosts.map(post => (
          <Card key={post.id} className="overflow-hidden">
            {post.image_url && post.image_url !== 'https://placeholder.svg' && (
              <div className="aspect-video relative overflow-hidden bg-muted">
                <img
                  src={post.image_url}
                  alt="Achievement"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback>{profile?.display_name?.[0] || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{profile?.display_name || 'Пользователь'}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(post.created_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </p>
                </div>
              </div>

              {post.description && (
                <p className="text-sm">{post.description}</p>
              )}

              <div className="flex items-center gap-4 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className={post.user_reaction === 'like' ? 'text-green-500' : ''}
                  onClick={() => handleReaction(post.id, 'like')}
                >
                  <ThumbsUp className="h-4 w-4 mr-1" />
                  {post.likes_count}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={post.user_reaction === 'dislike' ? 'text-red-500' : ''}
                  onClick={() => handleReaction(post.id, 'dislike')}
                >
                  <ThumbsDown className="h-4 w-4 mr-1" />
                  {post.dislikes_count}
                </Button>
                <Button variant="ghost" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {post.comments_count}
                </Button>
              </div>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
