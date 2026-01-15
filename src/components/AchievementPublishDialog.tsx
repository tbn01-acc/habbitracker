import { useState, useRef } from 'react';
import { Camera, Upload, Loader2, Image, X, Sparkles, Lightbulb, Trophy } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAchievementsFeed } from '@/hooks/useAchievementsFeed';
import { useStars } from '@/hooks/useStars';
import { useSubscription } from '@/hooks/useSubscription';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type PostType = 'achievement' | 'success_story' | 'idea';

interface AchievementPublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId?: string;
  habitId?: string;
  itemName?: string;
}

export function AchievementPublishDialog({
  open,
  onOpenChange,
  taskId,
  habitId,
  itemName
}: AchievementPublishDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState<PostType>('achievement');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  
  const { createPost, dailyPostCount, dailyLimit } = useAchievementsFeed();
  const { awardAchievementPost } = useStars();
  const { isProActive } = useSubscription();

  const postTypeOptions = [
    { type: 'achievement' as PostType, label: 'Достижение', icon: Trophy, color: 'text-yellow-500' },
    { type: 'success_story' as PostType, label: 'История успеха', icon: Sparkles, color: 'text-purple-500' },
    { type: 'idea' as PostType, label: 'Идея', icon: Lightbulb, color: 'text-blue-500' },
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Максимальный размер файла 10MB');
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    // For ideas, image is optional
    if (postType !== 'idea' && !imageFile) {
      toast.error('Добавьте фото');
      return;
    }

    setIsSubmitting(true);
    try {
      const postId = await createPost(imageFile, description, taskId, habitId, postType);
      
      if (postId) {
        // Award stars for posting
        await awardAchievementPost(postId);
        
        const typeLabels = {
          achievement: 'Достижение',
          success_story: 'История успеха',
          idea: 'Идея'
        };
        
        toast.success(`${typeLabels[postType]} опубликовано! +${isProActive ? 10 : 5} ⭐`);
        onOpenChange(false);
        
        // Reset form
        setImageFile(null);
        setImagePreview(null);
        setDescription('');
        setPostType('achievement');
      }
    } catch (error) {
      console.error('Error publishing:', error);
      toast.error('Ошибка публикации');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setImageFile(null);
    setImagePreview(null);
    setDescription('');
    setPostType('achievement');
  };

  const canPost = dailyPostCount < dailyLimit;

  const getDialogTitle = () => {
    switch (postType) {
      case 'success_story': return 'Опубликовать историю успеха';
      case 'idea': return 'Предложить идею';
      default: return 'Опубликовать достижение';
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {postType === 'idea' && <Lightbulb className="h-5 w-5 text-blue-500" />}
            {postType === 'success_story' && <Sparkles className="h-5 w-5 text-purple-500" />}
            {postType === 'achievement' && <Trophy className="h-5 w-5 text-yellow-500" />}
            {getDialogTitle()}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Post type selector */}
          <div className="flex gap-2">
            {postTypeOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => setPostType(option.type)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all",
                  postType === option.type 
                    ? "border-primary bg-primary/10" 
                    : "border-border hover:border-muted-foreground/50"
                )}
              >
                <option.icon className={cn("h-5 w-5", option.color)} />
                <span className="text-xs font-medium">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Daily limit info */}
          <div className="text-sm text-muted-foreground text-center">
            Публикаций сегодня: {dailyPostCount}/{dailyLimit}
            {!canPost && (
              <span className="text-destructive block mt-1">
                Дневной лимит исчерпан
              </span>
            )}
          </div>

          {/* Item name */}
          {itemName && (
            <div className="text-center p-3 bg-primary/10 rounded-lg">
              <p className="text-sm text-muted-foreground">Достижение за:</p>
              <p className="font-medium">{itemName}</p>
            </div>
          )}

          {/* Image upload */}
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full h-48 flex flex-col gap-3 border-dashed"
                onClick={() => fileInputRef.current?.click()}
                disabled={!canPost}
              >
                <div className="flex gap-4">
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">Камера</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">Галерея</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Добавьте фото-подтверждение выполнения
                </p>
              </Button>
            )}
          </div>

          {/* Description */}
          <div>
            <Textarea
              placeholder="Добавьте описание (необязательно)..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[80px]"
              maxLength={500}
              disabled={!canPost}
            />
            <p className="text-xs text-muted-foreground text-right mt-1">
              {description.length}/500
            </p>
          </div>

          {/* Stars reward info */}
          <div className="flex items-center justify-center gap-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" />
            <span>+{isProActive ? 10 : 5} звёзд за публикацию</span>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={handleClose}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !imageFile || !canPost}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Публикация...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Опубликовать
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
