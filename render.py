"""Timeline (estimated or aligned to a voice file), captions/overlays and frame rendering."""
import json
import math
import os
import re
import subprocess
import tempfile
from multiprocessing import Pool

import numpy as np
import skia

import story
from gfx import (W, H, Ctx, CREAM, RED, font, draw_text, text_width, paint, lin_paint, rad_paint, R, ramp,
                 ease, mix)
from scenes import SCENES

FPS = 30
XFADE = 0.35          # dissolve between scenes
OUTRO = 4.2           # seconds of channel outro
TAIL = 1.2            # hold after last spoken word before outro


# ------------------------------------------------------------------ words
def norm(w):
    return re.sub(r"[^a-z0-9']", "", w.lower().replace("’", "'"))


def parse_words():
    words = []
    for si, sc in enumerate(story.SCENES):
        red = False
        toks = sc["text"].split()
        for k, tok in enumerate(toks):
            opens = tok.startswith("*")
            closes = tok.rstrip(".,!?…").endswith("*")
            if opens:
                red = True
            clean = tok.replace("*", "")
            words.append({"text": clean, "n": norm(clean), "red": red, "scene": si,
                          "last_in_scene": k == len(toks) - 1})
            if closes:
                red = False
    return words


def full_script():
    return " ".join(s["text"].replace("*", "") for s in story.SCENES)


def estimate_times(words, start=0.5, wps=1.0):
    t = start
    for w in words:
        w["t"] = t
        letters = len(re.sub(r"[^A-Za-z]", "", w["text"]))
        dur = (0.17 + 0.042 * letters) / wps
        w["end"] = t + dur
        t += dur
        tail = w["text"][-1]
        if tail == "…" or w["text"].endswith("..."):
            t += 0.55
        elif tail in ".!?":
            t += 0.38
        elif tail in ",;:":
            t += 0.16
    return words


def align_to_voice(words, voice_path, model_size="base.en"):
    """Word timestamps from faster-whisper, matched to the script words."""
    import difflib
    from faster_whisper import WhisperModel
    model = WhisperModel(model_size, device="cpu", compute_type="int8")
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", voice_path, "-f", "f32le", "-ac", "1", "-ar", "16000", "-"],
                         capture_output=True, check=True).stdout
    pcm = np.frombuffer(raw, np.float32).copy()
    segs, _ = model.transcribe(pcm, word_timestamps=True, language="en",
                               initial_prompt=full_script()[:400])
    rec = [(norm(w.word), w.start, w.end) for s in segs for w in s.words if norm(w.word)]
    a = [w["n"] for w in words]
    b = [r[0] for r in rec]
    sm = difflib.SequenceMatcher(a=a, b=b, autojunk=False)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            words[blk.a + k]["t"] = rec[blk.b + k][1]
            words[blk.a + k]["end"] = rec[blk.b + k][2]
    # interpolate unmatched words
    known = [i for i, w in enumerate(words) if "t" in w]
    if not known:
        raise RuntimeError("Could not align voice to script")
    for i, w in enumerate(words):
        if "t" in w:
            continue
        prev = max([k for k in known if k < i], default=None)
        nxt = min([k for k in known if k > i], default=None)
        if prev is None:
            w["t"] = max(0.0, words[nxt]["t"] - 0.3 * (nxt - i))
        elif nxt is None:
            w["t"] = words[prev]["end"] + 0.3 * (i - prev)
        else:
            f = (i - prev) / (nxt - prev)
            w["t"] = words[prev]["end"] + f * (words[nxt]["t"] - words[prev]["end"])
        w["end"] = w["t"] + 0.25
    matched = len(known) / len(words)
    return words, matched


def build_timeline(words):
    n = len(story.SCENES)
    starts = []
    for si in range(n):
        first = next(w for w in words if w["scene"] == si)
        starts.append(0.0 if si == 0 else max(0.0, first["t"] - 0.22))
    speech_end = words[-1]["end"]
    end = speech_end + TAIL
    scenes = []
    for si in range(n):
        s0 = starts[si]
        s1 = starts[si + 1] if si + 1 < n else end
        local = {}
        for w in words:
            if w["scene"] == si and w["n"] not in local:
                local[w["n"]] = w["t"] - s0
        scenes.append({"i": si, "kind": story.SCENES[si]["kind"], "start": s0, "end": s1, "words": local,
                       "cfg": story.SCENES[si]})
    return {"scenes": scenes, "words": words, "story_end": end, "duration": end + OUTRO}


