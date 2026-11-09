import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildWest, MINE_X, SHOP_X, JEANS_X } from './west.js';
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
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 2000);

const R = buildWest();
const pmrem = new THREE.PMREMGenerator(renderer);
const envFrom = (top, hor, gnd, sunI = 6) => { const s = new THREE.Scene(); s.add(skyDome(top, hor, gnd, 50)); const m = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0d0).multiplyScalar(sunI) })); m.position.copy(R.sun.userData.dir).multiplyScalar(40); s.add(m); return pmrem.fromScene(s, 0.02).texture; };
const ENV = { day: envFrom(0x3a88e8, 0xf6e2b8, 0xc8905a), shop: envFrom(0xb8885a, 0x8a5a32, 0x4a2a14, 2), jeans: envFrom(0xd8e0f0, 0xa8b8d0, 0x4a5a7a, 3) };

// ---------- cast ----------
const JD = { outfit: 'tailor', hair: 'receding', hairColor: '#3a2a1a', mustache: true, glasses: true };
const davis = new Char({ ...JD, expr: 'bored', pose: 'stand' }, 1.9);
const davisShop = new Char({ ...JD, expr: 'bored', pose: 'hammer' }, 1.9); R.shop.add(davisShop.mesh);
const davisEnd = new Char({ ...JD, expr: 'smirk', pose: 'stand' }, 1.5); R.jeans.add(davisEnd.mesh);
R.town.add(davis.mesh);
const miner = new Char({ outfit: 'miner', hat: 'slouch', hair: 'beard', expr: 'neutral', pose: 'stand' }, 1.9); R.mine.add(miner.mesh);
const cowboys = [
  new Char({ outfit: 'cowboy', hat: 'cowboyhat', expr: 'laugh', pose: 'laughbelly' }, 1.9),
  new Char({ outfit: 'cowboy', hat: 'cowboyhat', hatColor: '#3a2a1a', bandana: '#2a5aa8', vestCol: '#2a2a2a', mustache: true, expr: 'laugh', pose: 'point' }, 1.9),
  new Char({ outfit: 'cowboy', hat: 'cowboyhat', hatColor: '#c8a46a', bandana: '#e8c23a', vestCol: '#8a3a2a', expr: 'laugh', pose: 'stand' }, 1.85),
];
cowboys.forEach((c) => R.town.add(c.mesh));
const rival = new Char({ outfit: 'frock', hat: 'bowler', monocle: true, mustache: true, coat: '#4a2a5a', expr: 'angry', pose: 'stand' }, 1.95); R.town.add(rival.mesh);
const levi = new Char({ outfit: 'frock', hat: 'tophat', hair: 'short', expr: 'happy', pose: 'shake' }, 1.95); R.town.add(levi.mesh);
const crowdSpecs = [
  { outfit: 'miner', hat: 'slouch', hair: 'beard', hairColor: '#8a5a2a' }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', blush: true, dress: '#c8a83a' }, { outfit: 'cowboy', hat: 'cowboyhat' },
  { outfit: 'miner', hat: 'slouch', hair: 'beard', hairColor: '#2a1a10', pants: '#5a4a3a' }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', blush: true, dress: '#5a8ac8' }, { outfit: 'cowboy', hat: 'cowboyhat', hatColor: '#3a2a1a', bandana: '#2a8a4a' },
  { outfit: 'frock', hat: 'tophat' }, { outfit: 'miner', hat: 'slouch', hair: 'beard' }, { outfit: 'cowboy', hat: 'cowboyhat', hatColor: '#c8a46a' }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', blush: true, dress: '#a84a6a' },
];
const crowd = crowdSpecs.map((s, i) => { const c = new Char({ ...s, expr: 'neutral', pose: 'stand' }, 1.85); c.base = v3((i % 2 ? 1 : -1) * (1.6 + Math.floor(i / 2) * 0.9), 0, -13.2 - (i % 3) * 0.7); R.town.add(c.mesh); return c; });
const queue = Array.from({ length: 8 }, (_, i) => { const c = new Char({ outfit: 'miner', hat: 'slouch', hair: 'beard', hairColor: ['#5a3a1a', '#8a5a2a', '#2a1a10', '#b8b8c0'][i % 4], pants: ['#3a5a8a', '#5a4a3a'][i % 2], expr: 'happy', pose: 'stand' }, 1.85); R.town.add(c.mesh); return c; });
const longjohn = new Char({ outfit: 'longjohns', hat: 'slouch', hair: 'beard', expr: 'shock', pose: 'stand' }, 1.9); R.town.add(longjohn.mesh);

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

