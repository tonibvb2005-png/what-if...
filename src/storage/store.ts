import { useCallback, useEffect, useRef, useState } from 'react';
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

const SAVED_AT_KEY = 'polako-saved-at';

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? parseState(JSON.parse(raw)) : defaultState();
  } catch {
    return defaultState();
  }
}

function loadSavedAt(): number {
  try {
    return Number(localStorage.getItem(SAVED_AT_KEY)) || 0;
  } catch {
    return 0;
  }
}

export function saveState(state: AppState, savedAt: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    localStorage.setItem(SAVED_AT_KEY, String(savedAt));
  } catch {
    // Storage full or blocked (private mode) – the app keeps working in memory.
  }
}

/* ---------- Cloud sync via the hosting page's per-viewer store ---------- */

/** Minimal shape of the hosting page's document store that we use. */
interface CloudDoc {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(data: Record<string, unknown>): Promise<void>;
}
interface HostRuntime {
  use(name: string): Promise<unknown>;
}

/** Where progress is kept: 'cloud' = the viewer's Claude account, 'local' = this browser only. */
export type SyncStatus = 'connecting' | 'cloud' | 'local' | 'error';

/** Connect to the viewer's private document, or null when the page runs elsewhere / signed out. */
export async function connectCloud(): Promise<CloudDoc | null> {
  const host = (window as unknown as { claude?: HostRuntime }).claude;
  if (!host?.use) return null;
  try {
    const [db, user] = (await Promise.all([host.use('db'), host.use('user')])) as [
      { doc(path: string): CloudDoc } | null,
      { id(): Promise<string | null> } | null,
    ];
    if (!db || !user) return null;
    const id = await user.id();
    if (!id) return null;
    // data/users/<id>/… is private to this viewer.
    return db.doc(`data/users/${id}/polako`);
  } catch {
    return null;
  }
}

const PUSH_DELAY = 1200;

export function useAppState() {
  const [state, setState] = useState<AppState>(loadState);
  const [sync, setSync] = useState<SyncStatus>('connecting');
  const stateRef = useRef(state);
  stateRef.current = state;
  /** True when the latest state change came from the learner (not from loading). */
  const dirty = useRef(false);
  const cloud = useRef<CloudDoc | null>(null);
  const writing = useRef<Promise<void>>(Promise.resolve());
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const push = useCallback(() => {
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = null;
    const ref = cloud.current;
    if (!ref) return;
    const body = { savedAt: loadSavedAt() || Date.now(), state: stateRef.current as unknown as Record<string, unknown> };
    // One write at a time to the same document.
    writing.current = writing.current
      .then(() => ref.set(body))
      .then(() => setSync('cloud'))
      .catch(() => setSync('error'));
  }, []);

  // Connect once and merge: whichever copy was saved last wins.
  useEffect(() => {
    let done = false;
    const giveUp = setTimeout(() => {
      if (!done) setSync('local');
    }, 12_000);
    connectCloud().then(async (ref) => {
      if (!ref) {
        done = true;
        setSync('local');
        return;
      }
      try {
        const snap = await ref.get();
        const remote = snap.exists ? snap.data() : undefined;
        const remoteAt = Number(remote?.savedAt) || 0;
        const localAt = loadSavedAt();
        cloud.current = ref;
        done = true;
        if (remote?.state && remoteAt >= localAt) {
          const s = parseState(remote.state);
          saveState(s, remoteAt);
          setState(s);
          setSync('cloud');
        } else if (localAt > 0) {
          push(); // local progress is newer (or the cloud is still empty)
        } else {
          setSync('cloud');
        }
      } catch {
        done = true;
        setSync('error');
      } finally {
        clearTimeout(giveUp);
      }
    });
    return () => clearTimeout(giveUp);
  }, [push]);

  // Save every learner change locally right away, and to the cloud shortly after.
  useEffect(() => {
    if (!dirty.current) return;
    dirty.current = false;
    saveState(state, Date.now());
    if (cloud.current) {
      if (pushTimer.current) clearTimeout(pushTimer.current);
      pushTimer.current = setTimeout(push, PUSH_DELAY);
    }
  }, [state, push]);

  // Don't lose the last change when the page is closed or hidden.
  useEffect(() => {
    const flush = () => {
      if (pushTimer.current) push();
    };
    const onVis = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pagehide', flush);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pagehide', flush);
    };
  }, [push]);

  const update = useCallback((fn: (s: AppState) => AppState) => {
    dirty.current = true;
    setState(fn);
  }, []);
  const replace = useCallback((s: AppState) => {
    dirty.current = true;
    setState(s);
  }, []);
  return [state, update, replace, sync] as const;
}
