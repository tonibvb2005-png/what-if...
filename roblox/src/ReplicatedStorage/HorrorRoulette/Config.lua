-- HORROR ROULETTE – zentrale Einstellungen (Server und Client lesen diese Datei)
-- Alles, was man ohne Programmierkenntnisse anpassen möchte, steht hier.

local Config = {}

-- Zeiten in Sekunden
Config.IntermissionSeconds = 20   -- Countdown in der Lobby, bevor das Roulette dreht
Config.RouletteSeconds = 7        -- Dauer der Roulette-Animation inkl. Einrasten
Config.NightSeconds = 300         -- eine Nacht (00:00 bis 06:00) dauert 5 Minuten
Config.ResultsSeconds = 9         -- Ergebnis-Bildschirm

-- Bewegung
Config.WalkSpeed = 14
Config.SprintSpeed = 24
Config.RunThreshold = 19          -- ab dieser Geschwindigkeit (Studs/s) gilt ein Spieler als "rennend"

-- Belohnungen
Config.Coins = {
	Survive = 50,
	NoteFirstRead = 5,
	RuleFirst = 15,
}

Config.Ranks = {
	{ name = "Praktikant", nights = 0 },
	{ name = "Wächter", nights = 3 },
	{ name = "Agent", nights = 10 },
	{ name = "Direktor", nights = 25 },
}

-- Sounds: Hier die Roblox-Asset-IDs eintragen, z. B. "rbxassetid://1234567890".
-- Leere Einträge werden einfach übersprungen (das Spiel läuft auch ohne Ton).
-- Passende CC0-Dateien zum Hochladen liegen im Ordner "sounds_zum_hochladen".
Config.Sounds = {
	RouletteTick = "",
	RouletteLock = "",
	Alarm = "",
	Knock = "",
	PoPoPo = "",
	Siren = "",
	Static = "",
	Jumpscare = "",
	DoorOpen = "",
	DoorClose = "",
	RadioNoise = "",
	Ambient = "",
	Sunrise = "",
	PageFlip = "",
	Heartbeat = "",
}

-- Die Monster. Reihenfolge = Reihenfolge im Roulette und in der Akte.
Config.Monsters = {
	{
		id = "Hutfrau",
		name = "DIE HUTFRAU",
		origin = "Japanische Sage (Hachishakusama)",
		rule = "ÖFFNE KEINE TÜR",
		ruleLong = "Öffne keine Tür nach draußen bis zum Sonnenaufgang – egal, wer ruft.",
		color = Color3.fromRGB(235, 230, 220),
		story = "Zweieinhalb Meter groß, weißer Sonnenhut. Wen sie einmal gesehen hat, den holt sie. Sie kommt nur herein, wenn du ihr öffnest.",
		notes = {
			{ title = "Zettel von Oma", text = "Mach niemandem die Tür auf.\nNicht einmal uns.\nWarte, bis die Sonne aufgeht." },
			{ title = "Gekritzel an der Wand", text = "Sie ist größer als die Tür.\nWenn du \"po… po… po…\" hörst, ist sie nah." },
			{ title = "Notiz im Schlafzimmer", text = "Salz in jede Ecke.\nSie klopft. Sie ruft mit bekannten Stimmen.\nDie Tür bleibt zu." },
		},
		lures = {
			"Mach auf, ich bin's! Mir ist so kalt hier draußen.",
			"Schnell, lass mich rein, da ist etwas im Wald!",
			"Ich hab mich ausgesperrt. Öffnest du kurz die Hintertür?",
			"Hallo? Ich bin's. Mach doch bitte die Tür auf.",
		},
	},
	{
		id = "Schreier",
		name = "DER SCHREIER",
		origin = "Eigene Figur (Lautsprecher-Wesen)",
		rule = "MACH KEIN GERÄUSCH",
		ruleLong = "Mach kein Geräusch: nicht rennen, keine Türen benutzen, das Radio sofort ausschalten.",
		color = Color3.fromRGB(160, 110, 80),
		story = "Zwölf Meter groß, blind, zwei Lautsprecher statt Kopf. Er jagt nach Gehör und lockt mit jeder Stimme, die er je gehört hat.",
		notes = {
			{ title = "Zettel am Kühlschrank", text = "Er ist blind.\nAber er hört ALLES." },
			{ title = "Notiz im Schlafzimmer", text = "Nicht rennen. Keine Türen.\nWenn das Radio von selbst angeht: sofort aus!" },
			{ title = "Gekritzel auf dem Tisch", text = "Er ruft mit unseren Stimmen.\nAntworte nicht. Beweg dich langsam." },
		},
		lures = {
			"Hilfe! Ich bin draußen, kommt schnell!",
			"Rennt! Er ist im Haus!",
			"Macht das Radio lauter, ich kann nichts hören!",
			"Ich bin hinten an der Tür, beeilt euch!",
		},
	},
	{
		id = "Gesichtslose",
		name = "DER GESICHTSLOSE",
		origin = "Eigene Figur (groß, ohne Gesicht)",
		rule = "RENN NICHT",
		ruleLong = "Renn nicht, wenn die Kamera rauscht. Man sieht ihn nur durch die Kamera.",
		color = Color3.fromRGB(30, 30, 34),
		story = "Viel zu groß, schwarzer Anzug, kein Gesicht. Das Auge sieht ihn nicht – nur die Kamera. Er holt jeden, der vor ihm wegrennt.",
		notes = {
			{ title = "Zettel am Kamin", text = "Die Kamera zeigt, was das Auge nicht sieht.\nNimm sie in die Hand (Taste 1)." },
			{ title = "Notiz in der Küche", text = "Wenn die Kamera rauscht:\nRENN NICHT." },
			{ title = "Gekritzel im Schlafzimmer", text = "Geh langsam.\nDreh dich nicht um.\nEr steht immer hinter jemandem." },
		},
		lures = {
			"Lauf! Er steht direkt hinter dir!",
			"Schnell weg da, rennt in die Küche!",
			"Wo seid ihr? Kommt schnell her!",
			"Er ist weg, ihr könnt rennen!",
		},
	},
}

-- Gesperrte Zellen in der Lobby (kommen mit späteren Updates)
Config.LockedCells = 2

-- Stimmen, die Monster nutzen, wenn nur ein Spieler da ist
Config.SoloVoices = { "Oma", "Mama", "Papa", "Opa" }

function Config.GetMonster(id: string)
	for index, monster in ipairs(Config.Monsters) do
		if monster.id == id then
			return monster, index
		end
	end
	return nil, nil
end

function Config.GetRank(nights: number): string
	local rank = Config.Ranks[1].name
	for _, entry in ipairs(Config.Ranks) do
		if nights >= entry.nights then
			rank = entry.name
		end
	end
	return rank
end

return Config
