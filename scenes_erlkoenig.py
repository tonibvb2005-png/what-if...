"""Scenes + sounds for 'Der Erlkönig' (registers into scenes.SCENES / audio.SFX).

Motion rules: every movement is a monotonic function of local time; hooves/feet stay on the ground.
"""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, forest_row, hills, fog, glow, light_shaft, paint, lin_paint,
                 rad_paint, R, poly, smooth_path, mix, ease, ramp, shake_amount, fur_path, _limb, SIL, MOON, CREAM,
                 RED, LANTERN, SKIN, SKIN_DARK, COAT, COAT_DARK, HAT, SKY_TOP, SKY_MID, SKY_HAZE)

flicker = scenes.flicker
GHOST = (196, 208, 220)
ICE = (150, 210, 255)
HORSE = (24, 22, 26)
HORSE_RIM = (80, 84, 104)


# ================================================================== elements
def horse_rider(c, x, y, s, phase=0.0, T=0.0, boy_dead=False, rear=0.0, run=True):
    """Galloping horse with the father and the boy, side view facing right. Hooves at (x, y)."""
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    c.rotate(-rear * 22, -120, -60)
    bob = -abs(math.sin(phase)) * 14 if run else 0.0
    c.translate(0, bob)

    def leg(hx, off, colr, front):
        a = math.sin(phase + off) * (46 if run else 4)
        bend = max(0.0, math.cos(phase + off)) * (55 if run else 0) * (1 if front else -1)
        _limb(c, hx, -190, a, 84, a + bend, 92, 22, colr)

    far = (12, 11, 14)
    leg(118, 0.5, far, True)
    leg(-104, math.pi + 0.5, far, False)
    # tail + mane flowing back in the wind
    wind = math.sin(T * 7) * 10
    tail = skia.Path()
    tail.moveTo(-150, -236)
    tail.cubicTo(-220, -240 + wind, -270, -200 - wind, -320, -180 + wind)
    for off, colr in ((4, HORSE_RIM), (0, HORSE)):
        c.save()
        c.translate(-off, -off * 0.6)
        c.drawPath(tail, paint(colr, stroke=24, cap_round=True))
        c.drawOval(R(-160, -280, 150, -160), paint(colr))
        c.drawPath(poly([(90, -270), (170, -360), (205, -340), (150, -210)]), paint(colr))   # neck
        c.drawPath(poly([(165, -372), (205, -378), (262, -318), (250, -298), (196, -320)]), paint(colr))  # head
        c.drawPath(poly([(178, -372), (186, -404), (196, -374)]), paint(colr))                # ear
        c.restore()
    for k in range(6):
        mx = 100 + k * 14
        c.drawLine(mx, -270 - k * 15, mx - 50 - wind, -262 - k * 15 + wind * 0.5, paint((10, 10, 12), stroke=7,
                                                                                       cap_round=True))
    c.drawCircle(224, -340, 3, paint((200, 200, 210)))
    leg(132, 0.0, HORSE, True)
    leg(-90, math.pi, HORSE, False)
    # father: leaning forward, cloak billowing back
    flap = math.sin(T * 6) * 18
    c.drawPath(smooth_path([(-30, -420), (-150 - flap, -380), (-260 - flap, -300), (-160, -250), (-20, -270)]),
               paint((30, 24, 28)))
    c.drawPath(smooth_path([(-40, -270), (40, -270), (60, -380), (10, -440), (-40, -420)]), paint(COAT_DARK))
    c.drawCircle(30, -462, 28, paint(SKIN_DARK))
    c.drawRRect(skia.RRect.MakeRectXY(R(4, -510, 56, -478), 6, 6), paint(HAT))
    c.drawOval(R(-14, -486, 76, -472), paint(HAT))
    # the boy wrapped in the father's arms
    c.drawOval(R(30, -390, 120, -300), paint((44, 40, 52)))
    face = (170, 176, 186) if boy_dead else SKIN
    c.drawCircle(96, -392, 24, paint(face))
    c.drawLine(36, -360, 110, -330, paint(COAT_DARK, stroke=18, cap_round=True))
    if not boy_dead:
        c.drawCircle(108, -396, 3, paint((20, 16, 16)))
    c.restore()


