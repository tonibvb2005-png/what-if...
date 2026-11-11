import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildStation } from './station.js';
import { ease, clamp01, lerp, v3, skyDome, canvasTex } from '../world.js';
import { Char } from '../chars.js';

const W = 1080, H = 1920;
const RS = window.RENDER_SCALE || 0.75;
const TL = buildTimeline(SCRIPT, 44);
const { S } = TL;
const wordsOf = (sid) => TL.words.filter((w) => w.sid === sid);
const WT = (sid, k) => wordsOf(sid)[k].start;

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(Math.round(W * RS), Math.round(H * RS), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 2000);

const R = buildStation();
const pmrem = new THREE.PMREMGenerator(renderer);
{ const s = new THREE.Scene(); s.add(skyDome(0x4a9af0, 0xffe0c8, 0x8a8478, 50)); R.scene.environment = pmrem.fromScene(s, 0.02).texture; R.scene.environmentIntensity = 0.8; }
R.scene.fog = new THREE.Fog(0xffe0c8, 200, 1600);

// ---------- cast ----------
const PU = { outfit: 'pusher', hat: 'stationcap', gloves: true };
const SM = { outfit: 'salaryman', hair: 'parted' };
const hero = new Char({ ...PU, expr: 'grin', cheeks: true, pose: 'push' }, 1.85);
const pushers = [0, 1, 2].map(() => new Char({ ...PU, expr: 'determined', pose: 'stand' }, 1.85));
const boss = new Char({ ...SM, suit: '#2a2a34', tie: '#c8202a', expr: 'neutral', pose: 'briefcase' }, 1.9);
const crowdSpecs = [
  { ...SM, suit: '#23304a', tie: '#2a6ad8' }, { outfit: 'schoolgirl', hair: 'bob' }, { ...SM, suit: '#5a5a62', tie: '#e8b02a', hair: 'spiky' }, { outfit: 'officelady', hair: 'bob', hairColor: '#4a2a1a', blouse: '#f6c8d0' },
  { outfit: 'gakuran', hat: 'gakucap' }, { ...SM, suit: '#3a2a22', tie: '#3ab04a' }, { outfit: 'officelady', hair: 'bob', blouse: '#c8e0f8', skirt: '#2a3a5a', jacket: '#2a3a5a' }, { ...SM, suit: '#2a3a2a', tie: '#e8202a', hair: 'spiky', hairColor: '#3a2a1a' },
  { outfit: 'schoolgirl', hair: 'bob', hairColor: '#3a2418' }, { ...SM, suit: '#4a4a5a', tie: '#e85ab0' }, { outfit: 'gakuran', hair: 'spiky' }, { outfit: 'officelady', hair: 'bob', blouse: '#f8f0b0' },
  { ...SM, suit: '#1a2a4a', tie: '#f2c23a', hair: 'spiky' }, { ...SM, suit: '#5a4a3a', tie: '#2a6ad8' }, { outfit: 'schoolgirl', hair: 'bob' }, { ...SM, suit: '#2a2a34', tie: '#3ab04a' },
  { outfit: 'officelady', hair: 'bob', hairColor: '#2a1a12', blouse: '#d8f0d0' }, { ...SM, suit: '#3a3a4a', tie: '#e8701a' }, { outfit: 'gakuran', hat: 'gakucap' }, { ...SM, suit: '#23304a', tie: '#c8202a', hair: 'spiky' },
];
const crowd = crowdSpecs.map((s) => new Char({ ...s, expr: 'neutral', pose: 'stand' }, 1.82));
const inside = Array.from({ length: 10 }, (_, i) => new Char({ ...crowdSpecs[(i * 7 + 3) % crowdSpecs.length], expr: 'squish', pose: 'pinned', cheeks: true }, 1.82));
const all = [hero, ...pushers, boss, ...crowd, ...inside];
all.forEach((c) => R.scene.add(c.mesh));
// foreground "back of head" for over-the-shoulder shots
const backHeadTex = canvasTex(256, 256, (c) => { c.fillStyle = '#ffffff'; c.beginPath(); c.arc(128, 128, 118, 0, 7); c.fill(); c.save(); c.beginPath(); c.arc(128, 128, 118, 0, 7); c.clip(); c.fillStyle = '#16121a'; c.beginPath(); c.ellipse(128, 70, 150, 120, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.ellipse(96, 40, 40, 14, -0.4, 0, 7); c.fill(); c.restore(); c.lineWidth = 12; c.strokeStyle = '#151012'; c.beginPath(); c.arc(128, 128, 116, 0, 7); c.stroke(); });
const backHead = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: backHeadTex, transparent: true, depthTest: false })); backHead.renderOrder = 10; camera.add(backHead); R.scene.add(camera);

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
const beat = (t, f) => Math.pow(Math.abs(Math.sin(t * f * Math.PI)), 3); // pushing rhythm 0..1

