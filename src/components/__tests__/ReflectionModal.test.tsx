import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import React from 'react';

// Mock translation context
vi.mock('@/contexts/LanguageContext', () => ({
  useTranslation: () => ({ language: 'en', t: (k: string) => k }),
}));

// Mock toast & confetti (side effects)
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

// Mock useAuth to control authentication state per test
const authState: { user: any; loading: boolean } = { user: null, loading: false };
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

import { ReflectionModal } from '@/components/ReflectionModal';
import { useReflectionGate } from '@/hooks/useReflectionGate';

describe('ReflectionModal rendering', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('does NOT render anything when open=false', () => {
    const { container } = render(
      <ReflectionModal open={false} onClose={() => {}} userId="u1" />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the reflection UI when open=true and a user is provided', () => {
    render(<ReflectionModal open={true} onClose={() => {}} userId="u1" />);
    // Step 0 heading is "How did you sleep?" in English
    expect(screen.getByText(/How did you sleep/i)).toBeInTheDocument();
  });
});

describe('useReflectionGate authentication guard', () => {
  beforeEach(() => {
    localStorage.clear();
    authState.user = null;
    authState.loading = false;
    vi.useFakeTimers();
  });

  it('keeps the modal closed for unauthenticated users (no user)', () => {
    authState.user = null;
    const { result } = renderHook(() => useReflectionGate());
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.open).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('opens the modal for an authenticated user with no reflection today', () => {
    authState.user = { id: 'user-123' };
    const { result } = renderHook(() => useReflectionGate());
    expect(result.current.open).toBe(false);
    act(() => { vi.advanceTimersByTime(2000); });
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.open).toBe(true);
  });

  it('does NOT reopen the modal if the user already completed reflection today', () => {
    authState.user = { id: 'user-123' };
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(
      'topfocus_reflections',
      JSON.stringify([{ userId: 'user-123', date: today, sleepScore: 4 }]),
    );
    const { result } = renderHook(() => useReflectionGate());
    act(() => { vi.advanceTimersByTime(5000); });
    expect(result.current.open).toBe(false);
  });
});