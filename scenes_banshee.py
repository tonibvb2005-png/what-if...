"""Animated scenes + sounds for 'The Banshee' (registers into scenes.SCENES / audio.SFX).

Motion rules: everything monotonic in local time; she glides, her hair always blows in the wind.
"""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, fog, glow, light_shaft, paint, lin_paint, rad_paint, R, poly,
                 smooth_path, mix, ease, ramp, shake_amount, fur_path, MOON, CREAM, LANTERN)
from scenes_black_shuck import waves

flicker = scenes.flicker
SILVER = (196, 200, 210)
PALE = (176, 180, 186)
CLOAK = (64, 68, 80)
GRASS = (18, 24, 24)
STONE = (52, 54, 60)


# ================================================================== elements
def stone_wall(c, x0, x1, y, h, seed=0, color=STONE):
    rng = np.random.default_rng(seed)
    c.drawRect(R(x0, y - h, x1, y), paint(mix(color, (0, 0, 0), 0.5)))
    xx = x0
    while xx < x1:
        w = rng.uniform(h * 0.5, h * 1.1)
        for row in range(3):
            yy = y - h + row * h / 3
            c.drawOval(R(xx + rng.uniform(-4, 4), yy, xx + w, yy + h / 3), paint(mix(color, (0, 0, 0), rng.uniform(0, 0.4))))
        xx += w * 0.9


def cottage(c, cx, by, s, lit=1.0, T=0.0):
    c.save()
    c.translate(cx, by)
    c.scale(s, s)
    c.drawRect(R(-200, -200, 200, 0), paint((150, 150, 150)))
    c.drawRect(R(-200, -200, 200, 0), lin_paint(-200, 0, 200, 0, [(0, (0, 0, 0), 0.2), (1, (0, 0, 0), 0.55)]))
    c.drawPath(smooth_path([(-240, -190), (-150, -330), (150, -330), (240, -190), (0, -170)]), paint((70, 58, 40)))
    c.drawRect(R(110, -380, 150, -300), paint((90, 90, 92)))
    fl = flicker(T, 2)
    c.drawRect(R(-140, -140, -60, -70), paint(LANTERN, 0.9 * lit * fl))
    glow(c, -100, -105, 160, LANTERN, 0.35 * lit * fl)
    c.drawRect(R(-140, -140, -60, -70), paint((40, 32, 26), stroke=6))
    c.drawRect(R(20, -130, 90, 0), paint((40, 30, 24)))
    c.restore()


def cliffs(c, horizon=1150, seed=0):
    c.drawPath(poly([(-300, horizon - 60), (200, horizon - 80), (420, horizon - 40), (520, horizon + 300),
                     (-300, horizon + 300)]), paint((26, 30, 32)))
    c.drawRect(R(-500, horizon + 200, 1600, 2600), paint(GRASS))


