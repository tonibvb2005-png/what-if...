"""One draw function per scene kind. Each gets (canvas, ctx)."""
import math

import numpy as np
import skia

from gfx import *  # noqa: F401,F403
from gfx import (W, H, Ctx, layer, sky, stars, moon, haze, forest_row, hills, road, fog, glow,
                 light_shaft, wayside_cross, traveler, beast_riding, beast_crouch, eyes_pair,
                 paint, lin_paint, rad_paint, R, poly, smooth_path, mix, ease, ramp, shake_amount,
                 fur_path, SIL, GROUND, MOON, MOON_WARM, CREAM, RED, LANTERN, SKIN, SKIN_LIT,
                 SKIN_DARK, COAT, COAT_DARK, HAT, BEAST, BEAST_RIM, EYE, SKY_TOP, SKY_MID, SKY_HAZE)


def flicker(T, seed=0.0):
    return 0.86 + 0.08 * math.sin(T * 13.1 + seed) + 0.06 * math.sin(T * 7.3 + seed * 2)


# ------------------------------------------------------------------ 1 hook
def hook_road(c, x):
    x.push, x.focus = 0.22, (W / 2, 560)
    with layer(c, x, 0.0):
        sky(c, horizon=1080)
        stars(c, x, seed=1)
        moon(c, W / 2, 470, 120)
    with layer(c, x, 0.25):
        haze(c, 860, 1140, a=0.55)
        forest_row(c, 1060, 26, 120, 230, (22, 22, 32), seed=4, gap=(470, 610))
        fog(c, x, 1040, a=0.35, speed=10, seed=2)
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1060, 1600, 2600), paint((18, 18, 26)))
        road(c, W / 2, 1060, bottom_w=1400, top_w=30)
        forest_row(c, 1180, 10, 380, 640, (14, 14, 21), seed=5, x0=-300, x1=330)
        forest_row(c, 1180, 10, 380, 640, (14, 14, 21), seed=6, x0=760, x1=1400)
        c.drawRect(R(-400, 1180, 330, 2400), paint((14, 14, 21)))
        c.drawRect(R(760, 1180, 1500, 2400), paint((14, 14, 21)))
        # tiny traveler walking away into the distance
        s = 0.16 - 0.03 * x.p
        traveler(c, W / 2 + 10, 1110 - 40 * x.p, s, phase=x.T * 5, silhouette=0.85, lantern_a=0.8,
                 flicker=flicker(x.T))
    with layer(c, x, 0.9):
        fog(c, x, 1250, a=0.22, speed=22, seed=3, scale=1.3)


# ------------------------------------------------------------------ 2 forest walk
def forest_walk(c, x):
    x.push, x.focus = 0.10, (W / 2, 900)
    with layer(c, x, 0.0):
        sky(c, horizon=1150)
        stars(c, x, seed=2)
        moon(c, 640, 760, 210, MOON_WARM)
    with layer(c, x, 0.2):
        haze(c, 980, 1200, a=0.6)
        forest_row(c, 1140, 30, 140, 260, (30, 29, 42), seed=7)
        fog(c, x, 1120, a=0.3, speed=8, seed=4)
    with layer(c, x, 0.45):
        forest_row(c, 1210, 18, 260, 470, (18, 18, 26), seed=8, gap=(380, 900))
        hills(c, 1205, 8, (17, 17, 24), seed=1)
        tx = 120 + 640 * x.p
        traveler(c, tx, 1212, 0.62, phase=x.T * 4.2, silhouette=0.55, flicker=flicker(x.T))
    with layer(c, x, 0.9):
        forest_row(c, 1400, 6, 700, 1000, (9, 9, 13), seed=9, x0=-350, x1=60)
        forest_row(c, 1400, 5, 700, 1000, (9, 9, 13), seed=10, x0=1040, x1=1450)
        c.drawRect(R(-500, 1290, 1600, 2600), lin_paint(0, 1240, 0, 1500, [(0, GROUND, 0), (1, GROUND, 1)]))
        fog(c, x, 1270, a=0.2, speed=18, seed=5, scale=1.4)


# ------------------------------------------------------------------ 3 title creature
def title_creature(c, x):
    x.push, x.focus = 0.16, (W / 2, 1000)
    with layer(c, x, 0.0):
        sky(c, horizon=1200)
        stars(c, x, seed=3)
        moon(c, 560, 820, 250, MOON)
    with layer(c, x, 0.25):
        haze(c, 1000, 1250, a=0.6)
        forest_row(c, 1200, 24, 160, 300, (26, 26, 38), seed=12)
        fog(c, x, 1180, a=0.32, speed=9, seed=6)
    with layer(c, x, 0.55):
        # boulder + creature
        c.drawPath(smooth_path([(330, 1260), (400, 1150), (560, 1120), (720, 1160), (780, 1270),
                                (560, 1300)]), paint((16, 16, 22)))
        c.drawPath(smooth_path([(400, 1150), (560, 1120), (720, 1160), (600, 1150)]), paint((52, 52, 66), 0.6))
        bl = 1.0 if (x.t % 3.7) < 0.12 else 0.0
        beast_crouch(c, 560, 1150, 0.95, t=x.T, eyes=ease(ramp(x.t, 0.2, 1.4)), blink=bl)
        c.drawRect(R(-500, 1270, 1600, 2600), paint(GROUND))
        hills(c, 1270, 10, GROUND, seed=3)
    with layer(c, x, 0.95):
        fog(c, x, 1300, a=0.25, speed=20, seed=7, scale=1.4)


