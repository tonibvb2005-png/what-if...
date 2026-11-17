-- Benutzeroberfläche im Stil der TikTok-Videos (rote Kopfzeile, Uhr, Untertitel, Regel-Karte, Roulette)
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

local UI = {}

local RED = Color3.fromRGB(216, 32, 42)
local RED_TEXT = Color3.fromRGB(255, 43, 43)
local DARK = Color3.fromRGB(14, 14, 18)
local PANEL = Color3.fromRGB(22, 23, 29)
local WHITE = Color3.fromRGB(255, 255, 255)
local GOLD = Color3.fromRGB(233, 185, 73)
local YELLOW = Color3.fromRGB(245, 197, 24)

local HEAD_FONT = Enum.Font.GothamBlack
local BODY_FONT = Enum.Font.GothamMedium
local SUB_FONT = Enum.Font.Oswald

local gui, refs = nil, {}
local config, callbacks = nil, {}

-- ===================================================================== BAUSTEINE
local function new(className, props, children)
	local inst = Instance.new(className)
	for key, value in pairs(props or {}) do
		if key ~= "Parent" then
			inst[key] = value
		end
	end
	for _, child in ipairs(children or {}) do
		child.Parent = inst
	end
	if props and props.Parent then
		inst.Parent = props.Parent
	end
	return inst
end

local function corner(radius)
	return new("UICorner", { CornerRadius = radius or UDim.new(0, 12) })
end

local function stroke(color, thickness)
	return new("UIStroke", { Color = color, Thickness = thickness or 2, ApplyStrokeMode = Enum.ApplyStrokeMode.Border })
end

local function maxText(size)
	return new("UITextSizeConstraint", { MaxTextSize = size, MinTextSize = 8 })
end

local function label(props)
	local defaults = {
		BackgroundTransparency = 1,
		TextColor3 = WHITE,
		Font = BODY_FONT,
		TextScaled = true,
		RichText = true,
	}
	for k, v in pairs(props) do
		defaults[k] = v
	end
	return new("TextLabel", defaults)
end

local function button(parent, text, position, size, color)
	local b = new("TextButton", {
		Parent = parent,
		Text = text,
		Font = HEAD_FONT,
		TextScaled = true,
		TextColor3 = WHITE,
		BackgroundColor3 = color or RED,
		AutoButtonColor = true,
		Position = position,
		Size = size,
		AnchorPoint = Vector2.new(0.5, 0.5),
	}, { corner(UDim.new(0.5, 0)), maxText(26), new("UIPadding", { PaddingTop = UDim.new(0.22, 0), PaddingBottom = UDim.new(0.22, 0) }) })
	return b
end

local function hexOf(color)
	return string.format("#%02X%02X%02X", math.floor(color.R * 255), math.floor(color.G * 255), math.floor(color.B * 255))
end
UI.hex = hexOf

local function tween(inst, time, goal, style)
	local t = TweenService:Create(inst, TweenInfo.new(time, style or Enum.EasingStyle.Quad, Enum.EasingDirection.Out), goal)
	t:Play()
	return t
end

