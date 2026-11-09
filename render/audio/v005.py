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

# ---------------- music: jaunty sea-shanty hornpipe (pizzicato bass, fiddle-ish lead, drum) ----------------
BPM = 132; beat = 60 / BPM
def pluckf(f, sec=0.3):
    n = int(sec * SR); t_ = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t_) + 0.4 * np.sin(4 * np.pi * f * t_)) * np.exp(-t_ * 10) * np.clip(t_ / 0.004, 0, 1)
def fiddle(f, sec=0.22):
    n = int(sec * SR); t_ = np.arange(n) / SR; vib = 1 + 0.006 * np.sin(2 * np.pi * 6 * t_)
    x = signal.sawtooth(2 * np.pi * np.cumsum(f * vib) / SR); return lp(x, 3500) * env(n, 0.02) * np.clip((n - np.arange(n)) / (0.04 * SR), 0, 1)
def drum(): n = int(0.15 * SR); t_ = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(90 + 80 * np.exp(-t_ * 40)) / SR) * np.exp(-t_ * 20)
N_ = lambda m: 440 * 2 ** ((m - 69) / 12)
bass = [38, 45, 38, 45, 43, 50, 45, 52]
mel = [74, 76, 78, 74, 81, 78, 76, 74, 76, 78, 79, 76, 78, 76, 74, 73, 74, 76, 78, 81, 83, 81, 78, 76, 74, 78, 76, 73, 74, 74, 74, 74]
whatif0, whatif1 = S['whatif'], S['end']
tense0, tense1 = S['enemy'], S['smooth']
t = 0.3; k = 0
while t < DUR - 0.4:
    dark = whatif0 <= t < whatif1; g = 0.35 if dark else 1.0
    at(mus, t, pluckf(N_(bass[(k // 2) % 8])), 0.35 * g)
    if k % 2 == 0: at(mus, t, drum(), (0.5 if tense0 <= t < tense1 else 0.3) * g)
    if not dark: at(mus, t, fiddle(N_(mel[k % len(mel)]) * (1.0 if not (tense0 <= t < tense1) else 0.94)), 0.07, 0.2)
    t += beat / 2; k += 1
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
def gull(): n = int(0.45 * SR); t_ = np.arange(n) / SR; f = 1400 + 500 * np.sin(np.pi * t_ / 0.45); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t_ / 0.45) * 0.5
def waves(sec): n = int(sec * SR); return lp(noise(sec), 700) * (0.6 + 0.4 * np.sin(2 * np.pi * np.arange(n) / SR * 0.2)) * 0.6
def cannon(): n = int(1.4 * SR); t_ = np.arange(n) / SR; return (lp(noise(1.4), 200) * 3 + bp(noise(1.4), 300, 3000) * np.exp(-t_ * 12)) * np.exp(-t_ * 3) * np.clip(t_ / 0.005, 0, 1)
def splash(): return bp(noise(0.6), 500, 5000) * env(int(0.6 * SR), 0.01, 0.18)
def chomp(): return bp(noise(0.08), 300, 1500) * env(int(0.08 * SR), 0.002, 0.03) * 1.5
def boing(): return blip(220, 700, 0.35)
def laughs(sec): n = int(sec * SR); t_ = np.arange(n) / SR; car = signal.sawtooth(2 * np.pi * 210 * t_) * (np.sin(2 * np.pi * 6 * t_) > 0.2); return bp(car, 500, 2000) * 0.4 * env(n, 0.05)
at(fx, 0, waves(DUR), 0.08)
for k in range(6): at(fx, 0.3 + k * 0.55, cannon(), 0.35, float(rng.uniform(-0.5, 0.5))); at(fx, 0.3 + k * 0.55 + 1.0, splash(), 0.3)
for k in range(8): at(fx, S['year'] + 0.3 + k * 1.7, gull(), 0.08, float(rng.uniform(-0.8, 0.8)))
at(fx, S['year'] + 0.1, whoosh(1.2, True), 0.2)
tt = S['plates'] + 0.3
while tt < WT('plates', 10): at(fx, tt, clank(), 0.22, 0.3); tt += 1 / 7 * 2
at(fx, WT('plates', 10), ding(1568, 1.2), 0.2)
at(fx, S['laugh'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('laugh', 2), laughs(1.6), 0.3)
at(fx, S['cap'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('cap', 3), hiss(1.4), 0.22); at(fx, WT('cap', 4), thud(), 0.3)
at(fx, WT('shrug', 1), blip(420, 760, 0.1), 0.3)
tt = WT('shrug', 2)
while tt < S['later']: at(fx, tt, clank(), 0.25, 0.3); tt += 2 / 7
for k in range(4): at(fx, S['later'] + 0.4 + k * 0.9, gull(), 0.1)
at(fx, WT('later', 9) - 0.3, whoosh(0.8), 0.3); at(fx, S['guests'], splash(), 0.4)
at(fx, S['guests'], bp(noise(S['slow'] - S['guests']), 150, 1200) * 0.5, 0.12)
tt = WT('guests', 3)
while tt < S['slow']: at(fx, tt, chomp(), 0.3, float(rng.uniform(-0.6, 0.6))); tt += 0.17
at(fx, WT('slow', 3), blip(500, 200, 0.6), 0.2); at(fx, WT('slow', 5), blip(400, 150, 0.8), 0.2)
at(fx, S['enemy'] - 0.12, whoosh(0.32), 0.35)
tt = WT('enemy', 2)
while tt < S['smooth']: at(fx, tt, cannon(), 0.4, float(rng.uniform(-0.6, 0.6))); at(fx, tt + 1.1, splash(), 0.3); tt += 0.55
at(fx, S['smooth'], bp(noise(S['whatif'] - S['smooth']), 150, 1200) * 0.5, 0.12)
at(fx, S['smooth'] + 0.2 + (WT('smooth', 4) + 0.3 - S['smooth'] - 0.2) * 0.5, boing(), 0.35)
at(fx, S['whatif'], tape_rewind(0.45), 0.6)
tt = S['whatif'] + 0.5
while tt < WT('whatif', 6): at(fx, tt, chomp(), 0.3); tt += 0.15
at(fx, WT('whatif', 6), thud(), 0.5); at(fx, WT('whatif', 6), bp(noise(2.5), 200, 2000) * env(int(2.5 * SR), 0.1, 1.0), 0.4)
at(fx, S['end'], tape_rewind(0.4), 0.5)
at(fx, WT('end', 7), thud(), 0.5); at(fx, WT('end', 7), clank(), 0.3)
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
