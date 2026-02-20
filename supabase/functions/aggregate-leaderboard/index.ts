import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeaderboardData {
  user_id: string;
  total_stars: number;
  total_likes: number;
  total_activity_score: number;
  habits_completed: number;
  tasks_completed: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the user is authenticated and is an admin
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is admin
    const { data: isAdmin } = await authClient.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden - Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use service role for data aggregation
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const now = new Date();
    const todayKey = now.toISOString().split('T')[0]; // 2025-01-15
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`; // 2025-01
    const yearKey = `${now.getFullYear()}`; // 2025
    const allTimeKey = 'all';

    // Get all users with stars
    const { data: usersStars, error: starsError } = await supabase
      .from('user_stars')
      .select('user_id, total_stars, current_streak_days');

    if (starsError) {
      console.error('Error fetching user stars:', starsError);
      throw starsError;
    }

    // Get likes received per user (from post_reactions)
    const { data: reactions, error: reactionsError } = await supabase
      .from('post_reactions')
      .select('post_id, created_at')
      .eq('reaction_type', 'like');

    if (reactionsError) {
      console.error('Error fetching reactions:', reactionsError);
    }

    // Get posts to map likes to users
    const { data: posts, error: postsError } = await supabase
      .from('achievement_posts')
      .select('id, user_id, created_at');

    if (postsError) {
      console.error('Error fetching posts:', postsError);
    }

    // Create a map of post_id to user_id
    const postUserMap = new Map<string, { user_id: string; created_at: string }>();
    (posts || []).forEach(post => {
      postUserMap.set(post.id, { user_id: post.user_id, created_at: post.created_at });
    });

    // Get daily activity data
    const { data: dailyActivity, error: activityError } = await supabase
      .from('user_daily_activity')
      .select('*');

    if (activityError) {
      console.error('Error fetching daily activity:', activityError);
    }

    // Calculate aggregates for each period
    const aggregatesByPeriod = new Map<string, Map<string, LeaderboardData>>();
    
    const periods = [
      { type: 'daily', key: todayKey },
      { type: 'monthly', key: monthKey },
      { type: 'yearly', key: yearKey },
      { type: 'all', key: allTimeKey },
    ];

    periods.forEach(period => {
      aggregatesByPeriod.set(`${period.type}:${period.key}`, new Map());
    });

    // Initialize with base star data for all-time
    (usersStars || []).forEach(user => {
      const allTimeData = aggregatesByPeriod.get(`all:${allTimeKey}`)!;
      allTimeData.set(user.user_id, {
        user_id: user.user_id,
        total_stars: user.total_stars || 0,
        total_likes: 0,
        total_activity_score: 0,
        habits_completed: 0,
        tasks_completed: 0,
      });

      // Initialize for other periods
      periods.slice(0, 3).forEach(period => {
        const periodData = aggregatesByPeriod.get(`${period.type}:${period.key}`)!;
        periodData.set(user.user_id, {
          user_id: user.user_id,
          total_stars: 0,
          total_likes: 0,
          total_activity_score: 0,
          habits_completed: 0,
          tasks_completed: 0,
        });
      });
    });

    // Add likes from reactions
    (reactions || []).forEach(reaction => {
      const postInfo = postUserMap.get(reaction.post_id);
      if (!postInfo) return;

      const reactionDate = new Date(reaction.created_at);
      const reactionDay = reactionDate.toISOString().split('T')[0];
      const reactionMonth = `${reactionDate.getFullYear()}-${String(reactionDate.getMonth() + 1).padStart(2, '0')}`;
      const reactionYear = `${reactionDate.getFullYear()}`;

      // Update all-time
      const allTimeData = aggregatesByPeriod.get(`all:${allTimeKey}`)!;
      const allTimeUser = allTimeData.get(postInfo.user_id);
      if (allTimeUser) {
        allTimeUser.total_likes++;
        allTimeUser.total_activity_score += 2; // 2 points per like
      }

      // Update daily if matches today
      if (reactionDay === todayKey) {
        const dailyData = aggregatesByPeriod.get(`daily:${todayKey}`)!;
        const dailyUser = dailyData.get(postInfo.user_id);
        if (dailyUser) {
          dailyUser.total_likes++;
          dailyUser.total_activity_score += 2;
        }
      }

      // Update monthly if matches current month
      if (reactionMonth === monthKey) {
        const monthlyData = aggregatesByPeriod.get(`monthly:${monthKey}`)!;
        const monthlyUser = monthlyData.get(postInfo.user_id);
        if (monthlyUser) {
          monthlyUser.total_likes++;
          monthlyUser.total_activity_score += 2;
        }
      }

      // Update yearly if matches current year
      if (reactionYear === yearKey) {
        const yearlyData = aggregatesByPeriod.get(`yearly:${yearKey}`)!;
        const yearlyUser = yearlyData.get(postInfo.user_id);
        if (yearlyUser) {
          yearlyUser.total_likes++;
          yearlyUser.total_activity_score += 2;
        }
      }
    });

    // Add activity data
    (dailyActivity || []).forEach(activity => {
      const activityDate = new Date(activity.activity_date);
      const activityDay = activity.activity_date;
      const activityMonth = `${activityDate.getFullYear()}-${String(activityDate.getMonth() + 1).padStart(2, '0')}`;
      const activityYear = `${activityDate.getFullYear()}`;

      const habitsPoints = (activity.habits_completed || 0) * 5;
      const tasksPoints = (activity.tasks_completed || 0) * 3;
      const starsPoints = (activity.stars_earned || 0) * 1;

      // Update all-time
      const allTimeData = aggregatesByPeriod.get(`all:${allTimeKey}`)!;
      let allTimeUser = allTimeData.get(activity.user_id);
      if (!allTimeUser) {
        allTimeUser = {
          user_id: activity.user_id,
          total_stars: 0,
          total_likes: activity.likes_received || 0,
          total_activity_score: 0,
          habits_completed: 0,
          tasks_completed: 0,
        };
        allTimeData.set(activity.user_id, allTimeUser);
      }
      allTimeUser.habits_completed += activity.habits_completed || 0;
      allTimeUser.tasks_completed += activity.tasks_completed || 0;
      allTimeUser.total_activity_score += habitsPoints + tasksPoints + starsPoints;

      // Update daily
      if (activityDay === todayKey) {
        const dailyData = aggregatesByPeriod.get(`daily:${todayKey}`)!;
        let dailyUser = dailyData.get(activity.user_id);
        if (!dailyUser) {
          dailyUser = {
            user_id: activity.user_id,
            total_stars: 0,
            total_likes: 0,
            total_activity_score: 0,
            habits_completed: 0,
            tasks_completed: 0,
          };
          dailyData.set(activity.user_id, dailyUser);
        }
        dailyUser.habits_completed += activity.habits_completed || 0;
        dailyUser.tasks_completed += activity.tasks_completed || 0;
        dailyUser.total_activity_score += habitsPoints + tasksPoints + starsPoints;
        dailyUser.total_stars += activity.stars_earned || 0;
      }

      // Update monthly
      if (activityMonth === monthKey) {
        const monthlyData = aggregatesByPeriod.get(`monthly:${monthKey}`)!;
        let monthlyUser = monthlyData.get(activity.user_id);
        if (!monthlyUser) {
          monthlyUser = {
            user_id: activity.user_id,
            total_stars: 0,
            total_likes: 0,
            total_activity_score: 0,
            habits_completed: 0,
            tasks_completed: 0,
          };
          monthlyData.set(activity.user_id, monthlyUser);
        }
        monthlyUser.habits_completed += activity.habits_completed || 0;
        monthlyUser.tasks_completed += activity.tasks_completed || 0;
        monthlyUser.total_activity_score += habitsPoints + tasksPoints + starsPoints;
        monthlyUser.total_stars += activity.stars_earned || 0;
      }

      // Update yearly
      if (activityYear === yearKey) {
        const yearlyData = aggregatesByPeriod.get(`yearly:${yearKey}`)!;
        let yearlyUser = yearlyData.get(activity.user_id);
        if (!yearlyUser) {
          yearlyUser = {
            user_id: activity.user_id,
            total_stars: 0,
            total_likes: 0,
            total_activity_score: 0,
            habits_completed: 0,
            tasks_completed: 0,
          };
          yearlyData.set(activity.user_id, yearlyUser);
        }
        yearlyUser.habits_completed += activity.habits_completed || 0;
        yearlyUser.tasks_completed += activity.tasks_completed || 0;
        yearlyUser.total_activity_score += habitsPoints + tasksPoints + starsPoints;
        yearlyUser.total_stars += activity.stars_earned || 0;
      }
    });

    // Upsert aggregates to database
    const upsertRecords: any[] = [];

    for (const [periodKey, usersData] of aggregatesByPeriod) {
      const [periodType, key] = periodKey.split(':');
      
      for (const [userId, data] of usersData) {
        if (data.total_activity_score === 0 && data.total_likes === 0 && data.total_stars === 0) {
          continue; // Skip users with no activity
        }

        upsertRecords.push({
          user_id: userId,
          period_type: periodType,
          period_key: key,
          total_stars: data.total_stars,
          total_likes: data.total_likes,
          total_activity_score: data.total_activity_score,
          habits_completed: data.habits_completed,
          tasks_completed: data.tasks_completed,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Batch upsert in chunks
    const chunkSize = 100;
    for (let i = 0; i < upsertRecords.length; i += chunkSize) {
      const chunk = upsertRecords.slice(i, i + chunkSize);
      const { error: upsertError } = await supabase
        .from('leaderboard_aggregates')
        .upsert(chunk, { onConflict: 'user_id,period_type,period_key' });
      
      if (upsertError) {
        console.error('Error upserting chunk:', upsertError);
      }
    }

    console.log(`Aggregated leaderboard data for ${upsertRecords.length} records`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Aggregated ${upsertRecords.length} leaderboard records`,
        periods: periods.map(p => `${p.type}:${p.key}`)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: unknown) {
    console.error('Error aggregating leaderboard:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