# ------------------------------------------------------------------ 4 crossroads
def crossroads(c, x):
    x.push, x.focus = 0.14, (W / 2, 1000)
    with layer(c, x, 0.0):
        sky(c, horizon=1100)
        stars(c, x, seed=4)
        moon(c, 820, 420, 95)
    with layer(c, x, 0.3):
        haze(c, 900, 1150, a=0.55)
        hills(c, 1080, 30, (26, 25, 36), seed=4)
        forest_row(c, 1090, 18, 100, 210, (22, 22, 32), seed=13, gap=(380, 760))
        # graveyard crosses on hill
        for gx, gs in ((180, 0.22), (240, 0.18), (300, 0.2), (860, 0.18), (930, 0.22)):
            wayside_cross(c, gx, 1100, gs, color=(20, 20, 28), rim=(20, 20, 28))
    with layer(c, x, 0.55):
        c.drawRect(R(-500, 1120, 1600, 2600), paint((18, 18, 25)))
        # two roads crossing
        c.drawPath(poly([(W / 2 - 14, 1120), (W / 2 + 14, 1120), (W / 2 + 700, 2000), (W / 2 - 700, 2000)]),
                   lin_paint(0, 1120, 0, 1900, [(0, (44, 43, 56), 1), (1, (22, 22, 30), 1)]))
        c.drawPath(poly([(-500, 1300), (1600, 1260), (1600, 1380), (-500, 1430)]),
                   lin_paint(0, 1260, 0, 1430, [(0, (40, 40, 52), 1), (1, (26, 26, 34), 1)]))
        glow(c, 610, 900, 380, (180, 185, 230), 0.10)
        wayside_cross(c, 610, 1300, 1.0)
        # eyes in the bushes behind
        ea = ease(ramp(x.t, x.dur * 0.45, x.dur * 0.6))
        c.drawPath(fur_path(250, 1250, 170, 90, np.random.default_rng(3), spikes=40, jit=0.2), paint((11, 11, 15)))
        bl = 1.0 if (x.t % 2.9) < 0.1 else 0.0
        eyes_pair(c, 240, 1235, 6, a=ea, blink=bl)
    with layer(c, x, 0.95):
        fog(c, x, 1330, a=0.22, speed=16, seed=8, scale=1.3)


# ------------------------------------------------------------------ 5 face closeup
def face_closeup(c, x):
    x.push, x.focus = 0.10, (W / 2, 900)
    t_follow = x.wt("follows", x.dur * 0.6)
    look = ease(ramp(x.t, t_follow - 0.3, t_follow + 0.2))
    fl = flicker(x.T, 2)
    with layer(c, x, 0.0):
        c.drawRect(R(-400, -400, 1500, 2400), lin_paint(0, 0, 0, 1900, [(0, (12, 13, 20), 1), (1, (20, 18, 24), 1)]))
        forest_row(c, 1500, 14, 900, 1400, (17, 17, 24), seed=21)
        ea = ease(ramp(x.t, t_follow, t_follow + 0.8))
        eyes_pair(c, 900, 760, 7, a=ea * 0.9)
    with layer(c, x, 0.6):
        cx, cy, r = 520, 930, 250
        glow(c, 300, 1450, 900, LANTERN, 0.32 * fl)
        # coat / shoulders
        c.drawPath(smooth_path([(120, 1900), (170, 1350), (520, 1200), (880, 1350), (940, 1900)]),
                   lin_paint(150, 0, 900, 0, [(0, COAT, 1), (1, COAT_DARK, 1)]))
        c.drawRect(R(cx - 70, cy + 180, cx + 70, cy + 330), paint(SKIN_DARK))
        # head
        c.drawCircle(cx, cy, r, paint(SKIN_LIT))
        c.save()
        c.clipPath(skia.Path().addCircle(cx, cy, r), doAntiAlias=True)
        c.drawRect(R(cx + 10, cy - r - 10, cx + r + 10, cy + r + 10), paint(SKIN_DARK, 0.9))
        c.drawCircle(cx - 120, cy + 200, 260, rad_paint(cx - 120, cy + 200, 260, [(0, LANTERN, 0.35 * fl), (1, LANTERN, 0)]))
        c.restore()
        # ears
        c.drawOval(R(cx - r - 22, cy - 30, cx - r + 26, cy + 60), paint(SKIN_LIT))
        c.drawOval(R(cx + r - 26, cy - 30, cx + r + 22, cy + 60), paint(SKIN_DARK))
        # eyes
        for ex, shade in ((cx - 92, 1.0), (cx + 92, 0.6)):
            c.drawOval(R(ex - 34, cy - 30, ex + 34, cy + 8), paint(mix((235, 225, 210), SKIN_DARK, 1 - shade)))
            px = ex + look * 20
            c.drawCircle(px, cy - 11, 14, paint((24, 18, 16)))
            c.drawCircle(px - 4, cy - 15, 4, paint((255, 240, 220), 0.8 * shade))
            # worried brows
            c.drawLine(ex - 40, cy - 64 + (8 if ex < cx else -2) * look, ex + 36,
                       cy - 72 - (6 if ex < cx else -6) * look - 6, paint(HAT, stroke=12, cap_round=True))
        c.drawPath(poly([(cx, cy - 10), (cx - 26, cy + 70), (cx + 6, cy + 76)]), paint(SKIN_DARK, 0.5))
        c.drawLine(cx - 50, cy + 128, cx + 40, cy + 124 + 6 * look, paint((80, 46, 40), stroke=8, cap_round=True))
        # hat
        c.drawRRect(skia.RRect.MakeRectXY(R(cx - 210, cy - 350, cx + 200, cy - 170), 50, 50), paint(HAT))
        c.drawOval(R(cx - 360, cy - 200, cx + 370, cy - 140), paint(HAT))
        c.drawRect(R(cx - 220, cy - 210, cx + 210, cy - 175), paint((70, 36, 34)))


