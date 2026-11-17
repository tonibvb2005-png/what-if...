local fs = require("@lune/fs")
local luau = require("@lune/luau")
local count, failed = 0, 0
local function walk(dir)
	for _, name in fs.readDir(dir) do
		local path = dir .. "/" .. name
		if fs.isDir(path) then
			walk(path)
		elseif string.sub(name, -4) == ".lua" then
			count += 1
			local ok, err = pcall(luau.compile, fs.readFile(path))
			if not ok then
				failed += 1
				print("FEHLER", path, err)
			end
		end
	end
end
walk("src")
print(`{count} Dateien geprüft, {failed} Fehler`)