def banshee(c, x, by, s, T=0.0, scream=0.0, a=1.0, point=0.0, comb=None, wind=1.0, hair_cover=0.4):
    """Tall pale woman in a ragged grey cloak with very long silver hair streaming in the wind.
    (x, by) = where the cloak meets the ground (she hovers a little)."""
    c.save()
    c.translate(x, by)
    c.scale(s, s)
    if a < 1:
        c.saveLayer(None, paint(a=a))
    hover = math.sin(T * 1.2) * 8
    c.translate(0, hover - 20)
    blow = math.sin(T * 1.6) * 20 * wind
    rng = np.random.default_rng(3)
    # hair streaming to the right behind her
    for i in range(30):
        y0 = -560 + i * 6
        pth = skia.Path()
        pth.moveTo(10, y0)
        pth.cubicTo(140 + blow, y0 - 40 + i * 4, 260 + blow * 1.5, y0 + 80 + i * 6,
                    360 + blow * 2 + rng.uniform(-20, 20), y0 + 200 + i * 9)
        c.drawPath(pth, paint(mix(SILVER, (90, 94, 110), rng.uniform(0, 0.5)), 0.8, stroke=rng.uniform(3, 7),
                              cap_round=True))
    # hair hanging down her back (behind the body)
    c.drawPath(smooth_path([(-46, -600), (46, -600), (70, -420), (60 + blow * 0.3, -200), (-60 + blow * 0.3, -200),
                            (-70, -420)]), paint(mix(SILVER, (80, 84, 100), 0.35)))
    # ragged cloak with shoulders
    pts = [(-24, -505), (24, -505), (78, -470), (92, -300), (130, -80)]
    for k in range(9):
        f = k / 8
        pts.append((130 - f * 260 + math.sin(T * 2 + k) * 10, 0 - (30 if k % 2 else 0)))
    pts += [(-130, -80), (-92, -300), (-78, -470)]
    c.drawPath(poly(pts), lin_paint(0, -520, 0, 0, [(0, CLOAK, 1), (0.7, CLOAK, 0.85), (1, CLOAK, 0.0)]))
    # pointing arm
    if point > 0:
        hx, hy = 60 + 240 * point, -440 - 40 * point
        c.drawLine(40, -470, hx, hy, paint(CLOAK, stroke=30, cap_round=True))
        c.drawLine(hx, hy, hx + 60, hy - 6, paint(PALE, stroke=10, cap_round=True))
    # head
    c.drawOval(R(-38, -610, 38, -510), paint(PALE))
    for ex in (-15, 15):
        c.drawOval(R(ex - 11, -578, ex + 11, -560), paint((20, 16, 20)))
        c.drawOval(R(ex - 13, -580, ex + 13, -558), paint((170, 40, 40), 0.6, stroke=3))
        c.drawCircle(ex, -569, 3, paint((230, 230, 236)))
    if scream > 0:
        c.drawOval(R(-14, -548 - 4 * scream, 14, -530 + 30 * scream), paint((10, 6, 8)))
        for k in range(3):
            rr = 60 + ((T * 220 + k * 70) % 220)
            c.drawCircle(0, -540, rr, paint(SILVER, 0.25 * scream * (1 - rr / 300), stroke=3))
    # silver hair: parted on top, framing the face, long locks over the shoulders
    c.drawPath(smooth_path([(-44, -590), (-30, -626), (0, -634), (30, -626), (44, -590), (20, -606), (0, -612),
                            (-20, -606)]), paint(SILVER))
    for sgn in (-1, 1):
        c.drawPath(smooth_path([(sgn * 30, -620), (sgn * 48, -580), (sgn * 52, -500), (sgn * 64 + blow * 0.2, -380),
                                (sgn * 44, -400), (sgn * 38, -500), (sgn * 34, -575)]), paint(SILVER))
    c.drawPath(smooth_path([(-36, -606), (-8, -598), (-18, -540), (-40, -500)]), paint(SILVER, hair_cover))
    if comb:
        cy = comb
        c.drawRect(R(-90, cy - 10, -20, cy + 10), paint((210, 214, 224)))
        for k in range(8):
            c.drawLine(-86 + k * 9, cy + 10, -86 + k * 9, cy + 34, paint((210, 214, 224), stroke=3))
        glow(c, -55, cy, 60, (230, 236, 255), 0.5)
    if a < 1:
        c.restore()
    c.restore()


def silver_comb(c, x, y, s, rot=0.0, glint=1.0):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.scale(s, s)
    c.drawRRect(skia.RRect.MakeRectXY(R(-80, -16, 80, 16), 8, 8), paint((200, 204, 214)))
    for k in range(16):
        c.drawLine(-74 + k * 10, 16, -74 + k * 10, 62, paint((190, 194, 204), stroke=4, cap_round=True))
    c.drawRRect(skia.RRect.MakeRectXY(R(-80, -16, 80, 16), 8, 8), paint((120, 124, 134), stroke=2))
    c.restore()
    glow(c, x - 20 * s, y, 90 * s, (230, 236, 255), 0.5 * glint)


def irish_night(c, x, horizon=1150, seed=0, moon_pos=(780, 460, 110)):
    sky(c, top=(6, 8, 14), mid=(20, 26, 38), haze=(54, 62, 76), horizon=horizon)
    stars(c, x, seed=140 + seed)
    if moon_pos:
        moon(c, *moon_pos)


