import type { Grade, Review } from '../types';
import { addDays } from '../lib/date';

export const MAX_STAGE = 5;
/** Stage from which a card counts as "sicher" (well known). */
export const SOLID_STAGE = 4;

export function newReview(cardId: string, day: string): Review {
  return { cardId, stage: 1, ease: 2.5, intervalDays: 0, due: day, reps: 0, lapses: 0 };
}

/**
 * SM-2 style scheduling with mastery stages.
 * - correct: stage up, interval grows (1 → 3 → interval × ease), ease +0.05
 * - almost (diacritics/typo): counts as known, but interval grows less and ease stays
 * - wrong: stage down, due again today, ease −0.2
 */
export function schedule(review: Review, grade: Grade, day: string): Review {
  const r = { ...review, reps: review.reps + 1 };
  if (grade === 'wrong') {
    r.lapses += 1;
    r.stage = Math.max(1, r.stage - 1);
    r.ease = Math.max(1.3, +(r.ease - 0.2).toFixed(2));
    r.intervalDays = 0;
    r.due = day;
    return r;
  }

  r.stage = Math.min(MAX_STAGE, r.stage + 1);
  let interval: number;
  if (r.intervalDays < 1) interval = 1;
  else if (r.intervalDays < 3) interval = 3;
  else interval = Math.round(r.intervalDays * (grade === 'correct' ? r.ease : 1.2));
  if (grade === 'correct') r.ease = Math.min(3, +(r.ease + 0.05).toFixed(2));
  r.intervalDays = Math.min(interval, 180);
  r.due = addDays(day, r.intervalDays);
  return r;
}

export function isDue(review: Review, day: string): boolean {
  return review.due <= day;
}
