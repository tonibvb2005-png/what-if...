"""Erzeugt Sprecher (Piper-Platzhalter), Sound-Design und Timeline fuer das Video.

Ausgabe: build/audio.wav, build/timeline.json
Optional: --voice-dir DIR  -> nutzt fertige ElevenLabs-Dateien DIR/<shot-id>_<seg>.wav statt Piper.
"""
import json, os, subprocess, sys, re
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
B = os.path.join(HERE, "build")
os.makedirs(os.path.join(B, "tts"), exist_ok=True)
rng = np.random.default_rng(7)
VOICE_DIR = None
if "--voice-dir" in sys.argv:
    VOICE_DIR = sys.argv[sys.argv.index("--voice-dir") + 1]


# ---------------------------------------------------------------- helpers
def load(path):
    tmp = path + ".44k.wav"
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", path, "-ac", "1", "-ar", str(SR), tmp], check=True)
    sr, x = wavfile.read(tmp)
    x = x.astype(np.float32)
    if x.dtype != np.float32 or np.abs(x).max() > 2:
        x = x / 32768.0
    return x


def trim(x, thr=0.012, pad=0.03):
    idx = np.where(np.abs(x) > thr)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(x), idx[-1] + int(pad * SR))
    return x[a:b]


def ffx(x, af):
    """Run a numpy signal through an ffmpeg audio filter."""
    i = os.path.join(B, "_fx_in.wav"); o = os.path.join(B, "_fx_out.wav")
    wavfile.write(i, SR, x.astype(np.float32))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", i, "-af", af, "-ar", str(SR), "-ac", "1", o], check=True)
    sr, y = wavfile.read(o)
    return y.astype(np.float32) if y.dtype == np.float32 else y.astype(np.float32) / 32768.0


def tts(model, text, path, length=1.0, noise=0.6):
    if not os.path.exists(path):
        subprocess.run([sys.executable, "-m", "piper", "-m", os.path.join(HERE, "assets", model), "-f", path,
                        "--length-scale", str(length), "--noise-scale", str(noise)],
                       input=text.encode(), check=True, capture_output=True)
    return load(path)


def env(n, a=0.005, r=None, curve=1.0):
    e = np.ones(n, np.float32)
    na = max(1, int(a * SR)); e[:na] = np.linspace(0, 1, na)
    if r:
        nr = min(n, int(r * SR)); e[-nr:] *= np.linspace(1, 0, nr) ** curve
    return e


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x).astype(np.float32)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, fs=SR, output="sos"), x).astype(np.float32)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x).astype(np.float32)


def noise(d):
    return rng.standard_normal(int(d * SR)).astype(np.float32)


def t_(d):
    return np.arange(int(d * SR)) / SR


def reverb(x, rt=1.8, wet=0.35, pre=0.02):
    n = int(rt * SR)
    ir = rng.standard_normal(n) * np.exp(-6.9 * np.arange(n) / n)
    ir = lp(ir.astype(np.float32), 5000)
    ir = np.concatenate([np.zeros(int(pre * SR)), ir])
    ir /= np.sqrt((ir ** 2).sum())
    y = signal.fftconvolve(x, ir)[: len(x) + len(ir)]
    out = np.zeros(len(y), np.float32); out[: len(x)] += x * (1 - wet)
    out += y.astype(np.float32) * wet * 0.6
    return out


def norm(x, peak=0.9):
    m = np.abs(x).max()
    return x * (peak / m) if m > 0 else x


# ---------------------------------------------------------------- SFX
def sfx_click():
    d = 0.035
    return (bp(noise(d), 1800, 6000) * env(int(d * SR), 0.001, 0.03, 2) * 0.5 +
            np.sin(2 * np.pi * 2400 * t_(d)) * env(int(d * SR), 0.001, 0.03, 3) * 0.2)


def S_ticks():
    out = np.zeros(int(5.0 * SR), np.float32)
    t, iv = 0.0, 0.045
    while t < 4.45:
        i = int(t * SR); c = sfx_click(); out[i:i + len(c)] += c[: len(out) - i] * 0.55
        t += iv; iv *= 1.065 if t > 1.6 else 1.0
    return out


