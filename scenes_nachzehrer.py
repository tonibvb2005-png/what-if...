"""Animated scenes + sounds for 'Der Nachzehrer' (registers into scenes.SCENES / audio.SFX).

Implicit: no corpses shown; the grave is a dark cross-section with a pale shroud outline.
Motion rules: everything monotonic in local time.
"""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, fog, glow, light_shaft, paint, lin_paint, rad_paint, R, poly,
                 smooth_path, mix, ease, ramp, shake_amount, fur_path, traveler, CREAM, LANTERN, MOON)
from scenes_rattenfaenger import town_row, TOWN
from scenes_baba_yaga import skull

flicker = scenes.flicker
SICK = (110, 140, 100)          # sickly green fog
EARTH = (34, 28, 24)
SHROUD = (196, 192, 176)


# ================================================================== elements
def grave_cross(c, x, by, s, color=(40, 32, 26), rim=(90, 96, 80), tilt=0.0):
    c.save()
    c.translate(x, by)
    c.rotate(tilt)
    c.scale(s, s)
    for off, colr in ((3, rim), (0, color)):
        c.save(); c.translate(-off, 0)
        c.drawRect(R(-8, -170, 8, 0), paint(colr))
        c.drawRect(R(-50, -130, 50, -114), paint(colr))
        c.restore()
    c.restore()


def mound(c, x, by, w, h, color=EARTH, fresh=False):
    c.drawPath(smooth_path([(x - w / 2, by), (x - w * 0.3, by - h), (x + w * 0.3, by - h), (x + w / 2, by)]),
               paint(mix(color, (60, 48, 36), 0.4) if fresh else color))


def sound_rings(c, x, y, t, a=1.0, n=3, speed=180, color=(170, 190, 150)):
    for k in range(n):
        rr = 20 + ((t * speed + k * 70) % 210)
        c.drawOval(R(x - rr, y - rr * 0.35, x + rr, y + rr * 0.35), paint(color, a * 0.5 * (1 - rr / 230), stroke=3))


def graveyard(c, x, ground=1300, seed=0, n=8):
    rng = np.random.default_rng(seed)
    c.drawRect(R(-500, ground, 1600, 2600), lin_paint(0, ground, 0, 1900, [(0, (26, 30, 26), 1), (1, (8, 10, 8), 1)]))
    for i in range(n):
        gx = rng.uniform(-50, 1130)
        gy = ground + rng.uniform(10, 120)
        sc = 0.5 + (gy - ground) / 200
        if rng.uniform() < 0.5:
            grave_cross(c, gx, gy, sc, tilt=rng.uniform(-8, 8))
        else:
            c.drawRRect(skia.RRect.MakeRectXY(R(gx - 30 * sc, gy - 90 * sc, gx + 30 * sc, gy), 26 * sc, 26 * sc),
                        paint((44, 46, 44)))


def villager(c, x, y, s, phase=0.0, lantern=True, walking=False, T=0.0):
    traveler(c, x, y, s, phase=phase, walking=walking, lantern=lantern, silhouette=0.75, flicker=flicker(T, x))


# ================================================================== scenes
def nz_hook(c, x):
    x.push, x.focus = 0.2, (W / 2, 1200)
    with layer(c, x, 0.0):
        sky(c, top=(6, 8, 10), mid=(16, 22, 20), haze=(40, 50, 44), horizon=1200)
        stars(c, x, seed=160)
        moon(c, 760, 420, 100, MOON)
    with layer(c, x, 0.4):
        haze(c, 1050, 1250, SICK, a=0.3)
        graveyard(c, x, ground=1250, seed=1)
        glow(c, W / 2, 1450, 520, (200, 215, 190), 0.28)       # moonlight pool on the fresh grave
        mound(c, W / 2, 1520, 420, 110, fresh=True)
        c.drawPath(smooth_path([(W / 2 - 150, 1440), (W / 2, 1412), (W / 2 + 150, 1440)], close=False),
                   paint((150, 140, 120), 0.6, stroke=4))
        grave_cross(c, W / 2, 1420, 1.3, rim=(170, 176, 150))
        sound_rings(c, W / 2, 1500, x.T, a=1.0, color=(200, 230, 180))   # the sound out of the earth, from frame one
    with layer(c, x, 0.95):
        fog(c, x, 1500, a=0.3, speed=8, seed=2, color=SICK, scale=1.5)


