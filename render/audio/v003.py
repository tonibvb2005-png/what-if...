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

# ---------------- music: tense cold-war score (drone + heartbeat pulse + arpeggio) ----------------
def saw(f, sec):
    t_ = np.arange(int(sec * SR)) / SR; return signal.sawtooth(2 * np.pi * f * t_)
alarm0 = WT('alarm', 3); calm1 = WT('wait', 5)
n_ = int(DUR * SR); tt_ = np.arange(n_) / SR
dr = lp(saw(55, DUR) * 0.5 + saw(55.4, DUR) * 0.5 + saw(82.4, DUR) * 0.3, 400)
lvl = np.clip(tt_ / 1.5, 0, 1) * (0.6 + 0.4 * ((tt_ > alarm0) & (tt_ < calm1)))
mus[:n_, 0] += dr * lvl * 0.12; mus[:n_, 1] += dr * lvl * 0.12
def thump():
    n = int(0.25 * SR); t_ = np.arange(n) / SR; return np.sin(2 * np.pi * np.cumsum(48 + 60 * np.exp(-t_ * 30)) / SR) * np.exp(-t_ * 14)
bpm = 72; t = 0.2
while t < DUR - 0.3:
    fast = alarm0 < t < calm1
    at(mus, t, thump(), 0.5 if fast else 0.3); at(mus, t + 0.22, thump(), 0.3 if fast else 0.18)
    t += 60 / (128 if fast else bpm)
arp = [45, 48, 52, 55, 52, 48]
t = alarm0; k = 0
while t < calm1:
    m = arp[k % 6] + 12; f = 440 * 2 ** ((m - 69) / 12)
    nn = int(0.12 * SR); tq = np.arange(nn) / SR
    at(mus, t, lp(signal.square(2 * np.pi * f * tq), 2200) * np.exp(-tq * 22), 0.07, 0.3 if k % 2 else -0.3)
    t += 60 / 128 / 2; k += 1
whatif0, whatif1 = S['whatif'], S['name']
a_, b_ = int(whatif0 * SR), int(whatif1 * SR)
mus[a_:b_] = lp(mus[a_:b_].T, 500).T * 1.2
def tape_rewind(sec=0.45):
    n = int(sec * SR); t_ = np.arange(n) / SR
    warble = np.sin(2 * np.pi * np.cumsum(800 + 600 * np.sin(2 * np.pi * 18 * t_)) / SR)
    return (bp(noise(sec), 1500, 6000) * 0.5 + warble * 0.25) * env(n, 0.01) * np.linspace(1, 0.3, n)
mus[int(S['whatif'] * SR):int((S['whatif'] + 0.45) * SR)] *= 0.2
mus[int(S['name'] * SR):int((S['name'] + 0.4) * SR)] *= 0.2
e0 = int(S['end'] * SR); mus[e0:] *= 0.5

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

def siren(sec):
    n = int(sec * SR); t_ = np.arange(n) / SR; f = np.where((t_ * 1.6) % 1 < 0.5, 880, 660)
    return lp(signal.square(2 * np.pi * np.cumsum(f) / SR) * 0.5 + np.sin(2 * np.pi * np.cumsum(f) / SR), 3000) * env(n, 0.02)
def beep(f=1200, sec=0.09): n = int(sec * SR); t_ = np.arange(n) / SR; return np.sin(2 * np.pi * f * t_) * env(n, 0.002)
def tick(): return bp(noise(0.03), 2000, 6000) * env(int(0.03 * SR), 0.001, 0.008)
def rumble(sec): return lp(noise(sec), 120) * 3 * env(int(sec * SR), 0.3)
def ring(): n = int(0.4 * SR); t_ = np.arange(n) / SR; return (np.sin(2 * np.pi * 1100 * t_) + np.sin(2 * np.pi * 1300 * t_)) * (np.sin(2 * np.pi * 25 * t_) > 0) * 0.5
al0, al1 = WT('alarm', 3), WT('wait', 5)
at(fx, 0, siren(S['place'] - 0.1), 0.08)                              # hook flash-forward
at(fx, S['place'], lp(noise(WT('place', 3) - S['place']), 400) * 0.5, 0.08)   # night wind
for k in range(6): at(fx, S['place'] + 0.3 + k * 0.4, beep(2600, 0.04), 0.04)   # crickets-ish
for k in range(int((S['alarm'] - WT('place', 3)) / 0.7)): at(fx, WT('place', 3) + k * 0.7, beep(1000 + (k % 3) * 200), 0.05, 0.4)
at(fx, al0, siren(al1 - al0), 0.13)
for w in [9, 11, 13]: at(fx, WT('alarm', w), beep(1500, 0.25) + 0, 0.25)
at(fx, al0, thud(), 0.4)
for sid, k in [('rules', 0), ('stare', 0), ('wait', 0)]: at(fx, WT(sid, k) - 0.12, whoosh(0.32), 0.3)
at(fx, WT('call', 1), blip(300, 200, 0.12), 0.25)
tt = WT('wait', 2)
while tt < al1: at(fx, tt, tick(), 0.35); tt += 0.5
at(fx, al1, ding(1046.5, 1.4), 0.2)
at(fx, S['cause'], bp(noise(S['whatif'] - S['cause']), 200, 1500) * 0.3, 0.08)
at(fx, WT('cause', 4), glitter(1.2), 0.2)
at(fx, S['whatif'], tape_rewind(0.45), 0.6)
for k in range(10): at(fx, S['whatif'] + 0.6 + (k % 5) * 0.25 + (k >= 5) * 0.5, rumble(2.4), 0.25, float(rng.uniform(-0.6, 0.6)))
at(fx, S['name'] - 0.7, rumble(1.0) * 1.5, 0.5)
at(fx, S['name'], tape_rewind(0.4), 0.5)
at(fx, WT('end', 7), thud(), 0.7); at(fx, WT('end', 7), bp(noise(0.3), 800, 5000) * env(int(0.3 * SR), 0.002, 0.08), 0.4)
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
