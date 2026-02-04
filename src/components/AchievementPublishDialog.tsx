import { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Loader2, Image, X, Sparkles, Lightbulb, Trophy, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  preloadedImageUrl?: string | null;
}

export function AchievementPublishDialog({
  open,
  onOpenChange,
  taskId,
  habitId,
  itemName,
  preloadedImageUrl
}: AchievementPublishDialogProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState<PostType>('achievement');
  const [usePreloadedImage, setUsePreloadedImage] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize with preloaded image if provided
  useEffect(() => {
    if (open && preloadedImageUrl) {
      setImagePreview(preloadedImageUrl);
      setUsePreloadedImage(true);
      setIsVerified(false);
    }
  }, [open, preloadedImageUrl]);
  
  
  const { createPost, dailyPostCount, dailyLimit } = useAchievementsFeed();
  const { awardAchievementPost } = useStars();
  const { isProActive } = useSubscription();

  const postTypeOptions = [
    { type: 'achievement' as PostType, label: 'Достижение', icon: Trophy, color: 'text-yellow-500' },
    { type: 'success_story' as PostType, label: 'История успеха', icon: Sparkles, color: 'text-purple-500' },
    { type: 'idea' as PostType, label: 'Идея', icon: Lightbulb, color: 'text-blue-500' },
  ];

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsVerified(true); // Camera photos are verified
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsVerified(false); // Gallery photos are not verified
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setUsePreloadedImage(false);
    setIsVerified(false);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const handleSubmit = async () => {
    // For ideas and success stories without linked task/habit, image is optional
    // If using preloaded image, convert data URL to File
    let fileToUpload = imageFile;
    
    if (usePreloadedImage && preloadedImageUrl && !imageFile) {
      // Convert data URL to File
      const response = await fetch(preloadedImageUrl);
      const blob = await response.blob();
      fileToUpload = new File([blob], 'balance-achievement.png', { type: 'image/png' });
    }
    
    if (postType === 'achievement' && !fileToUpload && !usePreloadedImage) {
      toast.error('Добавьте фото');
      return;
    }

    setIsSubmitting(true);
    try {
      const postId = await createPost(fileToUpload, description, taskId, habitId, postType, isVerified);
      
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
        setUsePreloadedImage(false);
        setIsVerified(false);
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
    setUsePreloadedImage(false);
    setIsVerified(false);
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

          {/* Image upload with separate camera and gallery inputs */}
          <div className="relative">
            {/* Hidden camera input - triggers camera on mobile */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            
            {/* Hidden gallery input - opens file picker */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={handleGallerySelect}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-64 object-cover rounded-lg"
                />
                {isVerified && (
                  <Badge 
                    className="absolute top-2 left-2 bg-primary text-primary-foreground gap-1"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Верифицировано
                  </Badge>
                )}
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
              <div className="w-full h-48 flex flex-col gap-3 border-2 border-dashed border-border rounded-lg p-4 items-center justify-center">
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4 px-6"
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={!canPost}
                  >
                    <Camera className="h-8 w-8 text-primary" />
                    <span className="text-sm">Камера</span>
                    <Badge variant="secondary" className="text-[10px] gap-0.5">
                      <ShieldCheck className="h-2.5 w-2.5" />
                      Верифицировано
                    </Badge>
                  </Button>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center gap-2 h-auto py-4 px-6"
                    onClick={() => galleryInputRef.current?.click()}
                    disabled={!canPost}
                  >
                    <Image className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm">Галерея</span>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Фото с камеры получают статус "Верифицировано"
                </p>
              </div>
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
            disabled={isSubmitting || (postType === 'achievement' && !imageFile && !usePreloadedImage) || !canPost}
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