def S_alarm():
    d = 4.6; tt = t_(d)
    f = 520 + 140 * np.sign(np.sin(2 * np.pi * 1.25 * tt))
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (signal.sawtooth(ph) * 0.5 + np.sin(ph)) * 0.08
    x = lp(x, 2200) * env(len(tt), 0.3, 1.2)
    return reverb(x, 1.5, 0.4)


def S_boom(gain=1.0, d=2.6):
    tt = t_(d)
    f = 34 + 70 * np.exp(-tt * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.6)
    n = lp(noise(d), 900) * np.exp(-tt * 14) * 0.6
    return reverb((s + n) * 0.9 * gain, 2.2, 0.3)


def S_hit_soft():
    return S_boom(0.55, 2.0)


def S_steps():
    out = np.zeros(int(2.4 * SR), np.float32)
    for k in range(4):
        d = 0.16; s = bp(noise(d), 300, 3000) * env(int(d * SR), 0.004, 0.14, 2) * 0.25
        i = int((0.05 + k * 0.52) * SR); out[i:i + len(s)] += s
    return out


def S_riser():
    d = 2.2; tt = t_(d)
    f = 120 * 2 ** (tt * 1.6)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 + bp(noise(d), 400, 6000) * 0.12
    return (s * (tt / d) ** 2.2).astype(np.float32)


def S_shatter():
    d = 1.4; tt = t_(d)
    x = hp(noise(d), 2500) * np.exp(-tt * 9) * 0.5
    for f in rng.uniform(2500, 7000, 9):
        st = rng.uniform(0, 0.25); m = tt > st
        x[m] += np.sin(2 * np.pi * f * (tt[m] - st)) * np.exp(-(tt[m] - st) * rng.uniform(8, 20)) * 0.12
    return reverb(x, 0.8, 0.25)


def S_whisper():
    d = 1.8; tt = t_(d)
    x = bp(noise(d), 1500, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 3.1 * tt) ** 2) * env(len(tt), 0.3, 0.6) * 0.18
    return reverb(x, 2.0, 0.5)


def S_pop():
    d = 0.12; tt = t_(d)
    f = 500 + 900 * tt / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * env(len(tt), 0.002, 0.09, 2) * 0.35


def S_paper():
    d = 0.4; x = bp(noise(d), 1500, 9000)
    gate = (rng.random(len(x)) < 0.04).astype(np.float32)
    gate = lp(gate, 300) * 6
    return x * np.clip(gate, 0, 1) * env(len(x), 0.01, 0.15) * 0.3


def S_salt():
    d = 1.2; x = hp(noise(d), 5000)
    g = (rng.random(len(x)) < 0.02) * rng.random(len(x))
    return (x * lp(g.astype(np.float32), 2000) * 4 * env(len(x), 0.1, 0.4) * 0.35).astype(np.float32)


def S_slide():
    d = 0.9; tt = t_(d)
    x = bp(noise(d), 120, 1200) * (0.7 + 0.3 * np.sin(2 * np.pi * 23 * tt)) * env(len(tt), 0.08, 0.25) * 0.35
    k = int(0.80 * SR); x[k:k + 2000] += lp(noise(2000 / SR), 600) * np.linspace(0.5, 0, 2000)
    return reverb(x, 0.6, 0.2)


def knock():
    d = 0.25; tt = t_(d)
    s = (np.sin(2 * np.pi * 180 * tt) + 0.6 * np.sin(2 * np.pi * 410 * tt)) * np.exp(-tt * 30)
    s += lp(noise(d), 2500) * np.exp(-tt * 60) * 0.8
    return s * 0.55


def S_knock3():
    out = np.zeros(int(1.6 * SR), np.float32)
    for k in range(3):
        s = knock(); i = int(k * 0.32 * SR); out[i:i + len(s)] += s
    return reverb(out, 0.9, 0.3)


def S_knock2():
    out = np.zeros(int(1.2 * SR), np.float32)
    for k in range(2):
        s = knock() * 0.8; i = int(k * 0.26 * SR); out[i:i + len(s)] += s
    return reverb(out, 0.8, 0.25)


