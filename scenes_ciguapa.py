"""Animated scenes + sounds for 'La Ciguapa' (registers into scenes.SCENES / audio.SFX).

Motion rules: everything is a monotonic function of local time (walks never jump back),
feet stay on the ground. Her feet point backwards: she walks one way, toes point the other.
"""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, fog, glow, light_shaft, paint, lin_paint, rad_paint, R, poly,
                 smooth_path, mix, ease, ramp, shake_amount, fur_path, traveler, SIL, MOON, MOON_WARM, CREAM, LANTERN)
from scenes_ai import jungle_night, squelch, whimper

flicker = scenes.flicker
HAIR = (10, 10, 14)
HAIR_RIM = (70, 76, 100)
CG_SKIN = (120, 84, 64)
EYE = (240, 236, 214)
JUNGLE = (12, 18, 20)
MUD = (40, 34, 32)


# ================================================================== elements
def palm(c, x, by, h, lean=0.15, T=0.0, color=JUNGLE, seed=0):
    rng = np.random.default_rng(seed)
    tx, ty = x + h * lean, by - h
    trunk = skia.Path()
    trunk.moveTo(x - 12, by)
    trunk.quadTo(x + h * lean * 0.2, by - h * 0.5, tx - 6, ty)
    trunk.lineTo(tx + 6, ty)
    trunk.quadTo(x + h * lean * 0.2 + 16, by - h * 0.5, x + 12, by)
    trunk.close()
    c.drawPath(trunk, paint(color))
    sway = math.sin(T * 1.1 + seed) * 0.07
    ln0 = h * 0.42
    for k in range(9):
        a = -math.pi / 2 + (k - 4) * 0.38 + sway + rng.uniform(-0.05, 0.05)
        ln = ln0 * rng.uniform(0.8, 1.05) * (1 - abs(k - 4) * 0.04)
        droop = 0.55 + 0.35 * abs(math.cos(a))
        pts_top, pts_bot = [], []
        for j in range(13):
            f = j / 12
            px = tx + math.cos(a) * ln * f
            py = ty + math.sin(a) * ln * f + droop * ln * f * f * 0.9
            wdt = ln * 0.11 * math.sin(math.pi * min(1.0, f * 1.1)) + 2
            nx, ny = -math.sin(a), math.cos(a)
            serr = (1.0 if j % 2 else 0.55)
            pts_top.append((px + nx * wdt * serr, py + ny * wdt * serr - wdt * 0.3))
            pts_bot.append((px - nx * wdt * serr, py - ny * wdt * serr + wdt * 0.6))
        c.drawPath(poly(pts_top + pts_bot[::-1]), paint(color))
    c.drawCircle(tx, ty, h * 0.035, paint(color))


def fern(c, x, y, s, T=0.0, color=JUNGLE, seed=0):
    sway = math.sin(T * 1.4 + seed) * 0.06
    for k in range(7):
        a = -math.pi / 2 + (k - 3) * 0.32 + sway
        ln = 120 * s * (1 - abs(k - 3) * 0.12)
        ex, ey = x + math.cos(a) * ln, y + math.sin(a) * ln
        c.drawLine(x, y, ex, ey, paint(color, stroke=4 * s, cap_round=True))
        for j in range(8):
            f = (j + 1) / 9
            px, py = x + (ex - x) * f, y + (ey - y) * f
            ll = 26 * s * (1 - f)
            for sgn in (-1, 1):
                c.drawLine(px, py, px + math.cos(a + sgn * 1.0) * ll, py + math.sin(a + sgn * 1.0) * ll,
                           paint(color, stroke=3 * s, cap_round=True))


