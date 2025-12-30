import { useEffect, useRef } from 'react';
import { useSubscription } from './useSubscription';
import { useTranslation } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

export function useTrialNotifications() {
  const { isInTrial, trialDaysLeft, trialBonusMonths } = useSubscription();
  const { language } = useTranslation();
  const notifiedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    // Only notify if in trial and days left is 1 or 2
    if (!isInTrial || trialDaysLeft > 2 || trialDaysLeft < 1) return;

    // Check if we already notified for this day
    if (notifiedRef.current.has(trialDaysLeft)) return;

    // Mark as notified
    notifiedRef.current.add(trialDaysLeft);

    // Show notification based on days left
    const showNotification = () => {
      let title: string;
      let description: string;

      if (language === 'ru') {
        const dayWord = trialDaysLeft === 1 ? 'день' : 'дня';
        title = `⏰ Осталось ${trialDaysLeft} ${dayWord} пробного PRO!`;
        description = trialBonusMonths > 0 
          ? `Успейте оформить подписку и получите +${trialBonusMonths} мес. бесплатно!`
          : 'Оформите подписку PRO, чтобы сохранить все возможности.';
      } else if (language === 'es') {
        title = `⏰ ¡${trialDaysLeft} día${trialDaysLeft !== 1 ? 's' : ''} restantes de PRO de prueba!`;
        description = trialBonusMonths > 0
          ? `¡Suscríbete ahora y obtén +${trialBonusMonths} mes${trialBonusMonths !== 1 ? 'es' : ''} gratis!`
          : 'Suscríbete a PRO para mantener todas las funciones.';
      } else {
        title = `⏰ ${trialDaysLeft} day${trialDaysLeft !== 1 ? 's' : ''} left in PRO trial!`;
        description = trialBonusMonths > 0
          ? `Subscribe now and get +${trialBonusMonths} month${trialBonusMonths !== 1 ? 's' : ''} free!`
          : 'Subscribe to PRO to keep all features.';
      }

      toast.warning(title, {
        description,
        duration: 10000,
        action: {
          label: language === 'ru' ? 'Оформить' : language === 'es' ? 'Suscribir' : 'Subscribe',
          onClick: () => window.location.href = '/upgrade',
        },
      });
    };

    // Delay notification slightly so it doesn't appear immediately on load
    const timer = setTimeout(showNotification, 2000);

    return () => clearTimeout(timer);
  }, [isInTrial, trialDaysLeft, trialBonusMonths, language]);
}
