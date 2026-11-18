"""Scenes + sounds for 'Der Rattenfänger von Hameln' (registers into scenes.SCENES / audio.SFX)."""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, forest_row, hills, fog, glow, light_shaft, paint, lin_paint,
                 rad_paint, R, poly, smooth_path, mix, ease, ramp, shake_amount, fur_path, font, draw_text, _limb,
                 SIL, GROUND, MOON, MOON_WARM, CREAM, RED, LANTERN, EYE, SKY_TOP, SKY_MID, SKY_HAZE)

flicker = scenes.flicker

PIED = [(150, 52, 50), (176, 134, 62), (52, 92, 92)]
HUNTER = [(30, 40, 32), (22, 26, 24), (44, 52, 40)]
TOWN = (20, 19, 28)
PARCH = (186, 160, 118)


# ================================================================== elements
def house(c, x, by, w, h, color, rng, lit=0.5, detail=False, T=0.0):
    rh = w * 0.85
    c.drawRect(R(x - w / 2, by - h, x + w / 2, by + 2), paint(color))
    c.drawPath(poly([(x - w / 2 - 6, by - h), (x, by - h - rh), (x + w / 2 + 6, by - h)]), paint(mix(color, (0, 0, 0), 0.25)))
    if detail:
        dk = paint(mix(color, (0, 0, 0), 0.45), stroke=max(2.0, w * 0.035))
        for fy in np.linspace(by - h, by, 4):
            c.drawLine(x - w / 2, fy, x + w / 2, fy, dk)
        for fx in np.linspace(x - w / 2, x + w / 2, 4):
            c.drawLine(fx, by - h, fx, by, dk)
        c.drawLine(x - w / 2, by - h * 0.66, x - w / 6, by - h * 0.33, dk)
        c.drawLine(x + w / 2, by - h * 0.66, x + w / 6, by - h * 0.33, dk)
    floors = max(1, int(h // 70))
    for f in range(floors):
        for k in (-1, 1):
            if rng.uniform() < lit:
                fl = 0.75 + 0.25 * math.sin(T * 2.5 + x * 0.1 + f)
                wx, wy = x + k * w * 0.22, by - h + 30 + f * 70
                ww = max(5.0, w * 0.12)
                c.drawRect(R(wx - ww / 2, wy, wx + ww / 2, wy + ww * 1.4), paint(LANTERN, 0.85 * fl))
                glow(c, wx, wy + ww * 0.7, ww * 4, LANTERN, 0.22 * fl)


def town_row(c, by, x0, x1, color, seed, hmin=90, hmax=200, wmin=60, wmax=120, lit=0.45, detail=False, T=0.0,
             church_x=None):
    rng = np.random.default_rng(seed)
    x = x0
    while x < x1:
        w = rng.uniform(wmin, wmax)
        house(c, x + w / 2, by + rng.uniform(-4, 4), w, rng.uniform(hmin, hmax), color, rng, lit, detail, T)
        x += w * rng.uniform(0.85, 1.0)
    if church_x is not None:
        s = hmax / 200
        for dx in (-34 * s, 34 * s):
            c.drawRect(R(church_x + dx - 22 * s, by - 330 * s, church_x + dx + 22 * s, by), paint(color))
            c.drawPath(poly([(church_x + dx - 26 * s, by - 330 * s), (church_x + dx, by - 440 * s),
                             (church_x + dx + 26 * s, by - 330 * s)]), paint(color))
        c.drawRect(R(church_x - 80 * s, by - 190 * s, church_x + 80 * s, by), paint(color))
    c.drawRect(R(x0 - 50, by, x1 + 50, by + 900), paint(color))


def town_gate(c, x, by, s, color=TOWN, rim=(60, 58, 76), arch_light=None):
    c.save()
    c.translate(x, by)
    c.scale(s, s)
    for off, colr in ((4, rim), (0, color)):
        c.save()
        c.translate(-off, 0)
        p = paint(colr)
        c.drawRect(R(-170, -520, 170, 0), p)
        for k in range(-3, 4):
            c.drawRect(R(k * 46 - 18, -560, k * 46 + 18, -520), p)
        c.drawPath(poly([(-190, -560), (0, -700), (190, -560)]), p)
        c.restore()
    arch = skia.Path()
    arch.moveTo(-90, 0)
    arch.lineTo(-90, -230)
    arch.arcTo(R(-90, -320, 90, -140), 180, 180, False)
    arch.lineTo(90, 0)
    arch.close()
    if arch_light is not None:
        c.drawPath(arch, lin_paint(0, -320, 0, 0, [(0, arch_light, 1), (1, mix(arch_light, (0, 0, 0), 0.6), 1)]))
    else:
        c.drawPath(arch, paint((6, 6, 9)))
    c.restore()
    return arch


def piper(c, x, y, s, phase=0.0, outfit=PIED, playing=True, dance=True, silhouette=0.0, facing=1, T=0.0):
    """Tall thin piper, side view facing right. Feet at (x,y), height ~ 380*s."""
    def C(rgb):
        return mix(rgb, SIL, silhouette)
    c.save()
    bob = -abs(math.sin(phase)) * 8 if dance else 0
    c.translate(x, y + bob)
    c.scale(s * facing, s)
    sw = math.sin(phase) * (30 if dance else 0)
    hip = -160
    # cape behind
    flap = math.sin(T * 2.2) * 10
    c.drawPath(smooth_path([(-20, -285), (-70 - flap, -200), (-96 - flap, -110), (-50, -120), (-10, -200)]),
               paint(C((40, 28, 36))))
    for side, colr in ((-1, outfit[1]), (1, outfit[0])):
        fx, fy = _limb(c, 0, hip, sw * side, 80, sw * side - (abs(math.sin(phase)) * 25 if dance else 0), 80, 15,
                       C(colr))
        c.drawPath(poly([(fx - 8, fy - 6), (fx + 30, fy + 2), (fx - 8, fy + 6)]), paint(C((24, 20, 20))))
    tunic = smooth_path([(-28, -282), (20, -286), (34, -210), (42, -150), (0, -138), (-42, -146), (-36, -210)])
    c.save()
    c.clipPath(tunic, doAntiAlias=True)
    c.drawRect(R(-60, -300, 60, -120), paint(C(outfit[0])))
    for k in range(-6, 8):
        c.save()
        c.translate(k * 26, -210)
        c.rotate(45)
        c.drawRect(R(-8, -200, 8, 200), paint(C(outfit[(k % 2) + 1])))
        c.restore()
    c.drawRect(R(-60, -300, 60, -120), lin_paint(-50, 0, 50, 0, [(0, (0, 0, 0), 0.45), (1, (0, 0, 0), 0.0)]))
    c.restore()
    c.drawRect(R(-40, -176, 40, -166), paint(C((30, 22, 20))))
    # head
    c.drawRect(R(-4, -300, 12, -282), paint(C((150, 120, 100))))
    c.drawCircle(6, -316, 22, paint(C((200, 172, 142))))
    c.drawPath(poly([(24, -322), (44, -310), (24, -306)]), paint(C((200, 172, 142))))
    c.drawPath(poly([(0, -300), (20, -300), (8, -276)]), paint(C((60, 40, 34))))  # pointed beard
    c.drawCircle(18, -322, 2.8, paint(C((20, 16, 16))))
    # pointed hat bent backwards + feather
    hat = smooth_path([(-22, -326), (-6, -350), (-40, -392), (-66, -404), (-30, -372), (34, -330)])
    c.drawPath(hat, paint(C(outfit[0] if outfit is PIED else outfit[1])))
    c.drawOval(R(-30, -334, 40, -322), paint(C(outfit[2])))
    fth = skia.Path()
    fth.moveTo(-10, -340)
    fth.cubicTo(-50, -380, -90, -360, -120 + flap * 0.5, -330)
    c.drawPath(fth, paint(C(RED), stroke=7, cap_round=True))
    # arms + pipe
    if playing:
        _limb(c, 4, -270, 70, 38, 160, 50, 12, C(outfit[1]))
        _limb(c, 12, -266, 60, 40, 150, 42, 12, C(outfit[2]))
        c.drawLine(32, -308, 108, -294, paint(C((150, 118, 76)), stroke=7, cap_round=True))
        for k in range(4):
            c.drawCircle(56 + k * 13, -303 + k * 2.4, 1.8, paint(C((40, 30, 20))))
    else:
        _limb(c, 10, -268, 10, 60, 5, 55, 12, C(outfit[1]))
    c.restore()


def child(c, x, y, s, phase=0.0, seed=0, silhouette=0.85, walk=True, a=1.0):
    rng = np.random.default_rng(seed)
    cols = [(110, 70, 60), (70, 80, 110), (120, 100, 60), (90, 60, 90), (60, 90, 70)]
    body = mix(cols[seed % len(cols)], SIL, silhouette)
    skin = mix((200, 160, 130), SIL, silhouette)
    c.save()
    c.translate(x, y - (abs(math.sin(phase)) * 4 if walk else 0))
    c.scale(s, s)
    if a < 1:
        c.saveLayer(None, paint(a=a))
    sw = math.sin(phase) * (24 if walk else 0)
    for side in (-1, 1):
        _limb(c, 0, -46, sw * side, 24, sw * side, 22, 8, mix(body, (0, 0, 0), 0.3))
    girl = rng.uniform() < 0.5
    if girl:
        c.drawPath(poly([(-12, -84), (12, -84), (20, -40), (-20, -40)]), paint(body))
    else:
        c.drawRRect(skia.RRect.MakeRectXY(R(-13, -86, 13, -44), 6, 6), paint(body))
    c.drawCircle(2, -98, 13, paint(skin))
    c.drawPath(smooth_path([(-12, -100), (0, -114), (14, -104), (10, -96), (-10, -94)]),
               paint(mix((50, 34, 26), SIL, silhouette)))
    if girl:
        c.drawLine(-10, -98, -16, -78, paint(mix((50, 34, 26), SIL, silhouette), stroke=5, cap_round=True))
    if a < 1:
        c.restore()
    c.restore()


def rat(c, x, y, s, phase=0.0, facing=1, eyes=True, color=(62, 54, 58), a=1.0):
    c.save()
    c.translate(x, y)
    c.scale(s * facing, s)
    if a < 1:
        c.saveLayer(None, paint(a=a))
    c.drawOval(R(-22, -20, 16, 0), paint(color))
    c.drawPath(poly([(10, -18), (32, -6), (10, -1)]), paint(color))
    c.drawCircle(10, -17, 5, paint(mix(color, (120, 90, 90), 0.3)))
    tail = skia.Path()
    tail.moveTo(-20, -8)
    tail.cubicTo(-38, -10 + math.sin(phase * 2) * 6, -50, 2, -66, -4 + math.sin(phase * 2 + 1) * 6)
    c.drawPath(tail, paint(mix(color, (120, 90, 90), 0.4), stroke=2.5, cap_round=True))
    for k in (-1, 1):
        lx = k * 8 + math.sin(phase * 3 + k) * 4
        c.drawLine(lx, -3, lx + 3, 2, paint(color, stroke=3, cap_round=True))
    if eyes:
        glow(c, 22, -11, 12, EYE, 0.45)
        c.drawCircle(22, -11, 1.8, paint(EYE))
    if a < 1:
        c.restore()
    c.restore()


def mayor(c, x, y, s, facing=-1, silhouette=0.0, purse_open=1.0):
    def C(rgb):
        return mix(rgb, SIL, silhouette)
    c.save()
    c.translate(x, y)
    c.scale(s * facing, s)
    c.drawPath(smooth_path([(-70, 0), (-80, -150), (-50, -250), (40, -255), (70, -150), (64, 0)]),
               lin_paint(-80, 0, 70, 0, [(0, C((60, 22, 26)), 1), (1, C((112, 40, 42)), 1)]))
    c.drawPath(smooth_path([(-56, -250), (40, -256), (30, -224), (-40, -222)]), paint(C((150, 138, 116))))
    chain = skia.Path()
    chain.moveTo(-40, -240)
    chain.quadTo(0, -170, 36, -240)
    c.drawPath(chain, paint(C((190, 158, 80)), stroke=5))
    c.drawCircle(0, -190, 9, paint(C((210, 176, 90))))
    c.drawCircle(4, -290, 34, paint(C((200, 156, 128))))
    c.drawCircle(-8, -276, 22, paint(C((190, 146, 118))))
    c.drawCircle(22, -296, 3, paint(C((24, 18, 16))))
    c.drawPath(poly([(36, -292), (46, -280), (34, -278)]), paint(C((190, 146, 118))))
    c.drawRRect(skia.RRect.MakeRectXY(R(-34, -346, 40, -314), 10, 10), paint(C((50, 18, 22))))
    c.drawOval(R(-44, -326, 50, -312), paint(C((50, 18, 22))))
    # hand with purse
    py = -150 + (1 - purse_open) * 30
    px = 70 - (1 - purse_open) * 40
    c.drawLine(40, -220, px, py, paint(C((80, 30, 32)), stroke=22, cap_round=True))
    c.drawPath(smooth_path([(px - 16, py), (px + 16, py), (px + 22, py + 34), (px - 22, py + 34)]),
               paint(C((96, 70, 40))))
    c.restore()


def song(c, x0, y0, length, T, a=0.5, seed=0, amp=40.0, color=CREAM, notes=True):
    """Visible 'melody': drifting sinuous threads with tiny notes travelling along them."""
    rng = np.random.default_rng(seed)
    for k in range(3):
        ph = rng.uniform(0, 6)
        pts = []
        for i in range(40):
            f = i / 39
            pts.append((x0 + length * f, y0 + k * 22 + math.sin(f * 7 + T * 2.2 + ph) * amp * (0.3 + f)))
        pth = skia.Path()
        pth.moveTo(*pts[0])
        for q in pts[1:]:
            pth.lineTo(*q)
        p = paint(color, a * (0.5 - 0.12 * k), stroke=2.2, cap_round=True, blur=1.2)
        c.drawPath(pth, p)
        if notes:
            for j in range(3):
                f = ((T * 0.25 + j / 3 + k * 0.13) % 1.0)
                nx = x0 + length * f
                ny = y0 + k * 22 + math.sin(f * 7 + T * 2.2 + ph) * amp * (0.3 + f)
                aa = a * math.sin(math.pi * f)
                c.drawCircle(nx, ny, 6, paint(color, aa))
                c.drawLine(nx + 5, ny, nx + 5, ny - 26, paint(color, aa, stroke=2))
                glow(c, nx, ny, 26, color, 0.3 * aa)


def river(c, y0, y1, ctx, moon_x=None, color=(26, 30, 44)):
    c.drawRect(R(-500, y0, 1600, y1 + 900), lin_paint(0, y0, 0, y1, [(0, mix(color, (70, 72, 96), 0.4), 1),
                                                                        (1, color, 1)]))
    rng = np.random.default_rng(3)
    for i in range(60):
        yy = y0 + (i / 60) ** 1.3 * (y1 - y0 + 400)
        xx = rng.uniform(-200, 1200) + math.sin(ctx.T * 0.8 + i) * 20
        ln = rng.uniform(40, 160) * (0.5 + yy / 2000)
        c.drawLine(xx, yy, xx + ln, yy, paint((90, 96, 124), 0.25, stroke=2))
    if moon_x is not None:
        for i in range(18):
            yy = y0 + 10 + i * 26
            wob = math.sin(ctx.T * 2 + i * 1.7) * 18
            wdt = 90 - i * 3
            c.drawLine(moon_x - wdt / 2 + wob, yy, moon_x + wdt / 2 + wob, yy, paint(MOON, 0.35 - i * 0.015, stroke=4))


def street(c, ctx, vy=1000, seed=60, lit=0.5, color=(24, 22, 30)):
    """Narrow medieval street in perspective: houses left & right, cobblestones."""
    c.drawRect(R(-500, vy, 1600, 2600), lin_paint(0, vy, 0, 1900, [(0, (46, 42, 52), 1), (1, (20, 18, 22), 1)]))
    rng = np.random.default_rng(seed)
    for i in range(40):
        yy = vy + (i / 40) ** 1.6 * 900
        for k in range(int(4 + i * 0.6)):
            xx = W / 2 + (rng.uniform(-1, 1)) * (60 + (yy - vy) * 0.9)
            r_ = 4 + (yy - vy) * 0.02
            c.drawOval(R(xx - r_ * 1.6, yy - r_ * 0.5, xx + r_ * 1.6, yy + r_ * 0.5), paint((30, 28, 34), 0.8))
    for side in (-1, 1):
        for k in range(6):
            f0, f1 = k / 6, (k + 1) / 6
            xa = W / 2 + side * (70 + f0 ** 1.4 * 640)
            xb = W / 2 + side * (70 + f1 ** 1.4 * 640)
            top_a = vy - 260 - f0 ** 1.4 * 900
            top_b = vy - 260 - f1 ** 1.4 * 900
            bot_a = vy + f0 ** 1.4 * 900
            bot_b = vy + f1 ** 1.4 * 900
            col = mix(color, (60, 50, 50), 0.15 * (k % 2))
            c.drawPath(poly([(xa, top_a), (xb, top_b), (xb, bot_b), (xa, bot_a)]), paint(col))
            # timber beams
            dk = paint(mix(col, (0, 0, 0), 0.45), stroke=2 + k * 1.5)
            c.drawLine(xa, (top_a + bot_a) / 2, xb, (top_b + bot_b) / 2, dk)
            c.drawLine(xa, top_a, xb, bot_b, paint(mix(col, (0, 0, 0), 0.45), 0.6, stroke=1.5 + k))
            if rng.uniform() < lit:
                wx = (xa + xb) / 2
                wy = (top_a + bot_a) / 2 - (bot_a - top_a) * 0.2
                ww = 8 + k * 8
                fl = 0.8 + 0.2 * math.sin(ctx.T * 3 + k)
                c.drawRect(R(wx - ww / 2, wy, wx + ww / 2, wy + ww * 1.3), paint(LANTERN, 0.8 * fl))
                glow(c, wx, wy + ww * 0.6, ww * 5, LANTERN, 0.2 * fl)
    c.drawRect(R(-500, -500, 1600, vy - 1100), paint(color))


def mountain_shape(c, cx, by, w, h, color, seed=1):
    rng = np.random.default_rng(seed)
    pts = [(cx - w / 2, by)]
    for i in range(1, 8):
        f = i / 8
        yy = by - h * math.sin(f * math.pi) * rng.uniform(0.85, 1.05)
        pts.append((cx - w / 2 + w * f, yy))
    pts.append((cx + w / 2, by))
    p = smooth_path(pts, close=False)
    p.lineTo(cx + w / 2, by + 600)
    p.lineTo(cx - w / 2, by + 600)
    p.close()
    c.drawPath(p, paint(color))


# ================================================================== scenes
def procession_night(c, x):
    x.push, x.focus = 0.2, (W / 2, 900)
    with layer(c, x, 0.0):
        sky(c, horizon=1150)
        stars(c, x, seed=31)
        moon(c, 700, 760, 230, MOON_WARM)
    with layer(c, x, 0.3):
        haze(c, 980, 1200, a=0.55)
        mountain_shape(c, 900, 1170, 700, 360, (24, 23, 34), seed=2)
        forest_row(c, 1170, 18, 90, 180, (26, 26, 38), seed=32, x0=-200, x1=560)
        fog(c, x, 1150, a=0.3, speed=8, seed=4)
    with layer(c, x, 0.55):
        hills(c, 1215, 14, (14, 14, 20), seed=5)
        # path climbing to the right
        prog = x.t * 14.0                      # continuous, never resets

        def path(p):
            return 640 + p * 0.6, 1210 - max(0.0, p) * 0.25
        pxp, pyp = path(prog)
        piper(c, pxp, pyp - 4, 0.32, phase=x.T * 5, silhouette=0.92, T=x.T)
        for i in range(14):
            cx_, cy_ = path(prog - (i + 1) * 66)
            child(c, cx_, cy_, 0.62 - i * 0.01, phase=x.T * 6 + i, seed=i, silhouette=0.95)
        song(c, pxp + 40, pyp - 130, 340, x.T, a=0.35, seed=1, amp=26)
    with layer(c, x, 0.95):
        c.drawRect(R(-500, 1260, 1600, 2600), lin_paint(0, 1220, 0, 1500, [(0, GROUND, 0), (1, GROUND, 1)]))
        fog(c, x, 1290, a=0.22, speed=20, seed=5, scale=1.4)


def town_records(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    tr = x.wt("records", x.dur * 0.65) - 0.9
    k = ease(ramp(x.t, tr, tr + 0.7))
    if k < 1:
        with layer(c, x, 0.0):
            sky(c, horizon=1080)
            stars(c, x, seed=33)
            moon(c, 300, 420, 95)
        with layer(c, x, 0.35):
            haze(c, 880, 1100, a=0.5)
            town_row(c, 1080, -100, 1200, TOWN, seed=34, hmin=120, hmax=230, lit=0.55, T=x.T, church_x=640)
        with layer(c, x, 0.6):
            river(c, 1110, 1400, x, moon_x=300)
            fog(c, x, 1120, a=0.25, speed=10, seed=6)
    if k > 0:
        c.saveLayer(None, paint(a=k))
        fl = flicker(x.T, 3)
        with layer(c, x, 0.5):
            c.drawRect(R(-400, -400, 1500, 2400), paint((24, 17, 14)))
            glow(c, 900, 1500, 900, LANTERN, 0.35 * fl)
            c.save()
            c.rotate(-4, W / 2, 1000)
            page = R(150, 560, 930, 1560)
            c.drawRect(page, paint(PARCH))
            c.drawRect(page, rad_paint(W / 2, 1060, 620, [(0, PARCH, 0), (0.7, (120, 92, 60), 0.3), (1, (60, 40, 24), 0.85)]))
            f1 = font("Cinzel-SemiBold.ttf", 58)
            draw_text(c, "ANNO DOMINI", W / 2, 700, f1, paint((60, 36, 24)), spacing=6, align="center")
            draw_text(c, "MCCLXXXIV", W / 2, 780, font("Cinzel-SemiBold.ttf", 78), paint((120, 30, 30)), spacing=8,
                      align="center")
            rng = np.random.default_rng(9)
            reveal = ramp(x.t, tr + 0.3, x.dur)
            for i in range(14):
                yy = 860 + i * 44
                ln = rng.uniform(440, 640) * min(1.0, max(0.0, reveal * 14 - i))
                xx = 220
                while xx < 220 + ln:
                    wl = rng.uniform(30, 90)
                    c.drawLine(xx, yy + rng.uniform(-2, 2), min(xx + wl, 220 + ln), yy, paint((60, 40, 28), 0.85, stroke=3))
                    xx += wl + 14
            draw_text(c, "CXXX", 760, 1480, font("Cinzel-SemiBold.ttf", 52), paint((120, 30, 30), 0.9), spacing=4,
                      align="center")
            c.restore()
        c.restore()


def rats(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    tc = x.wt("cradles", x.dur * 0.85)
    VY = 1000

    def floor_half(yy):                       # half width of the street floor at screen height yy
        return 70 + (yy - VY) / 900 * 640
    with layer(c, x, 0.3):                    # street, window and rats share one layer -> no sliding
        sky(c, horizon=900)
        moon(c, W / 2, 300, 70)
        street(c, x, vy=VY, seed=61, lit=0.55)
        ca = ease(ramp(x.t, tc - 0.4, tc + 0.3))
        if ca > 0:  # lit window with a cradle ... and a rat on it
            wx, wy = 200, 760
            c.drawRect(R(wx - 110, wy - 140, wx + 110, wy + 140), paint(LANTERN, 0.75 * ca))
            glow(c, wx, wy, 400, LANTERN, 0.35 * ca)
            c.drawRect(R(wx - 110, wy - 140, wx + 110, wy + 140), paint((30, 22, 18), ca, stroke=14))
            c.drawPath(smooth_path([(wx - 80, wy + 60), (wx + 80, wy + 60), (wx + 60, wy + 120), (wx - 60, wy + 120)]),
                       paint((28, 20, 16), ca))
            c.drawLine(wx - 70, wy + 120, wx - 90, wy + 140, paint((28, 20, 16), ca, stroke=8))
            c.drawLine(wx + 70, wy + 120, wx + 90, wy + 140, paint((28, 20, 16), ca, stroke=8))
            rat(c, wx + 30, wy + 62, 1.2, phase=x.T * 3, facing=-1, color=(20, 16, 16), a=ca)
        rng = np.random.default_rng(12)
        n = int(24 + 56 * ease(ramp(x.t, 0, x.dur * 0.6)))
        todo = []
        for i in range(n):
            ph0 = rng.uniform(0, 1)
            if rng.uniform() < 0.55:
                # crossing the street: out of a hole at one wall base, into the other
                g = rng.uniform(0.06, 0.95) ** 1.2
                yy = VY + g * 900
                d = 1 if rng.uniform() < 0.5 else -1
                u = (((ph0 + x.T * rng.uniform(0.22, 0.5)) % 1.0) * 2 - 1) * d
                xx = W / 2 + u * floor_half(yy) * 0.93
                facing, fade = d, (1 - abs(u)) * 8
            else:
                # scurrying along the bottom of a house wall, toward the camera
                side = -1 if rng.uniform() < 0.5 else 1
                g = (ph0 + x.T * rng.uniform(0.1, 0.22)) % 1.0
                yy = VY + g * 900
                xx = W / 2 + side * floor_half(yy) * rng.uniform(0.82, 0.92)
                facing, fade = side, min(g, 1 - g) * 10
            todo.append((yy, xx, 0.55 + g * 3.0, facing, min(1.0, fade), i))
        for yy, xx, sc, facing, fade, i in sorted(todo):
            if fade > 0.02:
                rat(c, xx, yy, sc, phase=x.T * 8 + i, facing=facing, a=fade)
    with layer(c, x, 0.95):
        fog(c, x, 1500, a=0.15, speed=14, seed=7, scale=1.4)


def title_piper(c, x):
    x.push, x.focus = 0.16, (W / 2, 1150)
    with layer(c, x, 0.0):
        sky(c, horizon=1250)
        stars(c, x, seed=35)
    with layer(c, x, 0.4):
        c.drawRect(R(-500, 1300, 1600, 2600), paint((16, 15, 22)))
        haze(c, 1100, 1320, a=0.4)
        town_row(c, 1300, -200, 300, TOWN, seed=36, hmin=200, hmax=320, lit=0.4, T=x.T)
        town_row(c, 1300, 780, 1300, TOWN, seed=37, hmin=200, hmax=320, lit=0.4, T=x.T)
        arch = town_gate(c, W / 2, 1310, 1.15, arch_light=(64, 66, 92))
        c.save()
        c.translate(W / 2, 1310)
        c.scale(1.15, 1.15)
        c.clipPath(arch, doAntiAlias=True)
        moon(c, 0, -200, 70, MOON, glow=0.6)
        c.restore()
    with layer(c, x, 0.6):
        glow(c, 740, 1180, 380, LANTERN, 0.25 * flicker(x.T))
        piper(c, W / 2 - 10, 1316, 0.78, phase=0.0, dance=False, playing=False, silhouette=0.25, T=x.T)
        c.drawRect(R(-500, 1316, 1600, 2600), lin_paint(0, 1316, 0, 1700, [(0, (18, 17, 24), 1), (1, GROUND, 1)]))
    with layer(c, x, 0.95):
        fog(c, x, 1330, a=0.22, speed=16, seed=8, scale=1.4)


def bargain(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    fl = flicker(x.T, 4)
    tp = x.wt("price", x.dur * 0.8)
    with layer(c, x, 0.2):
        c.drawRect(R(-400, -400, 1500, 2400), lin_paint(0, 0, 0, 1500, [(0, (26, 20, 20), 1), (1, (50, 36, 30), 1)]))
        for i in range(-2, 14):
            c.drawLine(i * 110, -400, i * 110, 1400, paint((22, 16, 15), 0.6, stroke=3))
        # tall gothic window
        c.drawRect(R(420, 300, 660, 760), paint((20, 22, 40)))
        c.drawPath(poly([(420, 300), (540, 200), (660, 300)]), paint((20, 22, 40)))
        light_shaft(c, [(420, 760), (660, 760), (900, 1500), (300, 1500)], a=0.1)
    with layer(c, x, 0.6):
        glow(c, W / 2, 1250, 700, LANTERN, 0.32 * fl)
        mayor(c, 820, 1520, 1.25, facing=-1)
        piper(c, 250, 1520, 1.15, dance=False, playing=False, silhouette=0.45, T=x.T)
        c.drawRect(R(180, 1380, 900, 1410), paint((60, 40, 30)))
        c.drawRect(R(220, 1410, 250, 1800), paint((40, 27, 22)))
        c.drawRect(R(830, 1410, 860, 1800), paint((40, 27, 22)))
        c.drawRect(R(500, 1300, 520, 1380), paint((226, 214, 190)))
        c.drawOval(R(503, 1262 - 6 * fl, 517, 1300), paint((255, 200, 120)))
        glow(c, 510, 1285, 120, (255, 210, 150), 0.6 * fl)
        # coins: pile appears on "price", glinting
        ca = ease(ramp(x.t, tp - 0.3, tp + 0.4))
        rng = np.random.default_rng(4)
        for i in range(12):
            cx = 620 + rng.normal(0, 26)
            cy = 1374 - i * 3 + rng.normal(0, 2)
            c.drawOval(R(cx - 18, cy - 6, cx + 18, cy + 6), paint((200, 166, 80), ca))
            c.drawOval(R(cx - 18, cy - 8, cx + 18, cy + 4), paint((236, 204, 110), ca * 0.8, stroke=1.5))
        if ca > 0:
            gl = 0.5 + 0.5 * math.sin(x.T * 5)
            glow(c, 630, 1350, 60, (255, 230, 150), 0.6 * ca * gl)


def rats_river(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    td = x.wt("drowned", x.dur * 0.85)
    with layer(c, x, 0.0):
        sky(c, horizon=1050)
        stars(c, x, seed=38)
        moon(c, 760, 430, 110)
    with layer(c, x, 0.3):
        haze(c, 880, 1080, a=0.5)
        town_row(c, 1050, 600, 1300, (22, 21, 30), seed=39, hmin=80, hmax=150, lit=0.5, T=x.T, church_x=900)
        forest_row(c, 1050, 10, 60, 120, (24, 24, 34), seed=40, x0=-200, x1=600)
    with layer(c, x, 0.55):
        c.drawRect(R(-500, 1050, 1600, 1260), paint((18, 18, 25)))
        river(c, 1260, 1600, x, moon_x=760)
        # piper on the bank (left), playing, walking slowly toward the water
        px = 150 + 60 * x.p
        piper(c, px, 1250, 0.7, phase=x.T * 4, silhouette=0.45, T=x.T)
        song(c, px + 80, 1000, 420, x.T, a=0.45, seed=2, amp=30)
        # stream of rats from the town to the river
        gone = ease(ramp(x.t, td - 0.2, td + 0.8))
        rng = np.random.default_rng(14)
        for i in range(70):
            f = (rng.uniform(0, 1) + x.T * 0.22) % 1.0
            sx, sy = 980, 1080
            ex, ey = 420 + rng.normal(0, 60), 1300 + rng.uniform(0, 80)
            xx = sx + (ex - sx) * f + rng.normal(0, 12)
            yy = sy + (ey - sy) * f + math.sin(f * 20 + i) * 4
            if yy > 1265:  # in the water -> sinking ripple
                c.drawOval(R(xx - 20, yy - 4, xx + 20, yy + 4), paint((120, 124, 150), 0.35 * (1 - f) * (1 - gone), stroke=2))
                continue
            rat(c, xx, yy, 0.9 + f * 0.8, phase=x.T * 9 + i, facing=-1)
        if gone > 0:
            for i in range(12):
                rr = 20 + ((x.t - td) * 120 + i * 30) % 260
                c.drawOval(R(430 - rr, 1330 - rr * 0.15, 430 + rr, 1330 + rr * 0.15),
                           paint((140, 144, 170), 0.3 * gone * (1 - rr / 280), stroke=2))
    with layer(c, x, 0.95):
        fog(c, x, 1260, a=0.2, speed=14, seed=9, scale=1.3)


def refuse(c, x):
    x.push, x.focus = 0.14, (W / 2, 1000)
    tr = x.wt("refused", x.dur * 0.5)
    shut = ease(ramp(x.t, tr, tr + 0.5))
    fl = flicker(x.T, 6)
    with layer(c, x, 0.2):
        c.drawRect(R(-400, -400, 1500, 2400), lin_paint(0, 0, 0, 1700, [(0, (22, 16, 16), 1), (1, (44, 30, 26), 1)]))
        glow(c, 760, 1100, 800, LANTERN, 0.3 * fl)
    with layer(c, x, 0.6):
        mayor(c, 760, 1850, 2.1, facing=-1, purse_open=1 - shut)
    with layer(c, x, 0.9):
        # piper in foreground, dark profile, one glinting eye
        c.save()
        c.translate(-160, 1900)
        c.scale(2.6, 2.6)
        prof = smooth_path([(0, 0), (40, -200), (120, -330), (170, -360), (200, -340), (230, -320), (210, -300),
                            (222, -280), (196, -240), (180, -120), (220, 0)])
        c.drawPath(prof, paint((10, 9, 12)))
        c.drawPath(poly([(120, -360), (60, -470), (20, -500), (110, -440), (200, -366)]), paint((10, 9, 12)))
        c.restore()
        ea = ease(ramp(x.t, tr + 0.3, tr + 0.9))
        glow(c, -160 + 2.6 * 186, 1900 - 2.6 * 318, 60, (230, 70, 60), 0.6 * ea)
        c.drawCircle(-160 + 2.6 * 186, 1900 - 2.6 * 318, 7, paint((240, 90, 70), ea))


def hunter_returns(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    ts = x.wt("different", x.dur * 0.8)
    with layer(c, x, 0.2):
        sky(c, top=(14, 18, 28), mid=(36, 46, 62), haze=(74, 86, 100), horizon=900)
        street(c, x, vy=1000, seed=62, lit=0.15, color=(28, 30, 38))
        fog(c, x, 1000, a=0.45, speed=6, seed=10, color=(150, 160, 180))
    with layer(c, x, 0.6):
        walk = min(x.t, ts) / max(ts, 0.1)
        y = 1060 + 520 * walk
        s = 0.45 + 0.75 * walk
        piper(c, W / 2 - 40, y, s, phase=x.T * 4 * (x.t < ts), dance=x.t < ts, playing=x.t > ts - 0.4,
              outfit=HUNTER, silhouette=0.3, T=x.T)
        if x.t > ts - 0.3:
            k = ease(ramp(x.t, ts - 0.3, ts + 0.8))
            song(c, W / 2 - 40 + 100 * s, y - 300 * s, 520, x.T, a=0.55 * k, seed=3, amp=50, color=(220, 120, 110))
    with layer(c, x, 0.95):
        fog(c, x, 1500, a=0.25, speed=12, seed=11, scale=1.4, color=(150, 160, 180))


def children_follow(c, x):
    x.push, x.focus = 0.14, (W / 2, 1100)
    tc = x.wt("children", x.dur * 0.8)
    with layer(c, x, 0.2):
        sky(c, horizon=900)
        moon(c, 760, 300, 60)
        street(c, x, vy=1000, seed=63, lit=0.65)
    with layer(c, x, 0.55):
        song(c, -60, 1100, 1200, x.T, a=0.4, seed=4, amp=60, color=(220, 120, 110))
        # doors on both sides open one by one, children step out and walk up the street
        doors = [(-1, 0.35), (1, 0.45), (-1, 0.62), (1, 0.72), (-1, 0.86), (1, 0.95)]
        for i, (side, f) in enumerate(doors):
            t_open = tc - 1.2 + i * 0.35
            if x.t < t_open - 4:
                continue
            o = ease(ramp(x.t, t_open, t_open + 0.4))
            dx = W / 2 + side * (70 + f ** 1.4 * 640) * 0.96
            dy = 1000 + f ** 1.4 * 900
            dh = 90 + f ** 1.4 * 500
            dw = dh * 0.42
            c.drawRect(R(dx - dw / 2, dy - dh, dx + dw / 2, dy), paint((20, 14, 12)))
            c.drawRect(R(dx - dw / 2, dy - dh, dx - dw / 2 + dw * o, dy), paint(LANTERN, 0.8 * o))
            glow(c, dx, dy - dh / 2, dh * 1.2, LANTERN, 0.25 * o)
            # child walking out toward the middle of the street and away
            w = ramp(x.t, t_open + 0.3, t_open + 4.0)
            if w > 0:
                cx = dx + (W / 2 - dx) * ease(min(1, w * 2))
                cy = dy - (dy - 1040) * w
                sc = (1.2 + f * 4.0) * (1 - 0.7 * w)
                child(c, cx, cy, sc, phase=x.T * 6 + i, seed=i + 3, silhouette=0.6)


def mountain(c, x):
    x.push, x.focus = 0.1, (W / 2, 1100)
    tm = x.wt("mountain", x.dur * 0.8)
    close = ease(ramp(x.t, tm + 0.3, tm + 1.4))
    with layer(c, x, 0.0):
        sky(c, horizon=1150)
        stars(c, x, seed=41)
        moon(c, 200, 430, 90)
    with layer(c, x, 0.3):
        haze(c, 980, 1180, a=0.5)
        mountain_shape(c, 790, 1180, 900, 560, (22, 21, 32), seed=3)
        dw = 70 * (1 - close)
        door_x, door_y = 760, 1170
        if dw > 0.5:
            glow(c, door_x, door_y - 60, 300, (255, 200, 140), 0.5 * (1 - close))
            c.drawPath(poly([(door_x - dw, door_y), (door_x - dw, door_y - 110), (door_x, door_y - 150),
                             (door_x + dw, door_y - 110), (door_x + dw, door_y)]), paint((255, 214, 160), 1 - close))
        town_gate(c, 120, 1240, 0.45)
    with layer(c, x, 0.55):
        c.drawRect(R(-500, 1240, 1600, 2600), paint((14, 14, 20)))
        pth = [(160, 1250), (420, 1235), (620, 1205), (760, 1172)]
        c.drawPath(smooth_path(pth + [(770, 1176), (630, 1214), (430, 1248), (160, 1262)]), paint((34, 32, 42)))
        # procession along the path into the door
        n = 16
        for i in range(n):
            f = ((x.t / max(tm + 0.3, 0.5)) * 1.1 - i * 0.055)
            if f < 0 or f > 1:
                continue
            seg = f * 3
            k = min(2, int(seg))
            u = seg - k
            px = pth[k][0] + (pth[k + 1][0] - pth[k][0]) * u
            py = pth[k][1] + (pth[k + 1][1] - pth[k][1]) * u
            sc = 0.5 - 0.25 * f
            if i == 0:
                piper(c, px, py, sc * 0.5, phase=x.T * 5, silhouette=0.9, T=x.T)
            else:
                child(c, px, py, sc, phase=x.T * 6 + i, seed=i, silhouette=0.92)
    with layer(c, x, 0.95):
        fog(c, x, 1270, a=0.22, speed=16, seed=12, scale=1.4)


def two_return(c, x):
    x.push, x.focus = 0.1, (W / 2, 1150)
    with layer(c, x, 0.0):
        c.drawRect(R(-400, -400, 1500, 1300), lin_paint(0, 0, 0, 1180, [
            (0, (22, 24, 40), 1), (0.6, (70, 70, 96), 1), (1, (150, 130, 140), 1)]))
        moon(c, 800, 380, 60, (220, 220, 230), glow=0.5, craters=False)
    with layer(c, x, 0.3):
        haze(c, 1000, 1200, (170, 150, 160), a=0.4)
        mountain_shape(c, 600, 1180, 1100, 520, (40, 38, 54), seed=3)
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1200, 1600, 2600), paint((24, 22, 30)))
        c.drawPath(poly([(W / 2 - 20, 1200), (W / 2 + 20, 1200), (W / 2 + 500, 1900), (W / 2 - 500, 1900)]),
                   lin_paint(0, 1200, 0, 1900, [(0, (60, 56, 68), 1), (1, (32, 30, 38), 1)]))
        child(c, W / 2 - 60, 1560, 2.4, walk=False, seed=1, silhouette=0.55)
        child(c, W / 2 + 70, 1570, 2.2, walk=False, seed=2, silhouette=0.55)
        # the blind one reaches out with a hand
        c.drawLine(W / 2 - 50, 1560 - 2.4 * 70, W / 2 + 10, 1560 - 2.4 * 64, paint((40, 36, 46), stroke=14, cap_round=True))
    with layer(c, x, 0.95):
        fog(c, x, 1450, a=0.25, speed=10, seed=13, scale=1.4, color=(170, 160, 180))


def silent_street(c, x):
    x.push, x.focus = 0.14, (W / 2, 1000)
    with layer(c, x, 0.2):
        sky(c, horizon=900)
        stars(c, x, seed=42)
        street(c, x, vy=1000, seed=64, lit=0.2)
        fog(c, x, 1050, a=0.35, speed=4, seed=14)
    with layer(c, x, 0.6):
        # street sign on the right wall
        sx, sy = 860, 760
        c.drawRect(R(sx - 170, sy - 40, sx + 170, sy + 40), paint((30, 40, 70)))
        c.drawRect(R(sx - 170, sy - 40, sx + 170, sy + 40), paint(CREAM, 0.9, stroke=4))
        draw_text(c, "BUNGELOSENSTRASSE", sx, sy + 14, font("Oswald-Medium.ttf", 34), paint(CREAM), spacing=2,
                  align="center")
        # one wall lantern
        fl = flicker(x.T, 8)
        c.drawLine(150, 640, 230, 640, paint((20, 18, 18), stroke=6))
        c.drawRect(R(212, 640, 248, 690), paint((255, 200, 130), fl))
        glow(c, 230, 665, 300, LANTERN, 0.4 * fl)


def pov_pipe(c, x):
    x.push, x.focus = 0.22, (W / 2, 900)
    with layer(c, x, 0.2):
        c.drawRect(R(-400, -400, 1500, 2400), lin_paint(0, 0, 0, 1700, [(0, (22, 18, 20), 1), (1, (36, 28, 26), 1)]))
        # window frame + view down into the night street
        wx0, wy0, wx1, wy1 = 260, 420, 820, 1250
        c.save()
        c.clipRect(R(wx0, wy0, wx1, wy1))
        sky(c, horizon=760)
        moon(c, 700, 520, 50)
        town_row(c, 900, 200, 900, TOWN, seed=43, hmin=100, hmax=200, lit=0.4, T=x.T)
        c.drawRect(R(wx0, 900, wx1, wy1), paint((30, 28, 36)))
        glow(c, 520, 1080, 160, LANTERN, 0.4)
        c.drawLine(520, 1000, 520, 1060, paint((20, 18, 18), stroke=4))
        piper(c, 560, 1180, 0.36, phase=x.T * 4, outfit=PIED, silhouette=0.2, T=x.T)
        c.restore()
        c.drawRect(R(wx0, wy0, wx1, wy1), paint((34, 24, 20), stroke=26))
        c.drawRect(R((wx0 + wx1) / 2 - 7, wy0, (wx0 + wx1) / 2 + 7, wy1), paint((34, 24, 20)))
        c.drawRect(R(wx0, (wy0 + wy1) / 2 - 7, wx1, (wy0 + wy1) / 2 + 7), paint((34, 24, 20)))
        light_shaft(c, [(wx0, wy1), (wx1, wy1), (900, 1900), (180, 1900)], a=0.09)
    with layer(c, x, 0.6):
        # the song drifts in through the window
        song(c, 300, 1000, 700, x.T, a=0.45 * ease(ramp(x.t, 0.5, 2.0)), seed=5, amp=70, color=(220, 120, 110))
        c.drawRect(R(-500, 1500, 1600, 2600), paint((20, 15, 14)))


def piper_reveal(c, x):
    x.push, x.focus = 0.25, (W / 2, 820)
    tr = x.wt("don't", x.dur * 0.5) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((7, 7, 10)))
    if x.t < tr:
        with layer(c, x, 0.6):
            song(c, -40, 900, 1160, x.T, a=0.3 * ease(ramp(x.t, 0.0, 0.6)), seed=6, amp=60, color=(200, 90, 80))
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=22)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        cx = W / 2
        glow(c, cx, 1200, 900, (160, 80, 80), 0.2 * k)
        # long pale face
        face = smooth_path([(cx - 230, 560), (cx + 230, 560), (cx + 250, 820), (cx + 170, 1120), (cx, 1240),
                            (cx - 170, 1120), (cx - 250, 820)])
        c.drawPath(face, lin_paint(cx - 250, 0, cx + 250, 0, [(0, (150, 128, 110), k), (1, (70, 56, 50), k)]))
        # hollow eyes
        for ex in (cx - 105, cx + 105):
            c.drawOval(R(ex - 70, 740, ex + 70, 830), paint((14, 10, 12), k))
            glow(c, ex, 785, 80, (240, 90, 70), 0.6 * k)
            c.drawCircle(ex, 785, 10, paint((250, 110, 90), k))
        c.drawPath(poly([(cx, 800), (cx - 40, 960), (cx + 12, 968)]), paint((90, 70, 60), k))
        # grin around the pipe
        grin = smooth_path([(cx - 190, 1010), (cx, 1060), (cx + 190, 1010), (cx + 110, 1100), (cx, 1120),
                            (cx - 110, 1100)])
        c.drawPath(grin, paint((40, 8, 12), k))
        for i in range(10):
            tx = cx - 160 + i * 36
            c.drawPath(poly([(tx - 12, 1018 + abs(i - 4.5) * 4), (tx + 12, 1018 + abs(i - 4.5) * 4), (tx, 1056)]),
                       paint((222, 212, 190), k))
        c.drawLine(cx - 30, 1070, cx + 470, 1120, paint((150, 118, 76), k, stroke=26, cap_round=True))
        for j in range(5):
            c.drawCircle(cx + 110 + j * 60, 1082 + j * 6, 6, paint((40, 30, 20), k))
        # hat + feather
        c.drawPath(smooth_path([(cx - 300, 600), (cx - 120, 420), (cx - 260, 160), (cx - 380, 120), (cx - 160, 300),
                                (cx + 300, 600)]), paint((120, 40, 40), k))
        c.drawOval(R(cx - 320, 560, cx + 320, 640), paint((40, 70, 70), k))
        fth = skia.Path()
        fth.moveTo(cx + 120, 560)
        fth.cubicTo(cx + 300, 300, cx + 420, 260, cx + 520, 300)
        c.drawPath(fth, paint(RED, k, stroke=24, cap_round=True))


for _f in (procession_night, town_records, rats, title_piper, bargain, rats_river, refuse, hunter_returns,
           children_follow, mountain, two_return, silent_street, pov_pipe, piper_reveal):
    scenes.SCENES[_f.__name__] = _f


# ================================================================== sounds
SR = audio.SR
N = {"A4": 440.0, "Bb4": 466.2, "C5": 523.3, "D5": 587.3, "Eb5": 622.3, "E5": 659.3, "F5": 698.5, "G5": 784.0,
     "A5": 880.0, "Bb5": 932.3, "C6": 1046.5}
TUNE_BRIGHT = [("D5", .3), ("F5", .3), ("A5", .45), ("G5", .3), ("F5", .3), ("E5", .3), ("D5", .6), ("C5", .3),
               ("D5", .3), ("F5", .3), ("E5", .3), ("C5", .3), ("D5", .9)]
TUNE_DARK = [("D5", .55), ("Eb5", .55), ("D5", .55), ("C5", .55), ("Bb4", .8), ("A4", 1.1), ("Bb4", .55),
             ("D5", .55), ("Eb5", .9), ("D5", 1.4)]


def pipe_tune(tune, total, gain=1.0, bright=True):
    """Breathy wooden pipe, looped to `total` seconds."""
    n = int(total * SR)
    out = np.zeros(n, np.float32)
    t0, i = 0.0, 0
    rng = np.random.default_rng(7)
    while t0 < total:
        name, d = tune[i % len(tune)]
        f = N[name]
        ln = int((d + 0.08) * SR)
        tt = np.arange(ln) / SR
        vib = 1 + 0.006 * np.sin(2 * np.pi * 5.4 * tt) * np.clip(tt / 0.2, 0, 1)
        ph = 2 * np.pi * np.cumsum(f * vib) / SR
        tone = np.sin(ph) + (0.35 if bright else 0.18) * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
        breath = audio.filt(rng.standard_normal(ln).astype(np.float32), "band", (f * 0.8, f * 2.5)) * 0.25
        env = np.clip(tt / 0.04, 0, 1) * np.clip((d + 0.08 - tt) / 0.08, 0, 1)
        x = (tone + breath) * env * 0.25
        a = int(t0 * SR)
        b = min(n, a + ln)
        out[a:b] += x[: b - a]
        t0 += d
        i += 1
    return audio.reverb(out * gain, 0.45)


def squeaks(total, density=6.0):
    n = int(total * SR)
    out = np.zeros(n, np.float32)
    rng = np.random.default_rng(3)
    k = 0.0
    while k < total:
        ln = int(rng.uniform(0.04, 0.12) * SR)
        tt = np.arange(ln) / SR
        f = rng.uniform(3000, 6000) * (1 + 0.15 * np.sin(2 * np.pi * rng.uniform(20, 50) * tt))
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / tt[-1]) * rng.uniform(0.05, 0.15)
        a = int(k * SR)
        b = min(n, a + ln)
        out[a:b] += x[: b - a]
        k += rng.exponential(1 / density)
    scurry = audio.filt(rng.standard_normal(n).astype(np.float32), "band", (2000, 7000)) * 0.05
    scurry *= (0.5 + 0.5 * np.sin(2 * np.pi * np.arange(n) / SR * 9)) ** 4
    return audio.reverb(out + scurry, 0.2)


def water(total):
    n = int(total * SR)
    rng = np.random.default_rng(5)
    x = audio.filt(rng.standard_normal(n).astype(np.float32), "band", (200, 1600)) * 0.25
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * np.arange(n) / SR * 0.3)
    return audio.stereo(x * lfo)


def plop():
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    f = 900 * np.exp(-tt * 18) + 200
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 20) * 0.4


