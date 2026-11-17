# Gesprächsverlauf – mit Fokus auf die App-/Spielentwicklung

## Vorgeschichte: die TikTok-Serie (Kurzfassung)

1. **Analyse der Vorlagen:** Vier englische „Horror Roulette“-Videos wurden genau analysiert (Aufbau, Licht, Schnitt, Einblendungen, Sound). Ergebnis: `anhang/STYLEGUIDE_Videos.md`.
2. **Video-Generator gebaut:** Ein eigener Generator erzeugt die Videos automatisch (3D-Szenen mit three.js, Cartoon-Figuren, Untertitel, Einblendungen, Sound-Design). Code im Repository unter `video/`.
3. **Stimmen:** Erzähler mit ElevenLabs (Leon Stern), Nebenrollen mit Heidi, Peter, Ben Sonic, Sandra Squirrel. Skripte mit Regieanweisungen für Eleven v3.
4. **Echte Geräusche:** statt synthetischer Effekte CC0-Aufnahmen von BigSoundBank (Klopfen, Schritte, Sirenen, Eulen-Schrei für Mothman usw.).
5. **Fertige Folgen:** 1 Hachishakusama, 2 Mothman, 3 Slender Man, 4 Siren Head (Zuschauerwunsch). Jeweils 70–82 Sekunden, 1080×1920.
6. **Korrekturen auf Wunsch:** schärfere Figuren beim Hochfilmen, realistischere Hecke, echtere Geräusche, Mias und des Jungen Haaransatz (kein „Glatzen“-Streifen mehr).
7. **Posting-Frage:** Empfehlung: erst 1 Video pro Tag, feste Uhrzeit (18–21 Uhr), Vorrat von 5–7 Folgen, nach 2–3 Wochen Statistiken prüfen, erst dann ggf. 2 pro Tag.

## Die App-/Spielentwicklung (ausführlich)

### 1. Kann Claude auf Roblox Studio zugreifen?
**Frage:** „Kannst du auf meine Roblox-Studio-App zugreifen, also siehst du die?“
**Antwort:** Nein, nicht aus dieser Sitzung. Sie läuft in der Cloud; kein Bildschirm, kein Studio, kein Ordner vom PC verbunden (geprüft). Drei Wege wurden genannt:
1. Code und Screenshots über den Chat austauschen (sofort möglich).
2. Einen Ordner vom PC freigeben (Claude Desktop-App → Einstellungen → Claude Code → Remote Control) – Dateien lesbar, Studio-Fenster aber nicht.
3. Eine Sitzung direkt auf dem PC starten (Claude Desktop-App, lokal).

### 2. Funktioniert die Spielidee – und auf welcher Plattform?
**Frage:** Idee eines Spiels zum „Monster-/Horror-Roulette“ für Roblox oder Handy. Funktioniert das? Wie umsetzen? Welche Plattform?
**Antwort (Kern):**
- Ja, kann funktionieren – die TikTok-Serie baut genau das passende Publikum auf.
- **Empfehlung: Roblox zuerst**, keine eigene Handy-App (Begründung in `03_Plattformwahl.md`).
- Spielidee: Lobby im Zellentrakt → Roulette → eine Nacht überleben → die Regel des Monsters herausfinden → Sonnenaufgang → Eindämmungsakte füllen.
- Stärke: Stimmen-Imitation im Mehrspieler (das Monster tut so, als wäre es ein Mitspieler).
- Drei Warnungen: Rechte an Monstern, kein bezahltes Roulette, Altersfreigabe (Details in `07_Recht_Geld_Altersfreigabe.md`).
- Vorgehen: klein anfangen (Lobby, Roulette, 1 Ort, 3 Monster), testen, veröffentlichen, wöchentlich erweitern.

### 3. Was ist Roblox Studio?
**Frage:** „Ich habe noch gar keine Erfahrung. Ist Roblox Studio eine App oder eine Website, und wie komme ich darauf?“
**Antwort:** Kostenlose Computer-App für Windows/Mac (nicht Handy, nicht Browser). Installation über create.roblox.com mit dem normalen Roblox-Konto. Zum Start die offiziellen Einsteiger-Tutorials. Details in `04_Roblox_Studio_Einstieg.md`.

### 4. Spielkonzept
**Auftrag:** „Entwickle mir ein Spielkonzept.“
**Ergebnis:** Ausführliches Konzeptdokument (online bearbeitbar: https://claude.ai/artifact/J3a2FuUaM8vTKSz5UZifPz), vollständig enthalten in `02_Spielkonzept.md`, mit zwei Diagrammen (`diagramme/`).

### 5. Claude mit Roblox Studio verbinden
**Nachricht:** Der Befehl
`claude mcp add --transport stdio Roblox_Studio -- "cmd.exe" "/c" "cd /d %LOCALAPPDATA%\Roblox && .\mcp.bat"`
**Antwort:** Der Befehl ist richtig, muss aber **auf dem Windows-PC** in Claude Code laufen, nicht in der Cloud-Sitzung. Schritt-für-Schritt-Anleitung und ein Starttext für die lokale Sitzung (siehe `05_…` und `06_…`).

### 6. „Geht jetzt“ / „Es ist angezeigt, du kannst zugreifen“
Auf dem PC wurde „Roblox_Studio“ als verbunden angezeigt. In der Cloud-Sitzung waren nach zweimaliger Prüfung trotzdem **keine** Roblox-Werkzeuge vorhanden – nur „ForgeGUI“ (erzeugt Bilder/3D-Modelle/Sounds gegen Guthaben, setzt aber nichts in Studio ein).
**Erklärung:** Es sind zwei getrennte Sitzungen. Der MCP-Server gilt nur für Claude-Sitzungen auf dem PC. Aufträge für Studio müssen im Fenster auf dem PC eingegeben werden.

### 7. Diese ZIP-Datei
**Auftrag:** „Erstelle mir eine ausführliche, lückenlose ZIP-Datei dieses Gesprächs mit Fokus auf die App-Entwicklung.“
