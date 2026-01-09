import React, { useState } from 'react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useLeaderboard, PublicProfile } from '@/hooks/useLeaderboard';
import { useAchievementsFeed } from '@/hooks/useAchievementsFeed';
import { useStars } from '@/hooks/useStars';
import { AppHeader } from '@/components/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Trophy, Star, Flame, ThumbsUp, ThumbsDown, MessageCircle, Send, Crown, Medal, Award, User, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

export default function Rating() {
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const { leaderboard, currentUserRank, loading: leaderboardLoading, getPublicProfile } = useLeaderboard();
  const { 
    posts, 
    loading: feedLoading, 
    sortBy, 
    setSortBy, 
    reactToPost, 
    fetchComments, 
    addComment,
    dailyPostCount,
    dailyLimit
  } = useAchievementsFeed();
  const { userStars } = useStars();

  const [activeTab, setActiveTab] = useState<'leaderboard' | 'feed'>('leaderboard');
  const [selectedProfile, setSelectedProfile] = useState<PublicProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);

  const handleUserClick = async (userId: string) => {
    setProfileLoading(true);
    const profile = await getPublicProfile(userId);
    setSelectedProfile(profile);
    setProfileLoading(false);
  };

  const handleOpenComments = async (postId: string) => {
    setSelectedPost(postId);
    setCommentsLoading(true);
    const postComments = await fetchComments(postId);
    setComments(postComments);
    setCommentsLoading(false);
  };

  const handleAddComment = async () => {
    if (!selectedPost || !newComment.trim()) return;
    
    const success = await addComment(selectedPost, newComment);
    if (success) {
      setNewComment('');
      const updatedComments = await fetchComments(selectedPost);
      setComments(updatedComments);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader />
      
      <main className="container max-w-2xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Trophy className="h-7 w-7 text-primary" />
            <h1 className="text-2xl font-bold">
              {isRussian ? 'Рейтинг' : 'Rating'}
            </h1>
          </div>
          
          {userStars && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
              {userStars.total_stars}
            </Badge>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {isRussian ? 'ТОП-100' : 'TOP-100'}
            </TabsTrigger>
            <TabsTrigger value="feed" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              {isRussian ? 'Лента' : 'Feed'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leaderboard">
            {leaderboardLoading ? (
              <div className="space-y-3">
                {[...Array(10)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <AnimatePresence>
                  {leaderboard.map((user, index) => (
                    <motion.div
                      key={user.user_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                    >
                      <Card 
                        className={`cursor-pointer hover:bg-accent/50 transition-colors ${
                          user.is_current_user ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleUserClick(user.user_id)}
                      >
                        <CardContent className="flex items-center gap-4 p-4">
                          <div className="w-8 flex justify-center">
                            {getRankIcon(user.rank)}
                          </div>
                          
                          <Avatar>
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback>
                              <User className="h-4 w-4" />
                            </AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {user.display_name}
                              {user.is_current_user && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {isRussian ? 'Вы' : 'You'}
                                </Badge>
                              )}
                            </p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Flame className="h-3 w-3 text-orange-500" />
                                {user.current_streak_days}d
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1 text-lg font-semibold">
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            {user.total_stars}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Current user if not in top 100 */}
                {currentUserRank && currentUserRank.rank > 100 && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">
                      {isRussian ? 'Ваша позиция' : 'Your position'}
                    </p>
                    <Card className="ring-2 ring-primary">
                      <CardContent className="flex items-center gap-4 p-4">
                        <div className="w-8 flex justify-center">
                          <span className="text-sm font-medium">#{currentUserRank.rank}</span>
                        </div>
                        
                        <Avatar>
                          <AvatarImage src={currentUserRank.avatar_url || undefined} />
                          <AvatarFallback>
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <p className="font-medium">{currentUserRank.display_name}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Flame className="h-3 w-3 text-orange-500" />
                            {currentUserRank.current_streak_days}d
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1 text-lg font-semibold">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          {currentUserRank.total_stars}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {leaderboard.length === 0 && (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {isRussian ? 'Рейтинг пока пуст' : 'Leaderboard is empty'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="feed">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={sortBy === 'new' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('new')}
                >
                  {isRussian ? 'Новое' : 'New'}
                </Button>
                <Button
                  variant={sortBy === 'popular' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortBy('popular')}
                >
                  {isRussian ? 'Популярное' : 'Popular'}
                </Button>
              </div>
              
              <Badge variant="outline">
                {dailyPostCount}/{dailyLimit} {isRussian ? 'постов' : 'posts'}
              </Badge>
            </div>

            {feedLoading ? (
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
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card>
                        <CardHeader className="pb-3">
                          <div 
                            className="flex items-center gap-3 cursor-pointer"
                            onClick={() => handleUserClick(post.user_id)}
                          >
                            <Avatar>
                              <AvatarImage src={post.user_profile?.avatar_url || undefined} />
                              <AvatarFallback>
                                <User className="h-4 w-4" />
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {post.user_profile?.display_name || 'Пользователь'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(post.created_at), 'dd MMM, HH:mm', { locale: ru })}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-3">
                          <img 
                            src={post.image_url} 
                            alt="Achievement" 
                            className="w-full rounded-lg object-cover max-h-80"
                          />
                          
                          {post.description && (
                            <p className="text-sm">{post.description}</p>
                          )}
                          
                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className={post.user_reaction === 'like' ? 'text-green-500' : ''}
                                onClick={() => reactToPost(post.id, 'like')}
                              >
                                <ThumbsUp className={`h-4 w-4 mr-1 ${post.user_reaction === 'like' ? 'fill-current' : ''}`} />
                                {post.likes_count}
                              </Button>
                              
                              <Button
                                variant="ghost"
                                size="sm"
                                className={post.user_reaction === 'dislike' ? 'text-red-500' : ''}
                                onClick={() => reactToPost(post.id, 'dislike')}
                              >
                                <ThumbsDown className={`h-4 w-4 mr-1 ${post.user_reaction === 'dislike' ? 'fill-current' : ''}`} />
                                {post.dislikes_count}
                              </Button>
                            </div>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenComments(post.id)}
                            >
                              <MessageCircle className="h-4 w-4 mr-1" />
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
                      <Star className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        {isRussian ? 'Пока нет публикаций' : 'No posts yet'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Profile Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{isRussian ? 'Профиль' : 'Profile'}</DialogTitle>
          </DialogHeader>
          
          {selectedProfile && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedProfile.avatar_url || undefined} />
                  <AvatarFallback>
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                
                <div>
                  <h3 className="text-lg font-semibold">{selectedProfile.display_name}</h3>
                  {selectedProfile.telegram_username && (
                    <a 
                      href={`https://t.me/${selectedProfile.telegram_username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary flex items-center gap-1"
                    >
                      @{selectedProfile.telegram_username}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>

              {selectedProfile.bio && (
                <p className="text-sm text-muted-foreground">{selectedProfile.bio}</p>
              )}

              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-3 text-center">
                    <Star className="h-5 w-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-lg font-bold">{selectedProfile.total_stars}</p>
                    <p className="text-xs text-muted-foreground">{isRussian ? 'Звёзд' : 'Stars'}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 text-center">
                    <Flame className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                    <p className="text-lg font-bold">{selectedProfile.current_streak_days}</p>
                    <p className="text-xs text-muted-foreground">{isRussian ? 'Дней' : 'Days'}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-3 text-center">
                    <User className="h-5 w-5 mx-auto mb-1 text-primary" />
                    <p className="text-lg font-bold">{selectedProfile.total_referrals}</p>
                    <p className="text-xs text-muted-foreground">{isRussian ? 'Рефералов' : 'Referrals'}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{isRussian ? 'Комментарии' : 'Comments'}</DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-1 pr-4">
            {commentsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {comments.map(comment => (
                  <div key={comment.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={comment.user_profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {comment.user_profile?.display_name || 'Пользователь'}
                      </p>
                      <p className="text-sm text-muted-foreground">{comment.content}</p>
                    </div>
                  </div>
                ))}
                
                {comments.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-8">
                    {isRussian ? 'Пока нет комментариев' : 'No comments yet'}
                  </p>
                )}
              </div>
            )}
          </ScrollArea>
          
          <div className="flex gap-2 pt-4 border-t">
            <Textarea
              placeholder={isRussian ? 'Написать комментарий...' : 'Write a comment...'}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[40px] resize-none"
            />
            <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