# ------------------------------------------------------------------ captions
CAP_FONT = "Oswald-Bold.ttf"
CAP_SIZE = 86
CAP_Y = 1330
CAP_MAXW = 880


def hook_words(tl):
    """For hook scenes: the red words of that scene are shown as the big hook text."""
    ids = set()
    for i, w in enumerate(tl["words"]):
        if story.SCENES[w["scene"]].get("hook") and w["red"]:
            ids.add(i)
    return ids


def caption_chunks(tl):
    hooks = hook_words(tl)
    chunks, cur = [], []
    words = tl["words"]
    for i, w in enumerate(words):
        if i in hooks:
            if cur:
                chunks.append(cur)
                cur = []
            continue
        cur.append(i)
        f = font(CAP_FONT, CAP_SIZE)
        txt = " ".join(words[k]["text"].upper() for k in cur)
        brk = (w["text"][-1] in ".,!?…;:" or len(cur) >= 3 or w["last_in_scene"]
               or text_width(txt, f) > CAP_MAXW * 1.6)
        if brk:
            chunks.append(cur)
            cur = []
    if cur:
        chunks.append(cur)
    out = []
    for ci, ch in enumerate(chunks):
        t0 = words[ch[0]]["t"]
        nxt = chunks[ci + 1] if ci + 1 < len(chunks) else None
        t1 = words[nxt[0]]["t"] if nxt else words[ch[-1]]["end"] + 1.0
        # never keep a caption hanging over a long pause
        t1 = min(t1, words[ch[-1]]["end"] + 1.6)
        later_hooks = [words[h]["t"] for h in hooks if h > ch[-1]]
        if later_hooks:
            t1 = min(t1, min(later_hooks))
        out.append({"ids": ch, "t0": t0, "t1": t1})
    return out


def _layout(words, ids, f, maxw):
    lines, cur = [], []
    for i in ids:
        test = cur + [i]
        if cur and text_width(" ".join(words[k]["text"].upper() for k in test), f) > maxw:
            lines.append(cur)
            cur = [i]
        else:
            cur = test
    if cur:
        lines.append(cur)
    return lines


def draw_word_line(c, words, line, cx, y, f, T, big=False):
    space = f.measureText(" ")
    ws = [f.measureText(words[i]["text"].upper()) for i in line]
    total = sum(ws) + space * (len(line) - 1)
    x = cx - total / 2
    for i, w in zip(line, ws):
        wd = words[i]
        k = ramp(T, wd["t"] - 0.02, wd["t"] + 0.14)
        if k > 0:
            base = RED if (wd["red"] or big) else CREAM
            colr = mix((110, 106, 100), base, ease(k))
            s = wd["text"].upper()
            dy = (1 - ease(k)) * 8
            sh = paint((0, 0, 0), 0.55 * k, blur=9)
            c.drawString(s, x + 2, y + 4 + dy, f, sh)
            c.drawString(s, x, y + dy, f, paint(colr, 0.35 + 0.65 * k))
        x += w + space


def draw_captions(c, tl, chunks, T):
    words = tl["words"]
    f = font(CAP_FONT, CAP_SIZE)
    for ch in chunks:
        if ch["t0"] <= T < ch["t1"]:
            fade = 1 - ramp(T, ch["t1"] - 0.08, ch["t1"])
            c.saveLayer(None, paint(a=fade))
            lines = _layout(words, ch["ids"], f, CAP_MAXW)
            lh = CAP_SIZE * 1.08
            y0 = CAP_Y - (len(lines) - 1) * lh / 2
            for li, line in enumerate(lines):
                draw_word_line(c, words, line, W / 2, y0 + li * lh, f, T)
            c.restore()
    # big hook text
    hooks = sorted(hook_words(tl))
    if hooks:
        for si in {words[i]["scene"] for i in hooks}:
            ids = [i for i in hooks if words[i]["scene"] == si]
            sc = tl["scenes"][si]
            if sc["start"] <= T < sc["end"] + (0 if si < len(tl["scenes"]) - 1 else 0.0):
                fb = font(CAP_FONT, 128)
                lines = _layout(words, ids, fb, 960)
                y0 = 700 if si == 0 else 1380
                for li, line in enumerate(lines):
                    draw_word_line(c, words, line, W / 2, y0 + li * 140, fb, T, big=True)