def S_snore():
    out = np.zeros(int(3.6 * SR), np.float32)
    for k in range(2):
        d = 1.2; tt = t_(d)
        s = bp(noise(d), 80, 700) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 38 * tt))) * np.sin(np.pi * tt / d) ** 2 * 0.25
        i = int(k * 1.9 * SR); out[i:i + len(s)] += s
    return out


def S_crackle():
    d = 2.2; x = np.zeros(int(d * SR), np.float32)
    for _ in range(70):
        i = rng.integers(0, len(x) - 400); x[i:i + 300] += hp(noise(300 / SR), 1500) * rng.uniform(0.05, 0.3) * np.linspace(1, 0, 300)
    return x * env(len(x), 0.2, 0.6) + bp(noise(d), 60, 200) * 0.15 * env(len(x), 0.5, 0.8)


def S_birds():
    out = np.zeros(int(3.0 * SR), np.float32)
    for k in range(6):
        d = rng.uniform(0.07, 0.14); tt = t_(d); f0 = rng.uniform(2800, 4200)
        f = f0 + 900 * np.sin(np.pi * tt / d)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d) * 0.06
        i = int(rng.uniform(0, 2.7) * SR); out[i:i + len(s)] += s
    return reverb(out, 1.4, 0.4)


def S_clock():
    out = np.zeros(int(3.0 * SR), np.float32)
    for k in range(6):
        c = sfx_click() * (0.8 if k % 2 else 0.55); c = lp(c, 3500); i = int(k * 0.5 * SR); out[i:i + len(c)] += c
    return out


def S_stinger():
    d = 3.8; tt = t_(d)
    x = np.zeros(len(tt), np.float32)
    for f in [55, 58.3, 82.4, 116.5, 155.6, 233]:
        x += signal.sawtooth(2 * np.pi * f * tt * (1 + 0.004 * np.sin(2 * np.pi * 5 * tt))).astype(np.float32) * 0.12
    x = lp(x, 3000) * np.exp(-tt * 0.9)
    x += hp(noise(d), 800) * np.exp(-tt * 5) * 0.7
    x += S_boom(1.3, d)[: len(x)]
    x = reverb(x, 2.8, 0.35)
    return norm(np.tanh(x * 1.4), 0.98)


def S_sparkle():
    out = np.zeros(int(2.0 * SR), np.float32)
    for k, f in enumerate([1318, 1568, 1976, 2637]):
        d = 0.9; tt = t_(d); s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 5) * 0.08
        i = int(k * 0.07 * SR); out[i:i + len(s)] += s
    return reverb(out, 1.2, 0.4)



# ---------------------------------------------------------------- echte Aufnahmen (BigSoundBank, CC0)
_REC = {}
def rec(fid, start, dur, peak=0.8, fin=0.01, fout=0.15, rms=None):
    key = (fid, start, dur)
    if key not in _REC:
        r = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(start), "-t", str(dur), "-i", os.path.join(HERE, "sfx", fid + ".mp3"),
                            "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True, check=True)
        _REC[key] = np.frombuffer(r.stdout, np.float32).copy()
    x = _REC[key].copy(); n = len(x)
    if n == 0: return x
    x *= env(n, fin, fout)
    if rms: return (x * (rms / (np.sqrt((x ** 2).mean()) + 1e-9))).astype(np.float32)
    return norm(x, peak)

