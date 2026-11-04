import { useCallback, useEffect, useState } from 'react';
import type { AppState, Profile } from '../types';

const KEY = 'polako-state-v1';

export function defaultProfile(): Profile {
  return {
    xp: 0,
    streak: 0,
    bestStreak: 0,
    freezes: 0,
    lastActive: null,
    dailyGoal: 50,
    history: {},
    answers: { correct: 0, total: 0 },
    perfectSessions: 0,
    unlockAll: false,
  };
}

export function defaultState(): AppState {
  return { version: 1, profile: defaultProfile(), reviews: {}, customCards: [] };
}

/** Accept partial/older data and fill in defaults. */
export function parseState(raw: unknown): AppState {
  const base = defaultState();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<AppState>;
  return {
    version: 1,
    profile: { ...base.profile, ...(r.profile ?? {}) },
    reviews: r.reviews && typeof r.reviews === 'object' ? r.reviews : {},
    customCards: Array.isArray(r.customCards) ? r.customCards : [],
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseState(JSON.parse(raw)) : defaultState();
  } catch {
    return defaultState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked (private mode) – the app keeps working in memory.
  }
}

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);
  useEffect(() => {
    saveState(state);
  }, [state]);
  const update = useCallback((fn: (s: AppState) => AppState) => setState(fn), []);
  return [state, update, setState] as const;
}
