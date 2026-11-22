"""Animated scenes + sounds for 'Kuchisake-onna' (registers into scenes.SCENES / audio.SFX).

Kept implicit: the smile is stylised (a thin dark line ear to ear), no injuries, no red wounds.
Motion rules: everything monotonic in local time, feet on the ground.
"""
import math

import numpy as np
import skia

import audio
import scenes
from gfx import (W, H, layer, sky, stars, moon, haze, fog, glow, light_shaft, paint, lin_paint, rad_paint, R, poly,
                 smooth_path, mix, ease, ramp, shake_amount, traveler, CREAM, LANTERN)
from scenes_rattenfaenger import child
from scenes_teke_teke import vending, tube_flicker

flicker = scenes.flicker
COAT = (150, 124, 92)
MASK = (232, 234, 236)
HAIR = (10, 10, 12)
SKIN = (206, 200, 196)
STREET = (34, 34, 40)


# ================================================================== elements
def masked_woman(c, x, y, s, tilt=0.0, mask=1.0, smile=0.0, eyes=0.0, narrow=0.0, T=0.0, a=1.0):
    """Tall woman in a long trench coat, white mask, long black hair. Feet at (x, y), height ~420*s.
    mask: 1 = covering, 0 = pulled down. smile: 0..1 width of the stylised ear-to-ear smile."""
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    if a < 1:
        c.saveLayer(None, paint(a=a))
    sway = math.sin(T * 0.8) * 3
    # legs + coat
    for sx in (-1, 1):
        c.drawLine(sx * 16, -120, sx * 18, -6, paint((30, 26, 26), stroke=14, cap_round=True))
        c.drawOval(R(sx * 18 - 12, -10, sx * 18 + 16, 2), paint((14, 12, 12)))
    c.drawPath(smooth_path([(-46, -330), (46, -330), (66, -200), (74, -110), (-74, -110), (-66, -200)]), paint(COAT))
    c.drawPath(smooth_path([(-46, -330), (0, -300), (46, -330), (30, -250), (0, -280), (-30, -250)]), paint(mix(COAT, (0, 0, 0), 0.3)))
    c.drawLine(0, -290, 0, -116, paint(mix(COAT, (0, 0, 0), 0.4), stroke=3))
    c.drawRect(R(-68, -220, 68, -206), paint(mix(COAT, (0, 0, 0), 0.35)))
    for sx in (-1, 1):
        c.drawLine(sx * 52, -320, sx * 64, -150, paint(COAT, stroke=22, cap_round=True))
        c.drawCircle(sx * 64, -144, 9, paint(SKIN))
    # head (tilted)
    c.save()
    c.rotate(tilt * 14, 0, -350)
    c.drawPath(smooth_path([(-44, -420), (0, -440), (44, -420), (54, -300), (34, -260), (-34, -260), (-54, -300)]),
               paint(HAIR))
    c.drawOval(R(-30, -414, 30, -336), paint(SKIN))
    c.drawPath(smooth_path([(-34, -420), (0, -432), (34, -420), (30, -396), (0, -404), (-30, -396)]), paint(HAIR))  # bangs
    for ex in (-12, 12):
        c.drawOval(R(ex - 9, -394, ex + 9, -380), paint((60, 50, 56), 0.5, blur=2))        # dark shadow under the eye
        h_ = 2.6 * (1 - narrow) + 0.6
        c.drawPath(smooth_path([(ex - 8, -390), (ex, -390 - h_ * 1.4), (ex + 8, -390), (ex, -390 + h_)]),
                   paint((236, 232, 228)))
        c.drawCircle(ex + 1, -390, 1.6, paint((10, 8, 8)))
        if eyes > 0:
            glow(c, ex, -390, 12, (255, 240, 230), 0.25 * eyes)
    if smile > 0:
        w_ = 20 + 36 * smile
        c.drawPath(smooth_path([(-w_, -372), (-w_ * 0.5, -360), (0, -356), (w_ * 0.5, -360), (w_, -372),
                                (w_ * 0.45, -352), (0, -346), (-w_ * 0.45, -352)]), paint((22, 8, 10)))
        n_t = int(5 + 9 * smile)
        for k in range(n_t):                                  # small pointed teeth along the upper edge
            f = (k + 0.5) / n_t
            tx = -w_ * 0.7 + f * 1.4 * w_
            ty = -360 + abs(f - 0.5) * 6
            c.drawPath(poly([(tx - 1.6, ty), (tx + 1.6, ty), (tx, ty + 3.2)]), paint((226, 222, 214)))
        for sx in (-1, 1):
            c.drawLine(sx * w_, -372, sx * (w_ + 5), -380, paint((22, 8, 10), stroke=1.6, cap_round=True))
    if mask > 0:
        drop = (1 - mask) * 40
        c.drawPath(smooth_path([(-27, -380 + drop), (27, -380 + drop), (25, -348 + drop), (0, -340 + drop),
                                (-25, -348 + drop)]), paint(MASK))
        c.drawLine(-27, -376 + drop, -32, -392, paint(MASK, stroke=1.5))
        c.drawLine(27, -376 + drop, 32, -392, paint(MASK, stroke=1.5))
    c.restore()
    if a < 1:
        c.restore()
    c.restore()


