import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Loader2, AtSign, Mail, AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AvatarGallery } from './AvatarGallery';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PublicProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentData: {
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    telegram_username: string | null;
    public_email: string | null;
  };
  onUpdate: () => void;
}

export function PublicProfileEditDialog({
  open,
  onOpenChange,
  userId,
  currentData,
  onUpdate
}: PublicProfileEditDialogProps) {
  const [displayName, setDisplayName] = useState(currentData.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(currentData.avatar_url || '');
  const [bio, setBio] = useState(currentData.bio || '');
  const [telegramUsername, setTelegramUsername] = useState(currentData.telegram_username || '');
  const [publicEmail, setPublicEmail] = useState(currentData.public_email || '');
  const [showGallery, setShowGallery] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setDisplayName(currentData.display_name || '');
      setAvatarUrl(currentData.avatar_url || '');
      setBio(currentData.bio || '');
      setTelegramUsername(currentData.telegram_username || '');
      setPublicEmail(currentData.public_email || '');
    }
  }, [currentData, open]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Максимальный размер файла 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Delete old avatar if exists
      if (avatarUrl?.includes('avatars')) {
        const oldPath = avatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      toast.success('Фото загружено');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Ошибка загрузки');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async () => {
    // Validate bio for spam/ads (basic check)
    const spamPatterns = [
      /http[s]?:\/\//i,
      /www\./i,
      /купи/i,
      /скидк/i,
      /бесплатн/i,
      /заработ/i,
      /казино/i,
      /ставк/i
    ];

    const hasSpam = spamPatterns.some(pattern => pattern.test(bio));
    if (hasSpam) {
      toast.error('Описание содержит запрещённый контент');
      return;
    }

    setSaving(true);
    try {
      // Clean telegram username
      let cleanTelegram = telegramUsername.trim();
      if (cleanTelegram.startsWith('@')) {
        cleanTelegram = cleanTelegram.slice(1);
      }
      if (cleanTelegram.includes('t.me/')) {
        cleanTelegram = cleanTelegram.split('t.me/')[1];
      }

      // Validate email format if provided
      const cleanEmail = publicEmail.trim();
      if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        toast.error('Неверный формат email');
        setSaving(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName.trim() || null,
          avatar_url: avatarUrl || null,
          bio: bio.trim() || null,
          telegram_username: cleanTelegram || null,
          public_email: cleanEmail || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success('Профиль обновлён');
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const userInitials = (displayName || 'U').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Редактировать публичный профиль</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Warning */}
          <Alert variant="destructive" className="bg-destructive/10 border-destructive/30">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Реклама запрещена. За нарушение — режим "только чтение" на 7 дней, повторно — бан на 30 дней.
            </AlertDescription>
          </Alert>

          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowGallery(!showGallery)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {showGallery && (
              <div className="w-full rounded-lg border border-border">
                <Tabs defaultValue="upload" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="upload">Загрузить</TabsTrigger>
                    <TabsTrigger value="gallery">Галерея</TabsTrigger>
                  </TabsList>
                  <TabsContent value="upload" className="p-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      className="w-full h-20 flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6" />
                          <span className="text-sm">Выбрать фото</span>
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Макс. 5MB, JPG/PNG
                    </p>
                  </TabsContent>
                  <TabsContent value="gallery" className="p-2">
                    <AvatarGallery
                      selectedAvatar={avatarUrl}
                      onSelect={(url) => {
                        setAvatarUrl(url);
                        setShowGallery(false);
                      }}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">Имя</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ваше имя"
              maxLength={50}
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">О себе</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите о себе (до 500 символов)..."
              className="min-h-[100px]"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground text-right">
              {bio.length}/500
            </p>
          </div>

          {/* Telegram */}
          <div className="space-y-2">
            <Label htmlFor="telegram">Telegram</Label>
            <div className="relative">
              <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="telegram"
                value={telegramUsername}
                onChange={(e) => setTelegramUsername(e.target.value)}
                placeholder="username"
                className="pl-9"
                maxLength={32}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Введите username без @
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email для контактов</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={publicEmail}
                onChange={(e) => setPublicEmail(e.target.value)}
                placeholder="email@example.com"
                className="pl-9"
                maxLength={100}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Виден только PRO-пользователям
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Отмена
          </Button>
          <Button onClick={handleSave} disabled={saving || uploading}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Сохранение...
              </>
            ) : (
              'Сохранить'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
