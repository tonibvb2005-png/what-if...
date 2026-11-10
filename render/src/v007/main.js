import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildKingdom, THRONE_X, BARN_X, ratCanvas } from './kingdom.js';
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
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.12;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 2000);

const R = buildKingdom();
const pmrem = new THREE.PMREMGenerator(renderer);
const envFrom = (top, hor, gnd, sunI = 6) => { const s = new THREE.Scene(); s.add(skyDome(top, hor, gnd, 50)); const m = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff0d0).multiplyScalar(sunI) })); m.position.copy(R.sun.userData.dir).multiplyScalar(40); s.add(m); return pmrem.fromScene(s, 0.02).texture; };
const ENV = { day: envFrom(0x3a86e8, 0xffe8c0, 0x6a8a4a), throne: envFrom(0x6a4a3a, 0x8a5a32, 0x3a2414, 1.5), barn: envFrom(0x5a3a22, 0x7a5232, 0x3a2414, 1.5) };

// ---------- cast ----------
const KING = { outfit: 'king', hat: 'crown', hair: 'muttonchops', hairColor: '#d8d0c4', mustache: true };
const RC = { outfit: 'ratcatcher', hat: 'hood', hatColor: '#4a6a32', stubble: true };
const king = new Char({ ...KING, expr: 'smirk', pose: 'coin' }, 1.9);
const catcher = new Char({ ...RC, expr: 'smirk', pose: 'cage' }, 1.9);
const herald = new Char({ outfit: 'herald', hat: 'feathercap', expr: 'determined', pose: 'scroll' }, 1.9);
const TRS = { outfit: 'treasurer', hat: 'hood', hatColor: '#3a2a6a', monocle: true, mustache: true };
const treasurer = new Char({ ...TRS, expr: 'neutral', pose: 'stand' }, 1.9);
const peasantSpecs = [
  { outfit: 'worker', tunic: '#8a5a3a', hair: 'short' }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', blush: true, dress: '#6a8a4a' },
  { outfit: 'worker', tunic: '#5a6a9a', hair: 'curly', hairColor: '#8a4a1a', stubble: true }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', blush: true, dress: '#a84a5a' },
  { outfit: 'worker', tunic: '#9a7a3a', hat: 'hood', hatColor: '#8a3a2a' }, { outfit: 'worker', tunic: '#4a7a5a', hair: 'short', hairColor: '#e8c070', mustache: true },
  { outfit: 'dress', hat: 'bonnet', hair: 'long', blush: true, dress: '#5a6aa8' }, { outfit: 'worker', tunic: '#7a4a6a', hat: 'hood', hatColor: '#3a5a8a' },
];
const peasants = peasantSpecs.map((s) => new Char({ ...s, expr: 'neutral', pose: 'stand' }, 1.85));
const all = [king, catcher, herald, treasurer, ...peasants];
all.forEach((c) => R.scene.add(c.mesh));

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d'); document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6; const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d'); const img = x.createImageData(360, 640); for (let i = 0; i < img.data.length; i += 4) { const v = Math.abs((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); return c; });
const ratImg = ratCanvas(0).image;

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
const walkPose = (t, f = 4, o = 0) => (Math.floor(t * f + o) % 2 ? 'walk1' : 'walk2');
const shake = (t, a) => v3(Math.sin(t * 37) * a, Math.sin(t * 29 + 1) * a, 0);