def jungle_mountains(c, x, horizon=1150, seed=0, moon_pos=(760, 520, 140)):
    sky(c, top=(6, 10, 18), mid=(18, 28, 40), haze=(46, 62, 72), horizon=horizon)
    stars(c, x, seed=seed + 120)
    if moon_pos:
        moon(c, moon_pos[0], moon_pos[1], moon_pos[2], MOON_WARM)
    rng = np.random.default_rng(seed)
    for k, (col, yb, amp) in enumerate((((30, 42, 52), horizon - 80, 260), ((20, 30, 36), horizon - 20, 180))):
        pts = [(-200, yb + 200)]
        xx = -200
        while xx < W + 200:
            xx += rng.uniform(80, 160)
            pts.append((xx, yb - rng.uniform(0.3, 1.0) * amp))
            xx += rng.uniform(60, 120)
            pts.append((xx, yb - rng.uniform(0.0, 0.3) * amp))
        pts.append((W + 300, yb + 200))
        c.drawPath(poly(pts + [(W + 300, 2600), (-200, 2600)]), paint(col))
        haze(c, yb - 120, yb + 40, (80, 96, 110), a=0.35)


def ciguapa(c, x, y, s, phase=0.0, walking=False, facing=1, eyes=1.0, T=0.0, show_feet=True):
    """Woman completely wrapped in very long black hair. Feet at (x, y), height ~360*s.
    facing = direction she WALKS; her toes point the other way (backward feet)."""
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    bob = -abs(math.sin(phase)) * 6 if walking else 0.0
    sway = math.sin(T * 1.3) * 8
    skin_d = mix(CG_SKIN, (0, 0, 0), 0.5)
    if show_feet:
        for k, side in enumerate((-1, 1)):
            step = math.sin(phase + k * math.pi) * (18 if walking else 0)
            lift = max(0.0, math.sin(phase + k * math.pi)) * (14 if walking else 0)
            fx = side * 14 + step * facing
            c.drawLine(side * 12, -110, fx, -14 - lift, paint(skin_d, stroke=15, cap_round=True))
            heel, toe = fx + 8 * facing, fx - 32 * facing          # toes point AGAINST walking direction
            c.drawPath(smooth_path([(heel, -18 - lift), (toe, -9 - lift), (toe - 2 * facing, 0 - lift),
                                    (heel, 0 - lift)]), paint(mix(CG_SKIN, (0, 0, 0), 0.35)))
    # slim body + arms hanging at her sides (barely visible through the hair)
    c.drawPath(smooth_path([(-26, -300 + bob), (26, -300 + bob), (40, -200), (30, -100), (-30, -100), (-40, -200)]),
               paint(mix(CG_SKIN, (0, 0, 0), 0.7)))
    for sgn in (-1, 1):
        c.drawLine(sgn * 34, -290 + bob, sgn * 52, -160, paint(skin_d, stroke=12, cap_round=True))
        c.drawLine(sgn * 52, -160, sgn * 50 + sway * 0.3, -118, paint(skin_d, stroke=10, cap_round=True))
    # head
    c.drawCircle(0, -326 + bob, 30, paint(mix(CG_SKIN, (0, 0, 0), 0.45)))
    # very long hair: falls from the crown down past the knees, ragged ends, swaying
    rng = np.random.default_rng(7)
    left = [(-34, -340 + bob), (-46, -280), (-52 + sway * 0.3, -200), (-58 + sway * 0.6, -120)]
    right = [(58 + sway * 0.6, -120), (52 + sway * 0.3, -200), (46, -280), (34, -340 + bob)]
    hem = [(58 + sway * 0.6 - k * 11.6, -120 + (14 if k % 2 else -6) + rng.uniform(-6, 6)) for k in range(1, 10)]
    hair = smooth_path([(0, -362 + bob), (34, -350 + bob)] + right + hem + left[::-1] + [(-34, -350 + bob)])
    c.save(); c.translate(-4, -3); c.drawPath(hair, paint(HAIR_RIM)); c.restore()
    c.drawPath(hair, paint(HAIR))
    # face opening: a sliver of face with the eyes
    c.drawOval(R(-16, -340 + bob, 16, -300 + bob), paint(mix(CG_SKIN, (0, 0, 0), 0.4)))
    for i in range(9):
        hx = -46 + i * 11.5
        c.drawLine(hx * 0.5, -352 + bob, hx + sway * 0.6, -112, paint((28, 30, 40), 0.55, stroke=2))
    c.drawLine(-6, -350 + bob, -10 + sway * 0.2, -230, paint(HAIR, stroke=6, cap_round=True))
    if eyes > 0:
        for ex in (-8, 8):
            glow(c, ex, -322 + bob, 22, EYE, 0.6 * eyes)
            c.drawOval(R(ex - 4.5, -325 + bob, ex + 4.5, -319 + bob), paint(EYE, eyes))
    c.restore()


