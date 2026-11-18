"""Drawing primitives, lighting and characters (flat 2D vector style)."""
import math
import os
from contextlib import contextmanager

import numpy as np
import skia

W, H = 1080, 1920
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_DIR = os.path.join(HERE, "assets", "fonts")

# ---------------------------------------------------------------- palette
SKY_TOP = (11, 12, 20)
SKY_MID = (27, 29, 46)
SKY_HAZE = (58, 54, 72)
MOON = (236, 224, 196)
MOON_WARM = (238, 196, 150)
SIL = (9, 10, 14)
GROUND = (15, 16, 22)
CREAM = (239, 230, 210)
RED = (204, 52, 56)
LANTERN = (255, 176, 92)
SKIN = (186, 140, 108)
SKIN_LIT = (226, 164, 112)
SKIN_DARK = (92, 64, 54)
COAT = (72, 57, 47)
COAT_DARK = (40, 32, 29)
HAT = (30, 27, 29)
BEAST = (13, 13, 17)
BEAST_RIM = (78, 80, 100)
EYE = (246, 236, 196)


def col(rgb, a=1.0):
    return skia.ColorSetARGB(int(max(0, min(1, a)) * 255), int(rgb[0]), int(rgb[1]), int(rgb[2]))


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def paint(rgb=(255, 255, 255), a=1.0, blur=0.0, stroke=0.0, blend=None, cap_round=False):
    p = skia.Paint(AntiAlias=True)
    p.setColor(col(rgb, a))
    if blur > 0:
        p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    if stroke > 0:
        p.setStyle(skia.Paint.kStroke_Style)
        p.setStrokeWidth(stroke)
        if cap_round:
            p.setStrokeCap(skia.Paint.kRound_Cap)
            p.setStrokeJoin(skia.Paint.kRound_Join)
    if blend is not None:
        p.setBlendMode(blend)
    return p


def lin_paint(x0, y0, x1, y1, stops, blend=None):
    """stops: list of (pos, rgb, alpha)"""
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeLinear(
        [skia.Point(x0, y0), skia.Point(x1, y1)],
        [col(s[1], s[2]) for s in stops], [s[0] for s in stops]))
    if blend is not None:
        p.setBlendMode(blend)
    return p


def rad_paint(cx, cy, r, stops, blend=None):
    p = skia.Paint(AntiAlias=True)
    p.setShader(skia.GradientShader.MakeRadial(
        skia.Point(cx, cy), max(1.0, r),
        [col(s[1], s[2]) for s in stops], [s[0] for s in stops]))
    if blend is not None:
        p.setBlendMode(blend)
    return p


def R(l, t, r, b):
    return skia.Rect.MakeLTRB(l, t, r, b)


def poly(pts, close=True):
    p = skia.Path()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    if close:
        p.close()
    return p


def smooth_path(pts, close=True):
    """Catmull-Rom through points -> smooth organic shape."""
    p = skia.Path()
    n = len(pts)
    p.moveTo(*pts[0])
    rng = range(n) if close else range(n - 1)
    for i in rng:
        p0 = pts[(i - 1) % n] if (close or i > 0) else pts[i]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (close or i + 2 < n) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        p.cubicTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    if close:
        p.close()
    return p


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def ramp(t, t0, t1):
    if t1 <= t0:
        return 1.0 if t >= t0 else 0.0
    return max(0.0, min(1.0, (t - t0) / (t1 - t0)))


_fonts = {}


def font(name, size):
    key = (name, size)
    if key not in _fonts:
        tf = skia.Typeface.MakeFromFile(os.path.join(FONT_DIR, name))
        f = skia.Font(tf, size)
        f.setSubpixel(True)
        f.setEdging(skia.Font.Edging.kAntiAlias)
        _fonts[key] = f
    return _fonts[key]


def text_width(s, f, spacing=0.0):
    if spacing == 0:
        return f.measureText(s)
    return sum(f.measureText(ch) for ch in s) + spacing * (len(s) - 1)


