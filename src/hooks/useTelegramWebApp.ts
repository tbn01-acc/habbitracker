import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

interface TelegramWebAppState {
  isInTelegram: boolean;
  isVerified: boolean;
  isLoading: boolean;
  telegramUser: TelegramUser | null;
  linkedProfile: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  error: string | null;
}

// Window.Telegram is declared elsewhere, avoid duplicate declarations

export function useTelegramWebApp() {
  const [state, setState] = useState<TelegramWebAppState>({
    isInTelegram: false,
    isVerified: false,
    isLoading: true,
    telegramUser: null,
    linkedProfile: null,
    error: null,
  });

  const verifyInitData = useCallback(async (initData: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('verify-telegram-init', {
        body: { initData },
      });

      if (error) throw error;

      if (data.valid) {
        setState(prev => ({
          ...prev,
          isVerified: true,
          telegramUser: data.telegramUser,
          linkedProfile: data.linkedProfile,
          error: null,
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isVerified: false,
          error: data.error || 'Verification failed',
        }));
        return false;
      }
    } catch (err: any) {
      console.error('Telegram verification error:', err);
      setState(prev => ({
        ...prev,
        isVerified: false,
        error: err.message || 'Verification failed',
      }));
      return false;
    }
  }, []);

  useEffect(() => {
    const checkTelegram = async () => {
      const tg = window.Telegram?.WebApp;
      
      if (!tg || !tg.initData) {
        setState(prev => ({
          ...prev,
          isInTelegram: false,
          isLoading: false,
        }));
        return;
      }

      // We're in Telegram WebApp
      setState(prev => ({
        ...prev,
        isInTelegram: true,
        telegramUser: tg.initDataUnsafe?.user || null,
      }));

      // Verify initData on server
      await verifyInitData(tg.initData);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
      }));
    };

    // Wait for Telegram SDK to be ready
    if (window.Telegram?.WebApp) {
      checkTelegram();
    } else {
      // Telegram SDK not loaded, not in Telegram
      setState(prev => ({
        ...prev,
        isInTelegram: false,
        isLoading: false,
      }));
    }
  }, [verifyInitData]);

  // Helper functions to interact with Telegram WebApp
  const showMainButton = useCallback((text: string, onClick: () => void) => {
    const btn = window.Telegram?.WebApp?.MainButton;
    if (btn) {
      btn.setText(text);
      btn.onClick(onClick);
      btn.show();
    }
  }, []);

  const hideMainButton = useCallback(() => {
    window.Telegram?.WebApp?.MainButton.hide();
  }, []);

  const showBackButton = useCallback((onClick: () => void) => {
    const btn = window.Telegram?.WebApp?.BackButton;
    if (btn) {
      btn.onClick(onClick);
      btn.show();
    }
  }, []);

  const hideBackButton = useCallback(() => {
    window.Telegram?.WebApp?.BackButton.hide();
  }, []);

  const closeMiniApp = useCallback(() => {
    window.Telegram?.WebApp?.close();
  }, []);

  return {
    ...state,
    showMainButton,
    hideMainButton,
    showBackButton,
    hideBackButton,
    closeMiniApp,
    themeParams: window.Telegram?.WebApp?.themeParams,
    colorScheme: window.Telegram?.WebApp?.colorScheme,
  };
}
