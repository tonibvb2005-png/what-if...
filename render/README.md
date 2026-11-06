# Video-Renderer (three.js + Playwright)

Rendert die Videos komplett im Code: 2D-Strichmännchen als Billboards in einer stilisierten 3D-Welt
(Toon-Shading, Outlines), Kamerafahrten, Motion Blur, Crossfades, VHS-Rewind, Wort-für-Wort-Untertitel.

```
npm install
./make_video.sh                 # Vorschau ohne Stimme  -> out/preview_no_voice.mp4
./make_video.sh voice.mp3       # mit KI-Stimme, auto-synchronisiert -> out/final.mp4
```

- `src/timeline.js`: Skript, Wort-Timing, Untertitel-Gruppen
- `src/main.js`: Shots (Kamera + Zustand pro Zeit), Compositor (Bloom, Grain, VHS, Captions)
- `src/chars.js`: Figuren (Canvas-gezeichnet), `src/desert.js` und `src/interiors.js`: 3D-Welten
- `audio/make_audio.py`: Musik und SFX, `audio/align_voice.py`: Whisper-Alignment der Stimme