def school_kid(c, x, y, s, phase=0.0, seed=0, walk=True):
    child(c, x, y, s, phase=phase, seed=seed, silhouette=0.45, walk=walk)
    bob = abs(math.sin(phase)) * 4 if walk else 0
    c.save()
    c.translate(x, y - bob)
    c.scale(s, s)
    c.drawOval(R(-14, -116, 18, -98), paint((240, 200, 40)))                   # yellow school cap
    c.drawRRect(skia.RRect.MakeRectXY(R(-24, -86, -6, -50), 4, 4), paint((150, 30, 30)))   # randoseru backpack
    c.restore()


def utility_poles(c, x, vy, n=5, seed=0, scroll=0.0):
    """Japanese street: wooden poles with many sagging wires across the sky."""
    tops = []
    for k in range(n):
        f = k / (n - 1)
        px = (-100 + f * (W + 200) - scroll) % (W + 400) - 200
        h_ = 900 - abs(f - 0.5) * 300
        c.drawRect(R(px - 9, vy - h_, px + 9, vy), paint((22, 20, 22)))
        c.drawLine(px - 50, vy - h_ + 40, px + 50, vy - h_ + 40, paint((22, 20, 22), stroke=8))
        c.drawRect(R(px + 10, vy - h_ + 90, px + 40, vy - h_ + 140), paint((40, 40, 46)))   # transformer
        tops.append((px, vy - h_ + 40))
    tops.sort()
    for a_, b_ in zip(tops, tops[1:]):
        for j in range(4):
            pth = skia.Path()
            pth.moveTo(a_[0] - 40 + j * 26, a_[1] + j * 8)
            pth.quadTo((a_[0] + b_[0]) / 2, (a_[1] + b_[1]) / 2 + 70 + j * 10, b_[0] - 40 + j * 26, b_[1] + j * 8)
            c.drawPath(pth, paint((14, 14, 16), stroke=2.5))


def jp_street(c, x, vy=1150, seed=0):
    sky(c, top=(6, 8, 16), mid=(18, 20, 34), haze=(44, 44, 60), horizon=vy)
    stars(c, x, seed=150 + seed)
    rng = np.random.default_rng(seed)
    xx = -100
    while xx < W + 100:                                     # low houses with sliding windows
        w_ = rng.uniform(160, 260)
        h_ = rng.uniform(200, 320)
        c.drawRect(R(xx, vy - h_, xx + w_, vy), paint((30, 30, 38)))
        c.drawPath(poly([(xx - 14, vy - h_), (xx + w_ / 2, vy - h_ - 60), (xx + w_ + 14, vy - h_)]), paint((22, 22, 28)))
        if rng.uniform() < 0.5:
            c.drawRect(R(xx + w_ * 0.2, vy - h_ * 0.7, xx + w_ * 0.6, vy - h_ * 0.4), paint(LANTERN, 0.6))
            for k in range(1, 4):
                c.drawLine(xx + w_ * 0.2 + k * w_ * 0.1, vy - h_ * 0.7, xx + w_ * 0.2 + k * w_ * 0.1, vy - h_ * 0.4,
                           paint((30, 24, 20), stroke=2))
        xx += w_ + rng.uniform(10, 40)
    c.drawRect(R(-500, vy, 1600, 2600), lin_paint(0, vy, 0, 1900, [(0, (40, 40, 46), 1), (1, (14, 14, 16), 1)]))
    c.drawLine(-500, vy + 200, 1600, vy + 200, paint((200, 200, 200), 0.25, stroke=6))   # road marking


