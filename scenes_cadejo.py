"""Animated scenes + sounds for 'El Cadejo' (registers into scenes.SCENES / audio.SFX).

Motion rules: everything monotonic in local time, feet/hooves on the ground.
"""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, fog, glow, light_shaft, paint, lin_paint, rad_paint, R, poly,
                 smooth_path, mix, ease, ramp, shake_amount, fur_path, traveler, MOON, MOON_WARM, CREAM, LANTERN)
from scenes_black_shuck import dog, dog_head_front, growl

flicker = scenes.flicker
EMBER = (255, 80, 30)
WHITE_DOG = dict(body_col=(196, 196, 204), rim_col=(240, 240, 250), far_col=(150, 150, 160))
ADOBE = [(70, 58, 52), (60, 64, 70), (74, 62, 44), (56, 50, 62)]
COBBLE = (44, 40, 40)


# ================================================================== elements
def volcano(c, cx, by, w, h, color=(22, 26, 34), T=0.0):
    c.drawPath(poly([(cx - w / 2, by), (cx - w * 0.08, by - h), (cx + w * 0.08, by - h), (cx + w / 2, by)]), paint(color))
    for i in range(6):                                     # thin smoke plume drifting
        f = i / 6
        glow(c, cx + f * 120 + math.sin(T * 0.4 + i) * 10, by - h - 40 - f * 260, 60 + f * 70, (120, 120, 130), 0.18 * (1 - f))


def church(c, cx, by, s, color=(38, 36, 40), lit=0.7, T=0.0):
    c.save()
    c.translate(cx, by)
    c.scale(s, s)
    c.drawRect(R(-160, -260, 160, 0), paint(color))
    c.drawPath(smooth_path([(-160, -260), (0, -330), (160, -260)], close=False), paint(color, stroke=0))
    c.drawPath(poly([(-170, -260), (-60, -300), (60, -300), (170, -260)]), paint(color))
    for sx in (-1, 1):
        c.drawRect(R(sx * 130 - 40, -420, sx * 130 + 40, -200), paint(color))
        c.drawPath(smooth_path([(sx * 130 - 44, -420), (sx * 130, -480), (sx * 130 + 44, -420)]), paint(color))
        c.drawPath(smooth_path([(sx * 130 - 16, -340), (sx * 130, -372), (sx * 130 + 16, -340), (sx * 130 + 16, -300),
                                (sx * 130 - 16, -300)]), paint((12, 10, 12)))
    c.drawPath(smooth_path([(-40, 0), (-40, -120), (0, -160), (40, -120), (40, 0)]), paint((14, 10, 10)))
    fl = flicker(T, 3)
    for wx in (-90, 90):
        c.drawRect(R(wx - 14, -200, wx + 14, -140), paint(LANTERN, lit * fl))
        glow(c, wx, -170, 90, LANTERN, 0.3 * lit)
    c.restore()


def colonial_street(c, x, vy=1050, lamps=True, seed=1):
    """Cobbled street between low colourful adobe houses with tiled roofs (perspective)."""
    c.drawRect(R(-500, vy, 1600, 2600), lin_paint(0, vy, 0, 1900, [(0, (52, 48, 48), 1), (1, (18, 16, 16), 1)]))
    rng = np.random.default_rng(seed)
    for i in range(36):                                    # cobbles
        yy = vy + (i / 36) ** 1.6 * 900
        half = 60 + (yy - vy) * 0.75
        for k in range(int(4 + i * 0.7)):
            xx = W / 2 + rng.uniform(-1, 1) * half
            r_ = 4 + (yy - vy) * 0.022
            c.drawOval(R(xx - r_ * 1.5, yy - r_ * 0.55, xx + r_ * 1.5, yy + r_ * 0.55), paint((30, 28, 28), 0.8))
    for side in (-1, 1):
        for k in range(5):
            f0, f1 = k / 5, (k + 1) / 5
            xa = W / 2 + side * (70 + f0 ** 1.4 * 700)
            xb = W / 2 + side * (70 + f1 ** 1.4 * 700)
            top_a, top_b = vy - 160 - f0 ** 1.4 * 520, vy - 160 - f1 ** 1.4 * 520
            bot_a, bot_b = vy + f0 ** 1.4 * 900, vy + f1 ** 1.4 * 900
            col = ADOBE[(k + (side > 0)) % len(ADOBE)]
            c.drawPath(poly([(xa, top_a), (xb, top_b), (xb, bot_b), (xa, bot_a)]), paint(col))
            c.drawPath(poly([(xa, top_a), (xb, top_b), (xb, top_b - 30 - k * 14), (xa, top_a - 30 - k * 10)]),
                       paint((60, 30, 24)))                # tile roof edge
            dx = (xa + xb) / 2
            dh = (bot_b - top_b) * 0.55
            c.drawRect(R(dx - dh * 0.18, (bot_a + bot_b) / 2 - dh, dx + dh * 0.18, (bot_a + bot_b) / 2), paint((24, 16, 14)))
    c.drawRect(R(-500, -500, 1600, vy - 700), paint((0, 0, 0), 0.0))
    if lamps:
        for side in (-1, 1):
            lx = W / 2 + side * 330
            ly = vy - 40
            c.drawLine(lx, ly, lx + side * 40, ly, paint((20, 18, 18), stroke=6))
            fl = flicker(x.T, side)
            c.drawRect(R(lx + side * 40 - 10, ly, lx + side * 40 + 10, ly + 24), paint((255, 210, 140), fl))
            glow(c, lx + side * 40, ly + 12, 260, LANTERN, 0.35 * fl)


