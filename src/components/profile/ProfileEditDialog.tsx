import { useState, useEffect, useRef } from 'react';
import { Camera, Upload, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AvatarGallery } from './AvatarGallery';
import { useTranslation } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentDisplayName: string | null;
  currentAvatarUrl: string | null;
  userId: string;
  onUpdate: () => void;
}

export function ProfileEditDialog({ 
  open, 
  onOpenChange, 
  currentDisplayName, 
  currentAvatarUrl,
  userId,
  onUpdate
}: ProfileEditDialogProps) {
  const { t } = useTranslation();
  const [displayName, setDisplayName] = useState(currentDisplayName || '');
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl || '');
  const [showGallery, setShowGallery] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use TanStack Query hooks
  const { data: profile } = useProfile(userId);
  const updateProfileMutation = useUpdateProfile(userId);

  useEffect(() => {
    // Sync local state with profile data from cache
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || '');
    } else {
      setDisplayName(currentDisplayName || '');
      setAvatarUrl(currentAvatarUrl || '');
    }
  }, [profile, currentDisplayName, currentAvatarUrl, open]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('invalidFileType'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('fileTooLarge'));
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Delete old avatar if it's from our storage
      if (currentAvatarUrl?.includes('avatars')) {
        const oldPath = currentAvatarUrl.split('/avatars/')[1];
        if (oldPath) {
          await supabase.storage.from('avatars').remove([oldPath]);
        }
      }

      // Upload new avatar
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      setAvatarUrl(publicUrl);
      toast.success(t('avatarUploaded'));
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error(t('error'));
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = () => {
    // Use optimistic mutation - UI updates instantly
    updateProfileMutation.mutate(
      { 
        display_name: displayName || null,
        avatar_url: avatarUrl || null,
      },
      {
        onSuccess: () => {
          onUpdate();
          onOpenChange(false);
        },
      }
    );
  };

  const userInitials = (displayName || 'U').slice(0, 2).toUpperCase();
  const isSaving = updateProfileMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('editProfile')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary/20 rounded-lg">
                <AvatarImage src={avatarUrl || undefined} className="rounded-lg" />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl rounded-lg">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              {uploading && (
                <div className="absolute inset-0 bg-background/80 rounded-lg flex items-center justify-center">
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
                <Tabs defaultValue="gallery" className="w-full">
                  <TabsList className="w-full grid grid-cols-2">
                    <TabsTrigger value="gallery">{t('avatarGallery')}</TabsTrigger>
                    <TabsTrigger value="upload">{t('uploadPhoto')}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="gallery" className="p-2">
                    <AvatarGallery 
                      selectedAvatar={avatarUrl}
                      onSelect={(url) => {
                        setAvatarUrl(url);
                        setShowGallery(false);
                      }}
                    />
                  </TabsContent>
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
                      className="w-full h-24 flex flex-col gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6" />
                          <span className="text-sm">{t('selectPhoto')}</span>
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      {t('maxFileSize')}
                    </p>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>

          {/* Display Name */}
          <div className="space-y-2">
            <Label htmlFor="displayName">{t('displayName')}</Label>
            <Input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t('displayNamePlaceholder')}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || uploading}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
