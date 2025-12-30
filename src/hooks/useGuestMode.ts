import { useState, useEffect, useMemo } from 'react';

const GUEST_MODE_KEY = 'guest_mode_started';
const GUEST_MODE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useGuestMode() {
  const [guestModeStarted, setGuestModeStarted] = useState<number | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(GUEST_MODE_KEY);
    if (stored) {
      setGuestModeStarted(parseInt(stored, 10));
    }
  }, []);

  const startGuestMode = () => {
    const now = Date.now();
    localStorage.setItem(GUEST_MODE_KEY, now.toString());
    setGuestModeStarted(now);
  };

  const clearGuestMode = () => {
    localStorage.removeItem(GUEST_MODE_KEY);
    setGuestModeStarted(null);
  };

  const guestModeInfo = useMemo(() => {
    if (!guestModeStarted) {
      return {
        isActive: false,
        hasExpired: false,
        timeLeft: 0,
        hoursLeft: 24,
        minutesLeft: 0,
      };
    }

    const now = Date.now();
    const elapsed = now - guestModeStarted;
    const timeLeft = Math.max(0, GUEST_MODE_DURATION - elapsed);
    const hasExpired = timeLeft === 0;
    const isActive = !hasExpired;

    const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

    return {
      isActive,
      hasExpired,
      timeLeft,
      hoursLeft,
      minutesLeft,
    };
  }, [guestModeStarted]);

  return {
    guestModeStarted,
    startGuestMode,
    clearGuestMode,
    ...guestModeInfo,
  };
}
