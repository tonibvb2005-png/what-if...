import json, difflib, re
ours = json.load(open('ours.json')); wh = json.load(open('words.json'))
def n(x): return re.sub(r'[^a-zäöüß0-9]', '', x.lower().replace("'", ''))
A = [n(o['sp']) for o in ours]; B = [n(w['w']) for w in wh]
sm = difflib.SequenceMatcher(None, A, B, autojunk=False)
T = [None] * len(ours)
for a, b, size in sm.get_matching_blocks():
    for k in range(size): T[a + k] = [wh[b + k]['start'], wh[b + k]['end']]
# fuzzy fill for replace blocks of equal length (e.g. Kuhglocke/Kuglocke)
for tag, i1, i2, j1, j2 in sm.get_opcodes():
    if tag == 'replace':
        # spread our tokens i1..i2 over whisper span j1..j2
        s0, e0 = wh[j1]['start'], wh[j2 - 1]['end']
        L = [max(1, len(A[i])) for i in range(i1, i2)]; tot = sum(L); c = s0
        for k, i in enumerate(range(i1, i2)):
            d = (e0 - s0) * L[k] / tot; T[i] = [round(c, 3), round(c + d, 3)]; c += d
# interpolate any remaining gaps
for i in range(len(T)):
    if T[i] is None:
        j = i
        while j < len(T) and T[j] is None: j += 1
        s0 = T[i - 1][1] if i > 0 else 0
        e0 = T[j][0] if j < len(T) else s0 + 0.4 * (j - i)
        L = [max(1, len(A[k])) for k in range(i, j)]; tot = sum(L); c = s0
        for k in range(i, j):
            d = (e0 - s0) * L[k - i] / tot; T[k] = [round(c, 3), round(c + d, 3)]; c += d
miss = [ours[i]['d'] for i in range(len(ours)) if not any(T[i] == [w['start'], w['end']] for w in wh)]
print('not exact-matched:', miss)
json.dump([{'start': t[0], 'end': t[1]} for t in T], open('times.json', 'w'))
open('vid/episodes/schweiz.times.js', 'w').write('window.WORD_TIMES=' + json.dumps([{'start': t[0], 'end': t[1]} for t in T]) + ';\n')
