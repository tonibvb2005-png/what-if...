"""Scenes + sounds for 'Black Shuck' (registers into scenes.SCENES / audio.SFX).

Motion rules: every movement is a monotonic function of the scene's local time (nothing loops
back), animals and people always stand on the ground of their scene.
"""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, forest_row, hills, road, fog, glow, light_shaft, paint,
                 lin_paint, rad_paint, R, poly, smooth_path, mix, ease, ramp, shake_amount, fur_path, font,
                 draw_text, _limb, traveler, SIL, GROUND, MOON, MOON_WARM, CREAM, RED, LANTERN, BEAST, BEAST_RIM,
                 SKY_TOP, SKY_MID, SKY_HAZE)
from scenes_rattenfaenger import town_row, TOWN

flicker = scenes.flicker
FIRE = (255, 92, 36)
STONE = (40, 40, 50)
WOOD = (62, 44, 32)


# ================================================================== elements
def dog(c, x, y, s, phase=0.0, walking=True, run=False, eyes=1.0, facing=1, T=0.0, seed=3, eye_color=FIRE,
        silhouette=True, body_col=None, rim_col=None, far_col=None, hooves=False):
    """Huge shaggy dog, side view facing right. Paws at (x, y), shoulder ~ 230*s.
    body_col/rim_col/far_col recolour it (e.g. the white Cadejo); hooves=True draws goat hooves."""
    body_col = body_col or BEAST
    rim_col = rim_col or BEAST_RIM
    rng = np.random.default_rng(seed)
    c.save()
    c.translate(x, y)
    c.scale(s * facing, s)
    amp = 38 if run else (22 if walking else 0)
    c.translate(0, -abs(math.sin(phase)) * (8 if run else 4) * (walking or run))

    def leg(hx, off, colr):
        a1 = math.sin(phase + off) * amp
        a2 = a1 - max(0.0, math.sin(phase + off)) * (34 if (walking or run) else 0)
        kx = hx + math.sin(math.radians(a1)) * 74
        ky = -150 + math.cos(math.radians(a1)) * 74
        fx = kx + math.sin(math.radians(a2)) * 78
        fy = ky + math.cos(math.radians(a2)) * 78
        c.drawPath(poly([(hx - 26, -170), (hx + 26, -170), (kx + 13, ky), (kx - 13, ky)]), paint(colr))
        c.drawCircle(kx, ky, 13, paint(colr))
        c.drawPath(poly([(kx - 12, ky), (kx + 12, ky), (fx + 9, fy), (fx - 9, fy)]), paint(colr))
        if hooves:
            c.drawPath(poly([(fx - 11, fy - 12), (fx + 13, fy - 12), (fx + 17, fy + 4), (fx - 13, fy + 4)]),
                       paint((34, 26, 22)))
            c.drawLine(fx + 2, fy - 6, fx + 2, fy + 4, paint((8, 6, 6), stroke=3))
        else:
            c.drawOval(R(fx - 12, fy - 10, fx + 26, fy + 4), paint(colr))

    far = far_col or (6, 6, 9)
    leg(92, math.pi, far)
    leg(-104, 0.0, far)
    sway = math.sin(T * 1.6) * 12
    body = fur_path(0, -172, 142, 58, rng, spikes=48, jit=0.12)
    chest = fur_path(108, -196, 60, 66, rng, spikes=26, jit=0.14)
    head = fur_path(172, -246, 50, 40, rng, spikes=24, jit=0.16)
    tail = skia.Path()
    tail.moveTo(-132, -190)
    tail.cubicTo(-200, -190 + sway, -236, -140 + sway, -232, -80 + sway)
    for off, colr in ((5, rim_col), (0, body_col)):
        c.save()
        c.translate(-off, -off * 0.7)
        for pth in (body, chest, head):
            c.drawPath(pth, paint(colr))
        c.drawPath(poly([(196, -264), (252, -248), (254, -226), (202, -216)]), paint(colr))
        c.drawPath(poly([(150, -272), (138, -322), (172, -282)]), paint(colr))
        c.drawPath(poly([(170, -280), (172, -326), (194, -282)]), paint(colr))
        c.drawPath(tail, paint(colr, stroke=26, cap_round=True))
        c.restore()
    leg(112, 0.0, body_col)
    leg(-86, math.pi, body_col)
    if eyes > 0:
        fl = 0.85 + 0.15 * math.sin(T * 17)
        glow(c, 200, -252, 70 * eyes, eye_color, 0.7 * eyes * fl)
        c.drawOval(R(190, -258, 210, -246), paint(mix(eye_color, (255, 230, 180), 0.4), eyes))
    c.restore()


def dog_head_front(c, cx, cy, s, eyes=1.0, snarl=0.0, T=0.0, seed=8, eye_color=FIRE):
    """Front view of the shaggy head (close-ups and the final jump scare)."""
    rng = np.random.default_rng(seed)
    c.save()
    c.translate(cx, cy)
    c.scale(s, s)
    head = fur_path(0, 0, 330, 300, rng, spikes=70, jit=0.1)
    c.save(); c.translate(0, -10); c.drawPath(head, paint(BEAST_RIM)); c.restore()
    c.drawPath(head, paint((14, 14, 18)))
    for sx in (-1, 1):
        c.drawPath(poly([(sx * 150, -230), (sx * 260, -470), (sx * 290, -160)]), paint((14, 14, 18)))
        c.drawPath(poly([(sx * 170, -230), (sx * 250, -400), (sx * 260, -190)]), paint((30, 24, 28)))
    # muzzle
    c.drawPath(smooth_path([(-130, 60), (0, 20), (130, 60), (110, 230), (0, 270), (-110, 230)]), paint((22, 22, 28)))
    c.drawOval(R(-50, 70, 50, 120), paint((8, 8, 10)))
    if snarl > 0:
        mouth = smooth_path([(-150, 200), (0, 180), (150, 200), (100, 300), (0, 330), (-100, 300)])
        c.drawPath(mouth, paint((60, 8, 12), snarl))
        for i in range(9):
            tx = -128 + i * 32
            ln = 50 if i in (1, 7) else 26
            c.drawPath(poly([(tx - 11, 196), (tx + 11, 196), (tx, 196 + ln)]), paint((226, 216, 196), snarl))
            c.drawPath(poly([(tx - 11, 310), (tx + 11, 310), (tx, 310 - ln * 0.7)]), paint((226, 216, 196), snarl))
    if eyes > 0:
        fl = 0.8 + 0.2 * math.sin(T * 19) * math.sin(T * 7)
        for ex in (-120, 120):
            glow(c, ex, -60, 220 * eyes, eye_color, 0.7 * eyes * fl)
            c.drawOval(R(ex - 46, -84, ex + 46, -36), paint(mix(eye_color, (255, 236, 180), 0.35), eyes))
            c.drawOval(R(ex - 8, -80, ex + 8, -40), paint((60, 8, 0), eyes))
            # little flames licking up from the eyes
            for k in range(3):
                fh = 40 + 30 * math.sin(T * 9 + k * 2 + ex)
                fx = ex - 24 + k * 24
                c.drawPath(poly([(fx - 10, -80), (fx + 10, -80), (fx + 3 * math.sin(T * 7 + k), -80 - fh * eyes)]),
                           paint(FIRE, 0.7 * eyes * fl))
    c.restore()