def nz_village(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    with layer(c, x, 0.0):
        sky(c, top=(8, 10, 10), mid=(24, 30, 26), haze=(60, 74, 60), horizon=1150)
        moon(c, 260, 420, 80)
    with layer(c, x, 0.4):
        town_row(c, 1180, -150, 1250, TOWN, seed=161, hmin=160, hmax=280, lit=0.3, detail=True, T=x.T, church_x=700)
        fog(c, x, 1150, a=0.4, speed=6, seed=3, color=SICK, scale=1.6)
    with layer(c, x, 0.8):
        c.drawRect(R(-500, 1300, 1600, 2600), paint((14, 16, 14)))
        fog(c, x, 1350, a=0.35, speed=12, seed=4, color=SICK, scale=1.6)


def nz_title(c, x):
    x.push, x.focus = 0.16, (W / 2, 1150)
    with layer(c, x, 0.0):
        sky(c, top=(6, 8, 10), mid=(18, 24, 22), haze=(44, 54, 48), horizon=1350)
        stars(c, x, seed=162)
        moon(c, 540, 860, 270, MOON)
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1350, 1600, 2600), paint((12, 14, 12)))
        mound(c, 540, 1420, 520, 120)
        grave_cross(c, 540, 1330, 2.0, color=(16, 16, 16), rim=(140, 140, 120))
    with layer(c, x, 0.95):
        fog(c, x, 1450, a=0.3, speed=10, seed=5, color=SICK, scale=1.5)


def nz_funerals(c, x):
    x.push, x.focus = 0.12, (W / 2, 1300)
    times = [x.wt("one", 0.5)] + x.every.get("another", []) + [x.wt("always", x.dur * 0.8)]
    with layer(c, x, 0.0):
        sky(c, top=(8, 10, 12), mid=(22, 26, 26), haze=(56, 62, 58), horizon=1250)
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1250, 1600, 2600), paint((22, 26, 22)))
        glow(c, W / 2, 1500, 650, (200, 215, 190), 0.22)
        slots = [(260, 1450), (540, 1430), (820, 1450), (400, 1620), (690, 1620)]
        for i, (gx, gy) in enumerate(slots[:len(times)]):
            k = ease(ramp(x.t, times[i] - 0.05, times[i] + 0.25))
            if k > 0:
                mound(c, gx, gy + 60, 220, 50 * k, fresh=True)
                grave_cross(c, gx, gy + 20, 1.0 * k, rim=(170, 176, 150))
        # mourners standing with heads bowed
        for j in range(4):
            villager(c, 140 + j * 260, 1800, 1.0, lantern=j % 2 == 0, T=x.T)
    with layer(c, x, 0.95):
        fog(c, x, 1500, a=0.25, speed=8, seed=6, color=SICK, scale=1.5)


def nz_sound(c, x):
    x.push, x.focus = 0.14, (W / 2, 1200)
    tc = x.wt("chewing", x.dur * 0.85)
    with layer(c, x, 0.0):
        sky(c, top=(6, 8, 10), mid=(16, 20, 20), haze=(40, 48, 44), horizon=1250)
        moon(c, 820, 380, 70)
    with layer(c, x, 0.4):
        graveyard(c, x, ground=1250, seed=7, n=10)
        glow(c, 560, 1400, 520, (200, 215, 190), 0.22)
        sound_rings(c, 560, 1420, x.T, a=0.5 + 0.5 * ease(ramp(x.t, tc - 0.4, tc + 0.3)), color=(200, 230, 180))
    with layer(c, x, 0.7):
        # villagers with lanterns at the graveyard wall, leaning in to listen
        c.drawRect(R(-500, 1560, 1600, 1680), paint((40, 40, 40)))
        for k in range(30):
            c.drawLine(-500 + k * 70, 1560, -500 + k * 70, 1680, paint((26, 26, 26), stroke=3))
        for j, vx in enumerate((200, 420, 880)):
            villager(c, vx, 1900, 1.25, T=x.T, lantern=True)


