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

# ---------------- music: medieval tavern (lute pluck, recorder, frame drum) ----------------
BPM = 118; beat = 60 / BPM
N_ = lambda m: 440 * 2 ** ((m - 69) / 12)
def lute(f, sec=0.5):
    n = int(sec * SR); t_ = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * h * t_) / h ** 1.3 * np.exp(-t_ * (5 + h * 2)) for h in range(1, 7))
    return lp(x, 3500) * np.clip(np.arange(n) / (0.002 * SR), 0, 1)
def recorder(f, sec):
    n = int(sec * SR); t_ = np.arange(n) / SR; vib = 1 + 0.006 * np.sin(2 * np.pi * 5 * t_) * np.clip(t_ / 0.2, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR
    x = np.sin(ph) + 0.15 * np.sin(2 * ph) + 0.05 * hp(noise(sec), 2000)
    return x * env(n, 0.04) * np.clip((n - np.arange(n)) / (0.06 * SR), 0, 1)
def drum(low=True):
    n = int(0.3 * SR); t_ = np.arange(n) / SR
    return (np.sin(2 * np.pi * np.cumsum((90 if low else 160) + 60 * np.exp(-t_ * 30)) / SR) * 0.8 + bp(noise(0.3), 200, 900) * 0.3) * np.exp(-t_ * (14 if low else 22))
prog = [[50, 57, 62], [48, 55, 60], [50, 57, 62], [45, 52, 57]]  # Dm C Dm Am
arp = [0, 1, 2, 1]
mel = [(74, 1), (76, 0.5), (77, 0.5), (79, 1), (77, 1), (76, 1), (74, 1), (72, 2), (74, 1), (69, 1), (72, 1), (74, 3)]
dark = [(S['treasurer'], S['cancel'] + 0.5), (S['fact'], S['end'])]
isdark = lambda t: any(a <= t < b for a, b in dark)
t = 0.15; k = 0
while t < DUR - 0.4:
    ch = prog[(k // 8) % 4]; g = 0.45 if isdark(t) else 1.0
    at(mus, t, lute(N_(ch[arp[k % 4]]), 0.5), 0.12 * g, 0.25)
    if k % 2 == 0: at(mus, t, lute(N_(ch[0] - 12), 0.8), 0.14 * g, -0.1)
    if k % 4 == 0: at(mus, t, drum(True), 0.3 * g)
    elif k % 4 == 3: at(mus, t, drum(False), 0.15 * g)
    t += beat / 2; k += 1
t = 1.2; i = 0
while t < DUR - 2:
    m, d = mel[i % len(mel)]
    if not isdark(t): at(mus, t, recorder(N_(m), d * beat * 0.92), 0.06, -0.2)
    t += d * beat; i += 1
# tension drone for the treasurer + flood
for a, b in [(S['treasurer'], S['cancel']), (S['flood'], S['fact'])]:
    a0, a1 = int(a * SR), int(b * SR); tq = np.arange(a1 - a0) / SR
    dr = lp(signal.sawtooth(2 * np.pi * 73.4 * tq) + signal.sawtooth(2 * np.pi * 77.8 * tq), 400) * np.clip(tq / 0.6, 0, 1) * 0.05
    mus[a0:a1, 0] += dr; mus[a0:a1, 1] += dr
a_, b_ = int(S['fact'] * SR), int(S['end'] * SR)
mus[a_:b_] = lp(mus[a_:b_].T, 700).T

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
def squeak():
    sec = 0.09 + rng.uniform(0, 0.08); n = int(sec * SR); f = rng.uniform(2600, 4200) * (1 + 0.25 * np.sin(np.linspace(0, np.pi, n)))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * np.arange(n) / n) ** 2
def squeaks(t0, t1, rate, gain):
    tt = t0
    while tt < t1: at(fx, tt, squeak(), gain * rng.uniform(0.5, 1), float(rng.uniform(-0.8, 0.8))); tt += rng.exponential(1 / rate)
def scurry_snd(sec): n = int(sec * SR); x = bp(noise(sec), 2500, 8000) * (0.5 + 0.5 * (np.sin(2 * np.pi * 23 * np.arange(n) / SR) > 0)); return x * np.clip(np.arange(n) / (0.2 * SR), 0, 1) * np.clip((n - np.arange(n)) / (0.3 * SR), 0, 1)
def fanfare():
    out = np.zeros(int(1.4 * SR))
    for j, (m, d) in enumerate([(62, 0.15), (62, 0.15), (69, 0.6)]):
        x = bp(signal.sawtooth(2 * np.pi * N_(m) * np.arange(int(d * SR)) / SR), 300, 3000) * env(int(d * SR), 0.02)
        i = int([0, 0.18, 0.36][j] * SR); out[i:i + len(x)] += x
    return out
def crackle(sec): n = int(sec * SR); x = np.zeros(n); idx = rng.integers(0, n, int(sec * 60)); x[idx] = rng.uniform(-1, 1, len(idx)); return hp(x, 1500) + bp(noise(sec), 300, 3000) * 0.04

at(fx, 0, wind(DUR) * 0.4, 0.04)
at(fx, 0.5, clink(), 0.35); at(fx, 0.55, ding(2637, 0.8), 0.12)
squeaks(0.8, 2.6, 3, 0.10)
at(fx, S['place'], whoosh(1.4, True), 0.22)
squeaks(S['place'], S['decree'], 6, 0.08)
at(fx, WT('place', 7) - 0.3, clank(), 0.25); at(fx, WT('place', 7) - 0.15, clank(), 0.2)
at(fx, S['decree'] - 0.12, whoosh(0.32), 0.35); at(fx, S['decree'] + 0.1, fanfare(), 0.25)
at(fx, WT('decree', 11), ding(1568, 1.0), 0.25)
at(fx, WT('decree', 12), cheer(1.6), 0.25)
at(fx, S['hunt'] - 0.12, whoosh(0.32), 0.35)
at(fx, S['hunt'], scurry_snd(WT('hunt', 7) - S['hunt']), 0.18); squeaks(S['hunt'], WT('hunt', 7), 10, 0.12)
tt = S['hunt'] + 0.1
while tt < WT('hunt', 7): at(fx, tt, whoosh(0.18), 0.12, float(rng.uniform(-0.6, 0.6))); tt += 0.28
tt = WT('hunt', 7)
while tt < S['weird']: at(fx, tt, clink(), 0.22, float(rng.uniform(-0.7, 0.7))); tt += 0.07
at(fx, S['weird'] - 0.12, whoosh(0.32), 0.35)
for k in range(8): at(fx, S['weird'] + 0.2 + k * 0.35, step(), 0.1)
at(fx, WT('weird', 8), whoosh(0.4), 0.25); squeaks(WT('weird', 8), S['laugh'], 5, 0.09)
tt = S['cheese']
while tt < S['laugh']: at(fx, tt, blip(300, 160, 0.12), 0.18); tt += 0.4
at(fx, S['laugh'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('laugh', 2), laughs(2.2), 0.32)
at(fx, S['treasurer'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('treasurer', 4), hiss(1.5), 0.22); at(fx, WT('treasurer', 5), thud(), 0.3)
at(fx, WT('treasurer', 10) - 0.1, clank(), 0.3); at(fx, WT('treasurer', 10), clank(), 0.25); squeaks(WT('treasurer', 10), S['cancel'], 12, 0.1)
at(fx, S['cancel'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('cancel', 4), boom_drum(), 0.55); at(fx, WT('cancel', 4), thud(), 0.5)
at(fx, WT('shrug', 3), blip(420, 760, 0.1), 0.3)
at(fx, WT('shrug', 5), creak(0.9), 0.35); squeaks(WT('shrug', 5), S['flood'], 18, 0.12); at(fx, WT('shrug', 5) + 0.2, scurry_snd(S['flood'] - WT('shrug', 5)), 0.25)
at(fx, S['flood'] - 0.12, whoosh(0.32), 0.35); at(fx, S['flood'], scurry_snd(S['fact'] - S['flood']), 0.4); squeaks(S['flood'], S['fact'], 30, 0.14)
at(fx, WT('flood', 3) - 0.2, clank(), 0.3); at(fx, WT('flood', 3) - 0.05, clank(), 0.25)
at(fx, S['fact'], crackle(S['end'] - S['fact']), 0.3); at(fx, S['fact'] + 0.1, whoosh(0.5, False), 0.2)
at(fx, WT('fact', 5), ding(1318.5, 0.9), 0.2)
squeaks(S['end'], WT('end', 6), 8, 0.09)
at(fx, WT('end', 6), whoosh(0.3), 0.25)
at(fx, TL['speechEnd'] + 0.2, clink(), 0.3)
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