def footprint(c, x, y, s, toes_dir=1, a=1.0, color=(20, 16, 16)):
    """Bare footprint seen from above-ish (flattened). toes_dir: +1 toes to the right, -1 to the left."""
    c.drawOval(R(x - 18 * s, y - 7 * s, x + 18 * s, y + 7 * s), paint(color, 0.85 * a))
    for k in range(5):
        tx = x + toes_dir * (24 + k * 0.5) * s
        ty = y + (k - 2) * 4.2 * s
        c.drawCircle(tx, ty, (3.6 - k * 0.35) * s, paint(color, 0.85 * a))


def trail(c, x0, x1, y, s, n, toes_dir, a=1.0):
    for i in range(n):
        f = i / max(1, n - 1)
        footprint(c, x0 + (x1 - x0) * f, y + (6 if i % 2 else -6) * s, s, toes_dir, a)


def path_scene(c, x, vy=1050, footprints=True, toward_camera=True):
    """A muddy trail going away into the jungle, footprints along it."""
    c.drawRect(R(-500, vy, 1600, 2600), lin_paint(0, vy, 0, 1900, [(0, (24, 28, 30), 1), (1, (10, 10, 12), 1)]))
    c.drawPath(poly([(W / 2 - 20, vy), (W / 2 + 20, vy), (W / 2 + 460, 2000), (W / 2 - 460, 2000)]),
               lin_paint(0, vy, 0, 1900, [(0, (52, 48, 46), 1), (1, (30, 26, 26), 1)]))
    if footprints:
        for i in range(9):
            f = (i / 9) ** 1.6
            yy = vy + 60 + f * 820
            sc = 0.5 + f * 3.2
            xx = W / 2 + (14 if i % 2 else -14) * sc
            # footprints seen from behind: toes pointing TOWARD the camera (down), heels away
            c.drawOval(R(xx - 7 * sc, yy - 16 * sc, xx + 7 * sc, yy + 16 * sc), paint((18, 14, 14), 0.85))
            for k in range(5):
                c.drawCircle(xx + (k - 2) * 3.6 * sc, yy + 21 * sc, (3.0 - abs(k - 2) * 0.4) * sc, paint((18, 14, 14), 0.85))


# ================================================================== scenes
def cg_hook(c, x):
    x.push, x.focus = 0.22, (W / 2, 1000)
    with layer(c, x, 0.0):
        jungle_mountains(c, x, horizon=1060, seed=1, moon_pos=(560, 560, 170))
    with layer(c, x, 0.4):
        path_scene(c, x, vy=1060)
        ciguapa(c, W / 2 + 6, 1080, 0.42, T=x.T, eyes=1.0)                 # visible from the very first frame
        for k, (px, h_, ln) in enumerate(((120, 700, 0.12), (980, 760, -0.15), (300, 420, 0.1), (820, 480, -0.1))):
            palm(c, px, 1120, h_, ln, x.T, seed=k)
    with layer(c, x, 0.85):
        for k, px in enumerate((60, 1020, 240, 860)):
            fern(c, px, 1950, 2.6, x.T, seed=k)
        fog(c, x, 1150, a=0.3, speed=10, seed=2, color=(150, 170, 180), scale=1.4)


