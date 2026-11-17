-- Rundenablauf: Lobby → Countdown → Roulette → Nacht → Ergebnis → Lobby
-- Alle spielentscheidenden Dinge (Auslosung, Regelbruch, Belohnung) passieren hier auf dem Server.
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local Debris = game:GetService("Debris")

local RoundService = {}

local Config, World, WorldBuilder, Data, Remotes, MonsterModules
local state = {
	phase = "Lobby",
	endsAt = 0,
	ready = {},
	night = nil,
	monsterIndex = nil,
}

local function now()
	return workspace:GetServerTimeNow()
end

local function fire(name, player, ...)
	local remote = Remotes[name]
	if remote and player and player.Parent == Players then
		remote:FireClient(player, ...)
	end
end

local function fireAll(name, ...)
	Remotes[name]:FireAllClients(...)
end

-- ===================================================================== SOUND
function RoundService.playSound(key, parent, volume, props)
	local id = Config.Sounds[key]
	if not id or id == "" or not parent then
		return nil
	end
	local sound = Instance.new("Sound")
	sound.Name = "HR_" .. key
	sound.SoundId = id
	sound.Volume = volume or 0.8
	sound.RollOffMaxDistance = 220
	if props then
		for k, v in pairs(props) do
			sound[k] = v
		end
	end
	sound.Parent = parent
	sound:Play()
	Debris:AddItem(sound, 12)
	return sound
end

-- ===================================================================== HILFEN
local function rootOf(player)
	local character = player.Character
	return character and character:FindFirstChild("HumanoidRootPart")
end

local function readyPlayers()
	local list = {}
	for _, player in ipairs(Players:GetPlayers()) do
		if state.ready[player] and player.Character and rootOf(player) then
			table.insert(list, player)
		end
	end
	return list
end

local function teleport(player, cframe)
	local character = player.Character
	if character then
		local root = rootOf(player)
		if root then
			root.Anchored = false
		end
		character:PivotTo(cframe)
	end
end

local function lobbyCFrame()
	local lobby = World.lobby
	local spread = lobby.spawnSpread
	return lobby.spawnCFrame * CFrame.new(math.random(-spread, spread), 0, math.random(-spread / 2, spread / 2))
end

local function profilePayload(player)
	local profile = Data.get(player)
	if not profile then
		return nil
	end
	return {
		coins = profile.coins,
		nights = profile.nights,
		rank = Config.GetRank(profile.nights),
		akte = profile.akte,
		settings = profile.settings,
	}
end

function RoundService.pushProfile(player)
	local payload = profilePayload(player)
	if payload then
		fire("Profile", player, payload)
	end
end

-- Zustand an einen Spieler senden (jeder bekommt seine eigene Sicht)
local function sendState(player)
	local night = state.night
	local info = night and night.players[player]
	fire("State", player, {
		phase = state.phase,
		endsAt = state.endsAt,
		ready = state.ready[player] == true,
		monsterId = night and night.def.id or nil,
		nightStart = night and night.startedAt or nil,
		nightSeconds = Config.NightSeconds,
		participant = info ~= nil,
		alive = info ~= nil and info.alive or false,
		revealed = night and night.revealed or false,
		notesFound = night and night.foundCount or 0,
		playersReady = #readyPlayers(),
	})
end

local function sendStateAll()
	for _, player in ipairs(Players:GetPlayers()) do
		sendState(player)
	end
end

-- ===================================================================== TÜREN & RADIO
local function setDoor(door, open)
	door.isOpen = open
	door.prompt.ActionText = open and "Schließen" or "Öffnen"
	TweenService:Create(door.panel, TweenInfo.new(0.45, Enum.EasingStyle.Quad, Enum.EasingDirection.Out),
		{ CFrame = open and door.openCF or door.closedCF }):Play()
	RoundService.playSound(open and "DoorOpen" or "DoorClose", door.panel, 0.9)
end

function RoundService.setRadio(on)
	local radio = World.cabin.radio
	radio.isOn = on
	radio.prompt.ActionText = on and "Ausschalten" or "Einschalten"
	radio.dial.Color = on and Color3.fromRGB(255, 190, 90) or Color3.fromRGB(60, 40, 20)
	local id = Config.Sounds.RadioNoise
	if on and id ~= "" then
		radio.sound.SoundId = id
		radio.sound:Play()
	else
		radio.sound:Stop()
	end
end

