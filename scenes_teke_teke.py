"""Scenes + sounds for 'Teke Teke' (registers into scenes.SCENES / audio.SFX).

Kept implicit on purpose: no injuries are shown. She is a dark shape with long black hair,
seen from the waist up, her lower body always hidden in shadow/hair.
Motion rules: every movement is a monotonic function of local time; she stays on the ground.
Elbow slams are synced to every spoken "teke" (ctx.every["teke"]).
"""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, forest_row, fog, glow, light_shaft, paint, lin_paint, rad_paint,
                 R, poly, smooth_path, mix, ease, ramp, shake_amount, fur_path, traveler, SIL, MOON, CREAM, RED,
                 SKIN, SKIN_DARK)
from scenes_baba_yaga import snowfall

flicker = scenes.flicker
FLUO = (190, 230, 220)            # fluorescent tube light
VEND = (120, 200, 255)            # vending machine glow
PALE = (196, 196, 204)            # her skin
HAIR = (8, 8, 10)
CONCRETE = (52, 54, 60)
TACTILE = (176, 150, 50)          # yellow tactile paving


# ================================================================== elements
def tube_flicker(T, seed=0.0):
    """Fluorescent tube: mostly on, with nervous drop-outs."""
    v = math.sin(T * 23 + seed) * math.sin(T * 7.7 + seed * 2)
    return 0.35 if v > 0.93 else (0.75 if v > 0.85 else 1.0)


def teke(c, x, y, s, phase=0.0, facing=1, face=False, eye=0.0, T=0.0, head_up=0.0):
    """Crawling upper body on its elbows, side view facing right. (x, y) = ground under the elbows.
    The waist ends in shadow and hair; nothing below the waist is ever drawn."""
    c.save()
    c.translate(x, y)
    c.scale(s * facing, s)
    lift = (math.sin(phase) + 1) / 2
    # body lying low, raised on the arms
    c.drawPath(smooth_path([(-200, -40), (-60, -80 - 10 * lift), (40, -100 - 12 * lift), (70, -60), (-30, -26),
                            (-200, -10)]), paint((18, 18, 22)))
    c.drawOval(R(-260, -60, -120, 0), paint((0, 0, 0), 0.9, blur=18))       # waist fading into darkness
    # arms: shoulder -> elbow on ground -> hand reaching forward (alternating)
    for k, colr in ((0, mix(PALE, (0, 0, 0), 0.4)), (1, PALE)):
        ph = phase + k * math.pi
        reach = (math.sin(ph) + 1) / 2
        sx, sy = 40, -96 - 12 * lift
        ex, ey = 70 + 70 * reach, -6
        hx, hy = ex + 90, -4 - 30 * max(0.0, math.cos(ph))
        c.drawLine(sx, sy, ex, ey, paint(colr, stroke=20, cap_round=True))
        c.drawLine(ex, ey, hx, hy, paint(colr, stroke=16, cap_round=True))
        for f in range(4):
            c.drawLine(hx, hy, hx + 26, hy + 2 + f * 3, paint(colr, stroke=4, cap_round=True))
    # head + very long hair dragging on the ground
    hx_, hy_ = 96, -130 - 10 * lift - 60 * head_up
    c.drawPath(smooth_path([(hx_ - 50, hy_ - 20), (hx_, hy_ - 46), (hx_ + 46, hy_ - 10), (hx_ + 70, 0), (hx_ - 160, 4),
                            (hx_ - 200, -20)]), paint(HAIR))
    if face:
        c.drawCircle(hx_ + 20, hy_ + 4, 30, paint(PALE))
        c.drawPath(smooth_path([(hx_ - 10, hy_ - 30), (hx_ + 50, hy_ - 30), (hx_ + 52, hy_ + 40), (hx_ + 30, hy_ + 10),
                                (hx_, hy_ + 46)]), paint(HAIR))
    if eye > 0:
        glow(c, hx_ + 34, hy_ + 2, 40, (240, 240, 250), 0.5 * eye)
        c.drawCircle(hx_ + 34, hy_ + 2, 5, paint((250, 250, 255), eye))
    c.restore()