def draw_location(c, tl, T):
    for sc in tl["scenes"]:
        if not sc["cfg"].get("location"):
            continue
        t = T - sc["start"]
        a = ramp(t, 0.2, 0.7) * (1 - ramp(t, 4.0, 4.6))
        if a <= 0:
            continue
        c.drawRect(R(92, 268, 92 + 70 * ease(ramp(t, 0.2, 0.9)), 272), paint(RED, a))
        draw_text(c, story.LOCATION, 92, 330, font("Oswald-Medium.ttf", 38), paint(CREAM, 0.88 * a), spacing=7)


def draw_title(c, tl, T):
    for sc in tl["scenes"]:
        if not sc["cfg"].get("title"):
            continue
        t = T - sc["start"]
        a = ramp(t, 0.15, 0.7) * (1 - ramp(t, sc["end"] - sc["start"] - 0.4, sc["end"] - sc["start"]))
        if a <= 0:
            continue
        fb = font("Oswald-Bold.ttf", 136)
        sh = paint((0, 0, 0), 0.6 * a, blur=14)
        draw_text(c, story.TITLE, W / 2 + 3, 330, fb, sh, spacing=8, align="center")
        draw_text(c, story.TITLE, W / 2, 326, fb, paint(CREAM, a), spacing=8, align="center")
        lw = 120 * ease(ramp(t, 0.4, 1.0))
        c.drawRect(R(W / 2 - lw / 2, 362, W / 2 + lw / 2, 366), paint(RED, a))
        draw_text(c, story.TITLE_SUB, W / 2, 414, font("Oswald-Medium.ttf", 30), paint(RED, a * 0.95),
                  spacing=6, align="center")
        draw_text(c, story.LOCATION.split("·")[-1].strip() + "  ·  LEGEND", W / 2, 1760,
                  font("Oswald-Medium.ttf", 28), paint(CREAM, a * 0.6), spacing=6, align="center")


def draw_outro(c, t):
    c.drawRect(R(0, 0, W, H), paint((9, 10, 14)))
    a = ease(ramp(t, 0.3, 1.2))
    cx, cy = W / 2, 760
    # emblem: lantern line-art
    lp = paint(CREAM, a, stroke=4, cap_round=True)
    c.drawLine(cx, cy - 150, cx, cy - 110, lp)
    c.drawCircle(cx, cy - 160, 12, lp)
    path = skia.Path()
    path.moveTo(cx - 60, cy - 110); path.lineTo(cx + 60, cy - 110); path.lineTo(cx + 45, cy - 90)
    path.lineTo(cx - 45, cy - 90); path.close()
    c.drawPath(path, lp)
    c.drawRect(R(cx - 50, cy - 90, cx + 50, cy + 70), lp)
    c.drawLine(cx - 50, cy - 10, cx + 50, cy - 10, paint(CREAM, a * 0.5, stroke=2))
    c.drawRect(R(cx - 62, cy + 70, cx + 62, cy + 86), paint(CREAM, a))
    fl = 0.85 + 0.15 * math.sin(t * 11)
    c.drawCircle(cx, cy - 10, 120, rad_paint(cx, cy - 10, 120, [(0, RED, 0.45 * a * fl), (1, RED, 0)]))
    flame = skia.Path()
    flame.moveTo(cx, cy - 62); flame.cubicTo(cx + 26, cy - 20, cx + 22, cy + 20, cx, cy + 26)
    flame.cubicTo(cx - 22, cy + 20, cx - 26, cy - 20, cx, cy - 62)
    c.drawPath(flame, paint(RED, a * fl))
    a2 = ease(ramp(t, 0.8, 1.6))
    draw_text(c, story.CHANNEL_NAME, cx, cy + 230, font("Cinzel-SemiBold.ttf", 66), paint(CREAM, a2), spacing=6,
              align="center")
    lw = 90 * a2
    c.drawRect(R(cx - lw / 2, cy + 268, cx + lw / 2, cy + 271), paint(RED, a2))
    draw_text(c, story.CHANNEL_TAGLINE, cx, cy + 320, font("Oswald-Regular.ttf", 30), paint(CREAM, a2 * 0.7),
              spacing=5, align="center")
    fade_out = ramp(t, OUTRO - 0.5, OUTRO)
    if fade_out > 0:
        c.drawRect(R(0, 0, W, H), paint((0, 0, 0), fade_out))