def lightning(c, t, strikes, x0=540, y_top=-50, y_bot=900, seed=1):
    """Draws bolts in the sky; returns current flash amount (0..1) for an overlay / shake."""
    flash = 0.0
    for i, ts in enumerate(strikes):
        d = t - ts
        if 0 <= d < 0.45:
            a = math.exp(-d * 9) * (1.0 if (d < 0.06 or 0.12 < d < 0.2) else 0.55)
            flash = max(flash, a)
            rng = np.random.default_rng(seed + i)
            x, y = x0 + rng.uniform(-260, 260), y_top
            pts = [(x, y)]
            while y < y_bot:
                y += rng.uniform(40, 90)
                x += rng.uniform(-60, 60)
                pts.append((x, y))
            pth = skia.Path()
            pth.moveTo(*pts[0])
            for q in pts[1:]:
                pth.lineTo(*q)
            c.drawPath(pth, paint((220, 220, 255), a * 0.5, stroke=14, blur=10, cap_round=True))
            c.drawPath(pth, paint((250, 250, 255), a, stroke=4, cap_round=True))
    return flash


def flash_overlay(c, a):
    if a > 0:
        c.drawRect(R(-500, -500, 1600, 2600), paint((200, 205, 235), 0.32 * a, blend=skia.BlendMode.kScreen))


def rain(c, T, a=0.3, n=170, seed=2):
    rng = np.random.default_rng(seed)
    for _ in range(n):
        x0 = rng.uniform(-300, 1400)
        y0 = rng.uniform(0, 2300)
        spd = rng.uniform(1300, 1800)
        yy = (y0 + T * spd) % 2300 - 200
        xx = x0 - yy * 0.22
        ln = rng.uniform(30, 60)
        c.drawLine(xx, yy, xx - ln * 0.22, yy + ln, paint((170, 180, 210), a * rng.uniform(0.5, 1), stroke=2))


def church_ext(c, x, by, s, color=STONE, rim=(70, 70, 90), lit=0.6, T=0.0, steeple_angle=0.0, steeple_drop=0.0,
               steeple=True):
    """Gothic church: nave + square tower (+ optional spire that can topple)."""
    c.save()
    c.translate(x, by)
    c.scale(s, s)
    for off, colr in ((4, rim), (0, color)):
        c.save()
        c.translate(-off, 0)
        p = paint(colr)
        c.drawRect(R(-360, -260, 120, 0), p)                         # nave
        c.drawPath(poly([(-380, -260), (-120, -400), (140, -260)]), p)
        c.drawRect(R(120, -560, 280, 0), p)                          # tower
        for k in range(4):
            c.drawRect(R(120 + k * 44, -590, 120 + k * 44 + 26, -560), p)
        c.restore()
    for k in range(4):                                               # lit gothic windows
        wx = -300 + k * 110
        fl = 0.8 + 0.2 * math.sin(T * 3 + k)
        win = skia.Path()
        win.moveTo(wx - 22, -60)
        win.lineTo(wx - 22, -170)
        win.arcTo(R(wx - 22, -200, wx + 22, -150), 180, 180, False)
        win.lineTo(wx + 22, -60)
        win.close()
        c.drawPath(win, paint(LANTERN, lit * fl))
        glow(c, wx, -120, 120, LANTERN, 0.25 * lit * fl)
    if steeple:
        c.save()
        c.translate(200, -590 + steeple_drop)
        c.rotate(steeple_angle)
        for off, colr in ((5, rim), (0, color)):
            c.save()
            c.translate(-off, 0)
            c.drawPath(poly([(-86, 0), (0, -330), (86, 0)]), paint(colr))
            c.drawLine(0, -330, 0, -380, paint(colr, stroke=8))
            c.drawLine(-18, -362, 18, -362, paint(colr, stroke=8))
            c.restore()
        c.restore()
    c.restore()


def church_inside(c, T, vp=(540, 860), candles=1.0, people=True, window=True):
    """Nave in perspective toward the altar."""
    vx, vy = vp
    c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (16, 14, 18), 1), (1, (30, 24, 24), 1)]))
    c.drawPath(poly([(vx - 120, vy + 120), (vx + 120, vy + 120), (1400, 2000), (-320, 2000)]),
               lin_paint(0, vy, 0, 1900, [(0, (40, 34, 34), 1), (1, (24, 20, 20), 1)]))
    if window:
        win = skia.Path()
        win.moveTo(vx - 70, vy - 40)
        win.lineTo(vx - 70, vy - 300)
        win.arcTo(R(vx - 70, vy - 370, vx + 70, vy - 230), 180, 180, False)
        win.lineTo(vx + 70, vy - 40)
        win.close()
        c.drawPath(win, lin_paint(0, vy - 370, 0, vy - 40, [(0, (70, 40, 70), 1), (0.5, (40, 50, 90), 1), (1, (90, 40, 40), 1)]))
        c.drawPath(win, paint((20, 18, 22), stroke=6))
        c.drawLine(vx, vy - 360, vx, vy - 40, paint((20, 18, 22), stroke=5))
    # altar + candles
    c.drawRect(R(vx - 110, vy + 40, vx + 110, vy + 120), paint((50, 40, 36)))
    fl = flicker(T, 2)
    for k in range(-2, 3):
        cx = vx + k * 40
        c.drawRect(R(cx - 4, vy + 6, cx + 4, vy + 40), paint((220, 210, 190)))
        if candles > 0:
            c.drawOval(R(cx - 4, vy - 12 - 2 * fl, cx + 4, vy + 6), paint((255, 200, 120), candles))
            glow(c, cx, vy - 4, 70, LANTERN, 0.45 * candles * fl)
    glow(c, vx, vy + 20, 520, LANTERN, 0.22 * candles * fl)
    # pillars + arches on both sides
    for side in (-1, 1):
        for k in range(5):
            f = (k + 1) / 5
            px = vx + side * (150 + f ** 1.5 * 720)
            top = vy - 220 - f ** 1.5 * 900
            bot = vy + 120 + f ** 1.5 * 900
            pw = 18 + f ** 1.5 * 90
            c.drawRect(R(px - pw / 2, top, px + pw / 2, bot), paint(mix(STONE, (0, 0, 0), 0.35 - 0.2 * f)))
    # pews with praying people (backs)
    for k in range(6):
        f = (k + 1) / 7
        yy = vy + 130 + f ** 1.5 * 800
        half = 150 + f ** 1.5 * 640
        ph = 26 + f ** 1.5 * 110
        for side in (-1, 1):
            x0 = vx + side * 40 * (0.6 + f)
            x1 = vx + side * half * 0.92
            c.drawRect(R(min(x0, x1), yy - ph, max(x0, x1), yy), paint((44, 30, 24)))
            if people:
                rng = np.random.default_rng(k * 2 + (side > 0))
                for j in range(3):
                    hx = x0 + (x1 - x0) * (0.25 + j * 0.27) + rng.uniform(-10, 10)
                    hr = 10 + f ** 1.5 * 34
                    c.drawCircle(hx, yy - ph - hr * 0.9, hr, paint((22, 18, 20)))
                    c.drawOval(R(hx - hr * 1.6, yy - ph - hr * 0.4, hx + hr * 1.6, yy - ph + hr * 1.2), paint((26, 20, 22)))


