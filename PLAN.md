# Plan: Kroatisch-Lern-App „Polako“

> *polako* = „langsam, Schritt für Schritt“ – das Motto der App.

Ziel: Eine App, mit der man **täglich 10–15 Minuten** spielerisch Kroatisch lernt und dabei
nachweisbar Fortschritte macht – von Null bis ca. Niveau A2/B1 (Alltag, Urlaub, Familie).

---

## 1. Lernprinzipien (warum es effektiv ist)

| Prinzip | Umsetzung in der App |
|---|---|
| **Spaced Repetition** | Jede Vokabel/Phrase hat einen eigenen Wiederholungs-Zeitplan (Algorithmus SM-2, später FSRS). Was man kann, kommt seltener, was man vergisst, öfter. |
| **Aktives Abrufen** | Nicht nur wiedererkennen (Multiple Choice), sondern selbst produzieren: tippen, sprechen, Sätze bauen. Schwierigkeit steigt pro Wort stufenweise. |
| **Kontext statt Einzelwörter** | Jedes Wort wird in einem Beispielsatz und in Mini-Dialogen gelernt. |
| **Hören & Sprechen von Anfang an** | Jede Karte mit Audio (Text-to-Speech `hr-HR`), Ausspracheübungen per Spracherkennung. |
| **Kleine Grammatik-Häppchen** | Grammatik wird nicht als Tabelle gepaukt, sondern in Mustern geübt („u Zagreb**u**“, „vidim Zagreb“). |
| **Kurze Sessions, tägliche Routine** | Tagesziel, Streak, 5-Minuten-Modus für stressige Tage. |

### Kroatisch-spezifische Schwerpunkte
- **Aussprache & Schrift:** č / ć, dž / đ, š, ž, das rollende „r“ (z. B. *prst*, *trg*). Eigenes Einsteiger-Modul.
- **7 Fälle:** Werden schrittweise eingeführt – Nominativ → Akkusativ → Lokativ → Genitiv → Dativ → Instrumental → Vokativ.
- **Verbaspekt** (*pisati* / *napisati*): Paare werden immer zusammen gelernt.
- **Wortstellung & Enklitika** (*Ja **sam** ga vidio* / *Vidio **sam** ga*): Satzbau-Puzzles.
- **Tippen ohne Sonderzeichen-Tastatur:** „c“ statt „č“ wird als *fast richtig* gewertet, mit Hinweis.

---

## 2. Spielerische Elemente (Gamification)

- **XP & Level:** XP für jede Übung, Bonus für fehlerfreie Runden.
- **Streak** 🔥 mit „Streak-Freeze“ (1× pro Woche verpasst = kein Verlust).
- **Reise-Karte Kroatiens:** Jede Lektion ist eine Station (Zagreb → Plitvice → Zadar → Split → Hvar → Dubrovnik …). Neue Orte werden freigeschaltet, mit kleinem Kultur-Fakt.
- **Abzeichen:** z. B. „Kafić-Profi“ (Bestellen im Café), „Fallmeister Lokativ“, „7 Tage am Stück“.
- **Mini-Spiele:**
  1. **Wort-Match** – Paare zuordnen gegen die Uhr.
  2. **Satz-Puzzle** – Wörter in richtige Reihenfolge ziehen.
  3. **Fall-Fänger** – Die richtige Endung schnappen (*Zagreb → u Zagreb__*).
  4. **Hör-Detektiv** – Audio hören, richtiges Wort/Bild wählen.
  5. **Dialog-Abenteuer** – Interaktive Szenen (Markt in Split, Bäckerei, Verwandtenbesuch) mit Antwortauswahl, später freier Eingabe.
  6. **Aussprache-Challenge** – Wort nachsprechen, Spracherkennung bewertet.
- **Wochen-Challenge:** z. B. „50 neue Wörter“ oder „3 Dialoge ohne Fehler“.

---

## 3. Inhalte (Curriculum)

Gegliedert in **Einheiten** → **Lektionen** (je ~10 neue Wörter/Phrasen + 1 Grammatikmuster).

| Einheit | Themen | Grammatik |
|---|---|---|
| 0. Start | Alphabet, Aussprache, Begrüßung | – |
| 1. Ich & du | Vorstellen, Herkunft, Zahlen 1–20 | *biti* (sam, si, je …), Personalpronomen |
| 2. Im Café | Bestellen, Getränke, Essen | Akkusativ, *htjeti/željeti* |
| 3. Unterwegs | Orte, Richtungen, Verkehrsmittel | Lokativ (*u/na*), Präsens a-/i-/e-Verben |
| 4. Familie | Familienmitglieder, Besitz | Genitiv, Possessivpronomen |
| 5. Alltag | Uhrzeit, Wochentage, Routine | Reflexive Verben (*se*), Enklitika |
| 6. Einkaufen | Markt, Preise, Mengen | Genitiv nach Zahlen/Mengen |
| 7. Vergangenheit | Urlaub erzählen | Perfekt (*bio sam*), Verbaspekt |
| 8. Pläne | Wetter, Zukunft, Verabredungen | Futur I (*ću, ćeš …*), Dativ |
| 9. Gefühle & Meinungen | Mögen, Gesundheit | Instrumental (*s/sa*), Vokativ |

