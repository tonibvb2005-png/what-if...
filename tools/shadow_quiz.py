#!/usr/bin/env python3
"""Generate a 9:16 kids quiz Short: "Wer versteckt sich hier?" (shadow guessing game).

Everything is produced locally: graphics with Pillow (Noto Color Emoji for the
animals), music and sound effects synthesized with numpy, muxed with ffmpeg.

Usage: python3 tools/shadow_quiz.py out.mp4
Edit ROUNDS to make new episodes.
"""
import math
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, FPS = 1080, 1920, 30
SR = 44100
EMOJI_FONT = "/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf"
TEXT_FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"

ROUNDS = [
    ("🐘", "Ein ELEFANT!", (255, 214, 102)),
    ("🦩", "Ein FLAMINGO!", (255, 176, 200)),
    ("🐢", "Eine SCHILDKRÖTE!", (150, 225, 170)),
]

INTRO = 2.0          # hook
GUESS = 4.0          # silhouette + countdown (last 3 s)
REVEAL = 2.2         # colour reveal
OUTRO = 2.5
ROUND_LEN = GUESS + REVEAL
TOTAL = INTRO + ROUND_LEN * len(ROUNDS) + OUTRO

_font_cache = {}


def font(size):
    if size not in _font_cache:
        _font_cache[size] = ImageFont.truetype(TEXT_FONT, size)
    return _font_cache[size]


def render_emoji(ch, size):
    f = ImageFont.truetype(EMOJI_FONT, 109)
    img = Image.new("RGBA", (160, 160), (0, 0, 0, 0))
    ImageDraw.Draw(img).text((80, 80), ch, font=f, embedded_color=True, anchor="mm")
    img = img.crop(img.getbbox())
    scale = size / max(img.size)
    return img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)


def silhouette(img, color=(40, 30, 70)):
    a = img.getchannel("A")
    s = Image.new("RGBA", img.size, color + (0,))
    s.putalpha(a)
    return s


def ease_out_back(t):
    c1, c3 = 1.70158, 2.70158
    t = min(max(t, 0), 1)
    return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2


def gradient(top, bottom):
    arr = np.zeros((H, W, 3), np.uint8)
    for i in range(3):
        arr[..., i] = np.linspace(top[i], bottom[i], H)[:, None]
    return Image.fromarray(arr, "RGB")


