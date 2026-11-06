#!/usr/bin/env python3
"""Baut ein Gruselvideo aus einer story.json.

Ablauf: Stimme pro Zeile (Piper-Platzhalter oder eigene Dateien) -> Timeline
(Shots, Wort-Timings, Chat-Nachrichten, Effekte) -> Tonmischung -> Render.

Nutzung:  python3 engine/build.py stories/01_klopf_klopf [--voice-dir DIR]
  --voice-dir: Ordner mit eigenen Sprachdateien (z. B. ElevenLabs) namens
               001.mp3, 002.mp3 ... (eine Datei pro Zeile, in Reihenfolge).
"""
import argparse, hashlib, json, os, re, subprocess, sys, wave
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.join(ROOT, "engine")
SR = 44100
PIPER_MODEL = os.environ.get("PIPER_MODEL", os.path.join(ROOT, ".cache", "piper", "de.onnx"))

GAP_LINE = 0.18   # Pause zwischen Zeilen
GAP_SHOT = 0.30   # zusätzliche Pause bei Szenenwechsel
LEAD_IN = 0.35    # Stille am Anfang


def sh(*cmd, **kw):
    subprocess.run(cmd, check=True, **kw)


def load_wav(path):
    """Beliebige Audiodatei -> mono float32 @ SR."""
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ac", "1", "-ar", str(SR),
                          "-f", "f32le", "-"], check=True, capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()


def trim(a, thr=0.01):
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    s = max(0, idx[0] - int(0.03 * SR)); e = min(len(a), idx[-1] + int(0.06 * SR))
    return a[s:e]


def tts_piper(text, cache):
    key = hashlib.md5(("v2" + text).encode()).hexdigest()[:12]
    out = os.path.join(cache, key + ".wav")
    if not os.path.exists(out):
        subprocess.run([sys.executable, "-m", "piper", "-m", PIPER_MODEL, "-f", out,
                        "--length-scale", "1.12", "--sentence-silence", "0.22"],
                       input=text.encode(), check=True, capture_output=True)
    return out


# ---------------------------------------------------------------- Effekte
def env(n, attack=0.005, decay=10.0):
    t = np.arange(n) / SR
    return np.minimum(1, t / attack) * np.exp(-decay * t)


SFX_DIR = os.path.join(ENGINE, "sfx")
# Spitzenpegel der echten Aufnahmen (0..1); Atmosphären: Ziel-Lautstärke (RMS)
REC_PEAK = {"owl": .16, "steps": .32, "twig": .38, "zipper": .42, "heartbeat": .5, "rev": .34, "static": .2, "carby": .3}
AMB_RMS = {"car": .028, "forest": .011}
_rec_cache = {}


def rec(name):
    path = os.path.join(SFX_DIR, name + ".ogg")
    if not os.path.exists(path):
        return None
    if name not in _rec_cache:
        a = load_wav(path)
        _rec_cache[name] = a / (np.abs(a).max() + 1e-9) * REC_PEAK.get(name, .35)
    return _rec_cache[name]


