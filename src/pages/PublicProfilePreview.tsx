import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Eye, ExternalLink, Check } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';
import { PublicProfileView } from '@/components/profile/PublicProfileView';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export default function PublicProfilePreview() {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { language } = useTranslation();
  const isRussian = language === 'ru';
  const [copied, setCopied] = useState(false);

  const profileUrl = user 
    ? `${window.location.origin}/user/${user.id}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      toast.success(isRussian ? 'Ссылка скопирована!' : 'Link copied!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error(isRussian ? 'Не удалось скопировать' : 'Failed to copy');
    }
  };

  const handleOpenProfile = () => {
    window.open(profileUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-24 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          {isRussian ? 'Загрузка...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!user) {
    navigate('/profile');
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader />
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/profile/settings')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Eye className="w-6 h-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRussian ? 'Публичный профиль' : 'Public Profile'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isRussian ? 'Так видят вас другие пользователи' : 'How others see you'}
              </p>
            </div>
          </div>
        </div>

        {/* Copy Link Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground mb-1">
                    {isRussian ? 'Ссылка на ваш профиль' : 'Your profile link'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {profileUrl}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleCopyLink}
                    className="gap-2"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    {copied 
                      ? (isRussian ? 'Скопировано' : 'Copied')
                      : (isRussian ? 'Копировать' : 'Copy')
                    }
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleOpenProfile}
                    className="gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Visibility Warning */}
        {!profile?.is_public && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <Card className="border-amber-500/30 bg-amber-500/10">
              <CardContent className="py-3">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  ⚠️ {isRussian 
                    ? 'Ваш профиль скрыт. Включите публичный профиль в настройках, чтобы другие могли его видеть.'
                    : 'Your profile is hidden. Enable public profile in settings for others to see it.'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Profile Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <PublicProfileView userId={user.id} />
            </CardContent>
          </Card>
        </motion.div>

        {/* Edit Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6"
        >
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate('/profile/settings')}
          >
            {isRussian ? 'Редактировать профиль' : 'Edit Profile'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
