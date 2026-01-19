import { useState } from 'react';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useUserSubscriptions } from '@/hooks/useUserSubscriptions';
import { useTranslation } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

interface UserSubscribeButtonProps {
  userId: string;
  size?: 'sm' | 'default';
  className?: string;
}

export function UserSubscribeButton({ userId, size = 'default', className }: UserSubscribeButtonProps) {
  const { language } = useTranslation();
  const { isFollowing, subscribe, unsubscribe } = useUserSubscriptions();
  const [loading, setLoading] = useState(false);
  const isRussian = language === 'ru';
  
  const following = isFollowing(userId);

  const handleClick = async () => {
    setLoading(true);
    if (following) {
      await unsubscribe(userId);
    } else {
      await subscribe(userId);
    }
    setLoading(false);
  };

  return (
    <Button
      variant={following ? 'outline' : 'default'}
      size={size}
      onClick={handleClick}
      disabled={loading}
      className={className}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : following ? (
        <>
          <UserMinus className="w-4 h-4 mr-1" />
          {isRussian ? 'Отписаться' : 'Unfollow'}
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4 mr-1" />
          {isRussian ? 'Подписаться' : 'Follow'}
        </>
      )}
    </Button>
  );
}