def coin():
    n = int(0.6 * SR)
    tt = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, d in ((3150, 8), (4420, 10), (5900, 14), (7300, 18)))
    return audio.reverb(x * 0.12, 0.25)


def _sfx_procession(m, s, tl):
    m.add(s["start"] + 0.4, audio.stereo(audio.filt(pipe_tune(TUNE_DARK, s["end"] - s["start"])[:, 0], "low", 1800)), 0.35)


def _sfx_rats(m, s, tl):
    m.add(s["start"], squeaks(s["end"] - s["start"] + 0.5, density=8), 0.9)


def _sfx_title(m, s, tl):
    m.add(s["start"] + 1.2, pipe_tune(TUNE_BRIGHT, s["end"] - s["start"] - 1.0), 0.35)


def _sfx_bargain(m, s, tl):
    tp = s["start"] + s["words"].get("price", (s["end"] - s["start"]) * 0.8)
    for i in range(5):
        m.add(tp - 0.2 + i * 0.11, coin(), 0.8, pan=0.2)


def _sfx_river(m, s, tl):
    d = s["end"] - s["start"]
    m.add(s["start"], water(d + 1), 0.5)
    m.add(s["start"] + 0.1, pipe_tune(TUNE_BRIGHT, d), 0.5)
    m.add(s["start"], squeaks(d * 0.8, density=10), 0.6)
    rng = np.random.default_rng(2)
    for _ in range(14):
        m.add(s["start"] + rng.uniform(0.5, d * 0.85), plop(), 0.5, pan=rng.uniform(-0.5, 0.2))


