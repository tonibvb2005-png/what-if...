"""Scenes + sounds for 'Baba Yaga' (registers into scenes.SCENES / audio.SFX).

Motion rules: every movement is a monotonic function of local time; feet stay on the ground.
"""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, forest_row, hills, fog, glow, light_shaft, paint, lin_paint,
                 rad_paint, R, poly, smooth_path, mix, ease, ramp, shake_amount, fur_path, _limb, SIL, MOON, CREAM,
                 RED, LANTERN, SKY_TOP, SKY_MID, SKY_HAZE)
from scenes_rattenfaenger import child

flicker = scenes.flicker
SNOW = (40, 44, 60)
LOG = (58, 42, 32)
LEG = (128, 112, 78)
BONE = (196, 188, 166)
SKULL_EYE = (196, 236, 130)
WITCH_SKIN = (128, 138, 112)
RAGS = (40, 34, 38)
FIRE = (255, 120, 50)


# ================================================================== elements
def snowfall(c, T, a=0.5, n=120, seed=4, speed=60):
    rng = np.random.default_rng(seed)
    for _ in range(n):
        x0, y0 = rng.uniform(-100, 1180), rng.uniform(0, 2200)
        r_ = rng.uniform(1.5, 4.5)
        yy = (y0 + T * speed * r_ / 3) % 2200 - 100
        xx = x0 + math.sin(T * 0.8 + y0) * 20
        c.drawCircle(xx, yy, r_, paint((220, 226, 240), a * (r_ / 4.5)))


def snow_ground(c, y, color=SNOW):
    c.drawRect(R(-500, y, 1600, 2600), lin_paint(0, y, 0, y + 800, [(0, mix(color, (150, 160, 190), 0.12), 1),
                                                                    (1, mix(color, (0, 0, 0), 0.65), 1)]))


def birch(c, x, by, h, w, seed=0, a=1.0):
    rng = np.random.default_rng(seed)
    c.drawRect(R(x - w / 2, by - h, x + w / 2, by), paint((168, 168, 176), a))
    c.drawRect(R(x, by - h, x + w / 2, by), paint((0, 0, 0), 0.35 * a))
    for _ in range(int(h / 40)):
        yy = by - rng.uniform(0, h)
        c.drawLine(x - w / 2, yy, x - w / 2 + w * rng.uniform(0.3, 0.9), yy + rng.uniform(-3, 3),
                   paint((30, 28, 30), a, stroke=rng.uniform(2, 5)))


def chicken_leg(c, hx, hy, fx, fy, s, color=LEG, lift=0.0):
    """Big scaly chicken leg from hip (hx,hy) to foot (fx,fy)."""
    kx = (hx + fx) / 2 - 60 * s
    ky = (hy + fy) / 2 - 10 * s - lift * 20 * s
    c.drawPath(fur_path(hx, hy + 30 * s, 70 * s, 60 * s, np.random.default_rng(int(hx) % 97), spikes=22, jit=0.18),
               paint((46, 38, 34)))
    c.drawLine(hx, hy + 30 * s, kx, ky, paint(mix(color, (0, 0, 0), 0.35), stroke=44 * s, cap_round=True))
    c.drawLine(kx, ky, fx, fy - 6 * s, paint(color, stroke=24 * s, cap_round=True))
    for k in range(6):
        f = (k + 1) / 7
        sx = kx + (fx - kx) * f
        sy = ky + (fy - ky) * f
        c.drawLine(sx - 12 * s, sy, sx + 12 * s, sy + 4 * s, paint(mix(color, (0, 0, 0), 0.4), stroke=3 * s))
    for ang in (-50, -10, 30, 160):
        ex = fx + math.cos(math.radians(ang)) * 56 * s
        ey = fy + math.sin(math.radians(ang)) * 10 * s + (8 * s if ang != 160 else -4 * s)
        c.drawLine(fx, fy - 4 * s, ex, ey, paint(color, stroke=11 * s, cap_round=True))
        c.drawLine(ex, ey, ex + math.cos(math.radians(ang)) * 14 * s, ey + 8 * s, paint((30, 26, 22), stroke=5 * s,
                                                                                        cap_round=True))


