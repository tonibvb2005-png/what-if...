-- DIE HUTFRAU – Regel: Öffne keine Tür nach draußen.
-- Sie umrundet die Hütte, klopft an Türen und ruft mit den Stimmen der Mitspieler.
local MonsterModels = require(script.Parent.Parent.MonsterModels)

local Hutfrau = {}

local WALK_SPEED = 6

local function flat(v)
	return Vector3.new(v.X, 0, v.Z)
end

local function face(model, pos, lookAt)
	local dir = flat(lookAt - pos)
	if dir.Magnitude < 0.01 then
		dir = Vector3.new(0, 0, -1)
	end
	model:PivotTo(CFrame.lookAt(pos, pos + dir))
end

function Hutfrau.start(night, world)
	local cabin = world.cabin
	local first = cabin.path[1]
	night.monster = {
		model = MonsterModels.build("Hutfrau", world.nightFolder, CFrame.new(first), 1),
		pos = first,
		pathIndex = 2,
		mode = "walk",
		nextKnock = 18 + math.random() * 10,
		nextWhisper = 10,
		door = nil,
		wait = 0,
	}
end

local function knock(night, door)
	night:sound("Knock", door.panel, 1)
	night:notice("Es klopft an der " .. door.name .. ".", "warn")
	local def = night.def
	task.delay(1.6, function()
		if night.active then
			night:lure(def.lures[math.random(#def.lures)])
		end
	end)
end

function Hutfrau.update(night, world, dt)
	local s = night.monster
	if not s then
		return
	end
	local cabin = world.cabin
	s.nextKnock = s.nextKnock - dt
	s.nextWhisper = s.nextWhisper - dt

	if s.nextWhisper <= 0 then
		s.nextWhisper = 12 + math.random() * 8
		night:sound("PoPoPo", s.model.PrimaryPart, 1)
	end

	if s.mode == "walk" then
		if s.nextKnock <= 0 and not s.door then
			s.door = cabin.doors[math.random(#cabin.doors)]
			s.nextKnock = 28 + math.random() * 14
		end
		local target
		if s.door then
			target = Vector3.new(s.door.outsidePos.X, 0, s.door.outsidePos.Z)
		else
			target = cabin.path[s.pathIndex]
		end
		local delta = flat(target - s.pos)
		local dist = delta.Magnitude
		if dist < 0.6 then
			if s.door then
				s.mode = "knock"
				s.wait = 6
				knock(night, s.door)
			else
				s.pathIndex = (s.pathIndex % #cabin.path) + 1
			end
		else
			s.pos = s.pos + delta.Unit * math.min(dist, WALK_SPEED * dt)
			face(s.model, s.pos, target)
		end
	elseif s.mode == "knock" then
		s.wait = s.wait - dt
		face(s.model, s.pos, Vector3.new(s.door.insidePos.X, 0, s.door.insidePos.Z))
		if s.wait <= 0 then
			s.mode = "walk"
			s.door = nil
		end
	elseif s.mode == "inside" then
		s.wait = s.wait - dt
		if s.wait <= 0 then
			s.mode = "walk"
			s.pos = cabin.path[1]
			s.pathIndex = 2
			face(s.model, s.pos, cabin.path[2])
		end
	end
end

-- Regel: Wer eine Außentür öffnet, wird geholt. Sie steht sofort im Türrahmen.
function Hutfrau.onDoor(night, player, door, opening)
	local s = night.monster
	if not opening or not s then
		return
	end
	s.mode = "inside"
	s.wait = 6
	s.door = nil
	s.pos = Vector3.new(door.outsidePos.X, 0, door.outsidePos.Z)
	face(s.model, s.pos, Vector3.new(door.insidePos.X, 0, door.insidePos.Z))
	night:take(player, "door")
end

function Hutfrau.stop(night)
	local s = night.monster
	if s and s.model then
		s.model:Destroy()
	end
	night.monster = nil
end

return Hutfrau
