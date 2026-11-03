#!/usr/bin/env node
// Render a video spec (JSON) to a vertical 1080x1920 MP4.
//   node engine/render.js videos/01-ballon-dor.json [output.mp4] [--stills 1,3.5,8] [--fps 30]
// Scenes may reference "audio": "path.mp3" (relative to the spec). If the file exists, the
// scene lasts as long as the audio (+ pad) and the audio is mixed into the final video.
const { chromium } = require('playwright');
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); if (i < 0) return def; const v = args[i + 1]; args.splice(i, 2); return v; };
const stills = opt('--stills', null);
const audioOnly = args.includes('--audio-only'); if (audioOnly) args.splice(args.indexOf('--audio-only'), 1);
const FPS = parseInt(opt('--fps', '30'), 10);
const specPath = path.resolve(args[0]);
const base = path.dirname(specPath);
const name = path.basename(specPath, '.json');
const out = path.resolve(args[1] || path.join(__dirname, '..', 'output', name + '.mp4'));

const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
spec.assetBase = 'file://' + base + '/';

const probe = f => parseFloat(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString());
const audio = [];
for (const s of spec.scenes) {
  if (!s.audio) continue;
  const f = path.resolve(base, s.audio);
  if (fs.existsSync(f)) { s.duration = Math.max(s.duration || 0, probe(f) + (s.pad != null ? s.pad : 0.35)); s._audioFile = f; }
  else console.warn(`[warn] audio missing, using estimated timing: ${s.audio}`);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('[page]', e.message));
  await page.goto('file://' + (spec.page ? path.join(__dirname, '..', spec.page) : path.join(__dirname, 'engine.html')));
  const plain = JSON.parse(JSON.stringify(spec, (k, v) => (k === '_audioFile' ? undefined : v)));
  const total = await page.evaluate(sp => window.setup(sp), plain);
  const starts = await page.evaluate(() => window.sceneStarts);

  if (stills) {
    fs.mkdirSync(path.dirname(out), { recursive: true });
    for (const t of stills.split(',').map(Number)) {
      await page.evaluate(t => window.frame(t), t);
      const f = out.replace(/\.mp4$/, `-${t}s.png`);
      await page.screenshot({ path: f });
      console.log(f);
    }
    await browser.close();
    return;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const sfxEvents = (await page.evaluate(() => window.sfxEvents)) || [];
  // the silent picture track is kept next to the output so audio can be re-mixed quickly (--audio-only)
  const silent = out.replace(/\.mp4$/, '.silent.mp4');
  const t0 = Date.now();
  if (!(audioOnly && fs.existsSync(silent))) {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
      '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
    const frames = Math.ceil(total * FPS);
    for (let i = 0; i < frames; i++) {
      await page.evaluate(t => window.frame(t), i / FPS);
      const buf = await page.screenshot({ type: 'jpeg', quality: 93 });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 150 === 0) process.stdout.write(`\r${name}: frame ${i}/${frames} (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', r));
  }
  await browser.close();

  // ---- audio: voice (per scene) + sound effects, effects ducked under the voice ----
  const voice = spec.scenes.map((s, i) => ({ f: s._audioFile, at: starts[i] })).filter(x => x.f);
  const sfxDir = spec.sfx ? path.join(__dirname, '..', spec.sfx) : null;
  const sfx = sfxDir ? sfxEvents.filter(e => fs.existsSync(path.join(sfxDir, e.name + '.wav'))) : [];
  const inputs = [], chains = [];
  const ms = t => Math.max(0, Math.round(t * 1000));
  voice.forEach(v => { inputs.push('-i', v.f); chains.push({ kind: 'v', idx: inputs.length / 2, at: v.at }); });
  sfx.forEach(e => { inputs.push('-i', path.join(sfxDir, e.name + '.wav')); chains.push({ kind: 's', idx: inputs.length / 2, at: e.t, db: e.db }); });
  if (chains.length) {
    const parts = [];
    const vs = chains.filter(c => c.kind === 'v'), ss = chains.filter(c => c.kind === 's');
    vs.forEach((c, i) => parts.push(`[${c.idx}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${ms(c.at)}:all=1[v${i}]`));
    ss.forEach((c, i) => parts.push(`[${c.idx}:a]aresample=44100,aformat=channel_layouts=stereo,volume=${c.db}dB,adelay=${ms(c.at)}:all=1[s${i}]`));
    if (vs.length) parts.push(vs.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${vs.length}:normalize=0:duration=longest[vo]`);
    if (ss.length) parts.push(ss.map((_, i) => `[s${i}]`).join('') + `amix=inputs=${ss.length}:normalize=0:duration=longest[fx]`);
    if (vs.length && ss.length) {
      parts.push('[vo]asplit=2[va][vb]');
      parts.push('[fx][vb]sidechaincompress=threshold=0.015:ratio=8:attack=15:release=350[fxd]');
      parts.push('[va][fxd]amix=inputs=2:normalize=0:duration=longest,loudnorm=I=-14:TP=-1.5:LRA=11,aresample=44100,apad[aout]');
    } else {
      parts.push(`[${vs.length ? 'vo' : 'fx'}]alimiter=limit=0.95,apad[aout]`);
    }
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', silent, ...inputs, '-filter_complex', parts.join(';'), '-map', '0:v', '-map', '[aout]',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', total.toFixed(3), '-movflags', '+faststart', out]);
  } else {
    fs.copyFileSync(silent, out);
  }
  console.log(`\r${name}: done -> ${out} (${total.toFixed(1)}s, ${((Date.now() - t0) / 1000).toFixed(0)}s render)`);
})().catch(e => { console.error(e); process.exit(1); });