def kneeler(c, x, y, s, slump=0.0, tone=(30, 24, 26)):
    """Kneeling figure in prayer, side view facing right."""
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    c.drawPath(smooth_path([(-40, 0), (40, 0), (34, -40), (-10, -50), (-46, -30)]), paint(tone))
    c.rotate(slump * 55, -10, -50)
    c.drawPath(smooth_path([(-30, -50), (16, -52), (24, -130), (0, -150), (-28, -140), (-36, -90)]), paint(tone))
    c.drawCircle(8, -170, 22, paint(mix(tone, (120, 90, 80), 0.25)))
    c.drawLine(10, -120, 40, -150, paint(tone, stroke=12, cap_round=True))
    c.drawCircle(42, -152, 7, paint(mix(tone, (120, 90, 80), 0.25)))
    c.restore()


def wooden_door(c, x0, y0, x1, y1, light=0.5):
    c.drawRect(R(x0, y0, x1, y1), lin_paint(x0, 0, x1, 0, [(0, mix(WOOD, (0, 0, 0), 0.5), 1), (0.5, WOOD, 1),
                                                           (1, mix(WOOD, (0, 0, 0), 0.4), 1)]))
    n = 7
    for k in range(1, n):
        xx = x0 + (x1 - x0) * k / n
        c.drawLine(xx, y0, xx, y1, paint((30, 20, 14), 0.8, stroke=4))
    for yy in (y0 + (y1 - y0) * 0.2, y0 + (y1 - y0) * 0.75):
        c.drawRect(R(x0, yy - 12, x1 - 60, yy + 12), paint((28, 28, 32)))
        for k in range(8):
            c.drawCircle(x0 + 40 + k * (x1 - x0 - 120) / 7, yy, 5, paint((60, 60, 66)))
    c.drawRect(R(x0, y0, x1, y1), rad_paint((x0 + x1) / 2, (y0 + y1) / 2, (x1 - x0) * 0.8,
                                            [(0, (0, 0, 0), 0), (1, (0, 0, 0), 0.6 * (1 - light))]))


CLAWS = [[(380 + k * 70, 700 + k * 10), (420 + k * 72, 900 + k * 12), (440 + k * 74, 1150 + k * 12)] for k in range(4)]


def claw_marks(c, prog, heat=0.0, burnt=1.0, wear=0.0):
    """prog: how far the marks are drawn (0..1); heat: glowing ember amount; burnt: black scorch."""
    for k, pts in enumerate(CLAWS):
        p = max(0.0, min(1.0, prog * 1.25 - k * 0.08))
        if p <= 0:
            continue
        pth = skia.Path()
        pth.moveTo(*pts[0])
        mid, end = pts[1], pts[2]
        pth.quadTo(mid[0], mid[1], pts[0][0] + (end[0] - pts[0][0]) * p, pts[0][1] + (end[1] - pts[0][1]) * p)
        c.drawPath(pth, paint((14, 8, 6), 0.9 * burnt * (1 - 0.3 * wear), stroke=24, blur=3, cap_round=True))
        if heat > 0:
            c.drawPath(pth, paint(FIRE, heat, stroke=12, blur=2, cap_round=True))
            c.drawPath(pth, paint((255, 210, 140), heat * 0.8, stroke=4, cap_round=True))
            c.drawPath(pth, paint(FIRE, heat * 0.35, stroke=60, blur=24, cap_round=True))


def smoke(c, x, y, t, a=0.4, n=14, seed=1):
    rng = np.random.default_rng(seed)
    for i in range(n):
        ph = rng.uniform(0, 1)
        life = (ph + t * 0.35) % 1.0
        px = x + rng.normal(0, 30) + math.sin(t + i) * 20 * life
        py = y - life * 420
        c.drawCircle(px, py, 20 + life * 60, paint((90, 86, 90), a * (1 - life) * 0.5, blur=18))


# ================================================================== scenes
def shuck_road(c, x):
    x.push, x.focus = 0.22, (W / 2, 1000)
    near = ease(ramp(x.t, 0, x.dur))                  # eyes slowly come closer
    with layer(c, x, 0.0):
        sky(c, horizon=1060)
        stars(c, x, seed=51)
        moon(c, 820, 400, 85)
    with layer(c, x, 0.3):
        haze(c, 880, 1080, a=0.5)
        c.drawRect(R(-500, 1060, 1600, 2600), paint((16, 16, 22)))
        road(c, W / 2, 1060, bottom_w=1300, top_w=30)
        forest_row(c, 1070, 30, 60, 140, (20, 20, 30), seed=52, gap=(470, 610), wr=1.4)
        for side, sd in ((-1, 53), (1, 54)):                   # hedgerows
            x0, x1 = (-400, 380) if side < 0 else (700, 1500)
            c.drawPath(fur_path((x0 + x1) / 2, 1160, (x1 - x0) / 2, 120, np.random.default_rng(sd), spikes=60, jit=0.1),
                       paint((12, 13, 18)))
        ey = 1050 + 40 * near
        sz = 3 + 7 * near
        a = ease(ramp(x.t, 0.4, 1.4))
        for ex in (W / 2 - sz * 2.2, W / 2 + sz * 2.2):
            glow(c, ex, ey, sz * 9, FIRE, 0.6 * a)
            c.drawCircle(ex, ey, sz, paint((255, 170, 110), a))
    with layer(c, x, 0.9):
        fog(c, x, 1180, a=0.25, speed=12, seed=3, scale=1.3)


