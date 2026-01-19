import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Heart, MessageCircle, ThumbsDown, Settings, UserPlus, Image, MessageSquare, CheckSquare, Repeat, Target, CloudSun, ChevronDown, ChevronRight } from 'lucide-react';
import { formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { useNotifications, UserNotification } from '@/hooks/useNotifications';
import { useTranslation } from '@/contexts/LanguageContext';
import { AppHeader } from '@/components/AppHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { NotificationSettingsDialog } from '@/components/NotificationSettingsDialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type FilterType = 'all' | 'social' | 'productivity' | 'system';

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'like':
      return <Heart className="w-4 h-4 text-red-500" />;
    case 'dislike':
      return <ThumbsDown className="w-4 h-4 text-muted-foreground" />;
    case 'comment':
      return <MessageCircle className="w-4 h-4 text-blue-500" />;
    case 'new_post':
      return <Image className="w-4 h-4 text-primary" />;
    case 'new_follower':
      return <UserPlus className="w-4 h-4 text-green-500" />;
    case 'new_chat_message':
      return <MessageSquare className="w-4 h-4 text-green-500" />;
    case 'task':
    case 'task_reminder':
    case 'task_overdue':
      return <CheckSquare className="w-4 h-4 text-blue-500" />;
    case 'habit':
    case 'habit_reminder':
      return <Repeat className="w-4 h-4 text-green-500" />;
    case 'goal':
    case 'goal_progress':
      return <Target className="w-4 h-4 text-amber-500" />;
    case 'weather':
      return <CloudSun className="w-4 h-4 text-sky-500" />;
    default:
      return <Bell className="w-4 h-4 text-primary" />;
  }
}

function getNotificationCategory(type: string): FilterType {
  const socialTypes = ['like', 'dislike', 'comment', 'new_post', 'new_follower', 'new_chat_message'];
  const productivityTypes = ['task', 'task_reminder', 'task_overdue', 'habit', 'habit_reminder', 'goal', 'goal_progress', 'weather'];
  
  if (socialTypes.includes(type)) return 'social';
  if (productivityTypes.includes(type)) return 'productivity';
  return 'system';
}

type DateGroup = 'today' | 'yesterday' | 'earlier';

function getDateGroup(dateStr: string): DateGroup {
  const date = new Date(dateStr);
  if (isToday(date)) return 'today';
  if (isYesterday(date)) return 'yesterday';
  return 'earlier';
}

interface GroupedNotifications {
  today: UserNotification[];
  yesterday: UserNotification[];
  earlier: UserNotification[];
}