# ================================================================== scenes
def bs_hook(c, x):
    x.push, x.focus = 0.2, (W / 2, 1150)
    with layer(c, x, 0.0):
        irish_night(c, x, horizon=1200, seed=1)
    with layer(c, x, 0.4):
        c.drawRect(R(-500, 1200, 1600, 2600), lin_paint(0, 1200, 0, 1800, [(0, (30, 36, 36), 1), (1, (8, 10, 10), 1)]))
        cottage(c, 700, 1260, 1.1, T=x.T)
        stone_wall(c, -100, 1200, 1340, 60, seed=1)
        # crying figure in the mist below the window, visible from the very first frame
        sob = math.sin(x.T * 6) * 0.5 * 4
        banshee(c, 260, 1420 + sob, 0.95, T=x.T, wind=0.6)
    with layer(c, x, 0.9):
        fog(c, x, 1450, a=0.35, speed=10, seed=2, color=(170, 180, 200), scale=1.5)


def bs_ireland(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    with layer(c, x, 0.0):
        irish_night(c, x, horizon=1150, seed=2, moon_pos=(820, 400, 120))
    with layer(c, x, 0.3):
        c.drawRect(R(-500, 1150, 1600, 2600), lin_paint(0, 1150, 0, 1500, [(0, (40, 48, 66), 1), (1, (16, 20, 28), 1)]))
        for i in range(14):
            yy = 1160 + i * 22
            wob = math.sin(x.T * 1.4 + i) * 16
            c.drawLine(820 - 50 + wob, yy, 820 + 50 + wob, yy, paint(MOON, 0.35 - i * 0.02, stroke=3))
        cliffs(c, horizon=1250)
    with layer(c, x, 0.6):
        c.drawPath(smooth_path([(-300, 1500), (200, 1380), (700, 1420), (1400, 1360), (1400, 2600), (-300, 2600)]),
                   paint(GRASS))
        for k in range(4):
            stone_wall(c, -100 + k * 80, 1300, 1560 + k * 110, 40 + k * 14, seed=k)
        cottage(c, 760, 1440, 0.7, T=x.T)
    with layer(c, x, 0.95):
        fog(c, x, 1500, a=0.25, speed=12, seed=3, color=(170, 180, 200), scale=1.5)


def bs_title(c, x):
    x.push, x.focus = 0.16, (W / 2, 1150)
    with layer(c, x, 0.0):
        irish_night(c, x, horizon=1300, seed=3, moon_pos=(540, 860, 270))
    with layer(c, x, 0.5):
        c.drawPath(smooth_path([(-300, 1450), (300, 1330), (540, 1300), (800, 1330), (1400, 1450), (1400, 2600),
                                (-300, 2600)]), paint(GRASS))
        banshee(c, 540, 1320, 1.05, T=x.T, wind=1.4)
    with layer(c, x, 0.95):
        fog(c, x, 1500, a=0.3, speed=14, seed=4, color=(170, 180, 200), scale=1.4)


def bs_face(c, x):
    x.push, x.focus = 0.14, (W / 2, 900)
    tc = x.wt("crying", x.dur * 0.85)
    red = ease(ramp(x.t, tc - 0.5, tc + 0.3))
    with layer(c, x, 0.0):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (8, 10, 16), 1), (1, (20, 24, 32), 1)]))
    with layer(c, x, 0.7):
        cx, cy = W / 2, 880
        blow = math.sin(x.T * 1.4) * 30
        rng = np.random.default_rng(2)
        for i in range(60):                                # silver hair streaming sideways
            y0 = cy - 300 + i * 12
            pth = skia.Path()
            pth.moveTo(cx - 100 + rng.uniform(-40, 40), y0)
            pth.cubicTo(cx + 200 + blow, y0 - 60, cx + 500 + blow, y0 + 40, cx + 900 + blow * 2, y0 + 120)
            c.drawPath(pth, paint(mix(SILVER, (90, 94, 110), rng.uniform(0, 0.5)), 0.8, stroke=rng.uniform(4, 10)))
        face = smooth_path([(cx - 150, cy - 220), (cx, cy - 260), (cx + 150, cy - 220), (cx + 170, cy),
                            (cx + 110, cy + 220), (cx, cy + 270), (cx - 110, cy + 220), (cx - 170, cy)])
        c.drawPath(face, lin_paint(0, cy - 260, 0, cy + 270, [(0, (200, 204, 212), 1), (1, (140, 144, 156), 1)]))
        for ex in (cx - 70, cx + 70):
            c.drawOval(R(ex - 52, cy - 64, ex + 52, cy - 4), paint((140, 40, 46), 0.4 + 0.5 * red, blur=10))
            c.drawOval(R(ex - 36, cy - 50, ex + 36, cy - 14), paint((24, 18, 22)))
            c.drawCircle(ex, cy - 32, 7, paint((236, 236, 240)))
            c.drawLine(ex, cy - 6, ex - 4, cy + 120 * red, paint((200, 210, 230), 0.5 * red, stroke=4))   # tears
        c.drawLine(cx - 40, cy + 140, cx + 40, cy + 146, paint((60, 40, 48), stroke=8, cap_round=True))
        c.drawPath(smooth_path([(cx - 170, cy - 230), (cx + 160, cy - 270), (cx + 120, cy - 120), (cx - 60, cy - 150),
                                (cx - 180, cy - 40)]), paint(SILVER))