def coast_road(c, x):
    x.push, x.focus = 0.1, (W / 2, 1000)
    with layer(c, x, 0.0):
        sky(c, horizon=1050)
        stars(c, x, seed=55)
        moon(c, 760, 560, 120)
    with layer(c, x, 0.25):
        c.drawRect(R(-500, 1050, 1600, 2600), lin_paint(0, 1050, 0, 1500, [(0, (40, 44, 66), 1), (1, (18, 20, 30), 1)]))
        for i in range(16):
            yy = 1060 + i * 20
            wob = math.sin(x.T * 1.5 + i * 1.3) * 16
            c.drawLine(760 - 60 + i * 2 + wob, yy, 760 + 60 - i * 2 + wob, yy, paint(MOON, 0.4 - i * 0.02, stroke=4))
        # cliff with lighthouse (left), rotating beam
        c.drawPath(smooth_path([(-300, 1080), (120, 1000), (300, 1040), (420, 1120), (420, 1500), (-300, 1500)]),
                   paint((14, 14, 20)))
        c.drawPath(poly([(160, 1004), (196, 1004), (190, 830), (166, 830)]), paint((60, 58, 70)))
        c.drawRect(R(158, 806, 198, 832), paint((255, 230, 170)))
        ang = x.T * 1.4
        bx, by = 178, 818
        for sgn in (1, -1):
            ex = bx + math.cos(ang) * 900 * sgn
            ey = by + math.sin(ang) * 60
            light_shaft(c, [(bx, by - 6), (bx, by + 6), (ex, ey + 70), (ex, ey - 70)], color=(255, 236, 190),
                        a=0.14 * abs(math.cos(ang)))
        glow(c, bx, by, 120, (255, 230, 170), 0.5)
    with layer(c, x, 0.6):
        c.drawPath(smooth_path([(-300, 1260), (300, 1200), (700, 1230), (1400, 1180), (1400, 2600), (-300, 2600)]),
                   paint((18, 18, 24)))
        pth = skia.Path()
        pth.moveTo(-200, 1700)
        pth.cubicTo(300, 1500, 500, 1320, 900, 1250)
        c.drawPath(pth, paint((40, 40, 50), stroke=70))
        # reeds
        rng = np.random.default_rng(4)
        for i in range(90):
            rx = rng.uniform(-100, 1180)
            ry = 1260 + rng.uniform(0, 600)
            sway = math.sin(x.T * 1.3 + rx * 0.02) * 8
            c.drawLine(rx, ry, rx + sway, ry - rng.uniform(40, 120) * (ry / 1500),
                       paint((10, 10, 14), stroke=2 + ry / 900))
        # tiny dog standing far along the road, just eyes catching the light
        dog(c, 860, 1252, 0.18, walking=False, T=x.T, eyes=ease(ramp(x.t, 1.0, 2.0)))
    with layer(c, x, 0.95):
        fog(c, x, 1300, a=0.2, speed=14, seed=4, scale=1.4)


def title_shuck(c, x):
    x.push, x.focus = 0.16, (W / 2, 1100)
    with layer(c, x, 0.0):
        sky(c, horizon=1250)
        stars(c, x, seed=56)
        moon(c, 560, 900, 270, MOON)
    with layer(c, x, 0.3):
        haze(c, 1050, 1280, a=0.55)
        church_ext(c, 900, 1230, 0.55, color=(22, 22, 32), rim=(22, 22, 32), lit=0.3, T=x.T)
        forest_row(c, 1240, 14, 120, 240, (20, 20, 30), seed=57, x0=-200, x1=560)
    with layer(c, x, 0.55):
        # churchyard wall + gravestones
        c.drawRect(R(-500, 1240, 1600, 2600), paint((14, 14, 20)))
        c.drawRect(R(-500, 1150, 1600, 1250), paint((26, 26, 34)))
        for k in range(30):
            c.drawLine(-500 + k * 70, 1150, -500 + k * 70, 1250, paint((16, 16, 22), stroke=3))
        for gx in (120, 200, 820, 930):
            c.drawRRect(skia.RRect.MakeRectXY(R(gx - 26, 1080, gx + 26, 1160), 24, 24), paint((22, 22, 30)))
        dog(c, 430, 1152, 1.15, walking=False, T=x.T, eyes=ease(ramp(x.t, 0.3, 1.2)))
    with layer(c, x, 0.95):
        fog(c, x, 1320, a=0.25, speed=18, seed=5, scale=1.4)


def shuck_closeup(c, x):
    x.push, x.focus = 0.12, (W / 2, 900)
    tf = x.wt("fire", x.dur * 0.85)
    ignite = ease(ramp(x.t, tf - 0.3, tf + 0.3))
    with layer(c, x, 0.0):
        sky(c, horizon=1500)
        stars(c, x, seed=58)
        moon(c, 880, 300, 80)
    with layer(c, x, 0.7):
        breathe = math.sin(x.T * 1.8) * 6
        dog_head_front(c, W / 2, 900 + breathe, 1.25, eyes=0.08 + 0.92 * ignite, T=x.T)
        if ignite > 0:
            flash_overlay(c, max(0.0, 1 - (x.t - tf) * 4) * 0.6)


def walk_beside(c, x):
    x.push, x.focus = 0.08, (W / 2, 1100)
    tq = x.wt("footsteps", x.dur * 0.7)
    scroll = x.t * 160                                # world moves left -> walkers stay centred
    with layer(c, x, 0.0):
        sky(c, horizon=1150)
        stars(c, x, seed=59)
        moon(c, 300, 600, 110)
    with layer(c, x, 0.3):
        haze(c, 1000, 1200, a=0.5)
        c.save()
        c.translate(-(scroll * 0.3) % 1600, 0)
        for k in (0, 1):
            c.save(); c.translate(k * 1600, 0)
            forest_row(c, 1170, 18, 120, 230, (24, 24, 36), seed=60, x0=-200, x1=1400)
            c.restore()
        c.restore()
    with layer(c, x, 0.55):
        c.drawRect(R(-500, 1250, 1600, 2600), paint((14, 14, 20)))
        c.drawRect(R(-500, 1250, 1600, 1300), paint((36, 36, 46)))
        # fence posts sliding by (continuous scroll)
        for k in range(12):
            px = (k * 160 - scroll) % 1920 - 200
            c.drawRect(R(px - 7, 1180, px + 7, 1280), paint((20, 20, 26)))
            c.drawLine(px - 80, 1210, px + 80, 1214, paint((20, 20, 26), stroke=5))
        dog(c, 560, 1262, 1.05, phase=x.T * 4.2, T=x.T, eyes=1.0, seed=4)
        traveler(c, 470, 1300, 0.95, phase=x.T * 4.2, silhouette=0.35, flicker=flicker(x.T))
        # 'no footsteps': everything goes still and dark around them
        dim = ease(ramp(x.t, tq - 0.2, tq + 0.6))
        c.drawRect(R(-500, -500, 1600, 2600), paint((0, 0, 0), 0.35 * dim))