-- ===================================================================== AUFBAU
function UI.build(cfg, cbs)
	config, callbacks = cfg, cbs
	local playerGui = Players.LocalPlayer:WaitForChild("PlayerGui")
	gui = new("ScreenGui", {
		Name = "HorrorRouletteUI",
		ResetOnSpawn = false,
		IgnoreGuiInset = true,
		ZIndexBehavior = Enum.ZIndexBehavior.Sibling,
		DisplayOrder = 5,
		Parent = playerGui,
	})
	refs.gui = gui

	-- Kopfzeile: rote Pille + Uhr (wie in den Videos)
	local header = new("Frame", { Parent = gui, Name = "Header", BackgroundTransparency = 1, Size = UDim2.fromScale(1, 0.12), Position = UDim2.fromScale(0, 0.015) })
	refs.headerPill = new("TextLabel", {
		Parent = header, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.05), Size = UDim2.fromScale(0.34, 0.32),
		BackgroundColor3 = RED, Text = "HORROR ROULETTE  •  LOBBY", Font = HEAD_FONT, TextColor3 = WHITE, TextScaled = true,
	}, { corner(UDim.new(0.5, 0)), maxText(20), new("UIPadding", { PaddingTop = UDim.new(0.18, 0), PaddingBottom = UDim.new(0.18, 0) }),
		new("UISizeConstraint", { MinSize = Vector2.new(240, 26) }) })
	refs.clockPill = new("TextLabel", {
		Parent = header, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.43), Size = UDim2.fromScale(0.1, 0.27),
		BackgroundColor3 = DARK, BackgroundTransparency = 0.1, Text = "<font color=\"#FF3030\">●</font> 00:00", Font = HEAD_FONT,
		TextColor3 = WHITE, TextScaled = true, RichText = true, Visible = false,
	}, { corner(UDim.new(0.5, 0)), maxText(18), new("UIPadding", { PaddingTop = UDim.new(0.16, 0), PaddingBottom = UDim.new(0.16, 0) }),
		new("UISizeConstraint", { MinSize = Vector2.new(96, 22) }) })

	-- Status unten (Lobby)
	refs.status = label({
		Parent = gui, AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.95), Size = UDim2.fromScale(0.6, 0.06),
		Text = "", Font = HEAD_FONT, TextColor3 = WHITE,
	})
	maxText(30).Parent = refs.status
	new("UIStroke", { Parent = refs.status, Thickness = 2, Transparency = 0.4 })

	-- Lobby-Seitenleiste: Profil, Akte, Einstellungen
	local side = new("Frame", { Parent = gui, Name = "Side", BackgroundTransparency = 1, Position = UDim2.fromScale(0.015, 0.3), Size = UDim2.fromScale(0.16, 0.4) })
	refs.side = side
	refs.profile = label({ Parent = side, Size = UDim2.fromScale(1, 0.32), Text = "", TextXAlignment = Enum.TextXAlignment.Left, Font = HEAD_FONT })
	maxText(20).Parent = refs.profile
	local akteBtn = button(side, "AKTE", UDim2.fromScale(0.5, 0.5), UDim2.fromScale(0.9, 0.16), PANEL)
	stroke(Color3.fromRGB(90, 90, 100), 2).Parent = akteBtn
	akteBtn.Activated:Connect(function()
		UI.showAkte(true)
	end)
	local setBtn = button(side, "EINSTELLUNGEN", UDim2.fromScale(0.5, 0.72), UDim2.fromScale(0.9, 0.16), PANEL)
	stroke(Color3.fromRGB(90, 90, 100), 2).Parent = setBtn
	setBtn.Activated:Connect(function()
		UI.showSettings(true)
	end)

	-- Hinweis-Zähler (Nacht)
	refs.hints = new("TextLabel", {
		Parent = gui, Position = UDim2.fromScale(0.02, 0.13), Size = UDim2.fromScale(0.16, 0.06), BackgroundColor3 = DARK, BackgroundTransparency = 0.12,
		Text = "", Font = HEAD_FONT, TextScaled = true, TextColor3 = WHITE, RichText = true, Visible = false,
	}, { corner(), stroke(Color3.fromRGB(200, 200, 210), 1.5), maxText(20), new("UIPadding", { PaddingTop = UDim.new(0.2, 0), PaddingBottom = UDim.new(0.2, 0) }) })
	refs.controls = label({
		Parent = gui, AnchorPoint = Vector2.new(1, 1), Position = UDim2.fromScale(0.985, 0.985), Size = UDim2.fromScale(0.3, 0.035),
		Text = "SHIFT: rennen  ·  E: benutzen", TextColor3 = Color3.fromRGB(200, 200, 210), Font = BODY_FONT, TextXAlignment = Enum.TextXAlignment.Right, Visible = false,
	})
	maxText(16).Parent = refs.controls

	-- Untertitel (Ansagen wie in den Videos)
	refs.subtitle = label({
		Parent = gui, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.78), Size = UDim2.fromScale(0.8, 0.08),
		Text = "", Font = SUB_FONT, TextColor3 = WHITE, TextTransparency = 1,
	})
	maxText(46).Parent = refs.subtitle
	refs.subtitleStroke = new("UIStroke", { Parent = refs.subtitle, Thickness = 3, Transparency = 1 })

	-- Regel-Karte
	refs.rule = new("Frame", {
		Parent = gui, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.13), Size = UDim2.fromScale(0.3, 0.13),
		BackgroundColor3 = Color3.fromRGB(247, 243, 234), Rotation = -3, Visible = false,
	}, { corner(UDim.new(0, 10)), stroke(Color3.fromRGB(22, 18, 15), 2), new("UISizeConstraint", { MinSize = Vector2.new(260, 90) }) })
	local ruleHead = new("Frame", { Parent = refs.rule, BackgroundColor3 = RED, Size = UDim2.fromScale(1, 0.36) }, { corner(UDim.new(0, 10)) })
	label({ Parent = ruleHead, Size = UDim2.fromScale(1, 1), Text = "REGEL #1", Font = SUB_FONT })
	refs.ruleText = label({ Parent = refs.rule, Position = UDim2.fromScale(0.05, 0.4), Size = UDim2.fromScale(0.9, 0.55), Text = "", Font = SUB_FONT, TextColor3 = Color3.fromRGB(22, 18, 15) })
	refs.ruleBy = label({ Parent = refs.rule, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 1.04), Size = UDim2.fromScale(1, 0.22), Text = "", TextColor3 = Color3.fromRGB(220, 220, 230) })

	-- Spieler-Bildschirm "geholt"
	refs.taken = label({
		Parent = gui, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.62), Size = UDim2.fromScale(0.7, 0.1),
		Text = "", Font = SUB_FONT, TextColor3 = RED_TEXT, Visible = false,
	})
	maxText(34).Parent = refs.taken

	-- Falscher Chat (Ersatz, falls der Roblox-Chat nicht verfügbar ist)
	refs.chatFeed = new("Frame", { Parent = gui, Position = UDim2.fromScale(0.02, 0.62), Size = UDim2.fromScale(0.34, 0.2), BackgroundTransparency = 1 },
		{ new("UIListLayout", { VerticalAlignment = Enum.VerticalAlignment.Bottom, Padding = UDim.new(0, 4) }) })

	UI.buildMenu()
	UI.buildNote()
	UI.buildAkte()
	UI.buildSettings()
	UI.buildResults()
	UI.buildRoulette()
	return gui
