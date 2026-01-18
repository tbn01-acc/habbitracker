import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SphereIndex } from '@/types/sphere';

export type SpreadLevel = 'topFocus' | 'stability' | 'balance' | 'tilt' | 'chaos';

interface SpreadState {
  level: SpreadLevel;
  spread: number;
  minValue: number;
  maxValue: number;
  minSphereId: number | null;
  maxSphereId: number | null;
  allSpheresAboveMinimum: boolean;
}

const STORAGE_KEY = 'balance_spread_level';
const STARS_AWARDED_KEY = 'balance_stars_awarded';
const MINIMUM_SPHERE_VALUE = 25; // Each sphere must be at least 25% filled

export function getSpreadLevel(spread: number): SpreadLevel {
  if (spread <= 5) return 'topFocus';
  if (spread <= 10) return 'stability';
  if (spread < 50) return 'balance';
  if (spread < 75) return 'tilt';
  return 'chaos';
}

// Check if all spheres meet the minimum threshold (25%)
export function checkAllSpheresAboveMinimum(sphereIndices: SphereIndex[]): boolean {
  if (sphereIndices.length === 0) return false;
  return sphereIndices.every(s => s.index >= MINIMUM_SPHERE_VALUE);
}

export function calculateSpread(sphereIndices: SphereIndex[]): SpreadState {
  if (sphereIndices.length === 0) {
    return {
      level: 'stability',
      spread: 0,
      minValue: 0,
      maxValue: 0,
      minSphereId: null,
      maxSphereId: null,
      allSpheresAboveMinimum: false,
    };
  }

  const values = sphereIndices.map(s => ({
    sphereId: s.sphereId,
    index: s.index,
  }));

  const minItem = values.reduce((min, curr) => curr.index < min.index ? curr : min, values[0]);
  const maxItem = values.reduce((max, curr) => curr.index > max.index ? curr : max, values[0]);
  
  const spread = maxItem.index - minItem.index;
  const allSpheresAboveMinimum = checkAllSpheresAboveMinimum(sphereIndices);
  
  return {
    level: getSpreadLevel(spread),
    spread,
    minValue: minItem.index,
    maxValue: maxItem.index,
    minSphereId: minItem.sphereId,
    maxSphereId: maxItem.sphereId,
    allSpheresAboveMinimum,
  };
}

// Track which star rewards have been awarded
export function getAwardedStarsLevels(): SpreadLevel[] {
  const stored = localStorage.getItem(STARS_AWARDED_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored) as SpreadLevel[];
  } catch {
    return [];
  }
}

export function markStarsAwarded(level: SpreadLevel) {
  const current = getAwardedStarsLevels();
  if (!current.includes(level)) {
    localStorage.setItem(STARS_AWARDED_KEY, JSON.stringify([...current, level]));
  }
}

export function shouldAwardStars(level: SpreadLevel): boolean {
  const awarded = getAwardedStarsLevels();
  return (level === 'stability' || level === 'topFocus') && !awarded.includes(level);
}

export function getStarsForLevel(level: SpreadLevel): number {
  if (level === 'topFocus') return 50;
  if (level === 'stability') return 25;
  return 0;
}

// Create a stable key for comparing sphere indices
function createSphereKey(sphereIndices: SphereIndex[]): string {
  return sphereIndices
    .map(s => `${s.sphereId}:${s.index}`)
    .sort()
    .join('|');
}

export function useBalanceSpread(sphereIndices: SphereIndex[]) {
  const [currentState, setCurrentState] = useState<SpreadState | null>(null);
  const [previousLevel, setPreviousLevel] = useState<SpreadLevel | null>(null);
  const [isNewLevel, setIsNewLevel] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  
  // Memoize sphere indices key to prevent infinite loops
  const sphereKey = useMemo(() => createSphereKey(sphereIndices), [sphereIndices]);
  const prevKeyRef = useRef<string>('');

  // Calculate current spread state - only when content changes
  useEffect(() => {
    // Skip if the actual content hasn't changed
    if (prevKeyRef.current === sphereKey) {
      return;
    }
    prevKeyRef.current = sphereKey;

    const state = calculateSpread(sphereIndices);
    setCurrentState(state);

    // Notifications only enabled when ALL spheres are at least 25%
    const canNotify = state.allSpheresAboveMinimum;
    setNotificationsEnabled(canNotify);

    if (!canNotify) {
      // Don't trigger any notifications if condition not met
      return;
    }

    // Check if level changed from previous
    const storedLevel = localStorage.getItem(STORAGE_KEY);
    const prevLevel = storedLevel as SpreadLevel | null;
    setPreviousLevel(prevLevel);

    if (prevLevel !== null && prevLevel !== state.level) {
      // Level changed - trigger effects
      setIsNewLevel(true);
      setShowModal(true);
      localStorage.setItem(STORAGE_KEY, state.level);
    } else if (prevLevel === null) {
      // First time - just store the level, don't show effects
      localStorage.setItem(STORAGE_KEY, state.level);
      setIsNewLevel(false);
    }
  }, [sphereKey, sphereIndices]);

  const dismissModal = useCallback(() => {
    setShowModal(false);
    setIsNewLevel(false);
  }, []);

  const openModal = useCallback(() => {
    // Only open modal if notifications are enabled
    if (notificationsEnabled) {
      setShowModal(true);
    }
  }, [notificationsEnabled]);

  const resetLevelTracking = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPreviousLevel(null);
    setIsNewLevel(false);
  }, []);

  return {
    currentState,
    previousLevel,
    isNewLevel,
    showModal,
    dismissModal,
    openModal,
    resetLevelTracking,
    notificationsEnabled,
  };
}