def storm_town(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    ts = x.wt("storm", x.dur * 0.7)
    strikes = [0.6, ts - 0.05, ts + 1.4]
    with layer(c, x, 0.0):
        sky(c, top=(10, 10, 16), mid=(24, 24, 36), haze=(44, 44, 58), horizon=1100)
        fl = lightning(c, x.t, strikes, x0=700, y_bot=1000, seed=3)
    with layer(c, x, 0.35):
        town_row(c, 1120, -200, 1300, TOWN, seed=61, hmin=120, hmax=220, lit=0.55, T=x.T)
        church_ext(c, 600, 1130, 0.6, color=(22, 21, 30), rim=(50, 50, 70), lit=0.8, T=x.T, steeple=False)
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1140, 1600, 2600), lin_paint(0, 1140, 0, 1700, [(0, (34, 34, 44), 1), (1, (16, 16, 22), 1)]))
        for i in range(4):                                      # people running to the church door
            k = ramp(x.t, 0.3 + i * 0.6, x.dur)
            px = (120 + i * 70) + (640 - (120 + i * 70)) * k
            if k < 0.97:
                traveler(c, px, 1250 - k * 90, 0.3 - k * 0.1, phase=x.T * 9 + i, silhouette=0.95, lantern=i == 0,
                         flicker=flicker(x.T))
        rain(c, x.T, a=0.3)
    x.shake = shake_amount(x.t, [ts], strength=10)
    flash_overlay(c, fl)


def church_doors(c, x):
    x.push, x.focus = 0.14, (W / 2, 1000)
    tf = x.wt("flew", x.dur * 0.8)
    o = ease(ramp(x.t, tf - 0.1, tf + 0.25))
    fl = 0.0
    with layer(c, x, 0.4):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (14, 12, 16), 1), (1, (28, 22, 22), 1)]))
        # the doorway: storm outside, revealed when the doors open
        dx0, dy0, dx1, dy1 = 300, 560, 780, 1300
        c.save()
        c.clipRect(R(dx0, dy0, dx1, dy1))
        c.drawRect(R(dx0, dy0, dx1, dy1), paint((40, 44, 70)))
        fl = lightning(c, x.t, [tf + 0.02, tf + 0.9], x0=540, y_top=dy0 - 50, y_bot=1100, seed=11)
        c.drawRect(R(dx0, 1150, dx1, dy1), paint((16, 16, 22)))
        if o > 0:
            dog(c, 520, 1300, 1.0, walking=False, T=x.T, eyes=o, facing=-1)
        c.restore()
        arch = skia.Path()
        arch.moveTo(dx0 - 40, dy1)
        arch.lineTo(dx0 - 40, dy0 + 120)
        arch.arcTo(R(dx0 - 40, dy0 - 160, dx1 + 40, dy0 + 280), 180, 180, False)
        arch.lineTo(dx1 + 40, dy1)
        c.drawPath(arch, paint(STONE, stroke=60))
        # two door leaves swinging inward (narrowing toward the hinges)
        lw = (dx1 - dx0) / 2 * (1 - 0.85 * o)
        wooden_door(c, dx0, dy0, dx0 + lw, dy1, light=0.3)
        wooden_door(c, dx1 - lw, dy0, dx1, dy1, light=0.3)
        glow(c, 540, 900, 600, (180, 190, 240), 0.35 * o)
    with layer(c, x, 0.8):
        # praying people in the foreground pews (backs)
        for k, (px, py, sc) in enumerate(((150, 1700, 2.4), (420, 1760, 2.6), (720, 1720, 2.5), (980, 1760, 2.6))):
            c.save()
            c.translate(px, py)
            c.scale(sc, sc)
            turn = o * (0.4 if k % 2 else -0.4)
            c.drawCircle(turn * 30, -150, 34, paint((18, 15, 16)))
            c.drawOval(R(-70, -120, 70, 40), paint((22, 18, 18)))
            c.restore()
        c.drawRect(R(-500, 1720, 1600, 1800), paint((40, 28, 22)))
        c.drawRect(R(-500, 1800, 1600, 2600), paint((20, 16, 14)))
        for k in range(3):
            cx = 200 + k * 340
            c.drawRect(R(cx - 6, 1640, cx + 6, 1720), paint((220, 210, 190)))
            blow = max(0.0, 1 - o * 1.2)
            c.drawOval(R(cx - 6 + 10 * o, 1610 - 4 * flicker(x.T, k), cx + 6 + 14 * o, 1640),
                       paint((255, 200, 120), blow))
            glow(c, cx, 1625, 120, LANTERN, 0.5 * blow * flicker(x.T, k))
    x.shake = shake_amount(x.t, [tf], strength=18)
    flash_overlay(c, fl)


def church_dog(c, x):
    x.push, x.focus = 0.1, (W / 2, 1100)
    run = ease(ramp(x.t, 0.0, x.dur)) * 0.85 + ramp(x.t, 0.0, x.dur) * 0.15
    with layer(c, x, 0.2):
        # side view across the nave: pillars, windows, pews with praying people
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1700, [(0, (14, 12, 16), 1), (1, (30, 24, 24), 1)]))
        for k in range(6):
            px = -60 + k * 240
            c.drawRect(R(px - 40, 200, px + 40, 1300), paint((34, 34, 42)))
            if k < 5:
                arc = skia.Path()
                arc.moveTo(px + 40, 520)
                arc.arcTo(R(px + 40, 380, px + 200, 660), 180, 180, False)
                c.drawPath(arc, paint((34, 34, 42), stroke=24))
                wx = px + 120
                c.drawRect(R(wx - 30, 560, wx + 30, 820), paint((40, 46, 80), 0.8))
        fl = flicker(x.T, 3)
        for k in range(5):
            cx = 120 + k * 220
            c.drawRect(R(cx - 5, 1080, cx + 5, 1140), paint((220, 210, 190)))
            out = ramp(run, k / 5 * 0.9, k / 5 * 0.9 + 0.12)    # candles go out as the dog passes
            c.drawOval(R(cx - 5, 1052, cx + 5, 1080), paint((255, 200, 120), 1 - out))
            glow(c, cx, 1066, 130, LANTERN, 0.45 * fl * (1 - out))
        for k in range(7):
            px = 40 + k * 160
            c.drawRect(R(px - 70, 1180, px + 70, 1300), paint((46, 32, 24)))
            kneeler(c, px - 10, 1250, 0.7)
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1300, 1600, 2600), paint((26, 20, 18)))
        dx = -350 + 1800 * run                                   # runs left -> right through the aisle
        dog(c, dx, 1560, 1.25, phase=x.T * 9, run=True, T=x.T)


