import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildStreet, BED_X } from './street.js';
import { ease, clamp01, lerp, v3, skyDome } from '../world.js';
import { Char, tintChars } from '../chars.js';

const W = 1080, H = 1920;
const RS = window.RENDER_SCALE || 0.75;
const TL = buildTimeline(SCRIPT, 47);
const { S } = TL;
const wordsOf = (sid) => TL.words.filter((w) => w.sid === sid);
const WT = (sid, k) => wordsOf(sid)[k].start;

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(Math.round(W * RS), Math.round(H * RS), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 2000);

const R = buildStreet();
const pmrem = new THREE.PMREMGenerator(renderer);
const envFrom = (top, hor, gnd) => { const s = new THREE.Scene(); s.add(skyDome(top, hor, gnd, 50)); return pmrem.fromScene(s, 0.02).texture; };
const ENV = { dawn: envFrom(0x3a4a9a, 0xffa878, 0x4a3a4a), day: envFrom(0x5a9ae8, 0xffe0b0, 0x6a5a5a), bed: envFrom(0x7ac8c0, 0xffb888, 0x6a4a2a) };

// ---------- cast ----------
const MARY = { outfit: 'longcoat', hat: 'cloche', hair: 'bob', hairColor: '#b8b0a8', blush: true };
const NG = { outfit: 'nightgown', hat: 'nightcap' };
const mary = new Char({ ...MARY, expr: 'smirk', pose: 'stand' }, 1.8);
const sleeper = new Char({ ...NG, expr: 'sleep', zzz: true, pose: 'stand', mustache: true, hatColor: '#3a7ad8' }, 1.85);
const angry = new Char({ ...NG, expr: 'furious', pose: 'fist', mustache: true, hatColor: '#d84a6a' }, 1.85);
const boss = new Char({ outfit: 'frock', hat: 'tophat', mustache: true, expr: 'angry', pose: 'point' }, 1.95);
const winHeads = [0, 1, 2, 3, 4, 5].map((i) => new Char({ ...NG, hatColor: ['#3a7ad8', '#d84a6a', '#3aa86a', '#e8a01a', '#8a5ad8', '#3ac8c8'][i], expr: 'jolt', pose: 'stuck', mustache: i % 2 === 0 }, 1.7));
const workerSpecs = [
  { outfit: 'worker', tunic: '#6a7a9a', hat: 'flatcap' }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', dress: '#7a5aa8', blush: true }, { outfit: 'worker', tunic: '#8a5a3a', hat: 'flatcap', stubble: true },
  { outfit: 'worker', tunic: '#5a8a6a', hat: 'flatcap', hatColor: '#3a3a4a' }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', dress: '#c85a5a', blush: true }, { outfit: 'worker', tunic: '#9a8a5a', hat: 'flatcap', mustache: true },
  { outfit: 'dress', hat: 'bonnet', hair: 'long', dress: '#3a7ab8', blush: true }, { outfit: 'worker', tunic: '#7a4a6a', hat: 'flatcap' }, { outfit: 'worker', tunic: '#4a6a8a', hat: 'flatcap', stubble: true }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', dress: '#5aa86a', blush: true },
];
const workers = workerSpecs.map((s) => new Char({ ...s, expr: 'happy', pose: 'stand' }, 1.82));
const all = [mary, sleeper, angry, boss, ...winHeads, ...workers];
all.forEach((c) => R.scene.add(c.mesh));

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d'); document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6; const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d'); const img = x.createImageData(360, 640); for (let i = 0; i < img.data.length; i += 4) { const v = Math.abs((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); return c; });

