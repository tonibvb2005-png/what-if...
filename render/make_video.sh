#!/usr/bin/env bash
# Full pipeline. Without a voice file: preview with SFX/music only.
# With a voice file:  ./make_video.sh path/to/voice.mp3
set -euo pipefail
cd "$(dirname "$0")"
pgrep -f "http.server 8765" >/dev/null || (python3 -m http.server 8765 >/dev/null 2>&1 &) ; sleep 1
export NODE_PATH=/opt/node22/lib/node_modules
VOICE="${1:-}"
if [ -n "$VOICE" ]; then
  node render.cjs out/_probe.mp4 0.05 >/dev/null 2>&1 || true   # writes out/timeline.json (estimated)
  python3 audio/align_voice.py "$VOICE" out/timeline.json out/voice.json
  node render.cjs out/video_noaudio.mp4 1 out/voice.json
else
  node render.cjs out/video_noaudio.mp4 1
fi
python3 audio/make_audio.py out/timeline.json out/sfx_music.wav
if [ -n "$VOICE" ]; then
  ffmpeg -y -loglevel error -i out/video_noaudio.mp4 -i out/sfx_music.wav -i "$VOICE" -filter_complex \
   "[2:a]aresample=48000,highpass=f=80,acompressor=threshold=-18dB:ratio=3,loudnorm=I=-16:TP=-1.5,asplit=2[v][sc];[1:a][sc]sidechaincompress=threshold=0.05:ratio=6:attack=20:release=300[bed];[bed][v]amix=inputs=2:weights='0.8 1':normalize=0,alimiter=limit=0.95[a]" \
   -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest out/final.mp4
else
  ffmpeg -y -loglevel error -i out/video_noaudio.mp4 -i out/sfx_music.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest out/preview_no_voice.mp4
fi
echo done
