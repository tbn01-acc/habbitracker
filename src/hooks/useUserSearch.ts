import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface SearchedUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  status_tag: string | null;
  interests: string[] | null;
  total_stars?: number;
  likes_count?: number;
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 20;

export function useUserSearch() {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const currentQueryRef = useRef('');

  const searchUsers = useCallback(async (searchQuery: string, pageNum: number = 0, append: boolean = false) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasMore(true);
      setPage(0);
      return;
    }

    currentQueryRef.current = searchQuery;
    setIsLoading(true);

    try {
      const offset = pageNum * PAGE_SIZE;
      
      // Search only public profiles by display_name (case-insensitive)
      const { data: profiles, error } = await supabase
        .from('public_profiles')
        .select('user_id, display_name, avatar_url, bio, status_tag, interests')
        .ilike('display_name', `%${searchQuery}%`)
        .neq('user_id', user?.id || '')
        .range(offset, offset + PAGE_SIZE - 1)
        .order('display_name');

      if (error) throw error;

      // Check if query changed while fetching
      if (currentQueryRef.current !== searchQuery) return;

      // Fetch stars for found users
      let usersWithStats: SearchedUser[] = profiles || [];
      
      if (profiles && profiles.length > 0) {
        const userIds = profiles.map(p => p.user_id);
        
        const { data: stars } = await supabase
          .from('user_stars')
          .select('user_id, total_stars')
          .in('user_id', userIds);

        const starsMap = (stars || []).reduce((acc, s) => {
          acc[s.user_id] = s.total_stars;
          return acc;
        }, {} as Record<string, number>);

        usersWithStats = profiles.map(p => ({
          ...p,
          total_stars: starsMap[p.user_id] || 0,
        }));
      }

      setHasMore((profiles?.length || 0) === PAGE_SIZE);
      
      if (append) {
        setResults(prev => [...prev, ...usersWithStats]);
      } else {
        setResults(usersWithStats);
      }
      setPage(pageNum);
    } catch (error) {
      console.error('Error searching users:', error);
      if (!append) setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchUsers(newQuery, 0, false);
    }, DEBOUNCE_MS);
  }, [searchUsers]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore && query.trim()) {
      searchUsers(query, page + 1, true);
    }
  }, [isLoading, hasMore, query, page, searchUsers]);

  const reset = useCallback(() => {
    setQuery('');
    setResults([]);
    setPage(0);
    setHasMore(true);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    query,
    setQuery: handleQueryChange,
    results,
    isLoading,
    hasMore,
    loadMore,
    reset,
  };
}
