#!/usr/bin/env python3
"""Build the finished TikTok video.

  python make_video.py --print-script            # narration text to paste into ElevenLabs
  python make_video.py                           # preview without voice (timing estimated)
  python make_video.py --voice voice.mp3         # final: captions + scenes synced to YOUR voice
"""
import argparse
import os
import subprocess
import tempfile

import audio
import render


def fmt_srt(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write_srt(tl, path):
    chunks = render.caption_chunks(tl)
    with open(path, "w", encoding="utf-8") as fh:
        for i, ch in enumerate(chunks, 1):
            txt = " ".join(tl["words"][k]["text"] for k in ch["ids"])
            fh.write(f"{i}\n{fmt_srt(ch['t0'])} --> {fmt_srt(ch['t1'])}\n{txt}\n\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--voice", help="ElevenLabs narration (mp3/wav)")
    ap.add_argument("--out", default="output/aufhocker.mp4")
    ap.add_argument("--workers", type=int, default=None)
    ap.add_argument("--print-script", action="store_true")
    ap.add_argument("--whisper-model", default="base.en")
    a = ap.parse_args()

    if a.print_script:
        print(render.full_script())
        return

    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    base = os.path.splitext(a.out)[0]
    words = render.parse_words()
    if a.voice:
        words, matched = render.align_to_voice(words, a.voice, a.whisper_model)
        print(f"aligned voice: {matched:.0%} of script words matched")
    else:
        words = render.estimate_times(words)
    tl = render.build_timeline(words)
    render.save_timeline(tl, base + "_timeline.json")
    write_srt(tl, base + ".srt")
    print(f"duration {tl['duration']:.1f}s, {len(tl['scenes'])} scenes")

    tmp = tempfile.mkdtemp()
    print("sound design ...")
    bed = audio.build_soundtrack(tl, render.OUTRO)
    audio.write_wav(base + "_music_sfx.wav", audio.loudness_normalize(bed, -18.0))
    if a.voice:
        v = audio.read_audio(a.voice)
        v = audio.loudness_normalize(v, -16.0)
        full = audio.mix_with_voice(audio.loudness_normalize(bed, -21.0), v)
    else:
        full = bed
    full = audio.loudness_normalize(full, -14.0)
    wav = os.path.join(tmp, "mix.wav")
    audio.write_wav(wav, full)

    print("rendering frames ...")
    silent = render.render_video(tl, os.path.join(tmp, "video.mp4"), workers=a.workers, tmpdir=tmp)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", silent, "-i", wav, "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-shortest", "-movflags", "+faststart", a.out],
                   check=True)
    print("done ->", a.out)


if __name__ == "__main__":
    main()
