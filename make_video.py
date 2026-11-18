#!/usr/bin/env python3
"""Build the finished TikTok video.

  python make_video.py --print-script                                  # narration text for ElevenLabs
  python make_video.py                                                 # preview (story.py = Der Aufhocker)
  python make_video.py --voice voice.mp3                               # final, synced to YOUR voice
  python make_video.py --story stories/02_rattenfaenger.py --voice v.mp3 --out output/rattenfaenger.mp4
"""
import argparse
import glob
import importlib
import importlib.util
import os
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)


def load_story(path):
    """Load a story file and register it as the `story` module (branding defaults from story.py)."""
    import story as base
    if not path or os.path.abspath(path) == os.path.abspath(os.path.join(HERE, "story.py")):
        return base
    spec = importlib.util.spec_from_file_location("story_file", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    for attr in ("CHANNEL_NAME", "CHANNEL_TAGLINE"):
        if not hasattr(mod, attr):
            setattr(mod, attr, getattr(base, attr))
    sys.modules["story"] = mod
    return mod


def load_scene_modules():
    """Every scenes_*.py file registers extra scene kinds (and sounds) on import."""
    for f in sorted(glob.glob(os.path.join(HERE, "scenes_*.py"))):
        importlib.import_module(os.path.splitext(os.path.basename(f))[0])


def fmt_srt(t):
    ms = int(round(t * 1000))
    return f"{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}"


def write_srt(render, tl, path):
    chunks = render.caption_chunks(tl)
    with open(path, "w", encoding="utf-8") as fh:
        for i, ch in enumerate(chunks, 1):
            txt = " ".join(tl["words"][k]["text"] for k in ch["ids"])
            fh.write(f"{i}\n{fmt_srt(ch['t0'])} --> {fmt_srt(ch['t1'])}\n{txt}\n\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--story", default=None, help="story file (default: story.py)")
    ap.add_argument("--voice", help="ElevenLabs narration (mp3/wav)")
    ap.add_argument("--out", default="output/aufhocker.mp4")
    ap.add_argument("--workers", type=int, default=None)
    ap.add_argument("--print-script", action="store_true")
    ap.add_argument("--whisper-model", default="base.en")
    a = ap.parse_args()

    load_story(a.story)
    import render  # noqa: E402  (must come after load_story)
    import audio   # noqa: E402
    load_scene_modules()

    if a.print_script:
        print(render.full_script())
        return

    missing = sorted({s["kind"] for s in sys.modules["story"].SCENES} - set(render.SCENES))
    if missing:
        sys.exit(f"scene kinds not implemented yet: {', '.join(missing)}")

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
    write_srt(render, tl, base + ".srt")
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
