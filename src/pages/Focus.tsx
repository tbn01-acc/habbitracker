import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Aperture, Plus, ThumbsUp, ThumbsDown, MessageCircle, Vote, ArrowLeft, MoreVertical, Eye, EyeOff, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AppHeader } from '@/components/AppHeader';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useFilteredFeed, FeedPost } from '@/hooks/useFilteredFeed';
import { useAchievementsFeed } from '@/hooks/useAchievementsFeed';
import { useStars } from '@/hooks/useStars';
import { AchievementPublishDialog } from '@/components/AchievementPublishDialog';
import { FeedTabs, FeedType } from '@/components/rating/FeedTabs';
import { UserAvatarWithFrame } from '@/components/rewards/UserAvatarWithFrame';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

export default function Focus() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const navigate = useNavigate();
  const { user } = useAuth();
  const { dailyPostCount, dailyLimit, reactToPost } = useAchievementsFeed();
  const { deductAchievementPost } = useStars();

  const [feedType, setFeedType] = useState<FeedType>('activity');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [deleteConfirmPost, setDeleteConfirmPost] = useState<string | null>(null);
  const [hideConfirmPost, setHideConfirmPost] = useState<string | null>(null);

  const { posts, loading, hasMore, loadMore, voteForIdea, hidePost, deletePost } = useFilteredFeed(feedType);

  const getPostTypeLabel = (postType: string) => {
    switch (postType) {
      case 'activity':
        return isRussian ? 'Активность' : 'Activity';
      case 'success':
        return isRussian ? 'Успех' : 'Success';
      case 'ideas':
        return isRussian ? 'Идея' : 'Idea';
      default:
        return '';
    }
  };

  const handleHidePost = async (postId: string) => {
    const success = await hidePost(postId);
    if (success) {
      await deductAchievementPost(postId);
    }
    setHideConfirmPost(null);
  };

  const handleDeletePost = async (postId: string) => {
    const success = await deletePost(postId);
    if (success) {
      await deductAchievementPost(postId);
    }
    setDeleteConfirmPost(null);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Aperture className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">
              {isRussian ? 'Фокус' : 'Focus'}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {dailyPostCount}/{dailyLimit}
            </Badge>

            {user && (
              <Button
                size="sm"
                onClick={() => setShowPublishDialog(true)}
                disabled={dailyPostCount >= dailyLimit}
              >
                <Plus className="h-4 w-4 mr-1" />
                {isRussian ? 'Пост' : 'Post'}
              </Button>
            )}
          </div>
        </div>

        {/* Feed Type Tabs */}
        <div className="mb-4">
          <FeedTabs
            type={feedType}
            onTypeChange={setFeedType}
            isRussian={isRussian}
          />
        </div>

        {/* Feed Content */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card className="overflow-hidden">
                    {/* Post Header */}
                    <div className="flex items-center gap-3 p-4 pb-2">
                      <div 
                        className="cursor-pointer" 
                        onClick={() => navigate(`/user/${post.user_id}`)}
                      >
                        <UserAvatarWithFrame
                          avatarUrl={post.user_profile?.avatar_url}
                          displayName={post.user_profile?.display_name || 'User'}
                          size="sm"
                        />
                      </div>
                      <div className="flex-1">
                        <p 
                          className="font-medium text-sm cursor-pointer hover:underline"
                          onClick={() => navigate(`/user/${post.user_id}`)}
                        >
                          {post.user_profile?.display_name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(post.created_at), 'd MMM HH:mm', { 
                            locale: isRussian ? ru : undefined 
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {getPostTypeLabel(post.post_type)}
                      </Badge>
                      
                      {/* Post Actions Menu (only for own posts) */}
                      {user && user.id === post.user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setHideConfirmPost(post.id)}>
                              <EyeOff className="h-4 w-4 mr-2" />
                              {isRussian ? 'Скрыть пост' : 'Hide post'}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => setDeleteConfirmPost(post.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {isRussian ? 'Удалить пост' : 'Delete post'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {/* Post Image */}
                    <div className="relative aspect-square">
                      <img
                        src={post.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Post Actions */}
                    <CardContent className="p-4">
                      {post.description && (
                        <p className="text-sm mb-3">{post.description}</p>
                      )}

                      <div className="flex items-center justify-between">
                        {feedType === 'ideas' ? (
                          <Button
                            variant={post.user_voted ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => voteForIdea(post.id)}
                            className="gap-2"
                          >
                            <Vote className="h-4 w-4" />
                            {post.votes_count}
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              variant={post.user_reaction === 'like' ? 'default' : 'ghost'}
                              size="sm"
                              onClick={() => reactToPost(post.id, 'like')}
                              className="gap-1"
                            >
                              <ThumbsUp className="h-4 w-4" />
                              {post.likes_count}
                            </Button>
                            <Button
                              variant={post.user_reaction === 'dislike' ? 'destructive' : 'ghost'}
                              size="sm"
                              onClick={() => reactToPost(post.id, 'dislike')}
                              className="gap-1"
                            >
                              <ThumbsDown className="h-4 w-4" />
                              {post.dislikes_count}
                            </Button>
                          </div>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1"
                        >
                          <MessageCircle className="h-4 w-4" />
                          {post.comments_count}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {posts.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Aperture className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {isRussian ? 'Пока нет публикаций' : 'No posts yet'}
                  </p>
                </CardContent>
              </Card>
            )}

            {hasMore && posts.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={loadMore}
              >
                {isRussian ? 'Показать ещё' : 'Show more'}
              </Button>
            )}
          </div>
        )}
      </main>

      <AchievementPublishDialog
        open={showPublishDialog}
        onOpenChange={setShowPublishDialog}
      />

      {/* Hide Post Confirmation */}
      <AlertDialog open={!!hideConfirmPost} onOpenChange={() => setHideConfirmPost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRussian ? 'Скрыть пост?' : 'Hide post?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRussian 
                ? 'Пост будет скрыт из ленты. Заработанные звезды за этот пост будут списаны. Вы сможете восстановить пост позже, но звезды не вернутся.'
                : 'The post will be hidden from the feed. Stars earned for this post will be deducted. You can restore the post later, but stars will not be returned.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRussian ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => hideConfirmPost && handleHidePost(hideConfirmPost)}>
              {isRussian ? 'Скрыть' : 'Hide'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Post Confirmation */}
      <AlertDialog open={!!deleteConfirmPost} onOpenChange={() => setDeleteConfirmPost(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRussian ? 'Удалить пост?' : 'Delete post?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRussian 
                ? 'Пост будет удален навсегда. Заработанные звезды за этот пост будут списаны. Это действие нельзя отменить.'
                : 'The post will be permanently deleted. Stars earned for this post will be deducted. This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {isRussian ? 'Отмена' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteConfirmPost && handleDeletePost(deleteConfirmPost)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRussian ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
