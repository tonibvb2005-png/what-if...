import { describe, expect, it } from 'vitest';
import { buildSession, buildVocab, pickOptions, puzzleTokens } from './buildSession';
import { ALL_BUILTIN_CARDS, LESSONS } from '../content/lessons';
import { newReview } from '../srs/srs';
import type { Review } from '../types';

const DAY = '2026-11-04';

function seeded(seed = 1) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

describe('buildSession', () => {
  it('introduces new cards of the lesson with a quiz each', () => {
    const lesson = LESSONS[0];
    const ex = buildSession({
      newPool: lesson.cards,
      allCards: ALL_BUILTIN_CARDS,
      reviews: {},
      drills: lesson.drills,
      day: DAY,
      voice: false,
      rng: seeded(),
    });
    const intros = ex.filter((e) => e.kind === 'intro');
    expect(intros).toHaveLength(6);
    expect(ex.filter((e) => e.kind === 'choice')).toHaveLength(6);
    expect(ex.filter((e) => e.kind === 'drill')).toHaveLength(2);
    expect(ex.at(-1)?.kind).toBe('match');
    // Each card is introduced before it is quizzed.
    for (const e of ex) {
      if (e.kind !== 'choice') continue;
      const introAt = ex.findIndex((x) => x.kind === 'intro' && x.card.id === e.card.id);
      expect(introAt).toBeLessThan(ex.indexOf(e));
    }
  });

  it('only reviews cards that are due', () => {
    const [a, b, c] = ALL_BUILTIN_CARDS;
    const reviews: Record<string, Review> = {
      [a.id]: newReview(a.id, DAY),
      [b.id]: { ...newReview(b.id, DAY), stage: 3, due: '2026-11-10' },
      [c.id]: { ...newReview(c.id, DAY), stage: 3, due: '2026-11-01' },
    };
    const ex = buildSession({ newPool: [], allCards: ALL_BUILTIN_CARDS, reviews, drills: [], day: DAY, voice: false });
    const ids = ex.flatMap((e) => ('card' in e ? [e.card.id] : []));
    expect(ids.sort()).toEqual([a.id, c.id].sort());
    expect(ex.find((e) => 'card' in e && e.card.id === c.id)?.kind).toBe('type');
  });
});

describe('pickOptions', () => {
  it('contains the answer and distinct distractors', () => {
    const card = ALL_BUILTIN_CARDS[0];
    const opts = pickOptions(card, ALL_BUILTIN_CARDS, 'de', seeded(3));
    expect(opts).toHaveLength(4);
    expect(opts).toContain(card.de);
    expect(new Set(opts).size).toBe(4);
  });
});

describe('content', () => {
  it('has unique ids, valid drills and puzzle-able sentences', () => {
    const ids = [...ALL_BUILTIN_CARDS.map((c) => c.id), ...LESSONS.flatMap((l) => l.drills.map((d) => d.id))];
    expect(new Set(ids).size).toBe(ids.length);
    for (const l of LESSONS) {
      expect(l.cards.length).toBeGreaterThanOrEqual(10);
      for (const d of l.drills) {
        expect(d.sentence).toContain('___');
        expect(d.options).toContain(d.answer);
      }
      for (const c of l.cards) expect(puzzleTokens(c.exampleHr ?? '').length).toBeGreaterThan(0);
    }
  });
});

describe('buildVocab', () => {
  it('builds the requested number of exercises in the requested mode', () => {
    const ex = buildVocab(ALL_BUILTIN_CARDS, ALL_BUILTIN_CARDS, { mode: 'flip', direction: 'de-hr', count: 10 }, seeded(5));
    expect(ex).toHaveLength(10);
    expect(ex.every((e) => e.kind === 'flip' && e.direction === 'de-hr')).toBe(true);
    expect(new Set(ex.map((e) => ('card' in e ? e.card.id : ''))).size).toBe(10);
  });

  it('uses only the given cards and never more than exist', () => {
    const cards = LESSONS[1].cards;
    const ex = buildVocab(cards, ALL_BUILTIN_CARDS, { mode: 'mixed', direction: 'mixed', count: 50 }, seeded(7));
    expect(ex).toHaveLength(cards.length);
    expect(ex.every((e) => 'card' in e && e.card.lessonId === 'l2')).toBe(true);
  });
});
