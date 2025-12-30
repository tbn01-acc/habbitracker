import { useState, useEffect } from 'react';
import { User, Camera } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarGallery } from './AvatarGallery';
import { useTranslation } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDisplayName(currentDisplayName || '');
    setAvatarUrl(currentAvatarUrl || '');
  }, [currentDisplayName, currentAvatarUrl, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          display_name: displayName || null,
          avatar_url: avatarUrl || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;

      toast.success(t('save'));
      onUpdate();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('error'));
    } finally {
      setSaving(false);
    }
  };

  const userInitials = (displayName || 'U').slice(0, 2).toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('editProfile')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => setShowGallery(!showGallery)}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            
            {showGallery && (
              <div className="w-full bg-muted/50 rounded-lg">
                <AvatarGallery 
                  selectedAvatar={avatarUrl}
                  onSelect={(url) => {
                    setAvatarUrl(url);
                    setShowGallery(false);
                  }}
                />
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
          <Button onClick={handleSave} disabled={saving}>
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