# ------------------------------------------------------------------ 6 jump (back view)
def _traveler_back(c, x, y, s, phase, burden=0.0, t=0.0):
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    lift = math.sin(phase)
    for side in (-1, 1):
        up = max(0, lift * side) * 22
        c.drawRect(R(side * 30 - 15, -150, side * 30 + 15, -up), paint((26, 23, 26)))
        c.drawOval(R(side * 30 - 17, -16 - up, side * 30 + 17, 6 - up), paint((18, 16, 17)))
    c.drawPath(smooth_path([(-62, -380), (62, -380), (82, -260), (88, -130), (-88, -130), (-82, -260)]),
               lin_paint(-90, 0, 90, 0, [(0, COAT_DARK, 1), (0.6, COAT, 1), (1, COAT_DARK, 1)]))
    c.drawRect(R(-14, -410, 14, -378), paint(SKIN_DARK))
    c.drawCircle(0, -428, 36, paint((40, 30, 28)))
    c.drawRRect(skia.RRect.MakeRectXY(R(-34, -490, 34, -444), 8, 8), paint(HAT))
    c.drawOval(R(-70, -456, 70, -436), paint(HAT))
    if burden > 0:
        beast_riding(c, 0, -380, 1.6, t=t, size=burden, rng_seed=5)
    c.restore()


