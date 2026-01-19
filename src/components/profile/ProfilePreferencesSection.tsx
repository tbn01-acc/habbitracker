import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Check, Loader2 } from 'lucide-react';
import { useTranslation } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ProfilePreferencesSection() {
  const { t, language } = useTranslation();
  const { user, profile, refetchProfile } = useAuth();
  const [firstDayOfWeek, setFirstDayOfWeek] = useState<0 | 1>((profile as any)?.first_day_of_week ?? 1);
  const [saving, setSaving] = useState(false);
  
  const isRussian = language === 'ru';

  const handleSave = async (updates: {
    first_day_of_week?: number;
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

  return (
    <div className="space-y-6">
      {/* First Day of Week */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-blue-500" />
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
    </div>
  );
}