def hut(c, x, by, s, angle=0.0, step=0.0, lit=1.0, door_open=0.0, T=0.0, leg_h=1.0, inner=None):
    """Log hut on chicken legs. angle 0 = back faces us, 180 = door faces us. (x,by) = feet on the ground."""
    a = math.radians(angle % 360)
    fw = 360 * s * abs(math.cos(a))           # front/back face width
    sd = 300 * s * abs(math.sin(a))           # side face width
    leg_top = by - 380 * s * leg_h
    base = leg_top - 10 * s
    top = base - 300 * s
    # legs (alternating step: one foot lifts, moves, lands)
    for k, side in enumerate((-1, 1)):
        ph = step * math.pi + k * math.pi
        lift = max(0.0, math.sin(ph))
        fx = x + side * 90 * s + math.cos(ph) * 30 * s
        fy = by - lift * 60 * s
        chicken_leg(c, x + side * 60 * s, leg_top, fx, fy, s, lift=lift)
    x0 = x - (fw + sd) / 2
    show_front = math.cos(a) < 0
    if math.sin(a) > 0:                       # face on the left, side wall on the right
        fx0, sx0 = x0, x0 + fw
    else:                                     # side wall on the left, face on the right
        sx0, fx0 = x0, x0 + sd
    if sd > 1:
        c.drawRect(R(sx0, top, sx0 + sd, base), paint(mix(LOG, (0, 0, 0), 0.45)))
        for k in range(8):
            yy = top + (base - top) * (k + 0.5) / 8
            c.drawLine(sx0, yy, sx0 + sd, yy, paint((24, 18, 14), stroke=3 * s))
    # front / back face
    if fw > 1:
        c.drawRect(R(fx0, top, fx0 + fw, base), lin_paint(fx0, 0, fx0 + fw, 0, [(0, LOG, 1), (1, mix(LOG, (0, 0, 0), 0.3), 1)]))
        for k in range(9):
            yy = top + (base - top) * (k + 0.5) / 9
            c.drawLine(fx0, yy, fx0 + fw, yy, paint((26, 18, 14), stroke=4 * s))
            c.drawCircle(fx0, yy, 9 * s, paint((80, 60, 44)))
            c.drawCircle(fx0 + fw, yy, 9 * s, paint((80, 60, 44)))
        if show_front:
            cx = fx0 + fw / 2
            dw = fw * 0.26
            fl = flicker(T, 7)
            # window
            c.drawRect(R(cx + dw * 0.9, top + 70 * s, cx + dw * 0.9 + fw * 0.2, top + 150 * s), paint(LANTERN, lit * fl))
            glow(c, cx + dw * 0.9 + fw * 0.1, top + 110 * s, 160 * s, LANTERN, 0.35 * lit * fl)
            # door
            c.drawRect(R(cx - dw, top + 90 * s, cx + dw * 0.4, base), paint((26, 16, 12)))
            if door_open > 0:
                c.drawRect(R(cx - dw, top + 90 * s, cx + dw * 0.4, base), paint(FIRE, 0.85 * door_open * fl))
                if inner:
                    inner(c, cx - dw * 0.3, base, s)
                glow(c, cx - dw * 0.3, base - 60 * s, 420 * s, FIRE, 0.45 * door_open * fl)
                c.drawRect(R(cx - dw, top + 90 * s, cx - dw + 2 * dw * (1 - door_open) * 0.7, base), paint((44, 30, 22)))
    # roof
    rl, rr = min(x0, fx0) - 30 * s, max(fx0 + fw, x0 + fw + sd) + 30 * s
    c.drawPath(poly([(rl, top + 10 * s), ((rl + rr) / 2, top - 150 * s), (rr, top + 10 * s)]), paint((30, 26, 22)))
    rng = np.random.default_rng(3)
    for k in range(18):
        f = k / 17
        c.drawLine(rl + (rr - rl) * f, top + 10 * s, (rl + rr) / 2, top - 150 * s, paint((44, 38, 30), 0.6, stroke=2 * s))
    _ = rng


def skull(c, x, y, s, eyes=0.0, T=0.0):
    c.drawCircle(x, y, 34 * s, paint(BONE))
    c.drawRRect(skia.RRect.MakeRectXY(R(x - 20 * s, y + 14 * s, x + 20 * s, y + 46 * s), 8 * s, 8 * s), paint(BONE))
    c.drawCircle(x, y, 34 * s, paint((0, 0, 0), 0.25, stroke=3 * s))
    for k in range(4):
        tx = x - 13 * s + k * 9 * s
        c.drawLine(tx, y + 30 * s, tx, y + 44 * s, paint((60, 54, 46), stroke=2 * s))
    c.drawPath(poly([(x, y + 6 * s), (x - 7 * s, y + 20 * s), (x + 7 * s, y + 20 * s)]), paint((30, 26, 24)))
    for ex in (x - 14 * s, x + 14 * s):
        c.drawOval(R(ex - 10 * s, y - 10 * s, ex + 10 * s, y + 8 * s), paint((16, 14, 14)))
        if eyes > 0:
            fl = 0.85 + 0.15 * math.sin(T * 13 + ex)
            glow(c, ex, y - 1 * s, 70 * s * eyes, SKULL_EYE, 0.6 * eyes * fl)
            c.drawOval(R(ex - 6 * s, y - 6 * s, ex + 6 * s, y + 4 * s), paint((230, 255, 190), eyes * fl))


def bone_fence(c, x0, x1, by, s, eyes=0.0, T=0.0, every=1, seed=0):
    n = int((x1 - x0) / (120 * s)) + 1
    for k in range(n):
        px = x0 + k * 120 * s
        c.drawLine(px, by, px, by - 220 * s, paint(mix(BONE, (0, 0, 0), 0.35), stroke=14 * s))
        if k % every == 0:
            skull(c, px, by - 250 * s, 0.9 * s, eyes=eyes if eyes else 0.0, T=T)
    for yy in (by - 70 * s, by - 150 * s):
        for k in range(n - 1):
            ax, bx = x0 + k * 120 * s + 6 * s, x0 + (k + 1) * 120 * s - 6 * s
            c.drawLine(ax, yy, bx, yy + 4 * s, paint(mix(BONE, (0, 0, 0), 0.25), stroke=9 * s))
            for ex in (ax, bx):
                c.drawCircle(ex, yy + 2 * s, 8 * s, paint(mix(BONE, (0, 0, 0), 0.2)))


