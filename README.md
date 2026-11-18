# Horror-Folklore-Shorts im "Hidden Lore"-Stil

Erstellt komplette TikTok-Videos (1080×1920, 30 fps) im Stil von Folklore-Horror-Kanälen:
flache 2D-Vektor-Illustration, Mondlicht, Nebel, Wort-für-Wort-Untertitel mit roten Schlüsselwörtern,
synthetisches Sound-Design. **Die Stimme machst du selbst bei ElevenLabs**, das Skript synchronisiert alles darauf.

Erstes Video: **Der Aufhocker** (Eifel, Deutschland), ca. 65–75 s.

## Stil-Analyse (aus 5 Videos des Referenzkanals)

| Element | Was der Kanal macht | Umsetzung hier |
|---|---|---|
| **Format** | 1080×1920, 30 fps, 60–110 s | gleich |
| **Grafik** | flache 2D-Vektor-Illustration ohne Outlines, einfache Figuren, Silhouetten, 2–3 Tiefenebenen | `gfx.py`, `scenes.py` |
| **Belichtung** | Low-Key, sehr dunkel; *eine* warme Lichtquelle pro Szene (Mond mit Halo, Kerze, Laterne, Fenster), Gesichter halb im Schatten | Mond-Glow, Laternen-/Kerzen-Flackern, Lichtstrahl durchs Fenster |
| **Farben** | entsättigtes Navy/Anthrazit, beiger/pfirsichfarbener Mond, braune Innenräume, Rot nur als Akzent | Palette in `gfx.py` |
| **Kamera** | langsamer, durchgehender Push-in (Mond wird größer), leichte Parallaxe | `layer()`: Ebenen zoomen je nach Tiefe unterschiedlich |
| **Effekte** | Dunst-/Nebelbänder, starke Vignette, feines Filmkorn, Sterne, sanfte Überblendungen, Shake bei Schocks | driftender Nebel, Vignette, Korn (ffmpeg), 0,35 s Dissolve, Kamera-Shake |
| **Untertitel** | Oswald Bold, Großbuchstaben, cremeweiß, mittig unten (~68 % Höhe), Wort für Wort eingeblendet (erst grau → hell), Schlüsselwörter **rot** | genau so |
| **Hook** | Satz 1 = "If you … DON'T …", Schluss-Satz groß in Rot | `"hook": True` |
| **Ortsangabe** | kleine gesperrte Schrift oben links mit kurzer roter Linie ("LOS LLANOS · VENEZUELA") | `LOCATION` |
| **Titelkarte** | Name der Kreatur groß oben, rote Linie, roter Untertitel, unten "LAND · LEGEND" | `TITLE`, `TITLE_SUB` |
| **Ende** | Dunkelheit → leuchtende Augen → Jumpscare-Reveal der Kreatur → Logo-Outro | Szene `eyes_reveal` + Outro |
| **Sound** | dunkler Drone-Teppich, Wind, Whoosh auf Schnitten, Sub-Booms, Riser vor Schocks, kurze Stille vor dem Scare, Logo-Sting | `audio.py`, alles synthetisch (keine Lizenzprobleme) |
| **Lautheit** | ca. −16 LUFS | Endmix −14 LUFS, Musik unter der Stimme automatisch abgesenkt (Ducking) |

## So machst du das fertige Video

1. **Skript ausgeben** und bei ElevenLabs einsprechen lassen:
   ```bash
   python make_video.py --print-script
   ```
   Tipp für ElevenLabs: eine tiefe, ruhige Erzählerstimme, Stability ~35–45 %, Style ~20 %.
   Die "…" im Text erzeugen die dramatischen Pausen, also nicht entfernen.
2. **Stimme als mp3 herunterladen** (z. B. `voice.mp3`) und:
   ```bash
   python make_video.py --voice voice.mp3 --out output/aufhocker.mp4
   ```
   Whisper erkennt jedes Wort in deiner Aufnahme. Untertitel, Szenenwechsel, Sprung-Schock,
   Glocken, Jumpscare usw. werden **automatisch auf deine Stimme getimt**.
3. Ergebnis in `output/`:
   - `aufhocker.mp4`: fertiges Video mit Stimme, Musik & SFX
   - `aufhocker_music_sfx.wav`: nur Musik + Effekte (falls du in CapCut selbst mischen willst)
   - `aufhocker.srt`: Untertitel-Datei

Ohne `--voice` entsteht eine Vorschau mit geschätztem Timing (ca. 2,6 Wörter/s).

## Installation

```bash
pip install skia-python numpy scipy pyloudnorm faster-whisper
# + ffmpeg (Linux: apt install ffmpeg libegl1, Mac: brew install ffmpeg)
```

## Eigene Geschichten

Alles Inhaltliche steht in `story.py`: Text pro Szene, `*rote Wörter*`, Titel, Ort und **Kanalname fürs Outro**
(`CHANNEL_NAME`, aktuell "BY LANTERN LIGHT"). Profilbilder: `python profile_pic.py`. Neue Bildmotive = neue Funktion in `scenes.py`.
