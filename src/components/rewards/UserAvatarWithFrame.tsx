import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AvatarFrame {
  id: string;
  className: string;
  animationClass?: string;
}

// Frame definitions with animations
export const AVATAR_FRAMES: Record<string, AvatarFrame> = {
  gold_frame: {
    id: 'gold_frame',
    className: 'ring-4 ring-yellow-400 shadow-lg shadow-yellow-400/30',
    animationClass: 'animate-pulse-slow',
  },
  fire_frame: {
    id: 'fire_frame',
    className: 'ring-4 ring-orange-500 shadow-lg shadow-orange-500/50',
    animationClass: 'animate-fire-glow',
  },
  neon_frame: {
    id: 'neon_frame',
    className: 'ring-4 ring-cyan-400 shadow-lg shadow-cyan-400/60',
    animationClass: 'animate-neon-pulse',
  },
  diamond_frame: {
    id: 'diamond_frame',
    className: 'ring-4 ring-purple-400 shadow-lg shadow-purple-400/40',
    animationClass: 'animate-shimmer',
  },
};

interface UserAvatarWithFrameProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  frameId?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  showProBadge?: boolean;
}

export function UserAvatarWithFrame({
  avatarUrl,
  displayName,
  frameId,
  size = 'md',
  className,
  onClick,
  showProBadge = false,
}: UserAvatarWithFrameProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const proBadgeSizeClasses = {
    sm: 'w-3 h-3 -top-0.5 -right-0.5',
    md: 'w-4 h-4 -top-0.5 -right-0.5',
    lg: 'w-5 h-5 -top-1 -right-1',
    xl: 'w-6 h-6 -top-1 -right-1',
  };

  const proIconSizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-3.5 h-3.5',
  };

  const frame = frameId ? AVATAR_FRAMES[frameId] : null;

  return (
    <div 
      className={cn(
        "relative",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      <Avatar 
        className={cn(
          sizeClasses[size],
          "rounded-xl transition-transform",
          onClick && "hover:scale-105",
          frame?.className,
          frame?.animationClass
        )}
      >
        <AvatarImage 
          src={avatarUrl || undefined} 
          className="object-cover rounded-xl"
        />
        <AvatarFallback className="rounded-xl">
          {displayName?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      
      {/* PRO Badge - top right corner */}
      {showProBadge && (
        <div 
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg border-2 border-background",
            proBadgeSizeClasses[size]
          )}
        >
          <Crown className={cn("text-white", proIconSizeClasses[size])} />
        </div>
      )}
    </div>
  );
}
