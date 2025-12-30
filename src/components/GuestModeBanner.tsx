import { Clock, LogIn, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from '@/contexts/LanguageContext';
import { useGuestMode } from '@/hooks/useGuestMode';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';

export function GuestModeBanner() {
  const { user } = useAuth();
  const { language } = useTranslation();
  const navigate = useNavigate();
  const { isActive, hasExpired, hoursLeft, minutesLeft, startGuestMode, guestModeStarted } = useGuestMode();
  const [, forceUpdate] = useState(0);

  // Start guest mode on first visit if not logged in
  useEffect(() => {
    if (!user && !guestModeStarted) {
      startGuestMode();
    }
  }, [user, guestModeStarted, startGuestMode]);

  // Update time display every minute
  useEffect(() => {
    if (!user && isActive) {
      const interval = setInterval(() => forceUpdate(n => n + 1), 60000);
      return () => clearInterval(interval);
    }
  }, [user, isActive]);

  // Don't show banner if user is logged in
  if (user) return null;

  const getMessage = () => {
    if (hasExpired) {
      if (language === 'ru') return 'Пробный период истёк. Войдите для сохранения данных.';
      if (language === 'es') return 'El período de prueba ha expirado. Inicia sesión para guardar datos.';
      return 'Trial period expired. Sign in to save your data.';
    }
    
    const timeStr = hoursLeft > 0 ? `${hoursLeft}ч ${minutesLeft}м` : `${minutesLeft}м`;
    
    if (language === 'ru') return `PRO бесплатно: ${timeStr}. Данные не сохраняются.`;
    if (language === 'es') return `PRO gratis: ${timeStr}. Los datos no se guardan.`;
    return `Free PRO: ${timeStr}. Data is not saved.`;
  };

  return (
    <Card className={`mb-4 border-2 ${hasExpired ? 'border-destructive/50 bg-destructive/5' : 'border-primary/30 bg-primary/5'}`}>
      <CardContent className="p-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {hasExpired ? (
              <Clock className="w-4 h-4 text-destructive shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
            )}
            <span className={`text-sm font-medium truncate ${hasExpired ? 'text-destructive' : 'text-foreground'}`}>
              {getMessage()}
            </span>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate('/auth')}
            className="shrink-0"
          >
            <LogIn className="w-4 h-4 mr-1" />
            {language === 'ru' ? 'Войти' : language === 'es' ? 'Entrar' : 'Sign In'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
