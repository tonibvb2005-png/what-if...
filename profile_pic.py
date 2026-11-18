#!/usr/bin/env python3
"""Render TikTok profile pictures (1080x1080) in the channel style.

TikTok crops to a circle, so everything important sits in the centre ~70 %.
"""
import math
import os
import sys

import skia

import gfx
from gfx import (R, paint, rad_paint, lin_paint, glow, moon, traveler, forest_row, haze, CREAM, RED, LANTERN,
                 SKY_TOP, SKY_MID, SKY_HAZE)

S = 1080


def lantern_icon(c, cx, cy, k=1.0, flame=RED, line=CREAM):
    """Line-art lantern (same emblem as the video outro)."""
    c.save()
    c.translate(cx, cy)
    c.scale(k, k)
    lp = paint(line, stroke=5, cap_round=True)
    c.drawCircle(0, -175, 15, lp)
    c.drawLine(0, -160, 0, -128, lp)
    path = skia.Path()
    path.moveTo(-70, -128); path.lineTo(70, -128); path.lineTo(54, -104); path.lineTo(-54, -104); path.close()
    c.drawPath(path, lp)
    c.drawRect(R(-58, -104, 58, 82), lp)
    c.drawLine(-58, -10, 58, -10, paint(line, 0.45, stroke=2.5))
    c.drawRect(R(-72, 82, 72, 100), paint(line))
    c.drawCircle(0, -10, 150, rad_paint(0, -10, 150, [(0, flame, 0.55), (1, flame, 0)]))
    fl = skia.Path()
    fl.moveTo(0, -72); fl.cubicTo(30, -24, 26, 24, 0, 31); fl.cubicTo(-26, 24, -30, -24, 0, -72)
    c.drawPath(fl, paint(flame))
    fl2 = skia.Path()
    fl2.moveTo(0, -30); fl2.cubicTo(13, -6, 11, 18, 0, 22); fl2.cubicTo(-11, 18, -13, -6, 0, -30)
    c.drawPath(fl2, paint((255, 190, 150), 0.8))
    c.restore()


def vignette(c):
    c.drawRect(R(0, 0, S, S), rad_paint(S / 2, S / 2, S * 0.72, [
        (0, (0, 0, 0), 0), (0.6, (0, 0, 0), 0.25), (1, (0, 0, 0), 0.8)]))


def variant_emblem(c):
    """A: lantern emblem in front of a full moon (clean, readable when tiny)."""
    c.drawRect(R(0, 0, S, S), lin_paint(0, 0, 0, S, [(0, SKY_TOP, 1), (1, SKY_MID, 1)]))
    moon(c, S / 2, S / 2 - 40, 300, (60, 58, 76), glow=0.8, craters=False)
    lantern_icon(c, S / 2, S / 2 + 70, k=1.9)
    vignette(c)


def variant_traveler(c):
    """B: lone traveler with lantern under a huge moon (like a frame from the videos)."""
    class _X:  # minimal ctx for stars/fog
        T = 0.0
    c.drawRect(R(0, 0, S, S), lin_paint(0, 0, 0, 760, [(0, SKY_TOP, 1), (0.6, SKY_MID, 1), (1, SKY_HAZE, 1)]))
    gfx.stars(c, _X, n=40, ymax=500, seed=5)
    moon(c, S / 2, 470, 280, gfx.MOON_WARM)
    haze(c, 640, 800, a=0.6)
    forest_row(c, 760, 22, 110, 220, (26, 26, 38), seed=3, x0=-100, x1=S + 100)
    c.drawRect(R(-10, 800, S + 10, S + 10), paint((14, 14, 20)))
    forest_row(c, 820, 6, 380, 560, (12, 12, 18), seed=4, x0=-150, x1=220)
    forest_row(c, 820, 6, 380, 560, (12, 12, 18), seed=6, x0=860, x1=S + 150)
    traveler(c, S / 2 - 20, 820, 1.05, phase=0.6, silhouette=0.9, flicker=1.0)
    vignette(c)