Start mit ca. **800–1000 häufigsten Wörtern** + ca. 300 Alltagsphrasen.
Standard-Kroatisch (Ijekavisch), mit Hinweisen auf regionale Varianten (z. B. Dalmatien: *pomidor* vs. *rajčica*).

---

## 4. Ablauf einer Lern-Session

1. **Aufwärmen:** fällige Wiederholungen (Spaced Repetition), max. ~5 Min.
2. **Neues:** 5–10 neue Karten der aktuellen Lektion, mit Audio & Beispielsatz.
3. **Üben:** gemischte Mini-Spiele mit neuem + altem Stoff.
4. **Abschluss:** Mini-Dialog der Lektion, XP-Zusammenfassung, Streak.

Jedes Wort durchläuft Stufen: **Erkennen** (Auswahl) → **Hören** → **Produzieren** (tippen) → **Sprechen** → **im Satz anwenden**.

---

## 5. Technische Umsetzung

**Plattform:** Progressive Web App (läuft im Browser auf Handy & PC, installierbar, offline nutzbar).

| Bereich | Wahl | Begründung |
|---|---|---|
| Frontend | React + TypeScript + Vite | schnell, verbreitet, gut testbar |
| Styling | Tailwind CSS | schnelles, konsistentes UI |
| Speicherung | IndexedDB (via Dexie) | Fortschritt lokal & offline, kein Server nötig |
| Audio | Web Speech API (TTS `hr-HR`), später echte Aufnahmen | kostenlos, sofort verfügbar |
| Aussprache | Web Speech Recognition `hr-HR` (wo unterstützt) | einfaches Feedback |
| Inhalte | JSON-Dateien im Repo | leicht erweiterbar, versionierbar |
| Tests | Vitest + Playwright | Logik & UI absichern |
| Optional später | Sync/Login (z. B. Supabase), KI-Gesprächspartner | erst nach MVP |

### Datenmodell (vereinfacht)
```ts
Card      { id, hr, de, example_hr, example_de, audio?, tags, lessonId, type: 'word'|'phrase'|'pattern' }
Lesson    { id, unitId, title, cardIds, grammarNote, dialogId }
Review    { cardId, stage, ease, intervalDays, dueDate, lapses }
Profile   { xp, level, streak, lastActiveDate, dailyGoal, badges[] }
```

### Projektstruktur
```
src/
  content/        # Einheiten, Lektionen, Karten, Dialoge (JSON)
  srs/            # Spaced-Repetition-Algorithmus
  games/          # Mini-Spiele als Komponenten
  features/       # Session, Karte, Profil, Statistik
  storage/        # IndexedDB
```

---

## 6. Roadmap

**Phase 1 – MVP (Basis zum täglichen Lernen)**
- Einheiten 0–2 (~150 Wörter/Phrasen)
- Karteikarten mit Audio + Spaced Repetition
- 3 Mini-Spiele: Wort-Match, Tippen, Hör-Detektiv
- XP, Streak, Tagesziel, offline-fähig

**Phase 2 – Mehr Spiel & Grammatik**
- Satz-Puzzle, Fall-Fänger, Dialog-Abenteuer
- Reise-Karte & Abzeichen
- Einheiten 3–5, Statistik-Seite (gelernte Wörter, Genauigkeit)

**Phase 3 – Sprechen & Ausbau**
- Aussprache-Challenge, Einheiten 6–9
- Eigene Karten hinzufügen
- Optional: Sync zwischen Geräten, KI-Gesprächspartner für freie Dialoge

---

## 7. Entscheidungen (Lernprofil)

- **Vorkenntnisse:** Grundlagen vorhanden + wöchentlicher Kurs → Start auf Niveau A1+/A2, kein Alphabet-Modul.
- **Ziel:** Familie in Kroatien → Themen rund um Familie, Essen bei Oma, Smalltalk, Feste, Gefühle.
- **Plattform:** Web-App (PWA).
- **Kurs-Begleitung:** Eigene Wörter aus dem Kurs eintragen und mitlernen („Kurs-Wörter“).

## 8. Umgesetzt in Version 0.1

- 8 Stationen (Zagreb → Dubrovnik) mit je 12 Wörtern/Phrasen, Beispielsätzen und Grammatik-Häppchen
- Spaced Repetition (SM-2-Variante mit Stufen 1–5)
- Übungen: Karteikarte, Auswahl (beide Richtungen), Hör-Detektiv, Tippen (mit č/ć/đ/š/ž-Tasten, Toleranz für fehlende Häkchen), Satz-Puzzle, Fall-Fänger, Wort-Match
- XP, Level, Tagesziel, Streak mit Streak-Schutz, Abzeichen, 7-Tage-Statistik
- Kurs-Wörter, Frei-üben-Modus, alle Lektionen freischaltbar
- Offline-fähig, Export/Import des Fortschritts
- Hinweis: Speicherung vorerst in `localStorage` statt IndexedDB (Datenmenge ist klein)
