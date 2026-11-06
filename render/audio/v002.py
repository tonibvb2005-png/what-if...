"""Synthesize music bed + sound effects timed to out/timeline.json.
Writes out/sfx_music.wav (stereo 48 kHz). Voice is mixed later by mix.sh."""
import json, sys, wave
import numpy as np
from scipy import signal

SR = 48000
meta = json.load(open(sys.argv[1] if len(sys.argv) > 1 else 'out/timeline.json'))
TL = meta['timeline']; S = TL['S']; DUR = meta['duration']
words = TL['words']
def WT(sid, k): return [w for w in words if w['sid'] == sid][k]['start']
shots = {s['id']: s for s in meta['shots']}
N = int(DUR * SR) + SR
rng = np.random.default_rng(7)
mus = np.zeros((N, 2)); fx = np.zeros((N, 2))

def at(buf, t, x, gain=1.0, pan=0.0):
    i = int(t * SR)
    if i >= N: return
    x = x[: N - i]
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[i:i + len(x), 0] += x * gain * l * 1.41
    buf[i:i + len(x), 1] += x * gain * r * 1.41

def env(n, a=0.005, d=None):
    a_n = max(1, int(a * SR)); e = np.ones(n)
    e[:a_n] = np.linspace(0, 1, a_n)
    if d: e *= np.exp(-np.arange(n) / (d * SR))
    return e

def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype='band', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def lp(x, f, order=2):
    sos = signal.butter(order, f, btype='low', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def hp(x, f, order=2):
    sos = signal.butter(order, f, btype='high', fs=SR, output='sos'); return signal.sosfilt(sos, x)
def noise(sec): return rng.standard_normal(int(sec * SR))
def tone(f, sec, kind='sine'):
    t = np.arange(int(sec * SR)) / SR
    ph = 2 * np.pi * np.cumsum(np.broadcast_to(f, t.shape) if np.ndim(f) else np.full(t.shape, f)) / SR
    return np.sin(ph) if kind == 'sine' else signal.sawtooth(ph)

# ---------------- music: Viennese waltz (3/4) - pizzicato bass, chords, celesta melody ----------------
BPM = 168; beat = 60 / BPM
def pizz(f, sec=0.35):
    n = int(sec * SR); t_ = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t_) * 0.8 + np.sin(2 * np.pi * 2 * f * t_) * 0.25 + np.sin(2 * np.pi * 3 * f * t_) * 0.1
    return x * np.exp(-t_ * 9) * np.clip(t_ / 0.004, 0, 1)
def celesta(f, sec=0.6):
    n = int(sec * SR); t_ = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t_) + 0.35 * np.sin(2 * np.pi * 4 * f * t_) * np.exp(-t_ * 14)
    return x * np.exp(-t_ * 5) * np.clip(t_ / 0.003, 0, 1)
N_ = lambda m: 440 * 2 ** ((m - 69) / 12)
prog = [(50, [62, 66, 69]), (57, [61, 64, 67]), (57, [61, 64, 67]), (50, [62, 66, 69]), (55, [59, 62, 67]), (50, [62, 66, 69]), (57, [61, 64, 69]), (50, [62, 66, 69])]
mel = [74, 78, 81, 81, 79, 76, 73, 76, 79, 79, 78, 74, 71, 74, 78, 78, 76, 73, 76, 78, 76, 74, 74, 74]
whatif0, whatif1 = S['whatif'], S['name']
t = 0.3; bar = 0
while t < DUR - 0.5:
    root, chord = prog[bar % len(prog)]
    dark = whatif0 <= t < whatif1
    g = 0.4 if dark else 1.0
    at(mus, t, pizz(N_(root - 12)), 0.5 * g)
    for k in (1, 2):
        for m in chord: at(mus, t + k * beat, pizz(N_(m), 0.25), 0.12 * g, 0.2)
    if not dark:
        for k in range(3):
            m = mel[(bar * 3 + k) % len(mel)]
            if (bar + k) % 4 != 3: at(mus, t + k * beat, celesta(N_(m)), 0.13, -0.25)
    t += 3 * beat; bar += 1
a_, b_ = int(whatif0 * SR), int(whatif1 * SR)
mus[a_:b_] = lp(mus[a_:b_].T, 600).T * 1.3
def tape_rewind(sec=0.45):
    n = int(sec * SR); t_ = np.arange(n) / SR
    warble = np.sin(2 * np.pi * np.cumsum(800 + 600 * np.sin(2 * np.pi * 18 * t_)) / SR)
    return (bp(noise(sec), 1500, 6000) * 0.5 + warble * 0.25) * env(n, 0.01) * np.linspace(1, 0.3, n)
