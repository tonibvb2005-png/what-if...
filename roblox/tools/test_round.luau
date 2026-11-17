-- Simulation des kompletten Rundenablaufs mit zwei Test-Spielern (Zeit läuft SPEED-mal schneller).
local fs = require("@lune/fs")
local luau = require("@lune/luau")
local roblox = require("@lune/roblox")
local realTask = require("@lune/task")
local process = require("@lune/process")
require("./harness") -- registriert PivotTo, ScaleTo, GetBoundingBox

local SPEED = 20
realTask.delay(70, function() print("ABBRUCH: Zeitlimit"); process.exit(1) end)
local t0 = os.clock()
local function simNow() return (os.clock() - t0) * SPEED end

-- task-Bibliothek mit beschleunigter Zeit
local task = {
	wait = function(t) t = t or 0.03; realTask.wait(t / SPEED); return t end,
	delay = function(t, fn, ...) return realTask.delay((t or 0) / SPEED, fn, ...) end,
	spawn = realTask.spawn, defer = realTask.defer, cancel = realTask.cancel,
}

-- Einfache Signale
local function Signal()
	local s = { handlers = {} }
	function s:Connect(fn) table.insert(self.handlers, fn); return { Connected = true, Disconnect = function() end } end
	function s:Fire(...) for _, h in self.handlers do realTask.spawn(h, ...) end end
	return s
end
local signals = {}
local function signalFor(inst, name)
	local key = inst:GetFullName() .. "::" .. name
	signals[key] = signals[key] or Signal()
	return signals[key]
end
roblox.implementProperty("ProximityPrompt", "Triggered", function(inst) return signalFor(inst, "Triggered") end)
roblox.implementProperty("RemoteEvent", "OnServerEvent", function(inst) return signalFor(inst, "OnServerEvent") end)
local log = {}
roblox.implementMethod("RemoteEvent", "FireClient", function(inst, player, ...)
	table.insert(log, { t = simNow(), to = player.Name, name = inst.Name, args = { ... } })
end)
roblox.implementMethod("RemoteEvent", "FireAllClients", function(inst, ...)
	table.insert(log, { t = simNow(), to = "ALLE", name = inst.Name, args = { ... } })
end)
for _, m in { "Play", "Stop", "Pause" } do roblox.implementMethod("Sound", m, function() end) end
roblox.implementMethod("Workspace", "GetServerTimeNow", function() return simNow() end)
roblox.implementMethod("Model", "WaitForChild", function(inst, name) return inst:FindFirstChild(name) end)
for _, cls in { "Folder", "ReplicatedStorage", "Workspace" } do roblox.implementMethod(cls, "WaitForChild", function(inst, name) return inst:FindFirstChild(name) end) end
roblox.implementMethod("Folder", "ClearAllChildren", function(inst) for _, c in inst:GetChildren() do c:Destroy() end end)

local game = roblox.Instance.new("DataModel")
local workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local sharedFolder = roblox.Instance.new("Folder")
sharedFolder.Name = "HorrorRoulette"
sharedFolder.Parent = ReplicatedStorage
local cfgModule = roblox.Instance.new("ModuleScript")
cfgModule.Name = "Config"
cfgModule.Parent = sharedFolder

-- Spieler-Attrappen
local PlayersMock = { PlayerAdded = Signal(), PlayerRemoving = Signal(), list = {} }
function PlayersMock:GetPlayers() return self.list end
local function makePlayer(name, id)
	local p = { Name = name, DisplayName = name, UserId = id, Parent = PlayersMock, CharacterAdded = Signal() }
	local backpack = roblox.Instance.new("Folder")
	backpack.Name = "Backpack"
	function p:FindFirstChildOfClass(cls) if cls == "Backpack" then return backpack end return nil end
	local char = roblox.Instance.new("Model")
	char.Name = name
	local hrp = roblox.Instance.new("Part")
	hrp.Name = "HumanoidRootPart"
	hrp.Size = roblox.Vector3.new(2, 2, 1)
	hrp.AssemblyLinearVelocity = roblox.Vector3.new(0, 0, 0)
	hrp.Parent = char
	char.PrimaryPart = hrp
	char.Parent = workspace
	p.Character = char
	p.backpack = backpack
	return p
