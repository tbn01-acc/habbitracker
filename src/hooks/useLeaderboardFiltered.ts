import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type LeaderboardPeriod = 'today' | 'month' | 'year' | 'all';
export type LeaderboardSortType = 'stars' | 'likes' | 'referrals';

export interface LeaderboardUser {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_stars: number;
  total_likes: number;
  likes_count?: number;
  referrals_count?: number;
  total_activity_score: number;
  habits_completed: number;
  tasks_completed: number;
  current_streak_days: number;
  is_current_user: boolean;
}

const periodTypeMap: Record<LeaderboardPeriod, string> = {
  today: 'daily',
  month: 'monthly',
  year: 'yearly',
  all: 'all',
};

const getPeriodKey = (period: LeaderboardPeriod): string => {
  const now = new Date();
  switch (period) {
    case 'today':
      return now.toISOString().split('T')[0];
    case 'month':
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    case 'year':
      return `${now.getFullYear()}`;
    case 'all':
      return 'all';
  }
};

export function useLeaderboardFiltered(period: LeaderboardPeriod = 'all', sortType: LeaderboardSortType = 'stars') {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);

      // Always use user_stars for reliable data
      const { data: starsData, error: starsError } = await supabase
        .from('user_stars')
        .select('user_id, total_stars, current_streak_days')
        .order('total_stars', { ascending: false })
        .limit(200);

      if (starsError) throw starsError;

      if (!starsData || starsData.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      // Get profiles
      const userIds = starsData.map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, is_banned')
        .in('user_id', userIds);

      const profilesMap = (profilesData || []).reduce((acc, p) => {
        acc[p.user_id] = p;
        return acc;
      }, {} as Record<string, any>);

      // Get aggregated data if available
      const periodType = periodTypeMap[period];
      const periodKey = getPeriodKey(period);
      
      const { data: aggregatesData } = await supabase
        .from('leaderboard_aggregates')
        .select('user_id, total_likes, total_activity_score, habits_completed, tasks_completed, total_stars')
        .eq('period_type', periodType)
        .eq('period_key', periodKey)
        .in('user_id', userIds);

      const aggregatesMap = (aggregatesData || []).reduce((acc, a) => {
        acc[a.user_id] = a;
        return acc;
      }, {} as Record<string, any>);

      // Get referrals count for each user
      const { data: referralsData } = await supabase
        .from('referrals')
        .select('referrer_id')
        .in('referrer_id', userIds);

      const referralsMap: Record<string, number> = {};
      (referralsData || []).forEach(r => {
        referralsMap[r.referrer_id] = (referralsMap[r.referrer_id] || 0) + 1;
      });

      // Get likes count for each user (from their posts)
      const { data: postsData } = await supabase
        .from('achievement_posts')
        .select('user_id, likes_count')
        .in('user_id', userIds);

      const likesMap: Record<string, number> = {};
      (postsData || []).forEach(p => {
        likesMap[p.user_id] = (likesMap[p.user_id] || 0) + (p.likes_count || 0);
      });

      let leaderboardData: LeaderboardUser[] = starsData
        .filter(s => {
          const profile = profilesMap[s.user_id];
          return profile && !profile.is_banned;
        })
        .map((s) => {
          const profile = profilesMap[s.user_id] || {};
          const agg = aggregatesMap[s.user_id] || {};
          return {
            rank: 0, // Will be set after sorting
            user_id: s.user_id,
            display_name: profile.display_name || 'Пользователь',
            avatar_url: profile.avatar_url,
            total_stars: period === 'all' ? (s.total_stars || 0) : (agg.total_stars || 0),
            total_likes: agg.total_likes || 0,
            likes_count: likesMap[s.user_id] || 0,
            referrals_count: referralsMap[s.user_id] || 0,
            total_activity_score: agg.total_activity_score || 0,
            habits_completed: agg.habits_completed || 0,
            tasks_completed: agg.tasks_completed || 0,
            current_streak_days: s.current_streak_days || 0,
            is_current_user: user?.id === s.user_id,
          };
        });

      // Sort by selected type
      leaderboardData.sort((a, b) => {
        switch (sortType) {
          case 'likes':
            return (b.likes_count || 0) - (a.likes_count || 0);
          case 'referrals':
            return (b.referrals_count || 0) - (a.referrals_count || 0);
          default:
            return b.total_stars - a.total_stars;
        }
      });

      // Assign ranks and limit to top 100
      leaderboardData = leaderboardData.slice(0, 100).map((u, index) => ({
        ...u,
        rank: index + 1,
      }));

      setLeaderboard(leaderboardData);

      // Set current user rank
      if (user) {
        const currentUserInTop = leaderboardData.find(u => u.user_id === user.id);
        if (currentUserInTop) {
          setCurrentUserRank(currentUserInTop);
        } else {
          const { data: userStars } = await supabase
            .from('user_stars')
            .select('total_stars, current_streak_days')
            .eq('user_id', user.id)
            .single();

          if (userStars) {
            const { count } = await supabase
              .from('user_stars')
              .select('*', { count: 'exact', head: true })
              .gt('total_stars', userStars.total_stars);

            const { data: userProfile } = await supabase
              .from('profiles')
              .select('display_name, avatar_url')
              .eq('user_id', user.id)
              .single();

            setCurrentUserRank({
              rank: (count || 0) + 1,
              user_id: user.id,
              display_name: userProfile?.display_name || 'Вы',
              avatar_url: userProfile?.avatar_url,
              total_stars: userStars.total_stars,
              total_likes: 0,
              likes_count: likesMap[user.id] || 0,
              referrals_count: referralsMap[user.id] || 0,
              total_activity_score: 0,
              habits_completed: 0,
              tasks_completed: 0,
              current_streak_days: userStars.current_streak_days,
              is_current_user: true,
            });
          }
        }
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [user, period, sortType]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return {
    leaderboard,
    currentUserRank,
    loading,
    refetch: fetchLeaderboard,
  };
}