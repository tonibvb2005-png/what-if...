import { describe, expect, it } from 'vitest';
import { newReview, schedule } from './srs';

const DAY = '2026-11-04';

describe('schedule', () => {
  it('grows the interval on correct answers', () => {
    let r = newReview('a', DAY);
    r = schedule(r, 'correct', DAY);
    expect(r).toMatchObject({ stage: 2, intervalDays: 1, due: '2026-11-05' });
    r = schedule(r, 'correct', r.due);
    expect(r).toMatchObject({ stage: 3, intervalDays: 3, due: '2026-11-08' });
    r = schedule(r, 'correct', r.due);
    expect(r.intervalDays).toBe(Math.round(3 * 2.6));
    expect(r.stage).toBe(4);
  });

  it('resets to today and lowers ease on wrong answers', () => {
    let r = { ...newReview('a', DAY), stage: 4, intervalDays: 10, ease: 2.5 };
    r = schedule(r, 'wrong', DAY);
    expect(r).toMatchObject({ stage: 3, intervalDays: 0, due: DAY, lapses: 1, ease: 2.3 });
  });

  it('never lets ease drop below 1.3 or stage below 1', () => {
    let r = newReview('a', DAY);
    for (let i = 0; i < 10; i++) r = schedule(r, 'wrong', DAY);
    expect(r.ease).toBe(1.3);
    expect(r.stage).toBe(1);
  });

  it('grows less on "almost" answers', () => {
    const base = { ...newReview('a', DAY), stage: 3, intervalDays: 10 };
    expect(schedule(base, 'almost', DAY).intervalDays).toBe(12);
    expect(schedule(base, 'correct', DAY).intervalDays).toBe(25);
  });
});