end

local store = {}
local services = {
	Players = PlayersMock,
	TweenService = { Create = function(_, inst, _, goal) return { Play = function() for k, v in goal do inst[k] = v end end } end },
	Debris = { AddItem = function() end },
	CollectionService = { AddTag = function(_, inst, tag) inst:AddTag(tag) end },
	DataStoreService = { GetDataStore = function() return {
		GetAsync = function(_, key) return store[key] end,
		SetAsync = function(_, key, value) store[key] = value end,
	} end },
}
local fakeGame = {
	GetService = function(_, name) return services[name] or game:GetService(name) end,
	BindToClose = function() end,
}

local loaded = {}
local function req(target)
	if typeof(target) == "Instance" then return loaded[target.Name] end
	return loaded[target.__name]
end
local function env(scriptObj)
	return {
		game = fakeGame, workspace = workspace, script = scriptObj, task = task,
		Instance = roblox.Instance, Vector3 = roblox.Vector3, CFrame = roblox.CFrame, Color3 = roblox.Color3,
		UDim2 = roblox.UDim2, UDim = roblox.UDim, Enum = roblox.Enum, TweenInfo = { new = function() return {} end },
		Random = { new = function() return { NextNumber = function(_, a, b) return a + math.random() * (b - a) end } end },
		require = req, print = print, warn = function(...) print("WARN", ...) end, error = error, pcall = pcall,
		ipairs = ipairs, pairs = pairs, math = math, table = table, string = string, type = type, typeof = typeof,
		setmetatable = setmetatable, tostring = tostring, tonumber = tonumber, select = select, next = next, assert = assert,
	}
end
local function load(name, path, scriptObj)
	loaded[name] = luau.load(fs.readFile(path), { debugName = name, environment = env(scriptObj) })()
	return loaded[name]
end
local function names(list) local t = {} for _, n in list do t[n] = { __name = n } end return t end

local base = "src/ServerScriptService/HorrorRoulette/"
local Config = load("Config", "src/ReplicatedStorage/HorrorRoulette/Config.lua", {})
Config.IntermissionSeconds = 2
Config.RouletteSeconds = 2
Config.NightSeconds = 70
Config.ResultsSeconds = 2
load("Build", base .. "Build.lua", { Parent = {} })
load("MonsterModels", base .. "MonsterModels.lua", { Parent = names({ "Build" }) })
load("WorldBuilder", base .. "WorldBuilder.lua", { Parent = names({ "Build", "MonsterModels" }) })
load("DataService", base .. "DataService.lua", { Parent = {} })
load("RoundService", base .. "RoundService.lua", { Parent = {} })
for _, m in { "Hutfrau", "Schreier", "Gesichtslose" } do
	load(m, base .. "Monsters/" .. m .. ".lua", { Parent = { Parent = names({ "MonsterModels" }) } })
end
local parent = names({ "WorldBuilder", "DataService", "RoundService" })
parent.Monsters = names({ "Hutfrau", "Schreier", "Gesichtslose" })
load("Main", base .. "Main.server.lua", { Parent = parent })

local A, B = makePlayer("Anna", 1), makePlayer("Ben", 2)
for _, p in { A, B } do
	table.insert(PlayersMock.list, p)
	PlayersMock.PlayerAdded:Fire(p)
end
realTask.wait(0.1)
local remotes = sharedFolder:FindFirstChild("Remotes")
for _, p in { A, B } do
	signalFor(remotes:FindFirstChild("SetReady"), "OnServerEvent"):Fire(p, true)
end

local cabinHouse = workspace:FindFirstChild("HorrorRoulette"):FindFirstChild("Cabin"):FindFirstChild("House")
local function prompt(partName, promptName)
	return cabinHouse:FindFirstChild(partName):FindFirstChild(promptName)