def antler_crown(c, cx, cy, w, color=(150, 136, 96), seed=3):
    """Crown of thin, twisted antler branches."""
    rng = np.random.default_rng(seed)
    c.drawRect(R(cx - w / 2, cy - w * 0.08, cx + w / 2, cy + w * 0.04), paint(color))
    for k in range(7):
        bx = cx - w / 2 + w * (k + 0.5) / 7
        h_ = w * (0.55 + (0.35 if k in (1, 5) else 0) + rng.uniform(0, 0.2))
        tip = (bx + (k - 3) * w * 0.06, cy - h_)
        pth = skia.Path()
        pth.moveTo(bx, cy - w * 0.05)
        pth.quadTo(bx + rng.uniform(-1, 1) * w * 0.08, cy - h_ * 0.5, *tip)
        c.drawPath(pth, paint(color, stroke=w * 0.035, cap_round=True))
        mx, my = bx + (tip[0] - bx) * 0.6, cy - h_ * 0.6
        c.drawLine(mx, my, mx + (1 if k % 2 else -1) * w * 0.12, my - h_ * 0.25, paint(color, stroke=w * 0.025,
                                                                                          cap_round=True))


def erlking(c, x, by, s, a=1.0, T=0.0, cold=0.0, reach=0.0, blur=0.0):
    """Tall gaunt crowned figure with a shadowed face; ragged cloak dissolves into mist. (x, by) = ground."""
    if a <= 0:
        return
    c.save()
    c.translate(x, by)
    c.scale(s, s)
    c.saveLayer(None, paint(a=a))
    sway = math.sin(T * 0.9) * 8
    col = mix(GHOST, (70, 78, 96), 0.35 + cold * 0.4)
    glow(c, 0, -600, 380, mix(GHOST, ICE, cold), 0.16 + 0.2 * cold)
    rng = np.random.default_rng(7)
    pts = [(-34, -600), (34, -600), (70, -560), (96, -380), (150 + sway, -120)]
    for k in range(9):                                     # ragged hem
        f = k / 8
        pts.append((150 + sway - f * 300, -40 - (40 if k % 2 else 0) - rng.uniform(0, 30)))
    pts += [(-150 + sway, -120), (-96, -380), (-70, -560)]
    cloak = poly(pts)
    p = lin_paint(0, -600, 0, -20, [(0, col, 0.95), (0.55, col, 0.75), (1, col, 0.0)])
    if blur:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    c.drawPath(cloak, p)
    c.drawPath(poly([(-30, -600), (30, -600), (16, -380), (-16, -380)]), paint((20, 22, 30), 0.5))   # inner shadow
    if reach > 0:
        hx, hy = 60 + 260 * reach, -470 + 40 * reach
        c.drawLine(50, -540, hx, hy, paint(col, 0.9, stroke=18, cap_round=True))
        for k in range(5):
            ang = math.radians(-30 + k * 16)
            c.drawLine(hx, hy, hx + math.cos(ang) * 90, hy + math.sin(ang) * 90, paint(col, stroke=5, cap_round=True))
    # hood + shadowed long face, only the eyes glow
    c.drawPath(smooth_path([(-52, -600), (-48, -690), (0, -730), (48, -690), (52, -600), (0, -580)]), paint(col))
    c.drawPath(smooth_path([(-30, -606), (-30, -680), (0, -700), (30, -680), (30, -606), (0, -588)]), paint((12, 14, 20)))
    e = 0.45 + 0.55 * cold
    for ex in (-12, 12):
        glow(c, ex, -658, 30, ICE, 0.7 * e)
        c.drawOval(R(ex - 5, -662, ex + 5, -654), paint(mix(GHOST, ICE, 0.6), e))
    antler_crown(c, 0, -726, 90)
    c.restore()
    c.restore()


def ghost_girl(c, x, y, s, a, T, seed=0):
    rng = np.random.default_rng(seed)
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    c.saveLayer(None, paint(a=a))
    sway = math.sin(T * 2 + seed) * 20
    c.drawPath(smooth_path([(-14, -150), (14, -150), (40 + sway, -40), (60 + sway, 0), (-60 + sway, 0), (-40 + sway, -40)]),
               lin_paint(0, -150, 0, 0, [(0, GHOST, 0.8), (1, GHOST, 0.0)]))
    c.drawCircle(0, -170, 18, paint(GHOST))
    for k in range(6):
        c.drawLine(-6 + k * 2, -180, -30 - k * 6 + sway * 0.5, -120 + rng.uniform(-10, 10), paint(GHOST, 0.5, stroke=2))
    c.restore()
    c.restore()


