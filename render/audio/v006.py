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

# ---------------- music: western (strummed guitar, walking bass, harmonica) ----------------
BPM = 112; beat = 60 / BPM
def strum(freqs, sec=0.6):
    n = int(sec * SR); t_ = np.arange(n) / SR; out = np.zeros(n)
    for j, f in enumerate(freqs):
        d = int(j * 0.012 * SR); x = (signal.sawtooth(2 * np.pi * f * t_) * 0.5 + np.sin(2 * np.pi * f * t_)) * np.exp(-t_ * 6)
        out[d:] += x[:n - d]
    return lp(out, 2600) * np.clip(np.arange(n) / (0.003 * SR), 0, 1)
def bassn(f, sec=0.35): n = int(sec * SR); t_ = np.arange(n) / SR; return np.sin(2 * np.pi * f * t_) * np.exp(-t_ * 7)
def harp(f, sec):
    n = int(sec * SR); t_ = np.arange(n) / SR; vib = 1 + 0.01 * np.sin(2 * np.pi * 5.5 * t_)
    x = signal.square(2 * np.pi * np.cumsum(f * vib) / SR, 0.3) + 0.5 * signal.sawtooth(2 * np.pi * np.cumsum(f * vib * 2) / SR)
    return bp(x, 600, 3500) * env(n, 0.06) * np.clip((n - np.arange(n)) / (0.08 * SR), 0, 1)