def draw_text(c, s, x, y, f, p, spacing=0.0, align="left"):
    w = text_width(s, f, spacing)
    if align == "center":
        x -= w / 2
    elif align == "right":
        x -= w
    if spacing == 0:
        c.drawString(s, x, y, f, p)
    else:
        for ch in s:
            c.drawString(ch, x, y, f, p)
            x += f.measureText(ch) + spacing
    return w


# ---------------------------------------------------------------- camera
class Ctx:
    """Per-frame scene context."""

    def __init__(self, t, dur, T, words, push=0.08, focus=(W / 2, H * 0.45), seed=0):
        self.t, self.dur, self.T = t, dur, T
        self.p = t / dur if dur > 0 else 0
        self.words = words          # {normalized word: local time}
        self.push = push
        self.focus = focus
        self.shake = (0.0, 0.0)
        self.rng = np.random.default_rng(seed)

    def wt(self, word, default=None):
        """local time at which `word` is spoken in this scene"""
        if word in self.words:
            return self.words[word]
        return self.dur * 0.5 if default is None else default

    @property
    def zoom(self):
        return self.push * (0.25 + 0.75 * self.p)


@contextmanager
def layer(c, ctx, depth=0.5, extra_scale=1.0):
    """Parallax layer: deeper layers (depth->0) push in less than near ones."""
    c.save()
    s = (1 + ctx.zoom * (0.35 + 0.9 * depth)) * extra_scale
    fx, fy = ctx.focus
    sx, sy = ctx.shake
    c.translate(fx + sx * (0.4 + depth), fy + sy * (0.4 + depth))
    c.scale(s, s)
    c.translate(-fx, -fy)
    try:
        yield
    finally:
        c.restore()


def shake_amount(t, events, strength=18.0, decay=7.0):
    """Camera shake impulses at given local times."""
    sx = sy = 0.0
    for e in events:
        if t >= e:
            k = math.exp(-(t - e) * decay)
            sx += math.sin((t - e) * 61.0) * strength * k
            sy += math.cos((t - e) * 53.0) * strength * k
    return sx, sy


# ---------------------------------------------------------------- environment
def sky(c, top=SKY_TOP, mid=SKY_MID, haze=SKY_HAZE, horizon=1150):
    c.drawRect(R(-400, -400, W + 400, H + 400), lin_paint(0, 0, 0, horizon, [
        (0.0, top, 1), (0.55, mid, 1), (1.0, haze, 1)]))


def stars(c, ctx, n=70, ymax=900, seed=3):
    rng = np.random.default_rng(seed)
    xs = rng.uniform(-100, W + 100, n)
    ys = rng.uniform(-100, ymax, n) ** 1.0
    rs = rng.uniform(0.8, 2.3, n)
    ph = rng.uniform(0, 6.28, n)
    for x, y, r, f in zip(xs, ys, rs, ph):
        a = 0.25 + 0.35 * (0.5 + 0.5 * math.sin(ctx.T * 1.7 + f))
        c.drawCircle(x, y, r, paint(CREAM, a * (1 - y / (ymax + 200))))


def moon(c, x, y, r, color=MOON, glow=1.0, craters=True):
    c.drawCircle(x, y, r * 3.4, rad_paint(x, y, r * 3.4, [
        (0.0, color, 0.42 * glow), (0.3, color, 0.13 * glow), (1.0, color, 0.0)]))
    c.drawCircle(x, y, r, lin_paint(x - r, y - r, x + r, y + r, [
        (0, mix(color, (255, 255, 255), 0.15), 1), (1, mix(color, (150, 130, 120), 0.18), 1)]))
    if craters:
        for dx, dy, rr in [(-0.35, -0.2, 0.18), (0.25, 0.3, 0.12), (0.3, -0.35, 0.08),
                           (-0.1, 0.42, 0.1), (0.05, 0.0, 0.07)]:
            c.drawCircle(x + dx * r, y + dy * r, rr * r, paint((120, 105, 100), 0.06))