def nz_shroud(c, x):
    x.push, x.focus = 0.12, (W / 2, 1100)
    tb = x.wt("bite", x.dur * 0.75)
    with layer(c, x, 0.3):
        # top: the family house, its windows going dark one by one
        sky(c, top=(6, 8, 10), mid=(16, 20, 20), haze=(36, 44, 40), horizon=700)
        c.drawRect(R(-500, 700, 1600, 2600), paint(EARTH))
        c.drawRect(R(340, 420, 740, 700), paint((40, 38, 40)))
        c.drawPath(poly([(320, 420), (540, 280), (760, 420)]), paint((28, 26, 28)))
        for i, (wx, wy) in enumerate(((390, 470), (490, 470), (590, 470), (690, 470), (390, 580), (690, 580))):
            out = ramp(x.t, tb - 0.3 + i * 0.5, tb + i * 0.5)
            fl = flicker(x.T, i)
            c.drawRect(R(wx - 26, wy, wx + 26, wy + 60), paint(mix(LANTERN, (20, 18, 16), out), fl))
        # earth layers, then the coffin cross-section with the shroud slowly pulled toward the head
        for k in range(6):
            c.drawLine(-500, 760 + k * 120, 1600, 770 + k * 120, paint((24, 20, 16), stroke=3))
        c.drawRRect(skia.RRect.MakeRectXY(R(140, 1250, 940, 1560), 20, 20), paint((18, 14, 12)))
        c.drawRRect(skia.RRect.MakeRectXY(R(140, 1250, 940, 1560), 20, 20), paint((70, 56, 40), stroke=10))
        pull = ease(ramp(x.t, 0.2, x.dur))
        shroud = smooth_path([(220, 1400), (300, 1330), (840, 1340), (880, 1410), (840, 1480), (300 + 120 * pull, 1480)])
        c.drawPath(shroud, paint(SHROUD, 0.85))
        c.drawPath(smooth_path([(220, 1400), (250, 1440), (300 + 120 * pull, 1480), (240 + 60 * pull, 1430)]),
                   paint((60, 56, 50), 0.6))
        for k in x.every.get("another", []) + [tb]:
            if x.t >= k:
                sound_rings(c, 260, 1400, x.t - k, a=max(0.0, 1 - (x.t - k)), n=2)


def nz_dig(c, x):
    x.push, x.focus = 0.14, (W / 2, 1250)
    te = x.wt("eyes", x.dur * 0.8)
    with layer(c, x, 0.0):
        sky(c, top=(6, 8, 10), mid=(16, 20, 20), haze=(40, 48, 44), horizon=1200)
        moon(c, 220, 380, 70)
    with layer(c, x, 0.5):
        c.drawRect(R(-500, 1200, 1600, 2600), paint((16, 18, 16)))
        dug = ease(ramp(x.t, 0.0, te))
        c.drawOval(R(300, 1520, 780, 1620), paint((6, 6, 6)))
        mound(c, 180, 1560, 300, 60 + 120 * dug)
        mound(c, 900, 1560, 300, 50 + 110 * dug)
        fl = flicker(x.T, 3)
        glow(c, 540, 1500, 600, LANTERN, 0.3 * fl)
        for j, (vx, ph) in enumerate(((360, 0.0), (720, math.pi))):
            dig = (math.sin(x.T * 3.5 + ph) + 1) / 2
            villager(c, vx, 1520, 1.15, lantern=False, T=x.T)
            c.drawLine(vx + 40, 1300 - 60 * dig, vx + 90, 1500 - 40 * dig, paint((90, 70, 50), stroke=8))
            c.drawPath(poly([(vx + 76, 1490 - 40 * dig), (vx + 110, 1500 - 40 * dig), (vx + 100, 1540 - 40 * dig),
                             (vx + 70, 1530 - 40 * dig)]), paint((80, 80, 86)))
    if x.t > te - 0.2:
        k = ease(ramp(x.t, te - 0.2, te + 0.3))
        c.drawRect(R(-500, -500, 1600, 2600), paint((0, 0, 0), 0.85 * k))
        ex, ey = W / 2, 1000
        c.drawOval(R(ex - 110, ey - 50 * k, ex + 110, ey + 50 * k), paint((206, 210, 196), k))
        c.drawCircle(ex, ey, 28 * k, paint((60, 70, 60), k))
        c.drawCircle(ex, ey, 12 * k, paint((6, 6, 6), k))
    x.shake = shake_amount(x.t, [te], strength=12)


def nz_stone(c, x):
    x.push, x.focus = 0.16, (W / 2, 1100)
    tn = x.wt("never", x.dur * 0.75)
    down = ease(ramp(x.t, 0.3, tn))
    with layer(c, x, 0.5):
        c.drawRect(R(-500, -500, 1600, 2600), paint((8, 8, 8)))
        fl = flicker(x.T, 5)
        glow(c, 800, 900, 700, LANTERN, 0.3 * fl)
        c.drawOval(R(380, 1300, 700, 1460), paint((2, 2, 2)))                     # dark opening below
        c.drawPath(smooth_path([(330, 1290), (540, 1250), (750, 1290), (720, 1480), (360, 1480)]),
                   paint(SHROUD, 0.25, stroke=10))
        sy = 700 + 620 * down
        c.drawLine(1000, -200, 640, sy - 90, paint((34, 28, 30), stroke=130, cap_round=True))      # dark sleeve
        c.drawLine(640, sy - 90, 590, sy - 40, paint((160, 120, 96), stroke=70, cap_round=True))    # hand
        c.drawPath(fur_path(540, sy, 90, 64, np.random.default_rng(3), spikes=14, jit=0.12), paint((96, 96, 100)))
        for f in range(4):
            c.drawLine(590, sy - 40, 520 + f * 30, sy - 70, paint((160, 120, 96), stroke=26, cap_round=True))
    x.shake = shake_amount(x.t, [tn], strength=12)


