-- Client-Effekte: Rennen, Alarmlichter, Flackern, Kamera-Sucher mit Rauschen, Jumpscare, Kamerawackeln
local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ContextActionService = game:GetService("ContextActionService")
local CollectionService = game:GetService("CollectionService")
local SoundService = game:GetService("SoundService")
local TweenService = game:GetService("TweenService")

local Effects = {}

local player = Players.LocalPlayer
local config
local settings = { sound = true, shake = true }
local gui
local viewfinder, noiseBars, recDot, timecode
local jumpLayer
local shakeUntil, shakeAmount = 0, 0
local staticSound

-- ===================================================================== TON
function Effects.play(key, volume)
	if not settings.sound then
		return
	end
	local id = config.Sounds[key]
	if not id or id == "" then
		return
	end
	local s = Instance.new("Sound")
	s.SoundId = id
	s.Volume = volume or 0.8
	s.Parent = SoundService
	s:Play()
	task.delay(10, function()
		s:Destroy()
	end)
end

function Effects.setSettings(newSettings)
	settings.sound = newSettings.sound ~= false
	settings.shake = newSettings.shake ~= false
end

-- ===================================================================== RENNEN
local function applySpeed(sprinting)
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.WalkSpeed = sprinting and config.SprintSpeed or config.WalkSpeed
	end
end

local function bindSprint()
	ContextActionService:BindAction("HR_Sprint", function(_, inputState)
		if inputState == Enum.UserInputState.Begin then
			applySpeed(true)
		elseif inputState == Enum.UserInputState.End or inputState == Enum.UserInputState.Cancel then
			applySpeed(false)
		end
		return Enum.ContextActionResult.Pass
	end, true, Enum.KeyCode.LeftShift, Enum.KeyCode.ButtonL3)
	ContextActionService:SetTitle("HR_Sprint", "Rennen")
	ContextActionService:SetPosition("HR_Sprint", UDim2.new(1, -170, 1, -170))
	player.CharacterAdded:Connect(function()
		task.wait(0.2)
		applySpeed(false)
	end)
	applySpeed(false)
end

-- ===================================================================== SUCHER (Kamera-Werkzeug)
local function buildViewfinder()
	viewfinder = Instance.new("Frame")
	viewfinder.Name = "Viewfinder"
	viewfinder.Size = UDim2.fromScale(1, 1)
	viewfinder.BackgroundTransparency = 1
	viewfinder.Visible = false
	viewfinder.ZIndex = 8
	viewfinder.Parent = gui
	local function cornerMark(ax, ay)
		local f = Instance.new("Frame")
		f.BackgroundTransparency = 1
		f.AnchorPoint = Vector2.new(ax, ay)
		f.Position = UDim2.fromScale(ax == 0 and 0.06 or 0.94, ay == 0 and 0.1 or 0.9)
		f.Size = UDim2.fromOffset(60, 60)
		f.ZIndex = 9
		f.Parent = viewfinder
		local h = Instance.new("Frame")
		h.BackgroundColor3 = Color3.new(1, 1, 1)
		h.BorderSizePixel = 0
		h.Size = UDim2.new(1, 0, 0, 5)
		h.Position = UDim2.fromScale(0, ay)
		h.AnchorPoint = Vector2.new(0, ay)
		h.ZIndex = 9
		h.Parent = f
		local v = h:Clone()
		v.Size = UDim2.new(0, 5, 1, 0)
		v.Position = UDim2.fromScale(ax, 0)
		v.AnchorPoint = Vector2.new(ax, 0)
		v.Parent = f
	end
	cornerMark(0, 0)
	cornerMark(1, 0)
	cornerMark(0, 1)
	cornerMark(1, 1)
	recDot = Instance.new("TextLabel")
	recDot.BackgroundTransparency = 1
	recDot.Position = UDim2.fromScale(0.08, 0.12)
	recDot.Size = UDim2.fromScale(0.12, 0.05)
	recDot.Font = Enum.Font.Code
	recDot.TextScaled = true
	recDot.RichText = true
	recDot.TextColor3 = Color3.new(1, 1, 1)
	recDot.TextXAlignment = Enum.TextXAlignment.Left
	recDot.Text = '<font color="#FF2A20">●</font> REC'
	recDot.ZIndex = 9
	recDot.Parent = viewfinder
	timecode = recDot:Clone()
	timecode.AnchorPoint = Vector2.new(1, 1)
	timecode.Position = UDim2.fromScale(0.92, 0.88)
	timecode.Size = UDim2.fromScale(0.2, 0.04)
	timecode.TextXAlignment = Enum.TextXAlignment.Right
	timecode.Text = "00:00:00:00"
	timecode.Parent = viewfinder
	noiseBars = {}
	for i = 1, 48 do
		local bar = Instance.new("Frame")
		bar.BorderSizePixel = 0
		bar.BackgroundColor3 = Color3.new(1, 1, 1)
		bar.BackgroundTransparency = 1
		bar.Size = UDim2.new(1.2, 0, 1 / 48, 1)
		bar.Position = UDim2.fromScale(-0.1, (i - 1) / 48)
		bar.ZIndex = 8
		bar.Parent = viewfinder
		noiseBars[i] = bar
	end