end
local function lastState(name)
	for i = #log, 1, -1 do
		local e = log[i]
		if e.name == "State" and e.to == name then return e.args[1] end
	end
end
local function count(name, to)
	local n = 0
	for _, e in log do if e.name == name and (to == nil or e.to == to) then n += 1 end end
	return n
end

realTask.spawn(function()
	while true do
		realTask.wait(10)
		local st = lastState("Anna")
		print("[debug] sim", math.floor(simNow()), "phase", st and st.phase, "ready", st and st.ready, "log", #log)
	end
end)
local seen = {}
for round = 1, 6 do
	-- warten bis zur Nacht
	local s
	repeat realTask.wait(0.05); s = lastState("Anna") until s and s.phase == "Night"
	local monster = s.monsterId
	local startLog = #log
	print(`\n=== Runde {round}: {monster} (Sim-Zeit {math.floor(simNow())}s) ===`)
	seen[monster] = true
	-- zwei Zettel lesen -> Regel enthüllen
	signalFor(prompt("Note1", "NotePrompt"), "Triggered"):Fire(A)
	signalFor(prompt("Note2", "NotePrompt"), "Triggered"):Fire(A)
	realTask.wait(0.05)
	if monster == "Hutfrau" then
		realTask.wait(30 / SPEED) -- warten, bis sie geklopft hat
		signalFor(prompt("Haustür", "DoorPrompt"), "Triggered"):Fire(B)
	elseif monster == "Schreier" then
		local hrp = B.Character.PrimaryPart
		hrp.AssemblyLinearVelocity = roblox.Vector3.new(25, 0, 0)
		realTask.wait(1 / SPEED)
		hrp.AssemblyLinearVelocity = roblox.Vector3.new(0, 0, 0)
		realTask.wait(6 / SPEED)
		hrp.AssemblyLinearVelocity = roblox.Vector3.new(25, 0, 0)
		realTask.wait(2 / SPEED)
		hrp.AssemblyLinearVelocity = roblox.Vector3.new(0, 0, 0)
	elseif monster == "Gesichtslose" then
		realTask.wait(12 / SPEED) -- er springt hinter jemanden
		for _, p in { A, B } do p.Character.PrimaryPart.AssemblyLinearVelocity = roblox.Vector3.new(25, 0, 0) end
		realTask.wait(1.5 / SPEED)
		for _, p in { A, B } do p.Character.PrimaryPart.AssemblyLinearVelocity = roblox.Vector3.new(0, 0, 0) end
	end
	-- Ende abwarten
	repeat realTask.wait(0.05); s = lastState("Anna") until s and s.phase ~= "Night"
	local events = {}
	for i = startLog + 1, #log do
		local e = log[i]
		if e.name ~= "State" and e.name ~= "Profile" then
			local a = e.args
			local detail = ""
			if e.name == "Notice" or e.name == "FakeChat" or e.name == "Note" then detail = tostring(a[1]) .. " | " .. tostring(a[2]) end
			if e.name == "Results" then detail = `überlebt={a[1].survived} münzen={a[1].coins} neu={a[1].newEntry}` end
			if e.name == "RuleReveal" or e.name == "Jumpscare" then detail = tostring(a[1]) .. " " .. tostring(a[2] or "") end
			table.insert(events, string.format("  %5.1fs  %-10s an %-5s %s", e.t, e.name, e.to, detail))
		end
	end
	print(table.concat(events, "\n"))
	if seen.Hutfrau and seen.Schreier and seen.Gesichtslose then break end
end
print("\nGespeicherte Profile:")
for k, v in store do print(" ", k, `münzen={v.coins} nächte={v.nights}`) end
print("Gesehene Monster:", seen.Hutfrau and "Hutfrau" or "-", seen.Schreier and "Schreier" or "-", seen.Gesichtslose and "Gesichtslose" or "-")
process.exit(0)