def witch(c, x, y, s, facing=1, teeth=0.0, silhouette=0.0, T=0.0, bone_leg=True, arm_up=0.0):
    """Hunched old witch, side view facing right. Feet at (x,y), height ~330*s."""
    def C(rgb):
        return mix(rgb, SIL, silhouette)
    c.save()
    c.translate(x, y)
    c.scale(s * facing, s)
    # legs: one normal, one bone
    c.drawLine(-14, -110, -24, 0, paint(C((30, 26, 28)), stroke=16, cap_round=True))
    if bone_leg:
        c.drawLine(18, -110, 26, -4, paint(C(BONE), stroke=9, cap_round=True))
        c.drawCircle(22, -56, 8, paint(C(BONE)))
        c.drawOval(R(20, -8, 46, 4), paint(C(BONE)))
    # body: ragged hunched shawl
    rng = np.random.default_rng(5)
    body = fur_path(-6, -170, 72, 92, rng, spikes=30, jit=0.12)
    c.drawPath(body, paint(C(RAGS)))
    c.drawPath(smooth_path([(-70, -130), (-30, -270), (40, -250), (60, -150), (20, -100)]), paint(C((54, 40, 44))))
    # arm with long fingers
    hx = 70 + arm_up * 20
    hy = -170 - arm_up * 90
    c.drawLine(20, -210, hx, hy, paint(C((50, 38, 42)), stroke=18, cap_round=True))
    for k in range(4):
        c.drawLine(hx, hy, hx + 30 + k * 4, hy + 12 - k * 8, paint(C(WITCH_SKIN), stroke=4, cap_round=True))
    # head jutting forward
    c.drawCircle(48, -258, 30, paint(C(WITCH_SKIN)))
    c.drawPath(poly([(70, -268), (118, -236), (72, -246)]), paint(C(WITCH_SKIN)))   # hooked nose
    c.drawPath(poly([(60, -238), (84, -214), (56, -226)]), paint(C(WITCH_SKIN)))    # chin
    if teeth > 0:
        c.drawRect(R(58, -240, 76, -232), paint((150, 156, 170), teeth))
        glow(c, 68, -236, 26, (210, 220, 240), 0.6 * teeth)
    c.drawCircle(62, -268, 3.5, paint(C((200, 210, 120)) if silhouette < 0.9 else (200, 210, 120)))
    # wild hair + headscarf
    for k in range(9):
        ang = math.radians(150 + k * 14)
        c.drawLine(36, -274, 36 + math.cos(ang) * 70, -274 + math.sin(ang) * -50 + 40,
                   paint(C((150, 150, 150)), 0.8, stroke=3))
    c.drawPath(smooth_path([(10, -270), (40, -300), (76, -284), (60, -266), (20, -250)]), paint(C((70, 30, 34))))
    c.restore()


def mortar(c, x, y, s, T=0.0, tilt=0.0):
    """Witch flying in a mortar with pestle and broom. (x,y) = bottom of the mortar."""
    c.save()
    c.translate(x, y)
    c.rotate(tilt)
    c.scale(s, s)
    # broom trailing behind (sweeping)
    sw = math.sin(T * 6) * 12
    c.drawLine(-60, -60, -230, -10 + sw, paint((70, 52, 36), stroke=8, cap_round=True))
    c.drawPath(poly([(-220, -24 + sw), (-320, -40 + sw * 1.6), (-330, 30 + sw * 1.6), (-220, 6 + sw)]), paint((110, 86, 50)))
    # witch upper body
    c.save()
    c.translate(10, 30)
    witch(c, 0, -60, 0.9, bone_leg=False, T=T, arm_up=0.6)
    c.restore()
    # pestle
    c.drawLine(70, -200, 140, 20, paint((120, 100, 80), stroke=12, cap_round=True))
    c.drawCircle(140, 22, 16, paint((120, 100, 80)))
    # mortar
    c.drawPath(poly([(-90, -110), (90, -110), (60, 0), (-60, 0)]), lin_paint(-90, 0, 90, 0, [(0, (50, 40, 34), 1), (1, (96, 76, 58), 1)]))
    c.drawOval(R(-92, -122, 92, -98), paint((70, 56, 44)))
    for k in range(3):
        yy = -84 + k * 28
        c.drawLine(-80 + k * 6, yy, 80 - k * 6, yy, paint((40, 30, 24), stroke=3))
    c.restore()


def forest_bg(c, x, ground=1200, seed=70, birches=True):
    sky(c, top=(8, 10, 18), mid=(22, 26, 42), haze=(48, 54, 74), horizon=ground)
    stars(c, x, seed=seed)
    haze(c, ground - 220, ground + 20, (70, 76, 100), a=0.5)
    forest_row(c, ground, 34, 150, 300, (20, 22, 32), seed=seed + 1)
    if birches:
        rng = np.random.default_rng(seed + 2)
        for i in range(10):
            bx = rng.uniform(-50, 1130)
            birch(c, bx, ground + 40, rng.uniform(500, 800), rng.uniform(18, 30), seed=i, a=0.55)


