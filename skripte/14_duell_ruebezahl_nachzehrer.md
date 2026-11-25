# Folge 14 – DUELL: Rübezahl vs. Nachzehrer (neues Format)

Format: **Horror Roulette · Duell** – zwei Monster: eins **beschützt** dich, eins **jagt** dich. Ziel: ~80–90 s.
Eigene Begriffe (nicht kopiert): „Beschützer“ / „Jäger“, „Opas Regeln“, Kampf-Anzeige „Beschützer ⟷ Jäger“, Stempel „Überlebt“, Replay „Regel gebrochen“.
Beide Monster sind deutsche/mitteleuropäische Sagengestalten:
- **Rübezahl** – Berggeist aus dem Riesengebirge. Hilft guten Menschen, straft Spötter. Er hasst es, „Rübezahl“ genannt zu werden (ein Spottname).
- **Nachzehrer** – ein Toter, der im Grab sein Leichentuch kaut und nachts die Kirchenglocke läutet. Wer die Schläge mitzählt, ist der Nächste. Eine Münze in seinem Mund hält ihn auf.

Struktur: Roulette (2 Reihen) → Duell-Karte → Opas 3 Regeln → Geschichte mit Anzeigen → Kampf → „Überlebt“ → Replay: Regel gebrochen → Frage an die Zuschauer.

---

## A) Sprechskript für ElevenLabs (Modell: Eleven v3 · Stability: Natural)

### 1) Erzähler → `erzaehler.mp3` · Stimme: Leon Stern
```
[quiet, ominous] Zwei Monster sind los. [pause] Eins beschützt dich. [pause] Eins jagt dich.
[long pause]
[teasing] Dein Beschützer? [pause] [low] Rübezahl. Aus dem Riesengebirge.
[long pause]
[tense] Dein Jäger? [pause] [low, ominous] Der Nachzehrer. Aus dem alten Friedhof.
[long pause]
[serious] Wer gewinnt?
[long pause]
[calm] Winterferien bei Opa. [pause] Ein Bergdorf, eingeschneit.
[long pause]
[slowly] Opas Regeln. [pause] Eins: [pause] Wenn nachts die Kirchenglocke läutet, zähl nicht mit.
[pause] Zwei: [pause] Hab immer eine Münze dabei.
[pause] Drei: [pause] Nenn den Berggeist niemals Rübezahl.
[long pause]
[uneasy] Vor drei Tagen wurde der alte Nachbar beerdigt. [pause] Seitdem hört man nachts ein Schmatzen. [pause] Aus seinem Grab.
[long pause]
[tense] Mitternacht. [pause] Die Kirchenglocke läutet.
[long pause]
[whispering] Du zählst mit, ohne es zu wollen. [pause] Neun. [pause] Zehn. [pause] Elf.
[long pause]
[fast, scared] Die Erde auf dem Grab bricht auf.
[long pause]
[low, ominous] Der Nachzehrer. [pause] Ein Toter, der sein Leichentuch zerkaut. [pause] Und der seine Familie zu sich holt. [pause] Einen nach dem anderen.
[long pause]
[tense, fast] Er zieht sich aus dem Grab. [pause] Und kommt auf dich zu.
[long pause]
[panicked] Du rennst in den Wald. [pause] Den Berg hinauf. [pause] Er holt auf.
[long pause]
[slowly, awe] Dann bebt der Berg.
[long pause]
[low, powerful] Aus Fels und Schnee steht ein Riese auf. [pause] Mit einem Bart aus Eis.
[long pause]
[serious] Der Herr der Berge. [pause] Er beschützt die, die gut zu ihm sind.
[long pause]
[fast, intense] Der Riese packt den Toten. [pause] Doch der beißt und reißt sich los.
[long pause]
[urgent] Du erinnerst dich an Opas Münze. [pause] Du wirfst sie. [pause] Mitten in sein Maul.
[long pause]
[slowly] Der Nachzehrer erstarrt. [pause] Der Berg verschluckt ihn.
[long pause]
[relieved] Stille. [pause] Du hast überlebt.
[long pause]
[happy, relieved] Du rufst: [pause] Danke, Rübezahl!
[long pause]
[slowly, dread] Der Riese dreht sich langsam um.
[long pause]
[whispering, chilling] Seitdem findet niemand mehr den Weg aus dem Dorf.
[long pause]
[normal, friendly] Hättest du seinen Namen gesagt? [pause] Schreib es in die Kommentare.
```

### 2) Opa → `opa.mp3` · eine Zeile
Stimme: **Peter** (wie Opa in Folge 1)
*(Kommt nach Regel drei – als Warnung.)*
```
[serious, quiet, grandfatherly] Merk dir das gut. [pause] Der Berg hört alles.
```