def nz_archaeology(c, x):
    x.push, x.focus = 0.16, (W / 2, 1100)
    with layer(c, x, 0.4):
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (40, 34, 28), 1), (1, (70, 58, 44), 1)]))
        for k in range(8):                                    # excavation grid strings
            c.drawLine(100 + k * 120, 200, 100 + k * 120, 1800, paint((220, 210, 180), 0.5, stroke=2))
            c.drawLine(100, 200 + k * 220, 940, 200 + k * 220, paint((220, 210, 180), 0.5, stroke=2))
        light_shaft(c, [(900, -100), (1100, -100), (700, 1500), (300, 1500)], color=(255, 240, 200), a=0.18)
        skull(c, 540, 980, 5.0)
        c.drawPath(fur_path(540, 1180, 70, 44, np.random.default_rng(4), spikes=14, jit=0.12), paint((110, 110, 112)))
        bx = 300 + 90 * math.sin(x.T * 2)
        c.drawLine(bx, 1500, bx + 120, 1300, paint((120, 90, 60), stroke=14, cap_round=True))   # brush
        c.drawRect(R(bx + 110, 1260, bx + 160, 1310), paint((60, 50, 40)))


def nz_pov(c, x):
    x.push, x.focus = 0.2, (W / 2, 1150)
    k = ramp(x.t, 0.0, x.dur)
    with layer(c, x, 0.0):
        sky(c, top=(6, 8, 10), mid=(16, 20, 20), haze=(40, 48, 44), horizon=1150)
        moon(c, 860, 360, 70)
    with layer(c, x, 0.4):
        graveyard(c, x, ground=1150, seed=11, n=12)
        sound_rings(c, 700, 1300, x.T, a=0.6 * ease(ramp(x.t, x.dur * 0.5, x.dur)))
        # graveyard wall + iron gate sliding past as you walk
        off = -300 * k
        c.drawRect(R(-500, 1380, 1600, 1520), paint((42, 42, 40)))
        for j in range(24):
            c.drawLine(-500 + j * 90 + off % 90, 1380, -500 + j * 90 + off % 90, 1520, paint((28, 28, 26), stroke=3))
        gx = 760 + off
        c.drawRect(R(gx - 120, 1220, gx + 120, 1520), paint((8, 8, 8)))
        for j in range(7):
            c.drawLine(gx - 110 + j * 36, 1220, gx - 110 + j * 36, 1520, paint((60, 60, 64), stroke=5))
    with layer(c, x, 0.9):
        fog(c, x, 1500, a=0.3, speed=10, seed=8, color=SICK, scale=1.5)


def nz_reveal(c, x):
    x.push, x.focus = 0.28, (W / 2, 900)
    tr = x.wt("don't", 0.2) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((5, 5, 5)))
    if x.t < tr:
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=24)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        c.saveLayer(None, paint(a=k))
        cx, cy = W / 2, 900
        glow(c, cx, 1100, 900, SICK, 0.2)
        c.drawRect(R(-500, 1250, 1600, 2600), paint(EARTH))
        face = smooth_path([(cx - 170, cy - 230), (cx, cy - 280), (cx + 170, cy - 230), (cx + 200, cy),
                            (cx + 140, cy + 260), (cx, cy + 330), (cx - 140, cy + 260), (cx - 200, cy)])
        c.drawPath(face, lin_paint(0, cy - 280, 0, cy + 330, [(0, (90, 100, 86), 1), (1, (150, 160, 136), 1)]))
        c.save()
        c.clipPath(face, doAntiAlias=True)
        for sx in (-1, 1):
            c.drawOval(R(cx + sx * 140 - 60, cy + 30, cx + sx * 140 + 50, cy + 220), paint((30, 36, 28), 0.7, blur=22))
        c.restore()
        c.drawOval(R(cx - 150, cy - 70, cx - 30, cy - 30), paint((30, 34, 28)))          # one eye closed
        c.drawOval(R(cx + 30, cy - 90, cx + 150, cy - 10), paint((210, 214, 200)))        # one eye wide open
        c.drawCircle(cx + 90, cy - 50, 12, paint((6, 6, 6)))
        glow(c, cx + 90, cy - 50, 90, (220, 240, 200), 0.5)
        c.drawPath(smooth_path([(cx - 90, cy + 120), (cx, cy + 100), (cx + 90, cy + 120), (cx + 60, cy + 220),
                                (cx - 60, cy + 220)]), paint((10, 8, 6)))
        c.drawPath(smooth_path([(cx - 70, cy + 150), (cx + 40, cy + 140), (cx + 20, cy + 330), (cx - 30, cy + 360),
                                (cx - 60, cy + 260)]), paint(SHROUD, 0.85))           # shroud cloth hanging from the mouth
        for i in range(8):                                                            # earth crumbling off
            c.drawCircle(cx - 200 + i * 55, cy + 300 + (i % 3) * 30, 18, paint(EARTH))
        c.restore()