# ================================================================== scenes
def hut_glimpse(c, x):
    x.push, x.focus = 0.2, (W / 2, 1000)
    tk = x.wt("knock", x.dur * 0.85)
    with layer(c, x, 0.0):
        forest_bg(c, x, ground=1180, seed=71)
        moon(c, 860, 360, 80)
    with layer(c, x, 0.4):
        snow_ground(c, 1180)
        hut(c, 560, 1250, 0.6, angle=200, step=ease(ramp(x.t, tk - 0.3, tk + 0.6)), T=x.T)
    with layer(c, x, 0.8):
        # dark trunks framing the view (we peek between them)
        for bx, w in ((90, 150), (1000, 180), (330, 60)):
            c.drawRect(R(bx - w / 2, -300, bx + w / 2, 2400), paint((8, 8, 12)))
        snowfall(c, x.T, a=0.45)
    with layer(c, x, 0.95):
        fog(c, x, 1300, a=0.22, speed=10, seed=3, scale=1.4, color=(160, 170, 200))


def taiga(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    with layer(c, x, 0.0):
        sky(c, top=(8, 10, 18), mid=(22, 26, 42), haze=(48, 54, 74), horizon=1120)
        stars(c, x, seed=72)
        moon(c, 300, 520, 130)
    with layer(c, x, 0.3):
        for k, (y, col) in enumerate(((1060, (30, 34, 48)), (1110, (22, 24, 36)), (1170, (16, 17, 26)))):
            forest_row(c, y, 50, 80 + k * 50, 160 + k * 80, col, seed=73 + k)
            haze(c, y - 60, y + 20, (70, 76, 100), a=0.35)
        # one tiny lit window far away
        fl = flicker(x.T, 2)
        c.drawRect(R(782, 1094, 790, 1102), paint(LANTERN, fl))
        glow(c, 786, 1098, 40, LANTERN, 0.5 * fl)
    with layer(c, x, 0.7):
        snow_ground(c, 1260)
        snowfall(c, x.T, a=0.5)


def title_yaga(c, x):
    x.push, x.focus = 0.16, (W / 2, 1100)
    tt = x.wt("iron", x.dur * 0.85)
    with layer(c, x, 0.0):
        sky(c, top=(8, 10, 18), mid=(22, 26, 42), haze=(48, 54, 74), horizon=1250)
        stars(c, x, seed=74)
        moon(c, 540, 880, 260, MOON)
    with layer(c, x, 0.35):
        haze(c, 1060, 1280, (70, 76, 100), a=0.5)
        forest_row(c, 1250, 30, 160, 320, (16, 18, 28), seed=75, gap=(380, 700))
    with layer(c, x, 0.6):
        snow_ground(c, 1260)
        witch(c, 520, 1270, 1.35, silhouette=0.92, teeth=ease(ramp(x.t, tt - 0.2, tt + 0.3)), T=x.T)
        snowfall(c, x.T, a=0.4)


def mortar_flight(c, x):
    x.push, x.focus = 0.1, (W / 2, 900)
    with layer(c, x, 0.0):
        sky(c, top=(8, 10, 18), mid=(22, 26, 42), haze=(48, 54, 74), horizon=1300)
        stars(c, x, seed=76)
        moon(c, 560, 760, 300, MOON)
    with layer(c, x, 0.5):
        k = ramp(x.t, 0, x.dur)
        mx = -300 + 1700 * k
        my = 900 - math.sin(k * math.pi) * 200 + math.sin(x.T * 2) * 10
        # broom dust trail behind her (only where she has already been)
        rng = np.random.default_rng(2)
        for i in range(60):
            f = i / 60
            px = mx - 320 - f * 700
            if px < -400:
                break
            py = my - 20 + math.sin(f * 9 + x.T) * 30 + rng.normal(0, 10)
            c.drawCircle(px, py, 4 + f * 10, paint((200, 200, 220), 0.3 * (1 - f), blur=4))
        mortar(c, mx, my, 1.0, T=x.T, tilt=math.cos(k * math.pi) * -8)
    with layer(c, x, 0.8):
        forest_row(c, 1420, 26, 300, 520, (8, 9, 14), seed=77)


def hut_turning(c, x):
    x.push, x.focus = 0.12, (W / 2, 1050)
    with layer(c, x, 0.0):
        forest_bg(c, x, ground=1150, seed=78)
        moon(c, 220, 420, 90)
    with layer(c, x, 0.45):
        snow_ground(c, 1150)
        ang = 20 + x.t * 55                         # keeps turning, never snaps back
        hut(c, W / 2, 1420, 0.95, angle=ang, step=x.t * 1.1, lit=0.8, T=x.T)
        c.drawOval(R(W / 2 - 300, 1400, W / 2 + 300, 1450), paint((0, 0, 0), 0.35, blur=12))
    with layer(c, x, 0.9):
        snowfall(c, x.T, a=0.45, seed=6)


def bone_fence_scene(c, x):
    x.push, x.focus = 0.1, (W / 2, 1100)
    pan = x.t * 40                                   # slow continuous dolly
    with layer(c, x, 0.0):
        forest_bg(c, x, ground=1120, seed=79)
        moon(c, 800, 380, 90)
    with layer(c, x, 0.35):
        snow_ground(c, 1120)
        hut(c, 640 - pan * 0.3, 1230, 0.5, angle=180, lit=0.9, T=x.T)
    with layer(c, x, 0.7):
        bone_fence(c, -200 - pan, 1400, 1560, 1.6, T=x.T)
        snowfall(c, x.T, a=0.4, seed=7)


def skull_eyes(c, x):
    x.push, x.focus = 0.14, (W / 2, 900)
    tg = x.wt("glow", x.dur * 0.75)
    with layer(c, x, 0.0):
        forest_bg(c, x, ground=1300, seed=80, birches=False)
    with layer(c, x, 0.6):
        for k, (sx, sy, ss) in enumerate(((240, 860, 2.2), (560, 780, 2.6), (880, 880, 2.2))):
            c.drawLine(sx, sy + 60 * ss, sx, 2200, paint(mix(BONE, (0, 0, 0), 0.4), stroke=26 * ss))
            e = ease(ramp(x.t, tg - 0.6 + k * 0.25, tg - 0.3 + k * 0.25))
            skull(c, sx, sy, ss, eyes=e, T=x.T)
        snowfall(c, x.T, a=0.35, seed=8)


def vasilisa_walk(c, x):
    x.push, x.focus = 0.08, (W / 2, 1100)
    scroll = x.t * 120
    with layer(c, x, 0.0):
        sky(c, top=(8, 10, 18), mid=(22, 26, 42), haze=(48, 54, 74), horizon=1200)
        stars(c, x, seed=81)
    with layer(c, x, 0.35):
        c.save()
        c.translate(-(scroll * 0.4) % 1600, 0)
        for k in (0, 1):
            c.save(); c.translate(k * 1600, 0)
            forest_row(c, 1200, 24, 200, 380, (18, 20, 30), seed=82, x0=-200, x1=1400)
            c.restore()
        c.restore()
    with layer(c, x, 0.6):
        snow_ground(c, 1300)
        for k in range(10):                          # birch trunks sliding past
            bx = (k * 190 - scroll) % 1900 - 200
            birch(c, bx, 1320, 1400, 34, seed=k)
        px = 520
        child(c, px, 1420, 3.2, phase=x.T * 5, seed=1, silhouette=0.35)
        glow(c, px + 30, 1260, 60, (255, 210, 150), 0.6)   # the little doll glowing in her hand
        c.drawCircle(px + 30, 1260, 8, paint((240, 200, 160)))
    with layer(c, x, 0.95):
        snowfall(c, x.T, a=0.45, seed=9)


def spell(c, x):
    x.push, x.focus = 0.16, (W / 2, 900)
    tt = x.wt("turn", x.dur * 0.6)
    rumble = ease(ramp(x.t, tt, tt + 0.6))
    x.shake = (math.sin(x.T * 40) * 4 * rumble, math.cos(x.T * 37) * 3 * rumble)
    with layer(c, x, 0.0):
        forest_bg(c, x, ground=1250, seed=83)
        moon(c, 860, 300, 70)
    with layer(c, x, 0.45):
        snow_ground(c, 1250)
        hut(c, W / 2 + 60, 1500, 1.25, angle=10 + 12 * rumble, step=rumble * 0.6, lit=0.0, T=x.T)
    with layer(c, x, 0.8):
        child(c, 300, 1800, 4.0, walk=False, seed=1, silhouette=0.6)
        snowfall(c, x.T, a=0.45, seed=10)


def _inner_witch(c, x, by, s):
    witch(c, x, by - 10 * s, 0.75 * s, silhouette=1.0, facing=-1)


def door_opens(c, x):
    x.push, x.focus = 0.14, (W / 2, 1000)
    to = x.wt("opened", x.dur * 0.85)
    ang = 10 + 170 * ease(ramp(x.t, 0.2, to - 0.3))
    o = ease(ramp(x.t, to - 0.15, to + 0.5))
    with layer(c, x, 0.0):
        forest_bg(c, x, ground=1200, seed=84)
    with layer(c, x, 0.45):
        snow_ground(c, 1200)
        hut(c, W / 2, 1480, 1.15, angle=ang, step=ramp(x.t, 0.2, to - 0.3) * 2, door_open=o, T=x.T,
            inner=_inner_witch)
        glow(c, W / 2, 1500, 600, FIRE, 0.25 * o)
    with layer(c, x, 0.85):
        child(c, 220, 1820, 3.6, walk=False, seed=1, silhouette=0.85)
        snowfall(c, x.T, a=0.4, seed=11)
    x.shake = shake_amount(x.t, [to], strength=12)


def tasks(c, x):
    x.push, x.focus = 0.14, (W / 2, 1000)
    te = x.wt("eaten", x.dur * 0.85)
    fl = flicker(x.T, 4)
    loom = ease(ramp(x.t, 0.3, te))
    with layer(c, x, 0.2):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1800, [(0, (26, 18, 14), 1), (1, (50, 32, 22), 1)]))
        for k in range(14):
            yy = -100 + k * 120
            c.drawLine(-500, yy, 1600, yy, paint((22, 14, 10), stroke=8))
        # the witch's shadow on the wall grows over the girl
        c.save()
        c.translate(620, 1500)
        c.scale(2.2 + 1.6 * loom, 2.2 + 1.6 * loom)
        sh = skia.Path()
        sh.addPath(fur_path(-6, -170, 72, 92, np.random.default_rng(5), spikes=30, jit=0.12))
        sh.addCircle(48, -258, 30)
        sh.addPath(poly([(70, -268), (130, -232), (72, -246)]))
        sh.addPath(poly([(60, -238), (90, -210), (56, -226)]))
        c.drawPath(sh, paint((10, 6, 6), 0.8 * fl, blur=6))
        c.restore()
    with layer(c, x, 0.6):
        # Russian oven with fire
        c.drawRect(R(700, 900, 1200, 1700), paint((150, 140, 128)))
        c.drawRect(R(780, 1180, 1000, 1400), paint((20, 12, 10)))
        c.drawRect(R(790, 1240, 990, 1400), paint(FIRE, 0.85 * fl))
        glow(c, 890, 1320, 600, FIRE, 0.45 * fl)
        c.drawRect(R(-500, 1700, 1600, 2600), paint((34, 22, 16)))
        # enormous pile of grain + tiny girl sorting it
        c.drawPath(smooth_path([(-100, 1720), (150, 1380), (420, 1300), (640, 1420), (760, 1720)]), paint((150, 120, 70)))
        rng = np.random.default_rng(1)
        for _ in range(140):
            gx, gy = rng.uniform(0, 700), rng.uniform(1400, 1720)
            c.drawCircle(gx, gy, 3, paint((90, 70, 40)))
        child(c, 560, 1740, 2.6, walk=False, seed=1, silhouette=0.4)
    if x.t > te:
        k = ease(ramp(x.t, te, te + 0.12)) * (1 - ramp(x.t, te + 0.5, te + 0.9))
        c.drawRect(R(-500, -500, 1600, 2600), paint((120, 0, 0), 0.35 * k))
        x.shake = shake_amount(x.t, [te], strength=18)