def claw_hand(c, x, y, ang, size, colr=PALE, nails=(30, 26, 30)):
    """Palm + splayed crooked fingers with dark nails. ang = direction the fingers point (radians)."""
    c.drawOval(R(x - size * 0.3, y - size * 0.26, x + size * 0.3, y + size * 0.26), paint(colr))
    for f in range(5):
        fa = ang + math.radians(-40 + f * 20) + (0.15 if f == 0 else 0)
        ln = size * (1.45 if f in (1, 2, 3) else 1.0)
        mx, my = x + math.cos(fa) * ln * 0.55, y + math.sin(fa) * ln * 0.55
        tx, ty = mx + math.cos(fa + 0.35) * ln * 0.5, my + math.sin(fa + 0.35) * ln * 0.5
        c.drawLine(x, y, mx, my, paint(colr, stroke=size * 0.16, cap_round=True))
        c.drawLine(mx, my, tx, ty, paint(colr, stroke=size * 0.13, cap_round=True))
        c.drawCircle(tx, ty, size * 0.06, paint(nails))


def platform(c, T, vy=1000, lit=1.0, snow=True):
    """Japanese station platform in perspective: concrete, yellow tactile strip, tracks on the right."""
    fl = tube_flicker(T) * lit
    c.drawRect(R(-500, -500, 1600, vy), lin_paint(0, 0, 0, vy, [(0, (6, 8, 12), 1), (1, (18, 22, 30), 1)]))
    # canopy roof + lamps
    c.drawPath(poly([(-300, 300), (W / 2 - 40, vy - 260), (W / 2 + 20, vy - 260), (1200, 260)]), paint((14, 16, 20)))
    for k in range(5):
        f = k / 5
        lx = W / 2 - 20 - (1 - f) ** 1.6 * 700
        ly = vy - 250 - (1 - f) ** 1.6 * 620
        ln = 20 + (1 - f) ** 1.6 * 180
        c.drawLine(lx - ln / 2, ly, lx + ln / 2, ly, paint(FLUO, fl, stroke=4 + (1 - f) * 10, cap_round=True))
        glow(c, lx, ly + 40, 120 + (1 - f) * 360, FLUO, 0.25 * fl)
    # platform floor
    c.drawPath(poly([(W / 2 - 60, vy), (W / 2 + 40, vy), (760, 2000), (-600, 2000)]),
               lin_paint(0, vy, 0, 1900, [(0, CONCRETE, 1), (1, (26, 26, 30), 1)]))
    c.drawPath(poly([(W / 2 + 10, vy), (W / 2 + 28, vy), (520, 2000), (380, 2000)]), paint(TACTILE, 0.85))
    # tracks
    c.drawPath(poly([(W / 2 + 40, vy), (W / 2 + 140, vy), (1700, 2000), (760, 2000)]), paint((16, 16, 18)))
    for rx in ((W / 2 + 70, 1000), (W / 2 + 115, 1500)):
        c.drawLine(rx[0], vy, rx[1], 2000, paint((90, 92, 100), stroke=6))
    if snow:
        c.drawPath(poly([(W / 2 - 60, vy), (W / 2 - 40, vy), (-300, 2000), (-600, 2000)]), paint((150, 160, 180), 0.25))


def vending(c, x, y, s, T):
    c.drawRect(R(x, y - 300 * s, x + 170 * s, y), paint((40, 60, 90)))
    c.drawRect(R(x + 14 * s, y - 280 * s, x + 156 * s, y - 120 * s), paint(VEND, 0.9))
    for r_ in range(3):
        for k in range(4):
            c.drawRect(R(x + (24 + k * 34) * s, y - (268 - r_ * 52) * s, x + (44 + k * 34) * s, y - (228 - r_ * 52) * s),
                       paint((230, 120 + 30 * k, 80 + 40 * r_)))
    glow(c, x + 85 * s, y - 200 * s, 380 * s, VEND, 0.35)


def drag_marks(c, x0, y0, x1, y1, a=0.5):
    c.drawLine(x0, y0, x1, y1, paint((20, 22, 30), a, stroke=26, blur=4, cap_round=True))