end

-- ===================================================================== HAUPTMENÜ
function UI.buildMenu()
	local menu = new("Frame", { Parent = gui, Name = "Menu", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(8, 8, 11), ZIndex = 20 },
		{ new("UIGradient", { Rotation = 90, Color = ColorSequence.new(Color3.fromRGB(40, 6, 8), Color3.fromRGB(8, 8, 11)) }) })
	refs.menu = menu
	label({
		Parent = menu, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.3), Size = UDim2.fromScale(0.8, 0.14), ZIndex = 21,
		Text = '<font color="#FFFFFF">Horror </font><font color="#E3262B">ROULETTE</font>', Font = HEAD_FONT,
	})
	label({
		Parent = menu, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.41), Size = UDim2.fromScale(0.6, 0.045), ZIndex = 21,
		Text = "Ein Monster ist ausgebrochen. Finde seine Regel. Überlebe bis 6 Uhr.", TextColor3 = Color3.fromRGB(205, 205, 215),
	})
	local play = button(menu, "SPIELEN", UDim2.fromScale(0.5, 0.56), UDim2.fromScale(0.24, 0.085), RED)
	play.ZIndex = 21
	play.Activated:Connect(function()
		UI.showMenu(false)
		callbacks.onPlay()
	end)
	local akte = button(menu, "EINDÄMMUNGSAKTE", UDim2.fromScale(0.5, 0.67), UDim2.fromScale(0.24, 0.07), PANEL)
	akte.ZIndex = 21
	akte.Activated:Connect(function()
		UI.showAkte(true)
	end)
	local settings = button(menu, "EINSTELLUNGEN", UDim2.fromScale(0.5, 0.76), UDim2.fromScale(0.24, 0.07), PANEL)
	settings.ZIndex = 21
	settings.Activated:Connect(function()
		UI.showSettings(true)
	end)
	for _, b in ipairs({ akte, settings }) do
		stroke(Color3.fromRGB(90, 90, 100), 2).Parent = b
	end
	label({
		Parent = menu, AnchorPoint = Vector2.new(0.5, 1), Position = UDim2.fromScale(0.5, 0.97), Size = UDim2.fromScale(0.5, 0.03), ZIndex = 21,
		Text = "Zur TikTok-Serie @interestingstuff", TextColor3 = Color3.fromRGB(150, 150, 160),
	})
