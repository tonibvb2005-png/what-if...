-- HORROR ROULETTE – Client-Start: verbindet Server-Nachrichten mit Oberfläche und Effekten
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local TextChatService = game:GetService("TextChatService")

local shared = ReplicatedStorage:WaitForChild("HorrorRoulette")
local Config = require(shared:WaitForChild("Config"))
local remotesFolder = shared:WaitForChild("Remotes")
local function remote(name)
	return remotesFolder:WaitForChild(name)
end

local UI = require(script:WaitForChild("UI"))
local Effects = require(script:WaitForChild("Effects"))

local state = { phase = "Lobby" }
local profile = { coins = 0, nights = 0, rank = "Praktikant", akte = {}, settings = { sound = true, shake = true } }

local function saveSettings()
	remote("SaveSettings"):FireServer({ sound = profile.settings.sound, shake = profile.settings.shake })
end

local gui = UI.build(Config, {
	onPlay = function()
		remote("SetReady"):FireServer(true)
	end,
	onToggleSetting = function(key)
		profile.settings[key] = not (profile.settings[key] ~= false)
		UI.updateSettings(profile.settings)
		Effects.setSettings(profile.settings)
		saveSettings()
	end,
})
Effects.init(Config, gui)
UI.updateAkte(profile.akte)
UI.updateSettings(profile.settings)
UI.showMenu(true)

local function clockText(nightStart)
	local elapsed = workspace:GetServerTimeNow() - nightStart
	local u = math.clamp(elapsed / Config.NightSeconds, 0, 1)
	local minutes = math.floor(u * 6 * 60)
	return string.format("%02d:%02d", math.floor(minutes / 60), minutes % 60)
end

local function applyState(s)
	state = s
	local def = s.monsterId and Config.GetMonster(s.monsterId) or nil
	local inNight = s.phase == "Night" and s.participant
	UI.setLobbyMode(not inNight and s.phase ~= "Roulette")
	UI.setNightHud(inNight and s.alive, s.notesFound or 0, 3)
	UI.setTaken(inNight and not s.alive)
	if inNight and def then
		UI.setHeader("HORROR ROULETTE  •  " .. def.name)
	else
		UI.setHeader("HORROR ROULETTE  •  LOBBY")
	end
	if (s.phase ~= "Night" and s.phase ~= "Results") or not s.participant then
		UI.hideRule()
	end
end

remote("State").OnClientEvent:Connect(applyState)

remote("Profile").OnClientEvent:Connect(function(p)
	profile = p
	UI.setProfile(p)
	UI.updateAkte(p.akte)
	UI.updateSettings(p.settings)
	Effects.setSettings(p.settings)
end)

remote("Roulette").OnClientEvent:Connect(function(index, duration)
	UI.showMenu(false)
	Effects.play("Alarm", 0.5)
	UI.playRoulette(index, duration, function()
		Effects.play("RouletteTick", 0.5)
	end, function()
		Effects.play("RouletteLock", 1)
		Effects.shake(0.4, 0.3)
	end)
end)

remote("Notice").OnClientEvent:Connect(function(text, kind)
	UI.subtitle(text, kind)
	if kind == "danger" then
		Effects.shake(0.5, 0.35)
	end
end)

remote("Note").OnClientEvent:Connect(function(title, text)
	UI.showNote(title, text)
	Effects.play("PageFlip", 0.7)
end)

remote("RuleReveal").OnClientEvent:Connect(function(monsterId, byName)
	local def = Config.GetMonster(monsterId)
	if def then
		UI.showRule(def, byName)
		UI.subtitle("Regel erkannt: " .. def.rule, "warn")
	end
end)

remote("Jumpscare").OnClientEvent:Connect(function(monsterId)
	Effects.jumpscare(monsterId)
end)

remote("Results").OnClientEvent:Connect(function(data)
	local def = Config.GetMonster(data.monsterId)
	task.delay(1.2, function()
		UI.showResults(data, def)
	end)
end)

-- Falsche Chat-Nachricht: sieht aus wie eine echte Nachricht eines Mitspielers.
-- Kleiner Hinweis für Aufmerksame: das "≈"-Rauschzeichen am Ende.
remote("FakeChat").OnClientEvent:Connect(function(speaker, text)
	local ok = pcall(function()
		local channels = TextChatService:FindFirstChild("TextChannels")
		local general = channels and channels:FindFirstChild("RBXGeneral")
		if not general then
			error("kein Kanal")
		end
		general:DisplaySystemMessage(string.format('<font color="#9FD4FF">%s:</font> %s <font transparency="0.55">≈</font>', speaker, text))
	end)
	if not ok then
		UI.fakeChatFallback(speaker, text)
	end
end)

-- Laufende Anzeige: Uhr in der Nacht, Countdown in der Lobby
RunService.Heartbeat:Connect(function()
	local s = state
	if s.phase == "Night" and s.nightStart then
		UI.setClock(true, clockText(s.nightStart))
		if not s.participant then
			UI.setStatus("Eine Nacht läuft – du bist in der nächsten Runde dabei.")
		else
			UI.setStatus("")
		end
	elseif s.phase == "Countdown" then
		UI.setClock(false)
		local left = math.max(0, math.ceil((s.endsAt or 0) - workspace:GetServerTimeNow()))
		UI.setStatus(s.ready and ("Nächste Nacht in " .. left) or "Drücke SPIELEN im Menü, um mitzuspielen")
	elseif s.phase == "Lobby" then
		UI.setClock(false)
		UI.setStatus(s.ready and "Warte auf die nächste Nacht …" or "")
	elseif s.phase == "Roulette" then
		UI.setClock(false)
		UI.setStatus("")
	elseif s.phase == "Results" then
		UI.setStatus("")
	end
end)