BW, BH = 2560, 1440          # YouTube banner; safe area for all devices: 1546 x 423 centred
SAFE = (BW / 2 - 773, BH / 2 - 211.5, BW / 2 + 773, BH / 2 + 211.5)


def youtube_banner(c):
    import story

    class _X:
        T = 0.0
    c.drawRect(R(0, 0, BW, BH), lin_paint(0, 0, 0, 980, [(0, SKY_TOP, 1), (0.6, SKY_MID, 1), (1, SKY_HAZE, 1)]))
    c.save()
    c.scale(BW / 1080, BW / 1080)
    gfx.stars(c, _X, n=90, ymax=420, seed=8)
    c.restore()
    moon(c, 1885, 700, 165, gfx.MOON_WARM)
    haze(c, 820, 990, a=0.6)
    forest_row(c, 945, 70, 90, 190, (28, 28, 40), seed=21, x0=-100, x1=BW + 100)
    c.drawRect(R(-10, 960, BW + 10, BH + 10), paint((14, 14, 20)))
    forest_row(c, 1000, 14, 330, 520, (12, 12, 18), seed=22, x0=-200, x1=560)
    forest_row(c, 1000, 14, 330, 520, (12, 12, 18), seed=23, x0=2080, x1=BW + 200)
    c.drawRect(R(-10, 1000, BW + 10, BH + 10), paint((12, 12, 18)))
    # traveler walking toward the moon, inside the safe area
    traveler(c, 1790, 925, 0.72, phase=0.6, silhouette=0.9, flicker=1.0)
    # channel name + tagline (left half of the safe area)
    cx = 1200
    f1 = gfx.font("Cinzel-SemiBold.ttf", 86)
    gfx.draw_text(c, story.CHANNEL_NAME, cx + 4, 741, f1, paint((0, 0, 0), 0.6, blur=12), spacing=8, align="center")
    gfx.draw_text(c, story.CHANNEL_NAME, cx, 736, f1, paint(CREAM), spacing=8, align="center")
    c.drawRect(R(cx - 60, 768, cx + 60, 772), paint(RED))
    gfx.draw_text(c, "DARK FOLKLORE  •  URBAN LEGENDS  •  NEW TALES WEEKLY", cx, 828,
                  gfx.font("Oswald-Medium.ttf", 32), paint(CREAM, 0.75), spacing=5, align="center")
    lantern_icon(c, 610, 745, k=0.42)
    c.drawRect(R(0, 0, BW, BH), rad_paint(BW / 2, BH / 2, BW * 0.62, [
        (0, (0, 0, 0), 0), (0.7, (0, 0, 0), 0.2), (1, (0, 0, 0), 0.7)]))


def watermark(c, size=300):
    c.clear(skia.ColorTRANSPARENT)
    c.drawCircle(size / 2, size / 2, size / 2 - 4, paint((10, 11, 16), 0.85))
    lantern_icon(c, size / 2, size / 2 + 22, k=0.62)


def save(fn, w, h, path, fmt=skia.kPNG):
    surf = skia.Surface(w, h)
    fn(surf.getCanvas())
    surf.makeImageSnapshot().save(path, fmt)
    print(path)


def main(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    for name, fn in (("profile_A_lantern", variant_emblem), ("profile_B_traveler", variant_traveler)):
        save(fn, S, S, os.path.join(out_dir, name + ".png"))
    # YouTube: 800x800 profile, 2560x1440 banner, 150x150 video watermark (rendered 2x)
    def yt_profile(c):
        c.scale(800 / S, 800 / S)
        variant_traveler(c)
    save(yt_profile, 800, 800, os.path.join(out_dir, "youtube_profile_800.png"))
    save(youtube_banner, BW, BH, os.path.join(out_dir, "youtube_banner_2560x1440.jpg"), skia.kJPEG)
    save(watermark, 300, 300, os.path.join(out_dir, "youtube_watermark.png"))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "output/profile")
