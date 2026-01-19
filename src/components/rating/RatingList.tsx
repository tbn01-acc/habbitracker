import React from 'react';
import { Star, Heart, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserAvatarWithFrame } from '@/components/rewards/UserAvatarWithFrame';
import { UserRewardItems } from '@/hooks/useUserRewardItems';
import { Card, CardContent } from '@/components/ui/card';
import { RatingType } from './RatingTabs';

interface ListUser {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_stars: number;
  likes_count?: number;
  referrals_count?: number;
  rank: number;
  is_current_user?: boolean;
}

interface RatingListProps {
  users: ListUser[];
  userRewards: Map<string, UserRewardItems>;
  type: RatingType;
  isRussian: boolean;
  onUserClick: (userId: string) => void;
  startRank?: number;
}

export function RatingList({ users, userRewards, type, isRussian, onUserClick, startRank = 4 }: RatingListProps) {
  const getValue = (user: ListUser) => {
    switch (type) {
      case 'likes':
        return user.likes_count ?? 0;
      case 'referrals':
        return user.referrals_count ?? 0;
      default:
        return user.total_stars;
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'likes':
        return <Heart className="h-4 w-4 text-pink-500 fill-pink-500" />;
      case 'referrals':
        return <Users className="h-4 w-4 text-blue-500" />;
      default:
        return <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />;
    }
  };

  // Skip top 3 (they're on the podium)
  const listUsers = users.slice(3);

  if (listUsers.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* List */}
      <AnimatePresence>
        {listUsers.map((user, index) => (
          <motion.div
            key={user.user_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.02 }}
          >
            <Card
              className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                user.is_current_user ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onUserClick(user.user_id)}
            >
              <CardContent className="flex items-center gap-3 p-3">
                {/* Rank */}
                <span className="w-8 text-center text-lg font-bold text-muted-foreground">
                  {user.rank}
                </span>

                {/* Avatar */}
                <UserAvatarWithFrame
                  avatarUrl={user.avatar_url}
                  displayName={user.display_name}
                  frameId={userRewards.get(user.user_id)?.activeFrame}
                  size="sm"
                />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">
                    {user.display_name}
                  </p>
                </div>

                {/* Value with icon - right aligned */}
                <div className="flex items-center gap-1.5 ml-auto">
                  {getIcon()}
                  <span className="text-sm font-semibold">
                    {getValue(user).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}