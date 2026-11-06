// node preview.cjs out.png t1,t2,...  -> contact sheet of frames
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const [out, ts, scale = '0.5'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage();
  p.on('console', (m) => { if (m.type() === 'error' || m.text().startsWith('LOG')) console.log('console:', m.text()); });
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto(`http://localhost:8765/index.html?scale=${scale}`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 180000 });
  const times = ts === 'shots' ? await p.evaluate(() => null) : ts.split(',').map(Number);
  console.log('duration', await p.evaluate(() => window.DURATION));
  const urls = [];
  for (const t of times) { const t0 = Date.now(); urls.push(await p.evaluate((t) => window.renderAt(t), t)); console.log('t', t, Date.now() - t0, 'ms'); }
  // build sheet in page
  const sheet = await p.evaluate(async (urls) => {
    const cols = Math.min(6, urls.length), rows = Math.ceil(urls.length / cols), w = 270, h = 480;
    const c = document.createElement('canvas'); c.width = cols * w; c.height = rows * h; const x = c.getContext('2d');
    for (let i = 0; i < urls.length; i++) { const im = new Image(); im.src = urls[i]; await im.decode(); x.drawImage(im, (i % cols) * w, Math.floor(i / cols) * h, w, h); }
    return c.toDataURL('image/jpeg', 0.9);
  }, urls);
  fs.writeFileSync(out, Buffer.from(sheet.split(',')[1], 'base64'));
  await b.close();
})();