mus[int(S['whatif'] * SR):int((S['whatif'] + 0.45) * SR)] *= 0.2
mus[int(S['name'] * SR):int((S['name'] + 0.4) * SR)] *= 0.2

# ---------------- SFX ----------------
def pour(sec):
    n = int(sec * SR); x = bp(noise(sec), 900, 4200)
    mod = 0.6 + 0.4 * np.abs(lp(rng.standard_normal(n), 12) * 8)
    return x * np.clip(mod, 0, 1.4) * np.clip(np.arange(n) / (0.1 * SR), 0, 1) * np.clip((n - np.arange(n)) / (0.15 * SR), 0, 1)
def whoosh(sec=0.45, up=True):
    n = int(sec * SR); t_ = np.arange(n) / SR; x = noise(sec)
    out = np.zeros(n); seg = 1024
    for i in range(0, n, seg):
        u = i / n; f = 300 + (2600 if up else 1200) * (u if up else 1 - u)
        out[i:i + seg] = bp(x[i:i + seg], f * 0.6, min(f * 1.6, 20000))
    return out * np.sin(np.pi * t_ / sec) ** 2
def hiss(sec=1.2): return hp(noise(sec), 3500) * env(int(sec * SR), 0.05, 0.5)
def blip(f0=500, f1=900, sec=0.12):
    n = int(sec * SR); f = np.linspace(f0, f1, n); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.003, sec / 3)
def ding(f=1318.5, sec=1.6):
    t_ = np.arange(int(sec * SR)) / SR
    return (np.sin(2 * np.pi * f * t_) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t_) * np.exp(-t_ * 6)) * np.exp(-t_ * 2.5)
def thud(): n = int(0.5 * SR); t_ = np.arange(n) / SR; return (np.sin(2 * np.pi * np.cumsum(60 + 80 * np.exp(-t_ * 25)) / SR) + lp(noise(0.5), 300) * 0.4) * np.exp(-t_ * 10)
def boom_drum(): n = int(1.6 * SR); t_ = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(42 + 40 * np.exp(-t_ * 12)) / SR) * np.exp(-t_ * 3)
def slide(sec=1.6):
    n = int(sec * SR); x = bp(noise(sec), 400, 2500) * 0.6 + lp(noise(sec), 250) * 0.6
    return x * np.clip(np.arange(n) / (0.3 * SR), 0, 1) * np.clip((n - np.arange(n)) / (0.4 * SR), 0, 1)
def glitter(sec=1.2):
    out = np.zeros(int(sec * SR))
    for k in range(14):
        f = rng.choice([1760, 2093, 2349, 2637, 3136]) * rng.choice([1, 2])
        s = blip(f, f, 0.18) * 0.5
        i = int(rng.uniform(0, sec - 0.2) * SR); out[i:i + len(s)] += s
    return out
def wind(sec):
    n = int(sec * SR); x = lp(noise(sec), 500)
    m = 0.6 + 0.4 * np.sin(2 * np.pi * np.arange(n) / SR * 0.23)
    return x * m * np.clip(np.arange(n) / (0.6 * SR), 0, 1)

def rain(sec):
    n = int(sec * SR); x = hp(noise(sec), 1500) * 0.5 + bp(noise(sec), 300, 1200) * 0.3
    return x * np.clip(np.arange(n) / (1.0 * SR), 0, 1)
def thunder(sec=2.5):
    n = int(sec * SR); t_ = np.arange(n) / SR
    x = lp(noise(sec), 180) * 3 + lp(noise(sec), 900) * np.exp(-t_ * 6)
    return x * np.exp(-t_ * 1.4) * np.clip(t_ / 0.02, 0, 1)
def step(): n = int(0.12 * SR); t_ = np.arange(n) / SR; return (lp(noise(0.12), 400) * 1.5 + np.sin(2 * np.pi * 70 * t_)) * np.exp(-t_ * 40)
def clink(): return bp(noise(0.08), 3000, 9000) * env(int(0.08 * SR), 0.001, 0.02) + blip(2600, 2500, 0.08) * 0.4
def creak(sec=0.6):
    n = int(sec * SR); t_ = np.arange(n) / SR; f = 180 + 60 * np.sin(2 * np.pi * 3 * t_)
    return signal.sawtooth(2 * np.pi * np.cumsum(f) / SR) * bp(np.ones(n), 10, 20)[:n] * 0 + bp(signal.sawtooth(2 * np.pi * np.cumsum(f) / SR), 300, 1500) * np.sin(np.pi * t_ / sec)

