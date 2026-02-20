import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface GroupChat {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  is_public: boolean;
  max_members: number;
  invite_code: string | null;
  created_at: string;
  updated_at: string;
  member_count?: number;
  unread_count?: number;
  last_message?: ChatMessage | null;
}

interface ChatMember {
  id: string;
  chat_id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'member';
  joined_at: string;
  last_read_at: string;
  profile?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface ChatMessage {
  id: string;
  chat_id: string;
  user_id: string;
  content: string;
  reply_to_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: {
    display_name: string | null;
    avatar_url: string | null;
  };
  reply_to?: ChatMessage | null;
}

export function useGroupChats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChats = useCallback(async () => {
    if (!user) return;

    try {
      const { data: memberData, error: memberError } = await supabase
        .from('group_chat_members')
        .select('chat_id')
        .eq('user_id', user.id);

      if (memberError) throw memberError;

      const chatIds = memberData?.map(m => m.chat_id) || [];
      
      if (chatIds.length === 0) {
        setChats([]);
        setLoading(false);
        return;
      }

      const { data: chatsData, error: chatsError } = await supabase
        .from('group_chats')
        .select('*')
        .in('id', chatIds)
        .order('updated_at', { ascending: false });

      if (chatsError) throw chatsError;

      // Get member counts and last messages for each chat
      const enrichedChats = await Promise.all(
        (chatsData || []).map(async (chat) => {
          const [membersRes, messagesRes] = await Promise.all([
            supabase
              .from('group_chat_members')
              .select('id', { count: 'exact' })
              .eq('chat_id', chat.id),
            supabase
              .from('group_chat_messages')
              .select('*')
              .eq('chat_id', chat.id)
              .eq('is_deleted', false)
              .order('created_at', { ascending: false })
              .limit(1)
          ]);

          return {
            ...chat,
            member_count: membersRes.count || 0,
            last_message: messagesRes.data?.[0] || null
          };
        })
      );

      setChats(enrichedChats);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const createChat = async (name: string, description?: string, isPublic = false) => {
    if (!user) return null;

    try {
      const { data: chat, error: chatError } = await supabase
        .from('group_chats')
        .insert({
          name,
          description,
          is_public: isPublic,
          created_by: user.id
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_chat_members')
        .insert({
          chat_id: chat.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      await fetchChats();
      toast.success('Чат создан');
      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      toast.error('Ошибка создания чата');
      return null;
    }
  };

  const joinChat = async (chatId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_chat_members')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      await fetchChats();
      toast.success('Вы присоединились к чату');
      return true;
    } catch (error) {
      console.error('Error joining chat:', error);
      toast.error('Ошибка входа в чат');
      return false;
    }
  };

  const leaveChat = async (chatId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_chat_members')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchChats();
      toast.success('Вы покинули чат');
      return true;
    } catch (error) {
      console.error('Error leaving chat:', error);
      toast.error('Ошибка выхода из чата');
      return false;
    }
  };

  const joinByInviteCode = async (inviteCode: string) => {
    if (!user) return null;

    try {
      // Find chat by invite code
      const { data: chat, error: chatError } = await supabase
        .from('group_chats')
        .select('*')
        .eq('invite_code', inviteCode.toUpperCase())
        .single();

      if (chatError || !chat) {
        toast.error('Чат не найден');
        return null;
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_chat_members')
        .select('id')
        .eq('chat_id', chat.id)
        .eq('user_id', user.id)
        .single();

      if (existing) {
        toast.info('Вы уже участник этого чата');
        return chat;
      }

      // Join the chat
      const { error } = await supabase
        .from('group_chat_members')
        .insert({
          chat_id: chat.id,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      await fetchChats();
      toast.success('Вы присоединились к чату!');
      return chat;
    } catch (error) {
      console.error('Error joining chat by invite:', error);
      toast.error('Ошибка входа в чат');
      return null;
    }
  };

  const searchPublicChats = async (query: string) => {
    try {
      const { data, error } = await supabase
        .from('group_chats')
        .select('*')
        .eq('is_public', true)
        .ilike('name', `%${query}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching chats:', error);
      return [];
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) return [];
    
    try {
      const { data, error } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url')
        .ilike('display_name', `%${query}%`)
        .limit(20);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  const inviteUserToChat = async (chatId: string, userId: string) => {
    try {
      // Check if already a member
      const { data: existing } = await supabase
        .from('group_chat_members')
        .select('id')
        .eq('chat_id', chatId)
        .eq('user_id', userId)
        .single();

      if (existing) {
        toast.info('Пользователь уже в чате');
        return false;
      }

      const { error } = await supabase
        .from('group_chat_members')
        .insert({
          chat_id: chatId,
          user_id: userId,
          role: 'member'
        });

      if (error) throw error;
      toast.success('Пользователь приглашён');
      return true;
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Ошибка приглашения');
      return false;
    }
  };

  const setMemberRole = async (chatId: string, userId: string, role: 'admin' | 'moderator' | 'member') => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_chat_members')
        .update({ role })
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) throw error;
      
      const roleLabels = { admin: 'Администратор', moderator: 'Модератор', member: 'Участник' };
      toast.success(`Роль изменена: ${roleLabels[role]}`);
      return true;
    } catch (error) {
      console.error('Error setting role:', error);
      toast.error('Ошибка изменения роли');
      return false;
    }
  };

  const banMember = async (chatId: string, userId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('group_chat_members')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) throw error;
      
      toast.success('Пользователь удалён из чата');
      return true;
    } catch (error) {
      console.error('Error banning member:', error);
      toast.error('Ошибка удаления пользователя');
      return false;
    }
  };

  return {
    chats,
    loading,
    createChat,
    joinChat,
    leaveChat,
    joinByInviteCode,
    searchPublicChats,
    searchUsers,
    inviteUserToChat,
    setMemberRole,
    banMember,
    refetch: fetchChats
  };
}

export function useChatMessages(chatId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<ChatMember[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!chatId || !user) return;

    try {
      const { data, error } = await supabase
        .from('group_chat_messages')
        .select('*')
        .eq('chat_id', chatId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Fetch sender profiles
      const userIds = [...new Set(data?.map(m => m.user_id) || [])];
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedMessages = (data || []).map(msg => ({
        ...msg,
        sender: profileMap.get(msg.user_id) || null
      }));

      setMessages(enrichedMessages);

      // Update last_read_at
      await supabase
        .from('group_chat_members')
        .update({ last_read_at: new Date().toISOString() })
        .eq('chat_id', chatId)
        .eq('user_id', user.id);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [chatId, user]);

  const fetchMembers = useCallback(async () => {
    if (!chatId) return;

    try {
      const { data, error } = await supabase
        .from('group_chat_members')
        .select('*')
        .eq('chat_id', chatId);

      if (error) throw error;

      // Fetch profiles
      const userIds = data?.map(m => m.user_id) || [];
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

      const enrichedMembers = (data || []).map(member => ({
        ...member,
        profile: profileMap.get(member.user_id) || null
      })) as ChatMember[];

      setMembers(enrichedMembers);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  }, [chatId]);

  useEffect(() => {
    fetchMessages();
    fetchMembers();
  }, [fetchMessages, fetchMembers]);

  // Real-time subscription
  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`chat-${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'group_chat_messages', filter: `chat_id=eq.${chatId}` },
        async (payload) => {
          const newMsg = payload.new as ChatMessage;
          const { data: profile } = await supabase
            .from('public_profiles')
            .select('user_id, display_name, avatar_url')
            .eq('user_id', newMsg.user_id)
            .single();

          setMessages(prev => [...prev, { ...newMsg, sender: profile || null }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  const sendMessage = async (content: string, replyToId?: string) => {
    if (!chatId || !user || !content.trim()) return false;

    try {
      const { error } = await supabase
        .from('group_chat_messages')
        .insert({
          chat_id: chatId,
          user_id: user.id,
          content: content.trim(),
          reply_to_id: replyToId || null
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Ошибка отправки сообщения');
      return false;
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('group_chat_messages')
        .update({ is_deleted: true })
        .eq('id', messageId);

      if (error) throw error;

      setMessages(prev => prev.filter(m => m.id !== messageId));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Ошибка удаления сообщения');
      return false;
    }
  };

  const deleteMessageAsAdmin = async (messageId: string) => {
    // Same as deleteMessage but can be called by admins/moderators
    return deleteMessage(messageId);
  };

  return {
    messages,
    members,
    loading,
    sendMessage,
    deleteMessage,
    deleteMessageAsAdmin,
    refetch: fetchMessages,
    refetchMembers: fetchMembers
  };
}