def prayer_victims(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    td = x.wt("died", x.dur * 0.6)
    k = ease(ramp(x.t, td - 0.1, td + 0.5))
    fl = flicker(x.T, 6)
    with layer(c, x, 0.3):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1700, [(0, (16, 13, 16), 1), (1, (34, 26, 24), 1)]))
        glow(c, 860, 1100, 700, LANTERN, 0.3 * fl * (1 - k))
        c.drawRect(R(120, 300, 300, 700), paint((50, 56, 90), 0.8))
        light_shaft(c, [(120, 700), (300, 700), (760, 1600), (260, 1640)], color=(170, 180, 230), a=0.16)
        ea = ease(ramp(x.t, td + 0.3, td + 1.0))
        for ex in (320, 352):
            glow(c, ex, 820, 50, FIRE, 0.6 * ea)
            c.drawCircle(ex, 820, 5, paint((255, 170, 110), ea))
    with layer(c, x, 0.6):
        c.drawRect(R(-500, 1500, 1600, 2600), paint((24, 18, 16)))
        c.drawRect(R(780, 1300, 1000, 1500), paint((50, 40, 36)))
        for cx in (830, 950):
            c.drawRect(R(cx - 6, 1220, cx + 6, 1300), paint((220, 210, 190)))
            c.drawOval(R(cx - 6, 1190 - 3 * fl, cx + 6, 1220), paint((255, 200, 120), 1 - k))
            glow(c, cx, 1205, 140, LANTERN, 0.5 * fl * (1 - k))
            if k > 0:
                smoke(c, cx, 1190, x.t - td, a=0.6 * k, n=6, seed=int(cx))
        tone = mix((52, 40, 38), (14, 12, 14), k)
        kneeler(c, 360, 1500, 1.7, slump=k, tone=tone)
        kneeler(c, 600, 1500, 1.6, slump=k * 0.9, tone=tone)


def steeple_collapse(c, x):
    x.push, x.focus = 0.12, (W / 2, 1000)
    ts = x.wt("steeple", x.dur * 0.6)
    fall = ease(ramp(x.t, ts + 0.1, ts + 1.2))
    strikes = [0.4, ts]
    with layer(c, x, 0.0):
        sky(c, top=(10, 10, 16), mid=(24, 24, 36), haze=(48, 46, 60), horizon=1150)
        fl = lightning(c, x.t, strikes, x0=640, y_bot=650, seed=21)
    with layer(c, x, 0.45):
        c.drawRect(R(-500, 1250, 1600, 2600), paint((14, 14, 20)))
        glow(c, 720, 520, 800, (150, 155, 200), 0.32)          # storm glow behind the tower
        church_ext(c, 470, 1260, 1.25, color=(13, 13, 19), rim=(120, 122, 160), lit=0.7, T=x.T,
                   steeple_angle=-75 * fall, steeple_drop=180 * fall ** 2)
        if fall > 0:
            rng = np.random.default_rng(3)
            for i in range(40):                                  # debris + dust
                d = x.t - ts - 0.6
                if d < 0:
                    break
                px = 470 + 1.25 * 100 + rng.normal(0, 120) + rng.uniform(-1, 1) * d * 160
                py = 1260 - 1.25 * 400 + d * 380 + 0.5 * 900 * d * d * rng.uniform(0.3, 1)
                if py < 1260:
                    c.drawRect(R(px - 6, py - 6, px + 6, py + 6), paint((60, 60, 70)))
            c.drawCircle(560, 900, 300 * fall, paint((90, 86, 96), 0.35 * fall * max(0.0, 1 - (x.t - ts - 1.2) * 0.4),
                                                      blur=40))
        rain(c, x.T, a=0.25, seed=5)
    x.shake = shake_amount(x.t, [ts, ts + 1.2], strength=16)
    flash_overlay(c, fl)


def claw_door(c, x):
    x.push, x.focus = 0.12, (W / 2, 950)
    tc = x.wt("claw", x.dur * 0.6)
    prog = ease(ramp(x.t, tc - 0.5, tc + 0.4))
    heat = prog * max(0.0, 1 - ramp(x.t, tc + 1.0, x.dur + 1.0) * 0.9)
    with layer(c, x, 0.4):
        c.drawRect(R(-500, -500, 1600, 2600), paint((12, 10, 12)))
        c.drawRect(R(200, 300, 880, 1700), paint(STONE))
        wooden_door(c, 260, 360, 820, 1700, light=0.6)
        glow(c, 540, 950, 500, (180, 190, 240), 0.12)
        claw_marks(c, prog, heat=heat, burnt=prog)
        if prog > 0.3:
            smoke(c, 520, 950, x.t, a=0.5 * prog, n=14, seed=3)
    with layer(c, x, 0.8):
        # the paw sweeping down through the door (follows the marks, one continuous swipe)
        sw = ramp(x.t, tc - 0.6, tc + 0.5)
        if 0 < sw < 1:
            py = 560 + 700 * ease(sw)
            px = 700 + 120 * ease(sw)
            c.drawLine(1300, py - 600, px + 80, py - 40, paint(BEAST, stroke=150, cap_round=True))
            c.drawPath(fur_path(px + 40, py - 30, 120, 80, np.random.default_rng(2), spikes=30, jit=0.15), paint(BEAST))
            for k in range(4):
                c.drawLine(px - 40 + k * 40, py + 20, px - 50 + k * 40, py + 90, paint((200, 190, 170), stroke=10,
                                                                                       cap_round=True))