def willow(c, x, by, s, T, face=0.0, seed=0):
    rng = np.random.default_rng(seed)
    c.save()
    c.translate(x, by)
    c.scale(s, s)
    c.drawPath(smooth_path([(-70, 0), (-50, -200), (-80, -330), (-20, -420), (40, -400), (70, -300), (50, -150), (80, 0)]),
               paint((22, 22, 28)))
    if face > 0:
        for ex in (-25, 25):
            c.drawOval(R(ex - 14, -300, ex + 14, -270), paint((4, 4, 6), face))
        c.drawPath(smooth_path([(-30, -220), (0, -230), (30, -220), (20, -170), (-20, -170)]), paint((4, 4, 6), face))
    wind = math.sin(T * 1.7 + seed) * 30
    for k in range(26):
        ang = -math.pi / 2 + rng.uniform(-1.4, 1.4)
        sx, sy = math.cos(ang) * 40, -400 + math.sin(ang) * 30
        ln = rng.uniform(220, 420)
        pth = skia.Path()
        pth.moveTo(sx, sy)
        pth.cubicTo(sx + (sx * 2.5), sy - 80, sx * 3 + wind, sy + ln * 0.5, sx * 2.5 + wind * 1.6, sy + ln)
        c.drawPath(pth, paint((18, 20, 26), 0.9, stroke=4))
    c.restore()


def pale_hand(c, ox, oy, tx, ty, w=40, T=0.0, a=1.0):
    """Long white arm from (ox, oy) to the hand at (tx, ty), fingers toward the target."""
    ang = math.atan2(ty - oy, tx - ox)
    c.drawLine(ox, oy, tx, ty, paint(GHOST, 0.85 * a, stroke=w, cap_round=True, blur=2))
    for k in range(5):
        fa = ang + math.radians(-28 + k * 14)
        ln = w * (2.6 + 0.6 * math.sin(T * 3 + k))
        c.drawLine(tx, ty, tx + math.cos(fa) * ln, ty + math.sin(fa) * ln, paint(GHOST, a, stroke=w * 0.22, cap_round=True))
    glow(c, tx, ty, w * 5, GHOST, 0.3 * a)


def mist_forest(c, x, ground=1250, seed=90, dark=0.0):
    sky(c, top=(8, 10, 16), mid=(20, 24, 34), haze=mix((50, 56, 70), (10, 10, 14), dark), horizon=ground)
    stars(c, x, seed=seed)
    haze(c, ground - 300, ground + 40, (90, 100, 120), a=0.5 * (1 - dark))
    forest_row(c, ground - 40, 26, 300, 520, (22, 24, 34), seed=seed + 1, wr=0.35)
    fog(c, x, ground - 120, a=0.35 * (1 - dark), speed=10, seed=seed % 7 + 1, color=(170, 180, 200), scale=1.3)
    c.drawRect(R(-500, ground, 1600, 2600), lin_paint(0, ground, 0, ground + 700, [(0, (26, 28, 36), 1), (1, (8, 8, 12), 1)]))


def scroll_trees(c, scroll, y, seed, color=(10, 10, 14), period=1700, n=8, hmin=600, hmax=1100):
    rng = np.random.default_rng(seed)
    xs = rng.uniform(0, period, n)
    hs = rng.uniform(hmin, hmax, n)
    ws = rng.uniform(40, 110, n)
    for x0, h_, w_ in zip(xs, hs, ws):
        px = (x0 - scroll) % period - 200
        c.drawRect(R(px - w_ / 2, y - h_, px + w_ / 2, y + 400), paint(color))


# ================================================================== scenes
def erl_hook(c, x):
    x.push, x.focus = 0.22, (W / 2, 1000)
    with layer(c, x, 0.0):
        mist_forest(c, x, ground=1250, seed=91)
        moon(c, 760, 380, 70)
        light_shaft(c, [(700, 0), (800, 0), (640, 1300), (420, 1300)], color=(170, 180, 210), a=0.12)
    with layer(c, x, 0.4):
        erlking(c, 560, 1260, 0.75, a=0.35 + 0.5 * ease(ramp(x.t, 0.5, x.dur)), T=x.T)
        fog(c, x, 1200, a=0.4, speed=14, seed=2, color=(170, 180, 200), scale=1.4)
    with layer(c, x, 0.85):
        for bx, w in ((80, 170), (1010, 200), (300, 60)):
            c.drawRect(R(bx - w / 2, -400, bx + w / 2, 2400), paint((6, 6, 9)))


def night_ride(c, x):
    x.push, x.focus = 0.08, (W / 2, 1100)
    scroll = x.t * 900
    with layer(c, x, 0.0):
        sky(c, top=(8, 10, 16), mid=(20, 24, 34), haze=(50, 56, 70), horizon=1250)
        stars(c, x, seed=92)
        moon(c, 760, 520, 120)
    with layer(c, x, 0.35):
        c.save()
        c.translate(-(scroll * 0.2) % 1600, 0)
        for k in (0, 1):
            c.save(); c.translate(k * 1600, 0)
            forest_row(c, 1250, 26, 220, 420, (20, 22, 32), seed=93, x0=-200, x1=1400)
            c.restore()
        c.restore()
        fog(c, x, 1230, a=0.35, speed=200, seed=3, color=(170, 180, 200))
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1250, 1600, 2600), lin_paint(0, 1250, 0, 1900, [(0, (30, 30, 40), 1), (1, (10, 10, 14), 1)]))
        horse_rider(c, 480, 1420, 1.15, phase=x.T * 13, T=x.T)
    with layer(c, x, 0.9):
        scroll_trees(c, scroll * 1.6, 1500, seed=94)


