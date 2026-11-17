-- Kleine Hilfsfunktionen zum Bauen von Teilen per Skript.
local Build = {}

local DEG = math.rad

-- Erstellt ein verankertes Teil. props: zusätzliche Eigenschaften (Name = Wert)
function Build.part(parent, name, size, cframe, color, material, props)
	local p = Instance.new("Part")
	p.Name = name
	p.Anchored = true
	p.Size = size
	p.CFrame = cframe
	p.Color = color
	p.Material = material or Enum.Material.SmoothPlastic
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	if props then
		for key, value in pairs(props) do
			p[key] = value
		end
	end
	p.Parent = parent
	return p
end

-- Senkrechter Zylinder: height = Höhe, diameter = Durchmesser, base = CFrame der Mitte
function Build.cylinder(parent, name, height, diameter, cframe, color, material, props)
	local p = Build.part(parent, name, Vector3.new(height, diameter, diameter),
		cframe * CFrame.Angles(0, 0, DEG(90)), color, material, props)
	p.Shape = Enum.PartType.Cylinder
	return p
end

-- Zylinder, dessen Achse nach vorne (Z) zeigt (z. B. Lautsprecher)
function Build.cylinderZ(parent, name, length, diameter, cframe, color, material, props)
	local p = Build.part(parent, name, Vector3.new(length, diameter, diameter),
		cframe * CFrame.Angles(0, DEG(90), 0), color, material, props)
	p.Shape = Enum.PartType.Cylinder
	return p
end

function Build.ball(parent, name, diameter, cframe, color, material, props)
	local p = Build.part(parent, name, Vector3.new(diameter, diameter, diameter), cframe, color, material, props)
	p.Shape = Enum.PartType.Ball
	return p
end

-- Ellipsoid über ein SpecialMesh (z. B. ein ovaler Kopf)
function Build.ellipsoid(parent, name, size, cframe, color, material, props)
	local p = Build.part(parent, name, size, cframe, color, material, props)
	local mesh = Instance.new("SpecialMesh")
	mesh.MeshType = Enum.MeshType.Sphere
	mesh.Parent = p
	return p
end

function Build.folder(parent, name)
	local f = Instance.new("Folder")
	f.Name = name
	f.Parent = parent
	return f
end

-- Text auf einer Fläche (SurfaceGui). face: Enum.NormalId
function Build.sign(part, face, text, textColor, options)
	options = options or {}
	local gui = Instance.new("SurfaceGui")
	gui.Name = "Sign"
	gui.Face = face
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = options.pixelsPerStud or 40
	gui.LightInfluence = options.lightInfluence or 0
	gui.Parent = part
	local label = Instance.new("TextLabel")
	label.Name = "Text"
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 1)
	label.Font = options.font or Enum.Font.GothamBlack
	label.TextScaled = true
	label.RichText = true
	label.Text = text
	label.TextColor3 = textColor
	label.Parent = gui
	local pad = Instance.new("UIPadding")
	pad.PaddingTop = UDim.new(0.12, 0)
	pad.PaddingBottom = UDim.new(0.12, 0)
	pad.PaddingLeft = UDim.new(0.04, 0)
	pad.PaddingRight = UDim.new(0.04, 0)
	pad.Parent = label
	return gui, label
end

function Build.light(part, kind, color, brightness, range, props)
	local light = Instance.new(kind)
	light.Color = color
	light.Brightness = brightness
	light.Range = range
	if props then
		for key, value in pairs(props) do
			light[key] = value
		end
	end
	light.Parent = part
	return light
end

-- Ein Model mit unsichtbarem Fuß-Teil "Root" als PrimaryPart
function Build.model(parent, name)
	local model = Instance.new("Model")
	model.Name = name
	local root = Build.part(model, "Root", Vector3.new(2, 0.2, 2), CFrame.new(0, 0, 0), Color3.new(0, 0, 0), nil,
		{ Transparency = 1, CanCollide = false, CanQuery = false, CanTouch = false })
	model.PrimaryPart = root
	model.Parent = parent
	return model
end

return Build
