import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'celebration-settings';

interface CelebrationSettings {
  soundEnabled: boolean;
  confettiEnabled: boolean;
}

const defaultSettings: CelebrationSettings = {
  soundEnabled: true,
  confettiEnabled: true,
};

export function useCelebrationSettings() {
  const [settings, setSettings] = useState<CelebrationSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    // Also update window for immediate access from celebrations.ts
    (window as any).__celebrationSettings = settings;
  }, [settings]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, soundEnabled: enabled }));
  }, []);

  const setConfettiEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, confettiEnabled: enabled }));
  }, []);

  return {
    soundEnabled: settings.soundEnabled,
    confettiEnabled: settings.confettiEnabled,
    setSoundEnabled,
    setConfettiEnabled,
  };
}

// Helper to get settings synchronously from anywhere
export function getCelebrationSettings(): CelebrationSettings {
  // Check window cache first
  if ((window as any).__celebrationSettings) {
    return (window as any).__celebrationSettings;
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : defaultSettings;
  } catch {
    return defaultSettings;
  }
}
