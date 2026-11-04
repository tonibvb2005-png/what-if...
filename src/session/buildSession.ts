import type { Card, Drill, Review } from '../types';
import { isDue } from '../srs/srs';

export type Exercise =
  | { kind: 'intro'; card: Card }
  | { kind: 'choice'; card: Card; direction: 'hr-de' | 'de-hr'; options: string[] }
  | { kind: 'listen'; card: Card; options: string[] }
  | { kind: 'type'; card: Card }
  | { kind: 'flip'; card: Card; direction: 'hr-de' | 'de-hr' }
  | { kind: 'puzzle'; card: Card; tokens: string[] }
  | { kind: 'drill'; drill: Drill }
  | { kind: 'match'; cards: Card[] };

export type Rng = () => number;

export function shuffle<T>(items: T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Words of a sentence for the sentence puzzle (punctuation stays attached). */
export function puzzleTokens(sentence: string): string[] {
  return sentence.split(/\s+/).filter(Boolean);
}

function canPuzzle(card: Card): boolean {
  if (!card.exampleHr) return false;
  const n = puzzleTokens(card.exampleHr).length;
  return n >= 3 && n <= 8;
}

/** Pick `count` distractors, preferring cards from the same lesson. */
export function pickOptions(
  card: Card,
  pool: Card[],
  field: 'hr' | 'de',
  rng: Rng,
  count = 3,
): string[] {
  const seen = new Set([card[field].toLowerCase()]);
  const same = shuffle(pool.filter((c) => c.lessonId === card.lessonId && c.id !== card.id), rng);
  const other = shuffle(pool.filter((c) => c.lessonId !== card.lessonId), rng);
  const out: string[] = [];
  for (const c of [...same, ...other]) {
    const v = c[field];
    if (seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
    if (out.length === count) break;
  }
  return shuffle([card[field], ...out], rng);
}

/** Exercise for a card that is due for review, depending on its mastery stage. */
export function reviewExercise(card: Card, review: Review, pool: Card[], voice: boolean, rng: Rng): Exercise {
  const stage = review.stage;
  if (stage <= 1) return { kind: 'choice', card, direction: 'de-hr', options: pickOptions(card, pool, 'hr', rng) };
  if (stage === 2) {
    return voice && rng() < 0.6
      ? { kind: 'listen', card, options: pickOptions(card, pool, 'de', rng) }
      : { kind: 'choice', card, direction: 'de-hr', options: pickOptions(card, pool, 'hr', rng) };
  }
  if (stage >= 4 && canPuzzle(card) && rng() < 0.4) {
    return { kind: 'puzzle', card, tokens: shuffle(puzzleTokens(card.exampleHr!), rng) };
  }
  return { kind: 'type', card };
}

export interface SessionInput {
  /** Cards to introduce from (usually the current lesson); empty for a pure review. */
  newPool: Card[];
  /** All cards known to the app (built-in + custom), used for reviews and distractors. */
  allCards: Card[];
  reviews: Record<string, Review>;
  drills: Drill[];
  day: string;
  voice: boolean;
  rng?: Rng;
  maxReviews?: number;
  maxNew?: number;
  maxDrills?: number;
}

export function dueCards(allCards: Card[], reviews: Record<string, Review>, day: string): Card[] {
  return allCards
    .filter((c) => reviews[c.id] && isDue(reviews[c.id], day))
    .sort((a, b) => {
      const ra = reviews[a.id];
      const rb = reviews[b.id];
      return ra.due.localeCompare(rb.due) || ra.stage - rb.stage;
    });
}

export function buildSession(input: SessionInput): Exercise[] {
  const { allCards, reviews, day, voice, rng = Math.random } = input;
  const maxReviews = input.maxReviews ?? 10;
  const maxNew = input.maxNew ?? 6;

  const due = dueCards(allCards, reviews, day).slice(0, maxReviews);
  const fresh = input.newPool.filter((c) => !reviews[c.id]).slice(0, maxNew);
  const drills = shuffle(input.drills, rng).slice(0, input.maxDrills ?? 2);

  const out: Exercise[] = [];

  // 1. Warm-up: due reviews.
  for (const card of shuffle(due, rng)) out.push(reviewExercise(card, reviews[card.id], allCards, voice, rng));

  // 2. New cards in groups of three: show them, then quiz them.
  for (let i = 0; i < fresh.length; i += 3) {
    const group = fresh.slice(i, i + 3);
    for (const card of group) out.push({ kind: 'intro', card });
    for (const card of shuffle(group, rng)) {
      out.push(
        voice && rng() < 0.3
          ? { kind: 'listen', card, options: pickOptions(card, allCards, 'de', rng) }
          : { kind: 'choice', card, direction: 'hr-de', options: pickOptions(card, allCards, 'de', rng) },
      );
    }
  }

  // 3. Grammar drills spread through the session.
  drills.forEach((drill, i) => {
    const pos = Math.min(out.length, Math.round(((i + 1) * out.length) / (drills.length + 1)));
    out.splice(pos, 0, { kind: 'drill', drill });
  });

  // 4. Finale: matching game with the cards of this session.
  const matchCards = shuffle([...fresh, ...due], rng).slice(0, 5);
  if (matchCards.length >= 4) out.push({ kind: 'match', cards: matchCards });

  return out;
}

/** Free practice of already learned cards (does not affect the schedule). */
export function buildPractice(
  cards: Card[],
  allCards: Card[],
  reviews: Record<string, Review>,
  drills: Drill[],
  voice: boolean,
  rng: Rng = Math.random,
): Exercise[] {
  const learned = shuffle(cards.filter((c) => reviews[c.id]), rng).slice(0, 8);
  const out: Exercise[] = learned.map((c) => {
    // Vary the stage a bit so practice mixes recognition and production.
    const stage = Math.max(2, Math.min(5, reviews[c.id].stage + (rng() < 0.5 ? 0 : 1)));
    return reviewExercise(c, { ...reviews[c.id], stage }, allCards, voice, rng);
  });
  shuffle(drills, rng)
    .slice(0, 3)
    .forEach((drill) => out.splice(Math.floor(rng() * (out.length + 1)), 0, { kind: 'drill', drill }));
  if (learned.length >= 4) out.push({ kind: 'match', cards: learned.slice(0, 5) });
  return out;
}

export type VocabMode = 'mixed' | 'flip' | 'choice' | 'type';
export type VocabDirection = 'hr-de' | 'de-hr' | 'mixed';

/** Free vocabulary training over any selection of cards (does not affect the schedule). */
export function buildVocab(
  cards: Card[],
  allCards: Card[],
  opts: { mode: VocabMode; direction: VocabDirection; count: number },
  rng: Rng = Math.random,
): Exercise[] {
  const picked = shuffle(cards, rng).slice(0, opts.count);
  return picked.map((card): Exercise => {
    const dir = opts.direction === 'mixed' ? (rng() < 0.5 ? 'hr-de' : 'de-hr') : opts.direction;
    const mode =
      opts.mode === 'mixed' ? (['flip', 'choice', 'choice', 'type'] as const)[Math.floor(rng() * 4)] : opts.mode;
    if (mode === 'type') return { kind: 'type', card };
    if (mode === 'flip') return { kind: 'flip', card, direction: dir };
    return {
      kind: 'choice',
      card,
      direction: dir,
      options: pickOptions(card, allCards, dir === 'hr-de' ? 'de' : 'hr', rng),
    };
  });
}