// ---------- state ----------
let fgHead = null;
function reset(t) {
  all.forEach((c) => { c.mesh.visible = false; c.mesh.scale.set(1, 1, 1); c.sq = [1, 1]; });
  backHead.visible = false; fgHead = null;
  R.train.position.x = -20.3; setDoors(1);
  R.clock.draw(8, 57 + Math.min(2.9, t * 0.05));
  R.platLights.forEach((l, i) => (l.intensity = 6));
}
function setDoors(open, wobble = 0) { R.cars.forEach((car) => car.userData.doors.forEach((d) => d.panels.forEach((p) => { const k = clamp01(open + wobble); p.position.x = d.x + p.userData.s * (car.userData.DW / 4 + k * 0.72); }))); }
// place + face + squash
const at = (c, x, y, z, o = {}) => { c.mesh.visible = true; c.mesh.position.set(x, y + (o.bob ? Math.abs(Math.sin(o.bob)) * 0.05 : 0), z); c.flip = !!o.flip; c.sq = o.sq || [1, 1]; };
function faceAll() { all.forEach((c) => { if (!c.mesh.visible) return; c.face(camera, c.flip); c.mesh.scale.x *= c.sq[0]; c.mesh.scale.y = c.sq[1]; }); }
function crowdOn(t, n, opts = {}) { // crowd standing on the platform, facing the train
  for (let i = 0; i < n && i < crowd.length; i++) {
    const c = crowd[i]; const row = Math.floor(i / 6), col = i % 6;
    const x = (opts.x0 || -5) + col * 1.7 + (row % 2) * 0.8 + (hsh(i, 1) - 0.5) * 0.4, z = (opts.z0 || 1.6) + row * 1.25 + (hsh(i, 2) - 0.5) * 0.3;
    c.set({ pose: opts.pose ? opts.pose(i) : (i % 4 === 0 ? 'briefcase' : i % 5 === 1 ? 'phone' : 'stand'), expr: opts.expr ? opts.expr(i) : ['bored', 'ring', 'nervous', 'neutral'][i % 4], lookX: (i % 3) - 1, sweat: !!opts.sweat });
    if (opts.avoidDoor && Math.abs(x) < 1.6 && z < 2.6) { c.mesh.visible = false; continue; }
    at(c, x, 0, z, { bob: t * 3 + i, flip: i % 2 === 1 });
  }
}
function packInside(t, x0, n, sq = 1, expr = 'squish') { // passengers jammed in a doorway
  for (let i = 0; i < n && i < inside.length; i++) { const c = inside[i]; c.set({ expr: i % 3 === 2 ? 'panic' : expr, pose: i % 2 ? 'pinned' : 'stand', cheeks: true, sweat: i % 3 === 0 });
    at(c, x0 + (i % 5 - 2) * 0.42 + Math.sin(t * 9 + i) * 0.03 * sq, 0.15, -0.6 - Math.floor(i / 5) * 0.45, { sq: [1 - 0.18 * sq, 1 + 0.04 * sq], flip: i % 2 === 0 }); }
}

