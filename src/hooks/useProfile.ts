import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  telegram_username: string | null;
  referral_code: string | null;
  referred_by: string | null;
  bio: string | null;
  public_email: string | null;
  created_at: string;
  updated_at: string;
  is_public: boolean | null;
  is_banned: boolean | null;
  ban_until: string | null;
  ban_count: number | null;
  read_only_until: string | null;
  first_day_of_week: number | null;
  active_frame: string | null;
  active_badges: string[] | null;
  dob: string | null;
  location: string | null;
  job_title: string | null;
  status_tag: string | null;
  interests: string[] | null;
  expertise: string | null;
  can_help: string | null;
  phone: string | null;
}

// Query keys factory for better organization
export const profileKeys = {
  all: ['profiles'] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
};

// Fetch profile by user ID
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Profile not found
    }
    throw error;
  }

  return data as Profile;
}

// Update profile
async function updateProfile(
  userId: string,
  updates: Partial<Pick<Profile, 'display_name' | 'avatar_url' | 'bio' | 'telegram_username' | 'public_email' | 'is_public' | 'first_day_of_week' | 'dob' | 'location' | 'job_title' | 'status_tag' | 'interests' | 'expertise' | 'can_help' | 'phone'>>
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

/**
 * Hook to fetch user profile with caching
 * Uses staleTime to prevent unnecessary refetches
 */
export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(userId || ''),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
  });
}

/**
 * Hook to update user profile with optimistic updates
 * UI updates instantly, rolls back on error
 */
export function useUpdateProfile(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<Profile>) => updateProfile(userId!, updates),
    
    // Optimistic update: update cache before server response
    onMutate: async (newData) => {
      if (!userId) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: profileKeys.detail(userId) });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData<Profile>(profileKeys.detail(userId));

      // Optimistically update to the new value
      queryClient.setQueryData<Profile | null>(profileKeys.detail(userId), (old) => {
        if (!old) return old;
        return { ...old, ...newData, updated_at: new Date().toISOString() };
      });

      // Return context with the snapshotted value
      return { previousProfile };
    },

    // On error, rollback to the previous value
    onError: (err, _newData, context) => {
      if (userId && context?.previousProfile) {
        queryClient.setQueryData(profileKeys.detail(userId), context.previousProfile);
      }
      console.error('Error updating profile:', err);
      toast.error('Ошибка при обновлении профиля');
    },

    // Always refetch after error or success to ensure sync
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) });
      }
    },

    onSuccess: () => {
      toast.success('Профиль обновлен');
    },
  });
}

/**
 * Hook to prefetch a profile (useful for hover states, etc.)
 */
export function usePrefetchProfile() {
  const queryClient = useQueryClient();

  return (userId: string) => {
    queryClient.prefetchQuery({
      queryKey: profileKeys.detail(userId),
      queryFn: () => fetchProfile(userId),
      staleTime: 1000 * 60 * 5,
    });
  };
}