def cg_mountains(c, x):
    x.push, x.focus = 0.12, (W / 2, 900)
    with layer(c, x, 0.0):
        jungle_mountains(c, x, horizon=1250, seed=2, moon_pos=(540, 560, 230))
    with layer(c, x, 0.35):
        fl = flicker(x.T, 1)
        rng = np.random.default_rng(3)
        for i in range(9):                                  # village lights in the valley
            lx, ly = 380 + rng.uniform(0, 340), 1200 + rng.uniform(0, 40)
            c.drawRect(R(lx - 4, ly - 4, lx + 4, ly + 4), paint(LANTERN, 0.8 * fl))
            glow(c, lx, ly, 30, LANTERN, 0.3)
        fog(c, x, 1180, a=0.4, speed=8, seed=3, color=(140, 160, 170), scale=1.6)
    with layer(c, x, 0.8):
        c.drawRect(R(-500, 1400, 1600, 2600), paint(JUNGLE))
        for k, (px, h_, ln) in enumerate(((60, 900, 0.18), (1020, 820, -0.2))):
            palm(c, px, 1460, h_, ln, x.T, seed=k + 4)
        for k, px in enumerate((200, 900)):
            fern(c, px, 1500, 2.0, x.T, seed=k + 4)


def cg_title(c, x):
    x.push, x.focus = 0.16, (W / 2, 1150)
    with layer(c, x, 0.0):
        sky(c, top=(6, 10, 18), mid=(20, 26, 36), haze=(50, 60, 70), horizon=1300)
        stars(c, x, seed=121)
        moon(c, 540, 900, 280, MOON_WARM)
    with layer(c, x, 0.4):
        haze(c, 1100, 1330, (80, 96, 110), a=0.5)
        for k, (px, h_, ln) in enumerate(((60, 900, 0.16), (1000, 980, -0.18), (230, 600, 0.1), (850, 640, -0.1))):
            palm(c, px, 1330, h_, ln, x.T, seed=k + 10)
        c.drawRect(R(-500, 1320, 1600, 2600), lin_paint(0, 1320, 0, 1800, [(0, (24, 26, 28), 1), (1, (8, 8, 10), 1)]))
        ciguapa(c, 540, 1340, 1.25, T=x.T, eyes=ease(ramp(x.t, 0.2, 1.0)))
        rng = np.random.default_rng(5)
        for i in range(18):                                 # fireflies drifting upward
            fx = rng.uniform(80, 1000) + math.sin(x.T + i) * 20
            fy = 1300 - ((x.T * 18 + rng.uniform(0, 500)) % 500)
            glow(c, fx, fy, 14, (255, 220, 120), 0.6)
    with layer(c, x, 0.9):
        for k, px in enumerate((80, 1000)):
            fern(c, px, 1700, 2.4, x.T, seed=k + 12)


def cg_eyes(c, x):
    x.push, x.focus = 0.14, (W / 2, 900)
    ts = x.wt("shine", x.dur * 0.3)
    e = 0.35 + 0.65 * ease(ramp(x.t, ts - 0.2, ts + 0.3))
    with layer(c, x, 0.0):
        c.drawRect(R(-500, -500, 1600, 2600), paint((6, 8, 10)))
        for k, px in enumerate((100, 980)):
            palm(c, px, 1700, 1400, 0.1 if k else -0.1, x.T, color=(14, 20, 22), seed=k + 20)
    with layer(c, x, 0.7):
        sway = math.sin(x.T * 1.2) * 14
        cx, cy = W / 2, 900
        hair = smooth_path([(cx - 300, 2100), (cx - 330 + sway, 1100), (cx - 260, 640), (cx, 520), (cx + 260, 640),
                            (cx + 330 + sway, 1100), (cx + 300, 2100)])
        c.save(); c.translate(-8, -6); c.drawPath(hair, paint(HAIR_RIM)); c.restore()
        c.drawPath(hair, paint(HAIR))
        c.drawOval(R(cx - 140, cy - 120, cx + 140, cy + 140), paint(mix(CG_SKIN, (0, 0, 0), 0.6)))
        for i in range(16):                                 # strands falling over the face
            hx = cx - 150 + i * 20
            c.drawLine(hx + sway * 0.3, 600, hx + sway, 1300 + (i % 3) * 60, paint(HAIR, 0.9 if i % 4 else 0.5, stroke=9))
        for ex in (cx - 62, cx + 62):
            glow(c, ex, cy, 120, EYE, 0.6 * e)
            c.drawOval(R(ex - 34, cy - 14, ex + 34, cy + 14), paint(EYE, e))


