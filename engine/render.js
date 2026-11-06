// Rendert eine Timeline Bild für Bild mit Chromium und schreibt das MP4.
// node engine/render.js timeline.json audio.wav out.mp4 [scale=2] [onlyFrame]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

(async () => {
  const [tlPath, wavPath, outPath, scaleArg, onlyT] = process.argv.slice(2);
  const tl = JSON.parse(fs.readFileSync(tlPath, 'utf8'));
  const scale = Number(scaleArg || 2);
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: scale });
  await page.goto('file://' + path.join(__dirname, 'render.html'));
  page.on('pageerror', (e) => { console.error('PAGE ERROR', e); process.exit(1); });
  page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
  await page.evaluate(([t, s]) => window.setup(t, s), [tl, scale]);
  await page.evaluate(() => document.fonts.ready);

  if (onlyT !== undefined) {          // Einzelbilder zur Kontrolle
    for (const t of onlyT.split(',')) {
      await page.evaluate((x) => window.renderFrame(x), Number(t));
      await page.screenshot({ path: outPath.replace('.png', `_${t}.png`) });
    }
    await browser.close(); return;
  }

  const fps = tl.fps, total = Math.ceil(tl.duration * fps);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-',
    '-i', wavPath, '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', outPath], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let f = 0; f < total; f++) {
    await page.evaluate((x) => window.renderFrame(x), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f % 150 === 0) process.stderr.write(`frame ${f}/${total}\n`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await browser.close();
})();