// ---------- state ----------
let place = 'town';
function setPlace(p, t) {
  place = p;
  R.town.visible = p === 'town'; R.throne.visible = p === 'throne'; R.barn.visible = p === 'barn';
  const out = p === 'town'; R.sky.visible = out; R.ground.visible = out; R.castle.visible = out; R.clouds.forEach((c) => (c.visible = out));
  R.scene.background = out ? null : new THREE.Color(0x120c08);
  R.scene.fog = out ? new THREE.Fog(0xffe8c0, 90, 520) : null;
  R.scene.environment = p === 'throne' ? ENV.throne : p === 'barn' ? ENV.barn : ENV.day; R.scene.environmentIntensity = out ? 0.8 : 0.55;
  R.sun.intensity = out ? 3.4 : 0; R.hemi.intensity = out ? 0.65 : p === 'barn' ? 0.4 : 0.22;
  renderer.toneMappingExposure = out ? 1.12 : 1.3;
  tintChars(out ? new THREE.Color(0xffffff) : new THREE.Color(0xffe2c0));
  all.forEach((c) => (c.mesh.visible = false));
  // candle flicker
  R.tLights.forEach((l, i) => (l.intensity = [16, 16, 10, 8][i] * (0.88 + 0.12 * Math.sin(t * 13 + i * 2) * Math.sin(t * 7.3 + i))));
  R.lanternLights.forEach((l, i) => (l.intensity = 16 * (0.85 + 0.15 * Math.sin(t * 11 + i * 3))));
  R.flames.forEach((f, i) => f.scale.setScalar(0.45 * (0.9 + 0.12 * Math.sin(t * 17 + i))));
  R.castle.children.forEach((c) => { if (c.geometry && c.geometry.type === 'PlaneGeometry' && c.position.y > 40) c.rotation.y = Math.sin(t * 3 + c.position.x) * 0.25; });
  R.rats.set([], camera, t); R.coins.set([]); R.tRats.set([], camera, t); R.tCoins.set([]); R.bRats.set([], camera, t);
  R.tails.forEach((m) => (m.visible = false)); R.cheeses.forEach((c) => (c.visible = false)); R.cageDoors.forEach((d) => (d.rotation.y = 0));
}
const at = (c, x, y, z, flip = false) => { c.mesh.visible = true; c.mesh.position.set(x, y, z); c.face(camera, flip); };
let signN = 10000, signFlip = 0;
function sign(n, flipK = 0) { R.sign.userData.draw(n, flipK); }

// scurrying rats in the square: n rats crossing on straight lanes
function scurry(t, n, opts = {}) {
  const list = [];
  for (let i = 0; i < n; i++) {
    const lane = (hsh(i, 1) - 0.5) * (opts.spread || 26), sp = 2.2 + hsh(i, 2) * 2.2, dir = hsh(i, 3) > 0.5 ? 1 : -1;
    const L = 40, p = ((t * sp + hsh(i, 4) * L) % L) - L / 2;
    const ax = hsh(i, 5) > 0.5;
    const x = ax ? p * dir : lane, z = (ax ? lane : p * dir) + (opts.z0 || 0) - 2;
    list.push({ x, z, dx: ax ? dir : 0, dz: ax ? 0 : dir, hop: Math.abs(Math.sin(t * 14 + i)) * 0.05 });
  }
  return list;
}
// rats inside barn cages; k = 0..1 fill amount
function cageRats(k, t, released = 0) {
  const list = [];
  R.cages.forEach((g, ci) => {
    const n = Math.round(k * (4 + (ci % 3)));
    for (let j = 0; j < n; j++) {
      const id = ci * 10 + j;
      let x = g.position.x + (hsh(id, 1) - 0.5) * 1.3 + Math.sin(t * 3 + id) * 0.1, y = g.position.y + 0.06, z = g.position.z + (hsh(id, 2) - 0.5) * 1.0;
      let dx = Math.sin(t * 2 + id), dz = 0;
      const d = released - hsh(id, 3) * 0.5;
      if (d > 0) { const run = d * 9; y = Math.max(0.0, y - run * 1.5); z += Math.min(run * 1.6, 13); x += (hsh(id, 4) - 0.5) * run * 1.2; dz = 1; dx = 0; }
      list.push({ x, y, z, dx, dz, s: 0.9, hop: Math.abs(Math.sin(t * 15 + id)) * 0.04 });
    }
  });
  return list;
}