def scorch_marks(c, x):
    x.push, x.focus = 0.18, (W / 2, 950)
    tt = x.wt("touch", x.dur * 0.75)
    with layer(c, x, 0.4):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (70, 76, 90), 1), (1, (40, 44, 54), 1)]))
        c.drawRect(R(200, 300, 880, 1700), paint((84, 84, 92)))
        rng = np.random.default_rng(40)
        for k in range(120):                                  # flint wall around the door
            fx, fy = rng.uniform(150, 930), rng.uniform(250, 1750)
            fw, fh = rng.uniform(24, 60), rng.uniform(18, 40)
            c.drawOval(R(fx - fw / 2, fy - fh / 2, fx + fw / 2, fy + fh / 2), paint((64, 64, 74)))
        wooden_door(c, 260, 360, 820, 1700, light=0.9)
        claw_marks(c, 1.0, heat=0.0, burnt=1.0, wear=0.4)
        c.drawRect(R(-500, -500, 1600, 2600), paint((150, 160, 190), 0.08, blend=skia.BlendMode.kScreen))
    with layer(c, x, 0.8):
        # a hand reaching up to the marks
        k = ease(ramp(x.t, tt - 1.2, tt + 0.2))
        hx, hy = 470 + 40 * k, 2050 - 1000 * k
        c.drawLine(hx + 60, hy + 700, hx, hy + 60, paint((150, 112, 92), stroke=110, cap_round=True))
        c.drawPath(smooth_path([(hx - 60, hy + 60), (hx - 50, hy - 40), (hx + 60, hy - 50), (hx + 80, hy + 70)]),
                   paint((178, 134, 110)))
        for j in range(4):
            fx = hx - 45 + j * 34
            c.drawLine(fx, hy - 30, fx - 6, hy - 140 + abs(j - 1.5) * 20, paint((178, 134, 110), stroke=30, cap_round=True))
        c.drawLine(hx + 80, hy + 40, hx + 130, hy - 40, paint((178, 134, 110), stroke=32, cap_round=True))


def pov_padding(c, x):
    x.push, x.focus = 0.16, (W / 2, 1050)
    appear = ease(ramp(x.t, x.dur * 0.35, x.dur * 0.85))
    with layer(c, x, 0.0):
        sky(c, horizon=1000)
        stars(c, x, seed=62)
        glow(c, W / 2, -200, 900, MOON, 0.25)
    with layer(c, x, 0.3):
        haze(c, 820, 1040, a=0.5)
        c.drawRect(R(-500, 1000, 1600, 2600), paint((16, 16, 22)))
        road(c, W / 2, 1000, bottom_w=1700, top_w=24, color=(44, 44, 56), edge=(58, 58, 72))
        for side, sd in ((-1, 63), (1, 64)):
            x0, x1 = (-400, 300) if side < 0 else (780, 1500)
            c.drawPath(fur_path((x0 + x1) / 2, 1120, (x1 - x0) / 2, 160, np.random.default_rng(sd), spikes=60, jit=0.1),
                       paint((12, 13, 18)))
    with layer(c, x, 0.8):
        # something big keeping pace at the right edge of the frame (only partly visible)
        bob = math.sin(x.T * 4.0) * 10
        bx = 1180 - 150 * appear
        body = fur_path(bx + 120, 1500 + bob, 260, 420, np.random.default_rng(7), spikes=50, jit=0.1)
        head = fur_path(bx - 20, 1120 + bob, 120, 100, np.random.default_rng(8), spikes=30, jit=0.14)
        c.save(); c.translate(-6, -4)
        c.drawPath(body, paint(BEAST_RIM, appear)); c.drawPath(head, paint(BEAST_RIM, appear))
        c.restore()
        c.drawPath(body, paint(BEAST)); c.drawPath(head, paint(BEAST))
        glow(c, bx - 70, 1100 + bob, 60, FIRE, 0.6 * appear)
        c.drawOval(R(bx - 82, 1094 + bob, bx - 58, 1106 + bob), paint((255, 170, 110), appear))


def shuck_reveal(c, x):
    x.push, x.focus = 0.25, (W / 2, 850)
    tr = x.wt("never", x.dur * 0.5) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((7, 7, 10)))
    if x.t < tr:
        with layer(c, x, 0.6):
            a = ease(ramp(x.t, 0.3, 1.2)) * 0.5
            for ex in (W / 2 - 40, W / 2 + 40):
                glow(c, ex, 820, 50, FIRE, a)
                c.drawCircle(ex, 820, 4, paint((255, 170, 110), a))
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=24)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        c.saveLayer(None, paint(a=k))
        glow(c, W / 2, 1200, 900, (160, 60, 40), 0.25)
        dog_head_front(c, W / 2, 720, 1.4, eyes=1.0, snarl=1.0, T=x.T)
        c.restore()


for _f in (shuck_road, coast_road, title_shuck, shuck_closeup, walk_beside, storm_town, church_doors, church_dog,
           prayer_victims, steeple_collapse, claw_door, scorch_marks, pov_padding, shuck_reveal):
    scenes.SCENES[_f.__name__] = _f


# ================================================================== sounds
SR = audio.SR


def _noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def thunder(length=5.0, seed=0):
    n = int(length * SR)
    t = np.arange(n) / SR
    crack = audio.filt(_noise(n, seed), "band", (600, 6000)) * np.exp(-t * 14) * 0.8
    roll = audio.filt(_noise(n, seed + 1), "low", 160) * (np.exp(-t * 0.9) * (0.6 + 0.4 * np.sin(2 * np.pi * 1.7 * t) ** 2)) * 2.2
    return audio.reverb(crack + roll, 0.4)


def rain_bed(length, muffled=False, seed=3):
    n = int(length * SR)
    x = audio.filt(_noise(n, seed), "band", (900, 7000) if not muffled else (200, 900)) * 0.25
    e = np.clip(np.arange(n) / SR / 0.8, 0, 1) * np.clip((length - np.arange(n) / SR) / 0.8, 0, 1)
    return np.stack([x * e, audio.filt(_noise(n, seed + 1), "band", (900, 7000) if not muffled else (200, 900)) * 0.25 * e], 1)


def growl(length=2.5, seed=4):
    n = int(length * SR)
    t = np.arange(n) / SR
    am = (0.5 + 0.5 * np.sin(2 * np.pi * (26 + 6 * np.sin(2 * np.pi * 0.7 * t)) * t)) ** 2
    x = audio.filt(_noise(n, seed), "band", (60, 420)) * am * 3.0
    x += np.sin(2 * np.pi * 62 * t) * am * 0.3
    return audio.reverb(x * np.sin(np.pi * t / length) ** 0.5, 0.3)


