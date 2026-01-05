import { useState, useEffect } from 'react';
import { Shield, Users, FileText, Crown, Search, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useLegalDocuments } from '@/hooks/useLegalDocuments';
import { supabase } from '@/integrations/supabase/client';
import { AppHeader } from '@/components/AppHeader';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';

interface UserWithRole {
  id: string;
  email: string;
  display_name: string | null;
  role: 'admin' | 'moderator' | 'user' | null;
  created_at: string;
}

export default function Admin() {
  const { t, language } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { documents, isAdmin, updateDocument, loading: docsLoading } = useLegalDocuments();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [roleToAssign, setRoleToAssign] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  
  // Document editing
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');

  const isRussian = language === 'ru';

  // Check if user is admin
  useEffect(() => {
    if (!isAdmin && !docsLoading) {
      navigate('/');
    }
  }, [isAdmin, docsLoading, navigate]);

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
            email: '', // We don't have access to email from profiles
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
        // Remove role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', selectedUser.id);

        if (error) throw error;
      } else {
        // Upsert role
        const { error } = await supabase
          .from('user_roles')
          .upsert({
            user_id: selectedUser.id,
            role: roleToAssign as 'admin' | 'moderator' | 'user',
          }, { onConflict: 'user_id,role' });

        if (error) throw error;
      }

      // Update local state
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
      case 'user': return 'bg-green-500/10 text-green-500 border-green-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (docsLoading || !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">{t('loading')}</div>
      </div>
    );
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
          subtitle={isRussian ? 'Управление пользователями и документами' : 'Manage users and documents'}
        />

        <Tabs defaultValue="users" className="mt-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="gap-2">
              <Users className="w-4 h-4" />
              {isRussian ? 'Пользователи' : 'Users'}
            </TabsTrigger>
            <TabsTrigger value="documents" className="gap-2">
              <FileText className="w-4 h-4" />
              {isRussian ? 'Документы' : 'Documents'}
            </TabsTrigger>
          </TabsList>

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