def cg_feet(c, x):
    x.push, x.focus = 0.12, (W / 2, 1300)
    tb = x.wt("backwards", x.dur * 0.8)
    step = ease(ramp(x.t, 0.4, tb))                       # one slow step, continuous
    with layer(c, x, 0.3):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (8, 10, 14), 1), (0.6, (26, 30, 32), 1),
                                                                         (1, (34, 30, 28), 1)]))
        light_shaft(c, [(380, -100), (700, -100), (820, 1500), (260, 1500)], color=(200, 200, 220), a=0.12)
        c.drawRect(R(-500, 1450, 1600, 2600), lin_paint(0, 1450, 0, 1900, [(0, MUD, 1), (1, (16, 14, 14), 1)]))
        # older backward footprints already in the mud
        trail(c, 80, 300, 1560, 3.0, 2, toes_dir=1)
    with layer(c, x, 0.6):
        # two legs walking LEFT, feet pointing RIGHT (heels lead)
        base = 620 - 140 * step
        for k in range(2):
            lift = math.sin(math.pi * step) * 90 if k == 0 else 0.0
            fx = base + (0 if k else 120) - (150 * step if k == 0 else 0)
            fy = 1490 - lift
            leg = paint(mix(CG_SKIN, (0, 0, 0), 0.25))
            c.drawLine(fx + 20, -100, fx + 10, fy - 60, paint(mix(CG_SKIN, (0, 0, 0), 0.5), stroke=70, cap_round=True))
            c.drawPath(smooth_path([(fx - 30, fy - 70), (fx + 40, fy - 60), (fx + 200, fy - 20), (fx + 210, fy + 10),
                                    (fx - 40, fy + 10)]), leg)
            for t_ in range(5):
                c.drawCircle(fx + 200 + t_ * 2, fy - 18 + t_ * 7, 12 - t_, leg)
        # hair hanging down behind the legs
        sway = math.sin(x.T * 1.3) * 20
        c.drawPath(smooth_path([(base - 120 + sway, -200), (base + 260 + sway, -200), (base + 280 + sway, 900),
                                (base + 100 + sway, 1000), (base - 120 + sway, 940)]), paint(HAIR, 0.92))
        glow(c, base + 100, 1470, 420, (200, 205, 225), 0.22)            # moonlight pool on the feet


def cg_tracks(c, x):
    x.push, x.focus = 0.1, (W / 2, 1200)
    walk = ramp(x.t, 0.0, x.dur)
    with layer(c, x, 0.0):
        jungle_mountains(c, x, horizon=1150, seed=4, moon_pos=(260, 480, 110))
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1250, 1600, 2600), lin_paint(0, 1250, 0, 1900, [(0, (44, 40, 38), 1), (1, (14, 12, 12), 1)]))
        for k, (px, h_, ln) in enumerate(((40, 800, 0.15), (1040, 760, -0.15))):
            palm(c, px, 1260, h_, ln, x.T, seed=k + 30)
        # she walks right -> left; the trail she leaves points to the right (the wrong way)
        cx = 1250 - 1500 * walk
        steps = int((1250 - cx) / 95)
        for i in range(steps):
            fxp = 1250 - (i + 0.5) * 95
            footprint(c, fxp, 1500 + (10 if i % 2 else -10), 2.2, toes_dir=1, a=min(1.0, (cx - fxp) * -0.02 + 1.4))
        ciguapa(c, cx, 1500, 1.05, phase=x.T * 4.5, walking=True, facing=-1, T=x.T)
    with layer(c, x, 0.9):
        fog(c, x, 1600, a=0.2, speed=12, seed=5, color=(150, 170, 180), scale=1.4)