# ================================================================== scenes
def teke_hook(c, x):
    x.push, x.focus = 0.2, (W / 2, 1100)
    k = ease(ramp(x.t, 0.3, x.dur))
    with layer(c, x, 0.0):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (4, 5, 8), 1), (1, (14, 16, 22), 1)]))
    with layer(c, x, 0.5):
        # wet street under one streetlight
        c.drawRect(R(-500, 1150, 1600, 2600), lin_paint(0, 1150, 0, 1900, [(0, (22, 24, 30), 1), (1, (8, 8, 10), 1)]))
        c.drawLine(760, 300, 760, 1160, paint((30, 30, 34), stroke=18))
        c.drawLine(760, 310, 660, 310, paint((30, 30, 34), stroke=12))
        fl = tube_flicker(x.T, 1)
        c.drawOval(R(620, 300, 700, 330), paint((255, 230, 170), fl))
        light_shaft(c, [(630, 330), (690, 330), (900, 1500), (380, 1500)], color=(255, 230, 170), a=0.16 * fl)
        c.drawOval(R(330, 1380, 960, 1560), paint((255, 230, 170), 0.12 * fl))
        # something low coming out of the dark behind (left), on every "teke" it lurches closer
        lurch = sum(ease(ramp(x.t, tt - 0.05, tt + 0.2)) for tt in x.every.get("teke", []))
        tx = -120 + 70 * lurch + 140 * k
        teke(c, tx, 1520, 0.9, phase=x.T * 3, T=x.T, eye=0.6 * k)


