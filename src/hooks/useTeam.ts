import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

export interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  owner_id: string;
  invite_code: string | null;
  max_members: number;
  created_at: string;
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: string;
  joined_at: string;
  last_active_at: string;
  presence_status: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
    email: string | null;
  };
}

export interface Sprint {
  id: string;
  team_id: string;
  creator_id: string;
  title: string;
  goal: string | null;
  status: string;
  start_date: string;
  end_date: string;
  total_sp_planned: number;
  total_sp_completed: number;
  xp_pool: number;
  created_at: string;
}

export interface SprintTask {
  id: string;
  sprint_id: string;
  team_id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  story_points: number;
  assignee_id: string | null;
  creator_id: string;
  sprint_order: number;
  completed_at: string | null;
  created_at: string;
  assignee?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface SprintParticipant {
  id: string;
  sprint_id: string;
  user_id: string;
  role: string;
  sp_contributed: number;
  xp_earned: number;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface SprintDailyStat {
  id: string;
  sprint_id: string;
  record_date: string;
  remaining_sp: number;
  completed_sp: number;
}

export interface SprintFeedback {
  id: string;
  sprint_id: string;
  user_id: string;
  went_well: string | null;
  to_improve: string | null;
  action_items: string | null;
  created_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export function useTeam() {
  const { user } = useAuth();
  const [team, setTeam] = useState<Team | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [activeSprint, setActiveSprint] = useState<Sprint | null>(null);
  const [sprintTasks, setSprintTasks] = useState<SprintTask[]>([]);
  const [sprintParticipants, setSprintParticipants] = useState<SprintParticipant[]>([]);
  const [dailyStats, setDailyStats] = useState<SprintDailyStat[]>([]);
  const [feedback, setFeedback] = useState<SprintFeedback[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeam = useCallback(async () => {
    if (!user) return;
    try {
      // Get user's team membership
      const { data: membership } = await supabase
        .from('team_members')
        .select('team_id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!membership) {
        setLoading(false);
        return;
      }

      const { data: teamData } = await supabase
        .from('teams')
        .select('*')
        .eq('id', membership.team_id)
        .single();

      if (teamData) {
        setTeam(teamData as Team);
        await Promise.all([
          fetchMembers(membership.team_id),
          fetchSprints(membership.team_id),
        ]);
      }
    } catch (err) {
      console.error('Error fetching team:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const fetchMembers = async (teamId: string) => {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', teamId);
    
    if (data) {
      // Fetch profiles for members
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, email')
        .in('user_id', userIds);

      const membersWithProfiles = data.map(m => ({
        ...m,
        profile: profiles?.find(p => p.user_id === m.user_id) || undefined,
      }));
      setMembers(membersWithProfiles as TeamMember[]);
    }
  };

  const fetchSprints = async (teamId: string) => {
    const { data } = await supabase
      .from('sprints')
      .select('*')
      .eq('team_id', teamId)
      .order('created_at', { ascending: false });

    if (data) {
      setSprints(data as Sprint[]);
      const active = data.find(s => s.status === 'active') as Sprint | undefined;
      setActiveSprint(active || null);
      if (active) {
        await Promise.all([
          fetchSprintTasks(active.id),
          fetchSprintParticipants(active.id),
          fetchDailyStats(active.id),
          fetchFeedback(active.id),
        ]);
      }
    }
  };

  const fetchSprintTasks = async (sprintId: string) => {
    const { data } = await supabase
      .from('sprint_tasks')
      .select('*')
      .eq('sprint_id', sprintId)
      .order('sprint_order', { ascending: true });

    if (data) {
      const assigneeIds = data.filter(t => t.assignee_id).map(t => t.assignee_id!);
      let profiles: any[] = [];
      if (assigneeIds.length > 0) {
        const { data: p } = await supabase
          .from('profiles')
          .select('user_id, display_name, avatar_url')
          .in('user_id', assigneeIds);
        profiles = p || [];
      }

      setSprintTasks(data.map(t => ({
        ...t,
        assignee: profiles.find(p => p.user_id === t.assignee_id) || undefined,
      })) as SprintTask[]);
    }
  };

  const fetchSprintParticipants = async (sprintId: string) => {
    const { data } = await supabase
      .from('sprint_participants')
      .select('*')
      .eq('sprint_id', sprintId);

    if (data) {
      const userIds = data.map(p => p.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      setSprintParticipants(data.map(p => ({
        ...p,
        profile: profiles?.find(pr => pr.user_id === p.user_id) || undefined,
      })) as SprintParticipant[]);
    }
  };

  const fetchDailyStats = async (sprintId: string) => {
    const { data } = await supabase
      .from('sprint_daily_stats')
      .select('*')
      .eq('sprint_id', sprintId)
      .order('record_date', { ascending: true });

    if (data) setDailyStats(data as SprintDailyStat[]);
  };

  const fetchFeedback = async (sprintId: string) => {
    const { data } = await supabase
      .from('sprint_feedback')
      .select('*')
      .eq('sprint_id', sprintId);

    if (data) {
      const userIds = data.map(f => f.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      setFeedback(data.map(f => ({
        ...f,
        profile: profiles?.find(p => p.user_id === f.user_id) || undefined,
      })) as SprintFeedback[]);
    }
  };

  // Create team
  const createTeam = async (name: string, description?: string) => {
    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Требуется авторизация. Войдите в аккаунт и попробуйте снова.',
        variant: 'destructive',
      });
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      toast({
        title: 'Сессия истекла',
        description: 'Пожалуйста, войдите снова и повторите создание команды.',
        variant: 'destructive',
      });
      return;
    }

    const { data, error } = await supabase
      .from('teams')
      .insert({ name, description, owner_id: authData.user.id })
      .select()
      .single();

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    // Add owner as member
    const { error: memberError } = await supabase
      .from('team_members')
      .insert({ team_id: data.id, user_id: authData.user.id, role: 'owner' });

    if (memberError) {
      // best-effort cleanup to avoid orphan team without membership
      await supabase.from('teams').delete().eq('id', data.id);
      toast({ title: 'Ошибка', description: memberError.message, variant: 'destructive' });
      return;
    }

    await fetchTeam();
    toast({ title: 'Команда создана!' });
  };

  // Create sprint
  const createSprint = async (sprintData: {
    title: string;
    goal?: string;
    start_date: string;
    end_date: string;
    participant_ids: string[];
  }) => {
    if (!user || !team) return;
    const { data, error } = await supabase
      .from('sprints')
      .insert({
        team_id: team.id,
        creator_id: user.id,
        title: sprintData.title,
        goal: sprintData.goal,
        start_date: sprintData.start_date,
        end_date: sprintData.end_date,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    // Add participants
    if (sprintData.participant_ids.length > 0) {
      await supabase
        .from('sprint_participants')
        .insert(sprintData.participant_ids.map(uid => ({
          sprint_id: data.id,
          user_id: uid,
        })));
    }

    await fetchSprints(team.id);
    toast({ title: 'Спринт запущен! 🚀' });
  };

  // Add sprint task
  const addSprintTask = async (taskData: {
    title: string;
    description?: string;
    story_points?: number;
    priority?: string;
    assignee_id?: string;
  }) => {
    if (!user || !team || !activeSprint) return;
    const { error } = await supabase
      .from('sprint_tasks')
      .insert({
        sprint_id: activeSprint.id,
        team_id: team.id,
        title: taskData.title,
        description: taskData.description,
        story_points: taskData.story_points || 1,
        priority: taskData.priority || 'medium',
        assignee_id: taskData.assignee_id,
        creator_id: user.id,
      });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchSprintTasks(activeSprint.id);
  };

  // Update sprint task status
  const updateTaskStatus = async (taskId: string, status: string) => {
    const { error } = await supabase
      .from('sprint_tasks')
      .update({ status })
      .eq('id', taskId);

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    if (activeSprint) {
      await Promise.all([
        fetchSprintTasks(activeSprint.id),
        fetchSprintParticipants(activeSprint.id),
        fetchSprints(team!.id),
      ]);
    }
  };

  // Finish sprint
  const finishSprint = async (sprintId: string) => {
    const { data, error } = await supabase.rpc('finish_sprint', {
      target_sprint_id: sprintId,
    });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return null;
    }

    await fetchSprints(team!.id);
    return data;
  };

  // Submit feedback
  const submitFeedback = async (sprintId: string, fb: {
    went_well: string;
    to_improve: string;
    action_items: string;
  }) => {
    if (!user) return;
    const { error } = await supabase
      .from('sprint_feedback')
      .insert({
        sprint_id: sprintId,
        user_id: user.id,
        ...fb,
      });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchFeedback(sprintId);
    toast({ title: 'Обратная связь сохранена!' });
  };

  // Join team by invite code
  const joinTeam = async (inviteCode: string) => {
    if (!user) return;
    const { data: teamData } = await supabase
      .from('teams')
      .select('id')
      .eq('invite_code', inviteCode)
      .single();

    if (!teamData) {
      toast({ title: 'Команда не найдена', variant: 'destructive' });
      return;
    }

    const { error } = await supabase
      .from('team_members')
      .insert({ team_id: teamData.id, user_id: user.id, role: 'member' });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchTeam();
    toast({ title: 'Вы присоединились к команде! 🎉' });
  };

  // Invite member
  const inviteMember = async (userId: string) => {
    if (!team) return;
    const { error } = await supabase
      .from('team_members')
      .insert({ team_id: team.id, user_id: userId, role: 'member' });

    if (error) {
      toast({ title: 'Ошибка', description: error.message, variant: 'destructive' });
      return;
    }

    await fetchMembers(team.id);
    toast({ title: 'Участник добавлен!' });
  };

  // Realtime subscriptions
  useEffect(() => {
    if (!team) return;

    const channel = supabase
      .channel(`team-${team.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sprint_tasks',
        filter: `team_id=eq.${team.id}`,
      }, () => {
        if (activeSprint) {
          fetchSprintTasks(activeSprint.id);
          fetchSprints(team.id);
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'team_members',
        filter: `team_id=eq.${team.id}`,
      }, () => {
        fetchMembers(team.id);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [team?.id, activeSprint?.id]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  return {
    team,
    members,
    sprints,
    activeSprint,
    sprintTasks,
    sprintParticipants,
    dailyStats,
    feedback,
    loading,
    createTeam,
    createSprint,
    addSprintTask,
    updateTaskStatus,
    finishSprint,
    submitFeedback,
    joinTeam,
    inviteMember,
    fetchSprintTasks,
    fetchSprintParticipants,
    fetchDailyStats,
    fetchFeedback,
    fetchSprints,
    fetchTeam,
  };
}