// ---------- state ----------
let place = 'town';
const allTown = [davis, ...cowboys, rival, levi, ...crowd, ...queue, longjohn];
function setPlace(p, t) {
  place = p;
  R.town.visible = p === 'town'; R.mine.visible = p === 'mine'; R.shop.visible = p === 'shop'; R.jeans.visible = p === 'jeans';
  R.sky.visible = p !== 'shop' && p !== 'jeans'; R.ground.visible = p !== 'jeans'; R.clouds.forEach((c) => (c.visible = R.sky.visible));
  R.scene.background = p === 'jeans' ? new THREE.Color(0x1a2a4a) : null;
  R.scene.fog = p === 'town' || p === 'mine' ? new THREE.Fog(0xf6e2b8, 80, 420) : null;
  R.scene.environment = p === 'shop' ? ENV.shop : p === 'jeans' ? ENV.jeans : ENV.day; R.scene.environmentIntensity = 0.8;
  R.sun.intensity = p === 'shop' || p === 'jeans' ? 0 : 3.6; R.hemi.intensity = p === 'shop' ? 0.35 : p === 'jeans' ? 0.5 : 0.6;
  renderer.toneMappingExposure = p === 'shop' ? 1.35 : 1.15;
  tintChars(p === 'shop' ? new THREE.Color(0xfff0dc) : new THREE.Color(0xffffff));
  allTown.forEach((c) => (c.mesh.visible = false));
  R.wm.userData.head.rotation.z = t * 1.5;
  R.tumbles.forEach((tb, i) => { const x = ((t * 2.2 + i * 9) % 30) - 15; tb.position.set(x, 0.7 + Math.abs(Math.sin(t * 4 + i)) * 0.4, -4 - i * 10); tb.rotation.set(t * 3, 0, -t * 3); });
  R.dust.position.x = Math.sin(t * 0.3) * 0.5;
  R.hats.forEach((h) => (h.visible = false));
  R.horses.forEach((h) => (h.visible = false)); R.pants.visible = false; R.ropes.forEach((r) => (r.visible = false)); R.rivetGlow.forEach((g) => (g.visible = false));
}
function testState(t, opt = {}) {
  const pull = opt.pull || 0, holdK = opt.hold || 0, torn = opt.torn || 0;
  R.horses.forEach((h) => (h.visible = true)); R.pants.visible = true;
  const jitter = pull > 0 ? Math.sin(t * 22) * 0.04 * pull : 0;
  const stretch = 1 + pull * 0.16 + jitter;
  R.pants.position.set(0, 1.55, -10); R.pants.scale.set(stretch, 1, 1);
  R.pants.material.map = torn > 0 ? R.pantsT.torn[Math.min(2, Math.floor(torn * 3))] : (opt.plain ? R.pantsT.plain : R.pantsT.riv); R.pants.material.needsUpdate = true;
  R.pants.lookAt(camera.position.x, 1.55, camera.position.z);
  const hx = 3.4 + pull * 0.35 + (torn > 0.6 ? torn * 2.5 : 0);
  R.horses.forEach((h, i) => { const s = i ? 1 : -1; h.position.set(s * hx + Math.sin(t * 7 + i) * 0.05 * pull, 0, -10.1); h.scale.x = s; h.material.map = R.horseT[pull > 0.05 ? 1 : 0]; h.lookAt(camera.position.x, 0, camera.position.z); h.scale.x = s * (i ? 1 : 1); h.rotation.z = torn > 0.6 ? s * -0.5 * (torn - 0.6) : 0; });
  R.ropes.forEach((r, i) => { const s = i ? 1 : -1; const a = v3(s * 0.75 * stretch, 1.9, -10), b = v3(s * (hx - 1.1), 1.35, -10.05); r.position.copy(a).lerp(b, 0.5); r.scale.set(1, a.distanceTo(b), 1); r.quaternion.setFromUnitVectors(v3(0, 1, 0), b.clone().sub(a).normalize()); r.visible = torn < 0.6; });
  R.rivetGlow.forEach((g, i) => { const p = [[-0.47, 2.43], [-0.12, 2.29], [0.47, 2.43], [0.12, 2.29]][i]; g.visible = !opt.plain && pull > 0.3; g.position.set(p[0] * stretch, p[1], -9.98); g.scale.setScalar(0.25 + pull * 0.35 + Math.sin(t * 15 + i) * 0.05); });
  crowd.forEach((c, i) => { c.mesh.visible = true; const cheer = holdK > 0; c.set({ expr: cheer ? 'laugh' : (pull > 0.2 ? 'shock' : 'neutral'), pose: cheer ? (i % 2 ? 'stuck' : 'laughbelly') : 'stand' }); c.mesh.position.set(c.base.x, cheer ? Math.abs(Math.sin(t * 9 + i)) * 0.25 : 0, c.base.z); c.face(camera); });
  R.hats.forEach((h, i) => { if (holdK <= 0) return; const q = (holdK * 1.4 + hsh(i) * 0.3) % 1.2; h.visible = q < 1; const b = crowd[i % crowd.length].base; h.position.set(b.x + (hsh(i, 1) - 0.5) * 1.2, 2.2 + Math.sin(q * Math.PI) * 4, b.z); h.rotation.set(q * 8, q * 5, 0); });
}