def cg_hunters(c, x):
    x.push, x.focus = 0.12, (W / 2, 1050)
    tn = x.wt("never", x.dur * 0.75)
    with layer(c, x, 0.0):
        sky(c, top=(4, 6, 10), mid=(12, 18, 24), haze=(30, 40, 46), horizon=1100)
    with layer(c, x, 0.4):
        path_scene(c, x, vy=1100, footprints=True)
        # giant trunks and vines
        for k, (px, w_) in enumerate(((140, 200), (930, 240), (340, 90), (740, 100))):
            c.drawRect(R(px - w_ / 2, -400, px + w_ / 2, 1150 + 80 * (k < 2)), paint((8, 12, 14)))
        for i in range(10):
            vx = 200 + i * 80
            c.drawLine(vx, -100, vx + math.sin(x.T + i) * 10, 600 + (i % 3) * 140, paint((10, 16, 16), stroke=4))
        k = ramp(x.t, 0.0, x.dur)
        for j in range(2):                                   # two hunters walking away, lanterns fading
            hx = W / 2 - 50 + j * 90
            hy = 1820 - 560 * k - j * 40
            sc = 1.5 - 1.0 * k
            la = 1.0 - ease(ramp(x.t, tn, tn + 0.8))
            traveler(c, hx, hy, sc, phase=x.T * 3.5 + j, silhouette=0.85, lantern_a=la, flicker=flicker(x.T, j))
        fog(c, x, 1150, a=0.4, speed=6, seed=6, color=(140, 160, 170), scale=1.6)


def cg_moon(c, x):
    x.push, x.focus = 0.16, (W / 2, 900)
    with layer(c, x, 0.0):
        sky(c, top=(6, 10, 18), mid=(20, 26, 36), haze=(50, 60, 70), horizon=1250)
        stars(c, x, seed=122)
        moon(c, 540, 820, 360, MOON)
    with layer(c, x, 0.4):
        c.drawPath(poly([(-200, 1400), (300, 1180), (460, 1080), (560, 1070), (620, 1120), (900, 1240), (1300, 1400),
                         (1300, 2600), (-200, 2600)]), paint((14, 18, 22)))
        ciguapa(c, 520, 1078, 0.42, T=x.T * 1.6, eyes=1.0, show_feet=False)
        haze(c, 1200, 1500, (100, 116, 130), a=0.45)
    with layer(c, x, 0.85):
        c.drawRect(R(-500, 1500, 1600, 2600), paint(JUNGLE))
        for k, px in enumerate((80, 380, 700, 1000)):
            fern(c, px, 1560, 2.2, x.T, seed=k + 40)


def cg_whimper(c, x):
    x.push, x.focus = 0.16, (W / 2, 1200)
    tw = x.wt("whimpers", x.dur * 0.35)
    with layer(c, x, 0.2):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (4, 6, 8), 1), (1, (16, 20, 20), 1)]))
        glow(c, W / 2, 300, 700, (140, 160, 180), 0.12)
        # huge twisted roots around a dark hollow
        for k, sgn in enumerate((-1, 1)):
            for j in range(3):
                pth = skia.Path()
                pth.moveTo(W / 2 + sgn * (60 + j * 40), 700)
                pth.cubicTo(W / 2 + sgn * (200 + j * 80), 1000, W / 2 + sgn * (120 + j * 160), 1300,
                            W / 2 + sgn * (360 + j * 120), 1600)
                c.drawPath(pth, paint((22, 26, 26), stroke=70 - j * 15, cap_round=True))
        c.drawOval(R(W / 2 - 200, 1080, W / 2 + 200, 1420), paint((2, 2, 4)))
        e = ease(ramp(x.t, tw - 0.4, tw + 0.3))
        blink = 1.0 if 0.0 < (x.t - tw) % 2.7 < 0.1 else 0.0
        for ex in (W / 2 - 34, W / 2 + 34):
            glow(c, ex, 1300, 60, EYE, 0.6 * e)
            c.drawOval(R(ex - 12, 1300 - 6 * (1 - blink), ex + 12, 1300 + 6 * (1 - blink)), paint(EYE, e))
    with layer(c, x, 0.8):
        shake = math.sin(x.T * 20) * 6 * ease(ramp(x.t, tw, tw + 0.3))
        for k, px in enumerate((180, 900)):
            c.save(); c.translate(shake * (1 if k else -1), 0)
            fern(c, px, 1800, 3.0, x.T, seed=k + 50)
            c.restore()


