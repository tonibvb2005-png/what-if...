"""Procedural horror sound design, synced to the timeline.

Everything is synthesized (no samples => no copyright issues):
dark drone bed, wind, whooshes on cuts, sub booms, risers, footsteps, heartbeat,
church bells, eerie stings, jump-scare hit and a logo sting for the outro.
"""
import math

import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
rng = np.random.default_rng(1234)


def _sos(kind, f, order=2):
    if kind == "band":
        return butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], btype="band", output="sos")
    return butter(order, f / (SR / 2), btype=kind, output="sos")


def filt(x, kind, f, order=2):
    return sosfilt(_sos(kind, f, order), x, axis=0)


def noise(n):
    return rng.standard_normal(n).astype(np.float32)


def pink(n):
    w = noise(n)
    return filt(w, "low", 900, 1) * 0.6 + filt(w, "low", 120, 1) * 1.6


def env_adsr(n, a, d, s_level=0.0):
    t = np.arange(n) / SR
    e = np.where(t < a, t / max(a, 1e-4), s_level + (1 - s_level) * np.exp(-(t - a) / max(d, 1e-4)))
    return e.astype(np.float32)


def stereo(x, pan=0.0):
    l = math.cos((pan + 1) * math.pi / 4)
    r = math.sin((pan + 1) * math.pi / 4)
    return np.stack([x * l, x * r], axis=1)


_ir = None


def reverb(x, wet=0.35, length=2.8):
    global _ir
    if _ir is None:
        n = int(length * SR)
        t = np.arange(n) / SR
        dec = np.exp(-t * 3.2)
        irl = noise(n) * dec
        irr = noise(n) * dec
        irl = filt(irl, "low", 5000)
        irr = filt(irr, "low", 5000)
        _ir = np.stack([irl, irr], 1) / 30.0
    if x.ndim == 1:
        x = stereo(x)
    out = np.zeros((len(x) + len(_ir) - 1, 2), np.float32)
    for ch in range(2):
        out[:, ch] = fftconvolve(x[:, ch], _ir[:, ch])
    out[: len(x)] += x * (1 - wet) / max(wet, 1e-3)
    return out * wet


class Mix:
    def __init__(self, dur):
        self.n = int(dur * SR) + SR
        self.buf = np.zeros((self.n, 2), np.float32)

    def add(self, t, x, gain=1.0, pan=0.0):
        if x.ndim == 1:
            x = stereo(x, pan)
        i = int(max(0, t) * SR)
        j = min(self.n, i + len(x))
        if j > i:
            self.buf[i:j] += x[: j - i] * gain


# ------------------------------------------------------------------ sounds
def boom(length=3.0, f0=95, f1=30):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 6)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * env_adsr(n, 0.004, 0.9)
    click = filt(noise(n), "low", 1800) * env_adsr(n, 0.001, 0.05) * 0.6
    rumble = filt(noise(n), "low", 120) * env_adsr(n, 0.01, 1.2) * 0.9
    x = body + click + rumble
    return reverb(x, 0.35)


def hit(length=3.5):
    """dissonant metallic / orchestral-ish jump-scare stab"""
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for f in (146.8, 155.6, 220.0, 233.1, 311.1, 466.2, 659.3, 698.5):
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * (1 / (1 + f / 300))
    x = np.tanh(x * 1.5) * env_adsr(n, 0.005, 0.9)
    x += filt(noise(n), "band", (800, 6000)) * env_adsr(n, 0.002, 0.35) * 0.6
    return reverb(x, 0.45) * 0.8 + boom(length) * 0.9


def whoosh(length=1.1, rev=False):
    n = int(length * SR)
    t = np.linspace(0, 1, n)
    e = np.sin(np.pi * t) ** 2.2
    if rev:
        e = t ** 3 * (1 - np.clip((t - 0.92) / 0.08, 0, 1))
    w = noise(n)
    lo = filt(w, "band", (250, 1200))
    hi = filt(w, "band", (1200, 5000))
    mixk = t
    x = (lo * (1 - mixk) + hi * mixk * 0.6) * e
    out = np.stack([x * (1 - 0.6 * t), x * (0.4 + 0.6 * t)], 1)
    return reverb(out, 0.25)


def riser(length=4.0):
    n = int(length * SR)
    t = np.linspace(0, 1, n)
    f = 110 * (2 ** (t * 2.5))
    ph = 2 * np.pi * np.cumsum(f) / SR
    tone = (np.sin(ph) + 0.5 * np.sin(ph * 1.5 + 1) + 0.3 * np.sin(ph * 2.02)) * 0.35
    w = noise(n)
    nz = filt(w, "band", (400, 3000)) * (1 - t) + filt(w, "high", 3000) * t
    x = (tone + nz * 0.8) * (t ** 2.2)
    trem = 1 + 0.3 * np.sin(2 * np.pi * (4 + 14 * t) * t * length)
    return reverb(x * trem, 0.3)