end

function UI.showMenu(visible)
	refs.menu.Visible = visible
end

-- ===================================================================== ZETTEL
function UI.buildNote()
	local note = new("Frame", {
		Parent = gui, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.48), Size = UDim2.fromScale(0.3, 0.42),
		BackgroundColor3 = Color3.fromRGB(242, 234, 210), Rotation = 2, Visible = false, ZIndex = 12,
	}, { corner(UDim.new(0, 6)), new("UISizeConstraint", { MinSize = Vector2.new(260, 220) }), new("UIAspectRatioConstraint", { AspectRatio = 0.85 }) })
	refs.note = note
	refs.noteTitle = label({ Parent = note, Position = UDim2.fromScale(0.08, 0.05), Size = UDim2.fromScale(0.84, 0.12), Text = "", Font = SUB_FONT, TextColor3 = Color3.fromRGB(150, 30, 30), ZIndex = 13 })
	refs.noteText = label({
		Parent = note, Position = UDim2.fromScale(0.08, 0.2), Size = UDim2.fromScale(0.84, 0.62), Text = "", Font = Enum.Font.IndieFlower,
		TextColor3 = Color3.fromRGB(40, 32, 26), TextYAlignment = Enum.TextYAlignment.Top, ZIndex = 13,
	})
	maxText(34).Parent = refs.noteText
	local close = button(note, "WEGLEGEN", UDim2.fromScale(0.5, 0.9), UDim2.fromScale(0.5, 0.1), Color3.fromRGB(60, 50, 44))
	close.ZIndex = 13
	close.Activated:Connect(function()
		note.Visible = false
	end)
end

function UI.showNote(title, text)
	refs.noteTitle.Text = title
	refs.noteText.Text = text
	refs.note.Visible = true
	local token = {}
	refs.noteToken = token
	task.delay(9, function()
		if refs.noteToken == token then
			refs.note.Visible = false
		end
	end)
end