end

local function hasCamera()
	local character = player.Character
	return character ~= nil and character:FindFirstChild("Kamera") ~= nil
end

local function cameraOnlyModels()
	local list = {}
	local root = workspace:FindFirstChild("HorrorRoulette")
	local night = root and root:FindFirstChild("Night")
	if night then
		for _, model in ipairs(night:GetChildren()) do
			if model:GetAttribute("CameraOnly") then
				table.insert(list, model)
			end
		end
	end
	return list
end

-- ===================================================================== JUMPSCARE
local function box(parent, props)
	local f = Instance.new("Frame")
	f.BorderSizePixel = 0
	for k, v in pairs(props) do
		f[k] = v
	end
	f.Parent = parent
	return f
end

local function roundBox(parent, props, radius)
	local f = box(parent, props)
	local c = Instance.new("UICorner")
	c.CornerRadius = radius or UDim.new(0.5, 0)
	c.Parent = f
	return f
end

local function buildFace(monsterId)
	jumpLayer:ClearAllChildren()
	local face = box(jumpLayer, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(1, 1), BackgroundTransparency = 1, ZIndex = 61 })
	local aspect = Instance.new("UIAspectRatioConstraint")
	aspect.AspectRatio = 1
	aspect.Parent = face
	local z = 62
	if monsterId == "Hutfrau" then
		roundBox(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.62), Size = UDim2.fromScale(0.9, 0.9), BackgroundColor3 = Color3.fromRGB(10, 8, 10), ZIndex = z })
		roundBox(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.55), Size = UDim2.fromScale(0.46, 0.56), BackgroundColor3 = Color3.fromRGB(236, 226, 214), ZIndex = z + 1 })
		box(face, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.27), Size = UDim2.fromScale(0.5, 0.2), BackgroundColor3 = Color3.fromRGB(10, 8, 10), BackgroundTransparency = 0.15, ZIndex = z + 2 })
		roundBox(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.26), Size = UDim2.fromScale(1.05, 0.2), BackgroundColor3 = Color3.fromRGB(250, 248, 242), ZIndex = z + 3 })
		roundBox(face, { AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.25), Size = UDim2.fromScale(0.4, 0.2), BackgroundColor3 = Color3.fromRGB(250, 248, 242), ZIndex = z + 3 }, UDim.new(0.3, 0))
		for _, x in ipairs({ 0.41, 0.59 }) do
			roundBox(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(x, 0.43), Size = UDim2.fromScale(0.07, 0.07), BackgroundColor3 = Color3.fromRGB(255, 255, 255), ZIndex = z + 4 })
		end
		roundBox(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.66), Size = UDim2.fromScale(0.36, 0.05), BackgroundColor3 = Color3.fromRGB(70, 10, 14), ZIndex = z + 4 })
	elseif monsterId == "Schreier" then
		box(face, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.45), Size = UDim2.fromScale(0.06, 0.6), BackgroundColor3 = Color3.fromRGB(110, 104, 100), ZIndex = z })
		box(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.45), Size = UDim2.fromScale(1, 0.05), BackgroundColor3 = Color3.fromRGB(110, 104, 100), ZIndex = z })
		for _, x in ipairs({ 0.24, 0.76 }) do
			roundBox(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(x, 0.45), Size = UDim2.fromScale(0.46, 0.46), BackgroundColor3 = Color3.fromRGB(125, 118, 112), ZIndex = z + 1 })
			roundBox(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(x, 0.45), Size = UDim2.fromScale(0.34, 0.34), BackgroundColor3 = Color3.fromRGB(12, 10, 10), ZIndex = z + 2 })
			roundBox(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(x, 0.45), Size = UDim2.fromScale(0.1, 0.1), BackgroundColor3 = Color3.fromRGB(60, 10, 10), ZIndex = z + 3 })
		end
	else
		box(face, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.7), Size = UDim2.fromScale(0.9, 0.4), BackgroundColor3 = Color3.fromRGB(18, 18, 22), ZIndex = z })
		box(face, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.7), Size = UDim2.fromScale(0.1, 0.4), BackgroundColor3 = Color3.fromRGB(238, 238, 238), ZIndex = z + 1 })
		box(face, { AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.72), Size = UDim2.fromScale(0.035, 0.3), BackgroundColor3 = Color3.fromRGB(120, 14, 20), ZIndex = z + 2 })
		roundBox(face, { AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.4), Size = UDim2.fromScale(0.5, 0.66), BackgroundColor3 = Color3.fromRGB(240, 240, 240), ZIndex = z + 1 })
	end
end