def paw():
    n = int(0.22 * SR)
    t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 70 * t) * np.exp(-t * 30) + audio.filt(_noise(n, 9), "low", 500) * np.exp(-t * 40) * 0.6) * 0.5


def waves(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = audio.filt(_noise(n, 12), "low", 700) * (0.45 + 0.55 * np.sin(2 * np.pi * t / 6.5) ** 2) * 0.6
    return np.stack([x, np.roll(x, SR // 3)], 1)


def organ(length):
    p = audio.pad(length, [73.4, 110.0, 146.8, 174.6, 220.0], bright=0.6) * 0.35
    n = len(p)
    e = np.clip(np.arange(n) / SR / 1.0, 0, 1)
    return p * e[:, None]


def crash(length=3.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = audio.filt(_noise(n, 21), "band", (200, 5000)) * np.exp(-t * 2.2)
    rng = np.random.default_rng(5)
    for _ in range(40):
        i = int(rng.uniform(0.2, length * 0.8) * SR)
        ln = int(0.05 * SR)
        x[i:i + ln] += audio.filt(_noise(ln, i), "band", (1500, 6000)) * rng.uniform(0.3, 1) * np.exp(-np.arange(ln) / SR * 60)
    return audio.reverb(x * 0.7, 0.4) + audio.boom(length, f0=70, f1=25) * 0.9


def sizzle(length=3.0):
    n = int(length * SR)
    t = np.arange(n) / SR
    x = audio.filt(_noise(n, 31), "high", 3000) * (0.5 + 0.5 * (np.random.default_rng(2).random(n) > 0.995)) * 0.5
    scrape = audio.filt(_noise(n, 32), "band", (500, 2500)) * np.exp(-t * 3) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * t))
    return audio.reverb((x * np.exp(-t * 0.8) + scrape * 0.8), 0.3)


def _at(s, word, frac=0.5):
    return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)


def _sfx_road(m, s, tl):
    m.add(s["start"] + 2.0, growl(3.0), 0.5)


def _sfx_coast(m, s, tl):
    m.add(s["start"] - 0.3, waves(s["end"] - s["start"] + 1.0), 0.6)


def _sfx_title(m, s, tl):
    m.add(s["start"] + 0.8, growl(2.5, seed=5), 0.6)


def _sfx_closeup(m, s, tl):
    tf = _at(s, "fire", 0.85)
    m.add(tf - 0.1, sizzle(1.8), 0.6)
    m.add(tf - 0.05, audio.boom(2.0, f0=80, f1=30), 0.6)


def _sfx_walk(m, s, tl):
    tq = _at(s, "footsteps", 0.7)
    k = s["start"] + 0.2
    while k < tq - 0.4:                       # only the traveler's footsteps... then nothing at all
        m.add(k, audio.footstep(0.0), 0.25)
        k += 0.48
    return [(tq - 0.3, s["end"] + 0.2, 0.15)]


def _sfx_storm(m, s, tl):
    kinds = [x["kind"] for x in tl["scenes"]]
    end = tl["scenes"][kinds.index("church_dog")]["end"] if "church_dog" in kinds else s["end"]
    ts = _at(s, "storm", 0.7)
    m.add(s["start"] - 0.5, rain_bed(s["end"] - s["start"] + 1.0), 0.8)
    m.add(s["end"] - 0.3, rain_bed(end - s["end"] + 0.6, muffled=True), 0.9)
    m.add(s["start"] + 0.6, thunder(4.0, 1), 0.6)
    m.add(ts - 0.05, thunder(5.0, 2), 1.0)
    m.add(ts + 1.4, thunder(4.0, 3), 0.7)


def _sfx_doors(m, s, tl):
    tf = _at(s, "flew", 0.8)
    m.add(s["start"], organ(tf - s["start"] + 0.2) * np.clip(1 - (np.arange(int((tf - s["start"] + 0.2) * SR)) / SR
                                                                       - (tf - s["start"] - 0.2)) / 0.3, 0, 1)[:, None], 0.8)
    m.add(tf - 0.05, audio.boom(3.0, f0=90, f1=30), 1.0)
    m.add(tf, audio.creak(1.6, 0.6), 0.8)
    m.add(tf + 0.02, thunder(4.0, 7), 0.9)
    m.add(tf + 0.1, audio.whoosh(1.6), 0.6)


def _sfx_dog(m, s, tl):
    k = s["start"] + 0.1
    while k < s["end"]:
        m.add(k, paw(), 0.7, pan=-0.6 + 1.2 * (k - s["start"]) / max(0.1, s["end"] - s["start"]))
        k += 0.17
    m.add(s["start"] + 0.3, growl(2.0, seed=6), 0.7)


def _sfx_victims(m, s, tl):
    td = _at(s, "died", 0.6)
    m.add(td - 0.05, audio.boom(3.0, f0=60, f1=24), 0.8)
    m.add(td, audio.whoosh(0.8), 0.3)
    return [(td + 0.2, s["end"] + 0.3, 0.4)]


def _sfx_steeple(m, s, tl):
    ts = _at(s, "steeple", 0.6)
    m.add(s["start"] + 0.4, thunder(4.0, 11), 0.6)
    m.add(ts, thunder(5.0, 12), 1.0)
    m.add(ts + 0.6, crash(3.5), 1.0)
    m.add(s["start"] - 0.3, rain_bed(s["end"] - s["start"] + 0.6, seed=8), 0.7)


def _sfx_claw(m, s, tl):
    tc = _at(s, "claw", 0.6)
    m.add(tc - 0.5, sizzle(3.5), 0.9)
    m.add(tc - 0.4, growl(1.8, seed=9), 0.7)


def _sfx_pov(m, s, tl):
    k = s["start"] + (s["end"] - s["start"]) * 0.4
    while k < s["end"]:                       # soft padding paws next to you
        m.add(k, paw(), 0.35, pan=0.7)
        k += 0.42


def _sfx_reveal(m, s, tl):
    tr = audio.reveal_time(tl)
    if tr is not None:
        m.add(tr - 0.1, growl(2.5, seed=10), 1.2)


audio.SFX.update({"shuck_road": _sfx_road, "coast_road": _sfx_coast, "title_shuck": _sfx_title,
                  "shuck_closeup": _sfx_closeup, "walk_beside": _sfx_walk, "storm_town": _sfx_storm,
                  "church_doors": _sfx_doors, "church_dog": _sfx_dog, "prayer_victims": _sfx_victims,
                  "steeple_collapse": _sfx_steeple, "claw_door": _sfx_claw, "pov_padding": _sfx_pov,
                  "shuck_reveal": _sfx_reveal})