def chain(c, x0, y0, x1, y1, n=14, sag=30, color=(110, 110, 118), w=10):
    for i in range(n):
        f = i / (n - 1)
        px = x0 + (x1 - x0) * f
        py = y0 + (y1 - y0) * f + math.sin(math.pi * f) * sag
        rx, ry = (w * 1.6, w) if i % 2 == 0 else (w * 0.6, w)
        c.drawOval(R(px - rx, py - ry, px + rx, py + ry), paint(color, stroke=w * 0.45))


def hoof_step(c, x, y, s, lift=0.0, color=(84, 68, 56)):
    """Goat leg: thin, knee bent backwards, shaggy tuft at the joint, split hoof. (x, y) = hoof on the ground."""
    top = (x - 6 * s, y - 230 * s - lift)
    knee = (x + 26 * s, y - 120 * s - lift)
    past = (x - 2 * s, y - 40 * s - lift)
    for off, colr in ((3 * s, (96, 86, 80)), (0, (14, 12, 14))):            # lamp-lit edge, then dark leg
        c.save(); c.translate(-off, -off * 0.5)
        c.drawLine(*top, *knee, paint(colr, stroke=40 * s, cap_round=True))
        c.drawLine(*knee, *past, paint(colr, stroke=17 * s, cap_round=True))
        c.restore()
    rng = np.random.default_rng(7)                    # fixed: no flicker, no negative seeds
    c.drawPath(fur_path(knee[0] - 4 * s, knee[1] - 6 * s, 26 * s, 22 * s, rng, spikes=18, jit=0.35), paint((14, 12, 14)))
    hx, hy = x, y - lift
    c.drawPath(poly([(hx - 22 * s, hy - 40 * s), (hx + 20 * s, hy - 40 * s), (hx + 30 * s, hy), (hx - 30 * s, hy)]),
               paint(color))
    c.drawLine(hx + 1 * s, hy - 34 * s, hx + 2 * s, hy, paint((10, 8, 8), stroke=5 * s))
    c.drawLine(hx - 20 * s, hy - 38 * s, hx + 18 * s, hy - 38 * s, paint((170, 150, 130), 0.7, stroke=4 * s))


# ================================================================== scenes
def cj_hook(c, x):
    x.push, x.focus = 0.2, (W / 2, 1150)
    with layer(c, x, 0.2):
        sky(c, top=(6, 8, 16), mid=(16, 20, 32), haze=(40, 44, 56), horizon=1050)
        stars(c, x, seed=130)
        volcano(c, 540, 1050, 900, 420, T=x.T)
        colonial_street(c, x, vy=1050)
    with layer(c, x, 0.6):
        k = ramp(x.t, 0.0, x.dur)
        tx = 520 + 220 * k
        traveler(c, tx, 1540, 0.95, phase=x.T * 4.2, silhouette=0.55, flicker=flicker(x.T))
        # two red eyes low in the dark behind him – visible from the very first frame
        dx = tx - 520 + 120 * k
        dog(c, dx, 1560, 0.85, phase=x.T * 4.2, T=x.T, eye_color=EMBER, hooves=True)
    with layer(c, x, 0.95):
        fog(c, x, 1600, a=0.2, speed=14, seed=2, color=(150, 150, 170), scale=1.4)