function Effects.jumpscare(monsterId)
	buildFace(monsterId)
	jumpLayer.Visible = true
	jumpLayer.BackgroundTransparency = 0
	local face = jumpLayer:FindFirstChildWhichIsA("Frame")
	if face then
		face.Size = UDim2.fromScale(0.5, 0.5)
		TweenService:Create(face, TweenInfo.new(0.18, Enum.EasingStyle.Back, Enum.EasingDirection.Out), { Size = UDim2.fromScale(1.15, 1.15) }):Play()
	end
	Effects.play("Jumpscare", 1)
	Effects.shake(0.9, 0.6)
	task.delay(1.3, function()
		TweenService:Create(jumpLayer, TweenInfo.new(0.4), { BackgroundTransparency = 1 }):Play()
		task.wait(0.15)
		jumpLayer.Visible = false
	end)
end

function Effects.shake(seconds, amount)
	if not settings.shake then
		return
	end
	shakeUntil = os.clock() + seconds
	shakeAmount = amount
end

-- ===================================================================== START
function Effects.init(cfg, screenGui)
	config = cfg
	gui = screenGui
	buildViewfinder()
	jumpLayer = Instance.new("Frame")
	jumpLayer.Name = "Jumpscare"
	jumpLayer.Size = UDim2.fromScale(1, 1)
	jumpLayer.BackgroundColor3 = Color3.fromRGB(120, 0, 0)
	jumpLayer.Visible = false
	jumpLayer.ZIndex = 60
	jumpLayer.Parent = gui
	bindSprint()

	if config.Sounds.Static ~= "" then
		staticSound = Instance.new("Sound")
		staticSound.SoundId = config.Sounds.Static
		staticSound.Looped = true
		staticSound.Volume = 0
		staticSound.Parent = SoundService
		staticSound:Play()
	end

	-- Kamerawackeln nach der Kamera-Steuerung anwenden
	RunService:BindToRenderStep("HR_Shake", Enum.RenderPriority.Camera.Value + 1, function()
		local remaining = shakeUntil - os.clock()
		if remaining > 0 then
			local cam = workspace.CurrentCamera
			local a = shakeAmount * math.min(1, remaining * 2)
			cam.CFrame = cam.CFrame * CFrame.Angles(math.rad((math.random() - 0.5) * 4 * a), math.rad((math.random() - 0.5) * 4 * a), 0)
		end
	end)

	local clock = 0
	RunService.RenderStepped:Connect(function(dt)
		clock = clock + dt
		-- Alarmlichter in der Lobby drehen sich
		for _, part in ipairs(CollectionService:GetTagged("HR_Alarm")) do
			local base = part:GetAttribute("BasePos")
			if typeof(base) == "Vector3" then
				part.CFrame = CFrame.new(base) * CFrame.Angles(0, clock * 2.4 + base.X * 0.05, 0) * CFrame.Angles(math.rad(-50), 0, 0)
			end
		end
		-- Laternen und Kamin flackern
		for _, light in ipairs(CollectionService:GetTagged("HR_Flicker")) do
			local base = light:GetAttribute("BaseBrightness")
			if not base then
				base = light.Brightness
				light:SetAttribute("BaseBrightness", base)
			end
			light.Brightness = base * (0.82 + 0.18 * math.noise(clock * 3, base * 10))
		end
		-- Monster, die nur durch die Kamera sichtbar sind
		local camOn = hasCamera()
		local nearest = math.huge
		local myRoot = player.Character and player.Character:FindFirstChild("HumanoidRootPart")
		for _, model in ipairs(cameraOnlyModels()) do
			for _, d in ipairs(model:GetDescendants()) do
				if d:IsA("BasePart") and d.Name ~= "Root" then
					d.LocalTransparencyModifier = camOn and 0 or 1
				end
			end
			if myRoot then
				nearest = math.min(nearest, (model:GetPivot().Position - myRoot.Position).Magnitude)
			end
		end
		local intensity = math.clamp(1 - (nearest - 6) / 40, 0, 1)
		-- Sucher und Rauschen
		viewfinder.Visible = camOn
		if camOn then
			recDot.TextTransparency = (math.floor(clock * 1.6) % 2 == 0) and 0 or 0.6
			local s = math.floor(clock)
			timecode.Text = string.format("00:%02d:%02d:%02d", math.floor(s / 60) % 60, s % 60, math.floor((clock % 1) * 25))
			for _, bar in ipairs(noiseBars) do
				local v = math.random()
				bar.BackgroundColor3 = Color3.new(v, v, v)
				bar.BackgroundTransparency = 1 - intensity * (0.25 + 0.5 * math.random())
				bar.Position = UDim2.new(-0.1 + (math.random() - 0.5) * 0.06 * intensity, 0, bar.Position.Y.Scale, 0)
			end
		end
		if staticSound then
			staticSound.Volume = settings.sound and (intensity * 0.6) or 0
		end
	end)
end

return Effects