def doll_escape(c, x):
    x.push, x.focus = 0.1, (W / 2, 1100)
    tn = x.wt("most", x.dur * 0.7)
    run = x.t * 260
    k_skulls = ease(ramp(x.t, tn - 0.2, tn + 0.5))
    with layer(c, x, 0.0):
        forest_bg(c, x, ground=1180, seed=85, birches=False)
    with layer(c, x, 0.5):
        snow_ground(c, 1300)
        for k in range(10):
            bx = (k * 190 + run) % 1900 - 200            # trunks slide right -> she runs left
            birch(c, bx, 1320, 1400, 34, seed=k + 20)
        px = 560
        c.save(); c.translate(px, 0); c.scale(-1, 1); c.translate(-px, 0)
        child(c, px, 1440, 3.2, phase=x.T * 9, seed=1, silhouette=0.35)
        c.restore()
        # skull lantern on a stick (true to the tale)
        sx, sy = px - 120, 1060
        c.drawLine(px - 30, 1250, sx, sy + 40, paint((70, 52, 36), stroke=8, cap_round=True))
        skull(c, sx, sy, 0.9, eyes=1.0, T=x.T)
    if k_skulls > 0:
        c.saveLayer(None, paint(a=k_skulls))
        c.drawRect(R(-500, -500, 1600, 2600), paint((8, 8, 12)))
        with layer(c, x, 0.6):
            bone_fence(c, -100, 1300, 1500, 1.5, eyes=0.0, T=x.T)
            for k in range(6):
                skull(c, 140 + k * 170, 1700, 1.5, eyes=0.0)
        c.restore()