-- ===================================================================== AKTE
function UI.buildAkte()
	local panel = new("Frame", {
		Parent = gui, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0.72, 0.72),
		BackgroundColor3 = Color3.fromRGB(16, 17, 22), Visible = false, ZIndex = 30,
	}, { corner(UDim.new(0, 16)), stroke(Color3.fromRGB(70, 70, 80), 2) })
	refs.akte = panel
	label({ Parent = panel, Position = UDim2.fromScale(0.04, 0.03), Size = UDim2.fromScale(0.7, 0.09), Text = 'EINDÄMMUNGS<font color="#E3262B">AKTE</font>', Font = HEAD_FONT, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 31 })
	local close = button(panel, "X", UDim2.fromScale(0.95, 0.07), UDim2.fromScale(0.06, 0.08), RED)
	close.ZIndex = 31
	close.Activated:Connect(function()
		UI.showAkte(false)
	end)
	local grid = new("Frame", { Parent = panel, Position = UDim2.fromScale(0.04, 0.15), Size = UDim2.fromScale(0.92, 0.8), BackgroundTransparency = 1, ZIndex = 31 },
		{ new("UIGridLayout", { CellSize = UDim2.fromScale(0.31, 0.95), CellPadding = UDim2.fromScale(0.035, 0), HorizontalAlignment = Enum.HorizontalAlignment.Center }) })
	refs.akteCards = {}
	for _, m in ipairs(config.Monsters) do
		local card = new("Frame", { Parent = grid, BackgroundColor3 = PANEL, ZIndex = 32 }, { corner(), stroke(m.color, 2) })
		local name = label({ Parent = card, Position = UDim2.fromScale(0.06, 0.04), Size = UDim2.fromScale(0.88, 0.1), Text = m.name, Font = HEAD_FONT, ZIndex = 33 })
		local status = label({ Parent = card, Position = UDim2.fromScale(0.06, 0.15), Size = UDim2.fromScale(0.88, 0.06), Text = "", TextColor3 = GOLD, ZIndex = 33 })
		local body = label({
			Parent = card, Position = UDim2.fromScale(0.06, 0.24), Size = UDim2.fromScale(0.88, 0.7), Text = "", TextColor3 = Color3.fromRGB(215, 215, 222),
			TextYAlignment = Enum.TextYAlignment.Top, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 33,
		})
		maxText(18).Parent = body
		refs.akteCards[m.id] = { name = name, status = status, body = body, def = m }
	end
end

function UI.updateAkte(akte)
	for id, card in pairs(refs.akteCards) do
		local def = card.def
		if akte and akte[id] then
			card.name.Text = def.name
			card.status.Text = "ÜBERLEBT ✓"
			card.body.Text = string.format('<b>Regel:</b> %s\n\n<b>Herkunft:</b> %s\n\n%s', def.ruleLong, def.origin, def.story)
		else
			card.name.Text = "???"
			card.status.Text = "NOCH NICHT ÜBERLEBT"
			card.body.Text = "Überlebe eine Nacht mit diesem Monster, um seine Akte freizuschalten."
		end
	end
end

function UI.showAkte(visible)
	refs.akte.Visible = visible
	if visible then
		refs.settings.Visible = false
	end
end

-- ===================================================================== EINSTELLUNGEN
function UI.buildSettings()
	local panel = new("Frame", {
		Parent = gui, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.5), Size = UDim2.fromScale(0.36, 0.42),
		BackgroundColor3 = Color3.fromRGB(16, 17, 22), Visible = false, ZIndex = 30,
	}, { corner(UDim.new(0, 16)), stroke(Color3.fromRGB(70, 70, 80), 2), new("UISizeConstraint", { MinSize = Vector2.new(280, 220) }) })
	refs.settings = panel
	label({ Parent = panel, Position = UDim2.fromScale(0.06, 0.05), Size = UDim2.fromScale(0.7, 0.14), Text = "EINSTELLUNGEN", Font = HEAD_FONT, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 31 })
	local close = button(panel, "X", UDim2.fromScale(0.9, 0.12), UDim2.fromScale(0.12, 0.13), RED)
	close.ZIndex = 31
	close.Activated:Connect(function()
		UI.showSettings(false)
	end)
	refs.settingButtons = {}
	local function toggle(key, text, y)
		label({ Parent = panel, Position = UDim2.fromScale(0.06, y), Size = UDim2.fromScale(0.55, 0.12), Text = text, TextXAlignment = Enum.TextXAlignment.Left, ZIndex = 31 })
		local b = button(panel, "AN", UDim2.fromScale(0.8, y + 0.06), UDim2.fromScale(0.26, 0.13), Color3.fromRGB(40, 120, 70))
		b.ZIndex = 31
		b.Activated:Connect(function()
			callbacks.onToggleSetting(key)
		end)
		refs.settingButtons[key] = b
	end
	toggle("sound", "Sound", 0.3)
	toggle("shake", "Kamerawackeln", 0.52)
	label({ Parent = panel, Position = UDim2.fromScale(0.06, 0.78), Size = UDim2.fromScale(0.88, 0.14), Text = "Einstellungen werden gespeichert.", TextColor3 = Color3.fromRGB(150, 150, 160), ZIndex = 31 })