function look(pos, target, fov = 50, roll = 0) {
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(target); if (roll) camera.rotateZ(roll); camera.updateMatrixWorld(true);
  const dir = target.clone().sub(pos); const dist = Math.min(dir.length(), 20); dir.setY(0).normalize();
  const focus = pos.clone().addScaledVector(dir, dist * 0.7); focus.y = 0;
  R.sun.target.position.copy(focus); R.sun.position.copy(focus).addScaledVector(R.sun.userData.dir, 150); R.sun.target.updateMatrixWorld();
}
const path = (pts, u) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoint(clamp01(u));
const sw = (t, a, b) => clamp01((t - a) / (b - a));
const hsh = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const shake = (t, a) => v3(Math.sin(t * 41) * a, Math.sin(t * 33 + 1) * a, Math.sin(t * 27 + 2) * a * 0.5);
const walkPose = (t, f = 4, o = 0) => (Math.floor(t * f + o) % 2 ? 'walk1' : 'walk2');
const winPos = (w) => { w.group.updateMatrixWorld(true); return w.local.clone().applyMatrix4(w.group.matrixWorld); };
const upperRight = R.windows.filter((w) => w.upper && w.side > 0);
const upperLeft = R.windows.filter((w) => w.upper && w.side < 0);

// ---------- state ----------
let place = 'street', pings = [];
function setPlace(p, t, light = 0) {
  place = p;
  R.street.visible = p === 'street'; R.bed.visible = p === 'bed';
  const out = p === 'street'; R.sky.visible = out; R.ground.visible = out; R.clouds.forEach((c) => (c.visible = out)); R.sunDisc.visible = out;
  R.scene.background = out ? null : new THREE.Color(0x1a1418);
  R.scene.fog = out ? new THREE.Fog(new THREE.Color(0xffa878).lerp(new THREE.Color(0xffe0b0), light), 40, 260) : null;
  R.scene.environment = p === 'bed' ? ENV.bed : light > 0.5 ? ENV.day : ENV.dawn; R.scene.environmentIntensity = 0.7;
  R.sun.intensity = out ? lerp(2.4, 3.6, light) : 0; R.sun.color.set(0xffb878).lerp(new THREE.Color(0xfff0d8), light);
  R.sun.userData.dir.set(0.25, lerp(0.32, 0.6, light), -0.9).normalize();
  R.hemi.intensity = out ? lerp(0.7, 0.9, light) : 0.35; renderer.toneMappingExposure = out ? 1.2 : 1.3;
  tintChars(out ? new THREE.Color(0xffffff).lerp(new THREE.Color(0xffe0d0), 1 - light) : new THREE.Color(0xffead8));
  all.forEach((c) => { c.mesh.visible = false; c.mesh.scale.set(1, 1, 1); c.flip = false; });
  R.windows.forEach((w) => (w.pane.material.emissiveIntensity = 0));
  R.peas.forEach((p) => (p.visible = false)); pings = [];
  R.smoke.forEach((s, i) => { const k = ((t * 0.25 + i / 16) % 1); const x = i % 2 ? 11 : -11; s.position.set(x + k * 6, 28 + k * 14, -2); s.scale.setScalar(2 + k * 6); s.material.opacity = 1 - k; });
  R.clock.draw(5, 52 + Math.min(7.9, t * 0.12));
  R.gate.children.forEach((g, i) => (g.position.x = (i ? 1 : -1) * 1.3));
}
const at = (c, x, y, z, flip = false) => { c.mesh.visible = true; c.mesh.position.set(x, y, z); c.flip = flip; };
function faceAll() { all.forEach((c) => { if (c.mesh.visible) c.face(camera, c.flip); }); }
// shoot a pea from Mary's tube to a window: k = 0..1 flight progress
function pea(i, from, to, k) {
  if (k <= 0 || k >= 1) return; const p = R.peas[i]; p.visible = true; p.position.copy(from).lerp(to, k); p.position.y += Math.sin(k * Math.PI) * 0.6;
}
function lightWindows(k, list = R.windows) { list.forEach((w, i) => { const on = clamp01(k * list.length * 1.1 - hsh(i, 3) * list.length * 0.9); w.pane.material.emissiveIntensity = on * 1.6; }); }
function project(p) { const v = p.clone().project(camera); return { x: (v.x * 0.5 + 0.5) * W, y: (0.5 - v.y * 0.5) * H, on: v.z < 1 }; }
const tubeTip = () => mary.worldPoint(500, 230);

