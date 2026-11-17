-- Test-Umgebung: lädt die Spiel-Module mit Lune und simuliert die nötigen Roblox-Globals.
local fs = require("@lune/fs")
local luau = require("@lune/luau")
local roblox = require("@lune/roblox")

local H = {}

-- Engine-Methoden nachbilden, die Lune nicht kennt
local function parts(model)
	local list = {}
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then table.insert(list, d) end
	end
	return list
end
local function pivotOf(model)
	return model.PrimaryPart and model.PrimaryPart.CFrame or roblox.CFrame.new()
end
roblox.implementMethod("Model", "GetPivot", function(model) return pivotOf(model) end)
roblox.implementMethod("Model", "PivotTo", function(model, target)
	local delta = target * pivotOf(model):Inverse()
	for _, p in parts(model) do p.CFrame = delta * p.CFrame end
end)
roblox.implementMethod("Model", "ScaleTo", function(model, s)
	local pivot = pivotOf(model)
	for _, p in parts(model) do
		local rel = pivot:ToObjectSpace(p.CFrame)
		local rot = rel - rel.Position
		p.CFrame = pivot * (roblox.CFrame.new(rel.Position * s) * rot)
		p.Size = p.Size * s
	end
end)
roblox.implementMethod("Model", "GetBoundingBox", function(model)
	local minV, maxV
	for _, p in parts(model) do
		if p.Transparency < 1 then
			local half = p.Size / 2
			for _, sx in { -1, 1 } do for _, sy in { -1, 1 } do for _, sz in { -1, 1 } do
				local w = p.CFrame * roblox.Vector3.new(half.X * sx, half.Y * sy, half.Z * sz)
				minV = minV and roblox.Vector3.new(math.min(minV.X, w.X), math.min(minV.Y, w.Y), math.min(minV.Z, w.Z)) or w
				maxV = maxV and roblox.Vector3.new(math.max(maxV.X, w.X), math.max(maxV.Y, w.Y), math.max(maxV.Z, w.Z)) or w
			end end end
		end
	end
	return roblox.CFrame.new((minV + maxV) / 2), maxV - minV
end)
local game = roblox.Instance.new("DataModel")
H.game = game
local workspace = game:GetService("Workspace")
local Lighting = game:GetService("Lighting")

local collection = {
	AddTag = function(_, inst, tag) inst:AddTag(tag) end,
	GetTagged = function() return {} end,
}
local fakeGame = setmetatable({}, {
	__index = function(_, key)
		if key == "GetService" then
			return function(_, name)
				if name == "CollectionService" then return collection end
				return game:GetService(name)
			end
		end
		return (game :: any)[key]
	end,
})

local RandomShim = {}
RandomShim.__index = RandomShim
function RandomShim.new(seed)
	math.randomseed(seed or 0)
	return setmetatable({}, RandomShim)
end
function RandomShim:NextNumber(a, b) return a + math.random() * (b - a) end
function RandomShim:NextInteger(a, b) return math.random(a, b) end

local loaded = {}
local function makeEnv(scriptObj)
	return {
		game = fakeGame, workspace = workspace, script = scriptObj,
		Instance = roblox.Instance, Vector3 = roblox.Vector3, CFrame = roblox.CFrame,
		Color3 = roblox.Color3, UDim2 = roblox.UDim2, UDim = roblox.UDim, Enum = roblox.Enum,
		Random = (roblox :: any).Random or RandomShim,
		require = function(target) return loaded[target.__name] end,
		print = print, warn = print, error = error, pcall = pcall, ipairs = ipairs, pairs = pairs,
		math = math, table = table, string = string, type = type, typeof = typeof, setmetatable = setmetatable,
		tostring = tostring, tonumber = tonumber, select = select, next = next, assert = assert,
	}
end

function H.load(name, path, siblings)
	local src = fs.readFile(path)
	local parent = {}
	for _, s in ipairs(siblings or {}) do parent[s] = { __name = s } end
	local fn = luau.load(src, { debugName = name, environment = makeEnv({ Parent = parent }) })
	loaded[name] = fn()
	return loaded[name]
end

return H
