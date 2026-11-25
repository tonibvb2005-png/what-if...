#!/usr/bin/env python3
"""Counting-song Short with the channel's own character "Bommel".

Bommel is drawn entirely in code (no third-party characters). Objects to count
come from Noto Color Emoji. Music is synthesized; lyrics are shown karaoke-style
so kids can sing along (a sung voice track can be mixed in later).

Usage: python3 tools/counting_song.py out.mp4 [theme]
Themes: sterne, enten, aepfel, ballons, schneeflocken
"""
import math
import os
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(__file__))
from shadow_quiz import (W, H, FPS, SR, add, ease_out_back, font, gradient, midi,  # noqa: E402
                         outlined_text, paste_center, render_emoji, tone)

THEMES = {
    # emoji, singular phrase, plural noun, background top/bottom
    "sterne": ("⭐", "Ein Stern", "Sterne", (40, 50, 120), (120, 80, 170)),
    "enten": ("🦆", "Eine Ente", "Enten", (110, 200, 255), (150, 230, 200)),
    "aepfel": ("🍎", "Ein Apfel", "Äpfel", (255, 225, 150), (255, 170, 160)),
    "ballons": ("🎈", "Ein Ballon", "Ballons", (140, 210, 255), (200, 170, 255)),
    "schneeflocken": ("❄️", "Eine Flocke", "Flocken", (90, 140, 220), (180, 210, 255)),
}
NUMBERS = ["EINS", "ZWEI", "DREI", "VIER", "FÜNF"]

BPM = 100
BEAT = 60 / BPM
BAR = 4 * BEAT
INTRO_BARS, COUNT_BARS, PARTY_BARS, OUTRO_BARS = 2, 5, 2, 1
TOTAL = (INTRO_BARS + COUNT_BARS + PARTY_BARS + OUTRO_BARS) * BAR

BOMMEL_BLUE = (110, 195, 255)
BOMMEL_DARK = (60, 120, 210)


# ------------------------------------------------------------ character ----

