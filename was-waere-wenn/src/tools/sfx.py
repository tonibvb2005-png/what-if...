"""Procedural music bed + sound effects for an episode.
usage: python sfx.py events.json out.wav [voice.wav]
events.json comes from the page (window.EVENTS()) plus the total duration.
"""
import json, sys, numpy as np
from scipy.signal import butter, sosfilt
from scipy.io import wavfile

SR = 44100
rng = np.random.default_rng(7)
def T(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.005, r=0.2):
    t = np.arange(n) / SR; e = np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / max(r, 1e-4)); return e
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], btype='band', fs=SR, output='sos'), x)
def lp(x, f): return sosfilt(butter(2, f, btype='low', fs=SR, output='sos'), x)
def hp(x, f): return sosfilt(butter(2, f, btype='high', fs=SR, output='sos'), x)
def sweep(f0, f1, d):
    t = T(d); f = np.geomspace(f0, f1, len(t)); return np.sin(2 * np.pi * np.cumsum(f) / SR)

def s_pop():  d = 0.09; return sweep(500, 1300, d) * env(int(d * SR), 0.002, 0.03) * 0.6
def s_blip(): return np.concatenate([np.sin(2*np.pi*880*T(.06))*env(int(.06*SR),.002,.03), np.sin(2*np.pi*1320*T(.08))*env(int(.08*SR),.002,.04)]) * 0.35
def s_swish(d=0.28):
    n = int(d * SR); x = rng.standard_normal(n); x = bp(x, 900, 5000)
    e = np.sin(np.linspace(0, np.pi, n)) ** 2; return x * e * 0.25
def s_whoosh(): return s_swish(0.45) * 1.2
def s_cloud():
    n = int(1.3 * SR); x = lp(rng.standard_normal(n), 900); e = np.sin(np.linspace(0, np.pi, n)) ** 1.5; return x * e * 0.6
def s_stamp():
    n = int(0.3 * SR); t = T(0.3); x = np.sin(2*np.pi*80*t) * np.exp(-t/0.06) * 0.9 + lp(rng.standard_normal(n), 2500) * np.exp(-t/0.03) * 0.5; return x
def bell(f, d=1.6, amp=0.4):
    t = T(d); x = sum(a * np.sin(2*np.pi*f*m*t) * np.exp(-t/(d*0.35/m**0.5)) for m, a in [(1, 1), (2.01, .45), (3.02, .25), (4.2, .12)]); return x * amp * np.minimum(1, t/0.003)
def s_ding(): return bell(1046) * 0.8
def s_bells():
    out = np.zeros(int(2.6 * SR))
    for i, f in enumerate([784, 659, 523, 659, 784]):
        b = bell(f, 1.4, 0.3); s = int(i * 0.32 * SR); out[s:s+len(b)] += b[:len(out)-s]
    return out
def s_paper():
    out = np.zeros(int(0.45 * SR))
    for i in range(9):
        n = int(rng.uniform(0.01, 0.03) * SR); g = hp(rng.standard_normal(n), 2500) * env(n, .001, .008); s = int(rng.uniform(0, 0.4) * SR); out[s:s+n] += g[:len(out)-s] * 0.5
    return out
def s_splash():
    n = int(0.9 * SR); t = T(0.9); x = lp(rng.standard_normal(n), 3000) * np.exp(-t/0.25) * 0.5
    for i in range(14):
        m = int(0.04*SR); s = int(rng.uniform(0.05, 0.7)*SR); f = rng.uniform(600, 1500)
        x[s:s+m] += sweep(f, f*1.8, 0.04) * env(m, .002, .015) * 0.25
    return x
def s_door():
    t = T(0.9); x = sum(a*np.sin(2*np.pi*f*t)*np.exp(-t/dk) for f, a, dk in [(110, .8, .25), (233, .4, .2), (517, .25, .12), (1210, .1, .08)])
    return x * 0.6 + lp(rng.standard_normal(len(t)), 1500) * np.exp(-t/0.05) * 0.3
def s_squeak():
    d = 0.16; t = T(d); f = 2300 + 500*np.sin(2*np.pi*14*t); x = np.sin(2*np.pi*np.cumsum(f)/SR) * env(len(t), .01, .08) * 0.25
    return np.concatenate([x, np.zeros(int(.05*SR)), x * 0.8])
def s_horn():
    d = 0.9; t = T(d); e = np.minimum(1, t/0.04) * np.minimum(1, (d - t)/0.1)
    x = sum(np.sign(np.sin(2*np.pi*f*t)) * 0.15 + np.sin(2*np.pi*f*t)*0.3 for f in (311, 392, 466))
    return lp(x, 1800) * e * 0.35
