-- Baut die komplette Spielwelt per Skript: Lobby (Zellentrakt) und Hütte im Schneewald.
-- Gibt eine Tabelle mit allen wichtigen Orten und Objekten zurück.
local CollectionService = game:GetService("CollectionService")

local Build = require(script.Parent.Build)
local MonsterModels = require(script.Parent.MonsterModels)

local WorldBuilder = {}

local V = Vector3.new
local C = CFrame.new
local RGB = Color3.fromRGB
local DEG = math.rad

-- ===================================================================== LOBBY
local RING_COLORS = {
	RGB(163, 92, 255), RGB(63, 224, 138), RGB(67, 212, 255), RGB(255, 92, 168), RGB(255, 196, 64),
}

local function buildLobby(root, monsters, lockedCount)
	local lobby = Build.folder(root, "Lobby")
	local metal = RGB(28, 30, 36)
	local wall = RGB(34, 36, 42)

	Build.part(lobby, "Floor", V(132, 1, 72), C(0, -0.5, 0), RGB(22, 23, 28), Enum.Material.DiamondPlate)
	Build.part(lobby, "Ceiling", V(132, 1, 72), C(0, 30.5, 0), RGB(14, 14, 18), Enum.Material.Metal)
	Build.part(lobby, "WallBack", V(132, 31, 1), C(0, 15, -36.5), wall, Enum.Material.Metal)
	Build.part(lobby, "WallFront", V(132, 31, 1), C(0, 15, 36.5), wall, Enum.Material.Metal)
	Build.part(lobby, "WallLeft", V(1, 31, 72), C(-66.5, 15, 0), wall, Enum.Material.Metal)
	Build.part(lobby, "WallRight", V(1, 31, 72), C(66.5, 15, 0), wall, Enum.Material.Metal)

	-- Zellen: aktive Monster + gesperrte Zellen
	local entries = {}
	for _, m in ipairs(monsters) do
		table.insert(entries, { id = m.id, name = m.name })
	end
	for _ = 1, lockedCount do
		table.insert(entries, { id = "Unbekannt", name = "???" })
	end
	local count = #entries
	local spacing = 22
	local startX = -spacing * (count - 1) / 2
	local cells = {}
	for i, entry in ipairs(entries) do
		local x = startX + (i - 1) * spacing
		local cell = Build.folder(lobby, "Cell_" .. entry.id)
		local ring = RING_COLORS[((i - 1) % #RING_COLORS) + 1]
		-- Rückwand und Trennwände
		Build.part(cell, "Back", V(20, 30, 1), C(x, 15, -35.5), RGB(26, 28, 33), Enum.Material.Metal)
		Build.part(cell, "SideL", V(1, 30, 18), C(x - 10.5, 15, -27), metal, Enum.Material.Metal)
		Build.part(cell, "SideR", V(1, 30, 18), C(x + 10.5, 15, -27), metal, Enum.Material.Metal)
		Build.part(cell, "Glass", V(20, 24, 0.3), C(x, 12, -18), RGB(160, 190, 220), Enum.Material.Glass,
			{ Transparency = 0.85, CanCollide = true })
		-- Podest mit Leuchtring
		Build.cylinder(cell, "Podium", 1, 9, C(x, 0.5, -27), RGB(20, 21, 26), Enum.Material.Metal)
		local ringPart = Build.cylinder(cell, "Ring", 0.3, 9.8, C(x, 0.18, -27), ring, Enum.Material.Neon)
		-- Deckenlampe mit Spotlight
		local lamp = Build.part(cell, "Lamp", V(3.5, 0.4, 1.2), C(x, 29.7, -27), RGB(255, 252, 240), Enum.Material.Neon)
		local spot = Build.light(lamp, "SpotLight", RGB(255, 246, 230), 4, 36, { Face = Enum.NormalId.Bottom, Angle = 55, Shadows = true })
		-- Namensschild über der Zelle
		local sign = Build.part(cell, "NameSign", V(13, 2.6, 0.3), C(x, 25.5, -17.8), RGB(18, 18, 22), Enum.Material.SmoothPlastic)
		local _, label = Build.sign(sign, Enum.NormalId.Back, entry.name, RGB(255, 255, 255), { font = Enum.Font.GothamBlack })
		local stroke = Instance.new("UIStroke")
		stroke.Color = ring
		stroke.Thickness = 3
		stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
		stroke.Parent = sign
		-- Monster auf dem Podest (verkleinert, schaut zu den Spielern)
		local scale = 1
		if entry.id == "Schreier" then
			scale = 0.48
		end
		local figure = MonsterModels.build(entry.id, cell, C(x, 1, -27) * CFrame.Angles(0, math.pi, 0), scale)
		cells[entry.id] = { x = x, ring = ringPart, spot = spot, label = label, model = figure, ringColor = ring }
	end

	-- "AUSBRUCH"-Schilder zwischen den Zellen
	for i = 1, count - 1 do
		local x = startX + (i - 0.5) * spacing
		local s = Build.part(lobby, "BreachSign", V(1.2, 1.6, 6), C(x, 20, -26), RGB(90, 10, 14), Enum.Material.SmoothPlastic)
		Build.sign(s, Enum.NormalId.Right, "AUSBRUCH", RGB(255, 70, 70), { font = Enum.Font.GothamBold })
	end

	-- Gefahrenstreifen am Boden
	for i = 0, 64 do
		local x = -64 + i * 2
		local color = (i % 2 == 0) and RGB(232, 185, 35) or RGB(17, 17, 17)
		Build.part(lobby, "Hazard", V(2, 0.06, 1.4), C(x, 0.03, -15) * CFrame.Angles(0, DEG(25), 0), color)
	end

	-- Titel über den Zellen
	local title = Build.part(lobby, "Title", V(44, 5, 0.4), C(0, 27.5, -14), RGB(10, 10, 12))
	Build.sign(title, Enum.NormalId.Back, '<font color="#FFFFFF">Horror </font><font color="#E3262B">ROULETTE</font>',
		RGB(255, 255, 255), { font = Enum.Font.GothamBlack })

	-- Rotierende Alarmlichter
	local alarms = {}
	for _, x in ipairs({ -40, 0, 40 }) do
		local a = Build.part(lobby, "Alarm", V(1.6, 1, 1.6), C(x, 29.6, 4), RGB(255, 40, 40), Enum.Material.Neon)
		Build.light(a, "SpotLight", RGB(255, 30, 30), 6, 60, { Face = Enum.NormalId.Front, Angle = 40 })
		a:SetAttribute("BasePos", V(x, 29.6, 4))
		CollectionService:AddTag(a, "HR_Alarm")
		table.insert(alarms, { part = a, base = V(x, 29.6, 4), phase = x * 0.05 })
	end

	-- Schwaches rotes Raumlicht
	for _, x in ipairs({ -45, -15, 15, 45 }) do
		local p = Build.part(lobby, "Glow", V(1, 1, 1), C(x, 18, 20), RGB(0, 0, 0), nil, { Transparency = 1, CanCollide = false })
		Build.light(p, "PointLight", RGB(255, 60, 60), 0.6, 40)
	end

	-- Spawn
	local spawn = Instance.new("SpawnLocation")
	spawn.Name = "LobbySpawn"
	spawn.Anchored = true
	spawn.Size = V(12, 1, 12)
	spawn.CFrame = C(0, -0.45, 22)
	spawn.Transparency = 1
	spawn.CanCollide = false
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.Parent = lobby
	local decal = spawn:FindFirstChildOfClass("Decal")
	if decal then
		decal:Destroy()
	end

	return {
		folder = lobby,
		cells = cells,
		alarms = alarms,
		spawnCFrame = C(0, 3, 22),
		spawnSpread = 10,
	}
end

-- ===================================================================== HÜTTE
local CX, CZ = 600, 0      -- Mitte der Hütte (weit weg von der Lobby)
local FLOOR = 1            -- Oberkante Fußboden
local WALL_TOP = 13        -- Oberkante Wände

local function wallAlongX(parent, z, x1, x2, openings, color)
	table.sort(openings, function(a, b)
		return a.c < b.c
	end)
	local function seg(a, b, y1, y2)
		if b - a > 0.01 and y2 - y1 > 0.01 then
			Build.part(parent, "Wall", V(b - a, y2 - y1, 1), C((a + b) / 2, (y1 + y2) / 2, z), color, Enum.Material.WoodPlanks)
		end
	end
	local cur = x1
	for _, o in ipairs(openings) do
		local a, b = o.c - o.w / 2, o.c + o.w / 2
		seg(cur, a, FLOOR, WALL_TOP)
		seg(a, b, FLOOR, o.y1)
		seg(a, b, o.y2, WALL_TOP)
		if o.glass then
			Build.part(parent, "Window", V(b - a, o.y2 - o.y1, 0.2), C((a + b) / 2, (o.y1 + o.y2) / 2, z),
				RGB(150, 180, 220), Enum.Material.Glass, { Transparency = 0.7 })
		end
		cur = b
	end
	seg(cur, x2, FLOOR, WALL_TOP)
end

local function wallAlongZ(parent, x, z1, z2, openings, color)
	table.sort(openings, function(a, b)
		return a.c < b.c
	end)
	local function seg(a, b, y1, y2)
		if b - a > 0.01 and y2 - y1 > 0.01 then
			Build.part(parent, "Wall", V(1, y2 - y1, b - a), C(x, (y1 + y2) / 2, (a + b) / 2), color, Enum.Material.WoodPlanks)
		end
	end
	local cur = z1
	for _, o in ipairs(openings) do
		local a, b = o.c - o.w / 2, o.c + o.w / 2
		seg(cur, a, FLOOR, WALL_TOP)
		seg(a, b, FLOOR, o.y1)
		seg(a, b, o.y2, WALL_TOP)
		if o.glass then
			Build.part(parent, "Window", V(0.2, o.y2 - o.y1, b - a), C(x, (o.y1 + o.y2) / 2, (a + b) / 2),
				RGB(150, 180, 220), Enum.Material.Glass, { Transparency = 0.7 })
		end
		cur = b
	end
	seg(cur, z2, FLOOR, WALL_TOP)
end

local function window(c)
	return { c = c, w = 5, y1 = 4.5, y2 = 9, glass = true }
end
local function doorway(c)
	return { c = c, w = 5, y1 = FLOOR, y2 = 10 }
end

-- Außentür mit Scharnier. axis "X": Tür in einer Wand entlang Z (Wand bei festem x)
local function buildDoor(parent, name, x, z, outward)
	local panelCF = C(x, FLOOR + 4.3, z)
	local panel = Build.part(parent, name, V(0.5, 8.6, 5), panelCF, RGB(96, 58, 34), Enum.Material.Wood, { CanCollide = true })
	-- Türknauf: unverankert und angeschweißt, damit er mit der Tür mitschwingt
	local knob = Build.part(panel, "Knob", V(0.4, 0.4, 0.4), C(x + outward * 0.35, FLOOR + 4.2, z + 1.8), RGB(200, 170, 80), Enum.Material.Metal,
		{ Anchored = false, CanCollide = false, Massless = true })
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = panel
	weld.Part1 = knob
	weld.Parent = knob
	local hinge = C(x, FLOOR + 4.3, z - 2.5)
	local offset = hinge:ToObjectSpace(panelCF)
	local openCF = hinge * CFrame.Angles(0, outward * DEG(100), 0) * offset
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "DoorPrompt"
	prompt.ActionText = "Öffnen"
	prompt.ObjectText = name
	prompt.HoldDuration = 0.35
	prompt.MaxActivationDistance = 9
	prompt.RequiresLineOfSight = false
	prompt.Parent = panel
	local sound = Instance.new("Sound")
	sound.Name = "DoorSound"
	sound.RollOffMaxDistance = 120
	sound.Parent = panel
	return {
		name = name,
		panel = panel,
		closedCF = panelCF,
		openCF = openCF,
		prompt = prompt,
		sound = sound,
		isOpen = false,
		outsidePos = V(x + outward * 5, FLOOR, z),
		insidePos = V(x - outward * 4, FLOOR, z),
		outward = outward,
	}
end

local function note(parent, name, cf, index)
	local paper = Build.part(parent, name, V(1.4, 0.06, 1.0), cf, RGB(242, 234, 210), Enum.Material.Fabric, { CanCollide = false })
	local glow = Build.light(paper, "PointLight", RGB(255, 240, 200), 0.6, 5)
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "NotePrompt"
	prompt.ActionText = "Lesen"
	prompt.ObjectText = "Zettel"
	prompt.HoldDuration = 0.2
	prompt.MaxActivationDistance = 8
	prompt.RequiresLineOfSight = false
	prompt.Parent = paper
	return { part = paper, prompt = prompt, index = index, glow = glow }
end

local function lantern(parent, pos)
	local base = Build.part(parent, "Lantern", V(0.8, 1.2, 0.8), C(pos), RGB(255, 196, 110), Enum.Material.Neon)
	local light = Build.light(base, "PointLight", RGB(255, 170, 90), 1.3, 20, { Shadows = true })
	CollectionService:AddTag(light, "HR_Flicker")
	return base
end

local function tree(parent, x, z, s)
	local trunkColor = RGB(58, 42, 30)
	local green = RGB(30, 52, 44)
	local snow = RGB(232, 238, 246)
	Build.cylinder(parent, "Trunk", 6 * s, 1.1 * s, C(x, 3 * s, z), trunkColor, Enum.Material.Wood)
	local rot = math.random() * math.pi
	local sizes = { 8, 6.2, 4.4, 2.6 }
	for i, w in ipairs(sizes) do
		local y = (4 + i * 3.2) * s
		Build.part(parent, "Needles", V(w * s, 3.4 * s, w * s), C(x, y, z) * CFrame.Angles(0, rot + i * 0.6, 0), green, Enum.Material.Grass)
		Build.part(parent, "Snow", V(w * s * 0.8, 0.5 * s, w * s * 0.8), C(x, y + 1.9 * s, z) * CFrame.Angles(0, rot + i * 0.6, 0), snow, Enum.Material.Snow)
	end
end

local function buildCabin(root)
	local cabin = Build.folder(root, "Cabin")
	local wood = RGB(110, 72, 44)
	local woodDark = RGB(70, 46, 30)

	-- Boden draußen (Schnee) und Wald
	Build.part(cabin, "Snowfield", V(520, 2, 520), C(CX, -1, CZ), RGB(222, 230, 240), Enum.Material.Snow)
	local forest = Build.folder(cabin, "Forest")
	local rng = Random.new(42)
	local placed = 0
	local guard = 0
	while placed < 170 and guard < 2000 do
		guard = guard + 1
		local angle = rng:NextNumber(0, math.pi * 2)
		local dist = rng:NextNumber(38, 230)
		local x, z = CX + math.cos(angle) * dist, CZ + math.sin(angle) * dist
		tree(forest, x, z, rng:NextNumber(0.9, 1.6))
		placed = placed + 1
	end

	-- Fußboden, Decke, Dach
	local house = Build.folder(cabin, "House")
	Build.part(house, "Floor", V(40, 1, 30), C(CX, FLOOR - 0.5, CZ), RGB(120, 82, 52), Enum.Material.WoodPlanks)
	Build.part(house, "Ceiling", V(42, 1, 32), C(CX, WALL_TOP + 0.5, CZ), woodDark, Enum.Material.WoodPlanks)
	Build.part(house, "Roof", V(46, 1.6, 36), C(CX, WALL_TOP + 1.8, CZ), RGB(46, 40, 38), Enum.Material.Slate)
	Build.part(house, "RoofSnow", V(46, 0.5, 36), C(CX, WALL_TOP + 2.85, CZ), RGB(236, 240, 246), Enum.Material.Snow)
	Build.part(house, "Porch", V(6, 0.6, 10), C(CX + 23, FLOOR - 0.6, CZ), woodDark, Enum.Material.WoodPlanks)

	-- Außenwände (lokal: x -20..20, z -15..15)
	wallAlongX(house, CZ - 15, CX - 20, CX + 20, { window(CX - 10), window(CX + 10) }, wood)
	wallAlongX(house, CZ + 15, CX - 20, CX + 20, { window(CX - 10), window(CX + 10) }, wood)
	wallAlongZ(house, CX + 20, CZ - 15, CZ + 15, { doorway(CZ), window(CZ - 9), window(CZ + 9) }, wood)
	wallAlongZ(house, CX - 20, CZ - 15, CZ + 15, { doorway(CZ + 8), window(CZ - 8) }, wood)
	-- Innenwände
	wallAlongZ(house, CX, CZ - 15, CZ + 15, { doorway(CZ + 8), doorway(CZ - 8) }, RGB(130, 92, 60))
	wallAlongX(house, CZ, CX - 20, CX, { doorway(CX - 10) }, RGB(130, 92, 60))

	-- Türen nach draußen
	local doors = {
		buildDoor(house, "Haustür", CX + 20, CZ, 1),
		buildDoor(house, "Hintertür", CX - 20, CZ + 8, -1),
	}

	-- Wohnzimmer (x 0..20): Kamin, Sofa, Tisch, Radio
	local living = Build.folder(house, "Wohnzimmer")
	Build.part(living, "Chimney", V(8, 12, 2), C(CX + 10, FLOOR + 6, CZ + 13.8), RGB(96, 94, 98), Enum.Material.Slate)
	Build.part(living, "FireBox", V(4, 3, 1.2), C(CX + 10, FLOOR + 1.6, CZ + 12.9), RGB(20, 16, 14))
	local fire = Build.part(living, "Fire", V(3, 1.4, 0.6), C(CX + 10, FLOOR + 0.9, CZ + 12.6), RGB(255, 120, 40), Enum.Material.Neon, { CanCollide = false })
	local fireLight = Build.light(fire, "PointLight", RGB(255, 130, 60), 2.2, 32, { Shadows = true })
	CollectionService:AddTag(fireLight, "HR_Flicker")
	Build.part(living, "Rug", V(10, 0.1, 7), C(CX + 10, FLOOR + 0.05, CZ + 1), RGB(120, 30, 34), Enum.Material.Fabric)
	Build.part(living, "Sofa", V(9, 2.4, 3), C(CX + 10, FLOOR + 1.2, CZ - 6), RGB(70, 50, 80), Enum.Material.Fabric)
	Build.part(living, "SofaBack", V(9, 2.6, 0.8), C(CX + 10, FLOOR + 2.6, CZ - 7.3), RGB(60, 42, 70), Enum.Material.Fabric)
	Build.part(living, "Table", V(4, 0.3, 2.6), C(CX + 10, FLOOR + 2, CZ + 1), RGB(90, 60, 36), Enum.Material.Wood)
	Build.part(living, "TableLeg", V(0.4, 1.9, 0.4), C(CX + 10, FLOOR + 0.95, CZ + 1), RGB(70, 46, 30), Enum.Material.Wood)
	Build.part(living, "SideTable", V(2.4, 2.4, 2.4), C(CX + 17, FLOOR + 1.2, CZ - 12), RGB(90, 60, 36), Enum.Material.Wood)
	local radio = Build.part(living, "Radio", V(1.8, 1.1, 0.8), C(CX + 17, FLOOR + 2.95, CZ - 12), RGB(120, 84, 52), Enum.Material.Wood)
	local dial = Build.part(radio, "Dial", V(0.9, 0.35, 0.06), C(CX + 17.2, FLOOR + 3.1, CZ - 12.42), RGB(60, 40, 20), Enum.Material.Neon)
	local radioPrompt = Instance.new("ProximityPrompt")
	radioPrompt.Name = "RadioPrompt"
	radioPrompt.ActionText = "Einschalten"
	radioPrompt.ObjectText = "Radio"
	radioPrompt.HoldDuration = 0.2
	radioPrompt.MaxActivationDistance = 8
	radioPrompt.RequiresLineOfSight = false
	radioPrompt.Parent = radio
	local radioSound = Instance.new("Sound")
	radioSound.Name = "RadioSound"
	radioSound.Looped = true
	radioSound.Volume = 0.6
	radioSound.RollOffMaxDistance = 80
	radioSound.Parent = radio
	lantern(living, V(CX + 3, FLOOR + 2.6, CZ - 13))
	for _, p in ipairs({ { 1, -14 }, { 19, -14 }, { 19, 14 }, { 1, 14 } }) do
		Build.part(living, "Salt", V(0.9, 0.4, 0.9), C(CX + p[1], FLOOR + 0.2, CZ + p[2]), RGB(245, 245, 245), Enum.Material.Sand)
	end

	-- Küche (x -20..0, z 0..15)
	local kitchen = Build.folder(house, "Küche")
	Build.part(kitchen, "Counter", V(14, 3, 2.4), C(CX - 11, FLOOR + 1.5, CZ + 13.6), RGB(170, 160, 150), Enum.Material.Granite)
	Build.part(kitchen, "Stove", V(3, 3.2, 2.4), C(CX - 2.5, FLOOR + 1.6, CZ + 13.6), RGB(40, 40, 44), Enum.Material.Metal)
	Build.part(kitchen, "Table", V(5, 0.3, 3.4), C(CX - 10, FLOOR + 2.4, CZ + 6), RGB(96, 64, 38), Enum.Material.Wood)
	Build.part(kitchen, "TableLeg", V(0.5, 2.3, 0.5), C(CX - 10, FLOOR + 1.15, CZ + 6), RGB(70, 46, 30), Enum.Material.Wood)
	lantern(kitchen, V(CX - 17, FLOOR + 3.2, CZ + 13.5))

	-- Schlafzimmer (x -20..0, z -15..0)
	local bedroom = Build.folder(house, "Schlafzimmer")
	Build.part(bedroom, "BedFrame", V(6, 1.4, 9), C(CX - 14, FLOOR + 0.7, CZ - 9), RGB(90, 60, 36), Enum.Material.Wood)
	Build.part(bedroom, "Blanket", V(5.8, 0.6, 6.4), C(CX - 14, FLOOR + 1.7, CZ - 8), RGB(52, 74, 130), Enum.Material.Fabric)
	Build.part(bedroom, "Pillow", V(4, 0.6, 1.8), C(CX - 14, FLOOR + 1.7, CZ - 12.4), RGB(240, 238, 232), Enum.Material.Fabric)
	Build.part(bedroom, "Nightstand", V(2.2, 2.4, 2.2), C(CX - 9.5, FLOOR + 1.2, CZ - 13), RGB(90, 60, 36), Enum.Material.Wood)
	lantern(bedroom, V(CX - 9.5, FLOOR + 3, CZ - 13))

	-- Drei Zettel (Inhalt setzt der RoundService je nach Monster)
	local notes = {
		note(house, "Note1", C(CX + 10, FLOOR + 2.2, CZ + 1.2), 1),
		note(house, "Note2", C(CX - 10, FLOOR + 2.6, CZ + 6), 2),
		note(house, "Note3", C(CX - 9.5, FLOOR + 2.45, CZ - 13), 3),
	}

	-- Außenlampe über der Haustür
	local porchLamp = Build.part(house, "PorchLamp", V(0.8, 0.8, 0.8), C(CX + 21, FLOOR + 10, CZ - 3.5), RGB(255, 220, 160), Enum.Material.Neon)
	local porchLight = Build.light(porchLamp, "PointLight", RGB(255, 210, 150), 1.4, 24)
	CollectionService:AddTag(porchLight, "HR_Flicker")

	-- Orte für die Nacht
	local spawns = {}
	for i = 0, 7 do
		table.insert(spawns, C(CX + 6 + (i % 4) * 3, FLOOR + 3, CZ - 2 + math.floor(i / 4) * 4))
	end
	local baitSpots = {
		C(CX - 10, FLOOR, CZ - 19) * CFrame.Angles(0, 0, 0),
		C(CX + 10, FLOOR, CZ + 19) * CFrame.Angles(0, math.pi, 0),
		C(CX + 24, FLOOR, CZ - 9) * CFrame.Angles(0, -math.pi / 2, 0),
		C(CX - 24, FLOOR, CZ - 8) * CFrame.Angles(0, math.pi / 2, 0),
	}
	local path = {
		V(CX + 27, 0, CZ - 22), V(CX + 27, 0, CZ + 22), V(CX - 27, 0, CZ + 22), V(CX - 27, 0, CZ - 22),
	}

	return {
		folder = cabin,
		center = V(CX, FLOOR, CZ),
		spawns = spawns,
		doors = doors,
		notes = notes,
		radio = { part = radio, dial = dial, prompt = radioPrompt, sound = radioSound, isOn = false },
		baitSpots = baitSpots,
		path = path,
		bounds = { minX = CX - 20, maxX = CX + 20, minZ = CZ - 15, maxZ = CZ + 15 },
	}
end

-- ===================================================================== START
function WorldBuilder.build(config)
	local root = workspace:FindFirstChild("HorrorRoulette")
	if root then
		root:Destroy()
	end
	root = Build.folder(workspace, "HorrorRoulette")
	local lobby = buildLobby(root, config.Monsters, config.LockedCells)
	local cabin = buildCabin(root)
	local night = Build.folder(root, "Night") -- hier landen die Monster einer Nacht
	return { root = root, lobby = lobby, cabin = cabin, nightFolder = night }
end

-- ===================================================================== LICHT
local function ensure(className, name)
	local Lighting = game:GetService("Lighting")
	local existing = Lighting:FindFirstChild(name)
	if existing then
		return existing
	end
	local inst = Instance.new(className)
	inst.Name = name
	inst.Parent = Lighting
	return inst
end

function WorldBuilder.applyLighting(mode)
	local Lighting = game:GetService("Lighting")
	local atmosphere = ensure("Atmosphere", "HR_Atmosphere")
	local cc = ensure("ColorCorrectionEffect", "HR_Color")
	local bloom = ensure("BloomEffect", "HR_Bloom")
	Lighting.GlobalShadows = true
	bloom.Intensity = 0.6
	bloom.Size = 30
	bloom.Threshold = 1.6
	if mode == "Lobby" then
		Lighting.ClockTime = 0
		Lighting.Brightness = 0
		Lighting.Ambient = RGB(46, 30, 34)
		Lighting.OutdoorAmbient = RGB(30, 20, 26)
		Lighting.EnvironmentDiffuseScale = 0.2
		Lighting.EnvironmentSpecularScale = 0.3
		atmosphere.Density = 0
		atmosphere.Haze = 0
		cc.Contrast = 0.15
		cc.Saturation = -0.05
		cc.TintColor = RGB(255, 236, 236)
		cc.Brightness = 0
	elseif mode == "Night" then
		Lighting.ClockTime = 0
		Lighting.Brightness = 1.2
		Lighting.Ambient = RGB(24, 28, 44)
		Lighting.OutdoorAmbient = RGB(52, 62, 96)
		Lighting.EnvironmentDiffuseScale = 0.3
		Lighting.EnvironmentSpecularScale = 0.3
		atmosphere.Density = 0.42
		atmosphere.Offset = 0.1
		atmosphere.Color = RGB(150, 168, 210)
		atmosphere.Decay = RGB(60, 70, 100)
		atmosphere.Glare = 0
		atmosphere.Haze = 1.4
		cc.Contrast = 0.12
		cc.Saturation = -0.2
		cc.TintColor = RGB(214, 226, 255)
		cc.Brightness = 0
	end
end

-- Fortschritt der Nacht 0..1: Himmel wird gegen 6 Uhr heller
function WorldBuilder.setNightProgress(u)
	local Lighting = game:GetService("Lighting")
	Lighting.ClockTime = math.clamp(u, 0, 1) * 6.3
	local cc = Lighting:FindFirstChild("HR_Color")
	if cc and u > 0.85 then
		local k = (u - 0.85) / 0.15
		cc.TintColor = RGB(214, 226, 255):Lerp(RGB(255, 222, 196), math.clamp(k, 0, 1))
	end
end

return WorldBuilder