-- ===================================================================== DIE NACHT
local Night = {}
Night.__index = Night

function Night:alive()
	local list = {}
	for player, info in pairs(self.players) do
		if info.alive and player.Parent == Players and rootOf(player) then
			table.insert(list, player)
		end
	end
	return list
end

function Night:root(player)
	return rootOf(player)
end

function Night:notice(text, kind, except)
	for player in pairs(self.players) do
		if player ~= except then
			fire("Notice", player, text, kind or "info")
		end
	end
end

-- Falsche Nachricht im Namen eines Mitspielers (oder einer bekannten Stimme, wenn allein)
function Night:lure(text)
	local alive = self:alive()
	if #alive == 0 then
		return
	end
	local speakerName
	local targets = {}
	if #alive >= 2 then
		local speaker = alive[math.random(#alive)]
		speakerName = speaker.DisplayName
		for _, p in ipairs(alive) do
			if p ~= speaker then
				table.insert(targets, p)
			end
		end
	else
		speakerName = Config.SoloVoices[math.random(#Config.SoloVoices)]
		targets = alive
	end
	for _, p in ipairs(targets) do
		fire("FakeChat", p, speakerName, text)
	end
end

function Night:sound(key, parent, volume)
	return RoundService.playSound(key, parent, volume)
end

-- Spieler wird geholt: Jumpscare, dann steht er als Köder vor einem Fenster
function Night:take(player, reason)
	local info = self.players[player]
	if not info or not info.alive or not self.active then
		return
	end
	info.alive = false
	info.reason = reason
	fire("Jumpscare", player, self.def.id)
	self:notice(player.DisplayName .. " wurde geholt.", "danger", player)
	sendStateAll()
	task.delay(1.8, function()
		if not self.active then
			return
		end
		local spots = World.cabin.baitSpots
		local spot = spots[math.random(#spots)]
		teleport(player, spot + Vector3.new(0, 3, 0))
		local root = rootOf(player)
		if root then
			root.Anchored = true
		end
	end)
	if #self:alive() == 0 then
		task.delay(3, function()
			RoundService.endNight("taken")
		end)
	end
end

local function giveCamera(player)
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not backpack or backpack:FindFirstChild("Kamera") then
		return
	end
	local tool = Instance.new("Tool")
	tool.Name = "Kamera"
	tool.ToolTip = "Camcorder – zeigt, was das Auge nicht sieht"
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	local handle = Instance.new("Part")
	handle.Name = "Handle"
	handle.Size = Vector3.new(0.7, 0.6, 1.3)
	handle.Color = Color3.fromRGB(30, 31, 36)
	handle.Material = Enum.Material.SmoothPlastic
	handle.CanCollide = false
	handle.Massless = true
	handle.Parent = tool
	local lens = Instance.new("Part")
	lens.Name = "Lens"
	lens.Shape = Enum.PartType.Cylinder
	lens.Size = Vector3.new(0.3, 0.45, 0.45)
	lens.Color = Color3.fromRGB(20, 30, 60)
	lens.CanCollide = false
	lens.Massless = true
	lens.CFrame = handle.CFrame * CFrame.new(0, 0, -0.75) * CFrame.Angles(0, math.rad(90), 0)
	local weld = Instance.new("WeldConstraint")
	weld.Part0 = handle
	weld.Part1 = lens
	weld.Parent = lens
	lens.Parent = tool
	tool.Parent = backpack
end

local function removeCameras(player)
	for _, container in ipairs({ player:FindFirstChildOfClass("Backpack"), player.Character }) do
		if container then
			local tool = container:FindFirstChild("Kamera")
			if tool then
				tool:Destroy()
			end
		end
	end
end

local function resetHouse()
	for _, door in ipairs(World.cabin.doors) do
		door.isOpen = false
		door.prompt.ActionText = "Öffnen"
		door.panel.CFrame = door.closedCF
	end
	RoundService.setRadio(false)
end

local function highlightCell(monsterId, on)
	for id, cell in pairs(World.lobby.cells) do
		local active = on and id == monsterId
		cell.ring.Color = active and Color3.fromRGB(255, 40, 40) or cell.ringColor
		cell.spot.Color = active and Color3.fromRGB(255, 60, 50) or Color3.fromRGB(255, 246, 230)
	end
end

local function runNight(def, participants)
	resetHouse()
	WorldBuilder.applyLighting("Night")
	local night = setmetatable({
		def = def,
		round = RoundService,
		world = World,
		players = {},
		found = {},
		foundCount = 0,
		revealed = false,
		active = true,
		startedAt = now(),
		elapsed = 0,
	}, Night)
	for _, player in ipairs(participants) do
		night.players[player] = { alive = true, read = {}, coins = 0 }
	end
	state.night = night
	state.phase = "Night"
	state.endsAt = night.startedAt + Config.NightSeconds

	local spawns = World.cabin.spawns
	for i, player in ipairs(participants) do
		teleport(player, spawns[((i - 1) % #spawns) + 1])
		if def.id == "Gesichtslose" then
			giveCamera(player)
		end
	end
	sendStateAll()
	night:notice(def.name .. ". Mitternacht.", "title")
	task.delay(4, function()
		if night.active then
			night:notice("Finde die Regel. Überlebe bis 6 Uhr.", "info")
		end
	end)

	local module = MonsterModules[def.id]
	night.module = module
	local ok, err = pcall(module.start, night, World)
	if not ok then
		warn("[HorrorRoulette] Monster-Start fehlgeschlagen:", err)
	end

	while night.active do
		local dt = task.wait(0.2)
		night.elapsed = now() - night.startedAt
		local progress = night.elapsed / Config.NightSeconds
		WorldBuilder.setNightProgress(progress)
		if progress >= 1 then
			RoundService.endNight("sunrise")
			break
		end
		local okUpdate, errUpdate = pcall(module.update, night, World, dt)
		if not okUpdate then
			warn("[HorrorRoulette] Monster-Fehler:", errUpdate)
		end
	end
end

function RoundService.endNight(reason)
	local night = state.night
	if not night or not night.active then
		return
	end
	night.active = false
	if night.module and night.module.stop then
		pcall(night.module.stop, night, World)
	end
	World.nightFolder:ClearAllChildren()

	state.phase = "Results"
	state.endsAt = now() + Config.ResultsSeconds
	if reason == "sunrise" then
		night:notice("6 Uhr. Die Sonne geht auf.", "title")
		RoundService.playSound("Sunrise", workspace, 0.7)
	else
		night:notice("Keiner hat die Nacht überlebt.", "danger")
	end
	for player, info in pairs(night.players) do
		if player.Parent == Players then
			local survived = info.alive and reason == "sunrise"
			local isNew = false
			if survived then
				Data.addCoins(player, Config.Coins.Survive)
				info.coins = info.coins + Config.Coins.Survive
				isNew = Data.recordSurvival(player, night.def.id)
			end
			fire("Results", player, {
				survived = survived,
				monsterId = night.def.id,
				coins = info.coins,
				newEntry = isNew,
				ruleRevealed = night.revealed,
			})
			RoundService.pushProfile(player)
			task.spawn(Data.save, player)
		end
	end
	sendStateAll()
end

-- ===================================================================== HAUPTSCHLEIFE
local function returnToLobby(night)
	WorldBuilder.applyLighting("Lobby")
	highlightCell(nil, false)
	for player in pairs(night.players) do
		if player.Parent == Players then
			removeCameras(player)
			teleport(player, lobbyCFrame())
		end
	end
	resetHouse()
	state.night = nil
end

local function mainLoop()
	while true do
		state.phase = "Lobby"
		state.endsAt = 0
		WorldBuilder.applyLighting("Lobby")
		sendStateAll()
		while #readyPlayers() == 0 do
			task.wait(1)
		end

		state.phase = "Countdown"
		state.endsAt = now() + Config.IntermissionSeconds
		sendStateAll()
		local aborted = false
		while now() < state.endsAt do
			task.wait(0.5)
			if #readyPlayers() == 0 then
				aborted = true
				break
			end
		end

		if not aborted then
			local participants = readyPlayers()
			local index = math.random(#Config.Monsters)
			local def = Config.Monsters[index]
			state.phase = "Roulette"
			state.monsterIndex = index
			state.endsAt = now() + Config.RouletteSeconds
			sendStateAll()
			fireAll("Roulette", index, Config.RouletteSeconds)
			task.delay(Config.RouletteSeconds - 1.2, function()
				highlightCell(def.id, true)
			end)
			task.wait(Config.RouletteSeconds + 0.4)

			runNight(def, participants)
			local finished = state.night
			task.wait(Config.ResultsSeconds)
			if finished then
				returnToLobby(finished)
			end
		end
	end
end

-- ===================================================================== SPIELER
local function onCharacter(player, character)
	local root = character:WaitForChild("HumanoidRootPart", 10)
	if not root then
		return
	end
	task.wait()
	local night = state.night
	local info = night and night.players[player]
	if night and night.active and info then
		if info.alive then
			teleport(player, World.cabin.spawns[1])
			if night.def.id == "Gesichtslose" then
				giveCamera(player)
			end
		else
			local spot = World.cabin.baitSpots[1]
			teleport(player, spot + Vector3.new(0, 3, 0))
			root.Anchored = true
		end
	else
		teleport(player, lobbyCFrame())
	end
end

local function onPlayerAdded(player)
	Data.load(player)
	player.CharacterAdded:Connect(function(character)
		onCharacter(player, character)
	end)
	if player.Character then
		task.spawn(onCharacter, player, player.Character)
	end
	RoundService.pushProfile(player)
	sendState(player)
end

local function onPlayerRemoving(player)
	state.ready[player] = nil
	local night = state.night
	if night and night.players[player] then
		night.players[player] = nil
		if night.active and #night:alive() == 0 then
			task.defer(RoundService.endNight, "taken")
		end
	end
	Data.release(player)
end

-- ===================================================================== START
function RoundService.start(deps)
	Config = deps.Config
	World = deps.World
	WorldBuilder = deps.WorldBuilder
	Data = deps.Data
	Remotes = deps.Remotes
	MonsterModules = deps.Monsters
	RoundService.runThreshold = Config.RunThreshold

	-- Türen
	for _, door in ipairs(World.cabin.doors) do
		door.prompt.Triggered:Connect(function(player)
			local night = state.night
			local opening = not door.isOpen
			if night and night.active then
				local info = night.players[player]
				if not info or not info.alive then
					return
				end
				if night.module and night.module.onDoor then
					local ok, err = pcall(night.module.onDoor, night, player, door, opening)
					if not ok then
						warn("[HorrorRoulette] onDoor:", err)
					end
				end
			end
			setDoor(door, opening)
		end)
	end

	-- Radio
	local radio = World.cabin.radio
	radio.prompt.Triggered:Connect(function(player)
		local turnOn = not radio.isOn
		local night = state.night
		if night and night.active then
			local info = night.players[player]
			if not info or not info.alive then
				return
			end
		end
		RoundService.setRadio(turnOn)
		if night and night.active and night.module and night.module.onRadio then
			pcall(night.module.onRadio, night, player, turnOn)
		end
	end)

	-- Zettel
	for _, note in ipairs(World.cabin.notes) do
		note.prompt.Triggered:Connect(function(player)
			local night = state.night
			local info = night and night.active and night.players[player]
			RoundService.playSound("PageFlip", note.part, 0.6)
			if not info then
				fire("Note", player, "Leerer Zettel", "Hier steht nichts.\nNoch nicht.")
				return
			end
			local entry = night.def.notes[note.index]
			fire("Note", player, entry.title, entry.text)
			if not info.read[note.index] then
				info.read[note.index] = true
				info.coins = info.coins + Config.Coins.NoteFirstRead
				Data.addCoins(player, Config.Coins.NoteFirstRead)
			end
			if not night.found[note.index] then
				night.found[note.index] = true
				night.foundCount = night.foundCount + 1
				if night.foundCount >= 2 and not night.revealed then
					night.revealed = true
					info.coins = info.coins + Config.Coins.RuleFirst
					Data.addCoins(player, Config.Coins.RuleFirst)
					for p in pairs(night.players) do
						fire("RuleReveal", p, night.def.id, player.DisplayName)
					end
				end
				sendStateAll()
			end
		end)
	end

	-- Fernsteuerungen vom Client (streng geprüft)
	Remotes.SetReady.OnServerEvent:Connect(function(player, value)
		if type(value) ~= "boolean" then
			return
		end
		state.ready[player] = value
		sendStateAll()
	end)
	Remotes.SaveSettings.OnServerEvent:Connect(function(player, settings)
		if type(settings) ~= "table" then
			return
		end
		Data.setSettings(player, settings)
		RoundService.pushProfile(player)
	end)

	Players.PlayerAdded:Connect(onPlayerAdded)
	Players.PlayerRemoving:Connect(onPlayerRemoving)
	for _, player in ipairs(Players:GetPlayers()) do
		task.spawn(onPlayerAdded, player)
	end

	task.spawn(mainLoop)
end

return RoundService