// ---------- shots ----------
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      setPlace('street', t);
      const target = upperRight[3]; const wp = winPos(target);
      at(mary, 1.2, 0.18, 2.5); mary.set({ ...MARY, pose: 'blow', expr: 'blow', aim: 0.25 });
      const shots_ = [0.6, 2.0];
      shots_.forEach((s0, i) => { const k = sw(t, s0, s0 + 0.5); pea(i, tubeTip(), wp, k); if (t > s0 + 0.5 && t < s0 + 0.9) { target.pane.material.emissiveIntensity = 1.4; pings.push({ p: wp, k: t - s0 - 0.5 }); } });
      const e = ease.io(u);
      look(v3(lerp(-0.4, 0.2, e), lerp(0.5, 1.1, e), lerp(5.5, 4.6, e)), v3(lerp(1.6, 4.2, e), lerp(1.8, 3.4, e), lerp(1.6, wp.z + 1, e)), 52, -0.06);
      return {};
  } },
  { id: 'place', start: S.place, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('street', t);
      const firedT = WT('place', 13);
      if (t < WT('place', 8)) { const e = ease.io(sw(t, S.place, WT('place', 8))); look(path([v3(0, 30, 30), v3(0, 16, 0), v3(0, 8, -30)], e), path([v3(0, 10, -72), v3(0, 14, -72), v3(0, 16, -72)], e), lerp(50, 40, e)); }
      else { at(boss, 0, 0.18, -64); const mad = t >= firedT; boss.set({ pose: mad ? 'fist' : 'point', expr: mad ? 'furious' : 'angry', faceColor: mad ? '#ef6b5b' : '#ffffff', steam: mad, vein: mad });
        const e = ease.o(sw(t, WT('place', 8), S.job)); look(v3(lerp(1.8, 1.0, e), lerp(0.8, 1.0, e), lerp(-55, -57.5, e)).add(shake(t, mad ? 0.03 : 0)), v3(0, lerp(3.2, 2.6, e), -64), 46); }
      return { fx: { big: t >= firedT ? { text: 'FIRED!', k: t - firedT, col: '#ff4a4a', size: 160 } : null } };
  } },
  { id: 'job', start: S.job, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('street', t);
      at(mary, 0.4, 0.18, -6); mary.set({ ...MARY, pose: t > WT('job', 7) ? 'reload' : 'stand', expr: t > WT('job', 7) ? 'smirk' : 'wink' });
      workers.slice(0, 3).forEach((w, i) => { at(w, -2.6 + i * 0.4, 0.18, -4.5 - i * 1.4, true); w.set({ pose: 'shake', expr: 'yawn' }); });
      const e = ease.io(u);
      look(v3(lerp(1.6, 1.1, e), 1.6, lerp(-1.6, -2.6, e)), v3(0, 1.5, -6), 44);
      return { fx: { big: t > WT('job', 5) ? { text: 'SIXPENCE A WEEK', k: t - WT('job', 5), col: '#f2c23a', size: 100 } : null } };
  } },
  { id: 'walk', start: S.walk, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('street', t);
      const z = lerp(-8, -20, u); at(mary, -0.8, 0.18, z); mary.set({ ...MARY, pose: walkPose(t, 3.5), expr: 'determined' });
      const e = ease.sine(u);
      look(v3(lerp(-3.4, -2.2, e), lerp(0.6, 0.9, e), z + 3.2), v3(-0.6, 1.7, z - 1.5), 54, 0.05);
      return {};
  } },
  { id: 'ping', start: S.ping, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('street', t);
      const beats = [[WT('ping', 0), WT('ping', 1)], [WT('ping', 2), WT('ping', 3)]];
      const tg = [upperRight[5], upperLeft[6]]; const wps = tg.map(winPos);
      at(mary, 0.6, 0.18, -12);
      const k = t < beats[1][0] ? 0 : 1; const [puffT, pingT] = beats[k];
      const blowing = t < pingT;
      mary.set({ ...MARY, pose: 'blow', expr: 'blow', aim: k ? 0.35 : 0.25 }); mary.flip = k === 1;
      beats.forEach(([a, b], i) => { pea(i, tubeTip(), wps[i], sw(t, a + 0.1, b)); if (t >= b) { tg[i].pane.material.emissiveIntensity = 1.5; if (t - b < 0.5) pings.push({ p: wps[i], k: t - b }); } });
      if (t > WT('ping', 4)) { const k2 = sw(t, WT('ping', 4), S.wake); upperRight.slice(6, 12).forEach((w, i) => { pea(2 + (i % 4), tubeTip(), winPos(w), ((k2 * 3 + i * 0.37) % 1)); if (((k2 * 3 + i * 0.37) % 1) > 0.9) w.pane.material.emissiveIntensity = 1.2; }); }
      if (blowing) look(v3(mary.mesh.position.x + (k ? -1.2 : 1.2), 1.7, -9.8).add(shake(t, 0.01)), v3(0.6, 1.8, -12), 40, k ? 0.04 : -0.04);
      else look(v3(wps[k].x - (k ? -3.2 : 3.2), wps[k].y - 0.6, wps[k].z + 3.2).add(shake(t, 0.03)), wps[k], 40, k ? -0.05 : 0.05);
      return { fx: { big: blowing ? { text: 'PUFF!', k: t - puffT, col: '#ffffff', size: 130 } : { text: 'PING!', k: t - pingT, col: '#8ae84a', size: 150 } } };
  } },
  { id: 'wake', start: S.wake, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('bed', t);
      const pingT = S.wake + 0.45; const up = t > pingT;
      const j = up ? Math.sin(Math.min(1, (t - pingT) / 0.35) * Math.PI) * 0.7 : 0;
      at(sleeper, BED_X - 0.6, 0.15 + j + (up ? 0.25 : 0), -1.7); sleeper.set({ ...NG, expr: up ? 'jolt' : 'sleep', zzz: !up, pose: up ? 'stuck' : 'stand', mustache: true, hatColor: '#3a7ad8' });
      if (up && t - pingT < 0.5) pings.push({ p: v3(BED_X + 1.5, 2.3, -2.45), k: t - pingT });
      const e = ease.io(u);
      look(v3(BED_X + lerp(0.6, 0.2, e), lerp(1.6, 1.8, e), lerp(2.6, 1.8, e)).add(shake(t, up && t - pingT < 0.4 ? 0.04 : 0)), v3(BED_X - 0.1, 1.5, -1.6), 46, 0.03);
      return {};
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('street', t);
      workers.slice(3, 6).forEach((w, i) => { at(w, -5.6 + (i % 2) * 0.3, 0.18, -16 - i * 1.1, i === 1); w.set({ pose: ['laughbelly', 'point', 'laughbelly'][i], expr: 'laugh' }); w.mesh.position.y += Math.abs(Math.sin(t * 9 + i)) * 0.06; });
      at(mary, 2.2, 0.18, -22); mary.set({ ...MARY, pose: 'blow', expr: 'blow', aim: 0.3 });
      const e = ease.sine(u);
      look(v3(lerp(-2.4, -2.8, e), 1.5, lerp(-12.4, -12.8, e)), v3(-5.6, 1.5, -17), 44, -0.05);
      return {};
  } },
  { id: 'angry', start: S.angry, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('street', t);
      const mad = t >= WT('angry', 4);
      at(angry, 5.9, 0.18, -25.6, true); angry.set({ ...NG, expr: mad ? 'furious' : 'angry', vein: mad, faceColor: mad ? '#ef6b5b' : '#ffffff', steam: mad, pose: mad ? 'fist' : 'stand', mustache: true, hatColor: '#d84a6a' });
      const e = ease.o(sw(t, WT('angry', 4), WT('angry', 4) + 0.25));
      if (!mad) look(v3(2.6, 1.4, -22.6), v3(5.4, 1.6, -25.6), 46);
      else look(v3(lerp(3.6, 4.6, e), 1.75, lerp(-23.4, -24.3, e)).add(shake(t, 0.03)), v3(5.9, 1.75, -25.6), 42, 0.05);
      return {};
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('street', t);
      const re = t >= WT('shrug', 4);
      at(mary, 0.6, 0.18, -26); mary.set({ ...MARY, pose: re ? 'reload' : 'shrug', expr: re ? 'smirk' : 'bored' });
      look(v3(-0.2, 1.65, -23.4), v3(0.6, 1.55, -26), 40);
      return {};
  } },
  { id: 'payoff', start: S.payoff, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      const light = sw(t, S.payoff, S.whatif);
      setPlace('street', t, light);
      lightWindows(sw(t, S.payoff, WT('payoff', 4)));
      const walkT = WT('payoff', 4);
      workers.forEach((w, i) => { const k = Math.max(0, t - walkT - i * 0.12); at(w, (i % 2 ? 2.2 : -2.2) + (hsh(i) - 0.5), 0.18, 4 - Math.floor(i / 2) * 2.2 - k * 2.2); w.set({ pose: k > 0 ? walkPose(t, 4, i) : 'stand', expr: 'happy' }); });
      const sixT = WT('payoff', 10);
      if (t >= sixT) R.clock.draw(6, 0);
      if (t < walkT) { const e = ease.io(sw(t, S.payoff, walkT)); look(v3(0, lerp(2, 5, e), lerp(14, 10, e)), v3(0, lerp(4, 3, e), -30), 50); }
      else if (t < sixT) { const e = ease.sine(sw(t, walkT, sixT)); look(v3(lerp(-3, -1.5, e), 0.8, lerp(6, 0, e)), v3(0, 1.6, -20), 54, 0.03); }
      else { R.gate.children.forEach((g, i) => (g.position.x = (i ? 1 : -1) * (1.3 + sw(t, sixT, sixT + 0.6) * 2.4))); look(v3(0, 6, -50), v3(0, 15, -70), 44); }
      return { fx: { big: t >= sixT ? { text: '6:00 SHARP!', k: t - sixT, col: '#5ae87a', size: 130 } : null } };
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      setPlace('street', t);
      const k = sw(t, S.whatif + 0.5, S.fact); R.clock.draw(6 + k * 4, (k * 240) % 60);
      at(boss, 0, 0.18, -64); boss.set({ pose: 'stand', expr: 'cry', steam: false, vein: false, faceColor: '#ffffff' });
      if (t < WT('whatif', 3)) { at(sleeper, BED_X - 0.6, 0.4, -1.7); sleeper.mesh.visible = false; look(v3(0, 2.5, 6), v3(0, 3, -30), 50); }
      else look(v3(1.4, 1.0, -56), v3(0, 2.8, -64), 46, Math.sin(t * 2) * 0.03);
      return { fx: { bw: 1, big: t >= WT('whatif', 6) ? { text: 'NO PAY', k: t - WT('whatif', 6), col: '#ff4a4a', size: 150 } : null } };
  } },
  { id: 'fact', start: S.fact, run(t, u) {
      setPlace('street', t, 0.6); lightWindows(1);
      at(mary, 0.6, 0.18, lerp(-8, -11, u)); mary.set({ ...MARY, pose: walkPose(t, 3.5), expr: 'happy' });
      look(v3(-1.6, 1.4, lerp(-3, -6, u)), v3(0.4, 1.8, lerp(-9, -12, u)), 48);
      return { fx: { rewind: clamp01(1 - (t - S.fact) / 0.4), card: sw(t, S.fact + 0.15, S.fact + 0.55) } };
  } },
  { id: 'end', start: S.end, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      setPlace('street', t, 0.8); lightWindows(1);
      const wink = t > TL.speechEnd + 0.15;
      at(mary, 0.6, 0.18, -12); mary.set({ ...MARY, pose: wink ? 'reload' : 'blow', expr: wink ? 'wink' : 'blow', aim: 0.2 });
      const e = ease.io(u);
      look(v3(lerp(-1.4, -0.5, e), lerp(1.5, 1.65, e), lerp(-8.4, -9.6, e)), v3(0.5, lerp(1.6, 1.55, e), -12), 42);
      return { fx: { sparkle: wink ? (t - TL.speechEnd - 0.15) / 0.6 : 0 } };
  } },
];
for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : TL.duration;
const shotAt = (t) => { let s = shots[0]; for (const x of shots) if (t >= x.start) s = x; return s; };