// ---------- shots ----------
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      reset(t); const b = beat(t, 1.6);
      packInside(t, 0, 10, 0.6 + b * 0.6);
      boss.set({ ...SM, suit: '#2a2a34', expr: b > 0.5 ? 'squish' : 'panic', pose: 'pinned', cheeks: true, sweat: true }); at(boss, 0.05, 0.05, 0.05 - b * 0.25, { sq: [1 - b * 0.25, 1 + b * 0.05] });
      hero.set({ ...PU, expr: 'grin', cheeks: true, pose: 'push' }); at(hero, -0.75 + b * 0.2, 0, 0.85 - b * 0.3);
      const e = ease.io(u);
      look(v3(lerp(2.6, 1.6, e), lerp(1.4, 1.55, e), lerp(3.8, 2.6, e)).add(shake(t, 0.02 + b * 0.03)), v3(-0.1, 1.45, 0.1), lerp(52, 44, e), -0.04 + b * 0.02);
      return {};
  } },
  { id: 'place', start: S.place, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      reset(t); const arrive = sw(t, WT('place', 4), S.full); R.train.position.x = lerp(-140, -20.3, ease.o(arrive)); setDoors(0);
      crowdOn(t, 20, { expr: (i) => (i % 3 ? 'bored' : 'nervous') });
      if (t < WT('place', 4)) { const e = ease.io(sw(t, S.place, WT('place', 4))); look(path([v3(40, 60, 90), v3(24, 34, 46), v3(16, 20, 28)], e), path([v3(-30, 10, -200), v3(-10, 0, -40), v3(0, 0, 0)], e), 52); }
      else { const e = ease.o(sw(t, WT('place', 4), S.full)); look(v3(lerp(16, 14, e), lerp(1.4, 1.8, e), 6.3), v3(-8, 1.5, 0.2), 54, 0.05); }
      return { blur: arrive > 0.05 && arrive < 0.9 && t > WT('place', 4) };
  } },
  { id: 'full', start: S.full, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      reset(t); const wob = Math.max(0, Math.sin(t * 9)) * 0.55;
      const struggle = t >= WT('full', 4);
      setDoors(struggle ? 0.25 + wob : 1);
      packInside(t, 0, 10, 1, 'panic');
      crowdOn(t, 12, { z0: 1.0, avoidDoor: true, pose: () => 'stand', expr: (i) => (i % 2 ? 'panic' : 'nervous'), sweat: true });
      if (t < WT('full', 4)) look(v3(-2.6, 1.6, 3.4), v3(0, 1.3, -0.5), 46, 0.03);
      else if (t < WT('full', 8)) look(v3(0.2, 1.35, 1.6).add(shake(t, 0.015)), v3(0, 1.3, -0.3), 44);
      else { R.clock.draw(8, 59 + sw(t, WT('full', 8), S.hire) * 0.9); look(v3(-3.2, 3.5, 2.6), v3(-4, 3.9, 4.32), 30); }
      return {};
  } },
  { id: 'hire', start: S.hire, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      reset(t); setDoors(1); packInside(t, 0, 10, 0.6);
      crowdOn(t, 12, { x0: -9, z0: 3.2, expr: () => 'ring' });
      const glove = t >= WT('hire', 5);
      [hero, ...pushers].forEach((p, i) => { p.set({ ...PU, pose: glove ? 'stuck' : walkPose(t, 4, i), expr: glove ? 'grin' : 'determined', cheeks: glove }); at(p, 8 - i * 1.3 - (glove ? 0 : (t - S.hire) * 1.6), 0, 1.6 + i * 0.25, { bob: t * 8 + i }); });
      if (!glove) look(v3(lerp(5.5, 3.0, u), 0.7, 5.6), v3(4, 1.4, 1.4), 50, 0.05);
      else { const e = ease.o(sw(t, WT('hire', 5), S.push)); const hx = hero.mesh.position.x; look(v3(hx + 0.2, lerp(1.6, 1.8, e), lerp(4.2, 3.3, e)), v3(hx, 1.75, 1.6), 40); }
      return { fx: { big: glove ? { text: 'WHITE GLOVES', k: t - WT('hire', 5), col: '#ffffff', y: 0.26 } : null } };
  } },
  { id: 'push', start: S.push, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      reset(t); setDoors(1);
      const k0 = WT('push', 2), k1 = WT('push', 3), k2 = WT('push', 5);
      const stage = t < k0 ? 0 : t < k1 ? 1 : t < k2 ? 2 : 3;
      const b = stage === 0 ? 0 : beat(t - k0, stage === 3 ? 2.6 : 1.8);
      packInside(t, 0, 10, 0.5 + stage * 0.35 + b * 0.4);
      boss.set({ ...SM, suit: '#2a2a34', expr: stage === 0 ? 'nervous' : 'squish', pose: 'pinned', cheeks: true, sweat: true }); at(boss, 0.05, 0.05, 0.12 - b * 0.35 - stage * 0.05, { sq: [1 - b * 0.3, 1 + b * 0.06] });
      hero.set({ ...PU, expr: stage === 0 ? 'determined' : 'grin', cheeks: stage > 0, pose: stage === 0 ? 'stand' : 'push' }); at(hero, -0.7 + b * 0.25, 0, 0.95 - b * 0.35);
      pushers[0].set({ ...PU, expr: 'grin', pose: stage >= 2 ? 'push' : 'stand' }); at(pushers[0], 0.75 - b * 0.2, 0, 1.05 - b * 0.3, { flip: true });
      const cams = [[v3(2.6, 1.5, 3.4), v3(0, 1.4, 0.1), 48], [v3(-1.8, 1.2, 2.6), v3(0, 1.4, 0.1), 46], [v3(1.6, 2.2, 2.4), v3(0, 1.3, 0.1), 42], [v3(0.2, 1.4, 2.2), v3(0, 1.45, 0), 50]];
      const [p, tg, f] = cams[stage];
      look(p.clone().add(shake(t, 0.01 + b * 0.05)), tg, f - b * 3, (stage % 2 ? 0.05 : -0.05) * b);
      const txt = [null, ['PUSH!', '#ffffff', k0], ['PUSH HARDER!', '#f2c23a', k1], ['SQUEEZE!', '#ff5a8a', k2]][stage];
      return { fx: { big: txt ? { text: txt[0], k: t - txt[2], col: txt[1], y: 0.24, size: stage === 3 ? 150 : 120 } : null } };
  } },
  { id: 'squish', start: S.squish, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      reset(t); setDoors(0);
      // faces pressed on the door glass of the middle door
      inside.forEach((c, i) => { const px = [-0.36, 0.36, -0.36, 0.36, 0.0][i % 5] ; c.set({ expr: i % 2 ? 'squish' : 'panic', pose: 'pinned', cheeks: true, sweat: true }); if (i < 4) at(c, px, i > 1 ? 0.4 : 0.6, i > 1 ? -0.6 : -0.32, { sq: [1.25 + Math.sin(t * 6 + i) * 0.05, 0.86], flip: i % 2 === 0 }); });
      const e = ease.sine(u);
      look(v3(lerp(-0.3, 0.3, e), 1.7, lerp(2.6, 2.2, e)), v3(0, 1.65, -0.2), 38, Math.sin(t * 2) * 0.03);
      return {};
  } },
  { id: 'angry', start: S.angry, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      reset(t); setDoors(1); packInside(t, 0, 10, 0.8);
      const mad = t >= WT('angry', 4);
      boss.set({ ...SM, suit: '#2a2a34', expr: mad ? 'furious' : 'angry', pose: mad ? 'fist' : 'briefcase', vein: mad, faceColor: mad ? '#ef6b5b' : '#ffffff', steam: mad, wrinkled: true }); at(boss, 0.1, 0.05, 0.2);
      hero.set({ ...PU, expr: mad ? 'ring' : 'grin', pose: 'stand', sweat: mad }); at(hero, -0.8, 0, 1.0);
      const e = ease.o(sw(t, WT('angry', 4), WT('angry', 4) + 0.25));
      if (!mad) look(v3(1.4, 1.5, 3.0), v3(-0.2, 1.4, 0.4), 46);
      else look(v3(lerp(1.0, 0.35, e), 1.75, lerp(2.6, 1.6, e)).add(shake(t, 0.03)), v3(0.1, 1.75, 0.2), 44, 0.04);
      return {};
  } },
  { id: 'bow', start: S.bow, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      reset(t); setDoors(1);
      const again = t >= WT('bow', 4); const b = again ? beat(t - WT('bow', 4), 2) : 0;
      packInside(t, 0, 10, 1 + b * 0.4);
      boss.set({ ...SM, suit: '#2a2a34', expr: again ? 'squish' : 'furious', vein: !again, faceColor: again ? '#ffffff' : '#ef6b5b', pose: again ? 'pinned' : 'fist', cheeks: again }); at(boss, 0.05, 0.05, again ? 0.05 - b * 0.3 : 0.25, { sq: again ? [1 - b * 0.3, 1] : [1, 1] });
      hero.set({ ...PU, expr: again ? 'grin' : 'polite', pose: again ? 'push' : 'bow', cheeks: true }); at(hero, -0.75 + b * 0.2, 0, 1.0 - b * 0.3);
      if (!again) look(v3(-2.6, 1.3, 2.8), v3(-0.5, 1.2, 0.8), 42, -0.03);
      else look(v3(2.4, 1.5, 3.0).add(shake(t, b * 0.05)), v3(-0.1, 1.4, 0.2), 46);
      return {};
  } },
  { id: 'close', start: S.close, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      reset(t);
      const shut = sw(t, S.close, WT('close', 2)); setDoors(1 - ease.io(shut));
      const go = t >= WT('close', 3) ? sw(t, WT('close', 3), S.whatif + 0.5) : 0;
      R.train.position.x = -20.3 + go * go * 70;
      packInside(t, 0, 10, 1);
      crowdOn(t, 12, { z0: 2.6, expr: (i) => (go > 0 ? 'grin' : 'ring'), pose: (i) => (go > 0 && i % 2 ? 'stuck' : 'stand') });
      [hero, ...pushers].forEach((p, i) => { p.set({ ...PU, expr: go > 0 ? 'grin' : 'determined', cheeks: true, pose: go > 0 ? 'bow' : 'stand' }); at(p, -3 + i * 2.2, 0, 1.2); });
      const onT = t >= WT('close', 6);
      if (onT) R.clock.draw(9, 0);
      if (t < WT('close', 3)) look(v3(1.6, 1.4, 2.6), v3(0, 1.3, -0.2), 44);
      else if (!onT) look(v3(-2, 1.0, 6.9), v3(8, 1.6, -0.8), 54, -0.04);
      else { const e = ease.o(sw(t, WT('close', 6), WT('close', 6) + 0.4)); look(v3(lerp(-3.4, -3.8, e), 3.6, lerp(2.4, 1.8, e)), v3(-4, 3.9, 4.32), 30); }
      return { blur: go > 0.15 && !onT, fx: { big: onT ? { text: 'ON TIME!', k: t - WT('close', 6), col: '#5ae87a', y: 0.24 } : null } };
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      reset(t); setDoors(0.4, Math.max(0, Math.sin(t * 10)) * 0.5);
      packInside(t, 0, 10, 1.2, 'cry');
      crowdOn(t, 20, { z0: 0.9, expr: (i) => (i % 2 ? 'cry' : 'panic'), pose: (i) => (i % 3 ? 'stand' : 'stuck'), sweat: true });
      const k = sw(t, WT('whatif', 3), S.fact); R.clock.draw(9 + k * 3, (k * 180) % 60);
      if (t < WT('whatif', 5)) look(v3(lerp(-5, -3, u), 1.6, 6.5), v3(0, 1.3, 0), 48, 0.04);
      else look(v3(-3.3, 3.6, 2.4), v3(-4, 3.9, 4.32), 34, Math.sin(t * 3) * 0.05);
      return { fx: { bw: 1, big: t >= WT('whatif', 5) ? { text: 'LATE!', k: t - WT('whatif', 5), col: '#ff4a4a', y: 0.24, size: 150 } : null } };
  } },
  { id: 'fact', start: S.fact, run(t, u) {
      reset(t); setDoors(1);
      packInside(t, 0, 10, 0.8);
      [hero, ...pushers].forEach((p, i) => { p.set({ ...PU, expr: 'polite', pose: Math.floor(t * 1.2 + i * 0.5) % 2 ? 'bow' : 'push', cheeks: true }); at(p, -1.8 + i * 1.2, 0, 1.1); });
      crowdOn(t, 6, { z0: 2.6, x0: -6 });
      const e = ease.sine(u);
      look(v3(lerp(3.5, 2.2, e), lerp(2.6, 2.0, e), lerp(6.5, 5.2, e)), v3(-0.2, 1.4, 0.6), 48);
      return { fx: { rewind: clamp01(1 - (t - S.fact) / 0.4), card: sw(t, S.fact + 0.15, S.fact + 0.55) } };
  } },
  { id: 'end', start: S.end, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      reset(t); setDoors(1); packInside(t, 0, 10, 0.7);
      const wink = t > TL.speechEnd + 0.15;
      hero.set({ ...PU, expr: wink ? 'wink' : 'grin', cheeks: true, pose: wink ? 'stuck' : 'push' }); at(hero, -0.6, 0, 1.0);
      const e = ease.io(u);
      look(v3(lerp(1.2, 0.3, e), lerp(1.6, 1.75, e), lerp(4.2, 3.3, e)), v3(-0.5, lerp(1.4, 1.6, e), 1.0), 42);
      return { fx: { sparkle: wink ? (t - TL.speechEnd - 0.15) / 0.6 : 0 } };
  } },
];
for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : TL.duration;
const shotAt = (t) => { let s = shots[0]; for (const x of shots) if (t >= x.start) s = x; return s; };

