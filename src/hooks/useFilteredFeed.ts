import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export type FeedType = 'activity' | 'success' | 'ideas';

export interface FeedPost {
  id: string;
  user_id: string;
  image_url: string;
  description: string | null;
  post_type: string;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  votes_count: number;
  created_at: string;
  user_profile?: {
    display_name: string | null;
    avatar_url: string | null;
    active_frame: string | null;
    active_badges: string[] | null;
  };
  user_reaction?: 'like' | 'dislike' | null;
  user_voted?: boolean;
}

const POSTS_PER_PAGE = 50;

export function useFilteredFeed(feedType: FeedType) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Map feed type to post_type
  const getPostType = (type: FeedType): string => {
    switch (type) {
      case 'activity': return 'activity';
      case 'success': return 'success_story';
      case 'ideas': return 'idea';
    }
  };

  const fetchPosts = useCallback(async (pageNum: number, append: boolean = false) => {
    try {
      if (!append) setLoading(true);
      
      const postType = getPostType(feedType);
      const offset = (pageNum - 1) * POSTS_PER_PAGE;

      let query = supabase
        .from('achievement_posts')
        .select('*')
        .eq('is_visible', true)
        .eq('post_type', postType)
        .order(feedType === 'ideas' ? 'votes_count' : 'created_at', { ascending: false })
        .range(offset, offset + POSTS_PER_PAGE - 1);

      const { data, error } = await query;
      if (error) throw error;

      // Get profiles
      const userIds = [...new Set((data || []).map(p => p.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, active_frame, active_badges')
        .in('user_id', userIds);

      const profilesMap = (profiles || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      // Get user reactions
      let userReactions: Record<string, string> = {};
      let userVotes: Set<string> = new Set();
      
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

        // Get user votes for ideas
        if (feedType === 'ideas') {
          const { data: votes } = await supabase
            .from('idea_votes')
            .select('post_id')
            .eq('user_id', user.id)
            .in('post_id', postIds);

          if (votes) {
            userVotes = new Set(votes.map(v => v.post_id));
          }
        }
      }

      const postsWithData: FeedPost[] = (data || []).map(post => ({
        ...post,
        user_profile: profilesMap[post.user_id],
        user_reaction: userReactions[post.id] as 'like' | 'dislike' | null,
        user_voted: userVotes.has(post.id),
      }));

      if (append) {
        setPosts(prev => [...prev, ...postsWithData]);
      } else {
        setPosts(postsWithData);
      }

      setHasMore((data?.length || 0) === POSTS_PER_PAGE);
    } catch (err) {
      console.error('Error fetching filtered feed:', err);
    } finally {
      setLoading(false);
    }
  }, [feedType, user]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, false);
  }, [feedType, fetchPosts]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  }, [page, fetchPosts]);

  const voteForIdea = useCallback(async (postId: string) => {
    if (!user) {
      toast.error('Войдите для голосования');
      return;
    }

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.user_voted) {
        // Remove vote
        await supabase
          .from('idea_votes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, votes_count: p.votes_count - 1, user_voted: false }
            : p
        ));
      } else {
        // Add vote
        await supabase
          .from('idea_votes')
          .insert({ post_id: postId, user_id: user.id });

        setPosts(prev => prev.map(p => 
          p.id === postId 
            ? { ...p, votes_count: p.votes_count + 1, user_voted: true }
            : p
        ));
      }
    } catch (err) {
      console.error('Error voting:', err);
      toast.error('Ошибка голосования');
    }
  }, [user, posts]);

  const createPost = useCallback(async (
    imageFile: File,
    description: string,
    type: FeedType
  ): Promise<boolean> => {
    if (!user) return false;

    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('achievements')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('achievements')
        .getPublicUrl(fileName);

      const postType = getPostType(type);

      await supabase
        .from('achievement_posts')
        .insert({
          user_id: user.id,
          image_url: urlData.publicUrl,
          description,
          post_type: postType
        });

      toast.success('Публикация создана!');
      fetchPosts(1, false);
      return true;
    } catch (err) {
      console.error('Error creating post:', err);
      toast.error('Ошибка публикации');
      return false;
    }
  }, [user, fetchPosts]);

  return {
    posts,
    loading,
    hasMore,
    loadMore,
    voteForIdea,
    createPost,
    refetch: () => fetchPosts(1, false),
  };
}
