import { describe, expect, it } from 'vitest';
import { addXp, currentStreak, level } from './profile';
import { defaultProfile } from '../storage/store';
import type { Profile } from '../types';

describe('streak', () => {
  it('counts consecutive days', () => {
    let p = addXp(defaultProfile(), 10, '2026-11-01');
    p = addXp(p, 10, '2026-11-01');
    p = addXp(p, 10, '2026-11-02');
    expect(p.streak).toBe(2);
    expect(p.history['2026-11-01']).toBe(20);
    expect(currentStreak(p, '2026-11-03')).toBe(2);
    expect(currentStreak(p, '2026-11-04')).toBe(0);
  });

  it('uses a freeze for a missed day', () => {
    let p: Profile = { ...defaultProfile(), freezes: 1, streak: 5, lastActive: '2026-11-01' };
    expect(currentStreak(p, '2026-11-03')).toBe(5);
    p = addXp(p, 10, '2026-11-03');
    expect(p).toMatchObject({ streak: 6, freezes: 0 });
  });

  it('awards a freeze every 7 days', () => {
    let p = defaultProfile();
    for (let d = 1; d <= 7; d++) p = addXp(p, 10, `2026-11-0${d}`);
    expect(p).toMatchObject({ streak: 7, freezes: 1, bestStreak: 7 });
  });
});

describe('level', () => {
  it('needs 100, then 200 XP', () => {
    expect(level(0).level).toBe(1);
    expect(level(100)).toEqual({ level: 2, into: 0, needed: 200 });
    expect(level(350)).toEqual({ level: 3, into: 50, needed: 300 });
  });
});
