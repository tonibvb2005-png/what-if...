# Übergabe: Grusel-TikTok-Kanal „Geschichten um 3:33“

Stand: 6. November 2026. Dieses Dokument enthält alles, was wir zusammen erarbeitet haben, damit du in einem neuen Chat sofort an genau dieser Stelle weitermachen kannst.

---

## 1. Schnellstart in einem neuen Chat

1. Lade diese ZIP-Datei im neuen Chat hoch (oder entpacke sie in ein Repository).
2. Kopiere den folgenden Text als erste Nachricht in den neuen Chat:

> Ich baue einen deutschen Grusel-TikTok-Kanal. Im Anhang ist mein komplettes Projekt (ZIP). Lies zuerst `UEBERGABE.md` und `STYLE_GUIDE.md` vollständig. Dort stehen der Stil, alle Regeln aus meinem Feedback, die Video-Engine und der Stand jeder Folge. Richte die Umgebung wie in Abschnitt 5 beschrieben ein und mach dann bei „Nächste Schritte“ (Abschnitt 8) weiter.

---

## 2. Das Konzept

- **Kanal:** deutsche Gruselgeschichten im Stil der drei Referenzvideos („3:17 AM Stories“). Das Prinzip ist übernommen, die Marke nicht. Unsere Serie heißt vorerst **„GESCHICHTEN UM 3:33“**, die feste Uhrzeit ist **3:33**.
- **Format:** 9:16, 1080×1920, 30 fps, 45–60 Sekunden.
- **Erzählformel** (aus der Analyse der Referenzen):
  1. Hook in der Du-Form („Stell dir vor, …“), immer um 3:33.
  2. Ein unmögliches Detail und eine Frage.
  3. Eskalation mit einer Regel („Er bewegt sich nur im Dunkeln“).
  4. Eine zweite Stimme oder Quelle widerspricht.
  5. Ein Twist.
  6. Eine Entscheidungsfrage mit zwei Optionen als Buttons, dann „Teil 2 heute Nacht“. Das bringt Kommentare.
- **Look:**
  - 3D-Hintergründe (Three.js) mit 2D-Figuren: runder weißblauer Kopf, Punktaugen, Strich-Arme.
  - Gedämpfte grau-navy Farben (Zielwert etwa `#252b4a`).
  - Untertitel Wort für Wort: Montserrat Black Italic, Großbuchstaben, gelb für Hinweise, rot für Gefahr.
  - Uhrzeit-Badge oben links, Titelkarte in den ersten 3 Sekunden, Endkarte „TEIL 2 / HEUTE NACHT“ mit Kommentarfrage.

Details zum Stil stehen in `STYLE_GUIDE.md`.

---

## 3. Regeln aus deinem Feedback (immer einhalten)

1. **Logik muss stimmen:** Jede Figur weiß nur, was sie wissen kann. Beispiel aus Folge 1: Papa weiß von der Tür nur, weil du es ihm schreibst. Getrennte Chats pro Kontakt.
2. **Abwechslung beim Setting:** nicht immer das Schlafzimmer, nicht immer Handy und Chat. Auch mal Arbeit, draußen, unterwegs.
3. **Wirklich neue Ideen**, keine Wiederholungen aus früheren Listen.
4. **Kreaturen eher andeuten als zeigen:** nur Teile sichtbar (halbes Gesicht, Hand, Schatten), wenig Licht.
5. **Ab dem Auftauchen der Kreatur wird es gruseliger:** dunkler, fahler, Vignette, Grollen („dread“-Modus). Kreaturen nie hell anstrahlen.
6. **Details müssen sauber sein:**
   - Hände greifen wirklich, mit Knöcheln um die Kante und Fäusten am Lenkrad.
   - Zähne sitzen an der Oberlippe.
   - Augen passen zur Erzählung („Augen offen“ heißt offen).
   - Hälse sind gerade.
   - Es gibt keine Kästen, Striche oder Artefakte im Bild.
7. **Figuren nicht flach:** Sie drehen sich zur Kamera, haben Schattierung und einen Bodenschatten.
8. **Hand am Handy wie in der Referenz:** beiger flacher Unterarm, links ein Daumen, rechts drei Finger als Pillen.
9. **Körper für alle Figuren:** Figuren bestehen nie nur aus einem Kopf. Die Hauptfigur trägt ein weinrotes Shirt.

---

## 4. Alle Folgen und ihr Stand