def bs_warns(c, x):
    x.push, x.focus = 0.14, (W / 2, 1200)
    tw = x.wt("warns", x.dur * 0.8)
    pt = ease(ramp(x.t, 0.3, tw))
    with layer(c, x, 0.0):
        irish_night(c, x, horizon=1250, seed=4, moon_pos=(220, 420, 80))
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1250, 1600, 2600), lin_paint(0, 1250, 0, 1800, [(0, (30, 36, 36), 1), (1, (8, 10, 10), 1)]))
        cottage(c, 820, 1330, 0.95, T=x.T, lit=1.0)
        banshee(c, 260, 1520, 1.05, T=x.T, point=pt)
    with layer(c, x, 0.95):
        fog(c, x, 1550, a=0.3, speed=10, seed=5, color=(170, 180, 200), scale=1.5)


def bs_scream(c, x):
    x.push, x.focus = 0.14, (W / 2, 1100)
    ts = x.wt("screams", 0.8)
    ti = x.wt("someone", x.dur * 0.6)
    scr = ease(ramp(x.t, ts - 0.1, ts + 0.3))
    lit = 1 - ease(ramp(x.t, ti, ti + 0.4))
    with layer(c, x, 0.0):
        irish_night(c, x, horizon=1250, seed=5, moon_pos=(860, 380, 80))
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1250, 1600, 2600), paint((14, 18, 18)))
        cottage(c, 780, 1330, 0.9, T=x.T, lit=lit)
        banshee(c, 320, 1560, 1.35, T=x.T, scream=scr, wind=1.6)
    x.shake = shake_amount(x.t, [ts, ti], strength=14)


def bs_comb(c, x):
    x.push, x.focus = 0.14, (W / 2, 900)
    with layer(c, x, 0.0):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (8, 10, 16), 1), (1, (22, 26, 34), 1)]))
        glow(c, 800, 200, 700, MOON, 0.18)
    with layer(c, x, 0.7):
        rng = np.random.default_rng(6)
        for i in range(70):                                 # a curtain of long silver hair
            hx = 200 + i * 10 + rng.uniform(-6, 6)
            pth = skia.Path()
            pth.moveTo(hx, -100)
            pth.cubicTo(hx + 20, 600, hx - 20 + math.sin(x.T + i * 0.2) * 10, 1300, hx + rng.uniform(-30, 30), 2100)
            c.drawPath(pth, paint(mix(SILVER, (90, 94, 110), rng.uniform(0, 0.5)), 0.9, stroke=rng.uniform(4, 9)))
        # the comb drawn slowly down through the hair, stroke after stroke
        ph = (x.t * 0.55) % 1.0
        cy = 300 + ease(ph) * 1300
        a = math.sin(math.pi * ph)
        c.drawLine(1200, cy - 300, 700, cy - 20, paint(PALE, a, stroke=50, cap_round=True))
        silver_comb(c, 600, cy, 1.6, rot=-10, glint=a)