// ---------- shots ----------
const PZ = -2.75;
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      setPlace('shop', t); const e = ease.io(sw(t, 0.4, S.place - 0.1));
      const swing = Math.floor(t * 4) % 2 === 0;
      davisShop.set({ ...JD, pose: 'hammer', swing, expr: e > 0.5 ? 'determined' : 'bored' }); davisShop.mesh.position.set(0.35, 0, PZ); davisShop.face(camera);
      R.rivetsOnPants.forEach((r, i) => (r.visible = i < 1)); R.benchPants.material.map = R.pantsT.plain;
      R.sparks.forEach((s, i) => { s.visible = swing && i < 6; s.position.set(SHOP_X - 0.64 + (hsh(i, 1) - 0.5) * 0.4, 1.15 + hsh(i, 2) * 0.35, -2.08 + (hsh(i, 3) - 0.5) * 0.3); s.scale.setScalar(0.12 + hsh(i, 4) * 0.15); });
      look(v3(SHOP_X + lerp(-0.2, 0.3, e), lerp(1.55, 1.8, e), lerp(0.5, 0.6, e)), v3(SHOP_X + lerp(-0.1, 0.35, e), lerp(1.15, 1.5, e), lerp(-2.0, PZ, e)), lerp(44, 42, e));
      return {};
  } },
  { id: 'place', start: S.place, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('town', t); const e = ease.io(u);
      look(path([v3(-2, 18, 30), v3(1, 9, 16), v3(2, 2.2, 7)], e), path([v3(0, 4, -30), v3(0, 2.5, -14), v3(-1, 1.6, -4)], e), 50);
      return {};
  } },
  { id: 'rip', start: S.rip, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('mine', t); const ripT = WT('rip', 4);
      const walk = sw(t, S.rip, ripT); const ripped = t >= ripT;
      miner.mesh.visible = true; miner.set({ pose: ripped ? 'stuck' : (Math.floor(t * 4) % 2 ? 'walk1' : 'walk2'), expr: ripped ? 'shock' : 'strain', sweat: !ripped, ripped });
      miner.mesh.position.set(0.6, 0, lerp(0.8, 3.0, walk)); miner.face(camera);
      R.nuggets.forEach((n, i) => { const d = t - ripT - hsh(i) * 0.4; n.visible = d > 0; if (d > 0) { const p0 = miner.worldPoint(330, 650); const vx = (hsh(i, 1) - 0.3) * 1.6, vz = (hsh(i, 2) - 0.2) * 1.2; let y = p0.y + 0.5 * d - 4.9 * d * d; let bt = d; if (y < 0.1) { y = 0.1 + Math.abs(Math.sin(d * 6)) * 0.15 * Math.exp(-d * 3); bt = Math.sqrt((p0.y + 0.1) / 4.9); } n.position.set(p0.x - MINE_X + vx * bt, y, p0.z + vz * bt); n.rotation.set(d * 6, d * 4, 0); } });
      const e = ease.sine(u);
      look(v3(MINE_X + lerp(3.2, 2.4, e), lerp(1.5, 1.2, e), lerp(7.5, 5.8, e)), v3(MINE_X + 0.5, lerp(1.4, 0.9, e), 2.6), 46, 0.04);
      return {};
  } },
  { id: 'idea', start: S.idea, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('shop', t);
      const ham = t >= WT('idea', 12);
      const swing = ham && Math.floor(t * 6) % 2 === 0;
      davisShop.set({ ...JD, pose: ham ? 'hammer' : 'point', swing, expr: ham ? 'smirk' : 'aha' }); davisShop.mesh.position.set(0.35, 0, PZ); davisShop.face(camera);
      const n = ham ? Math.min(4, Math.floor(sw(t, WT('idea', 13), S.laugh) * 5)) : 0; R.rivetsOnPants.forEach((r, i) => (r.visible = i < n));
      R.sparks.forEach((s, i) => { s.visible = swing && i < 6; s.position.set(SHOP_X - 0.64 + (hsh(i, 1) - 0.5) * 0.5, 1.15 + hsh(i, 2) * 0.35, -2.0); s.scale.setScalar(0.12 + hsh(i, 4) * 0.15); });
      if (!ham) look(v3(SHOP_X + 2.4, 1.6, -0.2), v3(SHOP_X + 1.2, 1.25, -1.4), 40, -0.03);
      else look(v3(SHOP_X + 1.0, 2.1, 0.6), v3(SHOP_X + 0.1, 1.35, -2.2), 48, 0.02);
      return {};
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('town', t);
      cowboys.forEach((c, i) => { c.mesh.visible = true; c.set({ expr: 'laugh', pose: ['laughbelly', 'point', 'stuck'][i] }); c.mesh.position.set(-7.8 + i * 0.2, 0.25 + Math.abs(Math.sin(t * 9 + i)) * 0.06, 1.4 - i * 1.1); c.face(camera, i === 1 ? false : i === 2); });
      look(v3(lerp(-3.6, -3.9, u), 1.55, lerp(3.6, 3.2, u)), v3(-7.8, 1.5, 0.3), 46, -0.07);
      return {};
  } },
  { id: 'rival', start: S.rival, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('town', t); const e = ease.io(u);
      const wk = sw(t, S.rival - 0.4, S.rival + 0.9);
      const spec = { pose: wk < 1 ? (Math.floor(t * 6) % 2 ? 'walk1' : 'walk2') : 'stand', expr: 'angry', faceColor: '#ffffff', steam: false };
      if (t >= WT('rival', 4)) { spec.faceColor = '#ef6b5b'; spec.steam = true; }
      if (t >= WT('rival', 5)) { spec.pose = 'fist'; spec.expr = 'shout'; }
      rival.mesh.visible = true; rival.set(spec); const rz = lerp(-14, -10.5, ease.o(wk)); rival.mesh.position.set(-6.0, 0, rz);
      look(v3(lerp(-3.4, -4.4, e), lerp(0.8, 1.2, e), lerp(rz + 4.0, rz + 2.4, e)), v3(-6.0, lerp(1.5, 1.7, e), rz), lerp(50, 40, e), 0.04);
      rival.face(camera);
      return {};
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('shop', t); const hamT = WT('shrug', 2);
      const swing = t >= hamT && Math.floor(t * 7) % 2 === 0;
      davisShop.set({ ...JD, pose: t < hamT ? 'shrug' : 'hammer', swing, expr: t < hamT ? 'bored' : 'smirk' }); davisShop.mesh.position.set(0.35, 0, PZ);
      R.rivetsOnPants.forEach((r) => (r.visible = true));
      R.sparks.forEach((s, i) => { s.visible = swing && i < 8; s.position.set(SHOP_X - 0.64 + (hsh(i + Math.floor(t * 7), 1) - 0.5) * 0.5, 1.15 + hsh(i, 2) * 0.4, -2.0); s.scale.setScalar(0.12 + hsh(i, 4) * 0.18); });
      look(v3(SHOP_X + 0.5, 1.75, -0.6), v3(SHOP_X + 0.35, 1.55, PZ), 40);
      davisShop.face(camera);
      return {};
  } },
  { id: 'test', start: S.test, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('town', t); testState(t, { pull: 0 });
      davis.mesh.visible = true; davis.set({ ...JD, pose: 'stand', expr: 'determined' }); davis.mesh.position.set(1.4, 0, -7.6); davis.face(camera);
      if (t < WT('test', 3)) look(v3(0, 0.6, 2), v3(0, 1.6, -10), 44);
      else if (t < WT('test', 5)) look(v3(-6.4, 1.8, -4.4), v3(-3.6, 1.4, -10), 44, -0.05);
      else if (t < WT('test', 9)) look(v3(0.25, 1.7, -7.2), v3(0, 1.6, -10), 40);
      else { const e = ease.io(sw(t, WT('test', 9), S.hold)); look(v3(0, lerp(2.4, 3.6, e), lerp(-2, 1, e)), v3(0, 1.4, -10), 54); testState(t, { pull: e * 0.4 }); }
      return {};
  } },
  { id: 'hold', start: S.hold, run(t, u) {
      setPlace('town', t);
      const holdT = WT('hold', 6); const pull = t < holdT ? lerp(0.4, 1.0, sw(t, S.hold, holdT)) : lerp(1.0, 0.3, sw(t, holdT + 0.4, S.line));
      testState(t, { pull, hold: t >= WT('hold', 8) ? sw(t, WT('hold', 8), S.line) : 0 });
      davis.mesh.visible = true; davis.set({ ...JD, pose: t >= WT('hold', 8) ? 'stuck' : 'stand', expr: t >= WT('hold', 8) ? 'happy' : 'strain', sweat: t < WT('hold', 8) }); davis.mesh.position.set(1.4, 0, -7.6); davis.face(camera);
      const sh = t < holdT ? 0.03 * pull : 0;
      if (t < WT('hold', 3)) look(v3(0.4 + Math.sin(t * 40) * sh, 1.9, -7.4), v3(0, 1.9, -10), 36);
      else if (t < holdT) look(v3(6.6, 1.5, -4.4), v3(3.8, 1.4, -10), 44, 0.06);
      else look(v3(0, 2.6, -1.5), v3(0, 1.6, -10), 54);
      return {};
  } },
  { id: 'line', start: S.line, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('town', t); const e = ease.sine(u);
      queue.forEach((c, i) => { c.mesh.visible = true; c.set({ pose: Math.floor(t * 3 + i) % 3 === 0 ? 'walk1' : 'stand', expr: 'happy' }); c.mesh.position.set(7.9, 0.25, 1.8 + i * 1.1); c.face(camera); });
      look(v3(lerp(3.8, 3.2, e), 1.8, lerp(14, 9, e)), v3(8.4, 1.4, 0.5), 48, -0.03);
      return {};
  } },
  { id: 'levi', start: S.levi, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('town', t); const e = ease.sine(u);
      davis.mesh.visible = levi.mesh.visible = true;
      davis.set({ ...JD, pose: 'shake', expr: 'happy' }); levi.set({ pose: 'shake', expr: t >= WT('levi', 8) ? 'aha' : 'happy' });
      davis.mesh.position.set(6.0, 0, -0.8); levi.mesh.position.set(6.0, 0, 0.5);
      look(v3(lerp(2.6, 3.0, e), 1.7, lerp(-0.2, 0.0, e)), v3(6.0, 1.5, -0.15), 44);
      davis.face(camera, false); levi.face(camera, true);
      return {};
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      setPlace('town', t);
      const k = sw(t, S.whatif + 0.4, WT('whatif', 3));
      testState(t, { pull: 1, plain: true, torn: t > WT('whatif', 2) ? 0.4 + k * 0.8 : 0 });
      longjohn.mesh.visible = t >= WT('whatif', 5); longjohn.set({ expr: 'shock', pose: 'stuck' }); longjohn.mesh.position.set(-0.4, 0, -6.2); longjohn.face(camera);
      look(v3(0, lerp(2.2, 1.8, u), lerp(-1, -2.2, u)), v3(0, 1.4, -10), 54, -0.05);
      return { fx: { bw: 1 } };
  } },
  { id: 'end', start: S.end, run(t, u) {
      setPlace('jeans', t); const e = ease.io(u);
      R.bigRivets.forEach((r, i) => (r.rotation.z = t * 0.2 + i));
      davisEnd.set({ ...JD, expr: t > TL.speechEnd + 0.2 ? 'wink' : 'smirk', pose: 'stand' }); davisEnd.mesh.position.set(1.55, -2.9, 0.6); davisEnd.face(camera);
      const zoom = t >= WT('end', 4);
      look(v3(JEANS_X + (zoom ? lerp(-1.8, -2.2, sw(t, WT('end', 4), WT('end', 8))) : lerp(0, -0.6, e)), zoom ? lerp(1.4, 1.7, sw(t, WT('end', 4), WT('end', 8))) : lerp(0.2, 0.6, e), zoom ? lerp(2.4, 1.6, sw(t, WT('end', 4), WT('end', 8))) : lerp(6, 4.6, e)), v3(JEANS_X + (zoom ? -2.3 : -0.4), zoom ? 1.6 : 0, 0), zoom ? 40 : 50);
      if (t >= WT('end', 8)) look(v3(JEANS_X + 1.1, -1.9, 3.6), v3(JEANS_X + 1.5, -2.2, 0.6), 46);
      return { fx: { rewind: clamp01(1 - (t - S.end) / 0.4), sparkle: t > TL.speechEnd + 0.25 ? (t - TL.speechEnd - 0.25) / 0.6 : 0 } };
  } },
];
for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : TL.duration;
const shotAt = (t) => { let s = shots[0]; for (const x of shots) if (t >= x.start) s = x; return s; };