N_ = lambda m: 440 * 2 ** ((m - 69) / 12)
chords = [[45, 52, 57, 61, 64], [50, 57, 62, 66], [52, 59, 64, 68], [45, 52, 57, 61, 64]]
basses = [45, 52, 50, 57, 52, 59, 45, 52]
hmel = [(69, 1), (72, 0.5), (74, 0.5), (76, 2), (74, 1), (72, 1), (69, 2), (67, 1), (69, 3)]
whatif0, whatif1 = S['whatif'], S['end']; tense0, tense1 = S['test'], WT('hold', 8)
t = 0.3; k = 0
while t < DUR - 0.5:
    dark = whatif0 <= t < whatif1; tense = tense0 <= t < tense1; g = 0.35 if dark else 1.0
    if not tense or k % 2 == 0: at(mus, t, strum([N_(m) for m in chords[(k // 4) % 4]], 0.5), 0.05 * g, 0.2)
    at(mus, t, bassn(N_(basses[k % 8] - 12)), 0.3 * g)
    t += beat; k += 1
t = 1.0; i = 0
while t < DUR - 2:
    m, d = hmel[i % len(hmel)]
    if not (whatif0 <= t < whatif1) and not (tense0 <= t < tense1): at(mus, t, harp(N_(m), d * beat * 0.95), 0.05, -0.2)
    t += d * beat; i += 1
# tension: ticking + low drone during the horse test
a0, a1 = int(tense0 * SR), int(tense1 * SR); tq = np.arange(a1 - a0) / SR
dr = lp(signal.sawtooth(2 * np.pi * 55 * tq), 300) * np.clip(tq / 1.0, 0, 1) * 0.08
mus[a0:a1, 0] += dr; mus[a0:a1, 1] += dr
a_, b_ = int(whatif0 * SR), int(whatif1 * SR)
mus[a_:b_] = lp(mus[a_:b_].T, 500).T * 1.2
def tape_rewind(sec=0.45):
    n = int(sec * SR); t_ = np.arange(n) / SR
    warble = np.sin(2 * np.pi * np.cumsum(800 + 600 * np.sin(2 * np.pi * 18 * t_)) / SR)
    return (bp(noise(sec), 1500, 6000) * 0.5 + warble * 0.25) * env(n, 0.01) * np.linspace(1, 0.3, n)
mus[int(S['whatif'] * SR):int((S['whatif'] + 0.45) * SR)] *= 0.2
mus[int(S['end'] * SR):int((S['end'] + 0.4) * SR)] *= 0.2

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

def clank(): n = int(0.18 * SR); t_ = np.arange(n) / SR; return (np.sin(2 * np.pi * 1850 * t_) * 0.6 + np.sin(2 * np.pi * 2730 * t_) * 0.4 + bp(noise(0.18), 2000, 8000) * 0.5) * np.exp(-t_ * 30)
def clink(): n = int(0.12 * SR); t_ = np.arange(n) / SR; return (np.sin(2 * np.pi * 3200 * t_) + np.sin(2 * np.pi * 4700 * t_) * 0.5) * np.exp(-t_ * 40)
def rip(): n = int(0.45 * SR); t_ = np.arange(n) / SR; return bp(noise(0.45), 1500, 7000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 60 * t_))) * env(n, 0.005) * np.exp(-t_ * 4)
def whinny(): n = int(0.9 * SR); t_ = np.arange(n) / SR; f = 700 + 300 * np.sin(2 * np.pi * 9 * t_) * np.exp(-t_ * 2); return bp(signal.sawtooth(2 * np.pi * np.cumsum(f) / SR), 500, 3000) * np.sin(np.pi * t_ / 0.9) * 0.5
def creak(sec): n = int(sec * SR); t_ = np.arange(n) / SR; f = 110 + 30 * np.sin(2 * np.pi * 1.3 * t_); return bp(signal.sawtooth(2 * np.pi * np.cumsum(f) / SR), 200, 1200) * env(n, 0.2) * 0.6
def cheer(sec): n = int(sec * SR); return bp(noise(sec), 400, 3000) * np.clip(np.arange(n) / (0.15 * SR), 0, 1) * np.clip((n - np.arange(n)) / (0.6 * SR), 0, 1)
def laughs(sec): n = int(sec * SR); t_ = np.arange(n) / SR; car = signal.sawtooth(2 * np.pi * 190 * t_) * (np.sin(2 * np.pi * 6 * t_) > 0.2); return bp(car, 500, 2000) * 0.4 * env(n, 0.05)
def wind(sec): n = int(sec * SR); return lp(noise(sec), 500) * (0.6 + 0.4 * np.sin(2 * np.pi * np.arange(n) / SR * 0.25))
at(fx, 0, wind(DUR), 0.06)
tt = 0.2
while tt < S['place'] - 0.2: at(fx, tt, clank(), 0.3, 0.2); tt += 0.5
at(fx, S['place'], whoosh(1.2, True), 0.2)
at(fx, S['rip'] - 0.12, whoosh(0.32), 0.35)
at(fx, WT('rip', 4), rip(), 0.6)
for k in range(14): at(fx, WT('rip', 4) + 0.25 + k * 0.08, clink(), 0.2, float(rng.uniform(-0.6, 0.6)))
at(fx, S['idea'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('idea', 3), clink(), 0.2)
tt = WT('idea', 12)
while tt < S['laugh']: at(fx, tt, clank(), 0.3, 0.2); tt += 1 / 3
at(fx, S['laugh'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('laugh', 2), laughs(1.8), 0.3)
at(fx, S['rival'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('rival', 4), hiss(1.4), 0.22); at(fx, WT('rival', 5), thud(), 0.3)
at(fx, WT('shrug', 1), blip(420, 760, 0.1), 0.3)
tt = WT('shrug', 2)
while tt < S['test']: at(fx, tt, clank(), 0.3, 0.2); tt += 2 / 7
at(fx, WT('test', 4), whinny(), 0.35, -0.5); at(fx, WT('test', 9), whinny(), 0.3, 0.5)
at(fx, WT('test', 9), creak(S['hold'] - WT('test', 9) + 1.5), 0.25)
at(fx, S['hold'], creak(WT('hold', 6) - S['hold']), 0.35)
for k in range(6): at(fx, S['hold'] + k * 0.3, step() if 'step' in dir() else thud(), 0.12)
at(fx, WT('hold', 8), cheer(2.5), 0.45); at(fx, WT('hold', 8), ding(1568, 1.2), 0.2)
at(fx, S['line'] - 0.12, whoosh(0.32), 0.35); at(fx, S['line'], cheer(1.5) * 0.4, 0.2)
at(fx, WT('levi', 8), ding(1318.5, 1.0), 0.2)
at(fx, S['whatif'], tape_rewind(0.45), 0.6)
at(fx, WT('whatif', 2), rip(), 0.7); at(fx, WT('whatif', 2) + 0.3, thud(), 0.4); at(fx, WT('whatif', 5), boing() if 'boing' in dir() else blip(220, 700, 0.35), 0.3)
at(fx, S['end'], tape_rewind(0.4), 0.5)
at(fx, WT('end', 5), clink(), 0.3); at(fx, WT('end', 6), clink(), 0.3)
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
