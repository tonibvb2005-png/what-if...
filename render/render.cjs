// node render.cjs out/video_noaudio.mp4 [scale] [voice.json]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
(async () => {
  const [out, scale = '1', voice, f0 = '0', f1 = '1e9'] = process.argv.slice(2);
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const p = await b.newPage();
  p.on('pageerror', (e) => console.log('ERR', e.message));
  await p.goto(`http://localhost:8765/index.html?scale=${scale}${voice && voice !== '-' ? '&voice=' + voice : ''}`);
  await p.waitForFunction(() => document.title === 'ready', null, { timeout: 180000 });
  const meta = await p.evaluate(() => ({ timeline: window.TIMELINE, shots: window.SHOTS, duration: window.DURATION }));
  fs.writeFileSync('out/timeline.json', JSON.stringify(meta, null, 1));
  const fps = 30, n = Math.ceil(meta.duration * fps);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = +f0; i < Math.min(n, +f1); i++) {
    const url = await p.evaluate((t) => window.renderAt(t), i / fps);
    const buf = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64');
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on('close', r));
  await b.close();
  console.log('done', out);
})();