def winter_station(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    hl = ease(ramp(x.t, x.dur * 0.6, x.dur))
    with layer(c, x, 0.2):
        platform(c, x.T)
        vending(c, 120, 1120, 1.0, x.T)
        # distant train headlight in the tunnel of darkness
        glow(c, W / 2 + 90, 990, 40 + 260 * hl, (255, 250, 220), 0.7 * hl)
    with layer(c, x, 0.55):
        # the young woman standing near the platform edge (silhouette, coat, long hair)
        cx, by = 520, 1420
        c.drawPath(smooth_path([(cx - 50, by), (cx - 46, by - 260), (cx - 26, by - 330), (cx + 26, by - 330),
                                (cx + 46, by - 260), (cx + 50, by)]), paint((16, 16, 20)))
        c.drawCircle(cx, by - 360, 34, paint(PALE))
        c.drawPath(smooth_path([(cx - 40, by - 380), (cx, by - 404), (cx + 40, by - 380), (cx + 44, by - 250),
                                (cx - 44, by - 250)]), paint(HAIR))
        c.drawRect(R(cx - 34, by, cx - 14, by + 4), paint((10, 10, 12)))
        snowfall(c, x.T, a=0.5)


def train_hit(c, x):
    x.push, x.focus = 0.1, (W / 2, 1000)
    tn = x.wt("never", 0.6)
    k = ease(ramp(x.t, 0.0, tn + 0.15))
    with layer(c, x, 0.2):
        platform(c, x.T, lit=0.6)
        # headlights rushing at us
        for dx in (-60, 60):
            gx = W / 2 + 90 + dx * (0.3 + 3 * k)
            glow(c, gx, 990 + 300 * k, 60 + 900 * k, (255, 250, 230), 0.8)
            c.drawCircle(gx, 990 + 300 * k, 6 + 60 * k, paint((255, 255, 240)))
    if x.t > tn:
        # the train roars past: white flash, then streaks of passing windows
        f = 1 - ramp(x.t, tn, tn + 0.35)
        c.drawRect(R(-500, -500, 1600, 2600), paint((255, 255, 255), 0.9 * f))
        rng = np.random.default_rng(1)
        for i in range(14):
            yy = rng.uniform(500, 1500)
            c.drawRect(R(-200, yy, 1400, yy + rng.uniform(6, 30)), paint((230, 240, 255), 0.25 * (1 - f)))
    x.shake = shake_amount(x.t, [tn], strength=28)


def frozen_crawl(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    with layer(c, x, 0.0):
        sky(c, top=(6, 8, 14), mid=(18, 22, 34), haze=(46, 52, 70), horizon=1000)
        stars(c, x, seed=111)
        moon(c, 800, 380, 70, MOON)
    with layer(c, x, 0.45):
        c.drawRect(R(-500, 1000, 1600, 2600), lin_paint(0, 1000, 0, 1900, [(0, (60, 66, 84), 1), (1, (16, 18, 24), 1)]))
        for rx0, rx1 in ((W / 2 - 30, 200), (W / 2 + 30, 880)):
            c.drawLine(rx0, 1000, rx1, 2000, paint((90, 96, 110), stroke=8))
        for i in range(14):
            yy = 1000 + (i / 14) ** 1.7 * 1000
            hw = 40 + (yy - 1000) * 0.45
            c.drawLine(W / 2 - hw, yy, W / 2 + hw, yy, paint((30, 26, 24), stroke=3 + i))
        # seen from behind: crawling away along the rails, leaving a furrow in the snow
        k = ramp(x.t, 0, x.dur)
        y = 1700 - 520 * k
        s = 1.3 - 0.85 * k
        drag_marks(c, W / 2, 2000, W / 2, y + 10, a=0.55)
        c.save()
        c.translate(W / 2, y)
        c.scale(s, s)
        c.drawOval(R(-80, -60, 80, 30), paint((14, 14, 18)))
        lift = (math.sin(x.T * 3) + 1) / 2
        for sgn, ph in ((-1, 0.0), (1, math.pi)):
            reach = (math.sin(x.T * 3 + ph) + 1) / 2
            c.drawLine(sgn * 50, -40, sgn * (90 + 20 * reach), -110 - 60 * reach, paint(PALE, stroke=18, cap_round=True))
        c.drawPath(smooth_path([(-70, -70 - 8 * lift), (0, -110), (70, -70 - 8 * lift), (60, 40), (-60, 40)]), paint(HAIR))
        c.restore()
        snowfall(c, x.T, a=0.55, seed=13)


def title_teke(c, x):
    x.push, x.focus = 0.16, (W / 2, 1150)
    with layer(c, x, 0.2):
        # underpass: tiled walls, one flickering tube
        c.drawRect(R(-500, -500, 1600, 2600), paint((10, 12, 14)))
        c.drawPath(poly([(-300, -100), (W / 2 - 80, 1000), (W / 2 + 80, 1000), (1400, -100)]), paint((40, 44, 46)))
        c.drawPath(poly([(-300, 2100), (W / 2 - 80, 1000), (W / 2 + 80, 1000), (1400, 2100)]), paint((30, 32, 34)))
        for i in range(10):
            yy = 1000 + (i / 10) ** 1.5 * 1000
            hw = 80 + (yy - 1000) * 1.1
            c.drawLine(W / 2 - hw, yy, W / 2 + hw, yy, paint((20, 22, 24), stroke=2 + i * 0.6))
        fl = tube_flicker(x.T, 3)
        c.drawLine(W / 2 - 160, 560, W / 2 + 160, 560, paint(FLUO, fl, stroke=12, cap_round=True))
        glow(c, W / 2, 700, 700, FLUO, 0.3 * fl)
    with layer(c, x, 0.6):
        k = ramp(x.t, 0, x.dur)
        y = 1120 + 420 * k
        s = 0.5 + 0.9 * k
        c.save()
        c.translate(W / 2, y)
        c.scale(s, s)
        # front view crawling toward us: hair curtain, two pale arms planting forward
        reach = (math.sin(x.T * 3) + 1) / 2
        for sgn, r_ in ((-1, reach), (1, 1 - reach)):
            ex_, ey_ = sgn * (170 + 40 * r_), 10 - 50 * r_
            c.drawLine(sgn * 60, -90, ex_, ey_, paint(PALE, stroke=38, cap_round=True))
            claw_hand(c, ex_ + sgn * 10, ey_ + 10, math.pi / 2 + sgn * 0.9, 60)
        c.drawPath(smooth_path([(-120, -40), (-90, -220), (0, -260), (90, -220), (120, -40), (90, 60), (-90, 60)]),
                   paint(HAIR))
        for i in range(12):
            hx = -110 + i * 20
            c.drawLine(hx, -200, hx + math.sin(i) * 14, 70 + (i % 3) * 20, paint(HAIR, stroke=7, cap_round=True))
        e = ease(ramp(x.t, 1.0, 2.0))
        glow(c, 18, -120, 40, (240, 240, 250), 0.6 * e)
        c.drawCircle(18, -120, 6, paint((250, 250, 255), e))
        c.restore()


def elbows(c, x):
    x.push, x.focus = 0.12, (W / 2, 1300)
    hits = x.every.get("teke", [])
    x.shake = shake_amount(x.t, [h for h in hits if h <= x.t], strength=16, decay=10)
    with layer(c, x, 0.3):
        # close to the floor: concrete + yellow tactile tiles
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (8, 9, 12), 1), (0.45, (40, 42, 48), 1),
                                                                         (1, (24, 24, 28), 1)]))
        for i in range(8):
            yy = 900 + i * 140
            c.drawRect(R(-500, yy, 1600, yy + 4), paint((14, 14, 16)))
        c.drawRect(R(560, 820, 900, 2200), paint(TACTILE, 0.7))
        for i in range(16):
            for j in range(4):
                c.drawCircle(600 + j * 80, 860 + i * 80, 14, paint((150, 126, 40)))
        fl = tube_flicker(x.T, 5)
        glow(c, W / 2, 300, 900, FLUO, 0.25 * fl)
    with layer(c, x, 0.7):
        # forearms slam down, one per "teke" (alternating), creeping forward each time
        n_hit = sum(1 for h in hits if h <= x.t)
        last = max([h for h in hits if h <= x.t], default=-1.0)
        since = x.t - last if last >= 0 else 9.0
        base = 1300 - 60 * n_hit
        for k, sgn in enumerate((-1, 1)):
            active = (n_hit % 2 == k)
            raise_ = 0.0 if not active else max(0.0, 1 - since * 4)
            ex = W / 2 + sgn * 220
            ey = base + (0 if active else 80)
            c.drawLine(ex + sgn * 260, ey + 520, ex, ey - 60 * raise_, paint(PALE, stroke=70, cap_round=True))
            c.drawLine(ex, ey - 60 * raise_, ex - sgn * 40, ey - 300 - 40 * raise_, paint(PALE, stroke=56, cap_round=True))
            claw_hand(c, ex - sgn * 40, ey - 330 - 40 * raise_, -math.pi / 2 - sgn * 0.25, 110)
            if active and since < 0.4:
                glow(c, ex, ey, 220, (180, 180, 190), 0.35 * (1 - since / 0.4))   # dust puff
        # her hair dragging between the arms
        c.drawPath(smooth_path([(W / 2 - 160, base + 600), (W / 2 - 120, base + 60), (W / 2, base - 40),
                                (W / 2 + 120, base + 60), (W / 2 + 160, base + 600)]), paint(HAIR))