def street_lamp(c, x, by, T, h=800):
    fl = tube_flicker(T, x * 0.01)
    c.drawLine(x, by, x, by - h, paint((24, 24, 26), stroke=12))
    c.drawLine(x, by - h, x + 70, by - h, paint((24, 24, 26), stroke=8))
    c.drawOval(R(x + 50, by - h - 6, x + 100, by - h + 12), paint((230, 240, 230), fl))
    light_shaft(c, [(x + 55, by - h + 10), (x + 95, by - h + 10), (x + 300, by), (x - 150, by)],
                color=(220, 235, 225), a=0.13 * fl)


# ================================================================== scenes
def ks_hook(c, x):
    x.push, x.focus = 0.2, (W / 2, 1150)
    k = ramp(x.t, 0, x.dur)
    with layer(c, x, 0.2):
        jp_street(c, x, vy=1250, seed=1)
        utility_poles(c, x, 1250, seed=1)
        street_lamp(c, 760, 1300, x.T)
        masked_woman(c, 860, 1300, 0.7, T=x.T)            # already standing there in the first frame
    with layer(c, x, 0.6):
        for i in range(5):                                # kids walking home together, holding hands
            kx = 40 + 360 * k + i * 70
            school_kid(c, kx, 1560 + (i % 2) * 6, 2.0, phase=x.T * 6 + i * 0.4, seed=i)
            if i:
                c.drawLine(kx - 50, 1490, kx - 20, 1490, paint((60, 50, 50), stroke=5))
    with layer(c, x, 0.95):
        fog(c, x, 1500, a=0.15, speed=10, seed=2, color=(160, 160, 180), scale=1.4)


def ks_panic(c, x):
    x.push, x.focus = 0.12, (W / 2, 1150)
    with layer(c, x, 0.2):
        sky(c, top=(14, 16, 30), mid=(40, 40, 62), haze=(90, 80, 96), horizon=1200)
        # school building + gate
        c.drawRect(R(120, 820, 960, 1200), paint((60, 62, 70)))
        for r_ in range(3):
            for k in range(6):
                c.drawRect(R(170 + k * 130, 860 + r_ * 110, 240 + k * 130, 930 + r_ * 110), paint((30, 34, 44)))
        c.drawRect(R(500, 760, 580, 820), paint((60, 62, 70)))
        c.drawCircle(540, 790, 24, paint(CREAM, 0.8))
        c.drawRect(R(-500, 1200, 1600, 2600), paint((40, 40, 46)))
        c.drawRect(R(-100, 1150, 360, 1230), paint((70, 70, 76)))
        c.drawRect(R(720, 1150, 1200, 1230), paint((70, 70, 76)))
    with layer(c, x, 0.55):
        k = ramp(x.t, 0, x.dur)
        for i in range(8):                                # a long line of kids leaving through the gate
            school_kid(c, 380 + i * 55 - 120 * k, 1420 + i * 10, 1.7, phase=x.T * 5 + i, seed=i + 3)
        # police car sliding past with flashing light
        px = 1300 - 1700 * k
        c.drawRRect(skia.RRect.MakeRectXY(R(px - 160, 1560, px + 160, 1660), 20, 20), paint((230, 230, 234)))
        c.drawRect(R(px - 160, 1600, px + 160, 1660), paint((20, 20, 24)))
        c.drawRect(R(px - 70, 1520, px + 70, 1564), paint((30, 34, 44)))
        blink = (math.sin(x.T * 12) > 0)
        c.drawRect(R(px - 30, 1504, px + 30, 1522), paint((255, 40, 40)))
        if blink:
            glow(c, px, 1512, 500, (255, 40, 40), 0.4)
        for wx in (-100, 100):
            c.drawCircle(px + wx, 1668, 26, paint((10, 10, 12)))