def _sfx_refuse(m, s, tl):
    tr = s["start"] + s["words"].get("refused", (s["end"] - s["start"]) * 0.5)
    m.add(tr, audio.boom(2.5, f0=70, f1=28), 0.7)


def _sfx_hunter(m, s, tl):
    ts = s["start"] + s["words"].get("different", (s["end"] - s["start"]) * 0.8)
    m.add(ts - 0.2, audio.sting(2.5), 0.8)
    # the dark song keeps playing through the children + mountain scenes
    kinds = [x["kind"] for x in tl["scenes"]]
    end = s["end"]
    if "mountain" in kinds:
        msc = tl["scenes"][kinds.index("mountain")]
        end = msc["start"] + msc["words"].get("mountain", (msc["end"] - msc["start"]) * 0.8) + 1.2
    m.add(ts, pipe_tune(TUNE_DARK, end - ts, bright=False), 0.55)


def _sfx_children(m, s, tl):
    tc = s["start"] + s["words"].get("children", (s["end"] - s["start"]) * 0.8)
    for i in range(3):
        m.add(tc - 1.3 + i * 0.7, audio.creak(1.2, 0.35), 0.6, pan=(-0.4 if i % 2 == 0 else 0.4))
    k = tc - 0.5
    while k < s["end"] + 2:
        m.add(k, audio.footstep(0.0) * 0.5, 0.25, pan=np.random.uniform(-0.3, 0.3))
        k += 0.21