def cg_pov(c, x):
    x.push, x.focus = 0.22, (W / 2, 1000)
    with layer(c, x, 0.0):
        sky(c, top=(4, 6, 10), mid=(12, 18, 24), haze=(30, 40, 46), horizon=1050)
    with layer(c, x, 0.4):
        path_scene(c, x, vy=1050)
        for k, (px, w_) in enumerate(((100, 220), (980, 240))):
            c.drawRect(R(px - w_ / 2, -400, px + w_ / 2, 1300), paint((6, 8, 10)))
        fog(c, x, 1100, a=0.45, speed=6, seed=7, color=(140, 160, 170), scale=1.6)
    with layer(c, x, 0.85):
        # your lantern at the bottom of the frame
        fl = flicker(x.T, 9)
        lx, ly = W / 2 + 40, 1760 + math.sin(x.T * 3) * 8
        glow(c, lx, ly, 700, LANTERN, 0.35 * fl)
        c.drawLine(lx, ly - 80, lx + 30, 2100, paint((40, 30, 26), stroke=30, cap_round=True))
        c.drawRRect(skia.RRect.MakeRectXY(R(lx - 50, ly - 70, lx + 50, ly + 60), 10, 10), paint((30, 24, 20)))
        c.drawRect(R(lx - 34, ly - 50, lx + 34, ly + 40), paint((255, 210, 140), fl))
        # long black hair creeping in at the edges of the frame (she is right behind you)
        creep = ease(ramp(x.t, x.dur * 0.4, x.dur))
        for sgn in (-1, 1):
            for i in range(10):
                hx = (0 if sgn < 0 else W) + sgn * (-20 + creep * (40 + i * 14))
                c.drawLine(hx, -100, hx + sgn * 30, 900 + i * 60, paint(HAIR, 0.9, stroke=14))


def cg_reveal(c, x):
    x.push, x.focus = 0.28, (W / 2, 850)
    tr = x.wt("the", 0.2) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((5, 5, 7)))
    if x.t < tr:
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=24)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        c.saveLayer(None, paint(a=k))
        cx, cy = W / 2, 900
        rng = np.random.default_rng(3)
        c.drawRect(R(-500, -500, 1600, 2600), paint((8, 6, 8)))
        c.drawPath(fur_path(cx, cy + 260, 470, 900, rng, spikes=50, jit=0.12), paint(HAIR))
        face = smooth_path([(cx - 150, cy - 230), (cx, cy - 280), (cx + 150, cy - 230), (cx + 185, cy - 40),
                            (cx + 150, cy + 170), (cx + 75, cy + 310), (cx, cy + 340), (cx - 75, cy + 310),
                            (cx - 150, cy + 170), (cx - 185, cy - 40)])
        c.drawPath(face, lin_paint(0, cy - 280, 0, cy + 340, [(0, (110, 84, 70), 1), (1, (178, 136, 110), 1)]))
        c.save()
        c.clipPath(face, doAntiAlias=True)
        for ex in (cx - 78, cx + 78):
            c.drawOval(R(ex - 80, cy - 120, ex + 80, cy + 30), paint((14, 8, 8), 0.6, blur=22))
        for sx in (-1, 1):
            c.drawOval(R(cx + sx * 140 - 60, cy + 40, cx + sx * 140 + 50, cy + 220), paint((20, 12, 10), 0.7, blur=20))
        c.restore()
        ex, ey = cx + 78, cy - 45                       # one huge staring eye, the other under the hair
        glow(c, ex, ey, 130, EYE, 0.75)
        c.drawOval(R(ex - 58, ey - 34, ex + 58, ey + 34), paint(EYE))
        c.drawCircle(ex, ey, 8, paint((6, 4, 4)))
        c.drawPath(smooth_path([(cx - 32, cy + 110), (cx, cy + 92), (cx + 32, cy + 110), (cx + 38, cy + 270),
                                (cx, cy + 305), (cx - 38, cy + 270)]), paint((10, 4, 6)))
        c.drawPath(smooth_path([(cx - 190, cy - 240), (cx - 10, cy - 260), (cx + 4, cy + 40), (cx - 50, cy + 340),
                                (cx - 200, cy + 200)]), paint(HAIR))
        for i in range(16):
            hx = cx + rng.uniform(-170, 190)
            pth = skia.Path()
            pth.moveTo(hx, cy - 280)
            pth.cubicTo(hx + rng.uniform(-40, 40), cy - 60, hx + rng.uniform(-40, 40), cy + 120, hx + rng.uniform(-30, 30),
                        cy + rng.uniform(170, 360))
            c.drawPath(pth, paint(HAIR, 0.9, stroke=rng.uniform(4, 9), cap_round=True))
        c.drawRect(R(-500, -500, 1600, 2600), paint((90, 0, 0), 0.14))
        c.restore()


