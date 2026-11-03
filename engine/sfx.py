#!/usr/bin/env python3
"""Synthesise the small sound-effect library used by the cartoon videos.

All sounds are generated from scratch (no samples, no licensing issues).
Usage: python3 engine/sfx.py cartoon/sfx
"""
import math
import os
import sys
import wave

import numpy as np

SR = 44100
rng = np.random.default_rng(7)


def t_axis(dur):
    return np.arange(int(SR * dur)) / SR


def env_ad(n, attack, decay_pow=1.0):
    """Attack (fraction of n) then smooth decay."""
    x = np.linspace(0, 1, n)
    a = np.clip(x / max(attack, 1e-6), 0, 1)
    d = np.clip((1 - x) / max(1 - attack, 1e-6), 0, 1) ** decay_pow
    return np.where(x < attack, a, d)


def svf_bandpass(sig, freqs, q=1.2):
    """State-variable band-pass with a per-sample centre frequency."""
    out = np.zeros_like(sig)
    low = band = 0.0
    damp = 1.0 / q
    for i, (x, f) in enumerate(zip(sig, freqs)):
        fc = 2 * math.sin(math.pi * min(f, SR / 6) / SR)
        high = x - low - damp * band
        band += fc * high
        low += fc * band
        out[i] = band
    return out


def lowpass(sig, cutoff):
    a = math.exp(-2 * math.pi * cutoff / SR)
    out = np.zeros_like(sig)
    y = 0.0
    for i, x in enumerate(sig):
        y = (1 - a) * x + a * y
        out[i] = y
    return out


def norm(sig, peak=0.9):
    m = np.max(np.abs(sig)) or 1.0
    return sig / m * peak


def fade(sig, ms=8):
    n = int(SR * ms / 1000)
    if n and len(sig) > 2 * n:
        sig[:n] *= np.linspace(0, 1, n)
        sig[-n:] *= np.linspace(1, 0, n)
    return sig


def write(path, sig):
    sig = fade(np.asarray(sig, dtype=np.float64))
    data = (np.clip(sig, -1, 1) * 32767).astype(np.int16)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def whoosh(dur=0.55, f0=250, f1=2600, f2=700, soft=False):
    n = int(SR * dur)
    x = np.linspace(0, 1, n)
    freqs = np.where(x < .55, f0 + (f1 - f0) * (x / .55) ** 1.5, f1 + (f2 - f1) * ((x - .55) / .45))
    noise = rng.standard_normal(n)
    s = svf_bandpass(noise, freqs, q=1.6 if soft else 2.2)
    s *= np.sin(np.pi * x) ** (2.2 if soft else 1.6)
    return norm(s, .9)


def pop():
    t = t_axis(.09)
    f = 700 * np.exp(-t * 28) + 180
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)
    return norm(s, .9)


def thump():
    t = t_axis(.22)
    f = 140 * np.exp(-t * 18) + 45
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 16)
    s += lowpass(rng.standard_normal(len(t)), 900) * np.exp(-t * 60) * .6
    return norm(s, .95)


def bell(freq, dur, decay):
    t = t_axis(dur)
    s = (np.sin(2 * np.pi * freq * t) + .35 * np.sin(2 * np.pi * freq * 2.76 * t) + .18 * np.sin(2 * np.pi * freq * 5.4 * t))
    return s * np.exp(-t * decay)


def ding():
    return norm(bell(1318.5, 1.3, 4.0), .8)


def kaching():
    n = int(SR * 1.4)
    s = np.zeros(n)
    drawer = svf_bandpass(rng.standard_normal(int(SR * .12)), np.full(int(SR * .12), 1800), q=1.5) * env_ad(int(SR * .12), .05, 2)
    s[:len(drawer)] += drawer * 1.4
    for off, f in [(.07, 2093), (.16, 2637)]:
        b = bell(f, 1.2, 5.0)
        i = int(off * SR)
        s[i:i + len(b)] += b[:n - i] * .8
    for k in range(14):
        i = int((.1 + rng.random() * .5) * SR)
        p = bell(3500 + rng.random() * 3000, .12, 40) * .25
        s[i:i + len(p)] += p[:n - i]
    return norm(s, .85)


