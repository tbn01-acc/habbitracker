import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

const REFLECTION_KEY = 'topfocus_reflections';
const DRAFT_KEY = 'topfocus_reflection_draft';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

/** Has the current user already completed today's reflection? */
function hasCompletedToday(userId: string | undefined): boolean {
  try {
    const stored = localStorage.getItem(REFLECTION_KEY);
    if (!stored) return false;
    const reflections = JSON.parse(stored);
    const today = todayStr();
    return reflections.some(
      (r: any) => r.date === today && (r.userId === userId || r.userId === 'guest'),
    );
  } catch {
    return false;
  }
}

/** Has the user a saved in-progress draft for today? */
function hasDraftToday(): boolean {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return false;
    const draft = JSON.parse(raw);
    return draft?.date === todayStr();
  } catch {
    return false;
  }
}

/**
 * Single source of truth for showing the daily reflection modal.
 * Rules:
 *  - User MUST be authenticated (no guests).
 *  - Reflection appears at most ONCE per calendar day per user.
 *  - If a draft exists (e.g. user left to create a Main Task), reopen it
 *    automatically so the user resumes at the same step.
 */
export function useReflectionGate() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setOpen(false);
      return;
    }
    if (hasCompletedToday(user.id)) {
      setOpen(false);
      return;
    }
    // Resume draft instantly, otherwise small delay for first open
    const delay = hasDraftToday() ? 200 : 1500;
    const t = setTimeout(() => setOpen(true), delay);
    return () => clearTimeout(t);
  }, [user, loading]);

  return { open, setOpen, user, isAuthenticated: !!user };
}

export const __reflectionGateInternals = { hasCompletedToday, hasDraftToday, todayStr };