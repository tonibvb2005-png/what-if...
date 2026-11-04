import { describe, expect, it } from 'vitest';
import { checkAnswer } from './answer';

describe('checkAnswer', () => {
  it('accepts exact answers ignoring case and punctuation', () => {
    expect(checkAnswer('dobar tek', ['Dobar tek!']).grade).toBe('correct');
    expect(checkAnswer('  Kako se kaže ', ['Kako se kaže …?']).grade).toBe('correct');
  });

  it('accepts alternatives', () => {
    expect(checkAnswer('sita sam', ['Sit sam.', 'Sita sam.'])).toMatchObject({ grade: 'correct', expected: 'Sita sam.' });
  });

  it('treats missing diacritics as almost correct', () => {
    expect(checkAnswer('rodak', ['rođak'])).toMatchObject({ grade: 'almost', reason: 'diacritics' });
    expect(checkAnswer('rodjak', ['rođak'])).toMatchObject({ grade: 'almost', reason: 'diacritics' });
    expect(checkAnswer('cestitati', ['čestitati'])).toMatchObject({ grade: 'almost', reason: 'diacritics' });
  });

  it('treats a single typo in a longer word as almost correct', () => {
    expect(checkAnswer('roditleji', ['roditelji']).grade).toBe('wrong');
    expect(checkAnswer('roditelj', ['roditelji'])).toMatchObject({ grade: 'almost', reason: 'typo' });
  });

  it('rejects wrong and empty answers', () => {
    expect(checkAnswer('djed', ['baka']).grade).toBe('wrong');
    expect(checkAnswer('', ['baka']).grade).toBe('wrong');
  });
});
