import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useAuth } from '@/hooks/useAuth';

interface SubscribeButtonProps {
  userId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export function SubscribeButton({ userId, variant = 'outline', size = 'sm', showLabel = true, className }: SubscribeButtonProps) {
  const { user } = useAuth();
  const { isFollowing, subscribe, unsubscribe } = useUserSubscriptions();
  const [isLoading, setIsLoading] = useState(false);

  // Don't show button if viewing own profile or not logged in
  if (!user || user.id === userId) {
    return null;
  }

  const following = isFollowing(userId);

  const handleClick = async () => {
    setIsLoading(true);
    try {
      if (following) {
        await unsubscribe(userId);
      } else {
        await subscribe(userId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant={following ? 'ghost' : variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={`${following ? 'text-muted-foreground' : ''} ${className || ''}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : following ? (
        <>
          <UserMinus className="w-4 h-4" />
          {showLabel && <span className="ml-1">Отписаться</span>}
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          {showLabel && <span className="ml-1">Подписаться</span>}
        </>
      )}
    </Button>
  );
}
