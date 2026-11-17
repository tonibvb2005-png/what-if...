# Startauftrag für die Claude-Sitzung auf deinem PC

Die lokale Sitzung kennt dieses Gespräch nicht. Kopiere einen der beiden Texte als **erste Nachricht** in das Fenster, in dem `/mcp` „Roblox_Studio“ als verbunden anzeigt.

## Variante A – kurz (mit Link)
```
Ich baue ein Roblox-Horrorspiel namens „Horror Roulette“. Das Spielkonzept steht hier:
https://claude.ai/artifact/J3a2FuUaM8vTKSz5UZifPz
Ich bin Anfänger in Roblox Studio, erkläre mir deshalb jeden Schritt kurz.
Bau mit dem Roblox-Studio-Zugriff Phase 2, Teil 1: die Lobby im Zellentrakt (dunkler Raum, 5 Zellen mit
Podesten und Spotlights, rote Alarmlichter, Titel „Horror ROULETTE“, gelbe Zeigerlinie in der Mitte).
Danach das Roulette-Skript: Der Server wählt ein zufälliges Monster, alle Spieler sehen eine Dreh-Animation,
die abbremst und einrastet.
Mach nach jedem größeren Schritt eine kurze Pause, damit ich in Studio auf „Play“ drücken und testen kann.
```

## Variante B – ausführlich (ohne Link, alles drin)
```
Ich baue ein Roblox-Horrorspiel namens „Horror Roulette“ (passend zu meiner TikTok-Serie @interestingstuff).
Ich bin Anfänger in Roblox Studio: Erkläre jeden Schritt kurz, baue in kleinen Schritten und mach nach jedem
größeren Schritt eine Pause, damit ich mit „Play“ testen kann.

SPIELIDEE
- Koop-Horror für 1–4 Spieler, Runden à 5–8 Minuten.
- Ablauf: Lobby im Zellentrakt → Roulette lost Monster (und später Ort) aus → eine Nacht überleben
  (Uhr läuft von 00:00 bis 06:00) → wer die Regel des Monsters bricht, wird geholt (Jumpscare, danach Zuschauer)
  → Sonnenaufgang = überlebt → Belohnung (Monster in der „Eindämmungsakte“, Münzen, Rang) → zurück zur Lobby.
- Jedes Monster hat EINE Regel, die die Spieler über Hinweise (Zettel, Radio, Geräusche) herausfinden müssen.
- Start-Monster: „Die Hutfrau“ (Regel: öffne keine Tür bis Sonnenaufgang), „Der Schreier“ (Regel: mach kein
  Geräusch – Rennen, Türknallen lockt ihn an), „Der Gesichtslose“ (Regel: renn nicht, nur durch die Kamera sichtbar).
- Monster täuschen: falsche Chat-Nachrichten im Namen von Mitspielern („Mach auf, ich bin's“).

TECHNIK (bitte so aufbauen)
- Server entscheidet alles Wichtige (Roulette-Ergebnis, Regelbruch, wer geholt wird).
- Rundenablauf: Script in ServerScriptService. Roulette: Server wählt, LocalScript animiert.
- Pro Monster ein ModuleScript mit gleichem Aufbau (Name, Regel, Hinweise, Verhalten).
- Später: PathfindingService (Bewegung), ProximityPrompt (Zettel/Türen), DataStoreService (Speichern), ScreenGui (Einblendungen).

LOOK
- Dunkel, warm gegen kalt (orange Laternen drinnen, blaue Nacht draußen), rotes Alarmlicht bei Gefahr, Nebel.
- Lobby wie mein Video-Intro: Zellen mit Spotlights, Podeste mit farbigen Leuchtringen, Namensschilder über den
  Zellen, rote „AUSBRUCH“-Schilder, gelbe Zeigerlinie in der Mitte, Titel „Horror ROULETTE“ (Horror weiß, ROULETTE rot).
- Einblendung oben: rote Pille „HORROR ROULETTE • MONSTERNAME“ und darunter die laufende Uhrzeit.

REGELN
- Kein Blut, keine sichtbare Gewalt (Grusel über Licht, Ton, Jumpscares).
- Roulette-Drehs sind kostenlos, nie für Robux.
- Keine fremden Toolbox-Skripte einbauen.

ERSTER AUFTRAG
1. Baue die Lobby im Zellentrakt mit 5 Zellen (Monster vorerst als einfache Platzhalter-Figuren).
2. Schreibe das Roulette: Server wählt zufällig, alle sehen ein Rad/Band, das schnell dreht, abbremst und
   auf dem gewählten Monster einrastet; danach kurzes rotes Alarm-Blinken.
```

## Danach – mögliche nächste Aufträge
1. Die Hütte als ersten Schauplatz bauen (4 Zimmer, Flur, Haustür, Fenster, Laterne, Radio).
2. Rundenablauf mit Uhr 00:00 → 06:00 und Teleport Lobby ↔ Hütte.
3. Monster 1 „Die Hutfrau“: Klopfen an der Tür, Regelprüfung „Tür geöffnet?“, Jumpscare.
4. Hinweise (Zettel per ProximityPrompt) und Regel-Karte als Einblendung.
5. Eindämmungsakte mit Speichern (DataStoreService).