def R_ticks():   return rec("0140", 50.0, 8.4, 0.75, 0.3, 0.3)          # Freilauf, bremst ab (letzter Klick bei 7.96 s)
def R_knock3():  return reverb(rec("0374", 5.42, 1.5, 0.85, 0.002, 0.3), 0.9, 0.22)   # 3x Klopfen, Holz/Papier
def R_knock2():  return reverb(rec("0095", 0.05, 1.3, 0.85, 0.002, 0.3), 0.8, 0.2)    # 2x Klopfen an Holztuer
def R_steps():   return rec("0085", 0.05, 2.4, 0.45, 0.01, 0.3)          # Schritte auf Kies
def R_shatter(): return reverb(rec("1643", 0.0, 1.77, 0.75, 0.001, 0.2), 0.7, 0.18)  # zerbrechendes Porzellan
def R_slide():   return reverb(rec("1268", 2.0, 1.4, 0.6, 0.02, 0.25), 0.7, 0.2)     # Holz gleitet (Schiebetuer)
def R_snore():   return reverb(rec("0653", 0.2, 6.6, 0.45, 0.1, 0.6), 0.9, 0.3)      # Schnarchen nebenan (gedaempft)
def R_clock():   return rec("2655", 0.2, 3.0, 0.4, 0.05, 0.3)            # mechanische Uhr
def R_paper():   return rec("0297", 0.45, 1.2, 0.4, 0.01, 0.2)           # Klebeband / Papier
def R_crackle(): return reverb(rec("2205", 0.0, 1.97, 0.35, 0.01, 0.4), 1.2, 0.35)   # knisterndes Salz
def R_birds():   return rec("0222", 20.0, 3.0, 0.25, 0.5, 0.8)
SFX = {k[2:]: v for k, v in globals().items() if k.startswith("S_")}
SFX.update({k[2:]: v for k, v in globals().items() if k.startswith("R_")})


# ---------------------------------------------------------------- ambience beds
def A_day(d):
    tt = t_(d)
    c = bp(noise(d), 4200, 6500) * (0.55 + 0.45 * np.sin(2 * np.pi * 28 * tt)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.23 * tt))
    w = lp(noise(d), 350) * 0.25
    return (c * 0.11 + w * 0.12).astype(np.float32)


def A_day_fade(d):
    x = A_day(d); x *= np.linspace(1, 0, len(x)) ** 1.5; return x


def A_room(d):
    tt = t_(d)
    return (lp(noise(d), 200) * 0.05 + np.sin(2 * np.pi * 100 * tt) * 0.004).astype(np.float32)


def A_night(d):
    tt = t_(d)
    w = lp(noise(d), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * tt + 1) ** 2) * 0.22
    cr = bp(noise(d), 3800, 4600) * (np.sin(2 * np.pi * 2.2 * tt) > 0.6) * 0.02
    return (w + cr).astype(np.float32)


def A_dawn(d):
    tt = t_(d)
    return (lp(noise(d), 400) * 0.1 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.1 * tt))).astype(np.float32)


def A_day(d):
    c = rec("3002", 2.0, d, rms=0.035, fin=0.3, fout=0.3)
    w = rec("0097", 10.0, d, rms=0.015, fin=0.3, fout=0.3)
    m = min(len(c), len(w)); return (c[:m] + w[:m]).astype(np.float32)


def A_night(d):
    n = rec("0110", 5.0, d, rms=0.03, fin=0.3, fout=0.3)
    tt = t_(len(n) / SR)
    w = lp(noise(len(n) / SR), 400) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.17 * tt + 1) ** 2) * 0.12
    m = min(len(n), len(w)); return (n[:m] + w[:m]).astype(np.float32)


def A_dawn(d):
    b = rec("0222", 40.0, d, rms=0.02, fin=0.6, fout=0.4)
    w = lp(noise(len(b) / SR), 400) * 0.06; m = min(len(b), len(w)); return (b[:m] + w[:m]).astype(np.float32)


AMB = {"day": A_day, "day_fade": A_day_fade, "room": A_room, "night": A_night, "dawn": A_dawn}


def drone(d):
    tt = t_(d)
    x = np.zeros(len(tt), np.float32)
    for f, a in [(43.65, 0.5), (44.1, 0.4), (65.4, 0.25), (87.3, 0.18), (92.5, 0.08)]:
        x += np.sin(2 * np.pi * f * tt + rng.uniform(0, 6)).astype(np.float32) * a
    x += lp(signal.sawtooth(2 * np.pi * 87.3 * tt).astype(np.float32), 300) * 0.12
    x *= (0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * tt))
    return x * 0.16