def outlined_text(draw, xy, text, size, fill=(255, 255, 255), stroke=(60, 40, 110)):
    draw.text(xy, text, font=font(size), fill=fill, anchor="mm",
              stroke_width=max(6, size // 10), stroke_fill=stroke)


def fit_size(text, max_w, start):
    s = start
    while s > 40 and font(s).getlength(text) > max_w:
        s -= 4
    return s


def paste_center(base, img, cx, cy, scale=1.0, angle=0.0):
    if scale != 1.0:
        img = img.resize((max(1, int(img.width * scale)), max(1, int(img.height * scale))), Image.LANCZOS)
    if angle:
        img = img.rotate(angle, resample=Image.BICUBIC, expand=True)
    base.alpha_composite(img, (int(cx - img.width / 2), int(cy - img.height / 2)))


def sparkles(draw, t, cx, cy, seed):
    rng = np.random.default_rng(seed)
    for _ in range(26):
        ang = rng.uniform(0, 2 * math.pi)
        speed = rng.uniform(380, 820)
        r = speed * t
        x, y = cx + math.cos(ang) * r, cy + math.sin(ang) * r + 300 * t * t
        size = max(0, rng.uniform(14, 30) * (1 - t))
        col = tuple(int(c) for c in rng.choice([[255, 230, 80], [255, 120, 160], [120, 200, 255], [255, 255, 255]]))
        if size > 0:
            draw.regular_polygon((x, y, size), 5, rotation=r, fill=col)


def frame(t, bg, sprites):
    img = bg.copy().convert("RGBA")
    d = ImageDraw.Draw(img)
    # floating background dots
    for i in range(14):
        x = (i * 173 + t * 40 * (1 + i % 3)) % (W + 200) - 100
        y = (i * 311) % H + math.sin(t * 1.3 + i) * 30
        d.ellipse((x - 26, y - 26, x + 26, y + 26), fill=(255, 255, 255, 50))

    if t < INTRO:
        k = ease_out_back(t / 0.6)
        outlined_text(d, (W / 2, 640), "Wer versteckt", int(130 * k) or 1)
        outlined_text(d, (W / 2, 800), "sich hier?", int(150 * k) or 1, fill=(255, 230, 90))
        paste_center(img, sprites["magnifier"], W / 2, 1180 + math.sin(t * 6) * 25, angle=math.sin(t * 4) * 12)
        outlined_text(d, (W / 2, 1500), "Rate mit!", 90)
        return img

    t2 = t - INTRO
    r = int(t2 // ROUND_LEN)
    if r < len(ROUNDS):
        tr = t2 - r * ROUND_LEN
        emoji, name, col = ROUNDS[r]
        color_img, shadow_img = sprites[r]
        outlined_text(d, (W / 2, 250), f"Rätsel {r + 1} von {len(ROUNDS)}", 70, fill=(255, 230, 90))
        # spotlight disc
        d.ellipse((W / 2 - 430, 960 - 430, W / 2 + 430, 960 + 430), fill=col + (255,))
        if tr < GUESS:
            k = ease_out_back(tr / 0.5)
            wob = math.sin(tr * 5) * 4
            paste_center(img, shadow_img, W / 2, 960, scale=max(k, 0.01), angle=wob)
            outlined_text(d, (W / 2, 1560), "Wer ist das?", 120)
            cd = GUESS - tr
            if cd <= 3:
                n = math.ceil(cd)
                frac = cd - math.floor(cd) if cd != math.floor(cd) else 1
                s = int(150 + 60 * frac)
                d.ellipse((W / 2 - 110, 1760 - 110, W / 2 + 110, 1760 + 110), fill=(255, 90, 120))
                outlined_text(d, (W / 2, 1760), str(n), s)
        else:
            tv = tr - GUESS
            k = ease_out_back(tv / 0.45)
            paste_center(img, color_img, W / 2, 960 - abs(math.sin(tv * 7)) * 40 * max(0, 1 - tv),
                         scale=0.9 + 0.1 * k)
            sparkles(d, min(tv / 1.2, 1), W / 2, 960, r)
            size = fit_size(name, W - 100, 130)
            outlined_text(d, (W / 2, 1560), name, int(size * min(k, 1.1)) or 1, fill=(255, 230, 90))
        return img

    to = t2 - len(ROUNDS) * ROUND_LEN
    k = ease_out_back(to / 0.6)
    outlined_text(d, (W / 2, 620), "Wie viele hattest", int(110 * k) or 1)
    outlined_text(d, (W / 2, 760), "du richtig?", int(130 * k) or 1, fill=(255, 230, 90))
    for i, (_, _, col) in enumerate(ROUNDS):
        cx = W / 2 + (i - 1) * 300
        d.ellipse((cx - 130, 1100 - 130, cx + 130, 1100 + 130), fill=col)
        paste_center(img, sprites[i][0], cx, 1100 + math.sin(to * 5 + i) * 18, scale=0.38)
    outlined_text(d, (W / 2, 1500), "Nochmal raten?", 100)
    return img


# ---------------------------------------------------------------- audio ----

def tone(freq, dur, amp=0.3, decay=6.0, harmonics=(1, 0.5, 0.25)):
    t = np.arange(int(SR * dur)) / SR
    sig = sum(a * np.sin(2 * math.pi * freq * m * t) for m, a in zip((1, 2, 3), harmonics))
    env = np.exp(-decay * t) * np.minimum(1, t * 200)
    return amp * sig * env


def add(buf, sig, start):
    i = int(start * SR)
    j = min(len(buf), i + len(sig))
    if i < len(buf):
        buf[i:j] += sig[: j - i]


def midi(n):
    return 440 * 2 ** ((n - 69) / 12)


def build_audio(path):
    buf = np.zeros(int(SR * TOTAL) + SR)
    bpm = 112
    beat = 60 / bpm
    # C major pentatonic marimba melody + bass, loops for whole video
    melody = [72, 76, 79, 76, 81, 79, 76, 74, 72, 74, 76, 79, 76, 74, 72, None]
    bass = [48, 48, 55, 55, 53, 53, 55, 55]
    nb = int(TOTAL / beat)
    for b in range(nb):
        m = melody[b % len(melody)]
        if m:
            add(buf, tone(midi(m), 0.5, 0.11, 7), b * beat)
        if b % 2 == 0:
            add(buf, tone(midi(bass[(b // 2) % len(bass)]), 0.9, 0.12, 3, (1, 0.2, 0.05)), b * beat)
        # soft shaker on offbeats
        n = np.random.default_rng(b).normal(0, 1, int(SR * 0.05)) * np.exp(-np.arange(int(SR * 0.05)) / SR * 80)
        add(buf, 0.03 * n, b * beat + beat / 2)

    def chime(at):
        for i, n in enumerate([72, 76, 79, 84, 88]):
            add(buf, tone(midi(n), 0.8, 0.16, 4), at + i * 0.06)

    def tick(at):
        add(buf, tone(1800, 0.08, 0.25, 60, (1, 0.3, 0)), at)

    def boing(at):
        t = np.arange(int(SR * 0.35)) / SR
        f = 300 + 500 * t / 0.35
        add(buf, 0.2 * np.sin(2 * math.pi * np.cumsum(f) / SR) * np.exp(-t * 8), at)

    boing(0.05)
    for r in range(len(ROUNDS)):
        s = INTRO + r * ROUND_LEN
        boing(s)
        for k in range(3):
            tick(s + GUESS - 3 + k)
        chime(s + GUESS)
    chime(INTRO + len(ROUNDS) * ROUND_LEN)

    buf = buf[: int(SR * TOTAL)]
    # fade edges so the loop is smooth
    fade = int(SR * 0.3)
    buf[:fade] *= np.linspace(0, 1, fade)
    buf[-fade:] *= np.linspace(1, 0, fade)
    buf = buf / max(1e-6, np.abs(buf).max()) * 0.85
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())


def main(out):
    bg = gradient((120, 190, 255), (190, 140, 255))
    sprites = {}
    for i, (emoji, _, _) in enumerate(ROUNDS):
        c = render_emoji(emoji, 620)
        sprites[i] = (c, silhouette(c))
    sprites["magnifier"] = render_emoji("🔍", 360)

    wav = out + ".wav"
    build_audio(wav)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(int(TOTAL * FPS)):
        p.stdin.write(frame(f / FPS, bg, sprites).convert("RGB").tobytes())
    p.stdin.close()
    p.wait()
    import os
    os.remove(wav)
    print(f"wrote {out} ({TOTAL:.1f}s)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "short.mp4")