def title_erlking(c, x):
    x.push, x.focus = 0.16, (W / 2, 1000)
    te = x.wt("elf", x.dur * 0.75)
    fear = ease(ramp(x.t, te - 0.3, te + 0.3))
    with layer(c, x, 0.0):
        mist_forest(c, x, ground=1500, seed=95)
        erlking(c, 880, 1300, 0.6, a=0.6 * fear, T=x.T)
    with layer(c, x, 0.7):
        cx, cy = 430, 1060
        # father's cloak/arm wrapping the boy
        c.drawPath(smooth_path([(-200, 2000), (-100, 1250), (200, 1150), (700, 1300), (820, 2000)]), paint((30, 24, 28)))
        c.drawCircle(cx, cy, 230, paint(SKIN))
        c.save()
        c.clipPath(skia.Path().addCircle(cx, cy, 230), doAntiAlias=True)
        c.drawRect(R(cx - 260, cy - 260, cx - 20, cy + 260), paint(SKIN_DARK, 0.8))
        c.drawCircle(cx + 260, cy - 100, 300, rad_paint(cx + 260, cy - 100, 300, [(0, GHOST, 0.35 * fear), (1, GHOST, 0)]))
        c.restore()
        c.drawPath(smooth_path([(cx - 240, cy - 40), (cx - 200, cy - 230), (cx + 80, cy - 270), (cx + 240, cy - 120),
                                (cx + 120, cy - 170), (cx - 60, cy - 150)]), paint((50, 34, 26)))
        for ex in (cx - 50, cx + 110):
            ew = 34 + 10 * fear
            c.drawOval(R(ex - ew, cy - 24 - 8 * fear, ex + ew, cy + 18 + 8 * fear), paint((236, 230, 220)))
            c.drawCircle(ex + 18 + 6 * fear, cy - 4, 13 - 3 * fear, paint((20, 16, 14)))
        c.drawOval(R(cx + 10, cy + 110, cx + 70, cy + 130 + 40 * fear), paint((60, 20, 20)))
        c.drawRect(R(-500, 1500, 1600, 2600), paint((24, 20, 24)))


def crowned_shape(c, x):
    x.push, x.focus = 0.14, (W / 2, 1000)
    tl_ = x.wt("looks", x.dur * 0.6)
    tf = x.wt("fog", x.dur * 0.85)
    gone = ease(ramp(x.t, tl_, tf))
    with layer(c, x, 0.0):
        mist_forest(c, x, ground=1300, seed=96)
        moon(c, 300, 420, 70)
    with layer(c, x, 0.45):
        erlking(c, 600, 1330, 1.3, a=1 - gone, T=x.T, blur=30 * gone)
        fog(c, x, 1100, a=0.25 + 0.4 * gone, speed=12, seed=4, color=(170, 180, 200), scale=1.6)
    with layer(c, x, 0.85):
        for bx, w in ((90, 190), (1000, 160)):
            c.drawRect(R(bx - w / 2, -400, bx + w / 2, 2400), paint((6, 6, 9)))
        fog(c, x, 1400, a=0.3, speed=20, seed=5, color=(170, 180, 200), scale=1.4)