for _f in (nz_hook, nz_village, nz_title, nz_funerals, nz_sound, nz_shroud, nz_dig, nz_stone, nz_archaeology, nz_pov,
           nz_reveal):
    scenes.SCENES[_f.__name__] = _f


# ================================================================== sounds
SR = audio.SR


def _noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def chewing(length, rate=2.2, seed=1, gain=1.0):
    """slow, wet chewing from under the earth (muffled)"""
    n = int(length * SR)
    out = np.zeros(n, np.float32)
    rng = np.random.default_rng(seed)
    k = 0.1
    while k < length - 0.3:
        ln = int(rng.uniform(0.12, 0.22) * SR)
        t = np.arange(ln) / SR
        x = audio.filt(_noise(ln, int(k * 100)), "band", (250, 1400)) * np.sin(np.pi * t / t[-1]) ** 2
        x += np.sin(2 * np.pi * rng.uniform(90, 140) * t) * np.exp(-t * 30) * 0.4
        i = int(k * SR)
        out[i:i + ln] += x[: n - i] * rng.uniform(0.6, 1.0)
        k += 1 / rate * rng.uniform(0.8, 1.2)
    out = audio.filt(out, "low", 1500) * gain
    return audio.reverb(out * 0.8, 0.25)


def shovel(seed=0):
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    return (audio.filt(_noise(n, seed), "band", (400, 3000)) * np.exp(-t * 12) * 0.5
            + np.sin(2 * np.pi * 80 * t) * np.exp(-t * 20) * 0.4)


def _at(s, word, frac=0.5):
    return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)


def _sfx_hook(m, s, tl):
    m.add(s["start"] + 0.1, chewing(s["end"] - s["start"] + 0.5), 0.9)


def _sfx_village(m, s, tl):
    m.add(s["start"] + 0.5, audio.bell(6.0, 146.8), 0.4)


def _sfx_funerals(m, s, tl):
    times = [_at(s, "one", 0.1)] + [s["start"] + t for t in s.get("word_times", {}).get("another", [])]
    for i, t in enumerate(times):
        m.add(t - 0.05, audio.bell(5.0, 130.8), 0.45)
        m.add(t, audio.boom(1.5, f0=60, f1=30), 0.3)


def _sfx_sound(m, s, tl):
    tc = _at(s, "chewing", 0.85)
    m.add(s["start"] + 0.3, chewing(tc - s["start"] + 1.5, gain=0.5, seed=3), 0.8)
    return [(tc - 0.5, s["end"] + 0.2, 0.3)]


def _sfx_shroud(m, s, tl):
    m.add(s["start"] + 0.2, chewing(s["end"] - s["start"], rate=1.8, seed=5), 0.8)


def _sfx_dig(m, s, tl):
    te = _at(s, "eyes", 0.8)
    k, i = s["start"] + 0.2, 0
    while k < te - 0.3:
        m.add(k, shovel(i), 0.6, pan=-0.3 if i % 2 else 0.3)
        k += 0.9
        i += 1
    m.add(te - 0.05, audio.sting(2.0), 1.0)


def _sfx_stone(m, s, tl):
    m.add(_at(s, "never", 0.75), audio.boom(1.8, f0=110, f1=50), 0.8)


def _sfx_pov(m, s, tl):
    m.add(s["start"] + (s["end"] - s["start"]) * 0.45, chewing((s["end"] - s["start"]) * 0.6, seed=9, gain=0.6), 0.7)


audio.SFX.update({"nz_hook": _sfx_hook, "nz_village": _sfx_village, "nz_funerals": _sfx_funerals,
                  "nz_sound": _sfx_sound, "nz_shroud": _sfx_shroud, "nz_dig": _sfx_dig, "nz_stone": _sfx_stone,
                  "nz_pov": _sfx_pov})