def haze(c, y0, y1, color=SKY_HAZE, a=0.5):
    m = (y0 + y1) / 2
    c.drawRect(R(-400, y0, W + 400, y1), lin_paint(0, y0, 0, y1, [
        (0, color, 0), (0.5, color, a), (1, color, 0)]))
    _ = m


def pine_path(x, by, h, w, tiers=5, seed=0):
    rng = np.random.default_rng(seed)
    top = by - h
    right, left = [], []
    for i in range(1, tiers + 1):
        f = i / tiers
        yo = top + h * 0.88 * f
        half = w / 2 * (0.25 + 0.75 * f) * rng.uniform(0.85, 1.1)
        right += [(x + half, yo), (x + half * 0.35, yo - h * 0.05)]
        left += [(x - half * rng.uniform(0.9, 1.05), yo), (x - half * 0.35, yo - h * 0.05)]
    right = right[:-1]
    left = left[:-1]
    tw = max(2.0, w * 0.05)
    pts = [(x, top)] + right + [(x + tw, right[-1][1]), (x + tw, by + 4), (x - tw, by + 4),
                                (x - tw, left[-1][1])] + left[::-1]
    return poly(pts)


def forest_row(c, y, n, hmin, hmax, color, seed, x0=-250, x1=W + 250, a=1.0, wr=0.42, gap=None):
    rng = np.random.default_rng(seed)
    xs = np.sort(rng.uniform(x0, x1, n))
    p = paint(color, a)
    for i, x in enumerate(xs):
        if gap and gap[0] < x < gap[1]:
            continue
        h = rng.uniform(hmin, hmax)
        c.drawPath(pine_path(x, y + rng.uniform(-6, 6), h, h * wr * rng.uniform(0.85, 1.2),
                             tiers=int(rng.integers(4, 7)), seed=seed * 100 + i), p)
    c.drawRect(R(x0, y, x1, y + 900), p)


def hills(c, y, amp, color, seed, a=1.0, bottom=H + 600):
    rng = np.random.default_rng(seed)
    xs = np.linspace(-500, W + 500, 9)
    pts = [(x, y + rng.uniform(-amp, amp)) for x in xs]
    path = skia.Path()
    path.moveTo(-600, bottom)
    path.lineTo(-600, pts[0][1])
    sp = smooth_path(pts, close=False)
    path.addPath(sp, skia.Path.kExtend_AddPathMode)
    path.lineTo(W + 600, bottom)
    path.close()
    c.drawPath(path, paint(color, a))


def road(c, vx, vy, bottom_w=1500, top_w=24, color=(30, 30, 38), edge=(46, 45, 56), ybot=H + 300):
    pts = [(vx - top_w / 2, vy), (vx + top_w / 2, vy), (vx + bottom_w / 2, ybot), (vx - bottom_w / 2, ybot)]
    c.drawPath(poly(pts), lin_paint(0, vy, 0, ybot, [(0, edge, 1), (0.35, color, 1), (1, mix(color, (0, 0, 0), 0.4), 1)]))


_fog_cache = {}