function NotificationItem({ 
  notification, 
  onMarkAsRead, 
  onDelete,
  language 
}: { 
  notification: UserNotification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  language: string;
}) {
  const navigate = useNavigate();
  const locale = language === 'ru' ? ru : enUS;
  
  const handleClick = () => {
    if (!notification.is_read) {
      onMarkAsRead(notification.id);
    }
    if (notification.reference_type === 'post' && notification.reference_id) {
      navigate('/focus');
    } else if (notification.actor_id) {
      navigate(`/user/${notification.actor_id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      layout
    >
      <Card 
        className={`cursor-pointer transition-all hover:shadow-md ${
          !notification.is_read ? 'bg-primary/5 border-primary/20' : ''
        }`}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={notification.actor_profile?.avatar_url || undefined} />
                <AvatarFallback>
                  {notification.actor_profile?.display_name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background flex items-center justify-center border">
                <NotificationIcon type={notification.type} />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-sm">{notification.title}</p>
                  {notification.message && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {notification.message}
                    </p>
                  )}
                </div>
                {!notification.is_read && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(notification.created_at), { 
                  addSuffix: true, 
                  locale 
                })}
              </p>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                >
                  <Check className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Notifications() {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, deleteNotification, deleteAllNotifications } = useNotifications();
  const isRussian = language === 'ru';
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedGroups, setExpandedGroups] = useState<Record<DateGroup, boolean>>({
    today: true,
    yesterday: true,
    earlier: false,
  });

  const filteredNotifications = useMemo(() => {
    if (filter === 'all') return notifications;
    return notifications.filter(n => getNotificationCategory(n.type) === filter);
  }, [notifications, filter]);

  const groupedNotifications = useMemo<GroupedNotifications>(() => {
    const groups: GroupedNotifications = { today: [], yesterday: [], earlier: [] };
    filteredNotifications.forEach(n => {
      const group = getDateGroup(n.created_at);
      groups[group].push(n);
    });
    return groups;
  }, [filteredNotifications]);

  const toggleGroup = (group: DateGroup) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const getGroupLabel = (group: DateGroup) => {
    if (isRussian) {
      switch (group) {
        case 'today': return 'Сегодня';
        case 'yesterday': return 'Вчера';
        case 'earlier': return 'Ранее';
      }
    }
    switch (group) {
      case 'today': return 'Today';
      case 'yesterday': return 'Yesterday';
      case 'earlier': return 'Earlier';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-24">
      <AppHeader />
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Bell className="w-6 h-6 text-primary" />
                {isRussian ? 'Уведомления' : 'Notifications'}
              </h1>
              {unreadCount > 0 && (
                <p className="text-sm text-muted-foreground">
                  {isRussian 
                    ? `${unreadCount} непрочитанных` 
                    : `${unreadCount} unread`}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSettingsOpen(true)}
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isRussian ? 'Настройки' : 'Settings'}
              </TooltipContent>
            </Tooltip>
            
            {unreadCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={markAllAsRead}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isRussian ? 'Прочитать все' : 'Mark all read'}
                </TooltipContent>
              </Tooltip>
            )}
            
            {notifications.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isRussian ? 'Очистить' : 'Clear all'}
                    </TooltipContent>
                  </Tooltip>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {isRussian ? 'Удалить все уведомления?' : 'Delete all notifications?'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {isRussian 
                        ? 'Это действие нельзя отменить. Все уведомления будут безвозвратно удалены.'
                        : 'This action cannot be undone. All notifications will be permanently deleted.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>
                      {isRussian ? 'Отмена' : 'Cancel'}
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={deleteAllNotifications}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isRussian ? 'Удалить все' : 'Delete all'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <NotificationSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)} className="mb-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all" className="text-xs">
              {isRussian ? 'Все' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="social" className="text-xs">
              {isRussian ? 'Социальные' : 'Social'}
            </TabsTrigger>
            <TabsTrigger value="productivity" className="text-xs">
              {isRussian ? 'Задачи' : 'Tasks'}
            </TabsTrigger>
            <TabsTrigger value="system" className="text-xs">
              {isRussian ? 'Система' : 'System'}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Bell className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">
                {isRussian ? 'Нет уведомлений' : 'No notifications'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isRussian 
                  ? 'Здесь будут появляться уведомления о лайках и комментариях'
                  : 'Notifications about likes and comments will appear here'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {(['today', 'yesterday', 'earlier'] as DateGroup[]).map(group => {
              const groupNotifications = groupedNotifications[group];
              if (groupNotifications.length === 0) return null;
              
              return (
                <Collapsible 
                  key={group} 
                  open={expandedGroups[group]} 
                  onOpenChange={() => toggleGroup(group)}
                >
                  <CollapsibleTrigger className="flex items-center gap-2 w-full py-2 px-1 hover:bg-muted/50 rounded-lg transition-colors">
                    {expandedGroups[group] ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span className="font-medium text-sm">{getGroupLabel(group)}</span>
                    <span className="text-xs text-muted-foreground">({groupNotifications.length})</span>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-3 pt-2">
                      <AnimatePresence mode="popLayout">
                        {groupNotifications.map(notification => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            onMarkAsRead={markAsRead}
                            onDelete={deleteNotification}
                            language={language}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