def cj_roads(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    with layer(c, x, 0.0):
        sky(c, top=(6, 8, 16), mid=(18, 22, 34), haze=(46, 48, 60), horizon=1150)
        stars(c, x, seed=131)
        moon(c, 800, 420, 110, MOON_WARM)
        volcano(c, 360, 1150, 1100, 560, color=(26, 30, 40), T=x.T)
    with layer(c, x, 0.4):
        haze(c, 1000, 1180, (80, 80, 96), a=0.4)
        c.drawRect(R(-500, 1150, 1600, 2600), paint((18, 18, 22)))
        church(c, 700, 1180, 0.9, T=x.T)
        c.drawPath(poly([(W / 2 - 20, 1180), (W / 2 + 20, 1180), (W / 2 + 500, 1950), (W / 2 - 500, 1950)]),
                   lin_paint(0, 1180, 0, 1900, [(0, (54, 50, 50), 1), (1, (24, 22, 22), 1)]))
    with layer(c, x, 0.9):
        fog(c, x, 1300, a=0.25, speed=10, seed=3, color=(150, 150, 170), scale=1.5)


def cj_title(c, x):
    x.push, x.focus = 0.16, (W / 2, 1200)
    with layer(c, x, 0.0):
        sky(c, top=(6, 8, 16), mid=(18, 22, 34), haze=(46, 48, 60), horizon=1300)
        stars(c, x, seed=132)
        moon(c, 540, 860, 250, MOON)
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1300, 1600, 2600), lin_paint(0, 1300, 0, 1800, [(0, (40, 38, 38), 1), (1, (12, 12, 14), 1)]))
        dog(c, 270, 1430, 0.95, walking=False, T=x.T, eyes=1.0, eye_color=(200, 230, 255), **WHITE_DOG)
        glow(c, 330, 1300, 300, (220, 230, 255), 0.18)
        dog(c, 810, 1430, 0.95, walking=False, facing=-1, T=x.T + 1.3, eyes=1.0, eye_color=EMBER, hooves=True)
    with layer(c, x, 0.95):
        fog(c, x, 1500, a=0.25, speed=14, seed=4, color=(150, 150, 170), scale=1.4)


def cj_white(c, x):
    x.push, x.focus = 0.1, (W / 2, 1150)
    scroll = x.t * 150
    with layer(c, x, 0.0):
        sky(c, top=(8, 10, 18), mid=(20, 26, 38), haze=(54, 58, 72), horizon=1200)
        stars(c, x, seed=133)
        moon(c, 300, 500, 90)
    with layer(c, x, 0.35):
        c.save()
        c.translate(-(scroll * 0.3) % 1600, 0)
        for k in (0, 1):
            c.save(); c.translate(k * 1600, 0)
            volcano(c, 600, 1200, 1300, 420, color=(28, 32, 42), T=x.T)
            c.restore()
        c.restore()
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1300, 1600, 2600), lin_paint(0, 1300, 0, 1800, [(0, (44, 42, 42), 1), (1, (14, 14, 16), 1)]))
        for k in range(10):                                # roadside posts sliding by
            px = (k * 200 - scroll) % 2000 - 200
            c.drawRect(R(px - 8, 1220, px + 8, 1320), paint((24, 22, 22)))
        glow(c, 620, 1300, 420, (220, 230, 255), 0.22)
        dog(c, 640, 1470, 0.85, phase=x.T * 4.0, T=x.T, eyes=1.0, eye_color=(200, 230, 255), **WHITE_DOG)
        traveler(c, 440, 1500, 0.95, phase=x.T * 4.0, silhouette=0.4, flicker=flicker(x.T))


