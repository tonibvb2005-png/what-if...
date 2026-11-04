import type { Grade } from '../types';

/** Lowercase, drop punctuation/ellipses, collapse whitespace. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[.,!?¿¡;:"“”„'’…()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Remove Croatian diacritics so "cevapi" matches "ćevapi". */
export function stripDiacritics(s: string): string {
  return s
    .replace(/dž/g, 'dz')
    .replace(/đ/g, 'dj')
    .replace(/[čć]/g, 'c')
    .replace(/š/g, 's')
    .replace(/ž/g, 'z');
}

export function levenshtein(a: string, b: string): number {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

export interface CheckResult {
  grade: Grade;
  /** The accepted answer closest to the input (to show as correction). */
  expected: string;
  reason?: 'diacritics' | 'typo';
}

/**
 * Compare a typed answer against the accepted answers.
 * - exact (ignoring case/punctuation) → correct
 * - only diacritics differ (c vs č, d vs đ …) → almost
 * - one small typo in a longer word → almost
 */
export function checkAnswer(input: string, accepted: string[]): CheckResult {
  const given = normalize(input);
  const answers = accepted.map((a) => ({ raw: a, norm: normalize(a) }));
  if (!given) return { grade: 'wrong', expected: accepted[0] };

  const exact = answers.find((a) => a.norm === given);
  if (exact) return { grade: 'correct', expected: exact.raw };

  // Also accept "dj" / "d" for đ when the learner has no Croatian keyboard.
  const givenPlain = stripDiacritics(given);
  const dia = answers.find((a) => {
    const plain = stripDiacritics(a.norm);
    return plain === givenPlain || plain.replace(/dj/g, 'd') === givenPlain.replace(/dj/g, 'd');
  });
  if (dia) return { grade: 'almost', expected: dia.raw, reason: 'diacritics' };

  let best = answers[0];
  let bestDist = Infinity;
  for (const a of answers) {
    const d = levenshtein(stripDiacritics(a.norm), givenPlain);
    if (d < bestDist) {
      bestDist = d;
      best = a;
    }
  }
  if (bestDist === 1 && best.norm.length >= 5) return { grade: 'almost', expected: best.raw, reason: 'typo' };
  return { grade: 'wrong', expected: best.raw };
}