end

function UI.updateSettings(settings)
	for key, b in pairs(refs.settingButtons) do
		local on = settings[key] ~= false
		b.Text = on and "AN" or "AUS"
		b.BackgroundColor3 = on and Color3.fromRGB(40, 120, 70) or Color3.fromRGB(110, 40, 40)
	end
end

function UI.showSettings(visible)
	refs.settings.Visible = visible
	if visible then
		refs.akte.Visible = false
	end
end

-- ===================================================================== ERGEBNIS
function UI.buildResults()
	local panel = new("Frame", { Parent = gui, Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(8, 8, 11), BackgroundTransparency = 0.25, Visible = false, ZIndex = 25 })
	refs.results = panel
	refs.resTitle = label({ Parent = panel, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.36), Size = UDim2.fromScale(0.8, 0.14), Text = "", Font = SUB_FONT, ZIndex = 26 })
	refs.resBody = label({ Parent = panel, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.52), Size = UDim2.fromScale(0.6, 0.14), Text = "", TextColor3 = Color3.fromRGB(220, 220, 228), ZIndex = 26 })
	maxText(28).Parent = refs.resBody
	refs.resFoot = label({ Parent = panel, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.68), Size = UDim2.fromScale(0.5, 0.045), Text = "Zurück in die Lobby …", TextColor3 = Color3.fromRGB(160, 160, 170), ZIndex = 26 })
end

function UI.showResults(data, def)
	local p = refs.results
	if data.survived then
		refs.resTitle.Text = '<font color="#FFFFFF">DU HAST </font><font color="#FF2B2B">ÜBERLEBT</font>'
	else
		refs.resTitle.Text = '<font color="#FF2B2B">GEHOLT</font>'
	end
	local lines = { string.format("Monster: <b>%s</b>", def and def.name or "?"), string.format("+%d Münzen", data.coins or 0) }
	if data.newEntry then
		table.insert(lines, '<font color="#E9B949">Neuer Eintrag in deiner Eindämmungsakte!</font>')
	end
	if not data.ruleRevealed and def then
		table.insert(lines, "Die Regel war: " .. def.rule)
	end
	refs.resBody.Text = table.concat(lines, "\n")
	p.Visible = true
	task.delay(config.ResultsSeconds - 0.3, function()
		p.Visible = false
	end)
end

-- ===================================================================== KOPFZEILE & STATUS
function UI.setHeader(text)
	refs.headerPill.Text = text
end

function UI.setClock(visible, text)
	refs.clockPill.Visible = visible
	if text then
		refs.clockPill.Text = '<font color="#FF3030">●</font> ' .. text
	end
end

function UI.setStatus(text)
	refs.status.Text = text or ""
end

function UI.setLobbyMode(inLobby)
	refs.side.Visible = inLobby
end

function UI.setNightHud(visible, found, total)
	refs.hints.Visible = visible
	refs.controls.Visible = visible
	if found then
		refs.hints.Text = string.format('HINWEISE <font color="#E9B949">%d/%d</font>', found, total)
	end
end

function UI.setProfile(profile)
	refs.profile.Text = string.format('<font color="#E9B949">%s</font>\n%d Münzen\n%d Nächte überlebt', profile.rank, profile.coins, profile.nights)
end

function UI.setTaken(visible)
	refs.taken.Visible = visible
	refs.taken.Text = "DU WURDEST GEHOLT.\nDu stehst jetzt draußen vor dem Fenster – und siehst zu."
end