| # | Titel | Setting | Stand |
|---|---|---|---|
| 01 | Klopf Klopf | Schlafzimmer, Mama-/Papa-Chat, Kreatur im Türspalt | Bild fertig; wartet auf Stimme |
| 02 | Vierter Stock | Schlafzimmer, Gestalt klopft ans Fenster, Augen unter dem Bett | fertig gerendert (ältere Idee) |
| 03 | Babyfon | Schlafzimmer, Video-Babyfon, Ben an der Tür | fertig gerendert (ältere Idee) |
| 04 | **Zeitschalter** | Keller mit Zeitschalter-Licht und Countdown | **GEPOSTET, abgehakt** (mit ElevenLabs-Stimme) |
| 05 | Komm raus | Zelt im Wald, Jonas, Schatten an der Zeltwand, Reißverschluss | **FINAL mit ElevenLabs-Stimme** (stories/05_komm_raus/voice/voiceover.mp3) |
| 06 | Lichthupe | Auto, Landstraße, Verfolger, Radio, Rücksitz | Bild fertig; wartet auf Stimme |
| 07 | **Bewegungsmelder** | dunkles Großraumbüro, Lichter folgen dir, Kopierer druckt ein Foto | **FINAL mit ElevenLabs-Stimme** (stories/07_bewegungsmelder/voice/voiceover.mp3) |
| 09 | **Blackout** | NEUES FORMAT: Fiktion + echte Überlebensfakten (Stromausfall Frankfurt, 9. Stock, CO-Generator) | **FINAL mit ElevenLabs-Stimme** (stories/09_blackout/voice/voiceover.mp3) |
| 08 | Letzte Haltestelle | Nachtbus | gebaut, aber verworfen (Idee war nicht neu) |

Die Folge „Stock 13“ (Aufzug) wurde auf deinen Wunsch gelöscht und durch „Bewegungsmelder“ ersetzt.

**Captions:** Die Vorlage steht in Abschnitt 7. Für „Zeitschalter“ ist sie schon benutzt.

---

## 5. Technik: So wird ein Video gebaut

### Ordner
```
engine/            Video-Engine
  build.py         Story -> Stimme -> Timeline -> Ton-Mix -> Render
  render.js        Chromium/Playwright rendert Bild für Bild, ffmpeg erzeugt die MP4
  render.html      2D-Figuren, Szenen fürs Schlafzimmer, Untertitel, Overlays, Grusel-Modus
  world3d.js       3D-Grundgerüst + Schlafzimmer-Set
  sets3d.js        3D-Sets: Keller, Zelt, Auto, Aufzug, Bus, Großraumbüro
  sets.js          Kameras, Figuren und Abläufe für diese Sets
  fonts/           Montserrat + JetBrains Mono (lokal)
stories/NN_name/
  story.json                 die Geschichte (Szenen, Sätze, Effekte, Ereignisse)
  voiceover.txt              reiner Sprechertext
  voiceover_elevenlabs.txt   Text mit Regieanweisungen für ElevenLabs v3
  voice/voiceover.mp3        fertige Aufnahme (bisher nur 04)
STYLE_GUIDE.md     Analyse der Referenzen und Stilregeln
```

### Einrichtung (einmalig in einer neuen Umgebung)
```bash
pip install faster-whisper piper-tts numpy
cd engine && npm install three@0.149.0 && cd ..
mkdir -p .cache/piper && cd .cache/piper
curl -L -o de.onnx      https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx
curl -L -o de.onnx.json https://huggingface.co/rhasspy/piper-voices/resolve/main/de/de_DE/thorsten/high/de_DE-thorsten-high.onnx.json
cd ../..
```
Außerdem werden **ffmpeg** und **Playwright mit Chromium** gebraucht. WebGL läuft über SwiftShader, die Startflags dafür stehen schon in `render.js`.

### Befehle
```bash
# Probevideo mit Platzhalter-Stimme (Piper)
python3 engine/build.py stories/07_bewegungsmelder

# Nur Standbilder zur Kontrolle (schnell)
python3 engine/build.py stories/07_bewegungsmelder --stills 5,12,30

# FINALES Video mit deiner ElevenLabs-Aufnahme
python3 engine/build.py stories/07_bewegungsmelder --voice-file stories/07_bewegungsmelder/voice/voiceover.mp3
```
- Mit `--voice-file` wird deine Aufnahme mit Whisper transkribiert. Jedes Wort des Skripts wird seinem Zeitpunkt zugeordnet, Szenenwechsel, Untertitel und Effekte folgen deiner Sprechweise.
- Ergebnis: `output/NN_name.mp4`. Rendern dauert etwa 20–25 Minuten pro Video (CPU-Rendering).

