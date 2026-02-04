import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AchievementPost {
  id: string;
  user_id: string;
  image_url: string;
  description: string | null;
  task_id: string | null;
  habit_id: string | null;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  is_visible: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  post_type: string;
  // Joined data
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    active_frame: string | null;
    active_badges: string[] | null;
  };
  user_reaction?: 'like' | 'dislike' | null;
}

export interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  is_visible: boolean;
  created_at: string;
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    active_frame: string | null;
    active_badges: string[] | null;
  };
}

const DAILY_POST_LIMIT = 5;

export function useAchievementsFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<AchievementPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'new' | 'popular'>('new');
  const [dailyPostCount, setDailyPostCount] = useState(0);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('achievement_posts')
        .select('*')
        .eq('is_visible', true);

      if (sortBy === 'new') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('likes_count', { ascending: false });
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;

      // Get profiles for posts
      const userIds = [...new Set((data || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, active_frame, active_badges')
        .in('user_id', userIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      // Get user's reactions if logged in
      let userReactions: Record<string, string> = {};
      if (user && data) {
        const postIds = data.map(p => p.id);
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

      const postsWithData: AchievementPost[] = (data || []).map(post => ({
        ...post,
        user_profile: profilesMap[post.user_id] || { display_name: null, avatar_url: null },
        user_reaction: userReactions[post.id] as 'like' | 'dislike' | null
      }));

      setPosts(postsWithData);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [user, sortBy]);

  const fetchDailyPostCount = useCallback(async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_post_count')
      .select('post_count')
      .eq('user_id', user.id)
      .eq('post_date', today)
      .single();

    setDailyPostCount(data?.post_count || 0);
  }, [user]);

  useEffect(() => {
    fetchPosts();
    fetchDailyPostCount();
  }, [fetchPosts, fetchDailyPostCount]);

  const createPost = useCallback(async (
    imageFile: File | null,
    description: string,
    taskId?: string,
    habitId?: string,
    postType: 'achievement' | 'success_story' | 'idea' = 'achievement',
    isVerified: boolean = false
  ): Promise<string | null> => {
    if (!user) return null;

    // Check daily limit
    if (dailyPostCount >= DAILY_POST_LIMIT) {
      toast.error('Достигнут дневной лимит публикаций (5)');
      return null;
    }

    try {
      let imageUrl = '';
      
      // Upload image if provided
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('achievements')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from('achievements')
          .getPublicUrl(fileName);
        
        imageUrl = urlData.publicUrl;
      }

      // Map post type for database
      const dbPostType = postType === 'achievement' ? 'activity' : postType === 'success_story' ? 'success_story' : 'idea';

      // Create post with is_verified flag
      const { data: post, error: postError } = await supabase
        .from('achievement_posts')
        .insert({
          user_id: user.id,
          image_url: imageUrl || 'https://placeholder.svg',
          description,
          task_id: taskId,
          habit_id: habitId,
          post_type: dbPostType,
          is_verified: isVerified
        })
        .select()
        .single();

      if (postError) throw postError;

      // Update daily count
      const today = new Date().toISOString().split('T')[0];
      await supabase
        .from('daily_post_count')
        .upsert({
          user_id: user.id,
          post_date: today,
          post_count: dailyPostCount + 1
        }, { onConflict: 'user_id,post_date' });

      setDailyPostCount(prev => prev + 1);
      
      toast.success('Достижение опубликовано!');
      fetchPosts();

      return post.id;
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Ошибка публикации');
      return null;
    }
  }, [user, dailyPostCount, fetchPosts]);

  const reactToPost = useCallback(async (
    postId: string,
    reactionType: 'like' | 'dislike'
  ) => {
    if (!user) {
      toast.error('Войдите для оценки');
      return;
    }

    try {
      const currentReaction = posts.find(p => p.id === postId)?.user_reaction;

      if (currentReaction === reactionType) {
        // Remove reaction
        await supabase
          .from('post_reactions')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else if (currentReaction) {
        // Change reaction
        await supabase
          .from('post_reactions')
          .update({ reaction_type: reactionType })
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        // Add new reaction
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
          // Removing reaction
          if (reactionType === 'like') newLikes--;
          else newDislikes--;
          newReaction = null;
        } else if (currentReaction) {
          // Changing reaction
          if (currentReaction === 'like') {
            newLikes--;
            newDislikes++;
          } else {
            newDislikes--;
            newLikes++;
          }
        } else {
          // Adding reaction
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
  }, [user, posts]);

  const fetchComments = useCallback(async (postId: string): Promise<PostComment[]> => {
    try {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .eq('is_visible', true)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const userIds = [...new Set((data || []).map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, active_frame, active_badges')
        .in('user_id', userIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      return (data || []).map(comment => ({
        ...comment,
        user_profile: profilesMap[comment.user_id] || { display_name: null, avatar_url: null }
      }));
    } catch (err) {
      console.error('Error fetching comments:', err);
      return [];
    }
  }, []);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) {
      toast.error('Войдите для комментирования');
      return false;
    }

    if (content.trim().length === 0) {
      toast.error('Комментарий не может быть пустым');
      return false;
    }

    try {
      await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        });

      toast.success('Комментарий добавлен');
      return true;
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Ошибка добавления комментария');
      return false;
    }
  }, [user]);

  const getUserPosts = useCallback(async (userId: string): Promise<AchievementPost[]> => {
    try {
      const { data, error } = await supabase
        .from('achievement_posts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_visible', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching user posts:', err);
      return [];
    }
  }, []);

  return {
    posts,
    loading,
    sortBy,
    setSortBy,
    dailyPostCount,
    dailyLimit: DAILY_POST_LIMIT,
    createPost,
    reactToPost,
    fetchComments,
    addComment,
    getUserPosts,
    refetch: fetchPosts
  };
}
