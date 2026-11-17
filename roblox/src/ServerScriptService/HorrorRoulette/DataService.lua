-- Speichert pro Spieler: Münzen, überlebte Nächte, Eindämmungsakte, Einstellungen.
-- Funktioniert in Studio nur, wenn unter Spiel-Einstellungen > Sicherheit
-- "Studio-Zugriff auf API-Dienste" aktiviert ist. Sonst wird nur im Speicher gezählt.
local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local DataService = {}

local STORE_NAME = "HorrorRoulette_v1"
local profiles = {}
local store = nil
local storeWarned = false

local function getStore()
	if store then
		return store
	end
	local ok, result = pcall(function()
		return DataStoreService:GetDataStore(STORE_NAME)
	end)
	if ok then
		store = result
	elseif not storeWarned then
		storeWarned = true
		warn("[HorrorRoulette] DataStore nicht verfügbar – Fortschritt wird nur für diese Sitzung gezählt.", result)
	end
	return store
end

local function defaultProfile()
	return {
		coins = 0,
		nights = 0,
		akte = {},
		settings = { sound = true, shake = true },
	}
end

local function merge(base, saved)
	if type(saved) ~= "table" then
		return base
	end
	if type(saved.coins) == "number" then
		base.coins = math.max(0, math.floor(saved.coins))
	end
	if type(saved.nights) == "number" then
		base.nights = math.max(0, math.floor(saved.nights))
	end
	if type(saved.akte) == "table" then
		for id, value in pairs(saved.akte) do
			if type(id) == "string" and value == true then
				base.akte[id] = true
			end
		end
	end
	if type(saved.settings) == "table" then
		if type(saved.settings.sound) == "boolean" then
			base.settings.sound = saved.settings.sound
		end
		if type(saved.settings.shake) == "boolean" then
			base.settings.shake = saved.settings.shake
		end
	end
	return base
end

function DataService.load(player)
	local profile = defaultProfile()
	local ds = getStore()
	if ds then
		local ok, saved = pcall(function()
			return ds:GetAsync("p_" .. player.UserId)
		end)
		if ok then
			profile = merge(profile, saved)
		elseif not storeWarned then
			storeWarned = true
			warn("[HorrorRoulette] Laden fehlgeschlagen (in Studio API-Zugriff aktivieren):", saved)
		end
	end
	profiles[player] = profile
	return profile
end

function DataService.save(player)
	local profile = profiles[player]
	local ds = getStore()
	if not profile or not ds then
		return
	end
	local ok, err = pcall(function()
		ds:SetAsync("p_" .. player.UserId, profile)
	end)
	if not ok and not storeWarned then
		storeWarned = true
		warn("[HorrorRoulette] Speichern fehlgeschlagen:", err)
	end
end

function DataService.get(player)
	return profiles[player]
end

function DataService.release(player)
	DataService.save(player)
	profiles[player] = nil
end

function DataService.addCoins(player, amount)
	local profile = profiles[player]
	if profile then
		profile.coins = profile.coins + amount
	end
end

function DataService.recordSurvival(player, monsterId)
	local profile = profiles[player]
	if not profile then
		return false
	end
	profile.nights = profile.nights + 1
	local isNew = profile.akte[monsterId] ~= true
	profile.akte[monsterId] = true
	return isNew
end

function DataService.setSettings(player, settings)
	local profile = profiles[player]
	if not profile or type(settings) ~= "table" then
		return
	end
	if type(settings.sound) == "boolean" then
		profile.settings.sound = settings.sound
	end
	if type(settings.shake) == "boolean" then
		profile.settings.shake = settings.shake
	end
end

-- Beim Herunterfahren alle speichern
game:BindToClose(function()
	for _, player in ipairs(Players:GetPlayers()) do
		DataService.save(player)
	end
end)

return DataService