let lastPings = [];
function renderShot(shot, t, alpha = 1, whip = 0) {
  const res = shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start) || {};
  faceAll();
  if (whip) camera.rotateY(whip);
  renderer.render(R.scene, camera);
  lastPings = pings.map((p) => ({ ...project(p.p), k: p.k }));
  cx.save(); cx.globalAlpha = alpha;
  cx.filter = res.fx && res.fx.bw ? 'grayscale(1) contrast(1.3) brightness(0.9)' : 'saturate(1.3) contrast(1.06)';
  cx.drawImage(glCanvas, 0, 0, W, H); cx.restore();
  return res;
}
function bloom(a = 0.2) { sx.filter = 'brightness(1.05) contrast(1.8) blur(5px)'; sx.clearRect(0, 0, small.width, small.height); sx.drawImage(comp, 0, 0, small.width, small.height); cx.save(); cx.globalCompositeOperation = 'screen'; cx.globalAlpha = a; cx.drawImage(small, 0, 0, W, H); cx.restore(); }
function vignette(s = 0.3) { const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
function grade() { cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = 0.18; const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffb0a0'); g.addColorStop(1, '#5a60c0'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
function vhs(t, amount) {
  if (amount <= 0) return;
  for (let i = 0; i < 9; i++) { const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60); cx.drawImage(comp, 0, y, W, h, Math.sin(t * 80 + i) * 60 * amount, y, W, h); }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2); cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function star(x, y, s, rot, col = '#fff6c0') { cx.save(); cx.translate(x, y); cx.rotate(rot); cx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.28 : s; const a = i * Math.PI / 4; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath(); cx.fillStyle = col; cx.strokeStyle = '#141010'; cx.lineWidth = 7; cx.stroke(); cx.fill(); cx.restore(); }
function sparkle(k) { for (const [x, y, s0] of [[0.66, 0.42, 1], [0.74, 0.36, 0.6], [0.6, 0.34, 0.5]]) { const s = s0 * Math.sin(Math.min(1, k) * Math.PI) * 90; if (s > 0) star(W * x, H * y, s, k * 1.5); } }
function drawPings() { for (const p of lastPings) { if (!p.on) continue; const s = Math.sin(clamp01(p.k / 0.4) * Math.PI) * 110; if (s > 1) { star(p.x, p.y, s, p.k * 4, '#d8ff8a'); cx.save(); cx.strokeStyle = 'rgba(255,255,255,0.9)'; cx.lineWidth = 6; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + 0.2, r0 = s * 0.9, r1 = s * 1.5; cx.beginPath(); cx.moveTo(p.x + Math.cos(a) * r0, p.y + Math.sin(a) * r0); cx.lineTo(p.x + Math.cos(a) * r1, p.y + Math.sin(a) * r1); cx.stroke(); } cx.restore(); } } }
function pop(b) {
  const k = b.k, size = b.size || 120;
  const s = k < 0.12 ? 0.4 + (k / 0.12) * 0.75 : 1.15 - 0.15 * ease.o(clamp01((k - 0.12) / 0.15));
  cx.save(); cx.translate(W / 2 + Math.sin(k * 30) * 6 * Math.exp(-k * 4), H * (b.y || 0.26)); cx.rotate(-0.05); cx.scale(s, s);
  cx.font = `900 ${size}px Montserrat`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
  cx.lineWidth = size * 0.22; cx.strokeStyle = '#151012'; cx.strokeText(b.text, 0, 0); cx.fillStyle = b.col; cx.fillText(b.text, 0, 0); cx.restore();
}
function card(k) {
  if (k <= 0) return; const y = H * 0.33 + (1 - ease.o(clamp01(k))) * 140;
  cx.save(); cx.globalAlpha = clamp01(k * 1.5); cx.translate(W / 2, y); cx.rotate(-0.03);
  cx.fillStyle = '#fff8ec'; cx.strokeStyle = '#151012'; cx.lineWidth = 12; cx.beginPath(); cx.roundRect(-410, -240, 820, 480, 36); cx.fill(); cx.stroke();
  cx.fillStyle = '#3a7ad8'; cx.beginPath(); cx.roundRect(-410, -240, 820, 120, [36, 36, 0, 0]); cx.fill(); cx.stroke();
  cx.fillStyle = '#ffffff'; cx.font = '900 64px Montserrat'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('REAL JOB', 0, -178);
  cx.fillStyle = '#151012'; cx.font = '900 92px Montserrat'; cx.fillText('KNOCKER-', 0, -50); cx.fillText('UPPER', 0, 50);
  cx.font = '800 40px Montserrat'; cx.fillStyle = '#c8302a'; cx.fillText('HUMAN ALARM CLOCK', 0, 150);
  for (let i = 0; i < 5; i++) { cx.fillStyle = '#7ac83a'; cx.beginPath(); cx.arc(-120 + i * 60, 205, 16, 0, 7); cx.fill(); cx.lineWidth = 6; cx.stroke(); }
  cx.restore();
}
function captions(t) {
  const g = TL.groups.find((x) => t >= x.start && t < x.hide); if (!g) return;
  const k = clamp01((t - g.start) / 0.07), s = 1.12 - 0.12 * ease.o(k);
  cx.save(); cx.translate(W / 2, H * 0.7); cx.scale(s, s);
  cx.font = '800 66px Montserrat'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
  cx.shadowColor = 'rgba(0,0,0,0.55)'; cx.shadowBlur = 14; cx.shadowOffsetY = 4; cx.lineWidth = 12; cx.strokeStyle = '#000'; cx.strokeText(g.text, 0, 0);
  cx.shadowColor = 'transparent'; cx.fillStyle = '#fff'; cx.fillText(g.text, 0, 0); cx.restore();
}