def chase(c, x):
    x.push, x.focus = 0.1, (W / 2, 1200)
    tm = x.wt("much", x.dur * 0.7)
    scroll = x.t * 700
    with layer(c, x, 0.2):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (8, 10, 14), 1), (1, (20, 22, 28), 1)]))
        for k in range(6):                                  # lamps + pillars sliding past
            px = (k * 380 - scroll) % 2280 - 300
            fl = tube_flicker(x.T, k)
            c.drawRect(R(px - 18, 500, px + 18, 1420), paint((30, 32, 38)))
            c.drawLine(px - 90, 520, px + 90, 520, paint(FLUO, fl, stroke=8, cap_round=True))
            glow(c, px, 700, 380, FLUO, 0.22 * fl)
        c.drawRect(R(-500, 1420, 1600, 2600), paint(CONCRETE))
        c.drawRect(R(-500, 1440, 1600, 1470), paint(TACTILE, 0.7))
    with layer(c, x, 0.6):
        runner_x = 700
        traveler(c, runner_x, 1440, 0.95, phase=x.T * 11, lantern=False, silhouette=0.6, look=1.0)
        gap = 900 * (1 - ease(ramp(x.t, 0.2, tm + 0.3))) + 120
        teke(c, runner_x - gap, 1440, 1.0, phase=x.T * 14, T=x.T, eye=1.0)


def question(c, x):
    x.push, x.focus = 0.18, (W / 2, 1000)
    tl_ = x.wt("legs", x.dur * 0.85)
    rise = ease(ramp(x.t, 0.3, tl_ + 0.2))
    with layer(c, x, 0.3):
        c.drawRect(R(-500, -500, 1600, 2600), paint((6, 6, 8)))
        fl = tube_flicker(x.T, 7)
        glow(c, W / 2, 700, 700, FLUO, 0.22 * fl)
    with layer(c, x, 0.7):
        cx, cy = W / 2, 1600 - 650 * rise
        c.drawCircle(cx, cy, 210, paint(PALE))
        # hair parting slowly, one eye showing
        part = ease(ramp(x.t, tl_ - 0.5, tl_ + 0.2))
        c.drawPath(smooth_path([(cx - 260, cy - 120), (cx - 120, cy - 260), (cx + 80, cy - 250), (cx + 240, cy - 120),
                                (cx + 260, cy + 700), (cx + 60 + 60 * part, cy + 300), (cx + 40 + 80 * part, cy - 60),
                                (cx - 30, cy + 300), (cx - 260, cy + 700)]), paint(HAIR))
        if part > 0:
            ex, ey = cx + 90, cy - 20
            c.drawOval(R(ex - 40, ey - 22 * part, ex + 40, ey + 22 * part), paint((240, 240, 246)))
            c.drawCircle(ex, ey, 9 * part, paint((10, 10, 12)))
    x.shake = shake_amount(x.t, [tl_], strength=12)