// ---------- shots ----------
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      setPlace('throne', t); const e = ease.io(u);
      king.set({ ...KING, pose: 'coin', expr: 'smirk' }); at(king, THRONE_X, 0.6, -8.6);
      const rx = lerp(6, -6, sw(t, 0.6, 2.6));
      R.tRats.set([{ x: rx, z: -3.5 + Math.sin(t * 3) * 0.2, dx: -1, dz: 0, s: 1.1, hop: Math.abs(Math.sin(t * 15)) * 0.05 }], camera, t);
      look(v3(THRONE_X + lerp(0.6, 0.2, e), lerp(1.2, 2.0, e), lerp(3, -4.4, e)), v3(THRONE_X + lerp(0, 0.25, e), lerp(2.2, 2.4, e), -8.6), lerp(46, 36, e), lerp(0.03, 0, e));
      const cp = king.worldPoint(446, 210).project(camera);
      return { fx: { glint: { x: cp.x * 0.5 + 0.5, y: 0.5 - cp.y * 0.5, k: sw(t, 0.5, 1.2) } } };
  } },
  { id: 'place', start: S.place, trans: { type: 'fade', dur: 0.35 }, run(t, u) {
      setPlace('town', t);
      const flipT = WT('place', 7);
      sign(10000, t > flipT - 0.3 && t < flipT + 0.2 ? sw(t, flipT - 0.3, flipT + 0.2) : 0);
      R.rats.set(scurry(t, t > flipT - 0.5 ? 60 : 18), camera, t);
      peasants.slice(0, 3).forEach((p, i) => { p.set({ pose: 'stand', expr: 'shock' }); at(p, -2 + i * 2.2, 0, 2 - i * 0.7, i === 1); });
      if (t < WT('place', 6)) { const e = ease.io(sw(t, S.place, WT('place', 6))); look(path([v3(14, 26, 34), v3(6, 12, 20), v3(-1.5, 3.6, 7)], e), path([v3(0, 18, -125), v3(-2, 6, -40), v3(-5.5, 3, -1)], e), lerp(52, 46, e)); }
      else { const e = ease.o(sw(t, WT('place', 6), S.decree)); look(v3(lerp(-1.6, -2.3, e), lerp(3.4, 3.0, e), lerp(9.6, 8.2, e)), v3(-5.5, 3, -1), 38); }
      return {};
  } },
  { id: 'decree', start: S.decree, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('town', t); sign(10000);
      herald.set({ pose: 'scroll', expr: t > WT('decree', 6) ? 'determined' : 'neutral' }); at(herald, -3.6, 1.0, -11.2);
      king.set({ ...KING, pose: 'coin', expr: 'smirk' }); at(king, -2.1, 1.0, -11.5);
      peasants.forEach((p, i) => { p.set({ pose: t > WT('decree', 12) ? (i % 2 ? 'stuck' : 'point') : 'stand', expr: t > WT('decree', 12) ? 'happy' : 'neutral' }); at(p, [-8.2, -6.8, 1.4, 2.8, -7.6, 2.2, -9.2, 3.8][i], 0, [-7, -6.4, -6.8, -6.2, -4.6, -4.4, -5.4, -5.2][i], i % 2 === 1); });
      R.rats.set(scurry(t, 10, { z0: 4 }), camera, t);
      const e = ease.io(u);
      if (t < WT('decree', 6)) look(v3(lerp(-1.0, -1.6, e), 1.5, lerp(0.5, -1.5, e)), v3(-2.2, 1.9, -11), 44);
      else look(v3(-2.2 + Math.sin(t) * 0.1, 2.1, -7.4), v3(-2.4, 2.3, -11.2), 40, 0.03);
      return { fx: { big: t > WT('decree', 11) ? { text: '1 TAIL = 1 GOLD', k: t - WT('decree', 11), col: '#f2c23a' } : null } };
  } },
  { id: 'hunt', start: S.hunt, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('town', t); sign(10000);
      const coinT = WT('hunt', 7);
      if (t < coinT) {
        peasants.forEach((p, i) => { const sp = 1.4 + hsh(i, 3); const px = -9 + ((t * sp + i * 3.1) % 18); p.set({ pose: 'broom', swing: Math.floor(t * 5 + i) % 2 === 0, expr: 'determined' }); at(p, px, 0, -2 - (i % 4) * 2.2, false); });
        R.rats.set(scurry(t * 1.6, 70, { spread: 16 }), camera, t);
        const e = ease.sine(u * 1.4);
        look(v3(lerp(-2, 2, e), 1.3, 7.5).add(shake(t, 0.05)), v3(lerp(-1, 1, e), 1.0, -4), 50, Math.sin(t * 2) * 0.03);
      } else {
        treasurer.set({ ...TRS, pose: 'coin', expr: 'neutral' }); at(treasurer, 6.6, 0, -4.2);
        const k = sw(t, coinT, S.weird);
        R.tails.forEach((m, i) => (m.visible = i < 2 + k * 10));
        peasants.slice(0, 3).forEach((p, i) => { p.set({ pose: 'tails', expr: 'happy' }); at(p, 3.0 + i * 0.9, 0, -1.2 + i * 0.9, true); });
        const list = []; for (let i = 0; i < 40; i++) { const d = (t - coinT) * 1.4 - hsh(i, 1) * 1.2; if (d < 0 || d > 1) continue; const a = v3(6.2, 1.6, -3.6), b = v3(2.0 + hsh(i, 2) * 3, 0.05, 0 + hsh(i, 3) * 2.5); const p = a.clone().lerp(b, d); p.y = lerp(a.y, b.y, d) + Math.sin(d * Math.PI) * 2.4; list.push({ x: p.x, y: p.y, z: p.z, rx: d * 12 + i, rz: d * 7 }); }
        for (let i = 0; i < 40; i++) list.push({ x: 2.4 + hsh(i, 5) * 2.6, y: 0.03 + (i % 3) * 0.035, z: 0.3 + hsh(i, 6) * 2, rx: 0, ry: i });
        R.coins.set(list);
        look(v3(1.4, 1.8, 3.6), v3(5.2, 1.4, -3.4), 48, -0.04);
      }
      return { blur: false };
  } },
  { id: 'weird', start: S.weird, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const farmT = WT('weird', 8);
      if (t < farmT) {
        setPlace('town', t); sign(10000);
        const e = sw(t, S.weird, farmT);
        catcher.set({ ...RC, pose: 'cage', expr: 'smirk', rat: true }); const px = lerp(-4, 3, e); at(catcher, px, 0, 3.2);
        peasants.slice(3).forEach((p, i) => { p.set({ pose: 'broom', swing: Math.floor(t * 5 + i) % 2 === 0, expr: 'determined' }); at(p, -8 + ((t * 1.6 + i * 3) % 16), 0, -3 - i * 1.6); });
        R.rats.set(scurry(t * 1.4, 30, { spread: 14, z0: -2 }), camera, t);
        look(v3(px - 0.4, 1.7, 7.4), v3(px + 0.3, 1.5, 3.2), 42);
      } else {
        setPlace('barn', t);
        const e = ease.io(sw(t, farmT, S.cheese));
        catcher.set({ ...RC, pose: 'stand', expr: 'smirk' }); at(catcher, BARN_X + 1.2, 0, -1.4);
        R.bRats.set(cageRats(0.5, t), camera, t);
        look(v3(BARN_X + lerp(-1.5, 0.2, e), lerp(2.6, 2.0, e), lerp(5.2, 3.6, e)), v3(BARN_X + 0.4, 1.7, -4), lerp(56, 50, e));
      }
      return {};
  } },
  { id: 'cheese', start: S.cheese, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('barn', t);
      const toss = Math.floor(t * 2.5) % 2 === 0;
      catcher.set({ ...RC, pose: toss ? 'toss' : 'stand', expr: 'smirk' }); at(catcher, BARN_X + 1.0, 0, -1.6);
      R.bRats.set(cageRats(0.5 + u * 0.5, t), camera, t);
      R.cheeses.forEach((c, i) => { const d = ((t * 1.2 + i * 0.33) % 1.6) / 1.1; c.visible = d < 1 && i < 6; const a = v3(1.4, 2.2, -1.4), b = v3(-4 + (i % 6) * 2, 0.6 + (i % 3) * 1.6, -4.6); const p = a.lerp(b, d); p.y += Math.sin(d * Math.PI) * 1.6; c.position.copy(p); c.rotation.set(d * 9, d * 4, 0); });
      const e = ease.sine(u);
      if (t < WT('cheese', 4)) look(v3(BARN_X + 2.6, 1.6, 1.8), v3(BARN_X + 0.6, 1.6, -2.2), 44, 0.03);
      else look(v3(BARN_X + lerp(-2.6, -1.6, e), lerp(1.0, 1.4, e), lerp(-1.2, -1.8, e)), v3(BARN_X - 2.2, 1.4, -5), 50, -0.04);
      return {};
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('barn', t);
      R.bRats.set(cageRats(1, t), camera, t);
      [peasants[0], peasants[1], peasants[5]].forEach((p, i) => { p.set({ pose: ['laughbelly', 'point', 'laughbelly'][i], expr: 'laugh' }); at(p, BARN_X - 1.0 + i * 1.0, Math.abs(Math.sin(t * 9 + i)) * 0.06, 5.0 - (i % 2) * 0.4, i === 1); });
      const e = ease.sine(u);
      look(v3(BARN_X + lerp(1.0, 0.6, e), 1.6, lerp(-1.6, -0.6, e)), v3(BARN_X - 0.1, 1.5, 5.2), 40, 0.04);
      return {};
  } },
  { id: 'treasurer', start: S.treasurer, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const moreT = WT('treasurer', 10);
      if (t < moreT) {
        setPlace('throne', t);
        const mad = t > WT('treasurer', 4);
        treasurer.set({ ...TRS, pose: mad ? 'fist' : 'stand', expr: mad ? 'shout' : 'angry', faceColor: mad ? '#ef6b5b' : '#ffffff', steam: mad }); at(treasurer, THRONE_X + 2.6, 0, -3.6);
        R.tCoins.set([{ x: 0.3, y: 0.08, z: 0.1 }, { x: -0.4, y: 0.08, z: -0.2 }]);
        const e = ease.io(sw(t, S.treasurer, moreT));
        look(v3(THRONE_X + lerp(0.6, 1.4, e), lerp(1.3, 1.7, e), lerp(0.8, -0.6, e)).add(shake(t, mad ? 0.02 : 0)), v3(THRONE_X + 3.4, 1.6, -4.0), lerp(46, 40, e));
      } else {
        setPlace('town', t);
        const fk = sw(t, moreT, moreT + 0.5); sign(fk > 0.5 ? 20000 : 10000, fk < 1 ? fk : 0);
        R.rats.set(scurry(t, 140), camera, t);
        look(v3(-2.3, 3.0, 8.2).add(shake(t, 0.02)), v3(-5.5, 3, -1), 38);
      }
      return {};
  } },
  { id: 'cancel', start: S.cancel, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('throne', t);
      king.set({ ...KING, pose: 'scroll', expr: t > WT('cancel', 4) ? 'angry' : 'neutral' }); at(king, THRONE_X, 0.6, -8.6);
      R.tRats.set(Array.from({ length: 6 }, (_, i) => ({ x: ((t * 2 + i * 2.4) % 14) - 7, z: -5 + (i % 3), dx: 1, s: 0.9 })), camera, t);
      const e = ease.io(u);
      look(v3(THRONE_X + lerp(-1.2, -0.4, e), lerp(1.5, 1.9, e), lerp(-3.2, -5.0, e)), v3(THRONE_X, 1.9, -8.6), 42, -0.03);
      return { fx: { stamp: t > WT('cancel', 4) ? t - WT('cancel', 4) : null } };
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('barn', t);
      const openT = WT('shrug', 5);
      catcher.set({ ...RC, pose: t < openT ? 'shrug' : 'point', expr: t < openT ? 'bored' : 'smirk' }); at(catcher, BARN_X + 0.4, 0, -1.4);
      const rel = t > openT ? sw(t, openT + 0.1, openT + 2.2) : 0;
      R.cageDoors.forEach((d, i) => (d.rotation.y = -Math.min(1, Math.max(0, (t - openT) * 4 - hsh(i) * 1.5)) * 1.9));
      R.bRats.set(cageRats(1, t, rel), camera, t);
      if (t < openT) look(v3(BARN_X + 0.4, 1.7, 1.6), v3(BARN_X + 0.4, 1.6, -1.4), 40);
      else { const e = ease.o(sw(t, openT, S.flood)); look(v3(BARN_X + lerp(1.2, 2.4, e), lerp(1.2, 0.6, e), lerp(2.6, 4.6, e)), v3(BARN_X - 1, lerp(1.4, 0.6, e), -2), 54, 0.05); }
      return {};
  } },
  { id: 'flood', start: S.flood, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('town', t);
      const numT = WT('flood', 3); const fk = sw(t, numT - 0.2, numT + 0.3); sign(fk > 0.5 ? 30000 : 20000, fk > 0 && fk < 1 ? fk : 0);
      const list = []; const p0 = (t - S.flood) * 9;
      for (let i = 0; i < 760; i++) { const off = hsh(i, 1) * 22, x = 3 - p0 * (0.9 + hsh(i, 2) * 0.3) + off; if (x > 18 || x < -24) continue; list.push({ x, z: (hsh(i, 3) - 0.5) * 22 - 1, dx: -1, s: 1.0, hop: Math.abs(Math.sin(t * 16 + i)) * 0.08 }); }
      R.rats.set(list, camera, t);
      peasants.forEach((p, i) => { p.set({ pose: 'stuck', expr: 'shock' }); const b = [[-11, -9], [-11.6, -8], [11.4, -10], [11, -1], [-6, -15], [7, -15], [12, 9], [4.5, -8]][i]; at(p, b[0], 1.0, b[1]); });
      const e = ease.sine(u);
      if (t < numT - 0.25) look(v3(lerp(-2.6, -2.0, e), 0.4, 6.0).add(shake(t, 0.04)), v3(10, 0.8, -3), 58, 0.06);
      else look(v3(-2.3, 3.0, 8.2).add(shake(t, 0.03)), v3(-5.5, 3, -1), 38);
      return {};
  } },
  { id: 'fact', start: S.fact, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      setPlace('town', t); sign(30000);
      R.rats.set(scurry(t, 160), camera, t);
      look(v3(lerp(3, 1, u), 6, 14), v3(0, 1, -4), 50);
      return { fx: { sepia: 1, card: sw(t, S.fact + 0.1, S.fact + 0.5), bred: t > WT('fact', 5) ? t - WT('fact', 5) : null } };
  } },
  { id: 'end', start: S.end, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      const payT = WT('end', 6);
      if (t < payT) {
        setPlace('throne', t);
        king.set({ ...KING, pose: 'throne', expr: 'bored' }); at(king, THRONE_X, 0.6, -8.6);
        const list = []; for (let i = 0; i < 300; i++) { const x = (hsh(i, 1) - 0.5) * 12, z = -7.4 + hsh(i, 2) * 5; list.push({ x: x + Math.sin(t * 2 + i) * 0.2, y: z < -7.2 ? 0.6 : 0, z, dx: Math.cos(t + i), dz: 0, s: 0.9, hop: Math.abs(Math.sin(t * 12 + i)) * 0.04 }); }
        list.push({ x: 0.05, y: 2.45, z: -8.5, dx: 1, s: 0.7 });
        R.tRats.set(list, camera, t);
        const e = ease.io(sw(t, S.end, payT));
        look(v3(THRONE_X + lerp(0.8, 0.3, e), lerp(2.6, 1.6, e), lerp(1, -2.8, e)), v3(THRONE_X, lerp(1.0, 1.7, e), -8.6), 46);
      } else {
        setPlace('town', t); sign(30000);
        R.rats.set(scurry(t, 120), camera, t);
        const wink = t > TL.speechEnd + 0.2;
        catcher.set({ ...RC, pose: wink ? 'coin' : 'tails', expr: wink ? 'wink' : 'smirk' }); at(catcher, -3.4, 0, 1.6);
        const e = ease.io(sw(t, payT, TL.duration));
        look(v3(lerp(-1.4, -2.4, e), lerp(1.9, 1.8, e), lerp(5.8, 4.3, e)), v3(lerp(-3.9, -3.6, e), lerp(2.4, 1.9, e), 0.5), 40);
      }
      return { fx: { sparkle: t > TL.speechEnd + 0.25 ? (t - TL.speechEnd - 0.25) / 0.6 : 0 } };
  } },
];
for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : TL.duration;
const shotAt = (t) => { let s = shots[0]; for (const x of shots) if (t >= x.start) s = x; return s; };