_vig = None


def vignette(c):
    global _vig
    if _vig is None:
        s = skia.Surface(W, H)
        k = s.getCanvas()
        k.drawRect(R(0, 0, W, H), rad_paint(W / 2, H * 0.46, H * 0.62, [
            (0, (0, 0, 0), 0.0), (0.55, (0, 0, 0), 0.18), (0.85, (0, 0, 0), 0.62), (1, (0, 0, 0), 0.85)]))
        k.drawRect(R(0, 0, W, 360), lin_paint(0, 0, 0, 360, [(0, (0, 0, 0), 0.45), (1, (0, 0, 0), 0)]))
        k.drawRect(R(0, H - 520, W, H), lin_paint(0, H - 520, 0, H, [(0, (0, 0, 0), 0), (1, (0, 0, 0), 0.6)]))
        _vig = s.makeImageSnapshot()
    c.drawImage(_vig, 0, 0)


# ------------------------------------------------------------------ frame
def draw_scene(c, sc, T):
    t = T - sc["start"]
    dur = sc["end"] - sc["start"]
    ctx = Ctx(t, dur, T, sc["words"], seed=sc["i"])
    c.save()
    SCENES[sc["kind"]](c, ctx)
    c.restore()


def render_frame(c, tl, chunks, T):
    c.clear(skia.ColorBLACK)
    if T >= tl["story_end"]:
        draw_outro(c, T - tl["story_end"])
        return
    scenes = tl["scenes"]
    cur = next((s for s in scenes if s["start"] <= T < s["end"]), scenes[-1])
    draw_scene(c, cur, T)
    # dissolve from previous scene
    if cur["i"] > 0 and T - cur["start"] < XFADE:
        prev = scenes[cur["i"] - 1]
        a = 1 - ease((T - cur["start"]) / XFADE)
        c.saveLayer(None, paint(a=a))
        draw_scene(c, prev, T)
        c.restore()
    vignette(c)
    # fade in at very start, dip at the end of the story
    if T < 0.4:
        c.drawRect(R(0, 0, W, H), paint((0, 0, 0), 1 - T / 0.4))
    end_dip = ramp(T, tl["story_end"] - 0.35, tl["story_end"])
    draw_location(c, tl, T)
    draw_title(c, tl, T)
    draw_captions(c, tl, chunks, T)
    if end_dip > 0:
        c.drawRect(R(0, 0, W, H), paint((0, 0, 0), end_dip))


def _worker(args):
    tl, f0, f1, out = args
    chunks = caption_chunks(tl)
    surf = skia.Surface(W, H)
    c = surf.getCanvas()
    cmd = ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{W}x{H}", "-r", str(FPS),
           "-i", "-", "-vf", "noise=alls=5:allf=t,format=yuv420p", "-c:v", "libx264", "-preset", "medium",
           "-crf", "21", "-maxrate", "12M", "-bufsize", "24M", out]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for fi in range(f0, f1):
        render_frame(c, tl, chunks, fi / FPS)
        arr = surf.makeImageSnapshot().toarray(colorType=skia.kRGBA_8888_ColorType)
        pr.stdin.write(arr.tobytes())
    pr.stdin.close()
    pr.wait()
    return out


def render_video(tl, out_path, workers=None, tmpdir=None):
    workers = workers or os.cpu_count() or 2
    n = int(math.ceil(tl["duration"] * FPS))
    tmpdir = tmpdir or tempfile.mkdtemp()
    bounds = np.linspace(0, n, workers + 1).astype(int)
    jobs = [(tl, int(bounds[k]), int(bounds[k + 1]), os.path.join(tmpdir, f"seg{k:02d}.mp4"))
            for k in range(workers)]
    with Pool(workers) as pool:
        segs = pool.map(_worker, jobs)
    lst = os.path.join(tmpdir, "list.txt")
    with open(lst, "w") as fh:
        fh.writelines(f"file '{s}'\n" for s in segs)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst, "-c", "copy",
                    out_path], check=True)
    return out_path


def render_still(tl, T, path):
    surf = skia.Surface(W, H)
    render_frame(surf.getCanvas(), tl, caption_chunks(tl), T)
    surf.makeImageSnapshot().save(path, skia.kJPEG)


def save_timeline(tl, path):
    with open(path, "w") as fh:
        json.dump(tl, fh, indent=1, ensure_ascii=False)
