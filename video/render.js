// node render.js [--from s] [--to s] [--fps 30] [--out build/video.mp4] [--stills t1,t2,...]
const http = require('http'), fs = require('fs'), path = require('path'), { spawn } = require('child_process');
const { chromium } = require('playwright');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const root = __dirname;
const mime = { '.js': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.woff2': 'font/woff2' };
const srv = http.createServer((q, r) => { const p = path.join(root, decodeURIComponent(q.url.split('?')[0])); fs.readFile(p, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': mime[path.extname(p)] || 'application/octet-stream' }); r.end(d); }); });
srv.listen(0, async () => {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const pg = await b.newPage({ viewport: { width: 540, height: 960 } });
  pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  await pg.goto(`http://localhost:${srv.address().port}/index.html`);
  await pg.waitForFunction('window.done', null, { timeout: 180000 });
  const total = await pg.evaluate('TL.total');
  const stills = arg('stills');
  if (stills) {
    fs.mkdirSync(path.join(root, 'build/stills'), { recursive: true });
    for (const t of stills.split(',').map(Number)) { const d = await pg.evaluate(t => frame(t, 0.9), t); fs.writeFileSync(path.join(root, `build/stills/${t.toFixed(2)}.jpg`), Buffer.from(d.split(',')[1], 'base64')); }
    await b.close(); srv.close(); return;
  }
  const fps = +arg('fps', 30), from = +arg('from', 0), to = Math.min(+arg('to', total), total), out = arg('out', 'build/video.mp4');
  const silent = out.replace('.mp4', '_silent.mp4');
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', path.join(root, silent)], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = Math.round((to - from) * fps), t0 = Date.now();
  for (let i = 0; i < N; i++) {
    const d = await pg.evaluate(t => frame(t), from + i / fps);
    if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 150 === 0) console.log(`frame ${i}/${N}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await b.close(); srv.close();
  const mux = spawn('ffmpeg', ['-v', 'error', '-y', '-i', path.join(root, silent), '-ss', String(from), '-t', String(to - from), '-i', path.join(root, 'build/audio.wav'), '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', path.join(root, out)], { stdio: 'inherit' });
  mux.on('close', c => console.log('fertig:', out, c));
});
