#!/usr/bin/env python3
"""Short story episodes with Bommel & Kiki (ages ~3-7), 9:16.

Each story is a list of scenes; each scene has spoken lines and a draw function.
Voice-over is optional: put recordings at voice/de/<story>/<line_id>.mp3 (or .wav)
and the timeline stretches to fit them. Without recordings, lines get a default
duration and the text is shown in speech bubbles.

Usage:
  python3 tools/story.py schneemann videos/bommel_schneemann.mp4   # render
  python3 tools/story.py schneemann --script                       # write voice script
"""
import math
import os
import subprocess
import sys
import tempfile
import textwrap
import wave

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
import characters as ch  # noqa: E402
from shadow_quiz import (W, H, FPS, SR, add, ease_out_back, font, midi, outlined_text,  # noqa: E402
                         render_emoji, sparkles, tone)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GROUND = 1500
CHAR_BOTTOM = 1600
SPEAKERS = {"erz": "Erzähler/in", "bommel": "Bommel", "kiki": "Kiki", "beide": "Bommel & Kiki"}


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def lerp(a, b, p):
    return a + (b - a) * p


def ease(p):
    p = clamp(p)
    return p * p * (3 - 2 * p)


def put(img, sprite, cx, bottom, scale=1.0):
    if scale != 1.0:
        sprite = sprite.resize((max(1, int(sprite.width * scale)), max(1, int(sprite.height * scale))), Image.LANCZOS)
    img.alpha_composite(sprite, (int(cx - sprite.width / 2), int(bottom - sprite.height)))
    return (cx, bottom - sprite.height)  # head anchor


class Ctx:
    """Per-frame info handed to scene draw functions."""

    def __init__(self, t, T, lines, talking):
        self.t, self.T, self.lines, self.talking = t, T, lines, talking

    def start(self, lid):
        return self.lines[lid][0]

    def end(self, lid):
        return self.lines[lid][1]

    def since(self, lid):
        return self.t - self.lines[lid][0]

    def after(self, lid):
        return self.t - self.lines[lid][1]

    def blink(self, seed=0):
        return ((self.t + seed * 1.3) % 3.4) > 0.13

    def mouth(self, who):
        return (who in self.talking or "beide" in self.talking and who in ("bommel", "kiki")) and int(self.t * 9) % 2 == 0


# ---------------------------------------------------------------- winter ----

def winter_bg():
    img = Image.new("RGBA", (W, H))
    arr = np.zeros((H, W, 3), np.uint8)
    top, bot = np.array((120, 180, 245)), np.array((225, 240, 255))
    arr[:] = (top + (bot - top) * np.linspace(0, 1, H)[:, None])[:, None, :].astype(np.uint8)
    img = Image.fromarray(arr).convert("RGBA")
    d = ImageDraw.Draw(img)
    d.ellipse((-400, 1180, 700, 1800), fill=(235, 244, 255))
    d.ellipse((400, 1220, 1500, 1800), fill=(228, 238, 252))
    for x, s in ((90, 1.0), (980, 1.15), (860, 0.8), (200, 0.75)):
        base = 1380
        for k in range(3):
            w, h = 150 * s * (1 - k * 0.22), 150 * s
            y = base - k * 95 * s
            d.polygon([(x - w, y), (x + w, y), (x, y - h)], fill=(40, 130, 90))
            d.polygon([(x - w * 0.35, y - h * 0.62), (x + w * 0.35, y - h * 0.62), (x, y - h)], fill="white")
        d.rectangle((x - 18 * s, base, x + 18 * s, base + 40 * s), fill=(120, 80, 50))
    d.rectangle((0, GROUND - 40, W, H), fill=(250, 252, 255))
    d.ellipse((-200, GROUND - 120, W + 200, GROUND + 60), fill=(250, 252, 255))
    for i in range(40):  # snow sparkle texture
        x, y = (i * 263) % W, GROUND + 60 + (i * 149) % (H - GROUND - 60)
        d.ellipse((x - 4, y - 4, x + 4, y + 4), fill=(215, 228, 248))
    return img


FLAKES = np.random.default_rng(7).uniform(0, 1, (70, 4))


