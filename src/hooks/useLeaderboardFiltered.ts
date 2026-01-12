import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { startOfDay, startOfWeek, startOfMonth, startOfQuarter, startOfYear, subDays, subWeeks, subMonths, subQuarters, subYears } from 'date-fns';

export type LeaderboardType = 'stars' | 'likes' | 'activity';
export type LeaderboardPeriod = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'all';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  value: number;
  is_current_user: boolean;
}

function getPeriodStart(period: LeaderboardPeriod): Date | null {
  const now = new Date();
  switch (period) {
    case 'today': return startOfDay(now);
    case 'week': return startOfWeek(now, { weekStartsOn: 1 });
    case 'month': return startOfMonth(now);
    case 'quarter': return startOfQuarter(now);
    case 'year': return startOfYear(now);
    case 'all': return null;
  }
}

export function useLeaderboardFiltered(type: LeaderboardType, period: LeaderboardPeriod) {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLeaderboard = useCallback(async () => {
    try {
      setLoading(true);
      const periodStart = getPeriodStart(period);
      const periodStartStr = periodStart?.toISOString().split('T')[0];

      let data: LeaderboardEntry[] = [];

      if (type === 'stars') {
        // For stars, use user_stars table (all time) or star_transactions for period
        if (period === 'all') {
          const { data: starsData, error } = await supabase
            .from('user_stars')
            .select('user_id, total_stars')
            .order('total_stars', { ascending: false })
            .limit(100);

          if (error) throw error;

          const userIds = (starsData || []).map(s => s.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url, is_banned')
            .in('user_id', userIds);

          const profilesMap = (profiles || []).reduce((acc, p) => {
            acc[p.user_id] = p;
            return acc;
          }, {} as Record<string, any>);

          data = (starsData || [])
            .filter(s => !profilesMap[s.user_id]?.is_banned)
            .map((s, i) => ({
              rank: i + 1,
              user_id: s.user_id,
              display_name: profilesMap[s.user_id]?.display_name || 'User',
              avatar_url: profilesMap[s.user_id]?.avatar_url,
              value: s.total_stars,
              is_current_user: user?.id === s.user_id,
            }));
        } else {
          // Get stars from star_transactions for the period
          let query = supabase
            .from('star_transactions')
            .select('user_id, amount');
          
          if (periodStartStr) {
            query = query.gte('created_at', periodStartStr);
          }

          const { data: txData, error } = await query;
          if (error) throw error;

          // Aggregate by user
          const userTotals = (txData || []).reduce((acc, tx) => {
            acc[tx.user_id] = (acc[tx.user_id] || 0) + tx.amount;
            return acc;
          }, {} as Record<string, number>);

          const sorted = Object.entries(userTotals)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 100);

          const userIds = sorted.map(([id]) => id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, display_name, avatar_url, is_banned')
            .in('user_id', userIds);

          const profilesMap = (profiles || []).reduce((acc, p) => {
            acc[p.user_id] = p;
            return acc;
          }, {} as Record<string, any>);

          data = sorted
            .filter(([id]) => !profilesMap[id]?.is_banned)
            .map(([id, value], i) => ({
              rank: i + 1,
              user_id: id,
              display_name: profilesMap[id]?.display_name || 'User',
              avatar_url: profilesMap[id]?.avatar_url,
              value,
              is_current_user: user?.id === id,
            }));
        }
      } else if (type === 'likes') {
        // Get likes from post_reactions
        let query = supabase
          .from('post_reactions')
          .select('post_id, reaction_type, achievement_posts!inner(user_id)');

        if (periodStartStr) {
          query = query.gte('created_at', periodStartStr);
        }

        const { data: reactionsData, error } = await query;
        if (error) throw error;

        // Calculate net likes per user (likes - dislikes)
        const userLikes = (reactionsData || []).reduce((acc, r: any) => {
          const userId = r.achievement_posts?.user_id;
          if (!userId) return acc;
          const delta = r.reaction_type === 'like' ? 1 : -1;
          acc[userId] = (acc[userId] || 0) + delta;
          return acc;
        }, {} as Record<string, number>);

        const sorted = Object.entries(userLikes)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 100);

        const userIds = sorted.map(([id]) => id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, is_banned')
          .in('user_id', userIds);

        const profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);

        data = sorted
          .filter(([id]) => !profilesMap[id]?.is_banned)
          .map(([id, value], i) => ({
            rank: i + 1,
            user_id: id,
            display_name: profilesMap[id]?.display_name || 'User',
            avatar_url: profilesMap[id]?.avatar_url,
            value,
            is_current_user: user?.id === id,
          }));
      } else if (type === 'activity') {
        // Get activity from user_daily_activity
        let query = supabase
          .from('user_daily_activity')
          .select('user_id, habits_completed, tasks_completed');

        if (periodStartStr) {
          query = query.gte('activity_date', periodStartStr);
        }

        const { data: activityData, error } = await query;
        if (error) throw error;

        // Aggregate activity per user
        const userActivity = (activityData || []).reduce((acc, a) => {
          acc[a.user_id] = (acc[a.user_id] || 0) + a.habits_completed + a.tasks_completed;
          return acc;
        }, {} as Record<string, number>);

        const sorted = Object.entries(userActivity)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 100);

        const userIds = sorted.map(([id]) => id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url, is_banned')
          .in('user_id', userIds);

        const profilesMap = (profiles || []).reduce((acc, p) => {
          acc[p.user_id] = p;
          return acc;
        }, {} as Record<string, any>);

        data = sorted
          .filter(([id]) => !profilesMap[id]?.is_banned)
          .map(([id, value], i) => ({
            rank: i + 1,
            user_id: id,
            display_name: profilesMap[id]?.display_name || 'User',
            avatar_url: profilesMap[id]?.avatar_url,
            value,
            is_current_user: user?.id === id,
          }));
      }

      setLeaderboard(data);

      // Check if current user is in top 100
      if (user) {
        const inTop = data.find(d => d.user_id === user.id);
        setCurrentUserRank(inTop || null);
      }
    } catch (err) {
      console.error('Error fetching filtered leaderboard:', err);
    } finally {
      setLoading(false);
    }
  }, [type, period, user]);

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