def sfx(name):
    r = rec(name)
    if r is not None:
        return r
    rng = np.random.default_rng(len(name))
    if name == "knock":
        n = int(0.35 * SR); t = np.arange(n) / SR
        body = np.sin(2 * np.pi * 95 * t) * 0.9 + np.sin(2 * np.pi * 180 * t) * 0.35
        noise = rng.standard_normal(n) * np.exp(-60 * t) * 0.5
        return (body * env(n, 0.002, 18) + noise) * 0.9
    if name == "ping":
        out = []
        for f in (1318, 1760):
            n = int(0.16 * SR); t = np.arange(n) / SR
            out.append(np.sin(2 * np.pi * f * t) * env(n, 0.003, 22) * 0.35)
        return np.concatenate(out)
    if name == "buzz":
        parts = []
        for _ in range(2):
            n = int(0.32 * SR); t = np.arange(n) / SR
            w = np.sign(np.sin(2 * np.pi * 160 * t)) * 0.18 * (0.6 + 0.4 * np.sin(2 * np.pi * 25 * t))
            parts += [w * np.minimum(1, t / 0.02), np.zeros(int(0.12 * SR))]
        return np.concatenate(parts)
    if name == "boom":
        n = int(2.2 * SR); t = np.arange(n) / SR
        f = 58 * np.exp(-0.6 * t) + 28
        ph = 2 * np.pi * np.cumsum(f) / SR
        return np.sin(ph) * env(n, 0.01, 1.8) * 0.9
    if name == "creak":
        n = int(1.8 * SR); t = np.arange(n) / SR
        f = 210 + 60 * np.sin(2 * np.pi * 0.7 * t) + 15 * np.sin(2 * np.pi * 11 * t)
        ph = 2 * np.pi * np.cumsum(f) / SR
        saw = (ph / (2 * np.pi)) % 1.0 * 2 - 1
        am = np.clip(np.sin(np.pi * t / 1.8), 0, 1) ** 1.5
        return saw * am * 0.07
    if name == "click":    # Lichtschalter
        n = int(.06 * SR); t = np.arange(n) / SR
        return (rng.standard_normal(n) * np.exp(-140 * t) * .7 + np.sin(2 * np.pi * 900 * t) * np.exp(-90 * t) * .4)
    if name == "tick":
        n = int(.035 * SR); t = np.arange(n) / SR
        return np.sin(2 * np.pi * 2600 * t) * np.exp(-160 * t) * .35
    if name == "flicker":  # Glühbirne springt an
        n = int(.35 * SR); t = np.arange(n) / SR
        return np.sign(np.sin(2 * np.pi * 100 * t)) * (rng.random(n // 300 + 1) > .4).repeat(300)[:n] * .05 * np.exp(-4 * t)
    if name == "zipper":   # Reißverschluss, langsam
        n = int(2.2 * SR); t = np.arange(n) / SR
        teeth = (np.sin(2 * np.pi * (18 + 4 * np.sin(t * 2)) * t) > .7).astype(float)
        return rng.standard_normal(n) * teeth * .16 * np.minimum(1, t / .1) * np.minimum(1, (2.2 - t) / .2)
    if name == "twig":     # Ast knackt
        n = int(.25 * SR); t = np.arange(n) / SR
        return (rng.standard_normal(n) * np.exp(-55 * t) * .9 + np.sin(2 * np.pi * 380 * t) * np.exp(-40 * t) * .3) * (t < .02 + 0.0 + 1)
    if name == "steps":    # Schritte im Laub, langsam ums Zelt
        out = np.zeros(int(3.6 * SR))
        for k in range(6):
            i = int((.15 + k * .58) * SR); m = int(.22 * SR); tt = np.arange(m) / SR
            crunch = np.convolve(rng.standard_normal(m), np.ones(4) / 4, "same") * (rng.random(m // 120 + 1) > .45).repeat(120)[:m]
            out[i:i + m] += crunch * np.exp(-12 * tt) * (.5 + .15 * k)
        return out * .5
    if name == "owl":      # Käuzchen in der Ferne
        out = []
        for d, f in ((.45, 420), (.12, 0), (.7, 400)):
            n = int(d * SR); t = np.arange(n) / SR
            out.append(np.sin(2 * np.pi * f * t * (1 - .04 * t)) * np.sin(np.pi * t / max(d, 1e-3)) ** 1.5 * .09 if f else np.zeros(n))
        return np.convolve(np.concatenate(out), np.ones(30) / 30, "same")
    if name == "heartbeat":
        out = np.zeros(int(4.2 * SR))
        for k in range(6):
            for off, a_ in ((0, 1), (.18, .7)):
                i = int((k * .68 + off) * SR); m = int(.16 * SR); tt = np.arange(m) / SR
                out[i:i + m] += np.sin(2 * np.pi * 52 * tt) * np.exp(-26 * tt) * a_ * (.6 + .08 * k)
        return out * .9
    if name == "rev":      # Motor heult auf
        n = int(1.8 * SR); t = np.arange(n) / SR
        f = 34 + 40 * np.clip(t / 1.0, 0, 1) - 12 * np.clip((t - 1.0) / .8, 0, 1)
        ph = 2 * np.pi * np.cumsum(f) / SR
        return (np.sign(np.sin(ph)) * .05 + np.sin(2 * ph) * .05) * np.sin(np.pi * t / 1.8)
    if name == "whoosh":   # vorbeirauschend
        n = int(1.2 * SR); t = np.arange(n) / SR
        return np.convolve(rng.standard_normal(n), np.ones(25) / 25, "same") * np.sin(np.pi * t / 1.2) ** 2 * 1.6
    if name == "copier":   # Kopierer: rhythmisches Rattern
        n = int(4.0 * SR); t = np.arange(n) / SR
        mech = np.sin(2 * np.pi * 7 * t) > .6
        return (rng.standard_normal(n) * mech * .08 + np.sin(2 * np.pi * 140 * t) * .04) * np.minimum(1, t / .2) * np.minimum(1, (4 - t) / .3)
    if name == "ding":     # Aufzug-Gong
        out = []
        for f in (1046, 784):
            n = int(.7 * SR); t = np.arange(n) / SR
            out.append((np.sin(2 * np.pi * f * t) + .3 * np.sin(2 * np.pi * 2 * f * t)) * env(n, .004, 4.5) * .3)
        return np.concatenate([out[0][:int(.32 * SR)] + 0, out[1]])
    if name == "doors":    # Aufzugtüren gleiten
        n = int(1.0 * SR); t = np.arange(n) / SR
        return np.convolve(rng.standard_normal(n), np.ones(80) / 80, "same") * np.sin(np.pi * t) * 1.2 + np.sin(2 * np.pi * 60 * t) * .03 * np.sin(np.pi * t)
    if name == "intercom": # Lautsprecher knackt
        n = int(.5 * SR); t = np.arange(n) / SR
        return rng.standard_normal(n) * (rng.random(n // 200 + 1) > .5).repeat(200)[:n] * .15 * np.exp(-3 * t)
    if name == "tap":      # Fingernagel/Knöchel an Glas
        n = int(0.12 * SR); t = np.arange(n) / SR
        return (np.sin(2 * np.pi * 2100 * t) * .5 + np.sin(2 * np.pi * 3400 * t) * .3
                + rng.standard_normal(n) * .4 * np.exp(-90 * t)) * env(n, .001, 45) * .5
    if name == "static":   # Babyfon-Rauschen mit Knacken
        n = int(1.4 * SR); t = np.arange(n) / SR
        noise = rng.standard_normal(n)
        noise = noise - np.convolve(noise, np.ones(6) / 6, "same")
        gate = (rng.random(n // 400 + 1) > .25).repeat(400)[:n]
        return noise * gate * np.minimum(1, t / .05) * np.minimum(1, (1.4 - t) / .3) * .12
    if name == "hum":      # gesummtes Schlaflied, dumpf wie aus dem Babyfon
        notes = [330, 392, 440, 392, 330, 294, 330, 262]
        out = []
        for f in notes:
            n = int(.55 * SR); t = np.arange(n) / SR
            vib = 1 + .006 * np.sin(2 * np.pi * 5.5 * t)
            ph = 2 * np.pi * np.cumsum(f * vib) / SR
            tone = np.sin(ph) * .6 + np.sin(2 * ph) * .25 + np.sin(3 * ph) * .1
            out.append(tone * np.sin(np.pi * np.clip(t / .55, 0, 1)) ** .6)
        s_ = np.concatenate(out)
        s_ += rng.standard_normal(len(s_)) * .05
        return s_ * .14
    if name == "breath":   # langsames Atmen
        n = int(3.6 * SR); t = np.arange(n) / SR
        noise = np.convolve(rng.standard_normal(n), np.ones(30) / 30, "same")
        envb = np.sin(np.pi * ((t % 1.8) / 1.8)) ** 3
        return noise * envb * 2.2
    raise ValueError(name)


def ambience(kind, dur):
    n = int(dur * SR); t = np.arange(n) / SR; rng = np.random.default_rng(3)
    fade = np.minimum(1, t / 1.5) * np.minimum(1, (dur - t) / 1.5)
    path = os.path.join(SFX_DIR, "amb_" + kind + ".ogg")
    if os.path.exists(path):          # echte Aufnahme, nahtlos geloopt (Überblendung 2 s)
        a = load_wav(path); x = int(2 * SR); out = np.zeros(n); pos = 0
        while pos < n:
            seg = a[: min(len(a), n - pos)].copy()
            if pos: seg[:x] *= np.linspace(0, 1, x)[: len(seg[:x])]; out[pos:pos + x] *= np.linspace(1, 0, x)[: len(out[pos:pos + x])]
            out[pos:pos + len(seg)] += seg; pos += len(a) - x
        out *= AMB_RMS.get(kind, .03) / (np.sqrt(np.mean(out ** 2)) + 1e-9)
        return out * fade
    if kind == "forest":   # Grillen + leiser Wind
        out = np.zeros(n)
        for f0, rate, ph in ((4300, 2.6, 0), (4700, 3.1, 1.3)):
            chirp = (np.sin(2 * np.pi * rate * t + ph) > .55) * (np.sin(2 * np.pi * 34 * t) > 0)
            out += np.sin(2 * np.pi * f0 * t) * chirp * .012
        wind = np.convolve(rng.standard_normal(n), np.ones(900) / 900, "same") * 1.6
        return (out + wind * (.5 + .5 * np.sin(t * .4))) * fade
    if kind == "car":      # Motor + Abrollgeräusch
        eng = np.sin(2 * np.pi * 38 * t) * .08 + np.sin(2 * np.pi * 76 * t) * .04
        road = np.convolve(rng.standard_normal(n), np.ones(60) / 60, "same") * .5
        return (eng + road) * fade
    if kind == "office":   # Lüftung + Rechnersummen
        return (np.convolve(rng.standard_normal(n), np.ones(400) / 400, "same") * 1.4
                + np.sin(2 * np.pi * 120 * t) * .008 + np.sin(2 * np.pi * 50 * t) * .012) * fade
    if kind == "elevator": # Motorbrummen + Seilgeräusch
        return (np.sin(2 * np.pi * 55 * t) * .035 + np.sin(2 * np.pi * 110 * t) * .015
                + np.convolve(rng.standard_normal(n), np.ones(200) / 200, "same") * .6) * fade
    if kind == "bus":      # Dieselmotor + Klappern
        eng = np.sin(2 * np.pi * 32 * t) * .07 + np.sin(2 * np.pi * 64 * t + np.sin(t * 3)) * .035
        rattle = rng.standard_normal(n) * (np.sin(2 * np.pi * 7 * t) > .92) * .03
        return (eng + rattle + np.convolve(rng.standard_normal(n), np.ones(80) / 80, "same") * .45) * fade
    if kind == "cellar":   # Stromsummen + Tropfen
        hum = np.sin(2 * np.pi * 50 * t) * .02 + np.sin(2 * np.pi * 100 * t) * .012
        drops = np.zeros(n)
        for d in np.arange(1.7, dur, 2.9):
            i = int(d * SR); m = min(n - i, int(.08 * SR)); tt = np.arange(m) / SR
            drops[i:i + m] += np.sin(2 * np.pi * (1500 - 6000 * tt) * tt) * np.exp(-50 * tt) * .08
        return (hum + drops) * fade
    return np.zeros(n)


def drone(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    rng = np.random.default_rng(7)
    brown = np.cumsum(rng.standard_normal(n)); brown -= np.convolve(brown, np.ones(4000) / 4000, "same")
    brown /= (np.abs(brown).max() + 1e-9)
    tone = (np.sin(2 * np.pi * 55 * t) * 0.5 + np.sin(2 * np.pi * 82.4 * t + 1) * 0.3
            + np.sin(2 * np.pi * 110.7 * t) * 0.12) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t))
    fade = np.minimum(1, t / 2.0) * np.minimum(1, (dur - t) / 1.5)
    return (tone * 0.06 + brown * 0.018) * fade


# ---------------------------------------------------------------- Timeline
def tokens(text):
    text = re.sub(r"[„“\"»«]", "", text)
    return text.split()


def norm(w):
    return re.sub(r"[^\wäöüÄÖÜß:]", "", w).lower()


def word_times(words, start, dur):
    """Verteilt Wörter proportional zur Silbenlänge über die Sprechdauer."""
    weights = []
    for w in words:
        base = max(2, len(norm(w)))
        if re.match(r"\d+:\d+", norm(w)):
            base = 18          # "3:33" wird lang gesprochen
        if re.search(r"[.,!?:–]$", w):
            base += 4          # Satzpause
        weights.append(base)
    weights = np.array(weights, float)
    cum = np.concatenate([[0], np.cumsum(weights)])[:-1] / weights.sum()
    return [start + c * dur for c in cum]


def resolve(spec, line):
    if isinstance(spec, (int, float)):
        return line["start"] + spec
    if spec.startswith("shot"):
        return line["shotStart"] + float(spec[4:] or 0)
    if spec.startswith("start"):
        return line["start"] + float(spec[5:] or 0)
    if spec.startswith("end"):
        return line["end"] + float(spec[3:] or 0)
    if spec.startswith("word"):
        m = re.match(r"(\d+)([+-][\d.]+)?$", spec[4:])
        return line["wordTimes"][int(m.group(1))] + float(m.group(2) or 0)
    raise ValueError(spec)


def align_voice(path, story):
    """Fertige Sprachaufnahme (z. B. ElevenLabs) mit Whisper transkribieren und jedem Skriptwort
    seinen Zeitpunkt zuordnen. Gibt pro Zeile Start, Ende und Wortzeiten (Audio-Zeit) zurück."""
    import difflib
    from faster_whisper import WhisperModel
    audio = load_wav(path)
    a16 = np.interp(np.arange(0, len(audio), SR / 16000), np.arange(len(audio)), audio).astype(np.float32)
    model = WhisperModel("small", device="cpu", compute_type="int8")
    segs, _ = model.transcribe(a16, language="de", word_timestamps=True)
    hw = [(norm(w.word), w.start, w.end) for sg in segs for w in sg.words if norm(w.word)]
    lines = [l for sh in story["shots"] for l in sh["lines"]]
    sw, owner = [], []
    for i, l in enumerate(lines):
        for w in tokens(l.get("say", l["text"])):
            sw.append(norm(w)); owner.append(i)
    st, en = [None] * len(sw), [None] * len(sw)
    sm = difflib.SequenceMatcher(None, sw, [h[0] for h in hw], autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            st[blk.a + k], en[blk.a + k] = hw[blk.b + k][1], hw[blk.b + k][2]
    # Lücken (z. B. "dreiunddreißig" vs. "33") zwischen Nachbarn interpolieren
    known = [i for i in range(len(sw)) if st[i] is not None]
    for i in range(len(sw)):
        if st[i] is None:
            prv = max([k for k in known if k < i], default=None); nxt = min([k for k in known if k > i], default=None)
            a_ = en[prv] if prv is not None else 0.0
            b_ = st[nxt] if nxt is not None else a_ + .4
            gap = [k for k in range(len(sw)) if (prv is None or k > prv) and (nxt is None or k < nxt)]
            j = gap.index(i); step = (b_ - a_) / (len(gap) + 0.0)
            st[i], en[i] = a_ + j * step, a_ + (j + 1) * step
    out = []
    for i, l in enumerate(lines):
        idx = [k for k in range(len(sw)) if owner[k] == i]
        out.append({"start": st[idx[0]], "end": en[idx[-1]], "say": [sw[k] for k in idx], "times": [st[k] for k in idx]})
    return out, audio


def caption_times(toks, A):
    """Untertitel-Wörter auf die Wortzeiten der gesprochenen Fassung abbilden."""
    import difflib
    cap = [norm(w) for w in toks]
    res = [None] * len(cap)
    for tag, a0, a1, b0, b1 in difflib.SequenceMatcher(None, cap, A["say"], autojunk=False).get_opcodes():
        for k in range(a0, a1):
            res[k] = A["times"][b0 + (k - a0)] if tag == "equal" else A["times"][min(b0, len(A["times"]) - 1)] if b1 > b0 else None
    for k in range(len(res)):
        if res[k] is None:
            res[k] = res[k - 1] + .15 if k else A["start"]
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("story")
    ap.add_argument("--voice-dir")
    ap.add_argument("--voice-file", help="eine fertige Sprachaufnahme für das ganze Video")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--stills", help="nur Einzelbilder, z. B. 1,5,9")
    ap.add_argument("--preview", action="store_true", help="halbe Auflösung, schneller")
    args = ap.parse_args()

    sdir = os.path.abspath(args.story)
    story = json.load(open(os.path.join(sdir, "story.json")))
    cache = os.path.join(ROOT, ".cache", "tts"); os.makedirs(cache, exist_ok=True)
    outdir = os.path.join(ROOT, "output"); os.makedirs(outdir, exist_ok=True)
    name = os.path.basename(sdir)

    voice_files = sorted(os.listdir(args.voice_dir)) if args.voice_dir else None
    aligned = None
    if args.voice_file:
        aligned, full = align_voice(args.voice_file, story)
        json.dump(aligned, open(os.path.join(outdir, name + ".align.json"), "w"), ensure_ascii=False, indent=1)
    t = LEAD_IN
    shots, words, groups, msgs, typing, knocks, handle, voice, sfx_ev = [], [], [], [], [], [], [], [], []
    reveal = []
    taps, hums, quotes, eyes = [], [], [], None
    ev = {}
    li = 0
    for si, shot in enumerate(story["shots"]):
        if aligned:
            first = LEAD_IN + aligned[li]["start"]
            t = 0.0 if si == 0 else max(last_end + .05, first - .3)
        elif si:
            t += GAP_SHOT
        s_start = t
        line_times = []
        for line in shot["lines"]:
            toks = tokens(line["text"])
            if aligned:
                A = aligned[li]; li += 1
                t, dur = LEAD_IN + A["start"], A["end"] - A["start"]
                L = {"start": t, "end": t + dur, "shotStart": s_start}
                L["wordTimes"] = [LEAD_IN + x for x in caption_times(toks, A)]
            else:
                if voice_files:
                    path = os.path.join(args.voice_dir, voice_files[li])
                else:
                    path = tts_piper(line.get("say", re.sub(r"[„“]", "", line["text"])), cache)
                a = trim(load_wav(path))
                li += 1
                dur = len(a) / SR
                L = {"start": t, "end": t + dur, "shotStart": s_start}
                voice.append((t, a))
                L["wordTimes"] = word_times(toks, t, dur)
            line_times.append([t, t + dur]); last_end = t + dur
            hl = {norm(k): v for k, v in line.get("hl", {}).items()}
            if not line.get("nocap"):
                g = None
                for i, (w, wt) in enumerate(zip(toks, L["wordTimes"])):
                    prev = toks[i - 1] if i else ""
                    if (g is None or len(g["words"]) >= 3 or g["chars"] + len(w) > 15
                            or re.search(r"[.,!?:–]$", prev)):
                        g = {"start": wt, "words": [], "chars": 0}
                        groups.append(g)
                    words.append({"w": w.upper(), "t": wt, "c": hl.get(norm(w), "")})
                    g["words"].append(len(words) - 1); g["chars"] += len(w) + 1
            m = line.get("msg")
            if m:
                mt = L["wordTimes"][m["atWord"]] if "atWord" in m else t
                chat = m.get("chat", shot.get("contact"))
                if m.get("typing"):
                    typing.append([mt, mt + m["typing"], chat]); mt += m["typing"]
                msgs.append({"from": m["from"], "text": m["text"], "t": mt, "chat": chat})
                if m["from"] == "them":
                    sfx_ev.append((mt, "ping"))
            for name_, spec in line.get("sfx", []):
                sfx_ev.append((resolve(spec, L), name_))
            for spec in line.get("knocks", []):
                knocks.append(resolve(spec, L))
            for e in line.get("ev", []):
                vals = [resolve(e[1], L)] + [resolve(a, L) if isinstance(a, str) and re.match(r"^(start|end|word|shot)", a) else a for a in e[2:]]
                ev.setdefault(e[0], []).append(vals)
                if e[0] == "press":
                    sfx_ev.append((vals[0], "click"))
                if e[0] == "light" and vals[1] and vals[0] > 0.5:
                    sfx_ev.append((vals[0], "flicker"))
                if e[0] == "timer":     # tickt in den letzten 5 angezeigten Sekunden
                    t0, frm, t1 = vals
                    for k in range(min(5, int(frm)), 0, -1):
                        sfx_ev.append((t0 + (frm - k) / frm * (t1 - t0), "tick"))
            for spec in line.get("taps", []):
                taps.append(resolve(spec, L))
            if line.get("hum"):
                hums.append([L["start"], L["end"] + line.get("pause", 0) + 2.5])
            if line.get("quote"):
                q = line["quote"]
                quotes.append({"start": L["start"], "end": L["end"] + line.get("pause", 0) + .2, **q})
            if line.get("eyes"):
                eyes = L["start"]
            if line.get("reveal"):
                reveal = [L["start"], L["end"] + line.get("pause", 0)]
            if line.get("handle"):
                handle = [L["start"], L["end"] + line.get("pause", 0)]
            if aligned:
                t = LEAD_IN + aligned[li]["start"] if li < len(aligned) else L["end"] + max(1.2, line.get("pause", 0))
            else:
                t = L["end"] + line.get("pause", 0) + GAP_LINE
            L["capEnd"] = L["end"] + 0.25
            for g in groups:
                if "end" not in g:
                    g["end"] = None
            # Gruppen dieser Zeile beenden
            line_groups = [g for g in groups if g["end"] is None]
            for a_, b_ in zip(line_groups, line_groups[1:]):
                a_["end"] = b_["start"]
            if line_groups:
                line_groups[-1]["end"] = min(L["capEnd"], t)
        for name_, off in shot.get("sfx", []):
            sfx_ev.append((s_start + off, name_))
        sh_ = {k: v for k, v in shot.items() if k not in ("lines", "sfx")}
        sh_.update(start=s_start, end=t, lineTimes=line_times)
        shots.append(sh_)
    if aligned:
        voice.append((LEAD_IN, full))
        t = shots[-1]["end"]
    duration = t + 0.6
    shots[-1]["end"] = duration
    for a_, b_ in zip(shots, shots[1:]):
        a_["end"] = b_["start"]

    tl = {"fps": args.fps, "duration": duration, "series": story["series"], "episode": story["episode"],
          "title": story["title"], "part": story["part"], "question": story.get("question", ""), "shots": shots, "words": words,
          "groups": [{"start": g["start"], "end": g["end"], "words": g["words"]} for g in groups],
          "msgs": msgs, "typing": typing, "knocks": knocks, "handle": handle, "reveal": reveal,
          "taps": taps, "hums": hums, "quotes": quotes, "eyes": eyes, "ev": {k: sorted(v) for k, v in ev.items()},
          **{k: story[k] for k in ("item", "visitor", "endArt", "bedLegs", "openMax", "set") if k in story}}
    tl_path = os.path.join(outdir, name + ".timeline.json")
    json.dump(tl, open(tl_path, "w"), ensure_ascii=False, indent=1)

    # ---- Ton mischen
    n = int(duration * SR) + SR
    amb = ambience(story.get("ambience", ""), n / SR)
    mix = drone(n / SR)
    mix = mix[:n] if len(mix) >= n else np.pad(mix, (0, n - len(mix)))
    mix += np.pad(amb, (0, max(0, n - len(amb))))[:n]
    vo = np.zeros(n)
    for st, a in voice:
        i = int(st * SR); vo[i:i + len(a)] += a[: n - i]
    vo /= (np.abs(vo).max() + 1e-9); vo *= 0.85
    mix += vo
    for st, nm in sfx_ev:
        s = sfx(nm); i = int(st * SR); mix[i:i + len(s)] += s[: n - i]
    if ev.get("dread"):
        d0 = ev["dread"][0][0]; i0 = int(d0 * SR); m = n - i0
        if m > 0:
            tt = np.arange(m) / SR
            swell = np.minimum(1, tt / 3.0) * (0.75 + 0.25 * np.sin(2 * np.pi * .13 * tt))
            rum = (np.sin(2 * np.pi * 36 * tt) * .6 + np.sin(2 * np.pi * 54.5 * tt) * .25
                   + np.convolve(np.random.default_rng(9).standard_normal(m), np.ones(1500) / 1500, "same") * 6)
            mix[i0:] += rum * swell * .09
    mix = np.tanh(mix * 1.1) * 0.92
    wav_path = os.path.join(outdir, name + ".wav")
    with wave.open(wav_path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())

    # ---- Bild rendern + muxen
    mp4 = os.path.join(outdir, name + ".mp4")
    if args.stills:
        sh("node", os.path.join(ENGINE, "render.js"), tl_path, wav_path, os.path.join(outdir, name + ".png"), "1", args.stills)
        return
    sh("node", os.path.join(ENGINE, "render.js"), tl_path, wav_path, mp4, "1" if args.preview else "2")
    print("fertig:", mp4, f"({duration:.1f}s)")


if __name__ == "__main__":
    main()
