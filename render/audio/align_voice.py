"""Align a narrator recording to the script words.
Usage: python3 audio/align_voice.py voice.mp3 out/timeline.json out/voice.json
Produces [{start,end}] per script token (same order as timeline words)."""
import json, re, sys, difflib
from faster_whisper import WhisperModel

NUM = {'1900': ['nineteen', 'hundred'], '58-ton': ['fifty', 'eight', 'ton'], '172': ['hundred', 'seventy', 'two'],
       '2014,': ['twenty', 'fourteen'], 'bc.': ['bc'], '1847.': ['eighteen', 'forty', 'seven'], '312': ['three', 'hundred', 'twelve'], '1983.': ['nineteen', 'eighty', 'three'], '1962.': ['nineteen', 'sixty', 'two']}

def norm(w):
    return re.sub(r"[^a-z0-9']", '', w.lower().replace('-', ' ').split()[0] if w.strip() else '')

voice, tl_path, out = sys.argv[1:4]
words = json.load(open(tl_path))['timeline']['words']
model = WhisperModel('small.en', device='cpu', compute_type='int8')
import subprocess, numpy as np
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', voice, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
segs, _ = model.transcribe(audio, word_timestamps=True, language='en', vad_filter=False)
heard = [w for s in segs for w in s.words]
H = []
for w in heard:
    for part in re.sub(r"[^a-z0-9' ]", ' ', w.word.lower().replace('-', ' ')).split():
        H.append((part, w.start, w.end))
print('heard:', ' '.join(h[0] for h in H))

# expand script tokens into comparable sub-words
S, owner = [], []
for i, w in enumerate(words):
    key = w['disp'].lower().strip('"“”…')
    parts = NUM.get(key) or re.sub(r"[^a-z0-9' ]", ' ', key.replace('-', ' ')).split()
    for p in parts: S.append(p); owner.append(i)
sm = difflib.SequenceMatcher(a=S, b=[h[0] for h in H], autojunk=False)
times = [[None, None] for _ in words]
for a, b, n in sm.get_matching_blocks():
    for k in range(n):
        i = owner[a + k]; _, st, en = H[b + k]
        if times[i][0] is None or st < times[i][0]: times[i][0] = st
        if times[i][1] is None or en > times[i][1]: times[i][1] = en
# interpolate gaps
known = [i for i, t in enumerate(times) if t[0] is not None]
print(f'matched {len(known)}/{len(words)} tokens')
for i, t in enumerate(times):
    if t[0] is not None: continue
    prev = max([k for k in known if k < i], default=None); nxt = min([k for k in known if k > i], default=None)
    t0 = times[prev][1] if prev is not None else 0.0
    t1 = times[nxt][0] if nxt is not None else t0 + 0.4
    span = [k for k in range(prev + 1 if prev is not None else 0, nxt if nxt is not None else len(words))]
    j = span.index(i); step = (t1 - t0) / len(span)
    t[0], t[1] = t0 + j * step, t0 + (j + 1) * step
json.dump([{'w': w['disp'], 'start': round(t[0], 3), 'end': round(t[1], 3)} for w, t in zip(words, times)], open(out, 'w'), indent=1)
print('wrote', out)