def ks_title(c, x):
    x.push, x.focus = 0.16, (W / 2, 1150)
    with layer(c, x, 0.2):
        jp_street(c, x, vy=1350, seed=3)
        utility_poles(c, x, 1350, seed=3)
        street_lamp(c, 380, 1400, x.T, h=900)
    with layer(c, x, 0.6):
        masked_woman(c, 560, 1600, 2.2, T=x.T, eyes=ease(ramp(x.t, 0.4, 1.2)))
    with layer(c, x, 0.95):
        fog(c, x, 1650, a=0.15, speed=10, seed=3, color=(160, 160, 180), scale=1.4)


def ks_question(c, x):
    x.push, x.focus = 0.16, (W / 2, 900)
    tb = x.wt("beautiful", x.dur * 0.85)
    step = ease(ramp(x.t, 0.3, tb - 0.4))
    with layer(c, x, 0.2):
        c.drawRect(R(-500, -500, 1600, 2600), paint((6, 6, 10)))
        street_lamp(c, 300, 2100, x.T, h=1900)
    with layer(c, x, 0.6):
        masked_woman(c, 820 - 260 * step, 2400, 4.6, T=x.T, tilt=ease(ramp(x.t, tb - 0.2, tb + 0.6)), eyes=0.6)


def ks_no(c, x):
    x.push, x.focus = 0.2, (W / 2, 900)
    tl_ = x.wt("leave", x.dur * 0.85)
    nar = ease(ramp(x.t, 0.4, tl_))
    with layer(c, x, 0.6):
        c.drawRect(R(-500, -500, 1600, 2600), paint((6, 6, 10)))
        masked_woman(c, W / 2, 3620, 7.4, T=x.T, narrow=nar * 0.7, eyes=0.4 + 0.6 * nar)
        c.drawRect(R(-500, -500, 1600, 2600), paint((0, 0, 0), 0.45 * nar))


def ks_yes(c, x):
    x.push, x.focus = 0.2, (W / 2, 900)
    m_ = 1 - 0.35 * ease(ramp(x.t, x.dur * 0.4, x.dur))
    with layer(c, x, 0.6):
        c.drawRect(R(-500, -500, 1600, 2600), paint((6, 6, 10)))
        masked_woman(c, W / 2, 3620, 7.4, T=x.T, mask=m_, eyes=0.5)


def ks_smile(c, x):
    x.push, x.focus = 0.22, (W / 2, 900)
    te = x.wt("even", x.dur * 0.6)
    sm = ease(ramp(x.t, 0.0, 0.8))
    with layer(c, x, 0.6):
        c.drawRect(R(-500, -500, 1600, 2600), paint((6, 6, 10)))
        glow(c, W / 2, 1100, 700, (200, 210, 230), 0.12)
        masked_woman(c, W / 2, 3620, 7.4, T=x.T, mask=0.0, smile=sm, eyes=1.0,
                     tilt=ease(ramp(x.t, te - 0.2, te + 0.5)))
    x.shake = shake_amount(x.t, [0.1], strength=14)


