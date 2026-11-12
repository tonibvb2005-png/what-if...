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

# ---------------- music: music-hall piano + oompah tuba ----------------
BPM = 124; beat = 60 / BPM
N_ = lambda m: 440 * 2 ** ((m - 69) / 12)
def piano(f, sec=0.5):
    n = int(sec * SR); t_ = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * h * (1 + 0.0007 * h) * t_) / h ** 1.6 * np.exp(-t_ * (3 + h * 1.5)) for h in range(1, 6))
    return x * np.clip(np.arange(n) / (0.002 * SR), 0, 1)
def tuba(f, sec=0.35): n = int(sec * SR); t_ = np.arange(n) / SR; return lp(signal.sawtooth(2 * np.pi * f * t_) + np.sin(2 * np.pi * f * t_), 500) * env(n, 0.02) * np.exp(-t_ * 4)
def bell(f, sec=0.4):
    n = int(sec * SR); t_ = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t_) + 0.3 * np.sin(2 * np.pi * f * 3.01 * t_) * np.exp(-t_ * 12)) * np.exp(-t_ * 7)
prog = [[60, 64, 67], [65, 69, 72], [67, 71, 74], [60, 64, 67]]
mel = [(72, 0.5), (74, 0.5), (76, 0.5), (79, 0.5), (81, 1), (79, 0.5), (76, 0.5), (74, 1), (72, 0.5), (76, 0.5), (79, 1.5), (77, 0.5), (76, 2)]
dark = [(S['whatif'], S['fact'])]
isdark = lambda t: any(a <= t < b for a, b in dark)
calm = S['ping']  # quiet music-box intro before the pinging starts
t = 0.1; k = 0
while t < DUR - 0.3:
    ch = prog[(k // 4) % 4]; g = 0.4 if isdark(t) else (0.55 if t < calm else 1.0)
    if k % 2 == 0: at(mus, t, tuba(N_(ch[0] - 24 + (7 if k % 4 == 2 else 0))), 0.22 * g)
    else: at(mus, t, sum(piano(N_(m), 0.3) for m in ch), 0.05 * g, 0.2)
    t += beat; k += 1
t = 0.4; i = 0
while t < DUR - 1.5:
    m, d = mel[i % len(mel)]
    if not isdark(t): at(mus, t, piano(N_(m), d * beat * 1.2) if t >= calm else bell(N_(m + 12), 0.5), 0.09 if t >= calm else 0.05, -0.15)
    t += d * beat; i += 1
a_, b_ = int(S['whatif'] * SR), int(S['fact'] * SR)
mus[a_:b_] = lp(mus[a_:b_].T, 500).T * 1.2
def tape_rewind(sec=0.45):
    n = int(sec * SR); t_ = np.arange(n) / SR
    warble = np.sin(2 * np.pi * np.cumsum(800 + 600 * np.sin(2 * np.pi * 18 * t_)) / SR)
    return (bp(noise(sec), 1500, 6000) * 0.5 + warble * 0.25) * env(n, 0.01) * np.linspace(1, 0.3, n)
mus[int(S['whatif'] * SR):int((S['whatif'] + 0.45) * SR)] *= 0.2
mus[int(S['fact'] * SR):int((S['fact'] + 0.4) * SR)] *= 0.2

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
def puff(): n = int(0.22 * SR); t_ = np.arange(n) / SR; return bp(noise(0.22), 300, 2500) * np.exp(-t_ * 18) + np.sin(2 * np.pi * np.cumsum(180 - 100 * t_ / 0.22) / SR) * np.exp(-t_ * 25) * 0.4
def ping(): n = int(0.9 * SR); t_ = np.arange(n) / SR; return (np.sin(2 * np.pi * 3520 * t_) + 0.6 * np.sin(2 * np.pi * 5274 * t_) * np.exp(-t_ * 6)) * np.exp(-t_ * 5) + bp(noise(0.9), 4000, 12000) * np.exp(-t_ * 60) * 0.5
def bird():
    out = np.zeros(int(0.5 * SR)); 
    for j in range(3):
        n = int(0.08 * SR); t_ = np.arange(n) / SR; f = 3000 + 1500 * np.sin(np.pi * t_ / 0.08) + rng.uniform(-400, 400)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t_ / 0.08); i = int(j * 0.12 * SR); out[i:i + n] += x
    return out
def boing(sec=0.6): n = int(sec * SR); t_ = np.arange(n) / SR; f = 180 + 120 * np.sin(2 * np.pi * 9 * t_) * np.exp(-t_ * 4); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t_ * 5)
def steam_whistle(sec=1.6): n = int(sec * SR); t_ = np.arange(n) / SR; x = sum(np.sin(2 * np.pi * f * t_) for f in [523, 659, 784]) / 3 + bp(noise(sec), 1500, 5000) * 0.2; return x * env(n, 0.08) * np.clip((n - np.arange(n)) / (0.3 * SR), 0, 1)
def tick(): n = int(0.04 * SR); return bp(noise(0.04), 2000, 6000) * np.exp(-np.arange(n) / SR * 120)