def cj_black(c, x):
    x.push, x.focus = 0.16, (W / 2, 1300)
    th = x.wt("hunts", x.dur * 0.8)
    step = ease(ramp(x.t, 0.3, th + 0.2))
    with layer(c, x, 0.3):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (6, 6, 10), 1), (1, (20, 18, 18), 1)]))
        c.drawRect(R(-500, 1450, 1600, 2600), paint((26, 24, 24)))
        fl = flicker(x.T, 5)
        c.drawLine(200, 700, 280, 700, paint((20, 18, 18), stroke=6))
        c.drawRect(R(270, 700, 296, 730), paint((255, 210, 140), fl))
        glow(c, 283, 715, 520, LANTERN, 0.3 * fl)
        c.drawOval(R(0, 1440, 620, 1560), paint(LANTERN, 0.08 * fl))
    with layer(c, x, 0.6):
        # out of the black alley on the right into the lamplight
        dx = 1250 - 600 * step
        dog(c, dx, 1500, 1.25, phase=x.T * 3.2 * (1 - ramp(x.t, th, th + 0.3)), walking=step < 1, facing=-1, T=x.T,
            eye_color=EMBER, hooves=True)
    x.shake = shake_amount(x.t, [th], strength=10)


def cj_eyes(c, x):
    x.push, x.focus = 0.14, (W / 2, 900)
    ti = x.wt("instead", x.dur * 0.5) - 0.1
    if x.t < ti:
        with layer(c, x, 0.6):
            c.drawRect(R(-500, -500, 1600, 2600), paint((6, 6, 8)))
            ign = ease(ramp(x.t, 0.0, x.wt("embers", ti * 0.6)))
            dog_head_front(c, W / 2, 880, 1.3, eyes=0.15 + 0.85 * ign, T=x.T, eye_color=EMBER)
        return
    # hooves on the cobblestones (a closer 'cut')
    with layer(c, x, 0.5):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (8, 8, 10), 1), (0.6, (36, 32, 30), 1),
                                                                         (1, (60, 54, 50), 1)]))
        rng = np.random.default_rng(3)
        for i in range(90):
            cx_, cy_ = rng.uniform(-50, 1130), rng.uniform(1250, 1950)
            c.drawOval(R(cx_ - 50, cy_ - 18, cx_ + 50, cy_ + 18), paint((48, 44, 42)))
            c.drawOval(R(cx_ - 50, cy_ - 18, cx_ + 50, cy_ + 18), paint((20, 18, 18), stroke=3))
        fl = flicker(x.T, 4)
        glow(c, 560, 1500, 700, LANTERN, 0.3 * fl)
        tt = x.t - ti
        for k, bx in enumerate((380, 700)):
            lift = max(0.0, math.sin(tt * 3.2 + k * math.pi)) * 80
            hoof_step(c, bx, 1500, 3.2, lift=lift)


def cj_chains(c, x):
    x.push, x.focus = 0.12, (W / 2, 1300)
    k = ramp(x.t, 0.0, x.dur)
    with layer(c, x, 0.4):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (6, 6, 10), 1), (0.55, (38, 34, 32), 1),
                                                                         (1, (62, 56, 52), 1)]))
        rng = np.random.default_rng(5)
        for i in range(90):
            cx_, cy_ = rng.uniform(-50, 1130), rng.uniform(1100, 1950)
            c.drawOval(R(cx_ - 46, cy_ - 16, cx_ + 46, cy_ + 16), paint((48, 44, 42)))
            c.drawOval(R(cx_ - 46, cy_ - 16, cx_ + 46, cy_ + 16), paint((20, 18, 18), stroke=3))
        fl = flicker(x.T, 6)
        glow(c, 540, 1400, 760, LANTERN, 0.3 * fl)
    with layer(c, x, 0.7):
        # the chain drags from the left edge behind passing hooves; sparks where it scrapes
        head = -200 + 1500 * k
        chain(c, head - 1100, 1400, head, 1360, n=24, sag=24, w=22, color=(170, 168, 176))
        for j in range(5):
            sp = (x.T * 7 + j * 0.37) % 1.0
            sx_ = head - 40 - j * 160 + sp * 30
            sy_ = 1400 - sp * 80
            c.drawCircle(sx_, sy_, 7 * (1 - sp), paint((255, 200, 120), 1 - sp))
            glow(c, sx_, sy_, 30, (255, 190, 110), 0.5 * (1 - sp))
        for j, off in enumerate((60, 220)):
            lift = max(0.0, math.sin(x.T * 3.6 + j * math.pi)) * 60
            hoof_step(c, head + off, 1380, 2.6, lift=lift)


