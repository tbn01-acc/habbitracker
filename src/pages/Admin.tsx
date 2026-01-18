import { useState, useEffect } from 'react';
import { Shield, Users, FileText, Crown, Search, AlertTriangle, Wallet, Settings, BarChart3, Tag, Gift, Ticket, ChevronDown, ChevronUp, Loader2, RefreshCw, Target, CheckSquare, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AdminReferrals } from '@/components/admin/AdminReferrals';
import { usePromoCodes } from '@/hooks/usePromoCodes';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface UserWithRole {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'moderator' | 'user' | 'team' | null;
  created_at: string;
}

interface AppStats {
  totalUsers: number;
  activeUsers: number;
  proUsers: number;
  totalHabits: number;
  totalTasks: number;
  totalStars: number;
  rewardsSpent: number;
}

export default function Admin() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents, isAdmin, adminLoading, updateDocument, loading: docsLoading } = useLegalDocuments();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [roleToAssign, setRoleToAssign] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Stats
  const [stats, setStats] = useState<AppStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  // Document editing
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');
  
  // Promo codes
  const { promoCodes, loading: promoLoading, createPromoCode, deletePromoCode, togglePromoCode } = usePromoCodes();
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoDiscount, setNewPromoDiscount] = useState('');
  const [newPromoValidUntil, setNewPromoValidUntil] = useState('');
  const [newPromoMaxUses, setNewPromoMaxUses] = useState('');
  
  // Settings sections
  const [bonusSettingsOpen, setBonusSettingsOpen] = useState(false);
  const [limitSettingsOpen, setLimitSettingsOpen] = useState(false);

  const isRussian = language === 'ru';
  const [adminChecked, setAdminChecked] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);

  // Wait for auth to fully load
  useEffect(() => {
    if (user !== undefined) {
      setAuthLoaded(true);
    }
  }, [user]);

  // Check if user is admin - wait for docs and admin check to fully load
  useEffect(() => {
    // Don't redirect until auth, docs, AND admin check are all fully loaded
    if (!docsLoading && !adminLoading && authLoaded) {
      setAdminChecked(true);
      // Only redirect if we know user is NOT admin (after everything is loaded)
      if (!isAdmin && user) {
        // User is logged in but not admin
        navigate('/');
      } else if (!user) {
        // User is not logged in
        navigate('/auth');
      }
    }
  }, [isAdmin, docsLoading, adminLoading, authLoaded, user, navigate]);

  // Fetch stats
  useEffect(() => {
    const fetchStats = async () => {
      if (!isAdmin) return;
      setStatsLoading(true);
      
      try {
        // Get user count
        const { count: userCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        
        // Get subscription stats
        const { data: subs } = await supabase
          .from('subscriptions')
          .select('plan')
          .eq('plan', 'pro');
        
        // Get star transactions
        const { data: starData } = await supabase
          .from('user_stars')
          .select('total_stars');
        
        const totalStars = starData?.reduce((sum, u) => sum + (u.total_stars || 0), 0) || 0;
        
        // Get habits count
        const { count: habitsCount } = await supabase
          .from('habits')
          .select('*', { count: 'exact', head: true });
        
        // Get tasks count  
        const { count: tasksCount } = await supabase
          .from('tasks')
          .select('*', { count: 'exact', head: true });
        
        setStats({
          totalUsers: userCount || 0,
          activeUsers: Math.floor((userCount || 0) * 0.7), // Estimate
          proUsers: subs?.length || 0,
          totalHabits: habitsCount || 0,
          totalTasks: tasksCount || 0,
          totalStars: totalStars,
          rewardsSpent: 0 // TODO: calculate from purchased_rewards
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setStatsLoading(false);
      }
    };
    
    fetchStats();
  }, [isAdmin]);

  // Fetch users with their roles
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isAdmin) return;

      try {
        // Get profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('user_id, display_name, created_at');

        if (profilesError) throw profilesError;

        // Get roles
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('user_id, role');

        if (rolesError) throw rolesError;

        // Combine data
        const usersWithRoles: UserWithRole[] = (profiles || []).map(profile => {
          const userRole = roles?.find(r => r.user_id === profile.user_id);
          return {
            id: profile.user_id,
            email: '',
            display_name: profile.display_name,
            role: userRole?.role || null,
            created_at: profile.created_at,
          };
        });

        setUsers(usersWithRoles);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error(isRussian ? 'Ошибка загрузки пользователей' : 'Error loading users');
      } finally {
        setUsersLoading(false);
      }
    };

    fetchUsers();
  }, [isAdmin, isRussian]);

  const handleRoleChange = async () => {
    if (!selectedUser || !roleToAssign) return;

    try {
      if (roleToAssign === 'remove') {
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: selectedUser.id,
            role: roleToAssign as 'admin' | 'moderator' | 'user' | 'team',
          }, { onConflict: 'user_id,role' });

        if (error) throw error;
      }

      setUsers(users.map(u => 
        u.id === selectedUser.id 
          ? { ...u, role: roleToAssign === 'remove' ? null : roleToAssign as any }
          : u
      ));

      toast.success(isRussian ? 'Роль обновлена' : 'Role updated');
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(isRussian ? 'Ошибка обновления роли' : 'Error updating role');
    }

    setConfirmDialogOpen(false);
    setSelectedUser(null);
    setRoleToAssign('');
  };

  const handleDocumentSave = async () => {
    if (!editingDoc) return;

    const success = await updateDocument(editingDoc, docTitle, docContent);
    if (success) {
      setEditingDoc(null);
    }
  };

  const startEditingDocument = (type: string) => {
    const doc = documents.find(d => d.type === type);
    if (doc) {
      setEditingDoc(type);
      setDocTitle(doc.title);
      setDocContent(doc.content);
    }
  };

  const filteredUsers = users.filter(u => 
    u.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.includes(searchQuery)
  );

  const getRoleBadgeColor = (role: string | null) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'moderator': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'team': return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'user': return 'bg-green-500/10 text-green-500 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (docsLoading || adminLoading || !adminChecked || !authLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
  }

  if (!isAdmin || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <PageHeader
          showTitle
          icon={<Shield className="w-5 h-5 text-red-500" />}
          iconBgClass="bg-red-500/10"
          title={isRussian ? 'Панель администратора' : 'Admin Panel'}
          subtitle={isRussian ? 'Полное управление приложением' : 'Full app management'}
        />

        <Tabs defaultValue="stats" className="mt-6">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="stats" className="flex flex-col gap-1 py-2 text-xs">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Статистика' : 'Stats'}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex flex-col gap-1 py-2 text-xs">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Пользователи' : 'Users'}</span>
            </TabsTrigger>
            <TabsTrigger value="referrals" className="flex flex-col gap-1 py-2 text-xs">
              <Wallet className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Рефералы' : 'Referrals'}</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex flex-col gap-1 py-2 text-xs">
              <Settings className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Настройки' : 'Settings'}</span>
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex flex-col gap-1 py-2 text-xs">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">{isRussian ? 'Документы' : 'Docs'}</span>
            </TabsTrigger>
          </TabsList>

          {/* Stats Tab */}
          <TabsContent value="stats" className="mt-4 space-y-4">
            {statsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : stats && (
              <>
                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-blue-500/20">
                            <Users className="w-5 h-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.totalUsers}</p>
                            <p className="text-xs text-muted-foreground">{isRussian ? 'Всего пользователей' : 'Total Users'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/20">
                            <Crown className="w-5 h-5 text-amber-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.proUsers}</p>
                            <p className="text-xs text-muted-foreground">{isRussian ? 'PRO подписчики' : 'PRO Users'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/20">
                            <Target className="w-5 h-5 text-green-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.totalHabits}</p>
                            <p className="text-xs text-muted-foreground">{isRussian ? 'Привычек' : 'Habits'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-purple-500/20">
                            <CheckSquare className="w-5 h-5 text-purple-500" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold">{stats.totalTasks}</p>
                            <p className="text-xs text-muted-foreground">{isRussian ? 'Задач' : 'Tasks'}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Additional Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      {isRussian ? 'Дополнительная статистика' : 'Additional Stats'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">{isRussian ? 'Всего звёзд заработано' : 'Total Stars Earned'}</span>
                      </div>
                      <span className="font-bold">{stats.totalStars.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-pink-500" />
                        <span className="text-sm">{isRussian ? 'Наград потрачено' : 'Rewards Spent'}</span>
                      </div>
                      <span className="font-bold">{stats.rewardsSpent}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-sm">{isRussian ? 'Конверсия в PRO' : 'PRO Conversion'}</span>
                      </div>
                      <span className="font-bold">
                        {stats.totalUsers > 0 ? ((stats.proUsers / stats.totalUsers) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{isRussian ? 'Управление ролями' : 'Role Management'}</span>
                  <Badge variant="outline">{users.length} {isRussian ? 'пользователей' : 'users'}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder={isRussian ? 'Поиск по имени или ID...' : 'Search by name or ID...'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {usersLoading ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('loading')}
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {isRussian ? 'Пользователи не найдены' : 'No users found'}
                      </div>
                    ) : (
                      filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                              {u.role === 'admin' ? (
                                <Crown className="w-5 h-5 text-amber-500" />
                              ) : (
                                <span className="text-sm font-medium text-primary">
                                  {(u.display_name || 'U')[0].toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {u.display_name || 'Unknown'}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[150px]">
                                ID: {u.id.slice(0, 8)}...
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={getRoleBadgeColor(u.role)}>
                              {u.role || (isRussian ? 'Нет роли' : 'No role')}
                            </Badge>
                            <Select
                              value=""
                              onValueChange={(value) => {
                                setSelectedUser(u);
                                setRoleToAssign(value);
                                setConfirmDialogOpen(true);
                              }}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue placeholder={isRussian ? 'Изменить' : 'Change'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="moderator">Moderator</SelectItem>
                                <SelectItem value="team">Team (PRO)</SelectItem>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="remove" className="text-destructive">
                                  {isRussian ? 'Удалить роль' : 'Remove role'}
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="mt-4">
            <AdminReferrals />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4 space-y-4">
            {/* Bonus Settings */}
            <Collapsible open={bonusSettingsOpen} onOpenChange={setBonusSettingsOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {isRussian ? 'Бонусная программа' : 'Bonus Program'}
                      </div>
                      {bonusSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                    <CardDescription>
                      {isRussian ? 'Настройки начисления звёзд и бонусов' : 'Stars and bonus settings'}
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Звёзды за ежедневный вход' : 'Stars for daily login'}</Label>
                        <Input type="number" defaultValue="1" className="w-20 text-right" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Звёзды за выполнение привычки' : 'Stars for habit completion'}</Label>
                        <Input type="number" defaultValue="1" className="w-20 text-right" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Звёзды за выполнение задачи' : 'Stars for task completion'}</Label>
                        <Input type="number" defaultValue="1" className="w-20 text-right" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Множитель за серию (7 дней)' : 'Streak multiplier (7 days)'}</Label>
                        <Input type="number" defaultValue="2" className="w-20 text-right" />
                      </div>
                    </div>
                    <Button className="w-full">{isRussian ? 'Сохранить настройки' : 'Save Settings'}</Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Limit Settings */}
            <Collapsible open={limitSettingsOpen} onOpenChange={setLimitSettingsOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        {isRussian ? 'Лимиты FREE тарифа' : 'FREE Tier Limits'}
                      </div>
                      {limitSettingsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </CardTitle>
                    <CardDescription>
                      {isRussian ? 'Ограничения для бесплатных пользователей' : 'Restrictions for free users'}
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-4">
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Макс. привычек' : 'Max habits'}</Label>
                        <Input type="number" defaultValue="3" className="w-20 text-right" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Макс. задач' : 'Max tasks'}</Label>
                        <Input type="number" defaultValue="5" className="w-20 text-right" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Макс. операций/месяц' : 'Max operations/month'}</Label>
                        <Input type="number" defaultValue="15" className="w-20 text-right" />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Разрешить подзадачи' : 'Allow subtasks'}</Label>
                        <Switch defaultChecked={false} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Разрешить вложения' : 'Allow attachments'}</Label>
                        <Switch defaultChecked={false} />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>{isRussian ? 'Разрешить регулярность' : 'Allow recurrence'}</Label>
                        <Switch defaultChecked={false} />
                      </div>
                    </div>
                    <Button className="w-full">{isRussian ? 'Сохранить настройки' : 'Save Settings'}</Button>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>

            {/* Promo Codes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-purple-500" />
                  {isRussian ? 'Промо-коды' : 'Promo Codes'}
                </CardTitle>
                <CardDescription>
                  {isRussian ? 'Создание и управление промо-кодами' : 'Create and manage promo codes'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      placeholder={isRussian ? 'Код (например, PROMO2024)' : 'Code (e.g., PROMO2024)'} 
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                    />
                    <Input 
                      type="number" 
                      placeholder={isRussian ? 'Скидка %' : 'Discount %'} 
                      value={newPromoDiscount}
                      onChange={(e) => setNewPromoDiscount(e.target.value)}
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input 
                      type="date" 
                      value={newPromoValidUntil}
                      onChange={(e) => setNewPromoValidUntil(e.target.value)}
                    />
                    <Input 
                      type="number" 
                      placeholder={isRussian ? 'Макс. использований' : 'Max uses'} 
                      value={newPromoMaxUses}
                      onChange={(e) => setNewPromoMaxUses(e.target.value)}
                      min="1"
                    />
                  </div>
                  <Button 
                    className="w-full"
                    disabled={!newPromoCode || !newPromoDiscount}
                    onClick={async () => {
                      const success = await createPromoCode({
                        code: newPromoCode,
                        discount_percent: parseInt(newPromoDiscount) || 0,
                        valid_until: newPromoValidUntil || null,
                        max_uses: newPromoMaxUses ? parseInt(newPromoMaxUses) : null,
                      });
                      if (success) {
                        setNewPromoCode('');
                        setNewPromoDiscount('');
                        setNewPromoValidUntil('');
                        setNewPromoMaxUses('');
                      }
                    }}
                  >
                    {isRussian ? 'Создать промо-код' : 'Create Promo Code'}
                  </Button>
                </div>
                
                {promoLoading ? (
                  <div className="mt-4 flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : promoCodes.length > 0 ? (
                  <div className="mt-4 space-y-2">
                    {promoCodes.map(code => (
                      <div key={code.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-sm">{code.code}</p>
                            <Badge variant="outline" className="text-xs">
                              -{code.discount_percent}%
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isRussian ? 'Использовано' : 'Used'}: {code.current_uses}
                            {code.max_uses !== null ? `/${code.max_uses}` : ''}
                            {code.valid_until && (
                              <> • {isRussian ? 'до' : 'until'} {format(new Date(code.valid_until), 'dd.MM.yyyy')}</>
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={code.is_active}
                            onCheckedChange={(checked) => togglePromoCode(code.id, checked)}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deletePromoCode(code.id)}
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-4 text-center py-6 text-muted-foreground text-sm">
                    {isRussian ? 'Нет промо-кодов' : 'No promo codes'}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {isRussian ? 'Правовые документы' : 'Legal Documents'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {editingDoc ? (
                  <div className="space-y-4">
                    <Input
                      value={docTitle}
                      onChange={(e) => setDocTitle(e.target.value)}
                      placeholder={isRussian ? 'Заголовок' : 'Title'}
                    />
                    <Textarea
                      value={docContent}
                      onChange={(e) => setDocContent(e.target.value)}
                      placeholder={isRussian ? 'Содержание (Markdown)' : 'Content (Markdown)'}
                      className="min-h-[300px] font-mono text-sm"
                    />
                    <div className="flex gap-2">
                      <Button onClick={handleDocumentSave}>
                        {isRussian ? 'Сохранить' : 'Save'}
                      </Button>
                      <Button variant="outline" onClick={() => setEditingDoc(null)}>
                        {t('cancel')}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium text-sm">{doc.title}</p>
                          <p className="text-xs text-muted-foreground">
                            v{doc.version} • {new Date(doc.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditingDocument(doc.type)}
                        >
                          {t('edit')}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Role Change Confirmation */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              {isRussian ? 'Изменить роль?' : 'Change role?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRussian 
                ? `Вы собираетесь ${roleToAssign === 'remove' ? 'удалить роль у' : `назначить роль "${roleToAssign}" для`} пользователя "${selectedUser?.display_name || 'Unknown'}".`
                : `You are about to ${roleToAssign === 'remove' ? 'remove the role from' : `assign the role "${roleToAssign}" to`} user "${selectedUser?.display_name || 'Unknown'}".`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange}>
              {isRussian ? 'Подтвердить' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