def jump(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    tj = x.wt("jumps", x.dur * 0.6)
    x.shake = shake_amount(x.t, [tj + 0.18], strength=26)
    with layer(c, x, 0.0):
        sky(c, horizon=1050)
        stars(c, x, seed=6)
        moon(c, 300, 450, 90)
    with layer(c, x, 0.3):
        haze(c, 860, 1100, a=0.5)
        forest_row(c, 1050, 26, 110, 230, (22, 22, 32), seed=31, gap=(480, 600))
        c.drawRect(R(-500, 1050, 1600, 2600), paint((18, 18, 26)))
        road(c, W / 2, 1050, bottom_w=1600, top_w=30)
        forest_row(c, 1250, 9, 420, 700, (13, 13, 19), seed=32, x0=-400, x1=250)
        forest_row(c, 1250, 9, 420, 700, (13, 13, 19), seed=33, x0=840, x1=1500)
        c.drawRect(R(-500, 1250, 250, 2600), paint((13, 13, 19)))
        c.drawRect(R(840, 1250, 1600, 2600), paint((13, 13, 19)))
    with layer(c, x, 0.6):
        landed = x.t >= tj + 0.18
        _traveler_back(c, W / 2, 1560, 1.1, phase=x.T * 4.6, burden=1.0 if landed else 0.0, t=x.T)
        if not landed:
            # creature leaping from the right bushes
            k = ease(ramp(x.t, tj - 0.55, tj + 0.18))
            bx = 980 + (W / 2 - 980) * k
            by = 1250 - math.sin(k * math.pi) * 260 + (1560 - 1.1 * 380 - 1250) * k
            if k <= 0:
                eyes_pair(c, 960, 1220, 6, a=ease(ramp(x.t, 0.3, 1.2)))
            else:
                beast_riding(c, bx, by, 1.7, t=x.T, rng_seed=5)
        if landed:
            fl = max(0.0, 1 - (x.t - tj - 0.18) * 4)
            c.drawRect(R(-500, -500, 1600, 2600), paint(RED, 0.18 * fl))
    with layer(c, x, 0.95):
        fog(c, x, 1600, a=0.2, speed=24, seed=9, scale=1.5)


# ------------------------------------------------------------------ 7 claws
def claws(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    with layer(c, x, 0.0):
        sky(c, horizon=1300)
        stars(c, x, seed=7)
        moon(c, 820, 520, 110)
        forest_row(c, 1250, 20, 250, 500, (20, 20, 30), seed=41)
    with layer(c, x, 0.7):
        br = math.sin(x.T * 2.3) * 6
        # creature head peeking over left shoulder
        rng = np.random.default_rng(8)
        hd = fur_path(330, 980 + br, 150, 130, rng, spikes=36, jit=0.14)
        c.save(); c.translate(6, -4); c.drawPath(hd, paint(BEAST_RIM)); c.restore()
        c.drawPath(hd, paint(BEAST))
        for ex in (290, 380):
            glow(c, ex, 975 + br, 120, EYE, 0.5)
            c.drawOval(R(ex - 22, 963 + br, ex + 22, 987 + br), paint(EYE))
        # shoulders + back of head
        c.drawPath(smooth_path([(-120, 2000), (-60, 1360), (300, 1180), (540, 1150), (780, 1180),
                                (1140, 1360), (1200, 2000)]),
                   lin_paint(0, 1150, 0, 1900, [(0, COAT, 1), (1, COAT_DARK, 1)]))
        c.drawRect(R(470, 1020, 610, 1200), paint((40, 30, 28)))
        c.drawCircle(540, 940, 150, paint((36, 28, 27)))
        c.drawRRect(skia.RRect.MakeRectXY(R(410, 730, 670, 870), 40, 40), paint(HAT))
        c.drawOval(R(250, 820, 830, 900), paint(HAT))
        # long dark arms reaching over both shoulders
        for (ax, ay), (qx, qy), (hx2, hy2) in (((380, 1060), (330, 1080), (300, 1130)),
                                               ((600, 1030), (730, 1020), (790, 1110))):
            pth = skia.Path()
            pth.moveTo(ax, ay + br)
            pth.quadTo(qx, qy, hx2, hy2)
            c.drawPath(pth, paint(BEAST_RIM, stroke=50, cap_round=True))
            c.drawPath(pth, paint(BEAST, stroke=42, cap_round=True))
        # bony hands gripping both shoulders
        for hx, sgn in ((300, 1), (790, -1)):
            for k in range(4):
                fx = hx + sgn * (k * 34 - 50)
                pth = skia.Path()
                pth.moveTo(fx - sgn * 10, 1160 - 40)
                pth.cubicTo(fx, 1190, fx + sgn * 8, 1260, fx - sgn * 4, 1320 + k * 8)
                c.drawPath(pth, paint((44, 44, 54), stroke=17, cap_round=True))
                c.drawCircle(fx + sgn * 2, 1215, 9, paint((70, 70, 84)))
                c.drawPath(poly([(fx - 8, 1318 + k * 8), (fx + 8, 1318 + k * 8), (fx - sgn * 4, 1360 + k * 8)]),
                           paint((200, 196, 180)))
            c.drawPath(smooth_path([(hx - 80, 1120), (hx + 80, 1100), (hx + 70, 1180), (hx - 70, 1190)]),
                       paint(BEAST))


# ------------------------------------------------------------------ 8 footsteps
def footsteps(c, x):
    x.push, x.focus = 0.08, (W / 2, 1300)
    period = 0.95
    steps = [k * period + 0.35 for k in range(int(x.dur / period) + 2)]
    x.shake = shake_amount(x.t, [s for s in steps if s <= x.t], strength=8 + 8 * x.p, decay=9)
    n = int((x.t - 0.35) // period) if x.t > 0.35 else -1
    ph = ((x.t - 0.35) % period) / period if x.t > 0.35 else 0.0
    sink = min(1.0, 0.1 + 0.16 * max(n, 0))
    with layer(c, x, 0.5):
        # moonlit muddy road seen from above
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (24, 22, 28), 1), (0.35, (58, 54, 64), 1),
                                                                         (1, (30, 27, 31), 1)]))
        rng = np.random.default_rng(5)
        for i in range(60):
            yy = 100 + (i / 60) * 1800
            x0 = rng.uniform(-200, 1100)
            c.drawLine(x0, yy, x0 + rng.uniform(80, 400), yy + rng.uniform(-4, 4),
                       paint((24, 22, 26), 0.5, stroke=1.5 + i / 25))
        # puddles reflecting the moon
        c.drawOval(R(640, 1000, 900, 1040), paint((90, 92, 112), 0.5))
        c.drawOval(R(120, 1120, 330, 1160), paint((80, 82, 100), 0.4))
        # footprints leading back, getting deeper (darker) closer to us
        for k in range(5):
            fy = 900 + k * 95
            sx = (1 if k % 2 else -1) * (40 + k * 22)
            sz = 0.25 + k * 0.1
            c.drawOval(R(W / 2 + sx - 40 * sz, fy, W / 2 + sx + 40 * sz, fy + 95 * sz), paint((14, 12, 14), 0.5 + 0.1 * k))
        # big shadow of the thing on his back, cast forward on the road
        c.drawPath(fur_path(W / 2 + 40, 1060, 170 + 60 * x.p, 70 + 20 * x.p, np.random.default_rng(4), spikes=36,
                            jit=0.18), paint((12, 11, 14), 0.6, blur=8))
    with layer(c, x, 0.8):
        for side in (-1, 1):
            active = (n % 2 == (0 if side < 0 else 1)) or n < 0
            lift = 0.0 if active else math.sin(ph * math.pi) * 150
            bx = W / 2 + side * 190 + (0 if active else 30 * math.sin(ph * math.pi))
            by = 1620 - lift + sink * 50
            # trouser leg
            c.drawPath(poly([(bx - 80, by - 520), (bx + 80, by - 520), (bx + 66, by - 170), (bx - 66, by - 170)]),
                       lin_paint(bx - 70, 0, bx + 70, 0, [(0, (26, 23, 27), 1), (0.7, (48, 42, 46), 1), (1, (30, 26, 30), 1)]))
            # boot
            boot = smooth_path([(bx - 82, by - 230), (bx + 78, by - 236), (bx + 92, by - 60), (bx + 100, by + 10),
                                (bx - 100, by + 16), (bx - 92, by - 60)])
            c.drawPath(boot, lin_paint(bx - 100, 0, bx + 100, 0, [(0, (40, 28, 22), 1), (0.65, (88, 62, 44), 1),
                                                                  (1, (46, 32, 26), 1)]))
            c.drawRect(R(bx - 84, by - 236, bx + 80, by - 214), paint((30, 21, 17)))
            c.drawLine(bx - 60, by - 120, bx + 70, by - 124, paint((120, 90, 64), 0.4, stroke=3))
            if lift < 2:
                # mud swallowing the boot
                c.drawPath(smooth_path([(bx - 150, by - 10 - sink * 60), (bx, by - 30 - sink * 70),
                                        (bx + 150, by - 10 - sink * 60), (bx + 170, by + 70), (bx - 170, by + 70)]),
                           paint((34, 30, 34)))
        # coat hem hanging into frame from above + the beast's dangling claws
        c.drawRect(R(-500, -500, 1600, 700), lin_paint(0, 380, 0, 700, [(0, COAT_DARK, 1), (1, COAT_DARK, 0.0)]))
        c.drawPath(smooth_path([(-200, 260), (W / 2, 520), (1300, 260), (1300, -400), (-200, -400)]), paint((18, 15, 15)))
        for k in range(4):
            fx = 300 + k * 26 + math.sin(x.T * 2 + k) * 4
            c.drawLine(fx, 420, fx + 6, 760 + k * 10, paint((44, 44, 54), stroke=13, cap_round=True))
            c.drawPath(poly([(fx, 755 + k * 10), (fx + 14, 755 + k * 10), (fx + 8, 800 + k * 10)]), paint((200, 196, 180)))
        if n >= 0 and ph < 0.5:
            side = -1 if n % 2 == 0 else 1
            for k in range(7):
                ang = math.radians(-160 + k * 23)
                d = 60 + ph * 420
                px = W / 2 + side * 190 + math.cos(ang) * d
                py = 1600 + math.sin(ang) * d * 0.55 + (ph * 40) ** 2
                c.drawCircle(px, py, 9 - ph * 10, paint((40, 36, 40), 1 - ph * 2))


