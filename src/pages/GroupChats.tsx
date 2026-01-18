import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Plus, Users, Search, ArrowLeft, Settings,
  Send, MoreVertical, Reply, Trash2, UserPlus, LogOut, Link, Copy, Globe, Shield, Ban, Crown, UserMinus
} from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { useGroupChats, useChatMessages } from '@/hooks/useGroupChats';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { toast } from 'sonner';

export default function GroupChats() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { chats, loading, createChat, leaveChat, joinByInviteCode, searchPublicChats, searchUsers, inviteUserToChat, setMemberRole, banMember } = useGroupChats();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [newChatName, setNewChatName] = useState('');
  const [newChatDescription, setNewChatDescription] = useState('');
  const [newChatPublic, setNewChatPublic] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [publicChatsSearch, setPublicChatsSearch] = useState('');
  const [publicChats, setPublicChats] = useState<any[]>([]);
  const [searchingPublic, setSearchingPublic] = useState(false);

  // Handle invite code from URL
  useEffect(() => {
    if (inviteCode && user) {
      joinByInviteCode(inviteCode).then((chat) => {
        if (chat) {
          setSelectedChatId(chat.id);
          navigate('/chats', { replace: true });
        }
      });
    }
  }, [inviteCode, user]);

  const selectedChat = chats.find(c => c.id === selectedChatId);

  const handleCreateChat = async () => {
    if (!newChatName.trim()) return;
    
    const chat = await createChat(newChatName.trim(), newChatDescription.trim() || undefined, newChatPublic);
    if (chat) {
      setCreateDialogOpen(false);
      setNewChatName('');
      setNewChatDescription('');
      setNewChatPublic(false);
      setSelectedChatId(chat.id);
    }
  };

  const handleLeaveChat = async (chatId: string) => {
    await leaveChat(chatId);
    if (selectedChatId === chatId) {
      setSelectedChatId(null);
    }
  };

  const handleJoinByCode = async () => {
    if (!inviteCodeInput.trim()) return;
    const chat = await joinByInviteCode(inviteCodeInput.trim());
    if (chat) {
      setJoinDialogOpen(false);
      setInviteCodeInput('');
      setSelectedChatId(chat.id);
    }
  };

  const handleSearchPublicChats = async () => {
    if (!publicChatsSearch.trim()) return;
    setSearchingPublic(true);
    const results = await searchPublicChats(publicChatsSearch);
    setPublicChats(results);
    setSearchingPublic(false);
  };

  const handleJoinPublicChat = async (chatId: string) => {
    const { joinChat } = useGroupChats();
    // For public chats, we can directly join
    const success = await joinByInviteCode('');
    if (success) {
      setJoinDialogOpen(false);
      setSelectedChatId(chatId);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Групповые чаты</h2>
          <p className="text-muted-foreground">Войдите, чтобы участвовать в групповых чатах</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-6xl mx-auto">
        <div className="flex h-[calc(100vh-8rem)]">
          {/* Chat List Sidebar */}
          <div className={`w-full md:w-80 border-r border-border flex-shrink-0 ${selectedChatId ? 'hidden md:flex' : 'flex'} flex-col`}>
            <div className="p-4 border-b border-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h2 className="text-lg font-semibold">Чаты</h2>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="outline">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Создать чат</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="chatName">Название</Label>
                        <Input
                          id="chatName"
                          value={newChatName}
                          onChange={(e) => setNewChatName(e.target.value)}
                          placeholder="Название чата"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="chatDesc">Описание</Label>
                        <Textarea
                          id="chatDesc"
                          value={newChatDescription}
                          onChange={(e) => setNewChatDescription(e.target.value)}
                          placeholder="О чём этот чат?"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor="chatPublic">Публичный чат</Label>
                          <p className="text-xs text-muted-foreground">Все смогут найти и присоединиться</p>
                        </div>
                        <Switch
                          id="chatPublic"
                          checked={newChatPublic}
                          onCheckedChange={setNewChatPublic}
                        />
                      </div>
                      <Button onClick={handleCreateChat} className="w-full" disabled={!newChatName.trim()}>
                        Создать чат
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                
                {/* Join Chat Dialog */}
                <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <Link className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Присоединиться к чату</DialogTitle>
                    </DialogHeader>
                    <Tabs defaultValue="code" className="mt-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="code">По коду</TabsTrigger>
                        <TabsTrigger value="public">Публичные</TabsTrigger>
                      </TabsList>
                      <TabsContent value="code" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label>Код приглашения</Label>
                          <Input
                            value={inviteCodeInput}
                            onChange={(e) => setInviteCodeInput(e.target.value.toUpperCase())}
                            placeholder="Например: ABC12345"
                            maxLength={8}
                          />
                        </div>
                        <Button onClick={handleJoinByCode} className="w-full" disabled={!inviteCodeInput.trim()}>
                          Присоединиться
                        </Button>
                      </TabsContent>
                      <TabsContent value="public" className="space-y-4 mt-4">
                        <div className="flex gap-2">
                          <Input
                            value={publicChatsSearch}
                            onChange={(e) => setPublicChatsSearch(e.target.value)}
                            placeholder="Поиск публичных чатов..."
                          />
                          <Button onClick={handleSearchPublicChats} disabled={searchingPublic}>
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                        <ScrollArea className="h-48">
                          {publicChats.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                              <Globe className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">Введите запрос для поиска</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {publicChats.map(chat => (
                                <Card key={chat.id} className="p-3 cursor-pointer hover:bg-muted/50">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{chat.name}</p>
                                      <p className="text-xs text-muted-foreground">{chat.description}</p>
                                    </div>
                                    <Button size="sm" onClick={() => handleJoinPublicChat(chat.id)}>
                                      Войти
                                    </Button>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Поиск чатов..."
                  className="pl-9"
                />
              </div>
            </div>

            <ScrollArea className="flex-1">
              {loading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Нет чатов</p>
                  <p className="text-sm text-muted-foreground">Создайте первый чат!</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {filteredChats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedChatId === chat.id ? 'bg-muted' : ''
                      }`}
                      onClick={() => setSelectedChatId(chat.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={chat.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {chat.name[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium truncate">{chat.name}</h3>
                            {chat.last_message && (
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(chat.last_message.created_at), 'HH:mm')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground truncate flex-1">
                              {chat.last_message?.content || chat.description || 'Нет сообщений'}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              <Users className="w-3 h-3 mr-1" />
                              {chat.member_count}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat View */}
          {selectedChatId && selectedChat ? (
            <ChatView 
              chatId={selectedChatId} 
              chat={selectedChat}
              onBack={() => setSelectedChatId(null)}
              onLeave={() => handleLeaveChat(selectedChatId)}
              onSetRole={(userId, role) => setMemberRole(selectedChatId, userId, role)}
              onBanMember={(userId) => banMember(selectedChatId, userId)}
            />
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Выберите чат</h3>
                <p className="text-muted-foreground">Или создайте новый</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChatViewProps {
  chatId: string;
  chat: {
    id: string;
    name: string;
    description: string | null;
    created_by: string;
    invite_code?: string | null;
  };
  onBack: () => void;
  onLeave: () => void;
  onSetRole: (userId: string, role: 'admin' | 'moderator' | 'member') => Promise<boolean>;
  onBanMember: (userId: string) => Promise<boolean>;
}

function ChatView({ chatId, chat, onBack, onLeave, onSetRole, onBanMember }: ChatViewProps) {
  const { user } = useAuth();
  const { messages, members, loading, sendMessage, deleteMessage, refetchMembers } = useChatMessages(chatId);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const { searchUsers, inviteUserToChat } = useGroupChats();

  const handleSend = async () => {
    if (!newMessage.trim() || sending) return;
    
    setSending(true);
    await sendMessage(newMessage);
    setNewMessage('');
    setSending(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isAdmin = members.some(m => m.user_id === user?.id && m.role === 'admin');
  const isModerator = members.some(m => m.user_id === user?.id && (m.role === 'admin' || m.role === 'moderator'));
  
  const handleSetRole = async (userId: string, role: 'admin' | 'moderator' | 'member') => {
    const success = await onSetRole(userId, role);
    if (success) refetchMembers();
  };

  const handleBanMember = async (userId: string) => {
    const success = await onBanMember(userId);
    if (success) refetchMembers();
  };

  const handleSearchUsers = async () => {
    if (!userSearchQuery.trim()) return;
    const results = await searchUsers(userSearchQuery);
    setSearchResults(results.filter(u => u.user_id !== user?.id && !members.some(m => m.user_id === u.user_id)));
  };

  const handleInviteUser = async (userId: string) => {
    const success = await inviteUserToChat(chatId, userId);
    if (success) {
      setSearchResults(prev => prev.filter(u => u.user_id !== userId));
      refetchMembers();
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Chat Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary/10 text-primary">
              {chat.name[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">{chat.name}</h3>
            <p className="text-xs text-muted-foreground">
              {members.length} участников
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowMembers(!showMembers)}>
            <Users className="w-5 h-5" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {chat.invite_code && (
                <DropdownMenuItem onClick={() => {
                  const inviteUrl = `${window.location.origin}/chats/${chat.invite_code}`;
                  navigator.clipboard.writeText(inviteUrl);
                  toast.success('Ссылка скопирована!');
                }}>
                  <Copy className="w-4 h-4 mr-2" />
                  Копировать ссылку
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem onClick={() => {
                  toast.info(`Код приглашения: ${chat.invite_code}`);
                }}>
                  <Link className="w-4 h-4 mr-2" />
                  Код: {chat.invite_code}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onLeave} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Покинуть чат
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-3/4" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">Нет сообщений</p>
                <p className="text-sm text-muted-foreground">Начните общение!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => {
                const isOwn = msg.user_id === user?.id;
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                      {!isOwn && (
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={msg.sender?.avatar_url || undefined} />
                            <AvatarFallback className="text-xs">
                              {(msg.sender?.display_name || 'U')[0].toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-xs font-medium text-muted-foreground">
                            {msg.sender?.display_name || 'Пользователь'}
                          </span>
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwn 
                            ? 'bg-primary text-primary-foreground rounded-br-md' 
                            : 'bg-muted rounded-bl-md'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                        <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                          {format(new Date(msg.created_at), 'HH:mm', { locale: ru })}
                        </p>
                      </div>
                      {/* Delete button - for own messages or moderators */}
                      {(isOwn || isModerator) && (
                        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mt-1`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => deleteMessage(msg.id)}
                            title={isOwn ? 'Удалить сообщение' : 'Удалить как модератор'}
                          >
                            <Trash2 className={`w-3 h-3 ${isOwn ? 'text-muted-foreground' : 'text-destructive'}`} />
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Members Sidebar */}
        {showMembers && (
          <div className="w-72 border-l border-border p-4 hidden md:block overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium">Участники ({members.length})</h4>
              {isAdmin && (
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline">
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Пригласить пользователя</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex gap-2">
                        <Input
                          value={userSearchQuery}
                          onChange={(e) => setUserSearchQuery(e.target.value)}
                          placeholder="Поиск по имени..."
                          onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
                        />
                        <Button onClick={handleSearchUsers}>
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                      <ScrollArea className="h-48">
                        {searchResults.length === 0 ? (
                          <p className="text-center text-muted-foreground py-4 text-sm">
                            Введите имя для поиска
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {searchResults.map(u => (
                              <div key={u.user_id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted">
                                <div className="flex items-center gap-2">
                                  <Avatar className="w-8 h-8">
                                    <AvatarImage src={u.avatar_url || undefined} />
                                    <AvatarFallback className="text-xs">
                                      {(u.display_name || 'U')[0].toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{u.display_name || 'Пользователь'}</span>
                                </div>
                                <Button size="sm" onClick={() => handleInviteUser(u.user_id)}>
                                  Пригласить
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
            <div className="space-y-2">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-2 group">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={member.profile?.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {(member.profile?.display_name || 'U')[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {member.profile?.display_name || 'Пользователь'}
                    </p>
                    {member.role !== 'member' && (
                      <Badge variant="outline" className="text-xs">
                        {member.role === 'admin' ? 'Админ' : 'Модератор'}
                      </Badge>
                    )}
                  </div>
                  {/* Moderation Actions */}
                  {isAdmin && member.user_id !== user?.id && member.user_id !== chat.created_by && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSetRole(member.user_id, 'moderator')}>
                          <Shield className="w-4 h-4 mr-2" />
                          Назначить модератором
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleSetRole(member.user_id, 'admin')}>
                          <Crown className="w-4 h-4 mr-2" />
                          Назначить админом
                        </DropdownMenuItem>
                        {member.role !== 'member' && (
                          <DropdownMenuItem onClick={() => handleSetRole(member.user_id, 'member')}>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Снять роль
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleBanMember(member.user_id)}
                          className="text-destructive"
                        >
                          <Ban className="w-4 h-4 mr-2" />
                          Удалить из чата
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border">
        <div className="flex items-end gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите сообщение..."
            className="min-h-[44px] max-h-32 resize-none"
            rows={1}
          />
          <Button 
            size="icon" 
            onClick={handleSend} 
            disabled={!newMessage.trim() || sending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
