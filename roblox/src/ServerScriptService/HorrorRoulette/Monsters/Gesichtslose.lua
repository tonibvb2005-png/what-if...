-- DER GESICHTSLOSE – Regel: Renn nicht (in seiner Nähe).
-- Nur durch die Kamera sichtbar (Attribut "CameraOnly", der Client blendet ihn sonst aus).
-- Er taucht immer wieder hinter einem Spieler auf.
local MonsterModels = require(script.Parent.Parent.MonsterModels)

local Gesichtslose = {}

local DANGER_RADIUS = 32
local RUN_TIME_LIMIT = 0.35

local function flat(v)
	return Vector3.new(v.X, 0, v.Z)
end

function Gesichtslose.start(night, world)
	local center = world.cabin.center
	local start = Vector3.new(center.X - 40, 0, center.Z)
	local model = MonsterModels.build("Gesichtslose", world.nightFolder, CFrame.lookAt(start, Vector3.new(center.X, 0, center.Z)), 1)
	model:SetAttribute("CameraOnly", true)
	night.monster = {
		model = model,
		nextJump = 9,
		runTime = {},
		nextLure = 25 + math.random() * 10,
	}
end

local function jumpBehind(night, player)
	local s = night.monster
	local root = night:root(player)
	if not s or not root then
		return
	end
	local behind = root.CFrame * CFrame.new(0, 0, 9)
	local feetY = root.CFrame.Position.Y - 3
	local pos = Vector3.new(behind.Position.X, feetY, behind.Position.Z)
	local lookAt = Vector3.new(root.CFrame.Position.X, feetY, root.CFrame.Position.Z)
	s.model:PivotTo(CFrame.lookAt(pos, lookAt))
	night:sound("Static", s.model.PrimaryPart, 0.7)
end

function Gesichtslose.update(night, world, dt)
	local s = night.monster
	if not s then
		return
	end
	local alive = night:alive()

	s.nextJump = s.nextJump - dt
	if s.nextJump <= 0 and #alive > 0 then
		s.nextJump = 15 + math.random() * 10
		jumpBehind(night, alive[math.random(#alive)])
	end

	-- Regel prüfen: rennen in seiner Nähe
	local mPos = flat(s.model:GetPivot().Position)
	for _, player in ipairs(alive) do
		local root = night:root(player)
		if root then
			local dist = (flat(root.CFrame.Position) - mPos).Magnitude
			local v = root.AssemblyLinearVelocity
			local speed = Vector3.new(v.X, 0, v.Z).Magnitude
			if dist < DANGER_RADIUS and speed > night.round.runThreshold then
				s.runTime[player] = (s.runTime[player] or 0) + dt
				if s.runTime[player] >= RUN_TIME_LIMIT then
					s.runTime[player] = 0
					night:take(player, "Rennen")
				end
			else
				s.runTime[player] = 0
			end
		end
	end

	s.nextLure = s.nextLure - dt
	if s.nextLure <= 0 then
		s.nextLure = 35 + math.random() * 15
		local lures = night.def.lures
		night:lure(lures[math.random(#lures)])
	end
end

function Gesichtslose.stop(night)
	local s = night.monster
	if s and s.model then
		s.model:Destroy()
	end
	night.monster = nil
end

return Gesichtslose
