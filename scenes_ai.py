"""Scene kind 'ai': animates one AI illustration per scene (cropped to 9:16).

Story usage:  {"kind": "ai", "img": "hook", "text": ..., optional "cx": 0.5, "pan": 1, "light": [x, y]}
Images live in  <story.AI_DIR>/<img>.png  (any landscape or square image).
Motion: Ken-Burns push (ctx.push), slow continuous pan, drifting fog in front, floating dust,
optional flickering light glow. Everything is monotonic in local time.
"""
import math
import os
import sys

import numpy as np
import skia

import scenes
from gfx import W, H, layer, fog, glow, paint, R, ramp, ease, LANTERN

HERE = os.path.dirname(os.path.abspath(__file__))
_cache = {}


def _img(name):
    story = sys.modules["story"]
    path = os.path.join(HERE, getattr(story, "AI_DIR", "assets/ai"), name + ".png")
    if path not in _cache:
        _cache[path] = skia.Image.open(path).makeRasterImage()
    return _cache[path]


def _cfg_for(ctx):
    story = sys.modules["story"]
    return story.SCENES[ctx.scene_index]


def draw_ai_image(c, ctx, name, cx=0.5, pan=1, zoom_extra=0.0, crop=1.0, fy=0.5):
    """crop < 1 cuts a smaller window out of the source (= closer shot); fy = vertical centre (0 top, 1 bottom)."""
    im = _img(name)
    iw, ih = im.width(), im.height()
    cw = min(iw, ih * W / H) * crop              # 9:16 crop width in source pixels
    ch = cw * H / W
    travel = (iw - cw) * 0.06 if iw > cw else 0  # slow sideways pan inside the source
    x0 = max(0.0, min(iw - cw, cx * iw - cw / 2 + pan * travel * (ctx.p - 0.5)))
    y0 = max(0.0, min(ih - ch, fy * ih - ch / 2))
    src = skia.Rect.MakeXYWH(x0, y0, cw, ch)
    s = 1.0 + zoom_extra
    dst = R(W / 2 - W * s / 2, H / 2 - H * s / 2, W / 2 + W * s / 2, H / 2 + H * s / 2)
    c.drawImageRect(im, src, dst, skia.SamplingOptions(skia.CubicResampler.Mitchell()),
                    skia.Paint(AntiAlias=True))


def dust(c, T, n=40, seed=3, a=0.35):
    rng = np.random.default_rng(seed)
    for _ in range(n):
        x0, y0 = rng.uniform(0, W), rng.uniform(0, H)
        sp = rng.uniform(8, 25)
        x = (x0 + math.sin(T * 0.3 + y0) * 30) % W
        y = (y0 - T * sp) % H
        r_ = rng.uniform(1.5, 3.5)
        c.drawCircle(x, y, r_, paint((230, 225, 210), a * rng.uniform(0.3, 1.0)))


def ai(c, x):
    cfg = _cfg_for(x)
    x.push = cfg.get("push", 0.14)
    x.focus = (W / 2, H * 0.46)
    with layer(c, x, 0.4):
        draw_ai_image(c, x, cfg["img"], cx=cfg.get("cx", 0.5), pan=cfg.get("pan", 1 if x.scene_index % 2 else -1),
                      zoom_extra=0.08, crop=cfg.get("crop", 1.0), fy=cfg.get("fy", 0.5))
        if "light" in cfg:                       # flickering lantern / fire glow
            lx, ly = cfg["light"]
            fl = 0.85 + 0.15 * math.sin(x.T * 11) * math.sin(x.T * 4.3)
            glow(c, lx * W, ly * H, 320, LANTERN, 0.35 * fl)
        if "eyes" in cfg:                        # glowing eyes added in the dark (fade in, blink)
            ex, ey, sz = cfg["eyes"]
            a = ease(ramp(x.t, cfg.get("eyes_at", 0.6), cfg.get("eyes_at", 0.6) + 0.8))
            blink = 1.0 if (x.t % 3.1) < 0.1 else 0.0
            for dx in (-sz * 1.4, sz * 1.4):
                glow(c, ex * W + dx, ey * H, sz * 6, (240, 236, 220), 0.5 * a)
                c.drawOval(R(ex * W + dx - sz, ey * H - sz * 0.5 * (1 - blink), ex * W + dx + sz,
                             ey * H + sz * 0.5 * (1 - blink)), paint((245, 240, 225), a))
        if "tint" in cfg:                        # colour wash (e.g. red for the scare)
            col, ta = cfg["tint"]
            c.drawRect(R(-500, -500, W + 500, H + 500), paint(col, ta))
    with layer(c, x, 0.9):
        fog(c, x, H * 0.78, a=0.18, speed=14, seed=x.scene_index % 7 + 1, color=(170, 178, 200), scale=1.5)
        dust(c, x.T, seed=x.scene_index)