def footstep(heavy=0.0):
    n = int((0.25 + heavy * 0.5) * SR)
    w = noise(n)
    crunch = filt(w, "band", (300, 3500)) * env_adsr(n, 0.003, 0.05 + 0.04 * heavy) * (0.6 - 0.3 * heavy)
    thud_t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * (70 - 25 * heavy) * thud_t) * env_adsr(n, 0.004, 0.08 + 0.18 * heavy) * (0.4 + heavy)
    squelch = filt(w, "low", 600) * env_adsr(n, 0.01, 0.12 + 0.1 * heavy) * heavy * 0.9
    return crunch + thud + squelch


def heartbeat():
    n = int(0.6 * SR)
    t = np.arange(n) / SR
    beat = lambda d: np.sin(2 * np.pi * 52 * (t - d)) * np.where(t > d, np.exp(-(t - d) * 22), 0)
    return (beat(0) + 0.7 * beat(0.22)).astype(np.float32)


def bell(length=7.0, f0=196.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for ratio, amp, dec in ((0.5, 0.6, 1.6), (1.0, 1.0, 1.2), (1.183, 0.6, 0.9), (1.506, 0.5, 0.7),
                            (2.0, 0.45, 0.6), (2.514, 0.3, 0.45), (2.662, 0.25, 0.4), (3.011, 0.2, 0.3)):
        x += amp * np.sin(2 * np.pi * f0 * ratio * t) * np.exp(-t / (dec * 2.2))
    x *= env_adsr(n, 0.002, 30)
    x += filt(noise(n), "band", (1500, 5000)) * env_adsr(n, 0.001, 0.02) * 0.4
    return reverb(x * 0.4, 0.5)


def sting(length=2.5):
    """eerie high cluster when eyes appear"""
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for f in (1174.7, 1244.5, 1661.2):
        x += np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * (1 + 0.5 * np.sin(2 * np.pi * 6.3 * t))
    x = x * 0.6
    e = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 1.5
    return reverb(x * e * 0.12, 0.6)


def pad(length, freqs, bright=0.3):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.zeros((n, 2), np.float32)
    for k, f in enumerate(freqs):
        for det, pan in ((-0.25, -0.6), (0.25, 0.6)):
            ph = rng.uniform(0, 6)
            s = np.sin(2 * np.pi * (f + det) * t + ph) + bright * np.sin(2 * np.pi * 2 * (f + det) * t + ph)
            x += stereo(s.astype(np.float32), pan) / len(freqs)
    return x


def drone(length):
    """the constant dark bed: low D minor drone + slow breathing + eerie high tones"""
    n = int(length * SR)
    t = np.arange(n) / SR
    low = pad(length, [36.7, 73.4, 110.0, 87.3], bright=0.5)
    low = np.stack([filt(low[:, 0], "low", 260), filt(low[:, 1], "low", 260)], 1)
    breathe = (0.75 + 0.25 * np.sin(2 * np.pi * t / 9.0))[:, None]
    hi = pad(length, [587.3, 880.0, 932.3], bright=0.0) * 0.12
    hi *= (0.5 + 0.5 * np.sin(2 * np.pi * t / 13.0 + 1))[:, None]
    return (low * breathe * 0.45 + hi).astype(np.float32)


def wind(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    w = pink(n)
    a = filt(w, "band", (180, 900))
    b = filt(pink(n), "band", (500, 2200))
    lfo = 0.55 + 0.45 * np.sin(2 * np.pi * t / 7.3) * np.sin(2 * np.pi * t / 3.1 + 1)
    return np.stack([a * lfo + b * 0.3 * (1 - lfo), a * (1 - lfo) * 0.8 + b * 0.3 * lfo], 1) * 0.35


# ------------------------------------------------------------------ score
SFX = {}   # scene kind -> fn(mix, scene, timeline) -> optional [(t0, t1, bed_level)]


def reveal_time(tl):
    """Jump-scare moment: first red word of the final hook scene."""
    last = tl["scenes"][-1]
    if not last["cfg"].get("hook"):
        return None
    reds = [w["t"] for w in tl["words"] if w["scene"] == last["i"] and w["red"]]
    return (reds[0] - 0.05) if reds else None


def creak(length=1.4, amp=0.5):
    n2 = int(length * SR)
    tt = np.arange(n2) / SR
    x = filt(noise(n2) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (28 + 10 * tt) * tt))), "band", (300, 1400))
    return reverb(x * env_adsr(n2, 0.3, 0.6) * amp, 0.4)