def bs_road_comb(c, x):
    x.push, x.focus = 0.16, (W / 2, 1300)
    tn = x.wt("never", x.dur * 0.75)
    reach = ease(ramp(x.t, 0.3, tn)) * (1 - ease(ramp(x.t, tn + 0.2, tn + 1.0)))
    with layer(c, x, 0.0):
        irish_night(c, x, horizon=950, seed=6, moon_pos=None)
    with layer(c, x, 0.4):
        c.drawRect(R(-500, 950, 1600, 2600), paint(GRASS))
        c.drawPath(poly([(W / 2 - 30, 950), (W / 2 + 30, 950), (W / 2 + 520, 2000), (W / 2 - 520, 2000)]),
                   lin_paint(0, 950, 0, 1900, [(0, (56, 60, 66), 1), (1, (26, 28, 32), 1)]))
        stone_wall(c, -200, W / 2 - 60, 1100, 70, seed=7)
        stone_wall(c, W / 2 + 60, 1300, 1100, 70, seed=8)
        for i in range(6):                                  # wet road reflections
            c.drawLine(W / 2 - 200 + i * 70, 1300 + i * 70, W / 2 - 160 + i * 70, 1300 + i * 70, paint(MOON, 0.15, stroke=4))
        silver_comb(c, W / 2, 1560, 1.1, rot=12, glint=0.7 + 0.3 * math.sin(x.T * 4))
    with layer(c, x, 0.8):
        hy = 2200 - 560 * reach
        c.drawLine(W / 2 + 200, 2400, W / 2 + 80, hy, paint((150, 110, 90), stroke=90, cap_round=True))
        for f in range(4):
            c.drawLine(W / 2 + 80, hy, W / 2 + 40 + f * 26, hy - 110, paint((160, 120, 100), stroke=24, cap_round=True))


def bs_returns(c, x):
    x.push, x.focus = 0.14, (W / 2, 1200)
    k = ease(ramp(x.t, 0.0, x.dur))
    with layer(c, x, 0.0):
        irish_night(c, x, horizon=1250, seed=7, moon_pos=(860, 420, 90))
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1250, 1600, 2600), paint((14, 18, 18)))
        cottage(c, 760, 1330, 0.85, T=x.T)
        banshee(c, 120 + 360 * k, 1500 - 60 * k, 0.7 + 0.25 * k, T=x.T)
    with layer(c, x, 0.95):
        fog(c, x, 1400, a=0.45, speed=40, seed=6, color=(170, 180, 200), scale=1.8)


def bs_pov(c, x):
    x.push, x.focus = 0.22, (W / 2, 900)
    appear = ease(ramp(x.t, x.dur * 0.45, x.dur))
    fl = flicker(x.T, 8)
    with layer(c, x, 0.2):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (20, 16, 16), 1), (1, (36, 28, 24), 1)]))
        wx0, wy0, wx1, wy1 = 250, 420, 830, 1200
        c.save()
        c.clipRect(R(wx0, wy0, wx1, wy1))
        c.drawRect(R(wx0, wy0, wx1, wy1), lin_paint(0, wy0, 0, wy1, [(0, (20, 26, 38), 1), (1, (50, 58, 72), 1)]))
        fog(c, x, 1000, a=0.5, speed=12, seed=8, color=(170, 180, 200), scale=1.2)
        banshee(c, 560, 1260, 0.6, T=x.T, a=0.25 + 0.6 * appear)
        c.restore()
        c.drawRect(R(wx0, wy0, wx1, wy1), paint((40, 30, 24), stroke=26))
        c.drawRect(R((wx0 + wx1) / 2 - 7, wy0, (wx0 + wx1) / 2 + 7, wy1), paint((40, 30, 24)))
        c.drawRect(R(wx0 - 60, wy1, wx1 + 60, wy1 + 40), paint((54, 40, 30)))          # windowsill
        silver_comb(c, 620, wy1 - 10, 0.8, rot=-6, glint=0.6 + 0.4 * math.sin(x.T * 3))
        glow(c, 380, 1300, 500, LANTERN, 0.3 * fl)                                     # candle in the room
        c.drawRect(R(370, 1250, 390, 1320), paint((220, 210, 190)))
        c.drawOval(R(372, 1222 - 4 * fl, 388, 1250), paint((255, 200, 120)))