def draw_bommel(eyes_open=True, mouth_open=False, size=600):
    """Render Bommel at 2x and downsample for smooth edges."""
    S = size * 2
    img = Image.new("RGBA", (S, int(S * 1.25)), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    cx, cy, r = S / 2, S * 0.72, S * 0.36

    # antennae with pom-poms
    for side in (-1, 1):
        x0, y0 = cx + side * r * 0.35, cy - r * 0.85
        x1, y1 = cx + side * r * 0.65, cy - r * 1.55
        d.line((x0, y0, (x0 + x1) / 2 + side * 20, (y0 + y1) / 2, x1, y1), fill=BOMMEL_DARK, width=22, joint="curve")
        pr = r * 0.17
        d.ellipse((x1 - pr, y1 - pr, x1 + pr, y1 + pr), fill=(255, 120, 170))
        d.ellipse((x1 - pr * 0.4, y1 - pr * 0.7, x1 + pr * 0.05, y1 - pr * 0.25), fill=(255, 200, 225))
    # feet
    for side in (-1, 1):
        fx = cx + side * r * 0.45
        d.ellipse((fx - r * 0.3, cy + r * 0.78, fx + r * 0.3, cy + r * 1.08), fill=(255, 160, 60))
    # fluffy body: ring of small circles + main circle
    for i in range(28):
        a = 2 * math.pi * i / 28
        fr = r * 0.16
        px, py = cx + math.cos(a) * r * 0.93, cy + math.sin(a) * r * 0.93
        d.ellipse((px - fr, py - fr, px + fr, py + fr), fill=BOMMEL_BLUE)
    d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=BOMMEL_BLUE)
    # belly
    d.ellipse((cx - r * 0.55, cy + r * 0.05, cx + r * 0.55, cy + r * 0.85), fill=(200, 235, 255))
    # arms
    for side in (-1, 1):
        ax = cx + side * r * 1.02
        d.ellipse((ax - r * 0.17, cy + r * 0.05, ax + r * 0.17, cy + r * 0.45), fill=BOMMEL_DARK)
    # eyes
    for side in (-1, 1):
        ex, ey = cx + side * r * 0.36, cy - r * 0.28
        if eyes_open:
            ew, eh = r * 0.24, r * 0.3
            d.ellipse((ex - ew, ey - eh, ex + ew, ey + eh), fill="white", outline=(30, 30, 60), width=8)
            pw = r * 0.14
            d.ellipse((ex - pw, ey - pw * 0.9, ex + pw, ey + pw * 1.3), fill=(30, 30, 60))
            hw = r * 0.06
            d.ellipse((ex - hw * 1.5, ey - hw * 1.8, ex + hw * 0.3, ey), fill="white")
        else:
            d.arc((ex - r * 0.22, ey - r * 0.12, ex + r * 0.22, ey + r * 0.2), 200, 340, fill=(30, 30, 60), width=14)
    # cheeks
    cheeks = Image.new("RGBA", img.size, (0, 0, 0, 0))
    cd = ImageDraw.Draw(cheeks)
    for side in (-1, 1):
        kx, ky = cx + side * r * 0.66, cy + r * 0.02
        cd.ellipse((kx - r * 0.15, ky - r * 0.09, kx + r * 0.15, ky + r * 0.09), fill=(255, 120, 150, 150))
    img.alpha_composite(cheeks)
    # mouth
    my = cy + r * 0.1
    if mouth_open:
        d.chord((cx - r * 0.24, my - r * 0.18, cx + r * 0.24, my + r * 0.3), 0, 180, fill=(150, 30, 60))
        d.chord((cx - r * 0.13, my + r * 0.08, cx + r * 0.13, my + r * 0.28), 180, 360, fill=(255, 120, 140))
    else:
        d.arc((cx - r * 0.2, my - r * 0.15, cx + r * 0.2, my + r * 0.12), 20, 160, fill=(30, 30, 60), width=14)

    img = img.crop(img.getbbox())
    return img.resize((img.width // 2, img.height // 2), Image.LANCZOS)


# ---------------------------------------------------------------- video ----

def object_pos(i):
    # gentle arc of five slots above Bommel
    x = W / 2 + (i - 2) * 190
    y = 820 - math.cos((i - 2) / 2 * 1.0) * 120
    return x, y


def lyrics_for(bar):
    """Return (text, highlight) for the karaoke line in a given bar."""
    if bar < INTRO_BARS:
        return "Zähl mit Bommel!"
    b = bar - INTRO_BARS
    if b < COUNT_BARS:
        return None  # built dynamically
    if b < COUNT_BARS + PARTY_BARS:
        return "Super gezählt!"
    return "Nochmal? Los geht's!"


def frame(t, bg, poses, obj, theme):
    emoji, singular, plural = theme[:3]
    img = bg.copy().convert("RGBA")
    d = ImageDraw.Draw(img)
    beat_pos = t / BEAT
    beat_frac = beat_pos - math.floor(beat_pos)
    bar = int(t // BAR)
    tb = t - bar * BAR

    # twinkling background dots
    for i in range(22):
        x = (i * 211) % W
        y = (i * 397) % (H - 300) + 50
        a = int(70 + 60 * math.sin(t * 2 + i))
        rr = 6 + (i % 3) * 3
        d.ellipse((x - rr, y - rr, x + rr, y + rr), fill=(255, 255, 255, a))
    # ground
    d.ellipse((-300, 1500, W + 300, 2400), fill=(120, 220, 140))

    count_bar = bar - INTRO_BARS
    shown = 0
    if 0 <= count_bar < COUNT_BARS:
        shown = count_bar + 1
    elif count_bar >= COUNT_BARS:
        shown = 5

    # objects
    for i in range(shown):
        x, y = object_pos(i)
        bob = math.sin(t * 3 + i) * 12
        if i == count_bar:
            k = ease_out_back(tb / 0.35)
            paste_center(img, obj, x, y + bob, scale=max(k, 0.01))
        else:
            sc = 1.0
            if count_bar >= COUNT_BARS and count_bar < COUNT_BARS + PARTY_BARS:
                # party recap: each object hops on its eighth note
                idx = int((t - (INTRO_BARS + COUNT_BARS) * BAR) / (BEAT / 2)) % 8
                if idx == i:
                    sc = 1.25
            paste_center(img, obj, x, y + bob, scale=sc)

    # Bommel: bounce + squash on every beat, mouth on beat
    squash = math.exp(-beat_frac * 8)
    eyes = not (bar % 3 == 1 and 2.9 < (tb / BEAT) < 3.1)
    mouth = beat_frac < 0.4 and bar >= 0
    pose = poses[(eyes, mouth)]
    sx, sy = 1 + 0.07 * squash, 1 - 0.07 * squash
    pz = pose.resize((int(pose.width * sx), int(pose.height * sy)), Image.LANCZOS)
    hop = abs(math.sin(beat_pos * math.pi)) * 30
    by = 1650 - pz.height - hop
    if t < 0.8:  # entrance
        by += (1 - ease_out_back(t / 0.8)) * 900
    img.alpha_composite(pz, (int(W / 2 - pz.width / 2), int(by)))

    # big numeral + word
    if 0 <= count_bar < COUNT_BARS:
        k = ease_out_back(tb / 0.4)
        outlined_text(d, (W / 2, 330), str(shown), int(300 * min(k, 1.15)) or 1, fill=(255, 230, 90))
        outlined_text(d, (W / 2, 530), NUMBERS[count_bar], int(110 * min(k, 1.1)) or 1)
        line = singular + "!" if shown == 1 else f"{NUMBERS[count_bar].capitalize()} {plural}!"
    elif count_bar >= COUNT_BARS and count_bar < COUNT_BARS + PARTY_BARS:
        idx = int((t - (INTRO_BARS + COUNT_BARS) * BAR) / (BEAT / 2)) % 8
        if idx < 5:
            outlined_text(d, (W / 2, 380), str(idx + 1), 260, fill=(255, 230, 90))
        else:
            outlined_text(d, (W / 2, 380), f"5 {plural}!", 150, fill=(255, 230, 90))
        line = lyrics_for(bar)
    else:
        if bar < INTRO_BARS:
            k = ease_out_back(t / 0.6)
            outlined_text(d, (W / 2, 380), "Hallo, ich bin", int(100 * k) or 1)
            outlined_text(d, (W / 2, 520), "BOMMEL!", int(170 * k) or 1, fill=(255, 230, 90))
        else:
            outlined_text(d, (W / 2, 400), "Nochmal?", 160, fill=(255, 230, 90))
        line = lyrics_for(bar)

    # karaoke line: words light up across the bar
    words = line.split()
    fs = 96
    while fs > 50 and font(fs).getlength(line) > W - 120:
        fs -= 4
    total_w = font(fs).getlength(line)
    x = W / 2 - total_w / 2
    lit = int(len(words) * min(1, tb / (BAR * 0.6)) + 0.999)
    for i, wd in enumerate(words):
        wlen = font(fs).getlength(wd)
        col = (255, 230, 90) if i < lit else (255, 255, 255)
        d.text((x + wlen / 2, 1760), wd, font=font(fs), anchor="mm", fill=col,
               stroke_width=fs // 10, stroke_fill=(60, 40, 110))
        x += wlen + font(fs).getlength(" ")
    return img


# ---------------------------------------------------------------- audio ----

def bell(freq, dur, amp):
    t = np.arange(int(SR * dur)) / SR
    sig = np.sin(2 * math.pi * freq * t) + 0.4 * np.sin(2 * math.pi * freq * 2.76 * t) * np.exp(-t * 6)
    return amp * sig * np.exp(-t * 3.5) * np.minimum(1, t * 300)


def lead(freq, dur, amp):
    t = np.arange(int(SR * dur)) / SR
    vib = 1 + 0.006 * np.sin(2 * math.pi * 5.5 * t) * np.minimum(1, t * 4)
    ph = 2 * math.pi * freq * np.cumsum(vib) / SR
    sig = np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph)
    env = np.minimum(1, t * 40) * np.minimum(1, (dur - t) * 12).clip(0) * (0.85 + 0.15 * np.exp(-t * 4))
    return amp * sig * env


def build_audio(path):
    buf = np.zeros(int(SR * TOTAL) + SR)
    chords = [(60, 64, 67), (55, 59, 62), (57, 60, 64), (53, 57, 60)]  # C G Am F
    n_bars = int(TOTAL / BAR)
    for b in range(n_bars):
        ch = chords[b % 4]
        start = b * BAR
        # bass on 1 and 3
        add(buf, tone(midi(ch[0] - 24), BEAT * 1.8, 0.16, 2.5, (1, 0.3, 0.1)), start)
        add(buf, tone(midi(ch[0] - 17 if ch[0] != 53 else ch[0] - 24), BEAT * 1.8, 0.13, 2.5, (1, 0.3, 0.1)), start + 2 * BEAT)
        # ukulele-like strums on each beat
        for k in range(4):
            for j, n in enumerate(ch):
                add(buf, tone(midi(n), 0.35, 0.05, 9, (1, 0.6, 0.3)), start + k * BEAT + j * 0.012)
            # soft kick + clap
            tk = np.arange(int(SR * 0.15)) / SR
            if k in (0, 2):
                add(buf, 0.35 * np.sin(2 * math.pi * (60 + 90 * np.exp(-tk * 40)) * tk) * np.exp(-tk * 25), start + k * BEAT)
            else:
                nz = np.random.default_rng(b * 4 + k).normal(0, 1, len(tk)) * np.exp(-tk * 45)
                add(buf, 0.07 * nz, start + k * BEAT)

        cb = b - INTRO_BARS
        if b < INTRO_BARS:
            mel = [(67, 1), (69, 1), (67, 1), (64, 1)] if b == 0 else [(65, 1), (64, 1), (62, 2)]
        elif cb < COUNT_BARS:
            n = [72, 74, 76, 77, 79][cb]
            add(buf, bell(midi(n + 12), 1.5, 0.12), start)  # counting bell rises
            mel = [(n, 1), (n, 0.5), (n - 3, 0.5), (n - 5, 1), (n - 8, 1)]
        elif cb < COUNT_BARS + PARTY_BARS:
            mel = [(72, .5), (74, .5), (76, .5), (77, .5), (79, 1), (79, 1)] if cb == COUNT_BARS else \
                  [(81, .5), (79, .5), (77, .5), (76, .5), (74, 1), (72, 1)]
            for k in range(8):
                if cb == COUNT_BARS and k < 5:
                    add(buf, bell(midi([72, 74, 76, 77, 79][k] + 12), 0.6, 0.08), start + k * BEAT / 2)
        else:
            mel = [(76, 1), (74, 1), (72, 2)]
        pos = start
        for n, dur in mel:
            add(buf, lead(midi(n), dur * BEAT * 0.95, 0.13), pos)
            pos += dur * BEAT

    buf = buf[: int(SR * TOTAL)]
    fade = int(SR * 0.25)
    buf[:fade] *= np.linspace(0, 1, fade)
    buf[-fade:] *= np.linspace(1, 0, fade)
    buf = buf / max(1e-6, np.abs(buf).max()) * 0.85
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((buf * 32767).astype(np.int16).tobytes())


def main(out, theme_name="sterne"):
    theme = THEMES[theme_name]
    bg = gradient(theme[3], theme[4])
    obj = render_emoji(theme[0], 175)
    poses = {(e, m): draw_bommel(e, m) for e in (True, False) for m in (True, False)}
    wav = out + ".wav"
    build_audio(wav)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
           "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-i", wav,
           "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
           "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(int(TOTAL * FPS)):
        p.stdin.write(frame(f / FPS, bg, poses, obj, theme).convert("RGB").tobytes())
    p.stdin.close()
    p.wait()
    os.remove(wav)
    print(f"wrote {out} ({TOTAL:.1f}s)")


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "song.mp4", sys.argv[2] if len(sys.argv) > 2 else "sterne")
