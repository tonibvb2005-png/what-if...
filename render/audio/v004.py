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

# ---------------- music: deep submarine score (low drone, sonar ping, heartbeat) ----------------
def saw(f, sec):
    t_ = np.arange(int(sec * SR)) / SR; return signal.sawtooth(2 * np.pi * f * t_)
n_ = int(DUR * SR); tt_ = np.arange(n_) / SR
b0 = WT('bombs', 1); calm = S['surface']
dr = lp(saw(41.2, DUR) * 0.5 + saw(41.5, DUR) * 0.5 + saw(61.7, DUR) * 0.3, 260)
lvl = np.clip(tt_ / 2.0, 0, 1) * (0.7 + 0.5 * ((tt_ > b0) & (tt_ < calm)))
mus[:n_, 0] += dr * lvl * 0.14; mus[:n_, 1] += dr * lvl * 0.14
def thump():
    n = int(0.25 * SR); t_ = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(46 + 50 * np.exp(-t_ * 30)) / SR) * np.exp(-t_ * 14)
t = 0.3
while t < DUR - 0.3:
    fast = b0 < t < calm
    at(mus, t, thump(), 0.45 if fast else 0.28); at(mus, t + 0.24, thump(), 0.26 if fast else 0.16)
    t += 60 / (120 if fast else 66)
# sustained warm chord when surfacing
cs = int(calm * SR); ce = int(S['whatif'] * SR); tq = np.arange(ce - cs) / SR
pad = sum(np.sin(2 * np.pi * f * tq) for f in [110, 164.8, 220, 277.2]) * np.clip(tq / 1.5, 0, 1) * 0.04
mus[cs:ce, 0] += pad; mus[cs:ce, 1] += pad
whatif0, whatif1 = S['whatif'], S['name']
a_, b_ = int(whatif0 * SR), int(whatif1 * SR)
mus[a_:b_] = lp(mus[a_:b_].T, 400).T * 1.2
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

def ping():
    n = int(2.2 * SR); t_ = np.arange(n) / SR; x = np.sin(2 * np.pi * 1180 * t_) * np.exp(-t_ * 3.5)
    out = x.copy(); dl = int(0.35 * SR); out[dl:] += x[:-dl] * 0.4; return out
def blast(): n = int(2.0 * SR); t_ = np.arange(n) / SR; return (lp(noise(2.0), 150) * 4 + lp(noise(2.0), 900) * np.exp(-t_ * 8)) * np.exp(-t_ * 1.8) * np.clip(t_ / 0.01, 0, 1)
def creak(sec=1.2): n = int(sec * SR); t_ = np.arange(n) / SR; f = 90 + 40 * np.sin(2 * np.pi * 0.8 * t_); return bp(signal.sawtooth(2 * np.pi * np.cumsum(f) / SR), 200, 900) * np.sin(np.pi * t_ / sec)
def drip(): return blip(1800, 900, 0.06)
def rstatic(sec): return bp(noise(sec), 1500, 6000) * 0.6
def splashbig(sec=2.5): n = int(sec * SR); t_ = np.arange(n) / SR; return bp(noise(sec), 300, 4000) * np.exp(-t_ * 1.2) * np.clip(t_ / 0.2, 0, 1)
BL = [WT('bombs', 1), WT('bombs', 1) + 0.75, WT('bombs', 4), WT('bombs', 6) + 0.1, WT('cut', 4), WT('captain', 2)]
for k in range(5): at(fx, 0.5 + k * 4.2, ping(), 0.12)
at(fx, 0, creak(1.4), 0.12, -0.4)
for k in range(10): at(fx, 0.8 + k * 1.3, drip(), 0.05, float(rng.uniform(-0.7, 0.7)))
at(fx, S['place'], lp(noise(S['heat'] - S['place']), 300) * 0.6, 0.1)
at(fx, S['heat'], creak(1.6), 0.12, 0.4)
for b in BL: at(fx, b, blast(), 0.65, float(rng.uniform(-0.3, 0.3))); at(fx, b + 0.15, creak(1.0), 0.15)
for sid, k in [('bombs', 0), ('cut', 0), ('captain', 0), ('rule', 0)]: at(fx, WT(sid, k) - 0.12, whoosh(0.32), 0.3)
at(fx, S['cut'], rstatic(WT('cut', 4) - S['cut']), 0.12)
at(fx, WT('captain', 6), lp(noise(1.2), 400) * env(int(1.2 * SR), 0.1), 0.3)   # torpedo slides into tube
at(fx, WT('captain', 6) + 1.1, thud(), 0.4)
at(fx, WT('rule', 7), ding(1318.5, 0.7), 0.18); at(fx, WT('rule', 9), ding(1318.5, 0.7), 0.18)
at(fx, WT('him', 2), thud() * 0.6 + 0, 0.35)
at(fx, S['surface'] - 0.3, splashbig(3.0), 0.45)
at(fx, S['surface'], bp(noise(S['whatif'] - S['surface']), 200, 1500) * 0.5, 0.1)   # waves
at(fx, S['whatif'], tape_rewind(0.45), 0.6)
at(fx, WT('whatif', 6), blast() * 1.5, 0.9); at(fx, WT('whatif', 8), splashbig(3.5), 0.6)
at(fx, S['name'], tape_rewind(0.4), 0.5)
at(fx, S['name'] + 0.4, bp(noise(DUR - S['name'] - 0.4), 200, 1500) * 0.5, 0.08)
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
