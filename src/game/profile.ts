import type { AppState, Card, Lesson, Profile } from '../types';
import { daysBetween } from '../lib/date';
import { SOLID_STAGE } from '../srs/srs';

export const XP = {
  intro: 2,
  correct: 10,
  almost: 7,
  drill: 8,
  flip: 5,
  puzzle: 15,
  match: 15,
  sessionBonus: 10,
  perfectBonus: 10,
} as const;

/** Earn a streak freeze every 7 days in a row (max. 2 stored). */
const FREEZE_EVERY = 7;
const MAX_FREEZES = 2;

/** Record activity (XP) for a day and update the streak. */
export function addXp(profile: Profile, amount: number, day: string): Profile {
  const p: Profile = { ...profile, history: { ...profile.history } };
  p.xp += amount;
  p.history[day] = (p.history[day] ?? 0) + amount;

  if (p.lastActive !== day) {
    const gap = p.lastActive ? daysBetween(p.lastActive, day) : Infinity;
    if (gap === 1) p.streak += 1;
    else if (gap > 1 && gap - 1 <= p.freezes) {
      p.freezes -= gap - 1;
      p.streak += 1;
    } else p.streak = 1;
    if (p.streak % FREEZE_EVERY === 0) p.freezes = Math.min(MAX_FREEZES, p.freezes + 1);
    p.lastActive = day;
    p.bestStreak = Math.max(p.bestStreak, p.streak);
  }
  return p;
}

/** Streak as it should be shown today (0 if it was lost). */
export function currentStreak(profile: Profile, day: string): number {
  if (!profile.lastActive) return 0;
  const gap = daysBetween(profile.lastActive, day);
  if (gap <= 1) return profile.streak;
  return gap - 1 <= profile.freezes ? profile.streak : 0;
}

export function level(xp: number): { level: number; into: number; needed: number } {
  // Level n needs 100 * n XP to reach the next one.
  let lvl = 1;
  let rest = xp;
  while (rest >= lvl * 100) {
    rest -= lvl * 100;
    lvl += 1;
  }
  return { level: lvl, into: rest, needed: lvl * 100 };
}

export function introducedCount(state: AppState, cards: Card[]): number {
  return cards.filter((c) => state.reviews[c.id]).length;
}

export function solidCount(state: AppState, cards: Card[]): number {
  return cards.filter((c) => (state.reviews[c.id]?.stage ?? 0) >= SOLID_STAGE).length;
}

export function isLessonComplete(state: AppState, lesson: Lesson): boolean {
  return lesson.cards.every((c) => state.reviews[c.id]);
}

export function isLessonUnlocked(state: AppState, lessons: Lesson[], index: number): boolean {
  if (index === 0 || state.profile.unlockAll) return true;
  return isLessonComplete(state, lessons[index - 1]);
}

export interface Badge {
  id: string;
  emoji: string;
  title: string;
  description: string;
  earned: boolean;
}

export function badges(state: AppState, lessons: Lesson[]): Badge[] {
  const p = state.profile;
  const learned = Object.keys(state.reviews).length;
  const solid = Object.values(state.reviews).filter((r) => r.stage >= SOLID_STAGE).length;
  const done = (id: string) => {
    const l = lessons.find((x) => x.id === id);
    return !!l && isLessonComplete(state, l);
  };
  const list: (Omit<Badge, 'earned'> & { test: boolean })[] = [
    { id: 'first', emoji: '🌱', title: 'Prvi korak', description: 'Erste Lernrunde geschafft', test: p.xp > 0 },
    { id: 'family', emoji: '👨‍👩‍👧', title: 'Familienmensch', description: 'Lektion „Obitelj“ abgeschlossen', test: done('l1') },
    { id: 'baka', emoji: '🍲', title: 'Bakas Liebling', description: 'Lektion „Kod bake na ručku“ abgeschlossen', test: done('l2') },
    { id: 'streak7', emoji: '🔥', title: '7 Tage am Stück', description: 'Eine Woche lang jeden Tag gelernt', test: p.bestStreak >= 7 },
    { id: 'streak30', emoji: '🏆', title: 'Monatsmeister', description: '30 Tage am Stück gelernt', test: p.bestStreak >= 30 },
    { id: 'words50', emoji: '📚', title: '50 Wörter', description: '50 Wörter und Phrasen gelernt', test: learned >= 50 },
    { id: 'solid50', emoji: '🧠', title: 'Sitzt!', description: '50 Wörter sicher im Langzeitgedächtnis', test: solid >= 50 },
    { id: 'perfect', emoji: '✨', title: 'Bez greške', description: 'Eine Lernrunde ohne Fehler', test: p.perfectSessions > 0 },
    { id: 'kurs', emoji: '✏️', title: 'Fleißig im Kurs', description: '10 eigene Wörter aus dem Kurs eingetragen', test: state.customCards.length >= 10 },
    { id: 'dubrovnik', emoji: '🏰', title: 'Bis nach Dubrovnik', description: 'Teil 1 der Reise abgeschlossen', test: ['l1', 'l2', 'l3', 'l4', 'l5', 'l6', 'l7', 'l8'].every(done) },
    { id: 'doctor', emoji: '🩺', title: 'Gute Besserung', description: 'Lektion „Kod liječnika“ abgeschlossen', test: done('l9') },
    { id: 'proverbs', emoji: '😄', title: 'Svaka čast!', description: 'Lektion „Izreke i fraze“ abgeschlossen', test: done('l14') },
    { id: 'words150', emoji: '📖', title: '150 Wörter', description: '150 Wörter und Phrasen gelernt', test: learned >= 150 },
    { id: 'croatia', emoji: '🇭🇷', title: 'Ganz Kroatien', description: 'Alle Stationen von Zagreb bis Osijek abgeschlossen', test: lessons.every((l) => isLessonComplete(state, l)) },
  ];
  return list.map(({ test, ...b }) => ({ ...b, earned: test }));
}