### 3) Rübezahl → `ruebezahl.mp3` · eine Zeile
Stimme: Voice Design:
*„Sehr tiefe, grollende, uralte Männerstimme, langsam, wie ein Berg, mit Hall, Standarddeutsch.“*
*(Kommt nach „Der Riese dreht sich langsam um.“)*
```
[very deep, slow, menacing] Wie... [pause] hast du mich genannt?
```

**Wo die Zeilen im Video kommen:**
| Zeile | kommt nach … |
|---|---|
| Opa: „Merk dir das gut …“ | „Drei: Nenn den Berggeist niemals Rübezahl.“ |
| Rübezahl: „Wie hast du mich genannt?“ | „Der Riese dreht sich langsam um.“ |

---

## B) Szenenplan (Kurzfassung) – mit den neuen Anzeigen

| # | Text | Bild | Anzeige / Effekt |
|---|---|---|---|
| 1 | Zwei Monster sind los … | **Duell-Roulette:** zwei Reihen Zellen – oben „Beschützer“ (grün), unten „Jäger“ (rot) | |
| 2 | Dein Beschützer? Rübezahl | Obere Reihe stoppt: Rübezahl | Karte `BESCHÜTZER · RIESENGEBIRGE` |
| 3 | Dein Jäger? Nachzehrer | Untere Reihe stoppt: Nachzehrer | Karte `JÄGER · FRIEDHOF` |
| 4 | Wer gewinnt? | **Duell-Karte:** beide gegenüber, Blitz in der Mitte | `WER GEWINNT?` |
| 5 | Winterferien bei Opa | Bergdorf im Schnee, Kirche, Friedhof | Uhr `20:00` |
| 6 | Opas Regeln 1–3 | Zettel „Opas Regeln“, drei Zeilen erscheinen | Checkboxen ☐ ☐ ☐ |
| 7 | Opa: „Merk dir das gut …“ | Opa nah, ernst | |
| 8 | Beerdigt, Schmatzen | Frisches Grab, Erde bewegt sich | Ton: Kauen |
| 9 | Mitternacht, Glocke | Kirchturm, Glocke schwingt | Uhr `00:00` · `GLOCKENSCHLÄGE: 1` |
| 10 | Du zählst mit … Neun, zehn, elf | Junge am Fenster, Lippen bewegen sich | Zähler `9 → 10 → 11` · **`REGEL 1 GEBROCHEN`** · `REGELN GEBROCHEN: 1/3` |
| 11 | Erde bricht auf | Grab bricht auf, Hand mit Tuchfetzen | Schreck |
| 12 | Der Nachzehrer … | Rot: Nachzehrer, Leichentuch im Mund | |
| 13 | Zieht sich raus, kommt auf dich zu | Er kriecht über den Friedhof | `ABSTAND: 80 M` |
| 14 | Rennst in den Wald | Junge rennt bergauf, Schnee | `ABSTAND: 40 M → 15 M` |
| 15 | Der Berg bebt | Kamera wackelt, Schnee rieselt | |
| 16 | Riese aus Fels und Schnee | Rübezahl erhebt sich riesig hinter den Tannen | `GRÖSSE: 30 M` |
| 17 | Herr der Berge … | Rot-grün geteilt: Rübezahl | |
| 18 | Packt den Toten, er reißt sich los | **Kampf** | **Kampf-Anzeige `BESCHÜTZER ⟷ JÄGER`** schwankt |
| 19 | Münze ins Maul | Münze fliegt in Zeitlupe | `REGEL 2 ✓` |
| 20 | Erstarrt, Berg verschluckt ihn | Erde schließt sich | Anzeige kippt zum Beschützer |
| 21 | Du hast überlebt | Junge atmet auf | Stempel **`ÜBERLEBT · BESCHÜTZER GEWINNT`** |
| 22 | „Danke, Rübezahl!“ | Junge winkt | |
| 23 | Riese dreht sich um + „Wie hast du mich genannt?“ | Gesicht des Riesen kommt nah, Augen glühen | **Replay:** Szene 22 zurückgespult, roter Kreis um den Mund · **`REGEL 3 GEBROCHEN`** · `REGELN GEBROCHEN: 2/3` |
| 24 | Niemand findet den Weg aus dem Dorf | Dorf im Schneesturm, Wege verschwinden | |
| 25 | Frage an Zuschauer | „Hättest du seinen Namen gesagt?“ | |
| 26 | End-Card | `@interestingstuff` | |

## C) Beschreibung für TikTok
```
Einer beschützt dich. Einer jagt dich. Aber was, wenn der Beschützer gefährlicher ist? ⛰️⚰️

Hättest du seinen Namen gesagt? 👇

Folge @interestingstuff – Horror Roulette: DUELL 🎰

#horror #gruselig #rübezahl #nachzehrer #sagen #gruselgeschichte #horrorroulette #horrortok #fy
```