for _f in (cg_hook, cg_mountains, cg_title, cg_eyes, cg_feet, cg_tracks, cg_hunters, cg_moon, cg_whimper, cg_pov,
           cg_reveal):
    scenes.SCENES[_f.__name__] = _f


# ================================================================== sounds
def _at(s, word, frac=0.5):
    return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)


def _sfx_hook(m, s, tl):
    m.add(0.0, jungle_night(tl["story_end"] + 0.5), 0.7)


def _sfx_feet(m, s, tl):
    tb = _at(s, "backwards", 0.8)
    m.add(tb - 0.1, squelch(3), 0.8)
    m.add(tb - 0.1, audio.sting(1.8), 0.7)


def _sfx_tracks(m, s, tl):
    k, i = s["start"] + 0.2, 0
    while k < s["end"]:
        m.add(k, squelch(10 + i), 0.4, pan=0.4 - 0.8 * (k - s["start"]) / max(0.1, s["end"] - s["start"]))
        k += 1 / 2.25
        i += 1


def _sfx_hunters(m, s, tl):
    tn = _at(s, "never", 0.75)
    k, i = s["start"] + 0.2, 0
    while k < tn:
        m.add(k, audio.footstep(0.0), 0.3 * (1 - (k - s["start"]) / max(0.1, tn - s["start"])))
        k += 0.5
        i += 1
    m.add(tn, audio.boom(2.5, f0=60, f1=25), 0.6)
    return [(tn + 0.2, s["end"] + 0.2, 0.35)]


def _sfx_whimper(m, s, tl):
    tw = _at(s, "whimpers", 0.35)
    m.add(tw - 0.1, whimper(1.4, 1), 0.95, pan=-0.2)
    m.add(tw + 1.8, whimper(1.2, 2), 0.8, pan=0.2)


def _sfx_pov(m, s, tl):
    k, i = s["start"] + 0.3, 0
    while k < s["end"] - 0.4:
        m.add(k, squelch(30 + i), 0.3)
        k += 0.7
        i += 1
    w = whimper(1.6, 5)
    m.add(s["start"] + (s["end"] - s["start"]) * 0.6,
          np.stack([audio.filt(w[:, 0], "low", 1200), audio.filt(w[:, 1], "low", 1200)], 1), 0.7, pan=0.6)


audio.SFX.update({"cg_hook": _sfx_hook, "cg_feet": _sfx_feet, "cg_tracks": _sfx_tracks, "cg_hunters": _sfx_hunters,
                  "cg_whimper": _sfx_whimper, "cg_pov": _sfx_pov})
