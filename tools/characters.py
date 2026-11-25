"""The channel's own characters, drawn entirely in code.

Bommel: fluffy round blue creature with pom-pom antennae.
Kiki:   small round pink bird, Bommel's friend.

All poses are cached; call with hashable args only.
"""
import math
from functools import lru_cache

from PIL import Image, ImageDraw

INK = (30, 30, 60)
BOMMEL_BLUE = (110, 195, 255)
BOMMEL_DARK = (60, 120, 210)
KIKI_PINK = (255, 150, 195)
KIKI_DARK = (240, 95, 150)


def _face(d, img, cx, cy, r, mood, eyes_open, mouth_open, beak=False):
    big = 1.18 if mood == "surprised" else 1.0
    for side in (-1, 1):
        ex, ey = cx + side * r * 0.36, cy - r * 0.28
        if eyes_open:
            ew, eh = r * 0.24 * big, r * 0.3 * big
            d.ellipse((ex - ew, ey - eh, ex + ew, ey + eh), fill="white", outline=INK, width=8)
            pw = r * 0.14
            py = ey + (r * 0.05 if mood == "sad" else 0)
            d.ellipse((ex - pw, py - pw * 0.9, ex + pw, py + pw * 1.3), fill=INK)
            hw = r * 0.06
            d.ellipse((ex - hw * 1.5, py - hw * 1.8, ex + hw * 0.3, py), fill="white")
        else:
            d.arc((ex - r * 0.22, ey - r * 0.12, ex + r * 0.22, ey + r * 0.2), 200, 340, fill=INK, width=14)
        if mood == "sad":  # brows slanting down outwards
            d.line((ex - side * r * 0.2, ey - r * 0.42, ex + side * r * 0.22, ey - r * 0.32), fill=INK, width=12)
        if mood == "surprised":
            d.arc((ex - r * 0.22, ey - r * 0.62, ex + r * 0.22, ey - r * 0.32), 200, 340, fill=INK, width=10)

    cheeks = Image.new("RGBA", img.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(cheeks)
    for side in (-1, 1):
        kx, ky = cx + side * r * 0.66, cy + r * 0.02
        cd.ellipse((kx - r * 0.15, ky - r * 0.09, kx + r * 0.15, ky + r * 0.09), fill=(255, 110, 140, 150))
    img.alpha_composite(cheeks)

    my = cy + r * 0.1
    if beak:
        bw, bh = r * 0.17, r * 0.2
        if mouth_open or mood == "surprised":
            d.polygon([(cx - bw, my - r * 0.06), (cx + bw, my - r * 0.06), (cx, my + bh * 0.6)], fill=(255, 170, 50))
            d.ellipse((cx - bw * 0.6, my + bh * 0.25, cx + bw * 0.6, my + bh * 0.95), fill=(150, 30, 60))
            d.polygon([(cx - bw * 0.8, my + bh * 0.8), (cx + bw * 0.8, my + bh * 0.8), (cx, my + bh * 1.3)], fill=(255, 150, 40))
        else:
            d.polygon([(cx - bw, my - r * 0.06), (cx + bw, my - r * 0.06), (cx, my + bh)], fill=(255, 170, 50))
        return
    if mood == "surprised":
        d.ellipse((cx - r * 0.12, my - r * 0.04, cx + r * 0.12, my + r * 0.24), fill=(150, 30, 60))
    elif mood == "sad":
        if mouth_open:
            d.ellipse((cx - r * 0.13, my + r * 0.02, cx + r * 0.13, my + r * 0.2), fill=(150, 30, 60))
        else:
            d.arc((cx - r * 0.18, my + r * 0.05, cx + r * 0.18, my + r * 0.3), 200, 340, fill=INK, width=14)
    elif mouth_open:
        d.chord((cx - r * 0.24, my - r * 0.18, cx + r * 0.24, my + r * 0.3), 0, 180, fill=(150, 30, 60))
        d.chord((cx - r * 0.13, my + r * 0.08, cx + r * 0.13, my + r * 0.28), 180, 360, fill=(255, 120, 140))
    else:
        d.arc((cx - r * 0.2, my - r * 0.15, cx + r * 0.2, my + r * 0.12), 20, 160, fill=INK, width=14)


def _finish(img):
    img = img.crop(img.getbbox())
    return img.resize((img.width // 2, img.height // 2), Image.LANCZOS)


@lru_cache(maxsize=None)
def bommel(mood="happy", eyes_open=True, mouth_open=False, scarf=False, size=470):
    S = size * 2
    img = Image.new("RGBA", (S, int(S * 1.3)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy, r = S / 2, S * 0.75, S * 0.36

    droop = 0.25 if mood == "sad" else 0.0
    for side in (-1, 1):
        x0, y0 = cx + side * r * 0.35, cy - r * 0.85
        x1, y1 = cx + side * r * (0.65 + droop), cy - r * (1.55 - droop * 1.2)
        d.line((x0, y0, (x0 + x1) / 2 + side * 20, (y0 + y1) / 2, x1, y1), fill=BOMMEL_DARK, width=22, joint="curve")
        pr = r * 0.17
        d.ellipse((x1 - pr, y1 - pr, x1 + pr, y1 + pr), fill=(255, 120, 170))
        d.ellipse((x1 - pr * 0.4, y1 - pr * 0.7, x1 + pr * 0.05, y1 - pr * 0.25), fill=(255, 200, 225))
    for side in (-1, 1):
        fx = cx + side * r * 0.45
        d.ellipse((fx - r * 0.3, cy + r * 0.78, fx + r * 0.3, cy + r * 1.08), fill=(255, 160, 60))
    for i in range(28):
        a = 2 * math.pi * i / 28
        fr = r * 0.16
        px, py = cx + math.cos(a) * r * 0.93, cy + math.sin(a) * r * 0.93
        d.ellipse((px - fr, py - fr, px + fr, py + fr), fill=BOMMEL_BLUE)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BOMMEL_BLUE)
    d.ellipse((cx - r * 0.55, cy + r * 0.05, cx + r * 0.55, cy + r * 0.85), fill=(200, 235, 255))
    for side in (-1, 1):
        ax = cx + side * r * 1.02
        d.ellipse((ax - r * 0.17, cy + r * 0.05, ax + r * 0.17, cy + r * 0.45), fill=BOMMEL_DARK)
    if scarf:
        y0, y1 = cy + r * 0.4, cy + r * 0.62
        d.rounded_rectangle((cx - r * 0.92, y0, cx + r * 0.92, y1), radius=int(r * 0.1), fill=(230, 60, 70))
        d.rounded_rectangle((cx + r * 0.35, y0, cx + r * 0.6, y1 + r * 0.45), radius=int(r * 0.08), fill=(230, 60, 70))
        for k in range(5):
            x = cx - r * 0.75 + k * r * 0.35
            d.line((x, y0 + 6, x, y1 - 6), fill=(255, 240, 240), width=10)
    _face(d, img, cx, cy, r, mood, eyes_open, mouth_open)
    return _finish(img)


@lru_cache(maxsize=None)
def kiki(mood="happy", eyes_open=True, mouth_open=False, wing_up=False, size=350):
    S = size * 2
    img = Image.new("RGBA", (int(S * 1.5), int(S * 1.4)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy, r = img.width / 2, S * 0.8, S * 0.36

    for k, dx in enumerate((-0.18, 0, 0.18)):  # head tuft
        tx = cx + dx * r
        d.ellipse((tx - r * 0.12, cy - r * 1.3 + abs(dx) * r, tx + r * 0.12, cy - r * 0.85), fill=KIKI_DARK)
    for side in (-1, 1):  # wings
        wx = cx + side * r * 1.02
        if wing_up:
            d.ellipse((wx - r * 0.18 + side * r * 0.08, cy - r * 0.8, wx + r * 0.18 + side * r * 0.08, cy + r * 0.05), fill=KIKI_DARK)
        else:
            d.ellipse((wx - r * 0.2, cy - r * 0.15, wx + r * 0.2, cy + r * 0.6), fill=KIKI_DARK)
    for side in (-1, 1):  # feet
        fx = cx + side * r * 0.3
        d.line((fx, cy + r * 0.9, fx, cy + r * 1.15), fill=(255, 150, 40), width=12)
        d.line((fx - r * 0.12, cy + r * 1.15, fx + r * 0.12, cy + r * 1.15), fill=(255, 150, 40), width=12)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=KIKI_PINK)
    d.ellipse((cx - r * 0.55, cy + r * 0.1, cx + r * 0.55, cy + r * 0.88), fill=(255, 225, 238))
    _face(d, img, cx, cy, r, mood, eyes_open, mouth_open, beak=True)
    return _finish(img)
