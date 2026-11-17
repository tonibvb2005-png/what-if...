-- Die drei Monster als Modelle aus Grundteilen (keine externen Assets nötig).
-- Alle Modelle stehen mit den Füßen bei y = 0 und schauen nach -Z (Roblox "vorne").
local Build = require(script.Parent.Build)

local MonsterModels = {}

local V = Vector3.new
local C = CFrame.new
local RGB = Color3.fromRGB

local function noCollide(model)
	for _, d in ipairs(model:GetDescendants()) do
		if d:IsA("BasePart") then
			d.CanCollide = false
			d.CanTouch = false
			d.Anchored = true
			d.CastShadow = true
		end
	end
end

-- DIE HUTFRAU: weißes Kleid, langes schwarzes Haar, breiter weißer Hut, ca. 14,5 Studs
local function buildHutfrau(parent)
	local m = Build.model(parent, "Hutfrau")
	local white = RGB(242, 238, 228)
	local pale = RGB(236, 226, 214)
	local hair = RGB(14, 12, 14)
	Build.part(m, "FootL", V(0.6, 0.4, 0.9), C(-0.5, 0.2, -0.1), pale)
	Build.part(m, "FootR", V(0.6, 0.4, 0.9), C(0.5, 0.2, -0.1), pale)
	Build.cylinder(m, "Dress", 8.6, 3.3, C(0, 4.7, 0), white, Enum.Material.Fabric)
	Build.cylinder(m, "Chest", 2.2, 2.3, C(0, 9.9, 0), white, Enum.Material.Fabric)
	Build.part(m, "HairBack", V(2.4, 5.2, 0.9), C(0, 10.4, 0.65), hair, Enum.Material.Fabric)
	Build.part(m, "ArmL", V(0.42, 6.4, 0.42), C(-1.55, 7.6, 0), pale)
	Build.part(m, "ArmR", V(0.42, 6.4, 0.42), C(1.55, 7.6, 0), pale)
	Build.cylinder(m, "Neck", 1.0, 0.6, C(0, 11.3, 0), pale)
	Build.ellipsoid(m, "Head", V(1.8, 2.1, 1.8), C(0, 12.5, 0), pale)
	Build.part(m, "HairL", V(0.35, 4.5, 1.2), C(-0.95, 11.2, 0.05), hair, Enum.Material.Fabric)
	Build.part(m, "HairR", V(0.35, 4.5, 1.2), C(0.95, 11.2, 0.05), hair, Enum.Material.Fabric)
	Build.part(m, "Smile", V(1.0, 0.12, 0.08), C(0, 11.95, -0.9), RGB(60, 10, 14))
	Build.ball(m, "EyeL", 0.26, C(-0.35, 12.6, -0.82), RGB(255, 245, 240), Enum.Material.Neon)
	Build.ball(m, "EyeR", 0.26, C(0.35, 12.6, -0.82), RGB(255, 245, 240), Enum.Material.Neon)
	Build.cylinder(m, "HatBrim", 0.18, 6.2, C(0, 13.6, 0), white, Enum.Material.Fabric)
	Build.cylinder(m, "HatCrown", 1.4, 2.5, C(0, 14.35, 0), white, Enum.Material.Fabric)
	Build.cylinder(m, "HatBand", 0.35, 2.56, C(0, 13.85, 0), RGB(20, 18, 20), Enum.Material.Fabric)
	noCollide(m)
	return m
end

