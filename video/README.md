# Horror Roulette – Video-Generator

Erzeugt das komplette TikTok-Video (1080×1920, 30 fps) aus `shots.json`:
Roulette-Intro, 3D-Szenen, Figuren, Untertitel, Einblendungen, Sound-Design und End-Card.

## Einmalig einrichten
```bash
npm install
pip install piper-tts scipy numpy
# Platzhalter-Stimmen (nur nötig ohne ElevenLabs-Dateien)
mkdir -p assets && cd assets
for v in thorsten/high/de_DE-thorsten-high:de_thorsten kerstin/low/de_DE-kerstin-low:de_kerstin; do
  src=${v%%:*}; dst=${v##*:}
  for e in onnx onnx.json; do curl -L -o $dst.$e https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/$src.$e; done
done
```

## Video bauen
```bash
python3 build_audio.py            # Stimme + Sound + Timeline  -> build/audio.wav, build/timeline.json
node render.js                    # Bild rendern + Ton mischen -> build/video.mp4
```
Einzelbilder zum Prüfen: `node render.js --stills 5,12.5,40`

## Mit deiner ElevenLabs-Stimme
Erzeuge jede Zeile einzeln in ElevenLabs und speichere sie als WAV oder MP3 in einen Ordner, z. B. `voice/`.
Dateiname = `<shot-id>_<nummer>.wav` (oder `.mp3`) (Liste unten). Dann:
```bash
python3 build_audio.py --voice-dir voice
node render.js
```
Das Timing (Schnitte, Untertitel, Uhrzeit, Soundeffekte) passt sich automatisch an die Länge deiner Aufnahmen an.
Fehlt eine Datei, wird für diese Zeile die Platzhalter-Stimme benutzt.

| Datei | Stimme | Text |
|---|---|---|
| `hook_0.wav` | narr | Eines dieser Monster ist ausgebrochen. Mal sehen, wer es ist. |
| `name_0.wav` | narr | Hachischakusama. Fünfzehn Uhr. |
| `arrive_0.wav` | narr | Sommerferien bei Oma und Opa, auf dem Land. |
| `hat_0.wav` | narr | Über der Hecke siehst du einen weißen Sonnenhut. |
| `hear_0.wav` | narr | Dann hörst du es. |
| `po1_0.wav` | po | Po. Po. Po. Po. |
| `measure_0.wav` | narr | Die Hecke ist über zwei Meter hoch. |
| `float_0.wav` | narr | Und der Hut schwebt darüber. |
| `cup_0.wav` | narr | Du erzählst es Oma. Ihre Teetasse fällt zu Boden. |
| `tall_0.wav` | narr | Hachischakusama. Eine Frau, zweieinhalb Meter groß. |
| `takes_0.wav` | narr | Wen sie einmal gesehen hat, den holt sie. |
| `rule_0.wav` | narr | Sie macht jede Stimme nach. Aber rein kommt sie nur, wenn du ihr öffnest. |
| `talisman_0.wav` | narr | Opa klebt Papierzettel an jedes Fenster. Salz in jede Ecke. |
| `alone_0.wav` | narr | Die Regel: Bis sieben Uhr morgens öffnest du die Tür nicht. Für niemanden. |
| `knock_0.wav` | narr | Mitternacht. Es klopft am Fenster. |
| `po2_0.wav` | po | Po. Po. Po. |
| `oma_0.wav` | narr | Dann Omas Stimme. |
| `oma_1.wav` | oma | Schatz, mach auf. Ich hab dir Tee gebracht. |
| `sleep_0.wav` | narr | Aber Oma schläft nebenan. Du hörst sie schnarchen. |
| `salt_0.wav` | narr | Das Salz in der Ecke wird schwarz. |
| `dawn_0.wav` | narr | Sechs Uhr fünfundfünfzig. Noch fünf Minuten. |
| `opa_0.wav` | narr | Dann Opas Stimme. |
| `opa_1.wav` | opa | Es ist vorbei. Du kannst rauskommen. |
| `wait_0.wav` | narr | Du sagst nichts. Du wartest. |
| `open_0.wav` | narr | Punkt sieben. Du öffnest die Tür. |
| `smile_0.wav` | narr | Opa steht im Flur und lächelt. |
| `smile_1.wav` | opa | Gut gemacht. |
| `lookup_0.wav` | narr | Dann siehst du nach oben. |
| `ceiling_0.wav` | narr | Sein Kopf berührt die Decke. |
| `cta_0.wav` | narr | Folge mir, um zu sehen, wen du als Nächstes bekommst. |