# ------------------------------------------------------------------ 9 collapse
def collapse(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    tc = x.wt("collapses", x.dur * 0.35)
    k = ease(ramp(x.t, tc, tc + 0.7))
    x.shake = shake_amount(x.t, [tc + 0.7], strength=16)
    with layer(c, x, 0.0):
        sky(c, horizon=1150)
        stars(c, x, seed=9)
        moon(c, 560, 830, 280, MOON_WARM)
    with layer(c, x, 0.3):
        haze(c, 1000, 1220, a=0.55)
        forest_row(c, 1170, 26, 130, 250, (26, 26, 38), seed=61)
        fog(c, x, 1150, a=0.3, speed=8, seed=10)
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1240, 1600, 2600), paint((14, 14, 20)))
        hills(c, 1240, 6, (14, 14, 20), seed=6)
        tx = 380 + 120 * min(x.t, tc) / max(tc, 0.1)
        hunch = 0.35 + 0.25 * k
        traveler(c, tx, 1245 + 10 * k, 0.95, phase=x.T * 2.4 * (1 - k), walking=k < 0.5, hunch=hunch, kneel=k,
                 silhouette=0.7, lantern_a=1 - k, flicker=flicker(x.T))
        # creature on back grows
        ang = math.radians(hunch * 38)
        hip = (tx, 1245 + 10 * k - 0.95 * (135 - k * 70))
        bx = hip[0] + math.sin(ang) * 0.95 * 230 - 30
        by = hip[1] - math.cos(ang) * 0.95 * 230 + 20
        beast_riding(c, bx, by, 0.95, t=x.T, size=1.25 + 0.35 * x.p)
        if k >= 1:
            glow(c, tx + 60, 1245, 180, (90, 80, 90), 0.2)
    with layer(c, x, 0.95):
        fog(c, x, 1330, a=0.22, speed=18, seed=11, scale=1.4)


