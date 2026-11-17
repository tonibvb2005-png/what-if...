-- HORROR ROULETTE – Server-Start
-- Baut die Welt, legt die Fernsteuerungen (RemoteEvents) an und startet den Rundenablauf.
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local shared = ReplicatedStorage:WaitForChild("HorrorRoulette")
local Config = require(shared:WaitForChild("Config"))

local modules = script.Parent
local WorldBuilder = require(modules.WorldBuilder)
local DataService = require(modules.DataService)
local RoundService = require(modules.RoundService)
local Monsters = {
	Hutfrau = require(modules.Monsters.Hutfrau),
	Schreier = require(modules.Monsters.Schreier),
	Gesichtslose = require(modules.Monsters.Gesichtslose),
}

-- RemoteEvents (Server → Client und Client → Server)
local REMOTE_NAMES = {
	"State", "Roulette", "Notice", "Note", "RuleReveal", "Jumpscare", "Profile", "FakeChat", "Results",
	"SetReady", "SaveSettings",
}
local remotesFolder = shared:FindFirstChild("Remotes")
if not remotesFolder then
	remotesFolder = Instance.new("Folder")
	remotesFolder.Name = "Remotes"
	remotesFolder.Parent = shared
end
local remotes = {}
for _, name in ipairs(REMOTE_NAMES) do
	local remote = remotesFolder:FindFirstChild(name)
	if not remote then
		remote = Instance.new("RemoteEvent")
		remote.Name = name
		remote.Parent = remotesFolder
	end
	remotes[name] = remote
end

local world = WorldBuilder.build(Config)

RoundService.start({
	Config = Config,
	World = world,
	WorldBuilder = WorldBuilder,
	Data = DataService,
	Remotes = remotes,
	Monsters = Monsters,
})

print("[HorrorRoulette] Server bereit.")