def sparkle():
    n = int(SR * .7)
    s = np.zeros(n)
    for k, f in enumerate([2093, 2637, 3136, 3951, 4699]):
        b = bell(f, .35, 14) * (1 - k * .1)
        i = int(k * .055 * SR)
        s[i:i + len(b)] += b[:n - i]
    return norm(s, .7)


def tick():
    t = t_axis(.03)
    s = np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 220)
    return norm(s, .7)


def ring():
    out = []
    for _ in range(2):
        t = t_axis(.4)
        tone = (np.sin(2 * np.pi * 400 * t) + np.sin(2 * np.pi * 450 * t)) * (.6 + .4 * np.sign(np.sin(2 * np.pi * 25 * t)))
        out += [tone, np.zeros(int(SR * .2))]
    out.append(np.zeros(int(SR * .4)))
    return norm(np.concatenate(out), .6)


def click():
    t = t_axis(.04)
    s = np.sin(2 * np.pi * 3200 * t) * np.exp(-t * 160) + rng.standard_normal(len(t)) * np.exp(-t * 400) * .3
    return norm(s, .7)


def heartbeat():
    n = int(SR * .85)
    s = np.zeros(n)
    for off, f, a in [(0, 62, 1.0), (.22, 52, .75)]:
        t = t_axis(.18)
        b = np.sin(2 * np.pi * f * t) * np.exp(-t * 22) * a
        i = int(off * SR)
        s[i:i + len(b)] += b
    return norm(s, .95)


def whistle():
    parts = []
    for dur in (.18, .18, .75):
        t = t_axis(dur)
        f = 2900 + 90 * np.sin(2 * np.pi * 32 * t)
        tone = np.sin(2 * np.pi * np.cumsum(f) / SR) + .15 * rng.standard_normal(len(t))
        e = np.minimum(1, np.minimum(t / .02, (dur - t) / .03))
        parts += [tone * e, np.zeros(int(SR * .09))]
    return norm(np.concatenate(parts), .55)


def cheer(dur=4.0):
    n = int(SR * dur)
    x = np.linspace(0, 1, n)
    base = rng.standard_normal(n)
    s = np.zeros(n)
    for fc, a in [(400, 1), (900, .8), (1700, .55), (2600, .35)]:
        s += svf_bandpass(base * (0.6 + 0.4 * rng.random()), np.full(n, fc) * (1 + .08 * np.sin(2 * np.pi * (.7 + rng.random()) * x * dur)), q=.9) * a
    # crowd swell with chaotic loudness wobble
    wob = 1 + .25 * np.sin(2 * np.pi * 3.1 * x * dur) * np.sin(2 * np.pi * 1.3 * x * dur)
    e = np.clip(x / .08, 0, 1) * np.clip((1 - x) / .45, 0, 1)
    return norm(s * wob * e, .85)


def coins():
    n = int(SR * 1.6)
    s = np.zeros(n)
    for k in range(40):
        i = int(rng.random() * 1.3 * SR)
        p = bell(3000 + rng.random() * 4000, .15, 35) * (.2 + rng.random() * .3)
        s[i:i + len(p)] += p[:n - i]
    return norm(s, .7)


def main(out):
    os.makedirs(out, exist_ok=True)
    lib = {
        'whoosh': whoosh(), 'whoosh_soft': whoosh(.45, 300, 1600, 600, soft=True), 'whoosh_long': whoosh(.8, 200, 2200, 500),
        'pop': pop(), 'thump': thump(), 'ding': ding(), 'kaching': kaching(), 'sparkle': sparkle(), 'tick': tick(),
        'ring': ring(), 'click': click(), 'heartbeat': heartbeat(), 'whistle': whistle(), 'cheer': cheer(), 'coins': coins(),
    }
    for name, sig in lib.items():
        write(os.path.join(out, name + '.wav'), sig)
        print(name, f'{len(sig) / SR:.2f}s')


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'cartoon/sfx')