# ------------------------------------------------------------------ 10 village + bells
def village_bells(c, x):
    x.push, x.focus = 0.12, (W * 0.62, 1000)
    tb = x.wt("bells", x.dur * 0.8)
    bell = ramp(x.t, tb - 0.1, tb + 0.1) * max(0.0, 1 - (x.t - tb) * 0.4)
    with layer(c, x, 0.0):
        sky(c, top=(14, 14, 24), mid=(36, 34, 58), haze=(96, 72, 90), horizon=1080)
        stars(c, x, seed=10)
        moon(c, 230, 380, 70)
    with layer(c, x, 0.3):
        haze(c, 900, 1120, (120, 90, 100), a=0.35)
        hills(c, 1060, 40, (28, 26, 38), seed=8)
        # village on the hill
        rng = np.random.default_rng(4)
        for i in range(9):
            hx = 520 + i * 52 + rng.uniform(-8, 8)
            hy = 1030 + abs(i - 4) * 6
            hw, hh = rng.uniform(36, 52), rng.uniform(30, 46)
            c.drawPath(poly([(hx - hw / 2, hy), (hx - hw / 2, hy - hh), (hx, hy - hh - 26), (hx + hw / 2, hy - hh),
                             (hx + hw / 2, hy)]), paint((20, 19, 28)))
            if rng.uniform() < 0.75:
                fl = 0.75 + 0.25 * math.sin(x.T * 3 + i)
                c.drawRect(R(hx - 6, hy - hh * 0.6, hx + 6, hy - hh * 0.6 + 10), paint(LANTERN, fl))
                glow(c, hx, hy - hh * 0.5, 40, LANTERN, 0.3 * fl)
        # church
        cx = 760
        c.drawRect(R(cx - 22, 900, cx + 22, 1040), paint((20, 19, 28)))
        c.drawPath(poly([(cx - 26, 902), (cx, 800), (cx + 26, 902)]), paint((20, 19, 28)))
        c.drawRect(R(cx - 8, 930, cx + 8, 950), paint(LANTERN, 0.5 + 0.5 * bell))
        glow(c, cx, 940, 120 + 260 * bell, LANTERN, 0.25 + 0.4 * bell)
        if bell > 0:
            for k in range(3):
                rr = 60 + ((x.t - tb) * 220 + k * 90) % 300
                c.drawCircle(cx, 940, rr, paint(CREAM, 0.18 * bell * (1 - rr / 360), stroke=2))
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1150, 1600, 2600), paint((16, 15, 22)))
        hills(c, 1150, 20, (16, 15, 22), seed=9)
        road(c, 700, 1070, bottom_w=900, top_w=8, color=(30, 28, 38))
        traveler(c, 380, 1300, 0.42, phase=x.T * 2.5, hunch=0.45, silhouette=0.85, flicker=flicker(x.T))
        beast_riding(c, 380 + 30, 1300 - 0.42 * 250, 0.42, t=x.T, size=1.4)
    with layer(c, x, 0.95):
        fog(c, x, 1300, a=0.2, speed=16, seed=12, scale=1.4)


