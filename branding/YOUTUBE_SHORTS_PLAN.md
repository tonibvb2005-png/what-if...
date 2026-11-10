# YouTube Shorts: Kanal-Setup & Posting-Plan

## 1. Dateien

| Datei | Wofür | Format |
|---|---|---|
| `profile.png` | Profilbild (YouTube + TikTok) | 800×800 PNG; YouTube schneidet es rund zu, siehe `profile_circle_preview.png` |
| `banner.png` | Kanalbanner | 2560×1440 PNG, ca. 1 MB (Limit 6 MB) |
| `banner_safe_area_preview.png` | nur zur Kontrolle, **nicht hochladen** | roter Rahmen = auf jedem Gerät sichtbar (Handy), grüner Streifen = Desktop |

Titel und Untertitel liegen komplett im roten Bereich und sind damit auf dem Handy sichtbar. Die äußeren Figuren sieht man nur am Desktop und auf dem TV.
Neu erzeugen: `cd render && node brand.cjs` (http.server auf Port 8765 muss laufen), danach liegen die Bilder in `render/out/brand/`.

## 2. Kanal-Einstellungen

- **Name:** `What If...?` (gleicher Name wie auf TikTok, damit man dich wiedererkennt)
- **Handle:** gleich wie dein TikTok-Handle, falls frei. Sonst z. B. `@whatif.history` oder `@whatifhistoryshorts`
- **Beschreibung (englisch, weil die Videos englisch sind):**
  > What if one person had done it differently? 🤔
  > Short animated stories about weird jobs, crazy ideas and the people who changed history, one decision at a time.
  > New Shorts every week. 🏛️☢️⚓🤠