def pov_creak(c, x):
    x.push, x.focus = 0.2, (W / 2, 1000)
    near = ease(ramp(x.t, 0.2, x.dur))
    with layer(c, x, 0.0):
        forest_bg(c, x, ground=1150, seed=86)
    with layer(c, x, 0.5):
        snow_ground(c, 1150)
        # only the giant legs visible between the trunks, stepping closer and turning
        s = 0.7 + 0.9 * near
        by = 1180 + 260 * near
        for k, side in enumerate((-1, 1)):
            ph = x.t * 1.2 * math.pi + k * math.pi
            lift = max(0.0, math.sin(ph))
            fx = 560 + side * 90 * s + math.cos(ph) * 30 * s
            chicken_leg(c, 560 + side * 60 * s, by - 380 * s, fx, by - lift * 60 * s, s, lift=lift)
        c.drawRect(R(-500, -500, 1600, by - 380 * s - 20 * s), paint((0, 0, 0), 0.0))
    with layer(c, x, 0.85):
        for bx, w in ((60, 200), (1030, 220), (380, 70), (760, 60)):
            c.drawRect(R(bx - w / 2, -400, bx + w / 2, 2400), paint((7, 7, 10)))
        snowfall(c, x.T, a=0.5, seed=12)


def yaga_reveal(c, x):
    x.push, x.focus = 0.25, (W / 2, 820)
    tr = x.wt("she", x.dur * 0.5) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((7, 7, 10)))
    if x.t < tr:
        with layer(c, x, 0.6):
            a = ease(ramp(x.t, 0.4, 1.4)) * 0.6
            for ex in (W / 2 - 50, W / 2 + 50):
                glow(c, ex, 760, 40, SKULL_EYE, a)
                c.drawCircle(ex, 760, 4, paint((230, 255, 190), a))
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=24)
    sniff = 0.5 + 0.5 * math.sin(x.T * 9)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        c.saveLayer(None, paint(a=k))
        cx = W / 2
        rng = np.random.default_rng(12)
        # long greasy hair behind the face
        for i in range(70):
            hx = cx + rng.uniform(-330, 330)
            c.drawLine(hx, 380, hx + rng.uniform(-80, 80), 1500 + rng.uniform(-200, 200),
                       paint((70, 72, 70), rng.uniform(0.4, 0.9), stroke=rng.uniform(3, 8)))
        face = smooth_path([(cx - 190, 540), (cx, 500), (cx + 190, 540), (cx + 235, 700), (cx + 205, 830),
                            (cx + 150, 960), (cx + 115, 1080), (cx + 60, 1190), (cx - 10, 1215), (cx - 110, 1090),
                            (cx - 150, 960), (cx - 205, 830), (cx - 235, 700)])
        # lit from below: dark forehead, sickly lit chin
        c.drawPath(face, lin_paint(0, 500, 0, 1215, [(0, (22, 24, 20), 1), (0.45, (70, 78, 60), 1),
                                                     (1, (150, 160, 120), 1)]))
        c.save()
        c.clipPath(face, doAntiAlias=True)
        for sx in (-1, 1):                               # sunken cheeks
            c.drawOval(R(cx + sx * 175 - 70, 880, cx + sx * 175 + 70, 1060), paint((14, 14, 12), 0.75, blur=20))
        for i in range(9):                               # deep wrinkles
            yy = 560 + i * 34
            c.drawLine(cx - 150, yy, cx + 150, yy + (i % 3) * 6, paint((10, 10, 8), 0.5, stroke=3))
        c.restore()
        # deep eye sockets with tiny glowing pupils
        for ex, tilt in ((cx - 100, 1), (cx + 100, -1)):
            c.drawOval(R(ex - 72, 690, ex + 72, 800), paint((6, 6, 6), 0.95, blur=6))
            glow(c, ex, 748, 70, SKULL_EYE, 0.8)
            c.drawCircle(ex, 748, 8, paint((235, 255, 200)))
            c.drawLine(ex - 80 * tilt, 668, ex + 70 * tilt, 700, paint((10, 10, 8), stroke=22, cap_round=True))
        # long hooked nose hanging over the mouth
        nose = smooth_path([(cx - 20, 760), (cx + 26, 760), (cx + 60, 900), (cx + 70, 990), (cx + 20, 1000),
                            (cx - 30, 960)])
        c.drawPath(nose, lin_paint(0, 760, 0, 1000, [(0, (40, 44, 36), 1), (1, (160, 168, 130), 1)]))
        for nx in (cx + 5, cx + 50):
            c.drawOval(R(nx - 9 - 4 * sniff, 980, nx + 9 + 4 * sniff, 996), paint((10, 10, 8)))
        # wide open mouth with pointed iron teeth
        mouth = smooth_path([(cx - 150, 1030), (cx, 1012), (cx + 150, 1030), (cx + 95, 1140), (cx, 1165),
                             (cx - 95, 1140)])
        c.drawPath(mouth, paint((24, 4, 6)))
        for i in range(9):
            tx = cx - 128 + i * 32
            ln = 46 if i in (1, 7) else 30
            for y0, d in ((1024, 1), (1150 - abs(i - 4) * 6, -1)):
                tooth = poly([(tx - 13, y0), (tx + 13, y0), (tx + 2, y0 + d * ln)])
                c.drawPath(tooth, lin_paint(tx - 13, 0, tx + 13, 0, [(0, (120, 126, 140), 1), (0.5, (220, 226, 240), 1),
                                                                      (1, (90, 96, 110), 1)]))
        # strands falling over the face
        for i in range(14):
            hx = cx + rng.uniform(-230, 230)
            c.drawLine(hx, 500, hx + rng.uniform(-40, 40), 900 + rng.uniform(0, 300),
                       paint((60, 62, 60), 0.8, stroke=rng.uniform(2, 5)))
        c.restore()


