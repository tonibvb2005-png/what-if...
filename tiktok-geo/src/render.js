const { chromium } = require('playwright');
const { spawn } = require('child_process');
const http = require('http'), fs = require('fs'), path = require('path');
const mode = process.argv[2] || 'test';
const FPS = 30, DUR = 33;
const srv = http.createServer((q, r) => { const f = path.join(__dirname, decodeURIComponent(q.url.split('?')[0]).replace(/^\/$/, '/index.html')); fs.readFile(f, (e, d) => { if (e) { r.statusCode = 404; return r.end(); } r.end(d); }); }).listen(8765);
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('PAGE:', m.text())); p.on('pageerror', e => console.log('ERR:', e.message));
  await p.goto('http://localhost:8765/'); await p.evaluate(() => window.ready);
  if (mode === 'test') {
    const ts = process.argv.slice(3).map(Number);
    for (const t of ts) { await p.evaluate(t => render(t), t); await p.locator('canvas').screenshot({ path: `test_${t}.png` }); }
  } else {
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', 'out.mp4'], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = 0; i < FPS * DUR; i++) {
      const d = await p.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95); }, i / FPS);
      if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  await b.close(); srv.close();
})();
