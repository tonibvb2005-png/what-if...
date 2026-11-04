# Polako 🇭🇷 – Kroatisch, Schritt für Schritt

Web-App zum spielerischen Kroatisch-Lernen für Lernende mit Grundkenntnissen und Familie in Kroatien.
Konzept und Roadmap: [PLAN.md](PLAN.md).

## Starten

```bash
npm install
npm run dev      # Entwicklungsserver auf http://localhost:5173
npm test         # Unit-Tests
npm run build    # Produktions-Build nach dist/
```

Am einfachsten: die App als Webseite öffnen (Link im Pull Request bzw. im Chat). Für eine einzelne HTML-Datei: `npm run build:single` → `dist/polako.html`.

Auf dem Handy (selbst gehostet): `npm run dev -- --host` und die angezeigte Netzwerk-Adresse öffnen,
oder den `dist/`-Ordner auf einen statischen Hoster (z. B. GitHub Pages) legen und
„Zum Startbildschirm hinzufügen“ wählen.

## Funktionen

- Teil 1 (Zagreb → Dubrovnik): Familie, Essen bei Oma, Smalltalk, Meer, Perfekt, Futur, Feste, Gefühle
- Teil 2 (Rijeka → Osijek): Arzt & Apotheke, Wohnen, Arbeit, Einkaufen & Zahlen, Telefonieren, Redewendungen, Verbpaare & Fälle
- Wiederholung nach Spaced-Repetition-Prinzip
- Mini-Spiele: Karteikarte, Auswahl, Hör-Detektiv, Tippen, Satz-Puzzle, Fall-Fänger, Wort-Match
- Vokabeltrainer: alle Wörter frei üben (Lektionen, Übungsart, Richtung und Anzahl wählbar) plus durchsuchbare Wörterliste
- Eigene Wörter aus dem Kurs eintragen
- XP, Level, Tagesziel, Streak, Abzeichen, Statistik
- Aussprache über die Sprachausgabe des Browsers (kroatische Stimme nötig für Hörübungen)

## Inhalte erweitern

Lektionen liegen in `src/content/lessons.ts`. Jede Karte: `[kroatisch, deutsch, Beispielsatz, Übersetzung, Alternativen?]`,
jede Grammatik-Übung: `[Satz mit ___, Hinweis, Übersetzung, Optionen, Lösung]`.
