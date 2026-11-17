-- Baut aus src/ eine spielbare Roblox-Place-Datei (HorrorRoulette.rbxl).
local fs = require("@lune/fs")
local roblox = require("@lune/roblox")
local Instance = roblox.Instance

local game = Instance.new("DataModel")
local function module(name, path, parent, class)
	local s = Instance.new(class or "ModuleScript")
	s.Name = name
	s.Source = fs.readFile(path)
	s.Parent = parent
	return s
end
local function folder(name, parent)
	local f = Instance.new("Folder")
	f.Name = name
	f.Parent = parent
	return f
end

-- ReplicatedStorage
local shared = folder("HorrorRoulette", game:GetService("ReplicatedStorage"))
module("Config", "src/ReplicatedStorage/HorrorRoulette/Config.lua", shared)

-- ServerScriptService
local srv = "src/ServerScriptService/HorrorRoulette/"
local server = folder("HorrorRoulette", game:GetService("ServerScriptService"))
module("Main", srv .. "Main.server.lua", server, "Script")
for _, n in { "Build", "MonsterModels", "WorldBuilder", "DataService", "RoundService" } do
	module(n, srv .. n .. ".lua", server)
end
local monsters = folder("Monsters", server)
for _, n in { "Hutfrau", "Schreier", "Gesichtslose" } do
	module(n, srv .. "Monsters/" .. n .. ".lua", monsters)
end

-- StarterPlayerScripts
local cli = "src/StarterPlayer/StarterPlayerScripts/HorrorRouletteClient/"
local sps = game:GetService("StarterPlayer"):FindFirstChildOfClass("StarterPlayerScripts")
if not sps then
	sps = Instance.new("StarterPlayerScripts")
	sps.Parent = game:GetService("StarterPlayer")
end
local client = module("HorrorRouletteClient", cli .. "Main.client.lua", sps, "LocalScript")
module("UI", cli .. "UI.lua", client)
module("Effects", cli .. "Effects.lua", client)

-- Grundeinstellungen
game:GetService("Workspace")
game:GetService("Lighting")
game:GetService("Players").CharacterAutoLoads = true

fs.writeFile("HorrorRoulette.rbxl", roblox.serializePlace(game))
fs.writeFile("HorrorRoulette.rbxlx", roblox.serializePlace(game, true))

-- Prüfen: wieder einlesen
local back = roblox.deserializePlace(fs.readFile("HorrorRoulette.rbxl"))
local n = 0
for _, d in back:GetDescendants() do
	if d:IsA("LuaSourceContainer") then
		n += 1
		print(string.format("  %-14s %-55s %6d Zeichen", d.ClassName, d:GetFullName(), #d.Source))
	end
end
print(n .. " Skripte in HorrorRoulette.rbxl")