def scythe(c, x):
    x.push, x.focus = 0.14, (W / 2, 1000)
    tj = x.wt("just", x.dur * 0.7)
    grow = ease(ramp(x.t, 0.1, tj))
    with layer(c, x, 0.3):
        # wall next to a vending machine, her shadow swelling over it
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (30, 34, 40), 1), (1, (14, 16, 20), 1)]))
        for i in range(12):
            c.drawLine(-500, 200 + i * 140, 1600, 200 + i * 140, paint((22, 24, 28), stroke=3))
        vending(c, 760, 1600, 1.6, x.T)
        c.save()
        c.translate(420, 1600)
        sc_ = 1.2 + 2.2 * grow
        c.scale(sc_, sc_)
        sh = skia.Path()
        sh.addPath(smooth_path([(-200, -10), (-60, -90), (40, -110), (130, -150), (170, -110), (140, -20), (-200, 0)]))
        sh.addPath(poly([(110, -20), (200, -60), (240, 0)]))
        c.drawPath(sh, paint((4, 4, 6), 0.85, blur=6))
        c.restore()
    if x.t > tj:
        k = ease(ramp(x.t, tj, tj + 0.1)) * (1 - ramp(x.t, tj + 0.4, tj + 0.9))
        c.drawRect(R(-500, -500, 1600, 2600), paint((140, 0, 0), 0.4 * k))
        x.shake = shake_amount(x.t, [tj], strength=18)


def pov_platform(c, x):
    x.push, x.focus = 0.2, (W / 2, 1100)
    creep = ease(ramp(x.t, x.dur * 0.35, x.dur))
    with layer(c, x, 0.2):
        platform(c, x.T, lit=0.8)
        glow(c, W / 2 + 90, 990, 70, (255, 250, 220), 0.5)          # the last train, still far away
    with layer(c, x, 0.8):
        # hair strands creeping into frame at the bottom edge, near your feet
        rng = np.random.default_rng(4)
        for i in range(40):
            hx = 300 + rng.uniform(0, 500)
            ln = (120 + rng.uniform(0, 260)) * creep
            c.drawLine(hx, 2000, hx + rng.uniform(-60, 60), 2000 - ln, paint(HAIR, 0.9, stroke=rng.uniform(4, 9),
                                                                           cap_round=True))
        for sgn in (-1, 1):
            c.drawLine(W / 2 + sgn * 300, 2100, W / 2 + sgn * 260, 2100 - 260 * creep, paint(PALE, 0.9 * creep,
                                                                                            stroke=40, cap_round=True))