### Workflow für eine neue Folge
1. Idee vorschlagen und auf Logik prüfen. Du wählst aus.
2. Gegebenenfalls ein 3D-Set bauen (`sets3d.js`) plus Kameras und Figuren (`sets.js`).
3. `story.json` schreiben. Sätze, Hervorhebungen (`hl`), Geräusche (`sfx`) und Ereignisse (`ev`, z. B. `light`, `timer`, `ghost`, `dread`).
4. Standbilder prüfen, korrigieren, Probevideo rendern. Du gibst Feedback.
5. `voiceover_elevenlabs.txt` mit Regieanweisungen schreiben. Du nimmst in ElevenLabs auf.
6. Finales Video mit `--voice-file` rendern, Caption schreiben. Du postest.

### ElevenLabs-Einstellungen (bewährt bei Zeitschalter)
- Modell **Eleven v3**, das die Tags in eckigen Klammern versteht.
- Stimme: „Arthur Holm – German“, eine tiefe, ruhige Erzählerstimme. Stability eher niedrig bis mittel.
- Tags: `[calm, low voice]`, `[whispers]`, `[tense]`, `[short pause]`, `[long pause]` usw.
- Bei Multilingual v2: Tags löschen und Pausen als `<break time="1.0s" />` schreiben.

---

## 6. Chronologie: Was wir Schritt für Schritt gemacht haben

1. **Referenzen analysiert:** drei Videos von „3:17 AM Stories“. Frames, Schnitte, Overlays und Voiceover ausgewertet. Ergebnis: Erzählformel und Stil, festgehalten in `STYLE_GUIDE.md`.
2. **Entscheidungen:** Deutsch, ElevenLabs für die Stimme, Claude baut die Szenen selbst.
3. **Probevideo „Klopf Klopf“** in 2D gebaut, mit Platzhalter-Stimme Piper.
4. **Figur mit Körper:** Sie nimmt das vibrierende Handy selbst vom Nachttisch.
5. **3D-Hintergrund** mit Three.js, die Figuren bleiben 2D. Dazu die Kreatur im Türspalt und eine Hand wie in der Referenz.
6. **Farben** grauer und gedämpfter gemacht. **Logikfehler behoben:** Papa bekommt einen eigenen Chat.
7. **Kreatur:**
   - Zuerst bekam sie einen dünnen Körper.
   - Dann wurde sie viel subtiler: kleiner Spalt, halbes Gesicht, dunkler Flur.
   - Die Hand greift richtig um die Türkante, die Zähne sitzen im Mund und an der Oberlippe.
8. **Folgen 02 und 03** gebaut: Fenster, unter dem Bett, Babyfon.
9. **Feedback:** nicht immer dasselbe Zimmer, nicht immer Handy. Daraufhin habe ich 6 neue Ideen vorgeschlagen.
10. **Folgen 04 bis 06** mit eigenen Sets: Keller, Zelt, Auto. Korrekturen:
    - Keller: Viereck um die Kreatur entfernt.
    - Zelt: Jonas' Augen bleiben offen, der ganze Schatten der Figur zieht den Reißverschluss hoch, der Hals ist gerade.
    - Auto: Lenkrad mit greifenden Händen.
11. **Zeitschalter mit deiner ElevenLabs-Stimme** fertiggestellt, Untertitel und Effekte automatisch ausgerichtet. **Gepostet.**
12. **Aufzug und Bus** gebaut, beide verworfen. Stattdessen **„Bewegungsmelder“**: dunkles Büro, die Person geht zum Kopierer und fühlt sich verfolgt.
13. **Figuren leicht 3D** (Zwischenschritt): zur Kamera gedreht, schattiert, mit Bodenschatten. Dazu der **Grusel-Modus** ab dem Auftauchen der Kreatur.

---

## 7. Caption-Vorlage

```
[1 Satz Hook aus der Geschichte, z. B.:] Das Kellerlicht bleibt nur 30 Sekunden an. Und er bewegt sich nur im Dunkeln… 💡😶

Was machst du: [OPTION 1] oder [OPTION 2]? 👇
Teil 2 kommt heute Nacht – folgen, damit du ihn nicht verpasst.

#gruselgeschichte #horror #horrorstory #creepy #gruselig #fyp #fürdich #storytime #3uhr33 [+ 1 Hashtag zum Setting]
```

---

## 8. Nächste Schritte (hier weitermachen)