function renderShot(shot, t, alpha = 1, whip = 0) {
  const res = shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start) || {};
  faceAll();
  if (fgHead) { backHead.visible = true; const d = 0.5; const hh = 2 * d * Math.tan(camera.fov * Math.PI / 360); backHead.position.set(fgHead.x * hh * W / H, fgHead.y * hh, -d); backHead.scale.setScalar(fgHead.s * hh * 0.6); }
  if (whip) camera.rotateY(whip);
  renderer.render(R.scene, camera);
  cx.save(); cx.globalAlpha = alpha;
  cx.filter = res.fx && res.fx.bw ? 'grayscale(1) contrast(1.3) brightness(0.95)' : 'saturate(1.3) contrast(1.06)';
  cx.drawImage(glCanvas, 0, 0, W, H); cx.restore();
  return res;
}
function bloom(a = 0.2) { sx.filter = 'brightness(1.05) contrast(1.8) blur(5px)'; sx.clearRect(0, 0, small.width, small.height); sx.drawImage(comp, 0, 0, small.width, small.height); cx.save(); cx.globalCompositeOperation = 'screen'; cx.globalAlpha = a; cx.drawImage(small, 0, 0, W, H); cx.restore(); }
function vignette(s = 0.3) { const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
function grade() { cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = 0.14; const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe8c0'); g.addColorStop(1, '#6a80c0'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
function vhs(t, amount) {
  if (amount <= 0) return;
  for (let i = 0; i < 9; i++) { const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60); cx.drawImage(comp, 0, y, W, h, Math.sin(t * 80 + i) * 60 * amount, y, W, h); }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2); cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function star(x, y, s, rot) { cx.save(); cx.translate(x, y); cx.rotate(rot); cx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.28 : s; const a = i * Math.PI / 4; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath(); cx.fillStyle = '#fff6c0'; cx.strokeStyle = '#141010'; cx.lineWidth = 7; cx.stroke(); cx.fill(); cx.restore(); }
function sparkle(k) { for (const [x, y, s0] of [[0.3, 0.42, 1], [0.22, 0.36, 0.6], [0.38, 0.34, 0.5]]) { const s = s0 * Math.sin(Math.min(1, k) * Math.PI) * 90; if (s > 0) star(W * x, H * y, s, k * 1.5); } }
function pop(b) {
  const k = b.k, size = b.size || 120;
  const s = k < 0.12 ? 0.4 + (k / 0.12) * 0.75 : 1.15 - 0.15 * ease.o(clamp01((k - 0.12) / 0.15));
  cx.save(); cx.translate(W / 2 + Math.sin(k * 30) * 6 * Math.exp(-k * 4), H * (b.y || 0.3)); cx.rotate(-0.05); cx.scale(s, s);
  cx.font = `900 ${size}px Montserrat`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
  cx.lineWidth = size * 0.22; cx.strokeStyle = '#151012'; cx.strokeText(b.text, 0, 0); cx.fillStyle = b.col; cx.fillText(b.text, 0, 0); cx.restore();
}
function card(k) {
  if (k <= 0) return; const y = H * 0.33 + (1 - ease.o(clamp01(k))) * 140;
  cx.save(); cx.globalAlpha = clamp01(k * 1.5); cx.translate(W / 2, y); cx.rotate(-0.03);
  cx.fillStyle = '#ffffff'; cx.strokeStyle = '#151012'; cx.lineWidth = 12; cx.beginPath(); cx.roundRect(-400, -230, 800, 460, 36); cx.fill(); cx.stroke();
  cx.fillStyle = '#e8202a'; cx.beginPath(); cx.roundRect(-400, -230, 800, 120, [36, 36, 0, 0]); cx.fill(); cx.stroke();
  cx.fillStyle = '#ffffff'; cx.font = '900 64px Montserrat'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('REAL JOB', 0, -168);
  cx.fillStyle = '#151012'; cx.font = '900 130px "WenQuanYi Zen Hei"'; cx.fillText('押し屋', 0, -20);
  cx.font = '900 70px Montserrat'; cx.fillText('OSHIYA', 0, 100);
  cx.font = '800 38px Montserrat'; cx.fillStyle = '#3a8a4a'; cx.fillText('= "PUSHER" · TOKYO', 0, 170);
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
    const probe = shot.run(t, lt / (shot.end - shot.start), shot.end - shot.start) || {};
    if (probe.blur) blur = true;
    const n = blur && !opts.fast ? 5 : 1;
    for (let i = 0; i < n; i++) { const tt = t + (n > 1 ? (i / (n - 1) - 0.5) / 30 * 1.5 : 0); res = renderShot(shot, tt, 1 / (i + 1), whipAt(tt)); }
    if (tr.type === 'fade' && prev && lt < tr.dur) renderShot(prev, t, 1 - lt / tr.dur);
    const fx = res.fx || {};
    if (!fx.bw) grade();
    bloom(0.2);
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(0.24);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.big) pop(fx.big);
    if (fx.card) card(fx.card);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