def s_plop():
    d = 0.12; x = sweep(420, 140, d) * env(int(d*SR), .002, .05) * 0.7
    return np.concatenate([x, np.zeros(int(.05*SR)), sweep(700, 300, .06) * env(int(.06*SR), .002, .03) * 0.3])
def s_tick(): n = int(0.03*SR); return hp(rng.standard_normal(n), 3000) * env(n, .001, .006) * 0.4
FX = dict(pop=s_pop, blip=s_blip, swish=s_swish, whoosh=s_whoosh, cloud=s_cloud, stamp=s_stamp, ding=s_ding, bells=s_bells,
          paper=s_paper, splash=s_splash, door=s_door, squeak=s_squeak, horn=s_horn, plop=s_plop, tick=s_tick)

def music(dur):
    """Gentle ukulele/marimba-like loop, C-G-Am-F, 96 bpm."""
    bpm = 96; beat = 60 / bpm; out = np.zeros(int((dur + 2) * SR))
    chords = [[60, 64, 67], [55, 59, 62], [57, 60, 64], [53, 57, 60]]
    melody = [72, 76, 74, 72, 71, 74, 72, 67, 69, 72, 71, 69, 65, 69, 67, 64]
    def pluck(midi, d, amp):
        f = 440 * 2 ** ((midi - 69) / 12); t = T(d)
        x = (np.sin(2*np.pi*f*t) + 0.35*np.sin(2*np.pi*2*f*t) + 0.12*np.sin(2*np.pi*3*f*t)) * np.exp(-t/0.35) * np.minimum(1, t/0.004)
        return x * amp
    nbeats = int(dur / beat) + 2
    for i in range(nbeats):
        bar = (i // 4) % 4; s = int(i * beat * SR)
        ch = chords[bar]
        for k, m in enumerate(ch):  # strum
            p = pluck(m, 1.0, 0.10); ss = s + int(k * 0.018 * SR); out[ss:ss+len(p)] += p[:max(0, len(out)-ss)]
        if i % 4 == 0:
            p = pluck(ch[0] - 12, 2.2, 0.16); out[s:s+len(p)] += p[:max(0, len(out)-s)]
        if i % 2 == 0:
            m = melody[(i // 2) % len(melody)]; p = pluck(m, 0.8, 0.07); ss = s + int(beat * SR * 0.5); out[ss:ss+len(p)] += p[:max(0, len(out)-ss)]
    out = lp(out, 4000)
    return out[:int(dur * SR)]

def main():
    ev = json.load(open(sys.argv[1])); dur = ev['duration']; beats = ev['beats']
    N = int(dur * SR) + SR; fx = np.zeros(N)
    def add(name, t, gain=1.0):
        x = FX[name]() * gain; s = int(max(0, t) * SR); fx[s:s+len(x)] += x[:max(0, N-s)]
    prev = None
    for b in beats:
        a = b['a']
        if prev is not None and b['shot'] != prev: add('swish', a - 0.08, 0.7)
        prev = b['shot']
        if b['card']: add('whoosh', a + 0.15, 0.8); add('pop', a + 0.45, 0.8)
        if b['pill'] is not None: add('pop', a + b['pill'], 1.0)
        if b['stamp'] is not None: add('stamp', a + b['stamp'], 1.0)
        if b['bubble'] is not None: add('blip', a + b['bubble'], 1.0)
        if b['clouds']: add('cloud', b['b'] - 0.7, 1.0)
        for name, t in b['sfx']: add(name, a + t, 1.0)
    add('ding', dur - 2.2, 0.6)
    mus = music(dur)
    # fade music in/out
    fi = np.minimum(1, np.arange(len(mus)) / (0.8 * SR)); fo = np.minimum(1, (len(mus) - np.arange(len(mus))) / (1.5 * SR)); mus *= fi * fo
    mix = np.zeros(N); mix[:len(mus)] += mus * 0.55
    mix += fx * 0.9
    if len(sys.argv) > 3:
        sr, v = wavfile.read(sys.argv[3]); v = v.astype(np.float32); v = v / (np.abs(v).max() + 1e-9) * 0.85
        if v.ndim > 1: v = v.mean(1)
        # duck music under the voice
        envv = np.convolve(np.abs(v), np.ones(4410) / 4410, mode='same'); duck = 1 - 0.45 * np.clip(envv / 0.05, 0, 1)
        m2 = np.zeros(N); m2[:len(mus)] = mus * 0.55; m2[:len(duck)] *= duck[:len(m2)] if len(duck) <= len(m2) else duck[:len(m2)]
        mix = m2 + fx * 0.75; mix[:len(v)] += v[:N]
    mix = mix[:int(dur * SR)]
    mix = mix / max(1e-6, np.abs(mix).max()) * 0.9
    wavfile.write(sys.argv[2], SR, (mix * 32767).astype(np.int16))
    print('wrote', sys.argv[2], round(len(mix) / SR, 2), 's')

main()