def build_soundtrack(tl, outro_len):
    dur = tl["duration"] + 1.0
    m = Mix(dur)
    scenes = {s["kind"]: s for s in tl["scenes"]}
    story_end = tl["story_end"]
    n = m.n

    # --- bed: drone + wind, with automation
    bed = np.zeros((n, 2), np.float32)
    d = drone(dur)
    bed[: len(d)] += d[:n] * 0.5
    wd = wind(dur)
    bed[: len(wd)] += wd[:n] * 0.32
    t = np.arange(n) / SR
    gain = np.ones(n, np.float32)
    gain *= np.clip(t / 1.5, 0, 1)                              # fade in
    tr = reveal_time(tl)
    # story-specific sound effects (registered by scene modules); they may return bed ducks
    ducks = []
    for s in tl["scenes"]:
        fn = SFX.get(s["kind"])
        if fn:
            ducks += fn(m, s, tl) or []
    for d0, d1, lvl in ducks:
        k = np.clip((t - d0) / 0.5, 0, 1) * np.clip((d1 - t) / 0.5, 0, 1)
        gain *= 1 - (1 - lvl) * k
    if tr is not None:                                             # silence before the scare
        dip = np.clip(1 - (t - (tr - 1.2)) / 0.6, 0.05, 1)
        dip[t > tr] = np.clip(0.05 + (t[t > tr] - tr) / 2.0, 0.05, 0.8)
        gain *= dip
    gain[t > story_end] *= np.clip(1 - (t[t > story_end] - story_end) / 0.4, 0, 1)
    if "dawn" in scenes:                                           # warmer at dawn
        sc = scenes["dawn"]
        warm = pad(sc["end"] - sc["start"] + 2, [146.8, 185.0, 220.0, 293.7], bright=0.2) * 0.13
        ln = len(warm)
        e = np.sin(np.pi * np.linspace(0, 1, ln)) ** 1.2
        m.add(sc["start"] - 0.5, warm * e[:, None])
    m.buf += bed * gain[:, None]

    # --- opening hit
    m.add(0.05, boom(), 0.9)

    # --- whooshes into every cut
    for s in tl["scenes"][1:]:
        m.add(s["start"] - 0.55, whoosh(), 0.35)

    def wt(kind, word, frac=0.5):
        s = scenes[kind]
        return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)

    # --- walking footsteps
    for kind, rate, heavy in (("hook_road", 0.0, 0.0), ("forest_walk", 1.0 / 0.75, 0.0)):
        if kind in scenes and rate > 0:
            s = scenes[kind]
            k = s["start"] + 0.3
            while k < s["end"] - 0.2:
                m.add(k, footstep(heavy), 0.22, pan=rng.uniform(-0.2, 0.2))
                k += 1 / rate
    for s in tl["scenes"]:
        if s["cfg"].get("title"):
            m.add(s["start"] - 0.05, boom(f0=70, f1=26), 1.0)
            m.add(s["start"] + 0.2, sting(), 0.9)
    if "crossroads" in scenes:
        s = scenes["crossroads"]
        m.add(s["start"] + (s["end"] - s["start"]) * 0.45, sting(2.0), 0.7)
    if "face_closeup" in scenes:
        m.add(wt("face_closeup", "follows") - 0.1, sting(3.0), 1.0)
    if "jump" in scenes:
        tj = wt("jump", "jumps")
        m.add(tj - 1.6, riser(1.8), 0.6)
        m.add(tj + 0.15, hit(), 0.9)
        s = scenes["jump"]
        k = s["start"] + 0.2
        while k < tj:
            m.add(k, footstep(0.1), 0.22)
            k += 0.68
    # heartbeat under claws -> collapse
    hb0 = scenes["claws"]["start"] if "claws" in scenes else None
    hb1 = scenes["collapse"]["end"] if "collapse" in scenes else None
    if hb0 is not None and hb1 is not None:
        k, bpm = hb0, 64
        while k < hb1:
            m.add(k, heartbeat(), 0.9)
            bpm = min(110, bpm + 2.2)
            k += 60 / bpm
    if "footsteps" in scenes:
        s = scenes["footsteps"]
        k, i = s["start"] + 0.35, 0
        while k < s["end"]:
            m.add(k, footstep(min(1.0, 0.35 + 0.15 * i)), 0.75, pan=(-0.25 if i % 2 == 0 else 0.25))
            k += 0.95
            i += 1
    if "collapse" in scenes:
        tc = wt("collapse", "collapses", 0.35)
        s = scenes["collapse"]
        k = s["start"] + 0.2
        while k < tc:
            m.add(k, footstep(0.8), 0.5)
            k += 1.2
        m.add(tc + 0.7, boom(2.5, f0=80, f1=28), 0.8)
        m.add(tc + 0.7, footstep(1.0), 0.8)
    if "village_bells" in scenes:
        tb = wt("village_bells", "bells", 0.8)
        for i in range(3):
            m.add(tb - 0.05 + i * 1.7, bell(), 0.55 - 0.1 * i)
    if "interior" in scenes:
        s = scenes["interior"]
        m.add(s["start"] + (s["end"] - s["start"]) * 0.5, sting(3.0), 0.9)
        # low wooden creak
        n2 = int(1.4 * SR)
        tt = np.arange(n2) / SR
        creak = filt(noise(n2) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * (28 + 10 * tt) * tt))), "band", (300, 1400))
        m.add(s["start"] + 1.0, reverb(creak * env_adsr(n2, 0.3, 0.6) * 0.5, 0.4), 0.6)
    if tr is not None and len(tl["scenes"]) >= 2:                 # riser -> silence -> jump scare
        s = tl["scenes"][-2]
        rl = max(2.0, tr - 1.25 - s["start"])
        m.add(tr - 1.25 - rl, riser(rl), 0.55)
        m.add(tl["scenes"][-1]["start"] + 0.2, sting(2.0), 1.0)
        m.add(tr, hit(4.5), 1.25)
    # --- pacing: thud on every punch-in, swish on in-scene cuts, hits on subliminal flashes
    for s in tl["scenes"]:
        for p in s.get("punches", []):
            m.add(s["start"] + p - 0.02, boom(1.2, f0=75, f1=38), 0.22)
        for q in s.get("cuts", []):
            m.add(s["start"] + q - 0.3, whoosh(0.45), 0.25)
    for ft in tl.get("flashes", []):
        n3 = int(0.4 * SR)
        burst = filt(noise(n3), "band", (500, 6000)) * env_adsr(n3, 0.002, 0.08)
        m.add(ft, reverb(burst, 0.3), 0.7)
        m.add(ft, boom(1.5, f0=110, f1=40), 0.6)
    # --- heartbeat speeding up through the second-to-last scene
    if tr is not None and len(tl["scenes"]) >= 2:
        s = tl["scenes"][-2]
        k, bpm = s["start"], 72.0
        while k < tr - 1.3:
            m.add(k, heartbeat(), 0.7)
            bpm = min(130.0, bpm + 4.0)
            k += 60 / bpm
    # outro logo sting
    m.add(story_end + 0.25, boom(3.5, f0=60, f1=25), 0.8)
    lg = pad(3.5, [73.4, 110.0, 146.8, 174.6], bright=0.4)
    m.add(story_end + 0.25, reverb(lg[:, 0] * env_adsr(len(lg), 0.05, 1.2), 0.5) * 0.35)
    return m.buf


