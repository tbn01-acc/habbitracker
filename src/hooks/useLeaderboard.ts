import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface LeaderboardUser {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_stars: number;
  current_streak_days: number;
  is_current_user: boolean;
}

export interface PublicProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  telegram_username: string | null;
  public_email: string | null;
  total_stars: number;
  current_streak_days: number;
  total_referrals: number;
  is_public: boolean;
  is_banned: boolean;
}

export function useLeaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      // Use SECURITY DEFINER RPC that exposes only safe public fields.
      const { data: starsData, error: starsError } = await supabase
        .rpc('get_leaderboard_top', { _limit: 200 });

      if (starsError) throw starsError;

      if (!starsData || starsData.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Get profiles for these users
      const userIds = starsData.map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url, is_public')
        .in('user_id', userIds);

      const profilesMap = (profilesData || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      const leaderboardData: LeaderboardUser[] = starsData
        .filter(s => {
          const profile = profilesMap[s.user_id];
          return !!profile;
        })
        .slice(0, 100) // Take only first 100 after filtering banned users
        .map((s, index) => {
          const profile = profilesMap[s.user_id] || {};
          return {
            rank: index + 1,
            user_id: s.user_id,
            display_name: profile.display_name || 'Пользователь',
            avatar_url: profile.avatar_url,
            total_stars: s.total_stars,
            current_streak_days: s.current_streak_days,
            is_current_user: user?.id === s.user_id
          };
        });

      setLeaderboard(leaderboardData);

      // Check if current user is in top 100
      if (user) {
        const currentUserInTop = leaderboardData.find(u => u.user_id === user.id);
        
        if (currentUserInTop) {
          setCurrentUserRank(currentUserInTop);
        } else {
          // Fetch current user's rank via RPC (avoids cross-user reads)
          const { data: userStars } = await supabase
            .from('user_stars')
            .select('total_stars, current_streak_days')
            .eq('user_id', user.id)
            .single();

          if (userStars) {
            const { data: rank } = await supabase
              .rpc('get_user_stars_rank', { _user_id: user.id });

            const { data: userProfile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', user.id)
              .single();

            setCurrentUserRank({
              rank: (rank as number) || 1,
              user_id: user.id,
              display_name: userProfile?.display_name || 'Вы',
              avatar_url: userProfile?.avatar_url,
              total_stars: userStars.total_stars,
              current_streak_days: userStars.current_streak_days,
              is_current_user: true
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const getPublicProfile = useCallback(async (userId: string): Promise<PublicProfile | null> => {
    try {
      const [
        { data: profile },
        { data: stars },
        { data: referrals }
      ] = await Promise.all([
        supabase
          .from('public_profiles')
          .select('user_id, display_name, avatar_url, bio, public_email, is_public')
          .eq('user_id', userId)
          .single(),
        supabase
          .rpc('get_public_user_stars', { _user_ids: [userId] }),
        supabase
          .from('referrals')
          .select('id', { count: 'exact' })
          .eq('referrer_id', userId)
      ]);

      if (!profile) return null;

      const starsRow = Array.isArray(stars) ? stars[0] : null;
      return {
        user_id: userId,
        display_name: profile.display_name,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        telegram_username: null,
        public_email: profile.public_email || null,
        total_stars: starsRow?.total_stars || 0,
        current_streak_days: starsRow?.current_streak_days || 0,
        total_referrals: referrals?.length || 0,
        is_public: profile.is_public,
        is_banned: false
      };
    } catch (err) {
      console.error('Error fetching public profile:', err);
      return null;
    }
  }, []);

  return {
    leaderboard,
    currentUserRank,
    loading,
    getPublicProfile,
    refetch: fetchLeaderboard
  };
}