window.TIMELINE = TL; window.DURATION = TL.duration;
window.SHOTS = shots.map((s) => ({ id: s.id, start: s.start, end: s.end, trans: s.trans ? s.trans.type : null }));
window.renderAt = function (t, opts = {}) {
  const shot = shotAt(t), idx = shots.indexOf(shot), prev = shots[idx - 1], nxt = shots[idx + 1];
  cx.globalAlpha = 1; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
  const lt = t - shot.start, tr = shot.trans || {};
  let res;
  if (shot.rewind && lt < shot.rewind && prev) { res = renderShot(prev, shot.start - lt * 4); bloom(); vhs(t, 1); }
  else {
    let blur = (tr.type === 'whip' && prev && lt < tr.dur) || (nxt && nxt.trans && nxt.trans.type === 'whip' && shot.end - t < nxt.trans.dur);
    const whipAt = (tt) => { if (tr.type === 'whip' && prev && tt - shot.start < tr.dur) return -0.5 * (1 - (tt - shot.start) / tr.dur); if (nxt && nxt.trans && nxt.trans.type === 'whip' && shot.end - tt < nxt.trans.dur) return 0.5 * (1 - (shot.end - tt) / nxt.trans.dur); return 0; };
    const n = blur && !opts.fast ? 5 : 1;
    for (let i = 0; i < n; i++) { const tt = t + (n > 1 ? (i / (n - 1) - 0.5) / 30 * 1.5 : 0); res = renderShot(shot, tt, 1 / (i + 1), whipAt(tt)); }
    if (tr.type === 'fade' && prev && lt < tr.dur) renderShot(prev, t, 1 - lt / tr.dur);
    const fx = res.fx || {};
    if (!fx.bw) grade();
    bloom(0.24);
    drawPings();
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(place === 'bed' ? 0.4 : 0.26);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.big) pop(fx.big);
    if (fx.card) card(fx.card);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