function renderShot(shot, t, alpha = 1, whip = 0) {
  shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start); // pass 1 places the camera
  const res = shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start) || {}; // pass 2: billboards face it
  if (whip) camera.rotateY(whip);
  renderer.render(R.scene, camera);
  cx.save(); cx.globalAlpha = alpha;
  cx.filter = res.fx && res.fx.sepia ? 'sepia(0.9) contrast(1.1) brightness(0.8) blur(3px)' : 'saturate(1.18) contrast(1.06)';
  cx.drawImage(glCanvas, 0, 0, W, H); cx.restore();
  return res;
}
function bloom(a = 0.2) { sx.filter = 'brightness(1.05) contrast(1.8) blur(5px)'; sx.clearRect(0, 0, small.width, small.height); sx.drawImage(comp, 0, 0, small.width, small.height); cx.save(); cx.globalCompositeOperation = 'screen'; cx.globalAlpha = a; cx.drawImage(small, 0, 0, W, H); cx.restore(); }
function vignette(s = 0.3) { const g = cx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
function grade(warm = 0.18) { cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = warm; const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe0a0'); g.addColorStop(1, '#a0603a'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function star(x, y, s, rot) { cx.save(); cx.translate(x, y); cx.rotate(rot); cx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.28 : s; const a = i * Math.PI / 4; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath(); cx.fillStyle = '#fff6c0'; cx.strokeStyle = '#141010'; cx.lineWidth = 7; cx.stroke(); cx.fill(); cx.restore(); }
function sparkle(k) { for (const [x, y, s0] of [[0.7, 0.5, 1], [0.78, 0.45, 0.6], [0.64, 0.44, 0.5]]) { const s = s0 * Math.sin(Math.min(1, k) * Math.PI) * 90; if (s > 0) star(W * x, H * y, s, k * 1.5); } }
function glint(g) { const s = Math.sin(g.k * Math.PI) * 80; if (s > 0) star(W * g.x, H * g.y, s, g.k * 2); }
function pop(text, k, col = '#ffffff', y = 0.3, size = 120, rot = -0.04) {
  const s = k < 0.12 ? 0.4 + (k / 0.12) * 0.75 : 1.15 - 0.15 * ease.o(clamp01((k - 0.12) / 0.15));
  cx.save(); cx.translate(W / 2, H * y); cx.rotate(rot); cx.scale(s, s);
  cx.font = `900 ${size}px Montserrat`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
  cx.lineWidth = size * 0.2; cx.strokeStyle = '#151012'; cx.strokeText(text, 0, 0); cx.fillStyle = col; cx.fillText(text, 0, 0); cx.restore();
}
function stamp(k) {
  const s = k < 0.1 ? 2.2 - (k / 0.1) * 1.2 : 1; const a = clamp01(k / 0.08);
  cx.save(); cx.globalAlpha = a; cx.translate(W / 2, H * 0.3); cx.rotate(-0.16); cx.scale(s, s);
  cx.font = '900 140px Montserrat'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  const w = cx.measureText('CANCELLED').width + 60;
  cx.lineWidth = 16; cx.strokeStyle = '#d8202a'; cx.strokeRect(-w / 2, -95, w, 190); cx.fillStyle = 'rgba(216,32,42,0.12)'; cx.fillRect(-w / 2, -95, w, 190);
  cx.fillStyle = '#d8202a'; cx.fillText('CANCELLED', 0, 6); cx.restore();
}
function card(k, out) {
  const a = clamp01(k) * (1 - out); if (a <= 0) return;
  const y = H * 0.36 + (1 - ease.o(clamp01(k))) * 120;
  cx.save(); cx.globalAlpha = a; cx.translate(W / 2, y); cx.rotate(-0.03);
  cx.fillStyle = '#efe2c2'; cx.strokeStyle = '#151012'; cx.lineWidth = 10;
  cx.beginPath(); cx.moveTo(-400, -300); for (let i = 0; i <= 20; i++) cx.lineTo(-400 + i * 40, -300 + (i % 2 ? 8 : -6)); cx.lineTo(400, 300); for (let i = 20; i >= 0; i--) cx.lineTo(-400 + i * 40, 300 + (i % 2 ? -6 : 8)); cx.closePath(); cx.fill(); cx.stroke();
  cx.fillStyle = 'rgba(120,80,30,0.12)'; for (let i = 0; i < 30; i++) { cx.beginPath(); cx.arc(Math.sin(i * 7.1) * 360, Math.cos(i * 3.3) * 260, 10 + (i % 4) * 8, 0, 7); cx.fill(); }
  cx.fillStyle = '#3a2410'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.font = '900 44px Montserrat'; cx.fillText('TRUE STORY', 0, -230);
  cx.font = '900 120px Montserrat'; cx.fillText('HANOI', 0, -130);
  cx.font = '900 90px Montserrat'; cx.fillStyle = '#b8202a'; cx.fillText('1902', 0, -30);
  // tail-less rat + coin
  cx.save(); cx.beginPath(); cx.rect(-150, 40, 400, 220); cx.clip(); cx.drawImage(ratImg, -120, 60, 320, 200); cx.restore();
  cx.strokeStyle = '#b8202a'; cx.lineWidth = 9; cx.setLineDash([16, 10]); cx.beginPath(); cx.moveTo(-150, 120); cx.lineTo(-150, 260); cx.stroke(); cx.setLineDash([]);
  cx.font = '800 34px Montserrat'; cx.fillStyle = '#3a2410'; cx.fillText('no tail = cash', -260, 170);
  cx.restore();
}
function captions(t) {
  const g = TL.groups.find((x) => t >= x.start && t < x.hide); if (!g) return;
  const k = clamp01((t - g.start) / 0.07), s = 1.12 - 0.12 * ease.o(k);
  cx.save(); cx.translate(W / 2, H * 0.7); cx.scale(s, s);
  cx.font = '800 64px Montserrat'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
  cx.shadowColor = 'rgba(0,0,0,0.55)'; cx.shadowBlur = 14; cx.shadowOffsetY = 4; cx.lineWidth = 12; cx.strokeStyle = '#000'; cx.strokeText(g.text, 0, 0);
  cx.shadowColor = 'transparent'; cx.fillStyle = '#fff'; cx.fillText(g.text, 0, 0); cx.restore();
}

window.TIMELINE = TL; window.DURATION = TL.duration;
window.SHOTS = shots.map((s) => ({ id: s.id, start: s.start, end: s.end, trans: s.trans ? s.trans.type : null }));
window.renderAt = function (t, opts = {}) {
  const shot = shotAt(t), idx = shots.indexOf(shot), prev = shots[idx - 1], nxt = shots[idx + 1];
  cx.globalAlpha = 1; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
  const lt = t - shot.start, tr = shot.trans || {};
  let blur = (tr.type === 'whip' && prev && lt < tr.dur) || (nxt && nxt.trans && nxt.trans.type === 'whip' && shot.end - t < nxt.trans.dur);
  const whipAt = (tt) => { if (tr.type === 'whip' && prev && tt - shot.start < tr.dur) return -0.5 * (1 - (tt - shot.start) / tr.dur); if (nxt && nxt.trans && nxt.trans.type === 'whip' && shot.end - tt < nxt.trans.dur) return 0.5 * (1 - (shot.end - tt) / nxt.trans.dur); return 0; };
  const n = blur && !opts.fast ? 5 : 1;
  let res;
  for (let i = 0; i < n; i++) { const tt = t + (n > 1 ? (i / (n - 1) - 0.5) / 30 * 1.5 : 0); res = renderShot(shot, tt, 1 / (i + 1), whipAt(tt)); }
  if (tr.type === 'fade' && prev && lt < tr.dur) renderShot(prev, t, 1 - lt / tr.dur);
  const fx = res.fx || {};
  grade(place === 'town' ? 0.16 : 0.28);
  bloom(place === 'town' ? 0.18 : 0.26);
  vignette(place === 'town' ? 0.28 : 0.55);
  if (fx.sepia) grain(t, 0.3);
  if (fx.glint) glint(fx.glint);
  if (fx.big) pop(fx.big.text, fx.big.k, fx.big.col);
  if (fx.stamp != null) stamp(fx.stamp);
  if (fx.card) card(fx.card, 0);
  if (fx.bred != null) pop('THEY BRED RATS', fx.bred, '#f2c23a', 0.56, 86, 0.03);
  if (fx.sparkle) sparkle(fx.sparkle);
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
