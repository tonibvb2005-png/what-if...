-- DER SCHREIER – Regel: Mach kein Geräusch.
-- Er ist blind und hört alles: Rennen, Türen, das Radio. Erstes Geräusch = Warnung,
-- zweites Geräusch innerhalb von 25 Sekunden = der Spieler wird geholt.
local MonsterModels = require(script.Parent.Parent.MonsterModels)

local Schreier = {}

local MOVE_SPEED = 7
local MIN_DIST_FROM_HOUSE = 34
local STRIKE_WINDOW = 25
local GRACE_AFTER_WARNING = 3
local RADIO_TOLERANCE = 8

local function flat(v)
	return Vector3.new(v.X, 0, v.Z)
end

function Schreier.start(night, world)
	local center = world.cabin.center
	local angle = math.random() * math.pi * 2
	local pos = Vector3.new(center.X + math.cos(angle) * 80, 0, center.Z + math.sin(angle) * 80)
	night.monster = {
		model = MonsterModels.build("Schreier", world.nightFolder, CFrame.lookAt(pos, Vector3.new(center.X, 0, center.Z)), 1),
		pos = pos,
		target = nil,
		lastWarning = -100,
		lastNoise = {},
		radioOnAt = nil,
		nextRadio = 35 + math.random() * 15,
		nextLure = 30 + math.random() * 15,
		wanderAngle = angle,
	}
end

-- Ein Geräusch wurde gemacht
local function noise(night, player, what)
	local s = night.monster
	if not s or not player then
		return
	end
	local t = night.elapsed
	if s.lastNoise[player] and t - s.lastNoise[player] < 1.5 then
		return
	end
	s.lastNoise[player] = t
	local root = night:root(player)
	if root then
		s.target = flat(root.CFrame.Position)
	end
	local sinceWarning = t - s.lastWarning
	if sinceWarning < GRACE_AFTER_WARNING then
		return
	end
	if sinceWarning <= STRIKE_WINDOW then
		night:sound("Siren", s.model.PrimaryPart, 1)
		night:take(player, what)
		s.lastWarning = -100
	else
		s.lastWarning = t
		night:sound("Siren", s.model.PrimaryPart, 0.8)
		night:notice("ER HAT ETWAS GEHÖRT (" .. what .. "). Keinen Laut mehr!", "danger")
	end
end

function Schreier.update(night, world, dt)
	local s = night.monster
	if not s then
		return
	end
	local cabin = world.cabin
	local center = flat(cabin.center)

	-- Rennen ist laut
	for _, player in ipairs(night:alive()) do
		local root = night:root(player)
		if root then
			local v = root.AssemblyLinearVelocity
			local speed = Vector3.new(v.X, 0, v.Z).Magnitude
			if speed > night.round.runThreshold then
				noise(night, player, "Rennen")
			end
		end
	end

	-- Das Radio geht von selbst an
	local radio = cabin.radio
	s.nextRadio = s.nextRadio - dt
	if s.nextRadio <= 0 and not radio.isOn then
		s.nextRadio = 40 + math.random() * 20
		night.round.setRadio(true)
		s.radioOnAt = night.elapsed
		night:notice("Das Radio geht von selbst an.", "warn")
	end
	if radio.isOn and s.radioOnAt and night.elapsed - s.radioOnAt > RADIO_TOLERANCE then
		-- Wer am nächsten am Radio ist, wird gehört
		local nearest, best = nil, math.huge
		for _, player in ipairs(night:alive()) do
			local root = night:root(player)
			if root then
				local d = (root.CFrame.Position - radio.part.CFrame.Position).Magnitude
				if d < best then
					nearest, best = player, d
				end
			end
		end
		s.radioOnAt = night.elapsed
		noise(night, nearest, "Radio")
	end

	-- Lockrufe
	s.nextLure = s.nextLure - dt
	if s.nextLure <= 0 then
		s.nextLure = 40 + math.random() * 20
		local lures = night.def.lures
		night:lure(lures[math.random(#lures)])
	end

	-- Bewegung: zum letzten Geräusch, aber nie näher als MIN_DIST an die Hütte
	local goal
	if s.target then
		local away = flat(s.target - center)
		if away.Magnitude < 1 then
			away = Vector3.new(1, 0, 0)
		end
		goal = center + away.Unit * math.max(MIN_DIST_FROM_HOUSE, away.Magnitude)
	else
		s.wanderAngle = s.wanderAngle + dt * 0.04
		goal = center + Vector3.new(math.cos(s.wanderAngle), 0, math.sin(s.wanderAngle)) * 70
	end
	local delta = goal - s.pos
	if delta.Magnitude > 0.5 then
		s.pos = s.pos + delta.Unit * math.min(delta.Magnitude, MOVE_SPEED * dt)
	end
	s.model:PivotTo(CFrame.lookAt(s.pos, Vector3.new(center.X, 0, center.Z)))
end

function Schreier.onDoor(night, player)
	noise(night, player, "Tür")
end

function Schreier.onRadio(night, player, turnedOn)
	local s = night.monster
	if not s then
		return
	end
	if turnedOn then
		s.radioOnAt = night.elapsed
		noise(night, player, "Radio")
	else
		s.radioOnAt = nil
	end
end

function Schreier.stop(night)
	local s = night.monster
	if s and s.model then
		s.model:Destroy()
	end
	night.monster = nil
end

return Schreier