# ---------------------------------------------------------------- voices
def voice(shot, k, seg):
    if VOICE_DIR:
        for ext in ("wav", "mp3"):
            p = os.path.join(VOICE_DIR, f"{shot['id']}_{k}.{ext}")
            if os.path.exists(p): break
        if os.path.exists(p):
            x = trim(load(p), 0.02)
            SIL = "silenceremove=stop_periods=-1:stop_duration={d}:stop_threshold=-38dB:stop_silence={d}"
            if seg["v"] == "po":   # tiefer, hohler Klang mit langem Hall
                x = ffx(x, SIL.format(d=0.32) + ",asetrate=44100*0.8,aresample=44100,atempo=1.15,lowpass=f=1800")
                return norm(reverb(x, 2.6, 0.55, 0.05), 0.8), len(x) / SR
            if seg["v"] == "oma":  # gefilterte, leicht zitternde Stimme hinter der Tuer
                x = ffx(x, SIL.format(d=0.25) + ",atempo=1.05,highpass=f=200,lowpass=f=4500,tremolo=f=5:d=0.12")
                return norm(reverb(x, 1.6, 0.45), 0.7), len(x) / SR
            if seg["v"] == "opa":
                x = ffx(x, SIL.format(d=0.25) + ",asetrate=44100*0.96,aresample=44100,atempo=1.1,highpass=f=120,lowpass=f=5000")
                return norm(reverb(x, 1.2, 0.35), 0.72), len(x) / SR
            x = ffx(x, SIL.format(d=0.2) + ",atempo=1.15,highpass=f=70,acompressor=threshold=0.1:ratio=2.5:attack=5:release=80")
            return norm(x, 0.85), len(x) / SR
    base = os.path.join(B, "tts", f"{shot['id']}_{k}")
    v, txt = seg["v"], seg["t"]
    if v == "narr":
        x = tts("de_thorsten.onnx", txt, base + ".wav", 0.93, 0.55)
        x = ffx(trim(x), "highpass=f=70,equalizer=f=180:t=q:w=1:g=3,acompressor=threshold=0.1:ratio=3:attack=5:release=80")
        return norm(x, 0.85), len(x) / SR
    if v == "po":
        x = tts("de_thorsten.onnx", txt, base + "_v2.wav", 1.05, 0.3)
        x = ffx(trim(x), "asetrate=44100*0.72,aresample=44100,atempo=1.25,lowpass=f=1800")
        return norm(reverb(x, 2.6, 0.55, 0.05), 0.8), len(x) / SR
    if v == "oma":
        x = tts("de_kerstin.onnx", txt, base + ".wav", 1.0, 0.5)
        x = ffx(trim(x), "asetrate=44100*0.93,aresample=44100,atempo=1.0,highpass=f=200,lowpass=f=4500,tremolo=f=5:d=0.15")
        return norm(reverb(x, 1.6, 0.45), 0.7), len(x) / SR
    if v == "opa":
        x = tts("de_thorsten.onnx", txt, base + ".wav", 1.08, 0.5)
        x = ffx(trim(x), "asetrate=44100*0.9,aresample=44100,atempo=1.04,highpass=f=120,lowpass=f=5000")
        return norm(reverb(x, 1.2, 0.35), 0.72), len(x) / SR
    raise ValueError(v)


def chunks(sub, start, dur):
    words = sub.split()
    toks, red = [], False
    for w in words:
        n = w.count("*")
        starts = w.lstrip("„").startswith("*")
        if starts: red = True
        toks.append({"w": w.replace("*", ""), "red": red})
        if n == 2 or (n == 1 and not starts):
            red = False
    groups, cur = [], []
    for tk in toks:
        cur.append(tk)
        ln = sum(len(x["w"]) for x in cur) + len(cur) - 1
        if len(cur) >= 3 or ln >= 15 or tk["w"][-1] in ".:?!,“":
            groups.append(cur); cur = []
    if cur: groups.append(cur)
    tot = sum(sum(len(x["w"]) for x in g) + 2 for g in groups)
    out, t = [], start
    for g in groups:
        d = dur * (sum(len(x["w"]) for x in g) + 2) / tot
        out.append({"s": round(t, 3), "e": round(t + d, 3), "words": g}); t += d
    return out