def snowfall(d, t):
    for x0, y0, sp, sz in FLAKES:
        y = (y0 * H + t * (60 + sp * 90)) % (H + 40) - 20
        x = x0 * W + math.sin(t * 1.2 + y0 * 10) * 25
        r = 4 + sz * 7
        d.ellipse((x - r, y - r, x + r, y + r), fill=(255, 255, 255, 220))


def snowball(img, cx, cy, r, rot=0.0):
    if r < 2:
        return
    d = ImageDraw.Draw(img)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=(200, 218, 242))
    d.ellipse((cx - r * 0.97, cy - r, cx + r * 0.9, cy + r * 0.9), fill=(255, 255, 255))
    for k in range(3):
        a = rot + k * 2.1
        px, py = cx + math.cos(a) * r * 0.55, cy + math.sin(a) * r * 0.55
        rr = r * 0.07
        d.ellipse((px - rr, py - rr, px + rr, py + rr), fill=(215, 228, 245))


B1 = (720, GROUND + 20 - 170, 170)      # bottom ball final
B2_START = (170, GROUND + 20 - 110, 110)
B2_TOP = (720, B1[1] - B1[2] + 30 - 110, 110)
HEAD = (720, B2_TOP[1] - 110 + 25 - 78, 78)


def snowman(img, d, parts, t):
    snowball(img, *B1)
    if parts.get("b2"):
        snowball(img, *parts["b2"])
    hp = parts.get("head", 0)
    if hp > 0:
        k = ease_out_back(hp)
        snowball(img, HEAD[0], HEAD[1] + (1 - min(k, 1)) * 30, HEAD[2] * k)
    if parts.get("face"):
        hx, hy = HEAD[0], HEAD[1]
        for s in (-1, 1):
            d.ellipse((hx + s * 28 - 10, hy - 22 - 10, hx + s * 28 + 10, hy - 22 + 10), fill=(40, 40, 50))
        for k in range(5):
            a = math.radians(30 + k * 30)
            px, py = hx + math.cos(a) * 42, hy + 8 + math.sin(a) * 30
            d.ellipse((px - 6, py - 6, px + 6, py + 6), fill=(40, 40, 50))
        for k in range(3):
            by = B2_TOP[1] - 40 + k * 45
            d.ellipse((B2_TOP[0] - 12, by - 12, B2_TOP[0] + 12, by + 12), fill=(40, 40, 50))
    cp = parts.get("carrot", 0)
    if cp > 0:
        k = ease_out_back(cp)
        L = 90 * min(k, 1.1)
        hx, hy = HEAD[0], HEAD[1] - 2
        d.polygon([(hx, hy - 12), (hx, hy + 12), (hx + L, hy + 2)], fill=(255, 140, 30))
    sp = parts.get("scarf", 0)
    if sp > 0:
        y = B2_TOP[1] - 110 + 18
        k = ease(sp)
        w = 95 * k
        d.rounded_rectangle((HEAD[0] - w, y - 22, HEAD[0] + w, y + 22), radius=14, fill=(230, 60, 70))
        if k > 0.6:
            d.rounded_rectangle((HEAD[0] + 30, y, HEAD[0] + 70, y + 110 * (k - 0.6) / 0.4), radius=12, fill=(230, 60, 70))
    hat = parts.get("hat", 0)
    if hat > 0:
        k = ease_out_back(hat)
        top = HEAD[1] - HEAD[2] + 18
        drop = (1 - min(k, 1)) * -300
        d.rectangle((HEAD[0] - 60, top - 110 + drop, HEAD[0] + 60, top + drop), fill=(40, 40, 55))
        d.rectangle((HEAD[0] - 95, top - 14 + drop, HEAD[0] + 95, top + 6 + drop), fill=(40, 40, 55))
        d.rectangle((HEAD[0] - 60, top - 40 + drop, HEAD[0] + 60, top - 20 + drop), fill=(230, 60, 70))


def hop(t, speed=6.0, height=50):
    return abs(math.sin(t * speed)) * height


# ------------------------------------------------------ story: schneemann ----

def s1(img, d, c):
    p = ease(c.t / 1.4)
    x = lerp(-250, 380, p)
    h = hop(c.t, 7, 60) if c.t < 1.4 or c.since("s1b") > 0 else 0
    return {"bommel": put(img, ch.bommel("happy", c.blink(), c.mouth("bommel"), True), x, CHAR_BOTTOM - h)}


