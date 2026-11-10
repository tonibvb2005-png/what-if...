// Render channel branding: node brand.cjs  -> out/brand/*.png  (needs http.server on 8765)
const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log(m.text()); });
  await p.goto('http://localhost:8765/brand.html'); await p.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
  const out = await p.evaluate(() => window.OUT); fs.mkdirSync('out/brand', { recursive: true });
  for (const [k, v] of Object.entries(out)) { fs.writeFileSync(`out/brand/${k}.png`, Buffer.from(v.split(',')[1], 'base64')); console.log('wrote', k); }
  await b.close();
})();