def main():
    data = json.load(open(os.path.join(HERE, "shots.json")))
    shots = data["shots"]
    cur = 0.0
    vox_parts, tl = [], []
    for sh in shots:
        s0 = cur
        segs = []
        for k, seg in enumerate(sh["segs"]):
            x, d = voice(sh, k, seg)
            vox_parts.append((cur, x))
            segs.append({"v": seg["v"], "s": round(cur, 3), "e": round(cur + d, 3), "chunks": chunks(seg["sub"], cur, d)})
            cur += d + (0.22 if k < len(sh["segs"]) - 1 else 0.14)
        cur += sh.get("hold", 0.0)
        e = {k: v for k, v in sh.items() if k not in ("segs",)}
        e.update({"s": round(s0, 3), "e": round(cur, 3), "segs": segs})

        def at(spec):
            if "atSeg" in spec:
                i, o = spec["atSeg"]; g = segs[i]
                return (g["e"] + o) if o < 0 else (g["s"] + o)
            if "atEnd" in spec: return cur + spec["atEnd"]
            return s0 + spec.get("at", 0)
        for key in ("card", "rule"):
            if key in sh:
                e[key] = dict(sh[key]); e[key]["t"] = round(at(sh[key]) if ("atSeg" in sh[key] or "at" in sh[key]) else s0, 3)
        e["sfx"] = [{"n": f["n"], "t": round(at(f), 3)} for f in sh.get("sfx", [])]
        tl.append(e)
    total = cur
    N = int((total + 0.5) * SR)
    vox = np.zeros(N, np.float32)
    for st, x in vox_parts:
        i = int(st * SR); vox[i:i + len(x)] += x[: N - i]

    fx = np.zeros(N, np.float32)
    cache = {}
    for sh in tl:
        for f in sh["sfx"]:
            if f["n"] not in cache: cache[f["n"]] = SFX[f["n"]]()
            x = cache[f["n"]]; i = int(f["t"] * SR)
            if i < 0: x = x[-i:]; i = 0
            fx[i:i + len(x)] += x[: N - i]

    # ambience beds, crossfaded per run of equal "amb"
    amb = np.zeros(N, np.float32)
    runs = []
    for sh in tl:
        a = sh.get("amb")
        if runs and runs[-1][0] == a: runs[-1][2] = sh["e"]
        else: runs.append([a, sh["s"], sh["e"]])
    for a, s, e in runs:
        if not a: continue
        x = AMB[a](e - s + 0.6); x *= env(len(x), 0.3, 0.6)
        i = int(max(0, s - 0.3) * SR); amb[i:i + len(x)] += x[: N - i]

    # music drone: from the roulette lock-in to the stinger, slowly rising
    t_lock = tl[0]["e"]; t_sting = next(f["t"] for sh in tl for f in sh["sfx"] if f["n"] == "stinger")
    mus = np.zeros(N, np.float32)
    d = drone(t_sting - t_lock + 0.4)
    ramp = np.linspace(0.65, 1.5, len(d)) * env(len(d), 1.2, 0.35)
    i = int(t_lock * SR); mus[i:i + len(d)] += (d * ramp)[: N - i]
    # roulette music under the hook: pulsing low synth
    hk = drone(t_lock + 0.3) * 0.9 * (0.6 + 0.4 * (np.sin(2 * np.pi * 2 * t_(t_lock + 0.3)) > 0))
    mus[: len(hk)] += lp(hk, 600) * env(len(hk), 0.05, 0.3)

    # ducking of beds under the voice
    ve = np.abs(vox); ve = lp(ve, 8) * 3; duck = 1 - 0.45 * np.clip(ve / 0.25, 0, 1)
    mix = vox * 1.0 + fx * 0.85 + (amb + mus) * duck
    mix = np.tanh(mix * 1.05) * 0.97
    wavfile.write(os.path.join(B, "audio.wav"), SR, (mix * 32767).astype(np.int16))
    json.dump({"total": round(total, 3), "monster": data["monster"], "shots": tl},
              open(os.path.join(B, "timeline.json"), "w"), ensure_ascii=False, indent=1)
    print(f"Laenge: {total:.2f}s, Shots: {len(tl)}")
    for sh in tl:
        print(f"  {sh['s']:6.2f}-{sh['e']:6.2f}  {sh['id']:9s} {sh['scene']}")


if __name__ == "__main__":
    main()
