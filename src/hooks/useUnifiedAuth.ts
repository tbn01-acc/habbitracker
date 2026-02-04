import { useEffect, useState, useCallback } from 'react';
import WebApp from '@twa-dev/sdk';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export const useUnifiedAuth = () => {
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { refetchProfile } = useAuth();

  const performTelegramLogin = useCallback(async () => {
    try {
      if (!WebApp.initData) return;

      // Вызываем Edge-функцию для обмена данных TG на сессию Supabase
      const { data, error } = await supabase.functions.invoke('telegram-auth', {
        body: { initData: WebApp.initData }
      });

      if (error) throw error;

      // Если функция вернула сессию, устанавливаем её в клиент Supabase
      if (data && data.access_token && data.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        if (sessionError) throw sessionError;
        
        // Обновляем данные профиля в контексте приложения
        await refetchProfile();
      }
    } catch (err) {
      console.error('Unified Auth Error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [refetchProfile]);

  useEffect(() => {
    const initAuth = async () => {
      // 1. Проверяем наличие среды Telegram
      if (typeof window !== 'undefined' && WebApp.initData) {
        WebApp.ready();
        
        // 2. Проверяем разрешение на отправку сообщений (Write Access)
        // Это необходимо для корректной работы уведомлений в TG Mini App
        const user = WebApp.initDataUnsafe?.user;
        const hasWriteAccess = user?.allows_write_to_pm;

        if (!hasWriteAccess) {
          WebApp.requestWriteAccess((allowed) => {
            if (allowed) {
              setIsAccessDenied(false);
              performTelegramLogin();
            } else {
              setIsAccessDenied(true);
              setIsLoading(false);
            }
          });
        } else {
          performTelegramLogin();
        }
      } else {
        // 3. Если открыто в обычном браузере — просто пропускаем
        setIsLoading(false);
      }
    };

    initAuth();
  }, [performTelegramLogin]);

  return { isAccessDenied, isLoading };
};