def ks_like_her(c, x):
    x.push, x.focus = 0.16, (W / 2, 1000)
    tj = x.wt("just", x.dur * 0.7)
    k = ease(ramp(x.t, tj - 0.2, tj + 0.4))
    with layer(c, x, 0.5):
        # a dark shop window: your reflection - and a white mask appearing on your face
        c.drawRect(R(-500, -500, 1600, 2600), lin_paint(0, 0, 0, 1900, [(0, (10, 12, 18), 1), (1, (24, 26, 34), 1)]))
        c.drawRect(R(120, 300, 960, 1700), paint((30, 36, 48), 0.9))
        light_shaft(c, [(120, 300), (400, 300), (960, 1700), (700, 1700)], color=(200, 210, 230), a=0.08)
        c.drawPath(smooth_path([(380, 1700), (400, 1100), (540, 1000), (680, 1100), (700, 1700)]), paint((14, 14, 18)))
        c.drawCircle(540, 880, 150, paint((20, 20, 26)))
        if k > 0:
            c.drawPath(smooth_path([(440, 900), (640, 900), (630, 1000), (540, 1030), (450, 1000)]), paint(MASK, k))
        c.drawRect(R(120, 300, 960, 1700), paint((60, 60, 70), stroke=24))
    if x.t > tj:
        f = ease(ramp(x.t, tj, tj + 0.1)) * (1 - ramp(x.t, tj + 0.4, tj + 0.9))
        c.drawRect(R(-500, -500, 1600, 2600), paint((140, 0, 0), 0.35 * f))


def ks_corner(c, x):
    x.push, x.focus = 0.12, (W / 2, 1200)
    tw = x.wt("waiting", x.dur * 0.75)
    with layer(c, x, 0.2):
        jp_street(c, x, vy=1300, seed=5)
        utility_poles(c, x, 1300, seed=5, scroll=x.t * 300)
        vending(c, 860, 1500, 1.4, x.T)
    with layer(c, x, 0.6):
        rx = 100 + 520 * ease(ramp(x.t, 0.0, tw))
        traveler(c, rx, 1620, 1.0, phase=x.T * 10 * (x.t < tw), walking=x.t < tw, lantern=False, silhouette=0.6)
        a = ease(ramp(x.t, tw - 0.15, tw + 0.15))
        masked_woman(c, 860, 1620, 1.05, T=x.T, a=a, eyes=1.0)
    x.shake = shake_amount(x.t, [tw], strength=14)


def ks_escape(c, x):
    x.push, x.focus = 0.12, (W / 2, 1200)
    tr = x.wt("run", x.dur * 0.9)
    tv = x.wt("average", x.dur * 0.45)
    with layer(c, x, 0.2):
        jp_street(c, x, vy=1300, seed=6)
        utility_poles(c, x, 1300, seed=6)
        street_lamp(c, 600, 1350, x.T)
    with layer(c, x, 0.6):
        conf = ease(ramp(x.t, tv, tv + 0.5))
        jitter = math.sin(x.T * 30) * 4 * conf
        masked_woman(c, 700 + jitter, 1600, 1.05, T=x.T, tilt=conf * math.sin(x.T * 3), eyes=0.6)
        rx = 300 + 1200 * ease(ramp(x.t, tr - 0.3, x.dur + 0.4))
        traveler(c, rx, 1620, 1.0, phase=x.T * 12, walking=x.t > tr - 0.3, lantern=False, silhouette=0.6)


def ks_pov(c, x):
    x.push, x.focus = 0.2, (W / 2, 1150)
    k = ease(ramp(x.t, 0.3, x.dur))
    with layer(c, x, 0.2):
        jp_street(c, x, vy=1150, seed=7)
        utility_poles(c, x, 1150, seed=7)
        street_lamp(c, 560, 1180, x.T, h=700)
        vending(c, 80, 1250, 1.1, x.T)
    with layer(c, x, 0.5):
        masked_woman(c, 610, 1190 + 120 * k, 0.5 + 0.35 * k, T=x.T, eyes=0.7)


def ks_reveal(c, x):
    x.push, x.focus = 0.28, (W / 2, 900)
    tr = x.wt("think", 0.2) - 0.05
    c.drawRect(R(-400, -400, 1500, 2400), paint((5, 5, 7)))
    if x.t < tr:
        return
    k = ease(ramp(x.t, tr, tr + 0.12))
    x.shake = shake_amount(x.t, [tr], strength=24)
    with layer(c, x, 0.7, extra_scale=1.0 + 0.06 * (1 - k)):
        c.saveLayer(None, paint(a=k))
        masked_woman(c, W / 2, 4080, 8.6, T=x.T, mask=0.0, smile=1.0, eyes=1.0, tilt=0.4)
        c.drawRect(R(-500, -500, 1600, 2600), paint((90, 0, 0), 0.12))
        c.restore()