def bs_reveal(c, x):
    x.push, x.focus = 0.28, (W / 2, 850)
    tr = x.wt("she's", 0.2) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((5, 5, 7)))
    if x.t < tr:
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=24)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        c.saveLayer(None, paint(a=k))
        cx, cy = W / 2, 860
        rng = np.random.default_rng(9)
        for i in range(70):                                  # wild silver hair
            ang = rng.uniform(math.pi * 0.9, math.pi * 2.1)
            ln = rng.uniform(400, 900)
            pth = skia.Path()
            pth.moveTo(cx, cy - 200)
            pth.cubicTo(cx + math.cos(ang) * ln * 0.4, cy - 200 + math.sin(ang) * ln * 0.4 - 120,
                        cx + math.cos(ang) * ln * 0.8, cy + math.sin(ang) * ln * 0.5,
                        cx + math.cos(ang) * ln, cy + 300 + rng.uniform(0, 600))
            c.drawPath(pth, paint(mix(SILVER, (90, 94, 110), rng.uniform(0, 0.5)), 0.85, stroke=rng.uniform(4, 10)))
        face = smooth_path([(cx - 160, cy - 230), (cx, cy - 280), (cx + 160, cy - 230), (cx + 185, cy),
                            (cx + 120, cy + 260), (cx, cy + 360), (cx - 120, cy + 260), (cx - 185, cy)])
        c.drawPath(face, lin_paint(0, cy - 280, 0, cy + 360, [(0, (214, 218, 226), 1), (1, (140, 146, 160), 1)]))
        c.save()
        c.clipPath(face, doAntiAlias=True)
        for sx in (-1, 1):
            c.drawOval(R(cx + sx * 130 - 60, cy + 30, cx + sx * 130 + 50, cy + 220), paint((60, 64, 80), 0.6, blur=22))
        c.restore()
        for ex in (cx - 75, cx + 75):
            c.drawOval(R(ex - 62, cy - 90, ex + 62, cy - 10), paint((150, 30, 40), 0.7, blur=10))
            c.drawOval(R(ex - 44, cy - 76, ex + 44, cy - 24), paint((236, 236, 240)))
            c.drawCircle(ex, cy - 50, 9, paint((8, 6, 8)))
        # screaming mouth stretched open
        c.drawPath(smooth_path([(cx - 70, cy + 80), (cx, cy + 60), (cx + 70, cy + 80), (cx + 80, cy + 280),
                                (cx, cy + 330), (cx - 80, cy + 280)]), paint((10, 4, 6)))
        # window frame + glass
        c.drawRect(R(30, 300, 1050, 1500), paint((40, 30, 24), stroke=40))
        c.drawLine(540, 300, 540, 1500, paint((40, 30, 24), stroke=26))
        c.drawRect(R(30, 300, 1050, 1500), paint((180, 200, 230), 0.06))
        c.restore()


for _f in (bs_hook, bs_ireland, bs_title, bs_face, bs_warns, bs_scream, bs_comb, bs_road_comb, bs_returns, bs_pov,
           bs_reveal):
    scenes.SCENES[_f.__name__] = _f


# ================================================================== sounds
SR = audio.SR


def _noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def keen(length=3.0, f0=620.0, f1=980.0, loud=0.5, seed=1):
    """Banshee wail: gliding voice-like tone with vibrato, breath and a hollow formant."""
    n = int(length * SR)
    t = np.arange(n) / SR
    glide = f0 + (f1 - f0) * np.sin(np.pi * np.clip(t / length, 0, 1)) ** 0.7
    vib = 1 + 0.02 * np.sin(2 * np.pi * 5.5 * t)
    ph = 2 * np.pi * np.cumsum(glide * vib) / SR
    x = np.sin(ph) + 0.45 * np.sin(2 * ph) + 0.2 * np.sin(3 * ph)
    x = audio.filt(x.astype(np.float32), "band", (500, 3500))
    x += audio.filt(_noise(n, seed), "band", (1500, 5000)) * 0.15
    env = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 1.2
    return audio.reverb(x * env * loud, 0.55)


