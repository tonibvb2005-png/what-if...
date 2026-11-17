# „Was wäre, wenn du in … geboren wärst?“ – mit Nomi

Eine tägliche TikTok-Serie: Jeden Tag entscheidet ein Länder-Roulette, wo du heute geboren bist.
Danach erlebt **Nomi** einen ganzen Tag in diesem Land. Fakten und Klischees stecken mitten im Alltag,
nicht in Nachrichten-Grafiken.

## Nomi

Nomi (von „Nomade“) ist ein Strichmännchen mit orangem Hoodie, gelbem Stern-Aufnäher und einer Haarlocke.
Er ist in jeder Folge derselbe und wird jeden Tag woanders geboren.
Er spricht, blinzelt, gestikuliert, setzt sich hin, isst und hält Dinge in der Hand.

## Ablauf einer Folge

| Uhrzeit | Szene | Idee |
|---|---|---|
| – | Roulette | „Wo bist du heute geboren?“ Die Länder rattern durch und das Roulette stoppt beim Land der Folge |
| – | Ankunft | Landschaft des Landes: „Was wäre, wenn du in … geboren wärst? Komm mit!“ |
| Tag 1 | Geburt | Babyzimmer: Wie selten ist es, genau hier geboren zu werden? |
| 07:00 | Aufwachen | Blick aus dem Fenster: Landschaft, Klima |
| 07:20 | Frühstück | typisches Essen |
| 07:52 | Arbeitsweg | Verkehr, Pünktlichkeit, Alltag |
| 08:15 | Schule | Sprache(n) |
| 10:00 | Pause | Snack oder Klischee mit echter Zahl |
| 17:30 | Jahre später | Lohn vs. Preise |
| 21:00 | Abend | Lebenserwartung, Ausklang |
| – | Outro | „Und wo bist du morgen geboren? Schreib's in die Kommentare!“ |

## Neues Land anlegen

1. `src/episodes/schweiz.js` kopieren, z. B. nach `src/episodes/japan.js`
2. `day`, `country`, `inCountry` („in Japan“), `flag`, `accent` und das letzte Feld in `reel` (Gewinner) anpassen
3. Texte der Szenen ersetzen.
   - `[Anzeige|Aussprache]`: Der Untertitel zeigt „1.600“, die Stimme liest „sechzehnhundert“.
   - `{2}`: 2 Sekunden Pause
   - `nomi`: Gesten `[Wort, Pose, Emoji in der Hand, Mund]`. Posen: idle, wave, present, point, think,
     shrug, tada, stretch, hips, watch, hold, cup, raise, eat, munch, sitdesk, bench
4. Bei Ländern ohne Berge, Schweizer Flagge usw. müssen die Kulissen in `nomi.html` (Funktionen in `SCENES`) angepasst werden

## Rendern

```bash
cd src
npm install && node setup.js                  # einmalig
node skript.js japan > ../skript_japan.md     # Sprechertext für ElevenLabs
EP=japan node render.js test 3 15 30          # Testbilder
EP=japan OUT=japan.mp4 node render.js video   # Video 1080×1920, 30 fps
```

Benötigt Node.js, ffmpeg und Playwright (Chromium).

## Fakten Schweiz (Tag 1)

- ca. 80.000 Geburten/Jahr vs. ca. 130 Mio. weltweit → etwa 1 von 1.600
- Alpen: ca. 60 % der Landesfläche
- Birchermüesli: um 1900 vom Arzt Maximilian Bircher-Benner in Zürich erfunden
- SBB: über 90 % der Züge pünktlich
- 4 Landessprachen; in der Schule wird früh eine zweite Landessprache gelernt
- Schokolade: ca. 10–11 kg pro Kopf und Jahr
- Medianlohn ca. 6.800 CHF brutto/Monat; Kaffee im Café ca. 4,50–5 CHF
- Lebenserwartung ca. 84 Jahre
