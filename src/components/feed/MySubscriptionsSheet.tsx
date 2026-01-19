import { useNavigate } from 'react-router-dom';
import { Loader2, Users, Heart } from 'lucide-react';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useTranslation } from '@/contexts/LanguageContext';
import { UserAvatarWithFrame } from '@/components/rewards/UserAvatarWithFrame';
import { UserSubscribeButton } from './UserSubscribeButton';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface MySubscriptionsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MySubscriptionsSheet({ open, onOpenChange }: MySubscriptionsSheetProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const { following, followers, isLoading, followingCount, followersCount } = useUserSubscriptions();
  const isRussian = language === 'ru';

  const handleUserClick = (userId: string) => {
    onOpenChange(false);
    navigate(`/user/${userId}`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader className="pb-4">
          <div className="flex items-center gap-3">
            <Heart className="w-6 h-6 text-primary" />
            <SheetTitle>
              {isRussian ? 'Подписки' : 'Subscriptions'}
            </SheetTitle>
          </div>
        </SheetHeader>

        <Tabs defaultValue="following" className="h-[calc(100%-80px)]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="following" className="gap-2">
              {isRussian ? 'Подписки' : 'Following'}
              <Badge variant="secondary" className="text-xs">{followingCount}</Badge>
            </TabsTrigger>
            <TabsTrigger value="followers" className="gap-2">
              {isRussian ? 'Подписчики' : 'Followers'}
              <Badge variant="secondary" className="text-xs">{followersCount}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="following" className="h-full mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : following.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {isRussian ? 'Вы пока ни на кого не подписаны' : 'You are not following anyone yet'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100%-40px)]">
                <div className="space-y-3 pr-4">
                  {following.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => handleUserClick(sub.following_id)}
                      >
                        <UserAvatarWithFrame
                          avatarUrl={sub.profile?.avatar_url}
                          displayName={sub.profile?.display_name}
                          size="sm"
                        />
                        <span className="font-medium text-sm">
                          {sub.profile?.display_name || 'User'}
                        </span>
                      </div>
                      <UserSubscribeButton userId={sub.following_id} size="sm" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="followers" className="h-full mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : followers.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  {isRussian ? 'У вас пока нет подписчиков' : 'You have no followers yet'}
                </p>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100%-40px)]">
                <div className="space-y-3 pr-4">
                  {followers.map((sub) => (
                    <div 
                      key={sub.id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div 
                        className="flex items-center gap-3 cursor-pointer flex-1"
                        onClick={() => handleUserClick(sub.follower_id)}
                      >
                        <UserAvatarWithFrame
                          avatarUrl={sub.profile?.avatar_url}
                          displayName={sub.profile?.display_name}
                          size="sm"
                        />
                        <span className="font-medium text-sm">
                          {sub.profile?.display_name || 'User'}
                        </span>
                      </div>
                      <UserSubscribeButton userId={sub.follower_id} size="sm" />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