def sweet_voice(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    with layer(c, x, 0.0):
        mist_forest(c, x, ground=1300, seed=97)
        glow(c, W / 2, 1100, 700, (170, 210, 200), 0.18)
    with layer(c, x, 0.4):
        # the daughters dancing in a slow circle
        n = 5
        da = ease(ramp(x.t, x.dur * 0.35, x.dur * 0.7))
        for i in range(n):
            ang = x.t * 0.9 + i * 2 * math.pi / n
            gx = W / 2 + math.cos(ang) * 300
            gy = 1230 + math.sin(ang) * 60
            ghost_girl(c, gx, gy, 1.2 + 0.25 * math.sin(ang), a=0.55 * da, T=x.T, seed=i)
        fog(c, x, 1250, a=0.35, speed=8, seed=6, color=(170, 190, 200), scale=1.5)
    with layer(c, x, 0.8):
        k = ease(ramp(x.t, 0.2, x.dur * 0.6))
        pale_hand(c, 1300, 1900, 1300 - 520 * k, 1900 - 620 * k, w=46, T=x.T, a=0.9)


def reaching(c, x):
    x.push, x.focus = 0.16, (W / 2, 1000)
    tr = x.wt("reaching", x.dur * 0.7)
    k = ease(ramp(x.t, 0.0, tr)) * 0.6 + ease(ramp(x.t, tr - 0.1, tr + 0.3)) * 0.4
    with layer(c, x, 0.0):
        mist_forest(c, x, ground=1600, seed=98, dark=0.4)
    with layer(c, x, 0.7):
        # over the father's shoulder: the boy's face, white fingers creeping in
        c.drawPath(smooth_path([(-300, 2000), (-200, 1300), (300, 1150), (520, 1260), (560, 2000)]), paint((28, 22, 26)))
        bx, by = 560, 1080
        c.drawCircle(bx, by, 150, paint(SKIN))
        c.drawRect(R(bx - 160, by - 160, bx - 40, by + 160), paint(SKIN_DARK, 0.6))
        c.drawPath(smooth_path([(bx - 160, by - 30), (bx - 100, by - 160), (bx + 100, by - 170), (bx + 160, by - 40),
                                (bx + 60, by - 110)]), paint((50, 34, 26)))
        for ex in (bx - 20, bx + 80):
            c.drawOval(R(ex - 30, by - 20, ex + 30, by + 20), paint((236, 230, 220)))
            c.drawCircle(ex + 16, by, 10, paint((20, 16, 14)))
        c.drawOval(R(bx + 10, by + 70, bx + 60, by + 120), paint((60, 20, 20)))
        tx = 1350 - 600 * k
        pale_hand(c, 1500, 900, tx, by - 40, w=52, T=x.T)
    x.shake = shake_amount(x.t, [tr], strength=12)


def wind_willows(c, x):
    x.push, x.focus = 0.1, (W / 2, 1100)
    scroll = x.t * 650
    tf = x.wt("faster", x.dur * 0.85)
    with layer(c, x, 0.0):
        sky(c, top=(8, 10, 16), mid=(20, 24, 34), haze=(50, 56, 70), horizon=1300)
        moon(c, 760, 460, 90)
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1300, 1600, 2600), lin_paint(0, 1300, 0, 1900, [(0, (28, 28, 38), 1), (1, (8, 8, 12), 1)]))
        period = 1600
        for k, (x0, sc) in enumerate(((100, 1.3), (650, 1.1), (1150, 1.4))):
            px = (x0 - scroll * 0.7) % period - 250
            willow(c, px, 1320, sc, x.T, face=ease(ramp(x.t, 0.5, 2.0)), seed=k)
        speed = 13 + 7 * ease(ramp(x.t, tf - 0.4, tf + 0.4))
        horse_rider(c, 540, 1480, 0.9, phase=x.T * speed, T=x.T)
    with layer(c, x, 0.9):
        scroll_trees(c, scroll * 1.5, 1600, seed=99, n=5)
        fog(c, x, 1450, a=0.25, speed=160, seed=6, color=(170, 180, 200), scale=1.3)


def cold_voice(c, x):
    x.push, x.focus = 0.18, (W / 2, 800)
    tt = x.wt("take", x.dur * 0.85)
    cold = ease(ramp(x.t, 0.3, tt))
    with layer(c, x, 0.0):
        mist_forest(c, x, ground=1500, seed=100, dark=cold)
    with layer(c, x, 0.6):
        erlking(c, W / 2, 1950, 1.95, a=1.0, T=x.T, cold=cold)
        if x.t > tt:
            k = 1 - ramp(x.t, tt, tt + 0.6)
            glow(c, W / 2, 380, 400, ICE, 0.6 * k)
    x.shake = shake_amount(x.t, [tt], strength=16)


def hurting(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    th = x.wt("hurting", x.dur * 0.75)
    scroll = x.t * 1100
    grip = ease(ramp(x.t, 0.2, th))
    with layer(c, x, 0.0):
        sky(c, top=(6, 6, 10), mid=(16, 18, 26), haze=(40, 44, 56), horizon=1250)
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1250, 1600, 2600), lin_paint(0, 1250, 0, 1900, [(0, (24, 24, 32), 1), (1, (6, 6, 9), 1)]))
        fog(c, x, 1220, a=0.5, speed=300, seed=7, color=(150, 160, 190), scale=1.5)
        horse_rider(c, 520, 1450, 1.15, phase=x.T * 18, T=x.T, rear=0.3 * grip)
        # mist hands wrapping around the boy from behind
        for k in range(3):
            pale_hand(c, -200, 900 + k * 120, 520 + 1.15 * (60 + k * 20) * grip, 1450 - 1.15 * (360 - k * 10),
                      w=34, T=x.T + k, a=0.8 * grip)
    with layer(c, x, 0.9):
        scroll_trees(c, scroll * 1.6, 1600, seed=101, n=6)
    if x.t > th:
        k = ease(ramp(x.t, th, th + 0.1)) * (1 - ramp(x.t, th + 0.4, th + 0.9))
        c.drawRect(R(-500, -500, 1600, 2600), paint((140, 0, 0), 0.35 * k))
    x.shake = shake_amount(x.t, [th], strength=20)