-- DER SCHREIER: dürrer brauner Körper, Mast als Hals, zwei Lautsprecher, ca. 40 Studs
local function buildSchreier(parent)
	local m = Build.model(parent, "Schreier")
	local skin = RGB(128, 86, 58)
	local dark = RGB(90, 60, 42)
	local metal = RGB(112, 106, 102)
	Build.part(m, "LegL", V(1.2, 18, 1.2), C(-1.3, 9, 0), skin, Enum.Material.Fabric)
	Build.part(m, "LegR", V(1.2, 18, 1.2), C(1.3, 9, 0), skin, Enum.Material.Fabric)
	Build.part(m, "Pelvis", V(3.6, 2, 1.7), C(0, 18.6, 0), dark, Enum.Material.Fabric)
	Build.part(m, "Torso", V(3.4, 11, 1.8), C(0, 25, 0), skin, Enum.Material.Fabric)
	for i = 0, 4 do
		Build.part(m, "Rib" .. i, V(3.0, 0.25, 0.1), C(0, 22.5 + i * 1.3, -0.92), dark)
	end
	Build.part(m, "ArmL", V(0.8, 17, 0.8), C(-2.6, 22, 0), skin, Enum.Material.Fabric)
	Build.part(m, "ArmR", V(0.8, 17, 0.8), C(2.6, 22, 0), skin, Enum.Material.Fabric)
	Build.cylinder(m, "Pole", 7, 0.6, C(0, 34, 0), metal, Enum.Material.Metal)
	Build.part(m, "Crossbar", V(9.4, 0.5, 0.5), C(0, 37.4, 0), metal, Enum.Material.Metal)
	for _, side in ipairs({ -1, 1 }) do
		local x = side * 4.3
		Build.cylinderZ(m, "Horn", 3.6, 2.8, C(x, 37.4, -0.9), metal, Enum.Material.Metal)
		Build.cylinderZ(m, "HornInner", 0.12, 2.2, C(x, 37.4, -2.72), RGB(15, 12, 12))
		Build.cylinderZ(m, "HornBack", 1.6, 1.3, C(x, 37.4, 1.7), metal, Enum.Material.Metal)
	end
	noCollide(m)
	return m
end

-- DER GESICHTSLOSE: schwarzer Anzug, weißer ovaler Kopf ohne Gesicht, ca. 14 Studs
local function buildGesichtslose(parent)
	local m = Build.model(parent, "Gesichtslose")
	local suit = RGB(22, 22, 26)
	local white = RGB(238, 238, 238)
	Build.part(m, "LegL", V(1, 6.6, 1), C(-0.65, 3.3, 0), suit)
	Build.part(m, "LegR", V(1, 6.6, 1), C(0.65, 3.3, 0), suit)
	Build.part(m, "Torso", V(3, 5.2, 1.4), C(0, 9.2, 0), suit)
	Build.part(m, "Shirt", V(0.8, 5, 0.06), C(0, 9.3, -0.72), white)
	Build.part(m, "Tie", V(0.3, 3.6, 0.08), C(0, 9.6, -0.77), RGB(120, 14, 20))
	Build.part(m, "ArmL", V(0.7, 7.8, 0.7), C(-1.9, 8.1, 0), suit)
	Build.part(m, "ArmR", V(0.7, 7.8, 0.7), C(1.9, 8.1, 0), suit)
	for _, side in ipairs({ -1, 1 }) do
		for f = -1, 1 do
			Build.part(m, "Finger", V(0.14, 1.7, 0.14), C(side * 1.9 + f * 0.2, 3.4, 0), white)
		end
	end
	Build.cylinder(m, "Neck", 0.8, 0.5, C(0, 12.2, 0), white)
	Build.ellipsoid(m, "Head", V(2, 2.9, 2), C(0, 13.8, 0), white)
	noCollide(m)
	return m
end

-- Gesperrte Zelle: dunkle Silhouette mit Fragezeichen-Wirkung
local function buildUnknown(parent)
	local m = Build.model(parent, "Unbekannt")
	local black = RGB(8, 8, 10)
	Build.part(m, "Body", V(3, 8, 1.6), C(0, 4.5, 0), black)
	Build.ellipsoid(m, "Head", V(2.4, 2.8, 2.4), C(0, 10, 0), black)
	Build.ball(m, "EyeL", 0.3, C(-0.4, 10.2, -1.1), RGB(255, 40, 30), Enum.Material.Neon)
	Build.ball(m, "EyeR", 0.3, C(0.4, 10.2, -1.1), RGB(255, 40, 30), Enum.Material.Neon)
	noCollide(m)
	return m
end

local builders = {
	Hutfrau = buildHutfrau,
	Schreier = buildSchreier,
	Gesichtslose = buildGesichtslose,
	Unbekannt = buildUnknown,
}

-- Baut ein Monster, skaliert es und stellt es an cframe (Füße = cframe.Position)
function MonsterModels.build(id, parent, cframe, scale)
	local builder = builders[id] or buildUnknown
	local model = builder(parent)
	if scale and scale ~= 1 then
		pcall(function()
			model:ScaleTo(scale)
		end)
	end
	if cframe then
		model:PivotTo(cframe)
	end
	return model
end

return MonsterModels
