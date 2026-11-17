# „Was wäre, wenn du in … geboren wärst?“ – TikTok-Serie

Jeden Tag ein Land. Ein Moderator (Strichmännchen im Anzug) führt durch das Video,
mit Untertiteln, die Wort für Wort mitlaufen, und Gesten passend zum Text.

## Aufbau einer Folge (ca. 45–60 s)

1. **Intro**: Globus dreht sich zum Land: „Was wäre, wenn du in … geboren wärst?“
2. **Geburt**: Wie wahrscheinlich ist es, genau dort geboren zu werden („1 von X Babys“)
3. **Sprache / Kultur**: Sprechblasen, Begrüßungen, Klischees
4. **Essen**: ein typisches Klischee mit echter Zahl
5. **Geld**: Lohn vs. Alltagspreis
6. **Alltag**: Verkehr, Wetter, Gewohnheiten
7. **Pflicht / Kurioses**: ein überraschender Fakt
8. **Leben**: Lebenserwartung im Vergleich zum Weltschnitt
9. **Outro**: „Tag X von 195 – welches Land kommt morgen? Schreib es in die Kommentare!“

## Neues Land anlegen

1. `src/episodes/schweiz.js` kopieren, z. B. nach `src/episodes/japan.js`
2. Anpassen: `day`, `country`, `inCountry` („in Japan“), `flag` (Emoji), `isoId`
   (ISO-3166-Zahl, z. B. Japan = `392`), `center` [Längengrad, Breitengrad], `zoom`, `accent` (Farbe)
3. Szenen-Texte und Zahlen ersetzen. Bausteine: `intro`, `odds`, `bubbles`, `stat`, `versus`, `life`, `outro`
4. `[Anzeige|Aussprache]`: Untertitel zeigt z. B. „1.600“, die Stimme liest „sechzehnhundert“
5. `cue`: das Wort, bei dem ein Element erscheint; `host`: Gesten der Figur
   (`idle, wave, present, point, shrug, think, tada, hips`) plus optional ein Emoji in der Hand

## Rendern

```bash
cd src
npm install && node setup.js    # einmalig
node skript.js japan > skript_japan.md       # Sprechertext für ElevenLabs
EP=japan node render.js test 2 10 20         # einzelne Testbilder
EP=japan OUT=japan.mp4 node render.js video  # komplettes Video (1080×1920, 30 fps)
```

Benötigt Node.js, ffmpeg und Playwright (Chromium).

## Fakten Schweiz (Folge 1), Stand der Zahlen

- ca. 80.000 Geburten/Jahr in der Schweiz vs. ca. 130 Mio. weltweit → etwa 1 von 1.600
- 4 Landessprachen: Deutsch, Französisch, Italienisch, Rätoromanisch
- Schokoladenkonsum ca. 10–11 kg pro Kopf und Jahr
- Medianlohn ca. 6.800 CHF brutto/Monat (BFS, 2022); Kaffee im Café ca. 4,50–5 CHF
- SBB-Pünktlichkeit über 90 %
- Militärdienstpflicht für Schweizer Männer; die Dienstwaffe wird meist zu Hause aufbewahrt
- Lebenserwartung ca. 84 Jahre (Weltschnitt ca. 73)