function renderShot(shot, t, alpha = 1, whip = 0) {
  const res = shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start) || {};
  if (whip) camera.rotateY(whip);
  renderer.render(R.scene, camera);
  cx.save(); cx.globalAlpha = alpha;
  cx.filter = res.fx && res.fx.bw ? 'grayscale(1) contrast(1.3) brightness(0.95)' : 'saturate(1.2) contrast(1.05)';
  cx.drawImage(glCanvas, 0, 0, W, H); cx.restore();
  return res;
}
function bloom(a = 0.2) { sx.filter = 'brightness(1.05) contrast(1.8) blur(5px)'; sx.clearRect(0, 0, small.width, small.height); sx.drawImage(comp, 0, 0, small.width, small.height); cx.save(); cx.globalCompositeOperation = 'screen'; cx.globalAlpha = a; cx.drawImage(small, 0, 0, W, H); cx.restore(); }
function vignette(s = 0.3) { const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
function grade() { cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = 0.18; const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe0a0'); g.addColorStop(1, '#a0603a'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
function vhs(t, amount) {
  if (amount <= 0) return;
  for (let i = 0; i < 9; i++) { const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60); cx.drawImage(comp, 0, y, W, h, Math.sin(t * 80 + i) * 60 * amount, y, W, h); }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2); cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function sparkle(k) {
  for (const [x, y, s0] of [[0.66, 0.6, 1], [0.74, 0.55, 0.6], [0.6, 0.54, 0.5]]) {
    const s = s0 * Math.sin(Math.min(1, k) * Math.PI) * 90; if (s <= 0) continue;
    cx.save(); cx.translate(W * x, H * y); cx.rotate(k * 1.5); cx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.28 : s; const a = i * Math.PI / 4; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath();
    cx.fillStyle = '#fff6c0'; cx.strokeStyle = '#141010'; cx.lineWidth = 7; cx.stroke(); cx.fill(); cx.restore();
  }
}
function captions(t) {
  const g = TL.groups.find((x) => t >= x.start && t < x.hide); if (!g) return;
  const k = clamp01((t - g.start) / 0.07), s = 1.12 - 0.12 * ease.o(k);
  cx.save(); cx.translate(W / 2, H * 0.355); cx.scale(s, s);
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
    if (!fx.bw && place !== 'jeans') grade();
    bloom(0.2);
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(place === 'shop' ? 0.4 : 0.26);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
