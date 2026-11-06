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

# ---------------- music: darbuka + oud-like plucks + drone ----------------
BPM = 104; beat = 60 / BPM
def doum():
    n = int(0.35 * SR); t = np.arange(n) / SR
    f = 55 + 70 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
def tek():
    return hp(noise(0.08), 2500) * env(int(0.08 * SR), 0.001, 0.018)
def ka():
    return bp(noise(0.06), 900, 3000) * env(int(0.06 * SR), 0.001, 0.02) * 0.7
def pluck(freq, sec=0.9, bright=0.5):
    n = int(sec * SR); L = int(SR / freq)
    buf = rng.uniform(-1, 1, L); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % L]
        buf[i % L] = 0.5 * (buf[i % L] + buf[(i + 1) % L]) * 0.996
    return lp(out, 2500 + 3000 * bright) * env(n, 0.002)

# D phrygian dominant
scale = [146.83, 155.56, 185.0, 196.0, 220.0, 233.08, 261.63, 293.66]
melody = [0, 2, 1, 2, 3, 2, 1, 0, 4, 3, 2, 1, 2, -1, 0, -1,
          4, 5, 4, 3, 2, 3, 2, 1, 0, 1, 2, 3, 2, 1, 0, -1]
pl_cache = {}
pattern = ['D', 't', 'k', 'D', 'D', 't', 'k', 't']  # 8 eighths per bar (maqsum-ish)
music_end = DUR
whatif0, whatif1 = S['whatif'], S['wall']
t = 0.0; step = 0
while t < music_end - 0.2:
    p = pattern[step % 8]
    dark = whatif0 <= t < whatif1
    g = 0.35 if dark else 1.0
    if p == 'D': at(mus, t, doum(), 0.55 * g)
    elif p == 't': at(mus, t, tek(), 0.22 * g, 0.3)
    else: at(mus, t, ka(), 0.18 * g, -0.3)
    m = melody[(step // 2) % len(melody)] if step % 2 == 0 else -1
    if m >= 0 and not dark and t > 0.3:
        f = scale[m] * (2 if (step // 32) % 2 else 1)
        key = round(f, 2)
        if key not in pl_cache: pl_cache[key] = pluck(f, 0.7)
        at(mus, t, pl_cache[key], 0.16, 0.25 if step % 4 else -0.25)
    t += beat / 2; step += 1
# drone
dn = int(music_end * SR); tt = np.arange(dn) / SR
drone = (np.sin(2 * np.pi * 73.42 * tt) + 0.5 * np.sin(2 * np.pi * 110.0 * tt) + 0.3 * np.sin(2 * np.pi * 146.83 * tt * 1.002))
drone = lp(drone, 600) * 0.05 * np.clip(tt / 1.5, 0, 1) * np.clip((music_end - tt) / 1.0, 0, 1)
at(mus, 0, drone)
# muffle the music in the "what if" timeline
a, b = int(whatif0 * SR), int(whatif1 * SR)
mus[a:b] = lp(mus[a:b].T, 500).T * 1.4
# tomb section: softer
# tape stop into each rewind
def tape_rewind(sec=0.45):
    n = int(sec * SR); t_ = np.arange(n) / SR
    warble = np.sin(2 * np.pi * np.cumsum(800 + 600 * np.sin(2 * np.pi * 18 * t_)) / SR)
    return (bp(noise(sec), 1500, 6000) * 0.5 + warble * 0.25) * env(n, 0.01) * np.linspace(1, 0.3, n)
mus[int(S['whatif'] * SR):int((S['whatif'] + 0.45) * SR)] *= 0.2

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

desert_end = S['ritual']
at(fx, 0, wind(desert_end), 0.10)
at(fx, S['whatif'], wind(S['wall'] - S['whatif']), 0.06)
# pouring
at(fx, 0.0, pour(S['shrug']), 0.22, 0.2)
at(fx, WT('shrug', 2), pour(max(0.3, S['pull'] - WT('shrug', 2))), 0.16, 0.2)
# splashes on hook
for k in range(5): at(fx, 0.3 + k * 0.5, blip(1400, 700, 0.08), 0.08, 0.3)
# camera moves
at(fx, S['egypt'] + 0.2, whoosh(0.9, False), 0.20)
at(fx, S['men'] + 0.1, whoosh(1.2, True), 0.20)
at(fx, S['oneman'] - 0.05, whoosh(0.7, False), 0.35)
for sid in ['laugh', 'overseer', 'pull']: at(fx, S[sid] - 0.12, whoosh(0.32), 0.38)
at(fx, WT('pull', 6) - 0.12, whoosh(0.32), 0.38)
at(fx, WT("men", 2), thud(), 0.18)  # ropes grabbed
at(fx, WT('overseer', 3), hiss(1.4), 0.22)
at(fx, WT('overseer', 4), thud(), 0.25)
at(fx, WT('shrug', 1), blip(420, 760, 0.1), 0.3)
at(fx, S['pull'] + 0.35, slide(2.2), 0.42)
at(fx, WT('pull', 6), blip(900, 250, 0.35), 0.25)
at(fx, S['ritual'], boom_drum(), 0.6)
at(fx, WT('ritual', 10), blip(300, 220, 0.25), 0.25)
at(fx, S['lab'], blip(1800, 1800, 0.04), 0.3)
at(fx, WT('lab', 4), ding(1046.5, 0.8), 0.18)
at(fx, WT('macro', 2), glitter(1.4), 0.25)
at(fx, WT('macro', 6), slide(1.6), 0.25)
at(fx, WT('half', 5), ding(), 0.35)
at(fx, S['whatif'], tape_rewind(0.45), 0.6)
at(fx, WT('whatif', 2), thud(), 0.55)
at(fx, WT('whatif', 2) + 0.15, thud(), 0.35, 0.4)
at(fx, WT('whatif', 2) + 0.28, thud(), 0.3, -0.4)
at(fx, S['wall'], tape_rewind(0.4), 0.5)
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
