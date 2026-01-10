import { useState, useEffect } from 'react';
import { Calendar, ImageIcon, Award, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useUserRewardItems } from '@/hooks/useUserRewardItems';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const FRAME_OPTIONS = [
  { id: 'gold', name: 'Золотая', nameEn: 'Gold', color: 'from-yellow-400 to-amber-600' },
  { id: 'silver', name: 'Серебряная', nameEn: 'Silver', color: 'from-gray-300 to-gray-500' },
  { id: 'fire', name: 'Огненная', nameEn: 'Fire', color: 'from-orange-500 to-red-600' },
  { id: 'neon', name: 'Неоновая', nameEn: 'Neon', color: 'from-pink-500 to-purple-600' },
];

const BADGE_OPTIONS = [
  { id: 'early_bird', name: 'Ранняя пташка', nameEn: 'Early Bird', icon: '🐦' },
  { id: 'perfectionist', name: 'Перфекционист', nameEn: 'Perfectionist', icon: '✨' },
  { id: 'champion', name: 'Чемпион', nameEn: 'Champion', icon: '🏆' },
  { id: 'streak_master', name: 'Мастер серий', nameEn: 'Streak Master', icon: '🔥' },
];

export function ProfilePreferencesSection() {
  const { t, language } = useTranslation();
  const { user, profile, refetchProfile } = useAuth();
  const { items, loading: itemsLoading, refetch: refetchItems } = useUserRewardItems(user?.id);
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<0 | 1>(1);
  const [activeFrame, setActiveFrame] = useState<string | null>(null);
  const [activeBadges, setActiveBadges] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  
  const isRussian = language === 'ru';

  // Load current preferences from profile
  useEffect(() => {
    if (profile) {
      setFirstDayOfWeek((profile as any).first_day_of_week ?? 1);
      setActiveFrame((profile as any).active_frame ?? null);
      setActiveBadges((profile as any).active_badges ?? []);
    }
  }, [profile]);

  const handleSave = async (updates: {
    first_day_of_week?: number;
    active_frame?: string | null;
    active_badges?: string[];
  }) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast.success(isRussian ? 'Настройки сохранены!' : 'Settings saved!');
      refetchProfile?.();
    } catch (err) {
      console.error('Error saving preferences:', err);
      toast.error(isRussian ? 'Ошибка сохранения' : 'Error saving');
    } finally {
      setSaving(false);
    }
  };

  const handleFirstDayChange = (day: 0 | 1) => {
    setFirstDayOfWeek(day);
    handleSave({ first_day_of_week: day });
  };

  const handleFrameSelect = (frameId: string | null) => {
    setActiveFrame(frameId);
    handleSave({ active_frame: frameId });
  };

  const handleBadgeToggle = (badgeId: string) => {
    let newBadges: string[];
    if (activeBadges.includes(badgeId)) {
      newBadges = activeBadges.filter(b => b !== badgeId);
    } else {
      // Max 3 badges
      if (activeBadges.length >= 3) {
        toast.error(isRussian ? 'Максимум 3 бейджа' : 'Maximum 3 badges');
        return;
      }
      newBadges = [...activeBadges, badgeId];
    }
    setActiveBadges(newBadges);
    handleSave({ active_badges: newBadges });
  };

  // Filter to only owned items
  const ownedFrames = FRAME_OPTIONS.filter(f => items.frames.includes(f.id));
  const ownedBadges = BADGE_OPTIONS.filter(b => items.badges.includes(b.id));

  return (
    <div className="space-y-6">
      {/* First Day of Week */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-md font-semibold text-foreground">
            {isRussian ? 'Первый день недели' : 'First Day of Week'}
          </h3>
        </div>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button
                variant={firstDayOfWeek === 1 ? 'default' : 'outline'}
                onClick={() => handleFirstDayChange(1)}
                disabled={saving}
                className="flex-1"
              >
                {firstDayOfWeek === 1 && <Check className="w-4 h-4 mr-2" />}
                {isRussian ? 'Понедельник' : 'Monday'}
              </Button>
              <Button
                variant={firstDayOfWeek === 0 ? 'default' : 'outline'}
                onClick={() => handleFirstDayChange(0)}
                disabled={saving}
                className="flex-1"
              >
                {firstDayOfWeek === 0 && <Check className="w-4 h-4 mr-2" />}
                {isRussian ? 'Воскресенье' : 'Sunday'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Frame */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
            <ImageIcon className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-md font-semibold text-foreground">
            {isRussian ? 'Рамка аватара' : 'Avatar Frame'}
          </h3>
        </div>
        
        <Card>
          <CardContent className="p-4">
            {itemsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : ownedFrames.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRussian ? 'У вас пока нет рамок. Купите их в магазине наград!' : 'You don\'t have any frames yet. Buy them in the rewards shop!'}
              </p>
            ) : (
              <div className="space-y-3">
                {/* No frame option */}
                <Button
                  variant={activeFrame === null ? 'default' : 'outline'}
                  onClick={() => handleFrameSelect(null)}
                  disabled={saving}
                  className="w-full justify-start"
                >
                  {activeFrame === null && <Check className="w-4 h-4 mr-2" />}
                  {isRussian ? 'Без рамки' : 'No frame'}
                </Button>
                
                {/* Owned frames */}
                <div className="grid grid-cols-2 gap-2">
                  {ownedFrames.map((frame) => (
                    <Button
                      key={frame.id}
                      variant={activeFrame === frame.id ? 'default' : 'outline'}
                      onClick={() => handleFrameSelect(frame.id)}
                      disabled={saving}
                      className={cn(
                        "justify-start relative overflow-hidden",
                        activeFrame === frame.id && `bg-gradient-to-r ${frame.color}`
                      )}
                    >
                      {activeFrame === frame.id && <Check className="w-4 h-4 mr-2" />}
                      <span className={cn(
                        "bg-gradient-to-r bg-clip-text",
                        activeFrame !== frame.id && frame.color,
                        activeFrame !== frame.id && "text-transparent"
                      )}>
                        {isRussian ? frame.name : frame.nameEn}
                      </span>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Badges */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Award className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-md font-semibold text-foreground">
            {isRussian ? 'Бейджи профиля' : 'Profile Badges'}
          </h3>
          <Badge variant="secondary" className="text-xs">
            {activeBadges.length}/3
          </Badge>
        </div>
        
        <Card>
          <CardContent className="p-4">
            {itemsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : ownedBadges.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {isRussian ? 'У вас пока нет бейджей. Купите их в магазине наград!' : 'You don\'t have any badges yet. Buy them in the rewards shop!'}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {ownedBadges.map((badge) => {
                  const isActive = activeBadges.includes(badge.id);
                  return (
                    <Button
                      key={badge.id}
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => handleBadgeToggle(badge.id)}
                      disabled={saving}
                      className="justify-start"
                    >
                      <span className="mr-2">{badge.icon}</span>
                      {isActive && <Check className="w-4 h-4 mr-1" />}
                      <span className="truncate">
                        {isRussian ? badge.name : badge.nameEn}
                      </span>
                    </Button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