scenes.SCENES["ai"] = ai


# ================================================================== sounds for AI scenes
# A scene lists effects in its config, e.g. "sfx": ["jungle", "squelch", "whimper"].
import audio  # noqa: E402

SR = audio.SR


def _noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def jungle_night(length, seed=1):
    """crickets + tree frogs + low insect drone"""
    n = int(length * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    crick = np.zeros(n, np.float32)
    for f, rate, ph in ((4300, 7.0, 0.0), (5100, 9.5, 1.3), (3900, 6.2, 2.1)):
        gate = (np.sin(2 * np.pi * rate * t + ph) > 0.6).astype(np.float32)
        gate *= (np.sin(2 * np.pi * 0.21 * t + ph) > -0.3)
        crick += np.sin(2 * np.pi * f * t) * gate * 0.025
    frogs = np.zeros(n, np.float32)
    k = 0.3
    while k < length - 0.3:
        ln = int(0.18 * SR)
        tt = np.arange(ln) / SR
        f0 = rng.uniform(900, 1500)
        x = np.sin(2 * np.pi * (f0 + 600 * tt / tt[-1]) * tt) * np.sin(np.pi * tt / tt[-1]) * 0.05
        i = int(k * SR)
        frogs[i:i + ln] += x[: n - i]
        k += rng.uniform(0.6, 1.8)
    drone = audio.filt(_noise(n, seed), "band", (2500, 7000)) * 0.008
    return audio.stereo((crick + frogs + drone).astype(np.float32))


def squelch(seed=0):
    n = int(0.35 * SR)
    t = np.arange(n) / SR
    return audio.filt(_noise(n, seed), "low", 700) * np.exp(-t * 14) * 0.6 + np.sin(2 * np.pi * 60 * t) * np.exp(-t * 25) * 0.3


def whimper(length=1.6, seed=2):
    """soft puppy-like whine"""
    n = int(length * SR)
    t = np.arange(n) / SR
    f = 820 - 220 * (t / length) + 25 * np.sin(2 * np.pi * 7 * t)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * np.sin(4 * np.pi * np.cumsum(f) / SR)
    env = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 1.5
    return audio.reverb(x * env * 0.18, 0.5)


def _sfx_ai(m, s, tl):
    names = s["cfg"].get("sfx", [])
    d = s["end"] - s["start"]
    if "jungle" in names:                      # ambience for the whole story
        m.add(0.0, jungle_night(tl["story_end"] + 0.5), 0.7)
    if "squelch" in names:
        k, i = s["start"] + 0.3, 0
        while k < s["end"] - 0.3:
            m.add(k, squelch(i), 0.35, pan=0.2 if i % 2 else -0.2)
            k += 0.75
            i += 1
    if "whimper" in names:
        for i, off in enumerate((0.35, 0.65)):
            m.add(s["start"] + d * off, whimper(1.4, i), 0.9, pan=-0.3)
    if "whimper_far" in names:
        w = whimper(1.6, 5)
        m.add(s["start"] + d * 0.55, np.stack([audio.filt(w[:, 0], "low", 1200), audio.filt(w[:, 1], "low", 1200)], 1),
              0.6, pan=0.6)


audio.SFX["ai"] = _sfx_ai