def loudness_normalize(x, target=-14.0):
    import pyloudnorm as pyln
    meter = pyln.Meter(SR)
    lufs = meter.integrated_loudness(x)
    if not np.isfinite(lufs):
        return x
    y = x * (10 ** ((target - lufs) / 20))
    peak = np.max(np.abs(y))
    if peak > 0.97:
        y = np.tanh(y / 0.97 * 1.0) * 0.97  # soft limit
    return y


def mix_with_voice(bed, voice, duck_db=-9.0):
    n = max(len(bed), len(voice))
    out = np.zeros((n, 2), np.float32)
    out[: len(bed)] += bed
    v = np.zeros((n, 2), np.float32)
    v[: len(voice)] = voice
    # sidechain ducking from voice envelope
    envl = np.abs(v).mean(1)
    win = int(0.15 * SR)
    envl = np.convolve(envl, np.ones(win) / win, mode="same")
    thr = 0.02 * envl.max()
    duck = np.where(envl > thr, 10 ** (duck_db / 20), 1.0).astype(np.float32)
    sm = int(0.25 * SR)
    duck = np.convolve(duck, np.ones(sm) / sm, mode="same")
    out *= duck[:, None]
    return out + v


def write_wav(path, x):
    import wave
    y = np.clip(x, -1, 1)
    pcm = (y * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def read_audio(path):
    import subprocess
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "f32le", "-ac", "2", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
