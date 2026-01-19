import { useState, useEffect } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { useAchievementsFeed, PostComment } from '@/hooks/useAchievementsFeed';
import { useTranslation } from '@/contexts/LanguageContext';
import { UserAvatarWithFrame } from '@/components/rewards/UserAvatarWithFrame';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PostCommentsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  onCommentAdded?: () => void;
}

export function PostCommentsSheet({ 
  open, 
  onOpenChange, 
  postId,
  onCommentAdded 
}: PostCommentsSheetProps) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const { fetchComments, addComment } = useAchievementsFeed();
  const isRussian = language === 'ru';
  
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && postId) {
      loadComments();
    }
  }, [open, postId]);

  const loadComments = async () => {
    setLoading(true);
    const data = await fetchComments(postId);
    setComments(data);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    const success = await addComment(postId, newComment.trim());
    
    if (success) {
      setNewComment('');
      await loadComments();
      onCommentAdded?.();
    }
    setSubmitting(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
        <SheetHeader className="pb-4">
          <SheetTitle>
            {isRussian ? 'Комментарии' : 'Comments'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-60px)]">
          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  {isRussian ? 'Пока нет комментариев' : 'No comments yet'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isRussian ? 'Будьте первым!' : 'Be the first!'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <UserAvatarWithFrame
                      avatarUrl={comment.user_profile?.avatar_url}
                      displayName={comment.user_profile?.display_name}
                      size="sm"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {comment.user_profile?.display_name || 'User'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comment.created_at), 'd MMM HH:mm', {
                            locale: isRussian ? ru : undefined
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground mt-1 break-words">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Comment Input */}
          {user ? (
            <form onSubmit={handleSubmit} className="flex gap-2 pt-4 border-t border-border mt-4">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={isRussian ? 'Напишите комментарий...' : 'Write a comment...'}
                className="flex-1"
                maxLength={500}
                disabled={submitting}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!newComment.trim() || submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          ) : (
            <div className="text-center py-4 border-t border-border mt-4">
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Войдите, чтобы оставить комментарий' : 'Sign in to comment'}
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
