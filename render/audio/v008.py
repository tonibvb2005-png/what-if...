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

# ---------------- music: bouncy city pop (bells, bass, claps) ----------------
BPM = 128; beat = 60 / BPM
N_ = lambda m: 440 * 2 ** ((m - 69) / 12)
def bell(f, sec=0.4):
    n = int(sec * SR); t_ = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t_) + 0.3 * np.sin(2 * np.pi * f * 3.01 * t_) * np.exp(-t_ * 12)) * np.exp(-t_ * 7)
def pluckbass(f, sec=0.3): n = int(sec * SR); t_ = np.arange(n) / SR; return lp(signal.sawtooth(2 * np.pi * f * t_), 900) * np.exp(-t_ * 9)
def kick(): n = int(0.25 * SR); t_ = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(50 + 120 * np.exp(-t_ * 40)) / SR) * np.exp(-t_ * 14)
def clap(): n = int(0.15 * SR); return bp(noise(0.15), 900, 4000) * np.exp(-np.arange(n) / SR * 30)
def hat(): n = int(0.05 * SR); return hp(noise(0.05), 7000) * np.exp(-np.arange(n) / SR * 80)
prog = [[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 65]]  # Cmaj7 Am7 Fmaj7 G7
mel = [(76, 0.5), (79, 0.5), (81, 1), (79, 0.5), (76, 0.5), (74, 1), (72, 0.5), (74, 0.5), (76, 1), (79, 2)]
dark = [(S['whatif'], S['fact'])]
isdark = lambda t: any(a <= t < b for a, b in dark)
t = 0.1; k = 0
while t < DUR - 0.3:
    ch = prog[(k // 8) % 4]; g = 0.4 if isdark(t) else 1.0
    if k % 2 == 0: at(mus, t, pluckbass(N_(ch[0] - 24)), 0.22 * g)
    if k % 4 == 0: at(mus, t, kick(), 0.35 * g)
    if k % 4 == 2: at(mus, t, clap(), 0.16 * g)
    at(mus, t, hat(), 0.05 * g, 0.3)
    if k % 2 == 1: at(mus, t, bell(N_(ch[(k // 2) % 4]) * 2, 0.3), 0.05 * g, -0.3)
    t += beat / 2; k += 1
t = 0.8; i = 0
while t < DUR - 1.5:
    m, d = mel[i % len(mel)]
    if not isdark(t): at(mus, t, bell(N_(m), d * beat), 0.07, 0.15)
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
def crowd_amb(sec): n = int(sec * SR); x = bp(noise(sec), 300, 2500); return x * (0.7 + 0.3 * np.sin(2 * np.pi * 0.4 * np.arange(n) / SR))
def chime():
    out = np.zeros(int(2.2 * SR))
    for j, m in enumerate([76, 72, 67, 72, 74, 79]):
        x = bell(N_(m), 0.9); i = int(j * 0.24 * SR); out[i:i + len(x)] += x[: len(out) - i]
    return out
def whistle(sec=0.7): n = int(sec * SR); t_ = np.arange(n) / SR; f = 2800 + 120 * np.sin(2 * np.pi * 30 * t_); return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(n, 0.02) * np.clip((n - np.arange(n)) / (0.05 * SR), 0, 1)
def rumble(sec): n = int(sec * SR); t_ = np.arange(n) / SR; x = lp(noise(sec), 160) * 3 + bp(noise(sec), 400, 1200) * (0.5 + 0.5 * (np.sin(2 * np.pi * 6 * t_) > 0.6)); return x * np.clip(t_ / 0.5, 0, 1) * np.clip((sec - t_) / 0.5, 0, 1)
def doorslide(sec=0.5): n = int(sec * SR); return bp(noise(sec), 600, 3000) * np.sin(np.pi * np.arange(n) / n) + np.sin(2 * np.pi * 90 * np.arange(n) / SR) * 0.2 * np.sin(np.pi * np.arange(n) / n)
def squish(): n = int(0.3 * SR); t_ = np.arange(n) / SR; f = 300 - 200 * t_ / 0.3; return lp(signal.square(2 * np.pi * np.cumsum(f) / SR), 1200) * np.exp(-t_ * 6) * 0.6
def grunt(): n = int(0.18 * SR); t_ = np.arange(n) / SR; return bp(signal.sawtooth(2 * np.pi * np.cumsum(140 - 40 * t_ / 0.18) / SR), 200, 1400) * np.sin(np.pi * t_ / 0.18)
def bump(): return thud() * 0.7 + squish() * 0.5
def scream(sec=0.8): n = int(sec * SR); t_ = np.arange(n) / SR; f = 900 + 300 * np.sin(2 * np.pi * 7 * t_); return bp(signal.sawtooth(2 * np.pi * np.cumsum(f) / SR), 700, 3500) * env(n, 0.03) * np.clip((n - np.arange(n)) / (0.1 * SR), 0, 1) * 0.5

at(fx, 0, crowd_amb(DUR), 0.05)
for tt in np.arange(0.3, S['place'] - 0.1, 1 / 1.6): at(fx, tt + 0.25, bump(), 0.35); at(fx, tt + 0.25, grunt(), 0.2)
at(fx, S['place'], whoosh(1.4, True), 0.22)
at(fx, WT('place', 4) - 0.6, rumble(S['full'] - WT('place', 4) + 0.6), 0.5)
at(fx, S['full'] - 0.12, whoosh(0.32), 0.35); at(fx, S['full'] + 0.1, chime(), 0.18)
tt = WT('full', 4)
while tt < WT('full', 8): at(fx, tt, thud(), 0.3); at(fx, tt + 0.05, doorslide(0.25), 0.2); tt += 0.7
at(fx, WT('full', 8), clank(), 0.25); at(fx, WT('full', 8) + 0.5, clank(), 0.2)
at(fx, S['hire'] - 0.12, whoosh(0.32), 0.35)
for k in range(8): at(fx, S['hire'] + k * 0.25, step(), 0.15)
at(fx, WT('hire', 5), ding(1568, 1.0), 0.25)
at(fx, S['push'] - 0.12, whoosh(0.32), 0.35)
for i in [2, 3, 5]: at(fx, WT('push', i), bump(), 0.55); at(fx, WT('push', i), grunt(), 0.3)
for tt in np.arange(WT('push', 5), S['squish'], 1 / 2.6): at(fx, tt, squish(), 0.35)
at(fx, S['squish'] - 0.12, whoosh(0.32), 0.35); at(fx, S['squish'] + 0.1, squish(), 0.5); at(fx, S['squish'] + 0.5, squish(), 0.4)
at(fx, S['angry'] - 0.12, whoosh(0.32), 0.35); at(fx, WT('angry', 4), hiss(1.4), 0.25); at(fx, WT('angry', 4), thud(), 0.35); at(fx, WT('angry', 5), scream(0.5), 0.2)
at(fx, WT('bow', 3), blip(500, 300, 0.15), 0.3)
for tt in np.arange(WT('bow', 4), S['close'], 1 / 2): at(fx, tt, bump(), 0.45)
at(fx, S['close'] - 0.12, whoosh(0.32), 0.35); at(fx, S['close'], whistle(0.9), 0.3); at(fx, S['close'] + 0.2, doorslide(0.6), 0.4); at(fx, WT('close', 2), thud(), 0.3)
at(fx, WT('close', 3), rumble(S['whatif'] - WT('close', 3) + 0.5), 0.55); at(fx, WT('close', 3) + 0.2, whoosh(1.2, True), 0.3)
at(fx, WT('close', 6), ding(1318.5, 1.2), 0.3); at(fx, WT('close', 6), cheer(1.6), 0.3)
at(fx, S['whatif'], tape_rewind(0.45), 0.6)
for tt in np.arange(S['whatif'] + 0.6, WT('whatif', 5), 0.6): at(fx, tt, thud(), 0.2); at(fx, tt, doorslide(0.2), 0.15)
at(fx, WT('whatif', 5), boom_drum(), 0.5); at(fx, WT('whatif', 5) + 0.1, scream(0.7), 0.2)
tt = WT('whatif', 3)
while tt < S['fact']: at(fx, tt, clink(), 0.15); tt += 0.12
at(fx, S['fact'], tape_rewind(0.4), 0.5); at(fx, S['fact'] + 0.2, ding(1568, 1.0), 0.25)
at(fx, S['end'] - 0.1, chime(), 0.12)
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