# ------------------------------------------------------------------ 11 dawn
def dawn(c, x):
    x.push, x.focus = 0.10, (W / 2, 1100)
    tl = x.wt("lets", x.dur * 0.75)
    gone = ease(ramp(x.t, tl - 0.4, tl + 1.0))
    sun = ease(ramp(x.t, 0, x.dur))
    with layer(c, x, 0.0):
        c.drawRect(R(-400, -400, 1500, 1300), lin_paint(0, 0, 0, 1180, [
            (0, (24, 22, 42), 1), (0.45, (74, 52, 82), 1), (0.8, (176, 104, 98), 1), (1, (232, 158, 112), 1)]))
        moon(c, W / 2, 1180 - 120 * sun, 130, (255, 196, 140), glow=1.6, craters=False)
    with layer(c, x, 0.3):
        haze(c, 1060, 1240, (240, 170, 130), a=0.4)
        forest_row(c, 1190, 24, 110, 230, (40, 30, 46), seed=71, gap=(450, 640))
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1240, 1600, 2600), paint((22, 18, 26)))
        road(c, W / 2, 1185, bottom_w=1300, top_w=30, color=(50, 38, 50), edge=(120, 84, 86))
        traveler(c, W / 2 - 40, 1500, 0.75, walking=False, lantern=False, hunch=0.5 * (1 - gone),
                 silhouette=0.9)
        # creature dissolving into mist
        if gone < 1:
            beast_riding(c, W / 2 - 10, 1500 - 0.75 * 250 - 80 * gone, 0.75, t=x.T, size=1.4, alpha=1 - gone)
        rng = np.random.default_rng(2)
        for i in range(40):
            ph = rng.uniform(0, 1)
            py = 1280 - (x.t - tl + ph) * 120
            px = W / 2 + rng.normal(0, 40) + math.sin(x.T + i) * 10
            a = gone * (1 - gone * 0.6) * 0.6 * ramp(x.t, tl - 0.2, tl + 0.2)
            c.drawCircle(px, py, rng.uniform(2, 5), paint((30, 26, 34), a))


# ------------------------------------------------------------------ 12 interior
def interior(c, x):
    x.push, x.focus = 0.16, (420, 900)
    fl = flicker(x.T, 5)
    with layer(c, x, 0.2):
        c.drawRect(R(-400, -400, 1500, 2400), lin_paint(0, 0, 0, 1500, [(0, (30, 23, 21), 1), (1, (58, 42, 34), 1)]))
        for i in range(-3, 14):
            c.drawLine(i * 95, -400, i * 95, 1500, paint((24, 18, 17), 0.6, stroke=3))
        # window (right) with moon
        wx0, wx1 = 700, 960
        c.drawRect(R(wx0, 340, wx1, 700), paint((22, 24, 42)))
        moon(c, 860, 450, 34)
        c.drawRect(R((wx0 + wx1) / 2 - 5, 340, (wx0 + wx1) / 2 + 5, 700), paint((40, 30, 26)))
        c.drawRect(R(wx0, 515, wx1, 525), paint((40, 30, 26)))
        c.drawRect(R(wx0 - 10, 330, wx1 + 10, 710), paint((40, 30, 26), stroke=16))
        light_shaft(c, [(wx0, 700), (wx1, 700), (760, 1760), (300, 1700)], a=0.12)
        # the candle-cast shadow on the wall: a man... with something on his back
        sp = paint((12, 8, 8), 0.85 * fl, blur=3)
        c.save()
        c.translate(330 + 4 * math.sin(x.T * 9), 1500)
        c.scale(2.3, 2.3)
        shadow = skia.Path()
        shadow.addCircle(14, -262, 30)
        shadow.addRRect(skia.RRect.MakeRectXY(R(-46, -236, 54, -40), 34, 34))
        shadow.addRRect(skia.RRect.MakeRectXY(R(-24, -306, 52, -282), 6, 6))
        shadow.addOval(R(-40, -290, 70, -278))
        shadow.addPath(fur_path(-36, -276, 58, 54, np.random.default_rng(5), spikes=30, jit=0.2))
        shadow.addPath(poly([(-60, -310), (-80, -372), (-40, -318)]))
        shadow.addPath(poly([(-22, -322), (-6, -378), (6, -312)]))
        c.drawPath(shadow, sp)
        c.restore()
        ea = ease(ramp(x.t, x.dur * 0.5, x.dur * 0.7)) * 0.95
        eyes_pair(c, 236, 785, 7, a=ea, color=(225, 60, 50))
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1500, 1600, 2600), paint((28, 20, 18)))
        glow(c, 760, 1320, 760, LANTERN, 0.36 * fl)
        # table + candle
        c.drawRect(R(600, 1420, 1200, 1450), paint((60, 40, 30)))
        c.drawRect(R(640, 1450, 670, 1720), paint((40, 27, 22)))
        c.drawRect(R(1080, 1450, 1110, 1720), paint((40, 27, 22)))
        c.drawRect(R(770, 1340, 794, 1420), paint((226, 214, 190)))
        c.drawOval(R(774, 1300 - 8 * fl, 790, 1340), paint((255, 200, 120)))
        glow(c, 782, 1320, 150, (255, 210, 150), 0.6 * fl)
        # stool + the man, sitting with head bowed
        c.drawRect(R(380, 1500, 560, 1525), paint((50, 34, 27)))
        c.drawRect(R(395, 1525, 415, 1730), paint((36, 25, 21)))
        c.drawRect(R(525, 1525, 545, 1730), paint((36, 25, 21)))
        traveler(c, 470, 1720, 1.05, walking=False, lantern=False, hunch=0.35, kneel=0.8, silhouette=0.55)