1. **Neues zweites Video auswählen.** Diese drei Ideen sind ganz neu und warten auf deine Wahl:
   - **A) „Die Pizza“** (Empfehlung): Lieferdienst um 3:33 an ein abgelegenes Haus. Die Tür ist offen, der Tisch ist für vier gedeckt, und auf einem Namensschild steht dein Name. Frage: Reingehen oder wegfahren?
   - **B) „Spätschicht“:** Kiosk. Ein Kunde kauft jede Nacht Wasser und eine Schere und fragt: „Wann hast du Feierabend?“ Auf dem Überwachungsmonitor steht er danach hinter dir im Lager. Frage: Alarm oder bedienen?
   - **C) „Die Sprachnachricht“:** Sprachnachricht der verstorbenen Oma: „Versteck dich im Schrank.“ Schritte auf der Treppe, ihr Mantel im Schrank ist noch warm. Frage: Bleiben oder rennen?
2. **Stimmen aufnehmen** für 07 Bewegungsmelder, 05 Komm raus, 06 Lichthupe und 01 Klopf Klopf. Die Skripte mit Regieanweisungen liegen jeweils in `voiceover_elevenlabs.txt`. Für alle vier Folgen sind sie fertig.
3. **Teil 2 von „Zeitschalter“** schreiben, weil der gepostete Teil 1 ihn verspricht. Die Kommentar-Mehrheit (Rennen oder Drücken) entscheidet das Ende.
4. Optional einen **echten Kanalnamen** festlegen und die Platzhalter-Serie „GESCHICHTEN UM 3:33“ in allen `story.json`-Dateien ersetzen.
14. **Bewegungsmelder überarbeitet:**
    - Die Hauptfigur ist jetzt eine echte 3D-Figur. Das behebt das Stuhl-Flackern, und sie wirkt aus der Seitenansicht nicht mehr flach.
    - Das Foto zeigt Figuren mit unserer Statur.
    - Die Kreatur am Ende ist nur noch eine dunkle Silhouette mit glimmenden Augen.
15. **Neue Geräusche:**
    - Komm raus: Käuzchen, knackende Äste, Schritte im Laub.
    - Lichthupe: Herzschlag, aufheulender Motor, vorbeirauschende Bäume.
16. **Echte Tonaufnahmen statt Computer-Geräuschen** (dein Feedback: zu künstlich, lautes Rauschen bei Lichthupe):
    - Die Aufnahmen kommen aus dem Internet Archive (SSE-Bibliothek, aporee) und von OpenGameArt, alle CC0 oder Public Domain. Sie liegen in `engine/sfx/`, Herkunft und Lizenz stehen in `engine/sfx/LIZENZEN.md`.
    - `build.py` nimmt automatisch die echte Aufnahme, wenn es zu einem Geräuschnamen eine Datei gibt. Atmosphären (`amb_car`, `amb_forest`) werden geloopt und liegen etwa 13 dB unter der Stimme.
    - Regel: **Neue Geräusche immer als echte Aufnahme** (CC0/Public Domain) holen. Gute Quelle ist archive.org mit `SSE_Library_*`, `Red_Library_*` und `aporee_*`. Wikimedia Commons sperrt Downloads oft (Fehler 429).
17. **Neues Format nach zwei neuen Referenzen** (Kanal mit „Fiction + Survival Facts“):
    - **Thema:** realistische Katastrophen-Fiktion mit **echten Überlebensfakten**.
    - **Optik:** 3D-Umgebungen mit Kinolicht. Detaillierte 2D-Brustbilder mit Hautton, Haaren, Augenbrauen, Nase, Ohren, Kleidung, Brille und Schattierung, groß vor unscharfem Hintergrund.
    - **Einblendungen:** Kapsel oben („● FIKTION · 3:33 · ORT“), grüne „ECHT“-Etiketten, Regel-Karten, Info-Grafiken, Namensschilder, Endkarte „NÄCHSTER TEIL“.
    - **Umsetzung:** Folge **09 „Blackout“**, Code in `engine/blackout3d.js` (Skyline, Wohnung, Treppenhaus) und `engine/blackout.js` (Porträts, Overlays, Kameras).
    - **Regel:** Fakten nur aus seriösen Quellen (BBK u. ä.) und vorsichtig formuliert.
18. **Blackout überarbeitet** (dein Feedback):
    - Statt Regel-Karten **handelt die Figur selbst** (Flaschen füllen, Kühlschrank zulassen), die Erklärung kommt währenddessen als Stimme und ECHT-Etikett.
    - Das Video ist auf etwa 58 Sekunden gekürzt.
    - Neues, gruseligeres Ende: Die Brandts sitzen tot am Tisch (Kohlenmonoxid). Herr Brandt, der geklopft hat, war gar nicht mehr am Leben. Endfrage: „Wer hat dann an deine Tür geklopft?“
    - **Regel für dieses Format:** Fakten nicht als Regel einblenden, sondern in Handlung zeigen und nebenbei erklären.