def cj_follow(c, x):
    x.push, x.focus = 0.12, (W / 2, 1250)
    tb = x.wt("behind", x.dur * 0.85)
    with layer(c, x, 0.2):
        colonial_street(c, x, vy=1000, seed=7)
    with layer(c, x, 0.6):
        gap = 520 * (1 - ease(ramp(x.t, 0.3, tb))) + 90
        tx = 700
        traveler(c, tx, 1560, 1.0, phase=x.T * 4.0, silhouette=0.5, flicker=flicker(x.T))
        dog(c, tx - gap - 120, 1570, 0.95, phase=x.T * 4.0, T=x.T, eye_color=EMBER, hooves=True)
    x.shake = shake_amount(x.t, [tb], strength=10)


def cj_vanish(c, x):
    x.push, x.focus = 0.14, (W / 2, 1300)
    td = x.wt("disappear", x.dur * 0.85)
    with layer(c, x, 0.2):
        colonial_street(c, x, vy=1000, seed=8)
    with layer(c, x, 0.6):
        # only his lantern and hat are left on the cobbles, the flame dying
        fl = flicker(x.T, 7) * (1 - 0.7 * ease(ramp(x.t, td - 0.3, td + 0.8)))
        roll = math.sin(x.t * 1.5) * 4 * (1 - ramp(x.t, 0, x.dur))
        c.save()
        c.translate(560, 1600)
        c.rotate(80 + roll)
        c.drawRRect(skia.RRect.MakeRectXY(R(-40, -60, 40, 60), 8, 8), paint((30, 24, 20)))
        c.drawRect(R(-26, -40, 26, 40), paint((255, 200, 120), fl))
        c.restore()
        glow(c, 560, 1600, 400, LANTERN, 0.35 * fl)
        c.drawOval(R(700, 1640, 860, 1680), paint((26, 22, 22)))
        c.drawRRect(skia.RRect.MakeRectXY(R(740, 1600, 820, 1650), 10, 10), paint((26, 22, 22)))
        chain(c, 120, 1700, 460, 1660, n=10, sag=10, w=10, color=(80, 80, 88))


def cj_pov(c, x):
    x.push, x.focus = 0.2, (W / 2, 1100)
    grow = ease(ramp(x.t, x.dur * 0.3, x.dur))
    with layer(c, x, 0.2):
        colonial_street(c, x, vy=1000, seed=9)
    with layer(c, x, 0.7):
        # your long shadow thrown ahead by a lamp behind you; a second, four-legged shadow growing beside it
        sp = paint((6, 6, 8), 0.85, blur=6)
        c.drawPath(poly([(W / 2 - 110, 2000), (W / 2 - 30, 1280), (W / 2 + 30, 1280), (W / 2 + 110, 2000)]), sp)
        c.drawOval(R(W / 2 - 34, 1210, W / 2 + 34, 1290), sp)
        if grow > 0:
            dx = W / 2 + 260
            body = fur_path(dx, 1500 - 120 * grow, 70 + 120 * grow, 30 + 60 * grow, np.random.default_rng(4),
                            spikes=30, jit=0.18)
            c.drawPath(body, paint((6, 6, 8), 0.8 * grow, blur=6))
            for lx in (-1, 1):
                c.drawLine(dx + lx * 60 * grow, 1500, dx + lx * 70 * grow, 2000, paint((6, 6, 8), 0.8 * grow, stroke=30 * grow,
                                                                                      blur=6))


def cj_reveal(c, x):
    x.push, x.focus = 0.28, (W / 2, 850)
    tr = x.wt("don't", 0.2) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((5, 5, 7)))
    if x.t < tr:
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=24)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        c.saveLayer(None, paint(a=k))
        glow(c, W / 2, 1200, 900, (160, 50, 30), 0.25)
        dog_head_front(c, W / 2, 720, 1.4, eyes=1.0, snarl=1.0, T=x.T, eye_color=EMBER)
        c.restore()


for _f in (cj_hook, cj_roads, cj_title, cj_white, cj_black, cj_eyes, cj_chains, cj_follow, cj_vanish, cj_pov, cj_reveal):
    scenes.SCENES[_f.__name__] = _f


# ================================================================== sounds
SR = audio.SR