def s2(img, d, c):
    # phase A: roll big ball across; phase B: roll second ball
    pa = ease(c.t / max(0.1, c.end("s2b")))
    bx, r = lerp(300, B1[0], pa), lerp(40, B1[2], pa)
    snowball(img, bx, GROUND + 20 - r, r, rot=bx / max(r, 1))
    pb = ease(c.since("s2c") / max(0.1, c.end("s2c") - c.start("s2c")))
    if c.t >= c.start("s2c"):
        r2 = lerp(10, B2_START[2], pb)
        x2 = lerp(420, B2_START[0], pb)
        snowball(img, x2, GROUND + 20 - r2, r2, rot=-x2 / max(r2, 1))
        bx_char = lerp(bx - r - 110, 400, ease(c.since("s2c") / 0.6))
    else:
        bx_char = bx - r - 110
    pos = put(img, ch.bommel("happy", c.blink(), c.mouth("bommel"), True), bx_char, CHAR_BOTTOM - hop(c.t, 9, 12))
    return {"bommel": pos}


def s3(img, d, c):
    snowball(img, *B1)
    lift = 0
    if c.t < c.start("s3b"):
        q = clamp(c.since("s3a") / 1.2)
        lift = math.sin(q * math.pi) * 70 + math.sin(c.t * 30) * 6 * (q < 1)
    snowball(img, B2_START[0], B2_START[1] - lift, B2_START[2])
    mood = "sad" if c.t >= c.start("s3b") else "happy"
    squash = 0.95 if c.t < c.start("s3b") else 1.0
    return {"bommel": put(img, ch.bommel(mood, c.blink(), c.mouth("bommel"), True), 400, CHAR_BOTTOM, squash)}


def s4(img, d, c):
    snowball(img, *B1)
    snowball(img, *B2_START)
    p = ease(c.t / 1.4)
    kx, ky = lerp(1250, 860, p), lerp(300, 1050, p) + math.sin(c.t * 4) * 15
    wing = int(c.t * 10) % 2 == 0
    mood_b = "sad" if c.t < c.start("s4a") + 0.6 else ("surprised" if c.t < c.start("s4b") else "happy")
    pos_b = put(img, ch.bommel(mood_b, c.blink(), c.mouth("bommel"), True), 400,
                CHAR_BOTTOM - (hop(c.since("s4b"), 7, 40) if c.t > c.start("s4b") else 0))
    pos_k = put(img, ch.kiki("happy", c.blink(2), c.mouth("kiki"), wing), kx, ky)
    return {"bommel": pos_b, "kiki": pos_k}


def s5(img, d, c):
    snowball(img, *B1)
    q = ease(c.after("s5a") / 1.5)
    bx = lerp(B2_START[0], B2_TOP[0], q)
    by = lerp(B2_START[1], B2_TOP[1], q) - math.sin(q * math.pi) * 380
    head = clamp((c.since("s5b") - 0.3) / 0.5) if c.t > c.start("s5b") else 0
    snowman(img, d, {"b2": (bx, by, 110), "head": head}, c.t)
    if 0 < q < 1:
        kx, ky = bx, by - 110 + 30
    else:
        base = (B2_START[0] + 40, B2_START[1] - 110 + 30) if q == 0 else (900, 1000)
        kx, ky = base[0], base[1] + math.sin(c.t * 4) * 15
    wing = int(c.t * (14 if 0 < q < 1 else 8)) % 2 == 0
    jump = hop(c.t, 8, 70) if q >= 1 else (hop(c.t, 5, 20) if c.t < c.end("s5a") else 0)
    pos_b = put(img, ch.bommel("happy", c.blink(), c.mouth("bommel"), True), 400, CHAR_BOTTOM - jump)
    pos_k = put(img, ch.kiki("happy", c.blink(2), c.mouth("kiki"), wing), kx, ky)
    if q >= 1:
        sparkles(d, clamp(c.after("s5a") - 1.5), B2_TOP[0], B2_TOP[1], 3)
    return {"bommel": pos_b, "kiki": pos_k}