def teke_reveal(c, x):
    x.push, x.focus = 0.25, (W / 2, 1000)
    tr = x.wt("don't", 0.2) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((5, 5, 7)))
    if x.t < tr:
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=24)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        c.saveLayer(None, paint(a=k))
        cx, cy = W / 2, 960
        rng = np.random.default_rng(9)
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (20, 22, 26), 1), (1, (40, 42, 48), 1)]))
        glow(c, cx, cy, 900, FLUO, 0.14)
        # wet hair spread around her head on the floor (thick wavy clumps)
        c.drawPath(fur_path(cx, cy + 40, 420, 520, rng, spikes=40, jit=0.25), paint(HAIR))
        for i in range(36):
            ang = rng.uniform(0, 2 * math.pi)
            r0, r1 = 300, rng.uniform(600, 1000)
            pth = skia.Path()
            pth.moveTo(cx + math.cos(ang) * r0, cy + math.sin(ang) * r0)
            wob = rng.uniform(-120, 120)
            pth.cubicTo(cx + math.cos(ang) * r0 * 1.6 + wob, cy + math.sin(ang) * r0 * 1.6 - wob,
                        cx + math.cos(ang) * r1 * 0.8 - wob, cy + math.sin(ang) * r1 * 0.8 + wob,
                        cx + math.cos(ang) * r1, cy + math.sin(ang) * r1)
            c.drawPath(pth, paint(HAIR, 0.95, stroke=rng.uniform(10, 26), cap_round=True))
        # long grey-blue face
        face = smooth_path([(cx - 150, cy - 220), (cx, cy - 270), (cx + 150, cy - 220), (cx + 190, cy - 40),
                            (cx + 160, cy + 160), (cx + 80, cy + 300), (cx, cy + 330), (cx - 80, cy + 300),
                            (cx - 160, cy + 160), (cx - 190, cy - 40)])
        c.drawPath(face, lin_paint(0, cy - 270, 0, cy + 330, [(0, (170, 178, 190), 1), (1, (120, 126, 140), 1)]))
        c.save()
        c.clipPath(face, doAntiAlias=True)
        for ex in (cx - 80, cx + 80):
            c.drawOval(R(ex - 80, cy - 110, ex + 80, cy + 40), paint((40, 40, 56), 0.7, blur=22))   # dark rings
        c.restore()
        # one huge bloodshot eye (the other hidden under hair)
        ex, ey = cx + 80, cy - 40
        c.drawOval(R(ex - 64, ey - 44, ex + 64, ey + 44), paint((236, 232, 228)))
        for i in range(8):
            a0 = rng.uniform(0, 2 * math.pi)
            c.drawLine(ex + math.cos(a0) * 60, ey + math.sin(a0) * 40, ex + math.cos(a0) * 22, ey + math.sin(a0) * 14,
                       paint((170, 30, 30), 0.8, stroke=2))
        c.drawCircle(ex, ey, 8, paint((4, 4, 6)))
        # mouth stretched far too long
        c.drawPath(smooth_path([(cx - 34, cy + 90), (cx, cy + 70), (cx + 34, cy + 90), (cx + 40, cy + 250),
                                (cx, cy + 290), (cx - 40, cy + 250)]), paint((10, 4, 6)))
        # wet strands across the face, one clump over the left eye
        c.drawPath(smooth_path([(cx - 190, cy - 230), (cx - 20, cy - 250), (cx - 10, cy + 40), (cx - 60, cy + 320),
                                (cx - 200, cy + 200)]), paint(HAIR))
        for i in range(14):
            hx = cx + rng.uniform(-150, 170)
            pth = skia.Path()
            pth.moveTo(hx, cy - 260)
            pth.cubicTo(hx + rng.uniform(-40, 40), cy - 80, hx + rng.uniform(-40, 40), cy + 120, hx + rng.uniform(-30, 30),
                        cy + rng.uniform(150, 330))
            c.drawPath(pth, paint(HAIR, 0.9, stroke=rng.uniform(4, 9), cap_round=True))
        # long fingers reaching up at you from both sides
        for sgn in (-1, 1):
            hx, hy = cx + sgn * 330, cy + 520
            c.drawLine(cx + sgn * 470, 2200, hx, hy, paint(PALE, stroke=70, cap_round=True))
            claw_hand(c, hx, hy - 40, -math.pi / 2 - sgn * 0.35, 190)
        c.restore()


for _f in (teke_hook, winter_station, train_hit, frozen_crawl, title_teke, elbows, chase, question, scythe, pov_platform,
           teke_reveal):
    scenes.SCENES[_f.__name__] = _f


# ================================================================== sounds
SR = audio.SR


def _noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def teke_hit(seed=0):
    """elbow slam + short scrape"""
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    thud = np.sin(2 * np.pi * (110 - 50 * t) * t) * np.exp(-t * 28) * 1.0
    knock = audio.filt(_noise(n, seed), "band", (700, 2500)) * np.exp(-t * 60) * 0.7
    scrape = audio.filt(_noise(n, seed + 1), "band", (1500, 5000)) * np.exp(-((t - 0.12) / 0.07) ** 2) * 0.45
    return audio.reverb(thud + knock + scrape, 0.3)