for tt in np.arange(0.2, S['ping'], 1.3): at(fx, tt + rng.uniform(0, 0.5), bird(), 0.12, float(rng.uniform(-0.8, 0.8)))
for s0 in [0.6, 2.0]: at(fx, s0, puff(), 0.5); at(fx, s0 + 0.5, ping(), 0.4, 0.3)
at(fx, S['place'], whoosh(1.4, True), 0.2)
for tt in np.arange(S['place'] + 0.5, WT('place', 8), 1.0): at(fx, tt, tick(), 0.25)
at(fx, WT('place', 13), boom_drum(), 0.5); at(fx, WT('place', 13), hiss(1.2), 0.2)
at(fx, S['job'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('job', 5), clink(), 0.3); at(fx, WT('job', 5) + 0.12, clink(), 0.25); at(fx, WT('job', 5) + 0.22, clink(), 0.2)
at(fx, S['walk'] - 0.12, whoosh(0.32), 0.35)
for k in range(10): at(fx, S['walk'] + 0.1 + k * 0.29, step(), 0.18)
at(fx, S['ping'] - 0.12, whoosh(0.32), 0.35)
for i in [0, 2]: at(fx, WT('ping', i), puff(), 0.6)
for i in [1, 3]: at(fx, WT('ping', i), ping(), 0.5, 0.2)
for tt in np.arange(WT('ping', 4), S['wake'], 0.33): at(fx, tt, ping(), 0.18, float(rng.uniform(-0.7, 0.7)))
at(fx, S['wake'] - 0.12, whoosh(0.32), 0.35); at(fx, S['wake'] + 0.45, ping(), 0.45); at(fx, S['wake'] + 0.5, boing(), 0.45); at(fx, S['wake'] + 0.55, scream_short() if 'scream_short' in dir() else blip(400, 1200, 0.25), 0.25)
at(fx, S['laugh'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('laugh', 2), laughs(2.2), 0.32)
at(fx, S['angry'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('angry', 4), hiss(1.4), 0.25); at(fx, WT('angry', 4), thud(), 0.35)
at(fx, WT('shrug', 2), blip(420, 760, 0.1), 0.3); at(fx, WT('shrug', 4), clink(), 0.2); at(fx, WT('shrug', 4) + 0.1, clink(), 0.2)
at(fx, S['payoff'], whoosh(1.0, True), 0.2)
for k in range(8): at(fx, S['payoff'] + 0.2 + k * 0.22, blip(600 + k * 80, 900 + k * 80, 0.08), 0.12)
for k in range(14): at(fx, WT('payoff', 4) + k * 0.25, step(), 0.15, float(rng.uniform(-0.5, 0.5)))
at(fx, WT('payoff', 10), steam_whistle(1.6), 0.35); at(fx, WT('payoff', 10), ding(1318.5, 1.2), 0.2)
at(fx, S['whatif'], tape_rewind(0.45), 0.6)
for tt in np.arange(S['whatif'] + 0.6, S['fact'], 0.5): at(fx, tt, tick(), 0.3)
at(fx, WT('whatif', 6), boom_drum(), 0.45)
at(fx, S['fact'], tape_rewind(0.4), 0.5); at(fx, S['fact'] + 0.2, ding(1568, 1.0), 0.25)
at(fx, S['end'], puff(), 0.3); at(fx, S['end'] + 0.5, ping(), 0.25)
at(fx, TL['speechEnd'] + 0.15, ding(2637, 1.0), 0.22); at(fx, TL['speechEnd'] + 0.2, ding(3520, 1.0), 0.13)

mix = mus * 0.55 + fx * 0.9
# music ducks under narration a bit (voice gets added later)
mix = mix[: int(DUR * SR)]
fade = int(0.3 * SR); mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
peak = np.max(np.abs(mix)); mix = mix / peak * 0.5
out = (np.clip(mix, -1, 1) * 32767).astype(np.int16)
with wave.open(sys.argv[2] if len(sys.argv) > 2 else 'out/sfx_music.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok', DUR)