- **Kanal-Keywords:** what if, history, history shorts, animated history, weird jobs, fun facts, storytime
- **Land:** Deutschland. **Standardsprache für Videos:** Englisch (wichtig, damit YouTube die Videos englischsprachigen Zuschauern zeigt)
- **Upload-Standards** (YouTube Studio → Einstellungen → Upload-Standards): Kategorie *Bildung* oder *Film & Animation*, Sprache Englisch, Standard-Tags `#shorts #whatif #history`
- **„Made for Kids“: NEIN** wählen. Cartoon-Optik, aber Themen wie Atomkrieg und Krankheiten sind kein Kinderprogramm, und „Für Kinder“ schaltet Kommentare ab.
- **Playlists anlegen:** `Cold War What Ifs` (#003, #004), `Ancient & Old Jobs` (#001, #005, #006), `Medicine What Ifs` (#002)

## 3. Posting-Zeiten

Die Videos sind englisch, also kommt das größte Publikum aus den **USA**. Die Zeiten unten sind deutsche Zeit (MEZ):

| Plattform | Uhrzeit (DE) | entspricht USA | Warum |
|---|---|---|---|
| **YouTube Shorts** | **20:00** | 14:00 Ostküste / 11:00 Westküste | Mittagspause USA, gleichzeitig Abend in Europa |
| **TikTok** | **19:00** | 13:00 Ostküste | Das gleiche Video eine Stunde früher auf TikTok, damit sich die Plattformen nicht gegenseitig Zuschauer wegnehmen |

- Bei YouTube die Videos **planen** (Upload → Sichtbarkeit → „Planen“), du musst nicht live dabei sein.
- Achtung Zeitumstellung: Zwischen **14.03. und 28.03.2027** liegen USA und Deutschland nur 5 statt 6 Stunden auseinander. In der Zeit postest du 1 Stunde früher (YouTube 19:00, TikTok 18:00).
- Diese Zeiten sind ein **Startwert**. Nach 2–3 Wochen in YouTube Studio → Analytics → Zielgruppe → „Wann deine Zuschauer auf YouTube sind“ nachsehen und die Zeit dorthin verschieben.

## 4. Rhythmus

**4 Shorts pro Woche: Mo, Mi, Fr, So.**
Bei neuen Kanälen zählt **Regelmäßigkeit mehr als Menge**. 4 Videos pro Woche sind mit unserem Ablauf (Skript → deine Stimme → Video) gut zu schaffen. Täglich posten mit halbfertigen Videos bringt weniger. Ein Video pro Plattform und Tag reicht.

## 5. Plan für die ersten 3 Wochen

Die stärksten, am breitesten verständlichen Hooks kommen zuerst. Die ersten Videos entscheiden, welchem Publikum YouTube den Kanal zeigt.

| Datum | Video | Status |
|---|---|---|
| Mi 11.11. | **#006 Jeans-Nieten** („What if one tailor hadn't hammered horse rivets…“) | ✅ fertig |
| Fr 13.11. | **#003 Petrow** („What if one man had followed the rules?“) | ✅ fertig |
| So 15.11. | **#001 Römerstraße** | ✅ fertig |
| Mo 16.11. | **#005 Kupfer am Schiff** | ✅ fertig |
| Mi 18.11. | **#004 Archipow** („What if one man had said yes?“), passt als Fortsetzung zu #003 | ✅ fertig |
| Fr 20.11. | **#002 Semmelweis** | ⏳ braucht deine Stimme |
| So 22.11. | #007 (neu, z. B. Piraten oder Leuchtturmwärter) | 🔜 Skript folgt |
| Mo 23.11. | #008 | 🔜 |
| Mi 25.11. | #009 | 🔜 |
| Fr 27.11. | #010 | 🔜 |
| So 29.11. | #011 | 🔜 |

→ Damit der Plan aufgeht, brauchen wir ab jetzt **ca. 4 neue Videos pro Woche**. Am besten immer ca. 1 Woche Vorrat haben.

## 6. Pro Upload, Checkliste

1. **Datei:** das `_FINAL.mp4` direkt hochladen (1080×1920, unter 3 Minuten → wird automatisch ein Short). **Nicht** das von TikTok heruntergeladene Video mit Wasserzeichen. Das wird auf YouTube schlechter ausgespielt.
2. **Titel** (max. ca. 60 Zeichen, englisch, mit Neugier-Lücke). Vorschläge:
   - #006 `What if he never put rivets on jeans? 👖`
   - #003 `The man who ignored 5 nuclear missiles ☢️`
   - #001 `Why Roman roads still exist today 🏛️`
   - #005 `They laughed at the copper… until the worms came 🪱`
   - #004 `One “no” that stopped a nuclear war 🌊`
   - #002 `They laughed at him for washing his hands 🧼`
3. **Beschreibung:** die Caption aus der jeweiligen `videos/00X_*.md` + `#shorts`. Insgesamt 3–5 Hashtags, mehr bringt nichts.
4. **Angepinnter Kommentar** mit einer Frage, die Antworten provoziert, z. B. #006 „Check your jeans right now 👀“, #003 „Would YOU have pressed the button?“
5. **Ähnliches Video verknüpfen** (Feld „Related video“ beim Upload): #004 ↔ #003, #005 ↔ #001 usw. So schauen Zuschauer gleich das nächste Video.
6. **Erste Stunde:** auf Kommentare antworten. Das zählt als Interaktion und hilft der Reichweite.

## 7. Was du nach 2 Wochen anschaust (YouTube Studio)

- **„Angesehen vs. weggewischt“** (Shorts-Kennzahl): Ziel über 70 %. Ist der Wert niedrig, ist der Hook in den ersten 2 Sekunden zu schwach. Gib mir Bescheid, dann ändere ich den Einstieg bei den nächsten Videos.
- **Durchschnittliche Wiedergabedauer in %:** über 80 % ist sehr gut. Bei Werten über 100 % schauen die Leute das Video mehrfach (Loop).
- Schick mir einfach Screenshots der Werte, dann passe ich Themen, Länge und Hook an.
