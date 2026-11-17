# Claude mit Roblox Studio verbinden (MCP)

## Der Befehl
```
claude mcp add --transport stdio Roblox_Studio -- "cmd.exe" "/c" "cd /d %LOCALAPPDATA%\Roblox && .\mcp.bat"
```
Er trägt den offiziellen Roblox-Studio-MCP-Server in **Claude Code auf deinem Windows-PC** ein.
`mcp.bat` wird von Roblox installiert und liegt in `%LOCALAPPDATA%\Roblox`.

## Wichtig: zwei getrennte Sitzungen
| Sitzung | Wo sie läuft | Zugriff auf Roblox Studio? |
|---|---|---|
| Die Sitzung, in der die Videos gebaut wurden | Cloud-Server (Linux) | **Nein** – kein `cmd.exe`, kein Studio, kein Zugriff auf Programme deines PCs |
| Claude Code auf deinem PC (Desktop-App „Code“ lokal oder Terminal) | dein Windows-PC | **Ja**, nach dem Befehl oben |

Ein MCP-Server, der auf deinem PC eingerichtet ist, gilt **nur** für Claude-Sitzungen, die auf deinem PC laufen. Er wird nicht in eine Cloud-Sitzung übertragen. Deshalb hat die Cloud-Sitzung trotz „verbunden“-Anzeige auf dem PC keine Roblox-Werkzeuge gesehen (zweimal geprüft).

## Schritt für Schritt
1. **Roblox Studio öffnen** und ein Projekt laden (z. B. Baseplate).
2. **MCP in Studio einschalten,** falls nötig (je nach Version Plugin oder Einstellung in Studio).
3. **Claude Code auf dem PC** bereitstellen: in der Claude Desktop-App im Bereich „Code“ eine **lokale** Sitzung starten oder Claude Code im Windows-Terminal installieren.
4. **Den Befehl** in Eingabeaufforderung oder PowerShell auf dem PC ausführen.
5. **Neue lokale Sitzung starten,** während Studio offen ist. Mit `/mcp` prüfen: „Roblox_Studio“ muss als verbunden erscheinen. ✔ (Bei dir: erledigt.)
6. **Aufträge im Fenster auf dem PC eingeben** – siehe `06_Startauftrag_lokale_Sitzung.md`.

## Was die lokale Sitzung dann kann
Teile erstellen, Skripte schreiben und einfügen, den Aufbau des Projekts ansehen – z. B. die Lobby mit Roulette aus dem Spielkonzept bauen.

## Fehlersuche
- `/mcp` zeigt nicht „verbunden“ → Studio geöffnet? Projekt geladen? MCP in Studio eingeschaltet? Claude Code neu starten.
- Befehl schlägt fehl → existiert `%LOCALAPPDATA%\Roblox\mcp.bat`? (Im Explorer `%LOCALAPPDATA%\Roblox` in die Adresszeile eingeben.)
- Bei Fehlermeldungen: Screenshot machen und nachfragen.

## Hinweis zu „ForgeGUI“
In der Cloud-Sitzung tauchten Werkzeuge namens „ForgeGUI“ auf. Das ist ein externer Dienst, der Bilder, 3D-Modelle und Sounds erzeugt – er setzt aber **nichts direkt in Studio ein** und verbraucht **Guthaben** auf einem ForgeGUI-Konto.
