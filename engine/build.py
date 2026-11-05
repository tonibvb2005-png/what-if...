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


def sfx(name):
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
    raise ValueError(name)


def drone(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    rng = np.random.default_rng(7)
    brown = np.cumsum(rng.standard_normal(n)); brown -= np.convolve(brown, np.ones(4000) / 4000, "same")
    brown /= (np.abs(brown).max() + 1e-9)
    tone = (np.sin(2 * np.pi * 55 * t) * 0.5 + np.sin(2 * np.pi * 82.4 * t + 1) * 0.3
            + np.sin(2 * np.pi * 110.7 * t) * 0.12) * (0.75 + 0.25 * np.sin(2 * np.pi * 0.11 * t))
    fade = np.minimum(1, t / 2.0) * np.minimum(1, (dur - t) / 1.5)
    return (tone * 0.06 + brown * 0.05) * fade


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
    if spec.startswith("end"):
        return line["end"] + float(spec[3:] or 0)
    if spec.startswith("word"):
        return line["wordTimes"][int(spec[4:])]
    raise ValueError(spec)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("story")
    ap.add_argument("--voice-dir")
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
    t = LEAD_IN
    shots, words, groups, msgs, typing, knocks, handle, voice, sfx_ev = [], [], [], [], [], [], [], [], []
    reveal = []
    li = 0
    for si, shot in enumerate(story["shots"]):
        if si:
            t += GAP_SHOT
        s_start = t
        line_times = []
        for line in shot["lines"]:
            if voice_files:
                path = os.path.join(args.voice_dir, voice_files[li])
            else:
                path = tts_piper(line.get("say", re.sub(r"[„“]", "", line["text"])), cache)
            a = trim(load_wav(path))
            li += 1
            dur = len(a) / SR
            L = {"start": t, "end": t + dur}
            line_times.append([t, t + dur])
            voice.append((t, a))
            toks = tokens(line["text"])
            L["wordTimes"] = word_times(toks, t, dur)
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
            if line.get("reveal"):
                reveal = [L["start"], L["end"] + line.get("pause", 0)]
            if line.get("handle"):
                handle = [L["start"], L["end"] + line.get("pause", 0)]
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
    duration = t + 0.6
    shots[-1]["end"] = duration
    for a_, b_ in zip(shots, shots[1:]):
        a_["end"] = b_["start"]

    tl = {"fps": args.fps, "duration": duration, "series": story["series"], "episode": story["episode"],
          "title": story["title"], "part": story["part"], "question": story.get("question", ""), "shots": shots, "words": words,
          "groups": [{"start": g["start"], "end": g["end"], "words": g["words"]} for g in groups],
          "msgs": msgs, "typing": typing, "knocks": knocks, "handle": handle, "reveal": reveal}
    tl_path = os.path.join(outdir, name + ".timeline.json")
    json.dump(tl, open(tl_path, "w"), ensure_ascii=False, indent=1)

    # ---- Ton mischen
    n = int(duration * SR) + SR
    mix = drone(n / SR)
    vo = np.zeros(n)
    for st, a in voice:
        i = int(st * SR); vo[i:i + len(a)] += a[: n - i]
    vo /= (np.abs(vo).max() + 1e-9); vo *= 0.85
    mix += vo
    for st, nm in sfx_ev:
        s = sfx(nm); i = int(st * SR); mix[i:i + len(s)] += s[: n - i]
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