-- Untertitel. kind: title | info | warn | danger
function UI.subtitle(text, kind)
	local color = WHITE
	if kind == "danger" then
		color = RED_TEXT
	elseif kind == "warn" then
		color = Color3.fromRGB(255, 200, 90)
	end
	local sub = refs.subtitle
	sub.Text = string.upper(text)
	sub.TextColor3 = color
	sub.Size = kind == "title" and UDim2.fromScale(0.86, 0.11) or UDim2.fromScale(0.8, 0.07)
	sub.TextTransparency = 0
	refs.subtitleStroke.Transparency = 0.2
	sub.Position = UDim2.fromScale(0.5, 0.8)
	tween(sub, 0.25, { Position = UDim2.fromScale(0.5, 0.78) }, Enum.EasingStyle.Back)
	local token = {}
	refs.subToken = token
	task.delay(kind == "title" and 4 or 3.4, function()
		if refs.subToken == token then
			tween(sub, 0.5, { TextTransparency = 1 })
			tween(refs.subtitleStroke, 0.5, { Transparency = 1 })
		end
	end)
end

function UI.showRule(def, byName)
	local card = refs.rule
	refs.ruleText.Text = def.rule
	refs.ruleBy.Text = byName and ("erkannt von " .. byName) or ""
	card.Visible = true
	card.Size = UDim2.fromScale(0.05, 0.02)
	tween(card, 0.45, { Size = UDim2.fromScale(0.3, 0.13) }, Enum.EasingStyle.Back)
end

function UI.hideRule()
	refs.rule.Visible = false
end

function UI.fakeChatFallback(speaker, text)
	local line = label({
		Parent = refs.chatFeed, Size = UDim2.new(1, 0, 0, 22), TextScaled = false, TextSize = 18, Font = BODY_FONT,
		TextXAlignment = Enum.TextXAlignment.Left, Text = string.format('<font color="#9FD4FF"><b>%s:</b></font> %s', speaker, text),
	})
	task.delay(8, function()
		line:Destroy()
	end)
end

-- ===================================================================== ROULETTE
function UI.buildRoulette()
	local overlay = new("Frame", { Parent = gui, Name = "Roulette", Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(10, 10, 14), BackgroundTransparency = 0.08, Visible = false, ZIndex = 40 })
	refs.roulette = overlay
	label({ Parent = overlay, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.17), Size = UDim2.fromScale(0.6, 0.1), ZIndex = 41,
		Text = '<font color="#FFFFFF">Horror </font><font color="#E3262B">ROULETTE</font>', Font = HEAD_FONT })
	refs.rouletteSub = label({ Parent = overlay, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.26), Size = UDim2.fromScale(0.6, 0.045), ZIndex = 41,
		Text = "Eines dieser Monster ist ausgebrochen …", TextColor3 = Color3.fromRGB(210, 210, 220) })
	local band = new("Frame", { Parent = overlay, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.52), Size = UDim2.fromScale(1, 0.34), BackgroundColor3 = Color3.fromRGB(18, 19, 24), ClipsDescendants = true, ZIndex = 41 })
	refs.band = band
	-- Gefahrenstreifen unter dem Band
	local stripe = new("Frame", { Parent = overlay, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.7), Size = UDim2.fromScale(1, 0.025), BackgroundColor3 = Color3.fromRGB(232, 185, 35), ZIndex = 41 })
	new("UIGradient", { Parent = stripe, Color = ColorSequence.new({
		ColorSequenceKeypoint.new(0, Color3.fromRGB(232, 185, 35)), ColorSequenceKeypoint.new(0.5, Color3.fromRGB(232, 185, 35)),
		ColorSequenceKeypoint.new(0.501, Color3.fromRGB(17, 17, 17)), ColorSequenceKeypoint.new(1, Color3.fromRGB(17, 17, 17)) }) })
	-- Gelbe Zeigerlinie
	refs.pointer = new("Frame", { Parent = overlay, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.52), Size = UDim2.new(0, 5, 0.42, 0), BackgroundColor3 = YELLOW, BorderSizePixel = 0, ZIndex = 44 })
	for _, y in ipairs({ 0.29, 0.75 }) do
		new("Frame", { Parent = overlay, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, y), Size = UDim2.new(0, 22, 0, 22), Rotation = 45, BackgroundColor3 = YELLOW, BorderSizePixel = 0, ZIndex = 44 })
	end
	refs.rouletteResult = label({ Parent = overlay, AnchorPoint = Vector2.new(0.5, 0.5), Position = UDim2.fromScale(0.5, 0.84), Size = UDim2.fromScale(0.7, 0.08), Text = "", Font = SUB_FONT, ZIndex = 45 })
	refs.rouletteFlash = new("Frame", { Parent = overlay, Size = UDim2.fromScale(1, 1), BackgroundColor3 = Color3.fromRGB(255, 20, 20), BackgroundTransparency = 1, ZIndex = 46 })
