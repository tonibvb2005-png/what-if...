# what-if... – Video-Fabrik für @footballpage.tv

Animierte TikTok-Videos im Hochformat (1080×1920, 30 fps), komplett ohne Gesicht.
Jedes Video ist eine JSON-Datei in `videos/`. Die Engine (`engine/`) rendert sie zu MP4.

| Datei | Format | Länge |
|---|---|---|
| `output/01-ballon-dor-ranking.mp4` | Ranking (Top-Liste mit Countdown) | 21 s |
| `output/02-hot-takes.mp4` | Hot Takes / Umfrage (Agree vs Disagree) | 28 s |
| `output/03-leicester-story.mp4` | Storytelling mit Untertiteln (für KI-Stimme) | 38 s |
| `output/04-guess-the-player.mp4` | Serie "Guess the Player" Ep. 1 | 17 s |

Videos sind **ohne Ton**. Trending Sound in der TikTok-App drauflegen (leise, ca. 10–20 %).

## Rendern

```bash
node engine/render.js videos/01-ballon-dor-ranking.json            # -> output/01-ballon-dor-ranking.mp4
node engine/render.js videos/02-hot-takes.json --stills 2,6        # nur Vorschaubilder
```
Voraussetzung: Node, Playwright (Chromium) und ffmpeg.

## KI-Stimme einbauen (Storytelling)

1. Texte aus `videos/03-leicester-story.voiceover.txt` in deinem KI-Voice-Tool vertonen, **eine Datei pro Zeile**.
2. Als `audio/leicester/01.mp3 … 06.mp3` ablegen (oder mir schicken).
3. Neu rendern. Jede Szene dauert dann automatisch so lange wie ihre Audiodatei, die Untertitel laufen mit und die Stimme wird ins Video gemischt.

## Szenen-Typen

| `type` | Wofür | wichtige Felder |
|---|---|---|
| `hook` | Einstieg, Spannung | `kicker`, `title` (Zeilen mit `\|`), `sub` |
| `rank` | Platz in einer Liste | `rank`, `name` oder `entries[]`, `meta`, `value`, `unit`, `icons` (goldene Bälle) oder Balken mit `max` |
| `poll` | Hot Take / Umfrage | `label`, `statement`, `a`, `b`, `cta` |
| `story` | Storytelling-Untertitel | `text`, `big`/`count`+`suffix`, `bigLabel`, `tag`, `image`, `audio` |
| `quiz` | Karriereweg erraten | `title`, `chip`, `clubs[]` (`club`, `years`), `countdown` |
| `reveal` | Auflösung mit Flash | `kicker`, `name`, `sub` |
| `cta` | Follow-Aufruf | `title`, `button`, `sub` |

`*Wörter*` in Sternchen werden in der Akzentfarbe hervorgehoben. Jede Szene kann `accent`, `accent2` und `duration` überschreiben.

Mehr dazu in [`CONTENT_PLAN.md`](CONTENT_PLAN.md).
