local H = require("./harness")
local base = "src/ServerScriptService/HorrorRoulette/"
H.load("Config", "src/ReplicatedStorage/HorrorRoulette/Config.lua")
H.load("Build", base .. "Build.lua")
H.load("MonsterModels", base .. "MonsterModels.lua", { "Build" })
local WB = H.load("WorldBuilder", base .. "WorldBuilder.lua", { "Build", "MonsterModels" })
local config = require("./config_shim")
local world = WB.build(config)
WB.applyLighting("Lobby")
WB.applyLighting("Night")
WB.setNightProgress(0.9)
local parts, lights = 0, 0
for _, d in world.root:GetDescendants() do
	if d:IsA("BasePart") then parts += 1 end
	if d:IsA("Light") then lights += 1 end
end
print("Teile:", parts, "Lichter:", lights)
print("Zellen:", #world.lobby.alarms, "Alarme; Türen:", #world.cabin.doors, "Zettel:", #world.cabin.notes)
for id, c in world.lobby.cells do
	local cf, size = c.model:GetBoundingBox()
	print(string.format("Zelle %-13s x=%5.1f  Figur %.1f x %.1f x %.1f  Fuss y=%.2f", id, c.x, size.X, size.Y, size.Z, cf.Position.Y - size.Y/2))
end
local d = world.cabin.doors[1]
print("Haustür zu:", d.closedCF.Position, " offen:", d.openCF.Position)
local d2 = world.cabin.doors[2]
print("Hintertür zu:", d2.closedCF.Position, " offen:", d2.openCF.Position)
