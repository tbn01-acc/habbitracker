import { UserPlus, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslation } from '@/contexts/LanguageContext';
import { APP_URL } from '@/lib/constants';

export function ShareButtons() {
  const { t } = useTranslation();

  const handleInviteFriend = () => {
    const text = t('shareText');
    const url = APP_URL;
    
    if (navigator.share) {
      navigator.share({ title: t('shareTitle'), text, url }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      toast.success(t('linkCopied'));
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: t('shareTitle'), url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(t('linkCopied'));
    }
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleInviteFriend} className="text-xs">
        <UserPlus className="h-4 w-4 mr-1.5" />
        {t('inviteFriend')}
      </Button>
      <Button variant="outline" size="sm" onClick={handleShare} className="text-xs">
        <Share2 className="h-4 w-4 mr-1.5" />
        {t('share')}
      </Button>
    </div>
  );
}
