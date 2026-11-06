#!/usr/bin/env bash
# Full pipeline for one video.
#   ./make_video.sh 002                 preview without voice -> out/v002/preview_no_voice.mp4
#   ./make_video.sh 002 path/voice.mp3  final with narrator   -> out/v002/final.mp4
set -euo pipefail
cd "$(dirname "$0")"
VID="$1"; VOICE="${2:-}"; O="out/v$VID"; mkdir -p "$O"
pgrep -f "http.server 8765" >/dev/null || (nohup python3 -m http.server 8765 >/dev/null 2>&1 &) ; sleep 1
export NODE_PATH=/opt/node22/lib/node_modules VID
if [ -n "$VOICE" ]; then
  node render.cjs "$O/_probe.mp4" 0.1 - 0 1 >/dev/null      # writes $O/timeline.json (estimated timing)
  python3 audio/align_voice.py "$VOICE" "$O/timeline.json" "$O/voice.json"
  node render.cjs "$O/video_noaudio.mp4" 1 "$O/voice.json"
else
  node render.cjs "$O/video_noaudio.mp4" 1
fi
python3 "audio/v$VID.py" "$O/timeline.json" "$O/sfx_music.wav"
if [ -n "$VOICE" ]; then
  ffmpeg -y -loglevel error -i "$O/video_noaudio.mp4" -i "$O/sfx_music.wav" -i "$VOICE" -filter_complex \
   "[2:a]aresample=48000,aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=-20dB:ratio=2.5:attack=5:release=120,asplit=2[v][sc];[1:a][sc]sidechaincompress=threshold=0.04:ratio=5:attack=15:release=350[bed];[bed][v]amix=inputs=2:weights='0.7 1':normalize=0,loudnorm=I=-14:TP=-1.2:LRA=9[a]" \
   -map 0:v -map "[a]" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart "$O/final.mp4"
else
  ffmpeg -y -loglevel error -i "$O/video_noaudio.mp4" -i "$O/sfx_music.wav" -map 0:v -map 1:a -c:v libx264 -preset slow -crf 20 -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$O/preview_no_voice.mp4"
fi
echo done