def s6(img, d, c):
    carrot = clamp((c.since("s6a") - 1.0) / 0.5)
    scarf = clamp((c.since("s6b") - 0.6) / 0.8) if c.t > c.start("s6b") else 0
    hat = clamp((c.since("s6c") - 0.2) / 0.6) if c.t > c.start("s6c") else 0
    snowman(img, d, {"b2": B2_TOP, "head": 1, "face": True, "carrot": carrot, "scarf": scarf, "hat": hat}, c.t)
    party = c.t > c.start("s6c")
    jump_b = hop(c.t, 8, 70) if party else 0
    kx = 890 if not party else 890 + math.sin(c.t * 3) * 30
    ky = 1050 + math.sin(c.t * 4) * 15 - (hop(c.t, 8, 50) if party else 0)
    pos_b = put(img, ch.bommel("happy", c.blink(), c.mouth("bommel"), scarf < 0.5), 330, CHAR_BOTTOM - jump_b)
    pos_k = put(img, ch.kiki("happy", c.blink(2), c.mouth("kiki"), int(c.t * 8) % 2 == 0), kx, ky)
    if party:
        sparkles(d, clamp(c.since("s6c") / 1.4), HEAD[0], HEAD[1], 11)
    return {"bommel": pos_b, "kiki": pos_k}


def s7(img, d, c):
    snowman(img, d, {"b2": B2_TOP, "head": 1, "face": True, "carrot": 1, "scarf": 1, "hat": 1}, c.t)
    wave_b = math.sin(c.t * 6) * 6
    pos_b = put(img, ch.bommel("happy", c.blink(), c.mouth("bommel"), False), 330, CHAR_BOTTOM - abs(wave_b) * 3)
    pos_k = put(img, ch.kiki("happy", c.blink(2), c.mouth("kiki"), int(c.t * 8) % 2 == 0), 920, 1050 + math.sin(c.t * 4) * 15)
    k = ease_out_back(clamp(c.t / 0.6))
    outlined_text(d, (W / 2, 1760), "Bommel & Kiki", int(110 * min(k, 1.1)) or 1, fill=(255, 230, 90))
    return {"bommel": pos_b, "kiki": pos_k}


STORIES = {
    "schneemann": {
        "title": "Bommel und der Schneemann",
        "bg": winter_bg,
        "fx": snowfall,
        "scenes": [
            (s1, [("s1a", "erz", "Es hat die ganze Nacht geschneit."),
                  ("s1b", "bommel", "Juhu! Schnee! Alles ist weiß!")], []),
            (s2, [("s2a", "bommel", "Ich baue einen Schneemann!"),
                  ("s2b", "erz", "Bommel rollt eine riesige Kugel."),
                  ("s2c", "erz", "Und noch eine kleinere Kugel.")], []),
            (s3, [("s3a", "bommel", "Hau ruck!"),
                  ("s3b", "bommel", "Uff ... die Kugel ist viel zu schwer.")],
             [("s3a", 1.15, "thud")]),
            (s4, [("s4a", "kiki", "Hallo Bommel! Soll ich dir helfen?", 0.9),
                  ("s4b", "bommel", "Oh ja, bitte! Danke, Kiki!")],
             [(None, 0.0, "whoosh")]),
            (s5, [("s5a", "beide", "Eins ... zwei ... drei ... HOCH!"),
                  ("s5b", "erz", "Und oben drauf kommt der Kopf.", 1.9)],
             [("s5a$", 0.0, "whoosh"), ("s5a$", 1.5, "pop"), ("s5b", 0.4, "pop")]),
            (s6, [("s6a", "kiki", "Ich hole eine Karotte für die Nase!"),
                  ("s6b", "bommel", "Und er bekommt meinen Schal!"),
                  ("s6c", "beide", "Zusammen geht's viel leichter!")],
             [("s6a", 1.0, "pop"), ("s6b", 0.6, "whoosh"), ("s6c", 0.2, "chime")]),
            (s7, [("s7a", "erz", "Was baust du gern im Schnee?")], [(None, 0.1, "chime")]),
        ],
    },
}


# ------------------------------------------------------------- timeline ----

def voice_path(story, lid):
    for ext in ("mp3", "wav", "m4a"):
        p = os.path.join(ROOT, "voice", "de", story, f"{lid}.{ext}")
        if os.path.exists(p):
            return p
    return None


def load_voice(path):
    raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(SR), "-"],
                         capture_output=True, check=True).stdout
    a = np.frombuffer(raw, np.int16).astype(np.float64) / 32768
    idx = np.where(np.abs(a) > 0.02)[0]
    return a[max(0, idx[0] - 800): idx[-1] + 2000] if len(idx) else a