def fluo_hum(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = (np.sin(2 * np.pi * 100 * t) * 0.5 + np.sin(2 * np.pi * 200 * t) * 0.25 + np.sin(2 * np.pi * 300 * t) * 0.12) * 0.08
    x += audio.filt(_noise(n, 3), "band", (2000, 6000)) * 0.01
    return audio.stereo(x.astype(np.float32))


def crossing_bell(length, rate=1.6):
    """Japanese railroad crossing bell: kan-kan-kan"""
    n = int(length * SR)
    out = np.zeros(n, np.float32)
    k = 0.0
    while k < length:
        ln = int(0.5 * SR)
        tt = np.arange(ln) / SR
        x = (np.sin(2 * np.pi * 760 * tt) + 0.5 * np.sin(2 * np.pi * 1910 * tt)) * np.exp(-tt * 9) * 0.3
        a = int(k * SR)
        b = min(n, a + ln)
        out[a:b] += x[: b - a]
        k += 1 / rate
    return audio.reverb(out, 0.4)


def train_pass(length=4.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    env = np.exp(-((t - 0.6) / 0.9) ** 2)
    roar = audio.filt(_noise(n, 5), "low", 900) * env * 1.6
    clatter = np.zeros(n, np.float32)
    for k in np.arange(0.0, length, 0.12):
        i = int(k * SR)
        ln = min(int(0.05 * SR), n - i)
        if ln <= 16:
            break
        clatter[i:i + ln] += audio.filt(_noise(ln, i), "band", (300, 1800)) * np.exp(-np.arange(ln) / SR * 80)
    horn_t = t[: int(1.2 * SR)]
    horn = np.zeros(n, np.float32)
    h = (np.sign(np.sin(2 * np.pi * 311 * horn_t)) + np.sign(np.sin(2 * np.pi * 392 * horn_t))) * 0.15
    horn[: len(h)] = audio.filt(h, "low", 2500) * np.clip(horn_t / 0.05, 0, 1) * np.clip((1.2 - horn_t) / 0.2, 0, 1)
    out = roar + clatter * env * 1.2 + horn
    return np.stack([out * np.clip(1.5 - t / length * 2, 0, 1), out * np.clip(t / length * 2, 0, 1)], 1)


def run_steps(t0, t1, rate):
    k, out = t0, []
    while k < t1:
        out.append(k)
        k += 1 / rate
    return out


def _at(s, word, frac=0.5):
    return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)


def _teke_on_words(m, s, gain=0.9):
    for i, tt in enumerate(s.get("word_times", {}).get("teke", [])):
        m.add(s["start"] + tt - 0.02, teke_hit(i), gain, pan=-0.3)


def _sfx_hook(m, s, tl):
    _teke_on_words(m, s, 0.7)
    m.add(s["start"], fluo_hum(s["end"] - s["start"]), 0.8)


def _sfx_station(m, s, tl):
    m.add(s["start"], fluo_hum(s["end"] - s["start"] + 0.5), 0.8)
    m.add(s["start"] + (s["end"] - s["start"]) * 0.5, crossing_bell((s["end"] - s["start"]) * 0.5 + 2.0), 0.6)


def _sfx_train(m, s, tl):
    tn = _at(s, "never", 0.6)
    m.add(tn - 0.7, train_pass(4.0), 1.1)
    return [(tn + 0.6, s["end"] + 0.6, 0.3)]


def _sfx_crawl(m, s, tl):
    for i, k in enumerate(run_steps(s["start"] + 0.4, s["end"], 1.0)):
        m.add(k, teke_hit(10 + i), 0.3)


def _sfx_title(m, s, tl):
    _teke_on_words(m, s, 0.9)
    m.add(s["start"], fluo_hum(s["end"] - s["start"]), 1.0)


def _sfx_elbows(m, s, tl):
    _teke_on_words(m, s, 1.2)


def _sfx_chase(m, s, tl):
    for k in run_steps(s["start"], s["end"], 3.6):
        m.add(k, audio.footstep(0.0), 0.35, pan=0.2)
    for i, k in enumerate(run_steps(s["start"] + 0.1, s["end"], 6.0)):
        m.add(k, teke_hit(30 + i), 0.45, pan=-0.4)


def _sfx_question(m, s, tl):
    m.add(_at(s, "legs", 0.85) - 0.1, audio.sting(2.0), 0.9)
    return [(s["start"] + 0.2, s["end"], 0.4)]


def _sfx_shadow(m, s, tl):
    m.add(_at(s, "just", 0.7), audio.hit(2.5), 0.8)


def _sfx_pov(m, s, tl):
    m.add(s["start"], fluo_hum(s["end"] - s["start"]), 0.8)
    m.add(s["start"] + 0.3, crossing_bell(s["end"] - s["start"] - 0.5, rate=1.4), 0.35)
    for i, k in enumerate(run_steps(s["start"] + (s["end"] - s["start"]) * 0.4, s["end"] - 0.6, 1.6)):
        m.add(k, teke_hit(50 + i), 0.35 + 0.1 * i, pan=0.0)


audio.SFX.update({"teke_hook": _sfx_hook, "winter_station": _sfx_station, "train_hit": _sfx_train,
                  "frozen_crawl": _sfx_crawl, "title_teke": _sfx_title, "elbows": _sfx_elbows, "chase": _sfx_chase,
                  "question": _sfx_question, "scythe": _sfx_shadow, "pov_platform": _sfx_pov})