for _f in (ks_hook, ks_panic, ks_title, ks_question, ks_no, ks_yes, ks_smile, ks_like_her, ks_corner, ks_escape, ks_pov,
           ks_reveal):
    scenes.SCENES[_f.__name__] = _f


# ================================================================== sounds
SR = audio.SR


def _noise(n, seed=0):
    return np.random.default_rng(seed).standard_normal(n).astype(np.float32)


def school_chime():
    """Westminster-style chime used by Japanese schools."""
    notes = [329.6, 261.6, 293.7, 196.0, 196.0, 293.7, 329.6, 261.6]
    out = np.zeros(int(8.0 * SR), np.float32)
    for i, f in enumerate(notes):
        ln = int(2.0 * SR)
        t = np.arange(ln) / SR
        x = (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2.76 * f * t)) * np.exp(-t * 2.2) * 0.25
        a = int(i * 0.75 * SR)
        out[a:a + ln] += x[: len(out) - a]
    return audio.reverb(out, 0.45)


def jp_siren(length):
    n = int(length * SR)
    t = np.arange(n) / SR
    f = np.where((t * 1.3) % 1.0 < 0.5, 960.0, 770.0)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.12
    x = audio.filt(x.astype(np.float32), "band", (400, 3000))
    env = np.clip(t / 0.5, 0, 1) * np.clip((length - t) / 1.0, 0, 1)
    return np.stack([x * env * np.clip(1 - t / length, 0.2, 1), x * env * np.clip(t / length, 0.2, 1)], 1)


def insects(length, seed=3):
    n = int(length * SR)
    t = np.arange(n) / SR
    gate = (np.sin(2 * np.pi * 14 * t) > 0.3) * (np.sin(2 * np.pi * 0.17 * t) > -0.2)
    x = np.sin(2 * np.pi * 4600 * t) * gate * 0.015 + audio.filt(_noise(n, seed), "band", (3500, 7000)) * 0.006
    return audio.stereo(x.astype(np.float32))


def _at(s, word, frac=0.5):
    return s["start"] + s["words"].get(word, (s["end"] - s["start"]) * frac)


def _steps(m, t0, t1, rate, gain, heavy=0.0):
    k = t0
    while k < t1:
        m.add(k, audio.footstep(heavy), gain)
        k += 1 / rate


def _sfx_hook(m, s, tl):
    m.add(0.0, insects(tl["story_end"] + 0.5), 0.8)
    _steps(m, s["start"] + 0.2, s["end"], 4.0, 0.15)


def _sfx_panic(m, s, tl):
    m.add(s["start"] + 0.1, school_chime(), 0.6)
    m.add(s["start"] + 1.5, jp_siren(s["end"] - s["start"] - 1.0), 0.8)


def _sfx_question(m, s, tl):
    m.add(_at(s, "beautiful", 0.85) - 0.1, audio.sting(2.0), 0.9)
    return [(_at(s, "beautiful", 0.85) - 0.3, s["end"] + 0.2, 0.3)]


def _sfx_smile(m, s, tl):
    m.add(s["start"] + 0.05, audio.hit(2.5), 0.8)


def _sfx_corner(m, s, tl):
    tw = _at(s, "waiting", 0.75)
    _steps(m, s["start"], tw, 5.0, 0.4)
    m.add(tw, audio.sting(1.6), 0.9)


def _sfx_escape(m, s, tl):
    _steps(m, _at(s, "run", 0.9) - 0.3, s["end"] + 0.3, 5.5, 0.45)


def _sfx_pov(m, s, tl):
    _steps(m, s["start"] + 0.2, s["end"] - 0.4, 2.0, 0.25)


audio.SFX.update({"ks_hook": _sfx_hook, "ks_panic": _sfx_panic, "ks_question": _sfx_question, "ks_smile": _sfx_smile,
                  "ks_corner": _sfx_corner, "ks_escape": _sfx_escape, "ks_pov": _sfx_pov})
