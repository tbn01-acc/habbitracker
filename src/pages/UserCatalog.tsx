import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, Search, Star, Heart, Filter, 
  ArrowUpDown, Loader2, X, ChevronDown, ArrowLeft 
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/LanguageContext';

interface CatalogUser {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  status_tag: string | null;
  interests: string[] | null;
  location: string | null;
  total_stars: number;
  likes_count: number;
}

const STATUS_LABELS: Record<string, string> = {
  student: 'Студент',
  entrepreneur: 'Предприниматель',
  employee: 'Сотрудник',
  freelancer: 'Фрилансер',
  manager: 'Менеджер',
  developer: 'Разработчик',
  designer: 'Дизайнер',
  other: 'Другое',
};

const STATUS_OPTIONS = Object.entries(STATUS_LABELS);
const PAGE_SIZE = 20;

type SortOption = 'stars' | 'likes' | 'name';

export default function UserCatalog() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  
  const [users, setUsers] = useState<CatalogUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('stars');
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const [allInterests, setAllInterests] = useState<string[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all unique interests for filter
  useEffect(() => {
    const fetchInterests = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('interests')
        .eq('is_public', true)
        .not('interests', 'is', null);

      if (data) {
        const allInt = data.flatMap(p => p.interests || []);
        const unique = [...new Set(allInt)].sort();
        setAllInterests(unique);
      }
    };
    fetchInterests();
  }, []);

  const fetchUsers = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    setIsLoading(true);
    
    try {
      const offset = pageNum * PAGE_SIZE;
      
      let query = supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url, bio, status_tag, interests, location')
        .eq('is_public', true)
        .neq('user_id', user?.id || '');

      // Filter by search
      if (searchQuery.trim()) {
        query = query.ilike('display_name', `%${searchQuery}%`);
      }

      // Filter by status
      if (selectedStatuses.length > 0) {
        query = query.in('status_tag', selectedStatuses);
      }

      // Note: Filtering by interests array requires contains operator
      // We'll filter client-side for interests for simplicity

      const { data: profiles, error } = await query
        .range(offset, offset + PAGE_SIZE - 1);

      if (error) throw error;

      // Filter by interests client-side if selected
      let filteredProfiles = profiles || [];
      if (selectedInterests.length > 0) {
        filteredProfiles = filteredProfiles.filter(p => 
          p.interests && selectedInterests.some(i => p.interests?.includes(i))
        );
      }

      // Fetch stars and likes for these users
      const userIds = filteredProfiles.map(p => p.user_id);
      
      let usersWithStats: CatalogUser[] = [];
      
      if (userIds.length > 0) {
        const [starsRes, likesRes] = await Promise.all([
          supabase.from('user_stars').select('user_id, total_stars').in('user_id', userIds),
          supabase.from('achievement_posts').select('user_id, likes_count').in('user_id', userIds),
        ]);

        const starsMap = (starsRes.data || []).reduce((acc, s) => {
          acc[s.user_id] = s.total_stars;
          return acc;
        }, {} as Record<string, number>);

        const likesMap = (likesRes.data || []).reduce((acc, p) => {
          acc[p.user_id] = (acc[p.user_id] || 0) + (p.likes_count || 0);
          return acc;
        }, {} as Record<string, number>);

        usersWithStats = filteredProfiles.map(p => ({
          ...p,
          total_stars: starsMap[p.user_id] || 0,
          likes_count: likesMap[p.user_id] || 0,
        }));
      }

      // Sort
      usersWithStats.sort((a, b) => {
        switch (sortBy) {
          case 'stars':
            return b.total_stars - a.total_stars;
          case 'likes':
            return b.likes_count - a.likes_count;
          case 'name':
            return (a.display_name || '').localeCompare(b.display_name || '');
          default:
            return 0;
        }
      });

      setHasMore((profiles?.length || 0) === PAGE_SIZE);
      
      if (append) {
        setUsers(prev => [...prev, ...usersWithStats]);
      } else {
        setUsers(usersWithStats);
      }
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, searchQuery, selectedStatuses, selectedInterests, sortBy]);

  // Initial fetch and refetch on filter changes
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchUsers(0, false);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchUsers]);

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchUsers(page + 1, true);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 100) {
      loadMore();
    }
  };

  const toggleStatus = (status: string) => {
    setSelectedStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedStatuses([]);
    setSelectedInterests([]);
    setSortBy('stars');
  };

  const hasActiveFilters = searchQuery || selectedStatuses.length > 0 || selectedInterests.length > 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Users className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isRussian ? 'Каталог пользователей' : 'User Catalog'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Найдите интересных людей' : 'Find interesting people'}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-6"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isRussian ? 'Поиск по имени...' : 'Search by name...'}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-2">
            {/* Sort */}
            <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
              <SelectTrigger className="w-[160px]">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stars">
                  {isRussian ? 'По звёздам' : 'By Stars'}
                </SelectItem>
                <SelectItem value="likes">
                  {isRussian ? 'По лайкам' : 'By Likes'}
                </SelectItem>
                <SelectItem value="name">
                  {isRussian ? 'По имени' : 'By Name'}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="h-4 w-4" />
                  {isRussian ? 'Статус' : 'Status'}
                  {selectedStatuses.length > 0 && (
                    <Badge variant="secondary" className="ml-1">
                      {selectedStatuses.length}
                    </Badge>
                  )}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {STATUS_OPTIONS.map(([value, label]) => (
                  <DropdownMenuCheckboxItem
                    key={value}
                    checked={selectedStatuses.includes(value)}
                    onCheckedChange={() => toggleStatus(value)}
                  >
                    {label}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Interests Filter */}
            {allInterests.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    {isRussian ? 'Интересы' : 'Interests'}
                    {selectedInterests.length > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {selectedInterests.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 max-h-64 overflow-y-auto">
                  {allInterests.slice(0, 20).map((interest) => (
                    <DropdownMenuCheckboxItem
                      key={interest}
                      checked={selectedInterests.includes(interest)}
                      onCheckedChange={() => toggleInterest(interest)}
                    >
                      {interest}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                {isRussian ? 'Сбросить' : 'Clear'}
              </Button>
            )}
          </div>
        </motion.div>

        {/* Users List */}
        <ScrollArea className="h-[calc(100vh-350px)]" onScrollCapture={handleScroll}>
          {isLoading && users.length === 0 ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>{isRussian ? 'Пользователи не найдены' : 'No users found'}</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {users.map((catalogUser, index) => (
                <motion.div
                  key={catalogUser.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card 
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => navigate(`/user/${catalogUser.user_id}`)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={catalogUser.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {(catalogUser.display_name || 'U')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium truncate">
                              {catalogUser.display_name || 'Пользователь'}
                            </p>
                          </div>
                          
                          {catalogUser.status_tag && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              {STATUS_LABELS[catalogUser.status_tag] || catalogUser.status_tag}
                            </Badge>
                          )}
                          
                          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {catalogUser.total_stars}
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-3 w-3 text-pink-500" />
                              {catalogUser.likes_count}
                            </div>
                          </div>
                          
                          {catalogUser.interests && catalogUser.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {catalogUser.interests.slice(0, 3).map(interest => (
                                <Badge key={interest} variant="outline" className="text-xs">
                                  {interest}
                                </Badge>
                              ))}
                              {catalogUser.interests.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{catalogUser.interests.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
          
          {isLoading && users.length > 0 && (
            <div className="text-center py-4">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary" />
            </div>
          )}
          
          {!hasMore && users.length > 0 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              {isRussian ? 'Все пользователи загружены' : 'All users loaded'}
            </p>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