def scrubbing(sec):
    n = int(sec * SR); x = bp(noise(sec), 2500, 7000); m = 0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 4.5 * np.arange(n) / SR))
    return x * m * np.clip(np.arange(n) / (0.05 * SR), 0, 1)
def splash(): return bp(noise(0.4), 600, 4000) * env(int(0.4 * SR), 0.005, 0.12)
def step(): n = int(0.1 * SR); t_ = np.arange(n) / SR; return (lp(noise(0.1), 600) * 1.4 + np.sin(2 * np.pi * 90 * t_)) * np.exp(-t_ * 45)
def chalk(sec): n = int(sec * SR); x = bp(noise(sec), 3000, 9000) * (0.6 + 0.4 * np.sin(2 * np.pi * 13 * np.arange(n) / SR)); return x * env(n, 0.02)
def murmur(sec): return bp(noise(sec), 200, 900) * 0.6
def boing(): return blip(300, 900, 0.18)
def ding2(): return ding(2093, 1.0)
at(fx, 0.0, scrubbing(S['vienna'] - 0.1), 0.18, 0.2)
at(fx, 0.2, splash(), 0.2)
at(fx, S['vienna'] - 0.1, whoosh(1.2, True), 0.22)
at(fx, S['vienna'], bp(noise(S['sick'] - S['vienna']), 300, 2500) * 0.4, 0.08)   # street ambience
for k in range(int((S['sick'] - S['vienna']) / 0.5)): at(fx, S['vienna'] + 0.2 + k * 0.5, step() * 0.6, 0.12, 0.5)   # hooves
at(fx, S['sick'], murmur(S['notice'] - S['sick']), 0.05)
at(fx, WT('sick', 7), whoosh(0.8), 0.25)
for sid, k in [('notice', 0), ('notice', 16), ('laugh', 0), ('boss', 0)]: at(fx, WT(sid, k) - 0.12, whoosh(0.32), 0.35)
tt = WT('notice', 8)
while tt < WT('notice', 16): at(fx, tt, step(), 0.25, float(rng.uniform(-0.4, 0.4))); tt += 0.28
for k in range(4): at(fx, WT('notice', 16) + 0.2 + k * 0.25, boing() * 0.5, 0.12)   # germs hop
at(fx, WT('scrub', 3), splash(), 0.3)
at(fx, WT('laugh', 2), murmur(1.2) * 1.5, 0.1)
tt = S['boss'] - 0.3
while tt < S['boss'] + 1.1: at(fx, tt, step(), 0.3); tt += 0.22
at(fx, WT('boss', 3), hiss(1.4), 0.22)
at(fx, WT('boss', 4), thud(), 0.3)
at(fx, WT('shrug', 1), blip(420, 760, 0.1), 0.3)
at(fx, WT('shrug', 2), scrubbing(S['drop'] - WT('shrug', 2)), 0.2)
at(fx, S['drop'] + 0.2, chalk(WT('drop', 10) - S['drop']), 0.12)
at(fx, WT('drop', 8), ding(1318.5, 1.0), 0.25)
at(fx, WT('drop', 13), ding2(), 0.3)
at(fx, S['whatif'], tape_rewind(0.45), 0.6)
for k in range(10): at(fx, S['whatif'] + 0.6 + k * 0.32, boing() * 0.4, 0.1, float(rng.uniform(-0.6, 0.6)))
at(fx, S['name'], tape_rewind(0.4), 0.5)
at(fx, S['today'], bp(noise(DUR - S['today']), 800, 5000) * 0.5, 0.12)   # running tap
at(fx, TL['speechEnd'] + 0.25, ding(2637, 1.0), 0.22); at(fx, TL['speechEnd'] + 0.3, ding(3520, 1.0), 0.13)

mix = mus * 0.55 + fx * 0.9
# music ducks under narration a bit (voice gets added later)
mix = mix[: int(DUR * SR)]
fade = int(0.3 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
peak = np.max(np.abs(mix)); mix = mix / peak * 0.5
out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[2] if len(sys.argv) > 2 else 'out/sfx_music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok', DUR)