def default_dur(text):
    return 1.1 + 0.065 * len(text)


def build_timeline(story):
    cfg = STORIES[story]
    t = 0.0
    scenes = []
    voices = {}
    for fn, lines, sfx in cfg["scenes"]:
        start = t
        lt, local = {}, 0.4
        for line in lines:
            lid, who, text = line[:3]
            local += line[3] if len(line) > 3 else 0
            vp = voice_path(story, lid)
            if vp:
                voices[lid] = load_voice(vp)
                dur = len(voices[lid]) / SR + 0.35
            else:
                dur = default_dur(text)
            lt[lid] = (local, local + dur, who, text)
            local += dur + 0.25
        T = local + 0.5
        scenes.append({"fn": fn, "start": start, "T": T, "lines": lt, "sfx": sfx})
        t += T
    return scenes, t, voices


# --------------------------------------------------------------- bubbles ----

def bubble(img, text, who, anchors):
    d = ImageDraw.Draw(img)
    f = font(66)
    lines = textwrap.wrap(text, 22)
    lh = 80
    bw = max(f.getlength(s) for s in lines) + 90
    bh = lh * len(lines) + 60
    x0, y0 = W / 2 - bw / 2, 200
    narrator = who == "erz"
    fill = (255, 248, 210) if narrator else (255, 255, 255)
    targets = [] if narrator else ([anchors.get("bommel"), anchors.get("kiki")] if who == "beide" else [anchors.get(who)])
    for tg in targets:
        if not tg:
            continue
        tx, ty = tg[0], tg[1] - 20
        bx = clamp(tx, x0 + 80, x0 + bw - 80)
        d.polygon([(bx - 40, y0 + bh - 5), (bx + 40, y0 + bh - 5), (lerp(bx, tx, 0.5), min(ty, y0 + bh + 140))],
                  fill=fill, outline=(60, 40, 110), width=8)
    d.rounded_rectangle((x0, y0, x0 + bw, y0 + bh), radius=50, fill=fill, outline=(60, 40, 110), width=8)
    for tg in targets:  # hide outline seam under tail
        if tg:
            bx = clamp(tg[0], x0 + 80, x0 + bw - 80)
            d.rectangle((bx - 34, y0 + bh - 12, bx + 34, y0 + bh - 2), fill=fill)
    if not narrator:
        name = SPEAKERS[who]
        nf = font(44)
        nw = nf.getlength(name) + 40
        col = {"bommel": ch.BOMMEL_DARK, "kiki": ch.KIKI_DARK, "beide": (130, 90, 200)}[who]
        d.rounded_rectangle((x0 + 40, y0 - 34, x0 + 40 + nw, y0 + 26), radius=24, fill=col)
        d.text((x0 + 40 + nw / 2, y0 - 4), name, font=nf, fill="white", anchor="mm")
    for i, s in enumerate(lines):
        d.text((W / 2, y0 + 30 + lh * i + lh / 2), s, font=f, fill=(50, 35, 90), anchor="mm")


# ----------------------------------------------------------------- audio ----

def sfx_sound(kind):
    n = lambda d: np.arange(int(SR * d)) / SR  # noqa: E731
    if kind == "pop":
        t = n(0.18)
        return 0.5 * np.sin(2 * math.pi * (500 + 900 * t / 0.18) * t) * np.exp(-t * 25)
    if kind == "thud":
        t = n(0.4)
        return 0.7 * np.sin(2 * math.pi * (110 - 60 * t) * t) * np.exp(-t * 12)
    if kind == "whoosh":
        t = n(0.7)
        nz = np.random.default_rng(1).normal(0, 1, len(t))
        nz = np.convolve(nz, np.ones(30) / 30, "same")
        return 0.5 * nz * np.sin(math.pi * t / 0.7) ** 2
    if kind == "chime":
        out = np.zeros(int(SR * 1.4))
        for i, m in enumerate((72, 76, 79, 84, 88)):
            s = tone(midi(m), 0.9, 0.18, 4)
            out[int(i * 0.07 * SR):int(i * 0.07 * SR) + len(s)] += s
        return out
    raise ValueError(kind)