for _f in (hut_glimpse, taiga, title_yaga, mortar_flight, hut_turning, skull_eyes, vasilisa_walk, spell, door_opens,
           tasks, doll_escape, pov_creak, yaga_reveal):
    scenes.SCENES[_f.__name__] = _f
scenes.SCENES["bone_fence"] = bone_fence_scene


# ================================================================== sounds
SR = audio.SR


def _noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def heavy_step(seed=0):
    n = int(0.8 * SR)
    t = np.arange(n) / SR
    x = np.sin(2 * np.pi * (55 - 20 * t) * t) * np.exp(-t * 6) * 1.2 + audio.filt(_noise(n, seed), "low", 300) * np.exp(-t * 10) * 0.6
    return audio.reverb(x, 0.3)


def groan(length=2.5, f0=70, seed=1):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = f0 * (1 + 0.15 * np.sin(2 * np.pi * 0.6 * t))
    saw = audio.filt(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.6 + 0.4 * _noise(n, seed)), "band", (80, 900))
    return audio.reverb(saw * np.sin(np.pi * t / length) * 0.35, 0.4)


def bone_rattle(length=1.2, seed=3):
    n = int(length * SR)
    x = np.zeros(n, np.float32)
    rng = np.random.default_rng(seed)
    for _ in range(int(length * 14)):
        i = int(rng.uniform(0, length - 0.05) * SR)
        ln = int(0.04 * SR)
        tt = np.arange(ln) / SR
        x[i:i + ln] += np.sin(2 * np.pi * rng.uniform(900, 1800) * tt) * np.exp(-tt * 120) * rng.uniform(0.2, 0.5)
    return audio.reverb(x, 0.3)


