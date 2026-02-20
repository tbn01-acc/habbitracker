import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface UserSubscription {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useUserSubscriptions() {
  const { user } = useAuth();
  const [following, setFollowing] = useState<UserSubscription[]>([]);
  const [followers, setFollowers] = useState<UserSubscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscriptions = useCallback(async () => {
    if (!user) {
      setFollowing([]);
      setFollowers([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch who I'm following
      const { data: followingData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('follower_id', user.id);

      // Fetch my followers
      const { data: followersData } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('following_id', user.id);

      // Get profiles for following
      if (followingData && followingData.length > 0) {
        const followingIds = followingData.map(s => s.following_id);
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', followingIds);

        const profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
          return acc;
        }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>);

        setFollowing(followingData.map(s => ({
          ...s,
          profile: profilesMap[s.following_id]
        })));
      } else {
        setFollowing([]);
      }

      // Get profiles for followers
      if (followersData && followersData.length > 0) {
        const followerIds = followersData.map(s => s.follower_id);
        const { data: profiles } = await supabase
          .from('public_profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', followerIds);

        const profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
          return acc;
        }, {} as Record<string, { display_name: string | null; avatar_url: string | null }>);

        setFollowers(followersData.map(s => ({
          ...s,
          profile: profilesMap[s.follower_id]
        })));
      } else {
        setFollowers([]);
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const subscribe = useCallback(async (userId: string) => {
    if (!user || user.id === userId) return false;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .insert({ follower_id: user.id, following_id: userId });

      if (error) throw error;

      toast.success('Вы подписались на пользователя');
      await fetchSubscriptions();
      return true;
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Не удалось подписаться');
      return false;
    }
  }, [user, fetchSubscriptions]);

  const unsubscribe = useCallback(async (userId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      toast.success('Вы отписались от пользователя');
      await fetchSubscriptions();
      return true;
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Не удалось отписаться');
      return false;
    }
  }, [user, fetchSubscriptions]);

  const isFollowing = useCallback((userId: string) => {
    return following.some(s => s.following_id === userId);
  }, [following]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return {
    following,
    followers,
    isLoading,
    subscribe,
    unsubscribe,
    isFollowing,
    followingCount: following.length,
    followersCount: followers.length,
    refetch: fetchSubscriptions,
  };
}