def farm_arrival(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    with layer(c, x, 0.0):
        c.drawRect(R(-500, -500, 1600, 1400), lin_paint(0, 0, 0, 1250, [(0, (24, 28, 44), 1), (0.7, (70, 76, 100), 1),
                                                                         (1, (120, 116, 130), 1)]))
    with layer(c, x, 0.35):
        c.drawRect(R(-500, 1250, 1600, 2600), paint((30, 30, 38)))
        # farmhouse with one lit window
        c.drawRect(R(560, 900, 1000, 1250), paint((26, 24, 30)))
        c.drawPath(poly([(530, 900), (780, 720), (1030, 900)]), paint((20, 18, 22)))
        c.drawRect(R(820, 1000, 880, 1070), paint(LANTERN, 0.8 * flicker(x.T)))
        glow(c, 850, 1035, 150, LANTERN, 0.3)
        fog(c, x, 1220, a=0.3, speed=6, seed=8, color=(170, 180, 200), scale=1.4)
    with layer(c, x, 0.7):
        # the father standing, holding the still boy
        cx = 380
        c.drawPath(smooth_path([(cx - 120, 1800), (cx - 140, 1300), (cx - 60, 1100), (cx + 80, 1100), (cx + 140, 1300),
                                (cx + 120, 1800)]), paint((24, 20, 24)))
        c.drawCircle(cx + 10, 1040, 64, paint(SKIN_DARK))
        c.drawRRect(skia.RRect.MakeRectXY(R(cx - 50, 940, cx + 70, 1000), 10, 10), paint(HAT))
        c.drawOval(R(cx - 90, 984, cx + 110, 1010), paint(HAT))
        # boy lying across his arms, head hanging back, pale
        c.drawPath(smooth_path([(cx - 80, 1300), (cx + 220, 1280), (cx + 240, 1340), (cx - 80, 1370)]), paint((44, 40, 52)))
        c.drawCircle(cx + 280, 1330, 50, paint((170, 176, 186)))
        c.drawLine(cx + 40, 1370, cx + 60, 1520, paint((44, 40, 52), stroke=20, cap_round=True))
        c.drawLine(cx - 60, 1300, cx + 260, 1310, paint((24, 20, 24), stroke=36, cap_round=True))


def pov_trees(c, x):
    x.push, x.focus = 0.22, (W / 2, 900)
    k = ease(ramp(x.t, 0.4, x.dur))
    with layer(c, x, 0.2):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (18, 16, 20), 1), (1, (32, 26, 26), 1)]))
        wx0, wy0, wx1, wy1 = 260, 380, 820, 1180
        c.save()
        c.clipRect(R(wx0, wy0, wx1, wy1))
        mist_forest(c, x, ground=1150, seed=102)
        erlking(c, 600, 1150, 0.35 + 0.15 * k, a=0.25 + 0.6 * k, T=x.T)
        c.restore()
        c.drawRect(R(wx0, wy0, wx1, wy1), paint((30, 24, 22), stroke=26))
        c.drawRect(R((wx0 + wx1) / 2 - 7, wy0, (wx0 + wx1) / 2 + 7, wy1), paint((30, 24, 22)))
        c.drawRect(R(wx0, (wy0 + wy1) / 2 - 7, wx1, (wy0 + wy1) / 2 + 7), paint((30, 24, 22)))
        light_shaft(c, [(wx0, wy1), (wx1, wy1), (900, 1800), (200, 1800)], color=(170, 180, 210), a=0.09)
    with layer(c, x, 0.7):
        # child's bed in the foreground
        c.drawRect(R(-200, 1500, 900, 1640), paint((50, 36, 30)))
        c.drawPath(smooth_path([(-180, 1500), (100, 1430), (500, 1440), (880, 1500)]), paint((80, 84, 100)))
        c.drawCircle(80, 1440, 50, paint(SKIN))
        c.drawRect(R(-500, 1640, 1600, 2600), paint((20, 16, 16)))