def build_audio(scenes, total, voices, path):
    music = np.zeros(int(SR * total) + SR)
    beat = 60 / 92
    prog = [(60, 64, 67), (57, 60, 64), (53, 57, 60), (55, 59, 62)]
    for b in range(int(total / beat)):
        chd = prog[(b // 4) % 4]
        t0 = b * beat
        if b % 4 == 0:
            add(music, tone(midi(chd[0] - 24), beat * 3.5, 0.12, 1.5, (1, 0.25, 0.05)), t0)
        arp = [chd[0], chd[1], chd[2], chd[1] + 12][b % 4] + 12
        add(music, tone(midi(arp), 0.9, 0.06, 4), t0)
        add(music, tone(midi(arp + 12), 0.4, 0.025, 8), t0 + beat / 2)
    sfx = np.zeros_like(music)
    vox = np.zeros_like(music)
    for sc in scenes:
        for anchor, off, kind in sc["sfx"]:
            if anchor is None:
                base = 0
            elif anchor.endswith("$"):
                base = sc["lines"][anchor[:-1]][1]
            else:
                base = sc["lines"][anchor][0]
            add(sfx, sfx_sound(kind), sc["start"] + base + off)
        for lid, (s, e, who, text) in sc["lines"].items():
            if lid in voices:
                add(vox, voices[lid] * 0.9, sc["start"] + s)
    # duck music under voice
    env = np.convolve(np.abs(vox), np.ones(4410) / 4410, "same")
    duck = 1 - 0.55 * np.clip(env * 20, 0, 1)
    mix = music * duck + sfx * 0.8 + vox
    mix = mix[: int(SR * total)]
    fade = int(SR * 0.3)
    mix[:fade] *= np.linspace(0, 1, fade)
    mix[-fade:] *= np.linspace(1, 0, fade)
    mix = mix / max(1e-6, np.abs(mix).max()) * 0.9
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())


# ---------------------------------------------------------------- render ----

def render_frame(cfg, bg, scenes, t):
    sc = next((s for s in scenes if s["start"] <= t < s["start"] + s["T"]), scenes[-1])
    lt = t - sc["start"]
    active = [(lid, v) for lid, v in sc["lines"].items() if v[0] <= lt < v[1]]
    talking = {v[2] for _, v in active}
    img = bg.copy()
    d = ImageDraw.Draw(img, "RGBA")
    anchors = sc["fn"](img, d, Ctx(lt, sc["T"], sc["lines"], talking))
    cfg["fx"](d, t)
    if active:
        lid, (s, e, who, text) = active[0]
        bubble(img, text, who, anchors)
    return img


def write_script(story):
    cfg = STORIES[story]
    out = os.path.join(ROOT, "voice", "de", story)
    os.makedirs(out, exist_ok=True)
    rows = [f"# Sprechtexte: {cfg['title']}", "",
            f"Eine Datei pro Zeile, z. B. `voice/de/{story}/s1a.mp3`. Stimmen: Erzähler/in, Bommel, Kiki.",
            "Für „Bommel & Kiki“ beide Stimmen zusammen (oder nacheinander) in eine Datei.", "",
            "| Datei | Wer | Text |", "|---|---|---|"]
    for _, lines, _ in cfg["scenes"]:
        for line in lines:
            rows.append(f"| `{line[0]}` | {SPEAKERS[line[1]]} | {line[2]} |")
    path = os.path.join(out, "SKRIPT.md")
    open(path, "w").write("\n".join(rows) + "\n")
    print("wrote", path)


def main():
    story = sys.argv[1]
    if "--script" in sys.argv:
        write_script(story)
        return
    out = sys.argv[2]
    cfg = STORIES[story]
    scenes, total, voices = build_timeline(story)
    bg = cfg["bg"]()
    with tempfile.TemporaryDirectory() as tmp:
        wav = os.path.join(tmp, "a.wav")
        build_audio(scenes, total, voices, wav)
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
               "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
               "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out]
        p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        for f in range(int(total * FPS)):
            p.stdin.write(render_frame(cfg, bg, scenes, f / FPS).convert("RGB").tobytes())
        p.stdin.close()
        p.wait()
    print(f"wrote {out} ({total:.1f}s, {len(voices)} voice lines)")


if __name__ == "__main__":
    main()