def _sfx_mountain(m, s, tl):
    tm = s["start"] + s["words"].get("mountain", (s["end"] - s["start"]) * 0.8)
    m.add(tm + 0.3, audio.boom(3.5, f0=55, f1=22), 1.0)
    n = int(2.0 * SR)
    rumble = audio.filt(np.random.default_rng(1).standard_normal(n).astype(np.float32), "low", 90)
    m.add(tm - 0.2, audio.stereo(rumble * audio.env_adsr(n, 0.8, 0.8)), 0.8)


def _sfx_silent(m, s, tl):
    return [(s["start"] - 0.2, s["end"], 0.25)]   # near silence: no music may be played here


def _sfx_pov(m, s, tl):
    d = s["end"] - s["start"]
    tune = pipe_tune(TUNE_DARK, d, bright=False)
    m.add(s["start"] + 0.3, np.stack([audio.filt(tune[:, 0], "low", 1500), audio.filt(tune[:, 1], "low", 1500)], 1), 0.4)


audio.SFX.update({"procession_night": _sfx_procession, "rats": _sfx_rats, "title_piper": _sfx_title,
                  "bargain": _sfx_bargain, "rats_river": _sfx_river, "refuse": _sfx_refuse,
                  "hunter_returns": _sfx_hunter, "children_follow": _sfx_children, "mountain": _sfx_mountain,
                  "silent_street": _sfx_silent, "pov_pipe": _sfx_pov})