def fog_image(seed=1, w=2400, h=520, blobs=46):
    if seed in _fog_cache:
        return _fog_cache[seed]
    from scipy.ndimage import gaussian_filter
    rng = np.random.default_rng(seed)
    a = np.zeros((h // 4, w // 4), np.float32)
    for _ in range(blobs):
        cx, cy = rng.uniform(0, w // 4), rng.uniform(h // 16, h // 4 - h // 16)
        r = rng.uniform(10, 34)
        yy, xx = np.ogrid[:a.shape[0], :a.shape[1]]
        for off in (-w // 4, 0, w // 4):  # tileable
            a += np.exp(-(((xx - cx - off) ** 2) / (2 * (r * 2.2) ** 2) + ((yy - cy) ** 2) / (2 * r ** 2)))
    a = gaussian_filter(a, 6, mode="wrap")
    a = a / a.max()
    a = np.kron(a, np.ones((4, 4), np.float32))
    a = gaussian_filter(a, 3)
    img = np.zeros((h, w, 4), np.uint8)
    img[..., 0:3] = 255
    img[..., 3] = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    im = skia.Image.fromarray(img, colorType=skia.kRGBA_8888_ColorType)
    _fog_cache[seed] = im
    return im


def fog(c, ctx, y, a=0.25, speed=12.0, color=(150, 145, 170), seed=1, scale=1.0):
    im = fog_image(seed)
    w, h = im.width() * scale, im.height() * scale
    off = -((ctx.T * speed) % w)
    p = skia.Paint(AntiAlias=True)
    p.setColorFilter(skia.ColorFilters.Blend(col(color, 1), skia.BlendMode.kSrcIn))
    p.setAlphaf(a)
    for k in range(-1, 2):
        c.drawImageRect(im, R(off + k * w, y - h / 2, off + (k + 1) * w, y + h / 2),
                        skia.SamplingOptions(skia.FilterMode.kLinear), p)


def glow(c, x, y, r, color=LANTERN, a=0.5):
    c.drawCircle(x, y, r, rad_paint(x, y, r, [(0, color, a), (0.25, color, a * 0.45), (1, color, 0)],
                                    blend=skia.BlendMode.kScreen))


def light_shaft(c, pts, color=(200, 205, 230), a=0.12, blur=18):
    p = lin_paint(pts[0][0], pts[0][1], pts[2][0], pts[2][1], [(0, color, a), (1, color, 0)])
    p.setMaskFilter(skia.MaskFilter.MakeBlur(skia.kNormal_BlurStyle, blur))
    p.setBlendMode(skia.BlendMode.kScreen)
    c.drawPath(poly(pts), p)


def wayside_cross(c, x, by, s=1.0, color=(24, 22, 24), rim=(70, 68, 84)):
    c.save()
    c.translate(x, by)
    c.scale(s, s)
    for off, colr in ((3, rim), (0, color)):
        p = paint(colr)
        c.save()
        c.translate(-off, 0)
        c.drawRect(R(-9, -330, 9, 0), p)
        c.drawRect(R(-75, -255, 75, -237), p)
        c.drawPath(poly([(-50, -330), (0, -372), (50, -330), (40, -326), (0, -358), (-40, -326)]), p)
        c.restore()
    # tiny figure on cross
    c.drawRect(R(-4, -248, 4, -210), paint((48, 44, 46)))
    c.drawCircle(0, -256, 6, paint((48, 44, 46)))
    c.restore()


def fur_path(cx, cy, rx, ry, rng, spikes=34, jit=0.12, start=0.0, end=2 * math.pi):
    pts = []
    for i in range(spikes):
        a = start + (end - start) * i / spikes
        k = 1 + (jit if i % 2 == 0 else -jit * 0.6) * rng.uniform(0.4, 1.0)
        pts.append((cx + math.cos(a) * rx * k, cy + math.sin(a) * ry * k))
    return poly(pts)


# ---------------------------------------------------------------- characters
def _limb(c, x0, y0, a1, l1, a2, l2, w, colr):
    """two-segment limb, angles in degrees from straight down (positive = forward/right)."""
    p = paint(colr, stroke=w, cap_round=True)
    x1 = x0 + math.sin(math.radians(a1)) * l1
    y1 = y0 + math.cos(math.radians(a1)) * l1
    x2 = x1 + math.sin(math.radians(a2)) * l2
    y2 = y1 + math.cos(math.radians(a2)) * l2
    path = skia.Path()
    path.moveTo(x0, y0)
    path.lineTo(x1, y1)
    path.lineTo(x2, y2)
    c.drawPath(path, p)
    return x2, y2


def traveler(c, x, y, s, phase=0.0, walking=True, lantern=True, hunch=0.0, kneel=0.0,
             look=0.0, lantern_a=1.0, flicker=1.0, silhouette=0.0):
    """Side view, facing right. Feet at (x,y). Height ~330*s.
    silhouette: 0..1 -> blend toward pure dark silhouette."""
    def C(rgb):
        return mix(rgb, SIL, silhouette)
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    sw = math.sin(phase) * (28 if walking else 0)
    hip_y = -135 + kneel * 70
    # legs
    for side, colr in ((-1, (28, 25, 28)), (1, (40, 35, 38))):
        if kneel > 0.01:
            a1 = (-10 + 75 * kneel) if side > 0 else (10 - 5 * kneel)
            a2 = (-10 - 80 * kneel) if side > 0 else (-90 * kneel)
        else:
            a1 = sw * side
            a2 = sw * side - (abs(math.sin(phase)) * 20 if walking else 0)
        fx, fy = _limb(c, 0, hip_y, a1, 70, a2, 70 - kneel * 15, 24, C(colr))
        c.drawOval(R(fx - 10, fy - 9, fx + 22, fy + 5), paint(C((22, 19, 20))))
    # upper body (rotates forward around hip for hunch)
    c.save()
    c.rotate(hunch * 38, 0, hip_y)
    c.translate(0, hip_y + 135)
    coat = smooth_path([(-30, -252), (6, -258), (32, -248), (40, -180), (50, -96), (2, -88),
                        (-54, -92), (-44, -180)])
    c.drawPath(coat, lin_paint(-55, 0, 50, 0, [(0, C(COAT_DARK), 1), (1, C(COAT), 1)]))
    c.drawRect(R(-46, -150, 44, -140), paint(C((30, 24, 22))))
    # head
    c.drawRect(R(-6, -270, 14, -250), paint(C(SKIN_DARK)))
    c.drawCircle(6, -284, 26, paint(C(SKIN)))
    c.save()
    c.clipPath(skia.Path().addCircle(6, -284, 26), doAntiAlias=True)
    c.drawRect(R(-30, -320, 2 - look * 8, -250), paint(C(SKIN_DARK), 0.85))
    c.restore()
    c.drawPath(poly([(30, -290), (39, -279), (30, -276)]), paint(C(SKIN)))
    c.drawCircle(20 + look * 2, -289, 3.2, paint(C((25, 20, 20))))
    # hat
    c.drawRRect(skia.RRect.MakeRectXY(R(-20, -322, 30, -296), 6, 6), paint(C(HAT)))
    c.drawOval(R(-38, -302, 50, -290), paint(C(HAT)))
    c.drawRect(R(-20, -304, 30, -298), paint(C((60, 40, 36))))
    # arm + lantern
    swing = math.sin(phase) * (10 if walking else 0)
    hx, hy = _limb(c, 12, -238, 30 + swing, 52, 10 + swing, 48, 20, C(COAT))
    if lantern:
        ly = hy + 34
        c.drawLine(hx, hy, hx, ly - 16, paint((20, 18, 18), stroke=2.5))
        if lantern_a > 0:
            glow(c, hx, ly, 230, LANTERN, 0.38 * lantern_a * flicker)
            glow(c, hx, ly, 70, (255, 214, 150), 0.5 * lantern_a * flicker)
        c.drawRRect(skia.RRect.MakeRectXY(R(hx - 11, ly - 16, hx + 11, ly + 14), 3, 3), paint((30, 24, 20)))
        c.drawRect(R(hx - 7, ly - 11, hx + 7, ly + 9),
                   paint(mix((80, 50, 30), (255, 210, 140), lantern_a * flicker)))
    c.restore()
    c.restore()


def beast_riding(c, x, y, s, t=0.0, eyes=1.0, size=1.0, alpha=1.0, rng_seed=7):
    """Hunched creature clinging to a back. (x,y) = point between the shoulders."""
    rng = np.random.default_rng(rng_seed)
    c.save()
    c.translate(x, y)
    c.scale(s * size, s * size)
    if alpha < 1:
        c.saveLayer(None, paint(a=alpha))
    breathe = math.sin(t * 2.4) * 3
    body = fur_path(-30, -40 + breathe, 64, 58, rng, spikes=40, jit=0.16)
    head = fur_path(18, -112 + breathe, 34, 30, rng, spikes=24, jit=0.18)
    for off, colr in ((4, BEAST_RIM), (0, BEAST)):
        c.save()
        c.translate(-off, -off * 0.5)
        c.drawPath(body, paint(colr))
        c.drawPath(head, paint(colr))
        # ears
        c.drawPath(poly([(0, -130 + breathe), (-14, -170 + breathe), (12, -138 + breathe)]), paint(colr))
        c.drawPath(poly([(30, -136 + breathe), (44, -172 + breathe), (46, -126 + breathe)]), paint(colr))
        c.restore()
    # arms wrapped forward around neck
    arm = paint(BEAST, stroke=11, cap_round=True)
    pth = skia.Path()
    pth.moveTo(10, -60)
    pth.cubicTo(50, -70, 70, -40, 60, -12)
    c.drawPath(pth, arm)
    for k in range(3):
        c.drawLine(60, -12, 68 + k * 5, 6 + k * 2, paint((30, 30, 38), stroke=4, cap_round=True))
    if eyes > 0:
        for ex in (12, 32):
            glow(c, ex, -114 + breathe, 30, EYE, 0.55 * eyes)
            c.drawOval(R(ex - 6, -118 + breathe, ex + 6, -110 + breathe), paint(EYE, eyes))
    if alpha < 1:
        c.restore()
    c.restore()


def beast_crouch(c, x, y, s, t=0.0, eyes=1.0, blink=0.0, seed=11):
    """Crouching creature on the ground, facing left/forward. (x,y)=feet."""
    rng = np.random.default_rng(seed)
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    br = math.sin(t * 2.0) * 4
    body = fur_path(0, -150 + br, 95, 110, rng, spikes=50, jit=0.13)
    knee_l = fur_path(-60, -70, 42, 60, rng, spikes=20, jit=0.12)
    knee_r = fur_path(62, -70, 42, 60, rng, spikes=20, jit=0.12)
    head = fur_path(-12, -268 + br, 58, 52, rng, spikes=30, jit=0.16)
    for off, colr in ((5, BEAST_RIM), (0, BEAST)):
        c.save()
        c.translate(off, -off * 0.6)
        for pth in (body, knee_l, knee_r, head):
            c.drawPath(pth, paint(colr))
        c.drawPath(poly([(-40, -300 + br), (-78, -362 + br), (-22, -312 + br)]), paint(colr))
        c.drawPath(poly([(18, -306 + br), (40, -366 + br), (40, -290 + br)]), paint(colr))
        c.restore()
    # long dangling arms
    for sx in (-1, 1):
        pth = skia.Path()
        pth.moveTo(sx * 70, -200 + br)
        pth.cubicTo(sx * 120, -150, sx * 110, -60, sx * 95, 0)
        c.drawPath(pth, paint(BEAST, stroke=16, cap_round=True))
        for k in range(4):
            c.drawLine(sx * 95, 0, sx * (85 + k * 9), 18 + (k % 2) * 4,
                       paint((26, 26, 32), stroke=5, cap_round=True))
    if eyes > 0:
        ey = -272 + br
        h = 7 * (1 - blink)
        for ex in (-36, 10):
            glow(c, ex, ey, 50, EYE, 0.6 * eyes)
            c.drawOval(R(ex - 10, ey - h, ex + 10, ey + h), paint(EYE, eyes))
    c.restore()


def eyes_pair(c, x, y, size, a=1.0, blink=0.0, color=EYE, gap=2.6):
    h = size * 0.55 * (1 - blink)
    for ex in (x - size * gap / 2, x + size * gap / 2):
        glow(c, ex, y, size * 5, color, 0.45 * a)
        c.drawOval(R(ex - size, y - h, ex + size, y + h), paint(color, a))