def erl_reveal(c, x):
    x.push, x.focus = 0.25, (W / 2, 820)
    tr = x.wt("don't", 0.2) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((6, 6, 9)))
    if x.t < tr:
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=24)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        c.saveLayer(None, paint(a=k))
        cx = W / 2
        glow(c, cx, 700, 900, ICE, 0.16)
        rng = np.random.default_rng(4)
        for i in range(60):                                # long white hair
            hx = cx + rng.uniform(-300, 300)
            c.drawLine(hx, 420, hx + rng.uniform(-90, 90), 1500 + rng.uniform(-200, 200),
                       paint((170, 178, 190), rng.uniform(0.3, 0.7), stroke=rng.uniform(2, 5)))
        face = smooth_path([(cx - 170, 560), (cx, 500), (cx + 170, 560), (cx + 200, 720), (cx + 150, 900),
                            (cx + 110, 1100), (cx, 1220), (cx - 110, 1100), (cx - 150, 900), (cx - 200, 720)])
        c.drawPath(face, lin_paint(cx - 200, 500, cx + 200, 1220, [(0, (210, 220, 232), 1), (0.6, (130, 140, 160), 1),
                                                                    (1, (60, 66, 82), 1)]))
        c.save()
        c.clipPath(face, doAntiAlias=True)
        for sx in (-1, 1):                                 # hollow cheeks
            c.drawOval(R(cx + sx * 140 - 70, 840, cx + sx * 140 + 50, 1060), paint((20, 24, 36), 0.85, blur=24))
        c.restore()
        for ex in (cx - 85, cx + 85):                      # deep black sockets, pinprick eyes
            c.drawOval(R(ex - 66, 670, ex + 66, 800), paint((4, 4, 8), 0.97, blur=5))
            glow(c, ex, 735, 60, ICE, 0.85)
            c.drawCircle(ex, 735, 7, paint((235, 248, 255)))
        c.drawPath(poly([(cx - 10, 800), (cx + 10, 800), (cx + 22, 900), (cx - 22, 900)]), paint((70, 76, 92)))
        # far too wide mouth with needle teeth
        mouth = smooth_path([(cx - 200, 960), (cx, 1000), (cx + 200, 960), (cx + 120, 1060), (cx, 1090), (cx - 120, 1060)])
        c.drawPath(mouth, paint((10, 4, 8)))
        for i in range(17):
            tx = cx - 176 + i * 22
            top = 966 + abs(i - 8) * 1.5
            c.drawLine(tx, top, tx + 1, top + 34 - abs(i - 8) * 1.2, paint((226, 230, 236), stroke=4, cap_round=True))
            bot = 1072 - abs(i - 8) * 3
            c.drawLine(tx + 11, bot, tx + 12, bot - 28 + abs(i - 8), paint((226, 230, 236), stroke=4, cap_round=True))
        antler_crown(c, cx, 560, 420)
        # long, too-thin fingers on the glass
        for hx in (cx - 400, cx + 400):
            for f in range(5):
                x2 = hx + (f - 2) * 34
                c.drawLine(hx, 1200, x2, 980, paint((196, 206, 222), stroke=16, cap_round=True))
                c.drawLine(x2, 980, x2 + (f - 2) * 6, 760 + abs(f - 2) * 40, paint((196, 206, 222), stroke=12,
                                                                                   cap_round=True))
                c.drawCircle(x2, 980, 10, paint((170, 180, 198)))
        c.drawRect(R(30, 300, 1050, 1500), paint((30, 24, 22), stroke=40))
        c.drawLine(540, 300, 540, 1500, paint((30, 24, 22), stroke=26))
        c.drawRect(R(30, 300, 1050, 1500), paint((180, 200, 230), 0.06))
        c.restore()


for _f in (erl_hook, night_ride, title_erlking, crowned_shape, sweet_voice, reaching, wind_willows, cold_voice, hurting,
           farm_arrival, pov_trees, erl_reveal):
    scenes.SCENES[_f.__name__] = _f


# ================================================================== sounds
SR = audio.SR


def _noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def hoof():
    n = int(0.18 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 90 * t) * np.exp(-t * 35) + audio.filt(_noise(n, 3), "band", (200, 2000)) * np.exp(-t * 60) * 0.5) * 0.6


def gallop(t0, t1, rate=2.4):
    """three-beat gallop pattern: da-da-DUM"""
    hits = []
    k = t0
    while k < t1:
        for off, g in ((0.0, 0.6), (0.09, 0.7), (0.2, 1.0)):
            hits.append((k + off, g))
        k += 1 / rate
    return hits


def music_box(length, seed=1):
    """the Elf King's sweet, wrong-sounding lullaby (slow waltz)"""
    notes = [987.8, 1174.7, 1318.5, 1174.7, 987.8, 880.0, 987.8, 1046.5, 987.8, 880.0, 830.6, 880.0]
    n = int(length * SR)
    out = np.zeros(n, np.float32)
    k, i = 0.0, 0
    while k < length:
        f = notes[i % len(notes)] * (1 + 0.004 * math.sin(i))      # slightly out of tune
        ln = int(1.2 * SR)
        tt = np.arange(ln) / SR
        x = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2.01 * f * tt)) * np.exp(-tt * 3.5) * 0.25
        a = int(k * SR)
        b = min(n, a + ln)
        out[a:b] += x[: b - a]
        k += 0.42 if i % 3 else 0.5
        i += 1
    return audio.reverb(out, 0.55)