# ------------------------------------------------------------------ 13 pov end
def pov_end(c, x):
    x.push, x.focus = 0.18, (W / 2, 1100)
    grow = ease(ramp(x.t, x.dur * 0.25, x.dur))
    with layer(c, x, 0.0):
        sky(c, horizon=1000)
        stars(c, x, seed=13)
        glow(c, W / 2, -200, 900, MOON, 0.25)
    with layer(c, x, 0.3):
        haze(c, 820, 1040, a=0.5)
        forest_row(c, 1000, 26, 120, 240, (22, 22, 32), seed=81, gap=(500, 580))
        c.drawRect(R(-500, 1000, 1600, 2600), paint((18, 18, 26)))
        road(c, W / 2, 1000, bottom_w=1800, top_w=24, color=(48, 48, 60), edge=(60, 60, 74))
        forest_row(c, 1300, 9, 500, 800, (13, 13, 19), seed=82, x0=-400, x1=180)
        forest_row(c, 1300, 9, 500, 800, (13, 13, 19), seed=83, x0=900, x1=1500)
        c.drawRect(R(-500, 1300, 180, 2600), paint((13, 13, 19)))
        c.drawRect(R(900, 1300, 1600, 2600), paint((13, 13, 19)))
    with layer(c, x, 0.7):
        # long shadow of the viewer on the road, with something growing on its back
        sw = math.sin(x.T * 3.2) * 6
        sp = paint((10, 10, 14), 0.85, blur=6)
        c.save()
        c.translate(W / 2 + sw, 2000)
        body = skia.Path()
        body.moveTo(-150, 0)
        body.lineTo(-48, -620)
        body.lineTo(48, -620)
        body.lineTo(150, 0)
        body.close()
        body.addOval(R(-40, -720, 40, -610))
        c.drawPath(body, sp)
        hump = fur_path(-30, -660 - 40 * grow, 40 + 70 * grow, 30 + 60 * grow, np.random.default_rng(9),
                        spikes=30, jit=0.2)
        c.drawPath(hump, paint((10, 10, 14), 0.85 * ramp(grow, 0, 0.1), blur=6))
        c.restore()


# ------------------------------------------------------------------ 14 eyes / reveal
def eyes_reveal(c, x):
    x.push, x.focus = 0.25, (W / 2, 800)
    tr = x.wt("don't", x.dur * 0.5) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((7, 7, 10)))
    if x.t < tr:
        bl = 1.0 if 0.9 < x.t < 1.02 else 0.0
        with layer(c, x, 0.6):
            eyes_pair(c, W / 2, 780, 11, a=ease(ramp(x.t, 0.2, 1.0)), blink=bl)
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=22)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        rng = np.random.default_rng(21)
        glow(c, W / 2, 1300, 900, (120, 120, 160), 0.18 * k)
        hd = fur_path(W / 2, 820, 360, 400, rng, spikes=60, jit=0.1)
        c.save(); c.translate(0, -8); c.drawPath(hd, paint(BEAST_RIM, k)); c.restore()
        c.drawPath(hd, paint((20, 20, 26), k))
        c.drawPath(poly([(W / 2 - 250, 560), (W / 2 - 360, 260), (W / 2 - 150, 520)]), paint((20, 20, 26), k))
        c.drawPath(poly([(W / 2 + 250, 560), (W / 2 + 360, 260), (W / 2 + 150, 520)]), paint((20, 20, 26), k))
        # face shading from below
        c.drawCircle(W / 2, 1100, 420, rad_paint(W / 2, 1100, 420, [(0, (70, 70, 90), 0.5 * k), (1, (70, 70, 90), 0)]))
        for ex in (W / 2 - 120, W / 2 + 120):
            glow(c, ex, 760, 200, EYE, 0.6 * k)
            c.drawOval(R(ex - 48, 732, ex + 48, 788), paint(EYE, k))
            c.drawOval(R(ex - 9, 736, ex + 9, 784), paint((30, 10, 10), k))
        mouth = smooth_path([(W / 2 - 200, 960), (W / 2, 930), (W / 2 + 200, 960), (W / 2 + 120, 1090),
                             (W / 2, 1120), (W / 2 - 120, 1090)])
        c.drawPath(mouth, paint((50, 8, 12), k))
        for i in range(9):
            tx = W / 2 - 180 + i * 45
            c.drawPath(poly([(tx - 16, 948), (tx + 16, 946), (tx, 1010 - abs(i - 4) * 5)]), paint((226, 218, 196), k))
            c.drawPath(poly([(tx - 14, 1100 - abs(i - 4) * 4), (tx + 14, 1100 - abs(i - 4) * 4), (tx, 1050)]),
                       paint((226, 218, 196), k))


SCENES = {f.__name__: f for f in (hook_road, forest_walk, title_creature, crossroads, face_closeup, jump,
                                  claws, footsteps, collapse, village_bells, dawn, interior, pov_end,
                                  eyes_reveal)}