end

local CARD_W = 0.24
local CYCLES = 7

-- Spielt die Roulette-Animation; onTick() wird bei jedem vorbeilaufenden Feld aufgerufen
function UI.playRoulette(index, duration, onTick, onLock)
	local overlay, band = refs.roulette, refs.band
	band:ClearAllChildren()
	refs.rouletteResult.Text = ""
	refs.rouletteFlash.BackgroundTransparency = 1
	overlay.Visible = true
	local monsters = config.Monsters
	local n = #monsters
	local total = n * (CYCLES + 2)
	local cards = {}
	for i = 1, total do
		local def = monsters[((i - 1) % n) + 1]
		local card = new("Frame", { Parent = band, AnchorPoint = Vector2.new(0.5, 0.5), Size = UDim2.fromScale(CARD_W * 0.88, 0.86), BackgroundColor3 = Color3.fromRGB(28, 30, 37), ZIndex = 42 },
			{ corner(UDim.new(0, 14)), stroke(def.color, 3) })
		new("Frame", { Parent = card, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.08), Size = UDim2.fromScale(0.3, 0.5), BackgroundColor3 = def.color, ZIndex = 43 },
			{ corner(UDim.new(0.5, 0)), new("UIAspectRatioConstraint", { AspectRatio = 1 }) })
		label({ Parent = card, AnchorPoint = Vector2.new(0.5, 0), Position = UDim2.fromScale(0.5, 0.66), Size = UDim2.fromScale(0.9, 0.2), Text = def.name, Font = HEAD_FONT, ZIndex = 43 })
		cards[i] = card
	end
	-- Ziel: das passende Feld im vorletzten Durchlauf
	local targetSlot = n * CYCLES + index
	local spinTime = math.max(2, duration - 1.6)
	local start = os.clock()
	local lastSlot = 0
	local locked = false
	local conn
	conn = RunService.RenderStepped:Connect(function()
		local t = math.clamp((os.clock() - start) / spinTime, 0, 1)
		local eased = 1 - (1 - t) ^ 4
		local pos = 1 + (targetSlot - 1) * eased
		for i, card in ipairs(cards) do
			card.Position = UDim2.fromScale(0.5 + (i - pos) * CARD_W, 0.5)
		end
		local slot = math.floor(pos + 0.5)
		if slot ~= lastSlot then
			lastSlot = slot
			if onTick then
				onTick()
			end
		end
		if t >= 1 and not locked then
			locked = true
			conn:Disconnect()
			local def = monsters[index]
			local card = cards[targetSlot]
			tween(card, 0.3, { Size = UDim2.fromScale(CARD_W * 1.02, 0.96) }, Enum.EasingStyle.Back)
			local st = card:FindFirstChildOfClass("UIStroke")
			if st then
				st.Color = Color3.fromRGB(255, 40, 40)
				st.Thickness = 5
			end
			refs.rouletteFlash.BackgroundTransparency = 0.55
			tween(refs.rouletteFlash, 0.8, { BackgroundTransparency = 1 })
			refs.rouletteResult.Text = string.format('<font color="#FF2B2B">%s</font> IST AUSGEBROCHEN', def.name)
			if onLock then
				onLock(def)
			end
		end
	end)
	task.delay(duration, function()
		if conn.Connected then
			conn:Disconnect()
		end
		overlay.Visible = false
	end)
end

return UI