def sobbing(length, seed=2):
    n = int(length * SR)
    out = np.zeros(n, np.float32)
    rng = np.random.default_rng(seed)
    k = 0.2
    while k < length - 1.0:
        s = keen(rng.uniform(0.5, 0.9), rng.uniform(380, 460), rng.uniform(500, 620), 0.18, seed=int(k * 10))
        i = int(k * SR)
        out[i:i + len(s)] += s[: n - i, 0]
        k += rng.uniform(0.7, 1.3)
    return audio.stereo(out)


def comb_stroke(seed=0):
    n = int(1.2 * SR)
    t = np.arange(n) / SR
    teeth = (np.sin(2 * np.pi * 60 * t) > 0.6).astype(np.float32)
    return audio.filt(_noise(n, seed) * teeth, "band", (3000, 8000)) * np.sin(np.pi * t / 1.2) * 0.12


def moor_wind(length, seed=5):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = audio.filt(_noise(n, seed), "band", (200, 1200)) * (0.5 + 0.5 * np.sin(2 * np.pi * t / 6.3)) * 0.3
    whistle = np.sin(2 * np.pi * (700 + 120 * np.sin(2 * np.pi * t / 4.1)) * t) * 0.012
    return audio.stereo((x + whistle).astype(np.float32))


def _at(s, word, frac=0.5):
    return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)


def _sfx_hook(m, s, tl):
    m.add(0.0, moor_wind(tl["story_end"] + 0.5), 0.8)
    m.add(s["start"] + 0.2, sobbing(s["end"] - s["start"]), 0.9, pan=-0.3)


def _sfx_ireland(m, s, tl):
    m.add(s["start"], waves(s["end"] - s["start"] + 0.5), 0.6)


def _sfx_title(m, s, tl):
    m.add(s["start"] + 0.2, keen(2.4, 560, 1100, 0.6), 0.9)


def _sfx_face(m, s, tl):
    m.add(_at(s, "crying", 0.8) - 0.6, sobbing(2.4, 4), 0.8)


def _sfx_scream(m, s, tl):
    ts = _at(s, "screams", 0.2)
    m.add(ts - 0.1, keen(3.0, 700, 1500, 1.0, seed=7), 1.0)
    m.add(_at(s, "someone", 0.6), audio.boom(2.5, f0=60, f1=25), 0.7)


def _sfx_comb(m, s, tl):
    k, i = s["start"] + 0.2, 0
    while k < s["end"]:
        m.add(k, comb_stroke(i), 0.8, pan=-0.2)
        k += 1 / 0.55
        i += 1


def _sfx_road(m, s, tl):
    m.add(_at(s, "never", 0.75) - 0.1, audio.sting(2.0), 0.8)


def _sfx_returns(m, s, tl):
    m.add(s["start"] + 0.3, keen(2.5, 500, 760, 0.35, seed=9), 0.7, pan=-0.5)


def _sfx_pov(m, s, tl):
    m.add(s["start"] + 0.3, sobbing(s["end"] - s["start"] - 0.5, 11), 0.55, pan=0.4)


def _sfx_reveal(m, s, tl):
    tr = audio.reveal_time(tl)
    if tr is not None:
        m.add(tr, keen(2.5, 900, 1700, 1.1, seed=13), 1.0)


audio.SFX.update({"bs_hook": _sfx_hook, "bs_ireland": _sfx_ireland, "bs_title": _sfx_title, "bs_face": _sfx_face,
                  "bs_scream": _sfx_scream, "bs_comb": _sfx_comb, "bs_road_comb": _sfx_road,
                  "bs_returns": _sfx_returns, "bs_pov": _sfx_pov, "bs_reveal": _sfx_reveal})