def crackle(length, seed=5):
    n = int(length * SR)
    rng = np.random.default_rng(seed)
    x = audio.filt(_noise(n, seed), "low", 900) * 0.15
    pops = (rng.random(n) > 0.9993).astype(np.float32)
    x += audio.filt(pops, "band", (1500, 6000)) * 4
    return audio.stereo(x)


def sniff():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    return audio.filt(_noise(n, 9), "band", (1500, 5000)) * np.sin(np.pi * t / t[-1]) ** 2 * 0.8


def snow_steps(t0, t1, rate):
    out = []
    k = t0
    while k < t1:
        out.append(k)
        k += 1 / rate
    return out


def _at(s, word, frac=0.5):
    return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)


def _sfx_glimpse(m, s, tl):
    tk = _at(s, "knock", 0.85)
    m.add(tk, heavy_step(1), 0.8)
    m.add(tk - 0.3, groan(2.0, 60), 0.7)


def _sfx_title(m, s, tl):
    m.add(_at(s, "iron", 0.85), audio.sting(1.6), 0.8)


def _sfx_mortar(m, s, tl):
    d = s["end"] - s["start"]
    n = int(d * SR)
    t = np.arange(n) / SR
    pan_t = t / d
    rush = audio.filt(_noise(n, 4), "band", (200, 1800)) * (0.3 + 0.7 * np.sin(np.pi * pan_t)) * 0.4
    m.add(s["start"], np.stack([rush * (1 - pan_t), rush * pan_t], 1), 0.8)


def _sfx_hut(m, s, tl):
    k = s["start"] + 0.3
    i = 0
    while k < s["end"]:
        m.add(k, heavy_step(i), 0.55)
        k += 1 / 1.1 * 0.5 * 2
        i += 1
    m.add(s["start"] + 0.5, groan(3.0, 55, 2), 0.7)
    m.add(s["start"] + 3.5, groan(3.0, 65, 3), 0.6)


def _sfx_fence(m, s, tl):
    m.add(_at(s, "bones", 0.4) - 0.1, bone_rattle(1.5), 0.8)


def _sfx_eyes(m, s, tl):
    tg = _at(s, "glow", 0.75)
    m.add(tg - 0.7, audio.riser(0.8), 0.5)
    m.add(tg, audio.sting(2.5), 1.0)


def _sfx_walk(m, s, tl):
    for k in snow_steps(s["start"] + 0.2, s["end"], 2.3):
        m.add(k, audio.footstep(0.0), 0.25)


def _sfx_spell(m, s, tl):
    tt = _at(s, "turn", 0.6)
    m.add(tt, groan(3.5, 50, 4), 0.9)
    m.add(tt + 0.3, heavy_step(5), 0.6)


def _sfx_door(m, s, tl):
    to = _at(s, "opened", 0.85)
    m.add(s["start"] + 0.2, groan(to - s["start"], 55, 6), 0.8)
    m.add(to - 0.05, audio.creak(1.8, 0.7), 0.9)
    m.add(to, crackle(s["end"] - to + 1.0), 0.6)


def _sfx_tasks(m, s, tl):
    m.add(s["start"] - 0.2, crackle(s["end"] - s["start"] + 0.4, 7), 0.8)
    m.add(_at(s, "eaten", 0.85), audio.hit(2.5), 0.8)


def _sfx_escape(m, s, tl):
    tn = _at(s, "most", 0.7)
    for k in snow_steps(s["start"] + 0.1, tn - 0.2, 4.5):
        m.add(k, audio.footstep(0.0), 0.3)
    m.add(tn, bone_rattle(1.2, 7), 0.6)
    return [(tn + 0.1, s["end"] + 0.2, 0.35)]


def _sfx_pov(m, s, tl):
    k, i = s["start"] + 0.4, 0
    while k < s["end"] - 0.6:
        m.add(k, heavy_step(10 + i), 0.4 + 0.08 * i)
        k += 0.85
        i += 1
    m.add(s["start"] + 0.3, groan(s["end"] - s["start"], 48, 9), 0.6)


def _sfx_reveal(m, s, tl):
    tr = audio.reveal_time(tl)
    if tr is not None:
        m.add(tr + 0.25, sniff(), 0.9)
        m.add(tr + 0.8, sniff(), 0.8)


audio.SFX.update({"hut_glimpse": _sfx_glimpse, "title_yaga": _sfx_title, "mortar_flight": _sfx_mortar,
                  "hut_turning": _sfx_hut, "bone_fence": _sfx_fence, "skull_eyes": _sfx_eyes,
                  "vasilisa_walk": _sfx_walk, "spell": _sfx_spell, "door_opens": _sfx_door, "tasks": _sfx_tasks,
                  "doll_escape": _sfx_escape, "pov_creak": _sfx_pov, "yaga_reveal": _sfx_reveal})