def _noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def clink(seed=0):
    n = int(0.25 * SR)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    f = rng.uniform(1800, 3200)
    x = (np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.47 * t)) * np.exp(-t * 30) * 0.25
    return x + audio.filt(_noise(n, seed), "band", (2000, 6000)) * np.exp(-t * 80) * 0.15


def chain_drag(length, rate=9.0, seed=1):
    n = int(length * SR)
    out = np.zeros(n, np.float32)
    rng = np.random.default_rng(seed)
    k = 0.0
    while k < length - 0.25:
        x = clink(int(k * 100) + seed)
        i = int(k * SR)
        out[i:i + len(x)] += x[: n - i] * rng.uniform(0.4, 1.0)
        k += rng.exponential(1 / rate)
    scrape = audio.filt(_noise(n, seed), "band", (800, 3000)) * 0.05
    return audio.reverb(out + scrape, 0.25)


def clop(seed=0):
    n = int(0.2 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 420 * t) * np.exp(-t * 50) + audio.filt(_noise(n, seed), "band", (600, 2500))
            * np.exp(-t * 70) * 0.6) * 0.5


def church_bell():
    return audio.bell(6.0, 174.6)


def _at(s, word, frac=0.5):
    return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)


def _clops(m, t0, t1, rate=2.6, gain=0.4):
    k, i = t0, 0
    while k < t1:
        m.add(k, clop(i), gain, pan=0.3 if i % 2 else -0.3)
        k += 1 / rate
        i += 1


def _sfx_hook(m, s, tl):
    _clops(m, s["start"] + 0.2, s["end"], gain=0.25)
    m.add(s["start"] + 1.0, chain_drag(s["end"] - s["start"] - 1.0, rate=5), 0.35)


def _sfx_roads(m, s, tl):
    m.add(_at(s, "midnight", 0.8) - 0.2, church_bell(), 0.6)


def _sfx_title(m, s, tl):
    m.add(s["start"] + 1.0, growl(2.0, seed=12), 0.5, pan=0.4)


def _sfx_white(m, s, tl):
    p = audio.pad(s["end"] - s["start"], [261.6, 329.6, 392.0, 523.3], bright=0.2) * 0.12
    e = np.sin(np.pi * np.linspace(0, 1, len(p))) ** 1.2
    m.add(s["start"], p * e[:, None])


def _sfx_black(m, s, tl):
    _clops(m, s["start"] + 0.3, _at(s, "hunts", 0.8), rate=1.6, gain=0.5)
    m.add(_at(s, "hunts", 0.8) - 0.1, growl(2.5, seed=13), 1.0)


def _sfx_eyes(m, s, tl):
    m.add(_at(s, "embers", 0.3) - 0.1, audio.sting(1.6), 0.7)
    _clops(m, _at(s, "instead", 0.5), s["end"], rate=3.2, gain=0.7)


def _sfx_chains(m, s, tl):
    m.add(s["start"], chain_drag(s["end"] - s["start"] + 0.3, rate=12), 1.0)
    _clops(m, s["start"] + 0.2, s["end"], rate=3.6, gain=0.5)


def _sfx_follow(m, s, tl):
    k, i = s["start"] + 0.2, 0
    while k < _at(s, "behind", 0.85) - 0.3:
        m.add(k, audio.footstep(0.0), 0.3)
        k += 0.48
        i += 1
    return [(s["start"] + (s["end"] - s["start"]) * 0.4, _at(s, "behind", 0.85), 0.2)]   # it never makes a sound


def _sfx_vanish(m, s, tl):
    return [(_at(s, "disappear", 0.85), s["end"] + 0.2, 0.3)]


def _sfx_pov(m, s, tl):
    m.add(s["start"] + 0.5, chain_drag(s["end"] - s["start"] - 0.6, rate=8, seed=4), 0.6)


def _sfx_reveal(m, s, tl):
    tr = audio.reveal_time(tl)
    if tr is not None:
        m.add(tr - 0.05, growl(2.5, seed=14), 1.2)


audio.SFX.update({"cj_hook": _sfx_hook, "cj_roads": _sfx_roads, "cj_title": _sfx_title, "cj_white": _sfx_white,
                  "cj_black": _sfx_black, "cj_eyes": _sfx_eyes, "cj_chains": _sfx_chains, "cj_follow": _sfx_follow,
                  "cj_vanish": _sfx_vanish, "cj_pov": _sfx_pov, "cj_reveal": _sfx_reveal})