def ghost_choir(length, chord=(392.0, 466.2, 587.3), seed=2):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for f in chord:
        vib = 1 + 0.008 * np.sin(2 * np.pi * 5 * t + f)
        x += np.sin(2 * np.pi * np.cumsum(f * vib) / SR) * 0.12
        x += np.sin(2 * np.pi * np.cumsum(f * 2 * vib) / SR) * 0.03
    e = np.sin(np.pi * np.clip(t / length, 0, 1)) ** 0.8
    return audio.reverb(x * e, 0.6)


def wind_gust(length=3.0, seed=4):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = audio.filt(_noise(n, seed), "band", (300, 1600)) * np.sin(np.pi * t / length) ** 2 * 0.5
    return np.stack([x, np.roll(x, 2000)], 1)


def glass_tap():
    n = int(0.3 * SR)
    t = np.arange(n) / SR
    return sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in ((2100, 30), (3400, 40), (5200, 55))) * 0.25


def _at(s, word, frac=0.5):
    return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)


def _add_gallop(m, t0, t1, gain=0.6, rate=2.4, pan=0.0):
    for k, g in gallop(t0, t1, rate):
        m.add(k, hoof(), gain * g, pan=pan)


def _sfx_hook(m, s, tl):
    m.add(s["start"] + 0.5, ghost_choir(s["end"] - s["start"]), 0.6)
    _add_gallop(m, _at(s, "ride", 0.8) - 0.3, s["end"] + 0.4, gain=0.35)


def _sfx_ride(m, s, tl):
    _add_gallop(m, s["start"], s["end"], gain=0.7)
    m.add(s["start"], wind_gust(s["end"] - s["start"] + 0.5), 0.8)


def _sfx_title(m, s, tl):
    _add_gallop(m, s["start"], s["end"], gain=0.25)
    m.add(_at(s, "elf", 0.75) - 0.1, audio.sting(2.0), 0.9)


def _sfx_crowned(m, s, tl):
    tf = _at(s, "fog", 0.85)
    m.add(s["start"], ghost_choir(tf - s["start"] + 0.5, (293.7, 349.2, 440.0)), 0.8)
    return [(tf - 0.3, s["end"] + 0.1, 0.4)]


def _sfx_sweet(m, s, tl):
    m.add(s["start"] + 0.3, music_box(s["end"] - s["start"] + 1.0), 0.8)


def _sfx_reaching(m, s, tl):
    m.add(_at(s, "reaching", 0.7) - 0.15, audio.whoosh(0.6), 0.5)


def _sfx_willows(m, s, tl):
    tf = _at(s, "faster", 0.85)
    _add_gallop(m, s["start"], tf, gain=0.6)
    _add_gallop(m, tf, s["end"] + 0.2, gain=0.85, rate=3.2)
    m.add(s["start"], wind_gust(s["end"] - s["start"] + 0.4, 6), 1.0)


def _sfx_cold(m, s, tl):
    tt = _at(s, "take", 0.85)
    m.add(s["start"], ghost_choir(tt - s["start"], (277.2, 293.7, 415.3)), 0.8)
    m.add(tt, audio.hit(3.0), 0.9)


def _sfx_hurting(m, s, tl):
    _add_gallop(m, s["start"], s["end"], gain=0.9, rate=3.4)
    m.add(s["start"], wind_gust(s["end"] - s["start"] + 0.4, 8), 1.2)


def _sfx_farm(m, s, tl):
    return [(s["start"] + 0.5, s["end"], 0.3)]


def _sfx_pov(m, s, tl):
    mb = music_box(s["end"] - s["start"], seed=5)
    m.add(s["start"] + 0.4, np.stack([audio.filt(mb[:, 0], "low", 2500), audio.filt(mb[:, 1], "low", 2500)], 1), 0.45)


def _sfx_reveal(m, s, tl):
    tr = audio.reveal_time(tl)
    if tr is not None:
        for i in range(3):
            m.add(tr + 0.4 + i * 0.22, glass_tap(), 0.8)


audio.SFX.update({"erl_hook": _sfx_hook, "night_ride": _sfx_ride, "title_erlking": _sfx_title,
                  "crowned_shape": _sfx_crowned, "sweet_voice": _sfx_sweet, "reaching": _sfx_reaching,
                  "wind_willows": _sfx_willows, "cold_voice": _sfx_cold, "hurting": _sfx_hurting,
                  "farm_arrival": _sfx_farm, "pov_trees": _sfx_pov, "erl_reveal": _sfx_reveal})
