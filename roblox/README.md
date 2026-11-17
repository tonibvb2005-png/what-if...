# HORROR ROULETTE – spielbare Roblox-Version

## Starten (5 Minuten)
1. **HorrorRoulette.rbxl** herunterladen und doppelklicken (öffnet Roblox Studio).
2. Oben **Play** (F5) drücken. Die ganze Welt (Lobby mit Zellenblock, Hütte im Schnee, Monster) baut sich beim Start per Code auf.
3. Im Menü **SPIELEN** → nach dem Countdown dreht das Roulette → die Nacht beginnt.
4. Mit 2 Spielern testen: Reiter **Test** → Clients and Servers → 2 Players → Start.

## Spielen
- Ziel: bis 6 Uhr überleben. Die Regel des Monsters steht auf Zetteln in der Hütte (E drücken). Nach 2 Zetteln wird die Regel allen angezeigt.
- Shift = Sprinten, Taste 1 = Kamera (beim Gesichtslosen wichtig).
- Hutfrau: **Öffne keine Tür** · Schreier: **Mach kein Geräusch** (nicht rennen, Radio aus) · Gesichtslose: **Renn nicht** (nur durch die Kamera sichtbar).

## Speichern (Münzen, Ränge, Eindämmungsakte)
Damit Fortschritt gespeichert wird: Spiel veröffentlichen, dann *Game Settings → Security → Enable Studio Access to API Services*. Ohne das läuft alles, nur ohne Speichern (Warnung im Output).

## Sounds
`Config.Sounds` in `ReplicatedStorage/HorrorRoulette/Config` ist leer. Eigene Sounds hochladen (Creator Hub → Audio) und die IDs als `"rbxassetid://123..."` eintragen. Ohne IDs ist das Spiel stumm, funktioniert aber.

## Ordner
- `src/` – der Quellcode (Luau), genau so wie er in der .rbxl steckt.
- `tools/` – Lune-Skripte: `build_place.luau` (baut die .rbxl), `compile_all.luau`, `test_world.luau`, `test_round.luau` (Simulation mit 2 Testspielern).
