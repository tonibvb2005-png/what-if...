import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildFirehouse, UP, POLE, FIRE_POS } from './firehouse.js';
import { ease, clamp01, lerp, v3, skyDome } from '../world.js';
import { Char, tintChars } from '../chars.js';

const W = 1080, H = 1920;
const RS = window.RENDER_SCALE || 0.75;
const TL = buildTimeline(SCRIPT, 50);
const { S } = TL;
const wordsOf = (sid) => TL.words.filter((w) => w.sid === sid);
const WT = (sid, k) => wordsOf(sid)[k].start;

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(Math.round(W * RS), Math.round(H * RS), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 2000);

const R = buildFirehouse();
const pmrem = new THREE.PMREMGenerator(renderer);
const envFrom = (top, hor, gnd) => { const s = new THREE.Scene(); s.add(skyDome(top, hor, gnd, 50)); return pmrem.fromScene(s, 0.02).texture; };
const ENV = { out: envFrom(0x4a9af0, 0xffe8d0, 0x8a7a6a), inn: envFrom(0x6a4a3a, 0x8a5a32, 0x3a2414) };

// ---------- cast ----------
const KE = { outfit: 'fireman', hat: 'firehelmet', faceColor: '#8a5a3a', mustache: true };
const RE = { outfit: 'fireman', hat: 'firehelmet', faceColor: '#6a4028' };
const kenyon = new Char({ ...KE, expr: 'determined', pose: 'stand' }, 1.85);
const reid = new Char({ ...RE, expr: 'grin', pose: 'stand' }, 1.82);
const CREW = [{ outfit: 'fireman', hat: 'firehelmet', faceColor: '#a87050' }, { outfit: 'fireman', hat: 'firehelmet', faceColor: '#5a3a24', stubble: true }, { outfit: 'fireman', hat: 'firehelmet', faceColor: '#7a4a30', mustache: true }, { outfit: 'fireman', hat: 'firehelmet', faceColor: '#94603e' }];
const crew = CREW.map((s) => new Char({ ...s, expr: 'panic', pose: 'stand' }, 1.8));
const RIV = [{ outfit: 'fireman', hat: 'firehelmet', hatColor: '#1a1a1a', badge: '7', shirt: '#3a3a4a' }, { outfit: 'fireman', hat: 'firehelmet', hatColor: '#1a1a1a', badge: '7', shirt: '#3a3a4a', mustache: true }, { outfit: 'fireman', hat: 'firehelmet', hatColor: '#1a1a1a', badge: '7', shirt: '#3a3a4a', stubble: true }];
const rivals = RIV.map((s) => new Char({ ...s, expr: 'laugh', pose: 'laughbelly' }, 1.82));
const chief = new Char({ outfit: 'fireman', chief: true, hat: 'firehelmet', hatColor: '#f4f2ea', badge: 'C', mustache: true, expr: 'angry', pose: 'stand' }, 1.9);
const mom = new Char({ outfit: 'dress', hat: 'bonnet', hair: 'bun', dress: '#3a8ab8', blush: true, expr: 'cry', pose: 'stand' }, 1.78);
const all = [kenyon, reid, ...crew, ...rivals, chief, mom];
all.forEach((c) => R.scene.add(c.mesh));

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d'); document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6; const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d'); const img = x.createImageData(360, 640); for (let i = 0; i < img.data.length; i += 4) { const v = Math.abs((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); return c; });

function look(pos, target, fov = 50, roll = 0) {
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(target); if (roll) camera.rotateZ(roll); camera.updateMatrixWorld(true);
  R.sky.position.copy(pos);
  const dir = target.clone().sub(pos); const dist = Math.min(dir.length(), 20); dir.setY(0).normalize();
  const focus = pos.clone().addScaledVector(dir, dist * 0.7); focus.y = 0;
  R.sun.target.position.copy(focus); R.sun.position.copy(focus).addScaledVector(R.sun.userData.dir, 150); R.sun.target.updateMatrixWorld();
}
const path = (pts, u) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoint(clamp01(u));
const sw = (t, a, b) => clamp01((t - a) / (b - a));
const hsh = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const shake = (t, a) => v3(Math.sin(t * 41) * a, Math.sin(t * 33 + 1) * a, Math.sin(t * 27 + 2) * a * 0.5);
const walkPose = (t, f = 4, o = 0) => (Math.floor(t * f + o) % 2 ? 'walk1' : 'walk2');

// ---------- state ----------
let place = 'inn';
function setPlace(p, t, o = {}) {
  place = p;
  const inside = p === 'inn';
  R.main.userData.dark.visible = !o.doorsOpen; R.main.userData.doors.forEach((d, i) => (d.rotation.y = (i ? -1 : 1) * (o.doorsOpen || 0) * 1.6));
  R.sky.visible = true; R.scene.fog = inside ? null : new THREE.Fog(0xffe8d0, 160, 600);
  R.scene.environment = inside ? ENV.inn : ENV.out; R.scene.environmentIntensity = inside ? 0.6 : 0.8;
  R.hemi.intensity = inside ? 0.45 : 0.8; R.sun.intensity = inside ? 1.2 : 3.2; renderer.toneMappingExposure = inside ? 1.3 : 1.15;
  tintChars(inside ? new THREE.Color(0xffead0) : new THREE.Color(0xffffff));
  all.forEach((c) => { c.mesh.visible = false; c.mesh.scale.set(1, 1, 1); c.flip = false; c.tilt = 0; });
  R.pole.material = o.brass ? R.brassM : R.woodM; R.hay.forEach((h) => (h.visible = !o.brass));
  R.sawdust.forEach((s) => (s.visible = false));
  R.bell.rotation.z = o.ring ? Math.sin(t * 30) * 0.4 : 0;
  // fire animation
  const fs = o.fire || 1;
  R.flames.forEach((f, i) => { const k = (t * 1.4 + i / 26) % 1; const ang = hsh(i) * Math.PI * 2; f.position.set(Math.cos(ang) * 3.4 * hsh(i, 2), 8 + k * 3 * fs + (i % 4 === 0 ? -4 : 0), Math.sin(ang) * 3.4 * hsh(i, 3) - 2); f.scale.set(2.2 * fs * (1 - k * 0.5), 3.2 * fs * (1 - k * 0.4), 1); f.material.opacity = 1 - k; });
  R.smoke.forEach((s, i) => { const k = (t * 0.35 + i / 16) % 1; s.position.set((hsh(i) - 0.5) * 4 + k * 4, 11 + k * 14 * fs, -1); s.scale.setScalar((2 + k * 6) * fs); s.material.opacity = (1 - k) * 0.8; });
  R.fireLight.intensity = 40 * fs * (0.85 + 0.15 * Math.sin(t * 17));
  // engine + horses parked inside
  setEngine(0, t, false);
}
function setEngine(z, t, run, turn = 0) { // z: travel distance along +z from the parked spot, then along +x after the doors
  const p = v3(0.5, 0, 0.3 + Math.min(z, 12)); if (z > 12) p.x += (z - 12);
  R.eng.position.copy(p); R.eng.rotation.y = z > 12 ? Math.PI / 2 * clamp01((z - 12) / 3) : 0;
  R.eng.userData.wheels.forEach((w) => (w.rotation.x = run ? -t * 8 : 0));
  const fwd = z > 12 ? v3(1, 0, 0) : v3(0, 0, 1);
  R.horses.forEach((h, i) => { const side = i ? 0.75 : -0.75; const hp = p.clone().addScaledVector(fwd, 3.3).add(z > 12 ? v3(0, 0, side) : v3(side, 0, 0)); h.position.copy(hp); h.position.y = run ? Math.abs(Math.sin(t * 10 + i)) * 0.15 : 0; h.material.map = R.horseT[run ? 1 : 0]; h.lookAt(camera.position.x, 0, camera.position.z); const scr = fwd.x * Math.cos(h.rotation.y) - fwd.z * Math.sin(h.rotation.y); h.scale.x = scr >= 0 ? 1 : -1; });
}
const at = (c, x, y, z, flip = false, tilt = 0) => { c.mesh.visible = true; c.mesh.position.set(x, y, z); c.flip = flip; c.tilt = tilt; };
function faceAll() { all.forEach((c) => { if (!c.mesh.visible) return; c.face(camera, c.flip); if (c.tilt) c.mesh.rotateZ(c.tilt); }); R.horses.forEach((h) => { const s = h.scale.x; h.lookAt(camera.position.x, h.position.y, camera.position.z); h.scale.x = s; }); }
// people on the stairs: k = 0 orderly ... 1 full pile-up at the bottom
function stairPile(t, k, exprs = ['panic', 'squish', 'shock', 'nervous']) {
  crew.forEach((c, i) => {
    const s = 1 - i / 4 * (1 - k * 0.9); const x = lerp(2.3, 6.2, s - (k > 0.5 ? 0.0 : 0)), y = Math.max(0, (6.2 - x) / 0.27 * 0.3);
    const fall = clamp01(k * 2 - i * 0.25);
    c.set({ ...CREW[i], expr: exprs[i % exprs.length], pose: fall > 0.5 ? 'stuck' : walkPose(t, 6, i), sweat: true });
    at(c, lerp(x, 5.6 + (i % 2) * 0.5, fall), lerp(y + 0.05, 0.05 + i * 0.25, fall), -4.8 + (i % 2) * 0.3, i % 2 === 1, fall * (i % 2 ? 1.2 : -1.0) + Math.sin(t * 9 + i) * 0.1 * fall);
  });
}
const kenyonSpec = (s) => ({ ...KE, ...s });

// ---------- shots ----------
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      setPlace('inn', t, { ring: true });
      stairPile(t, 0.3 + u * 0.7);
      const e = ease.io(u);
      look(v3(lerp(2.0, 3.0, e), lerp(2.6, 2.0, e), lerp(3.0, 1.4, e)).add(shake(t, 0.02)), v3(4.8, lerp(2.2, 1.0, e), -4.8), 46, 0.05);
      return {};
  } },
  { id: 'place', start: S.place, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      const bellT = WT('place', 2), runT = WT('place', 6), tripT = WT('place', 11);
      if (t < bellT) { setPlace('out', t); const e = ease.io(sw(t, S.place, bellT)); look(path([v3(14, 22, 34), v3(6, 8, 22)], e), v3(0, 6, 6), 50); return {}; }
      setPlace('inn', t, { ring: true });
      if (t < runT) { look(v3(2.2, 2.9, 5.0).add(shake(t, 0.015)), v3(4.5, 3.8, 2.6), 40, -0.04); return { fx: { big: { text: 'DING DING DING!', k: t - bellT, col: '#f2c23a', size: 100 } } }; }
      const k = t < tripT ? 0.15 * sw(t, runT, tripT) : 0.15 + 0.85 * sw(t, tripT, tripT + 0.5);
      stairPile(t, k);
      look(v3(1.8, 2.4, 2.2).add(shake(t, t > tripT ? 0.04 : 0.01)), v3(4.6, lerp(3, 0.8, k), -4.8), 48, 0.04);
      return { fx: { big: t > tripT + 0.2 ? { text: 'OUCH!', k: t - tripT - 0.2, col: '#ff5a3a', size: 140 } : null } };
  } },
  { id: 'idea', start: S.idea, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('inn', t, { ring: true });
      const grabT = WT('idea', 6), slideT = WT('idea', 15);
      stairPile(t, 1);
      const ry = t < slideT ? UP : lerp(UP, 0, ease.i(sw(t, slideT, slideT + 0.6)));
      reid.set({ ...RE, expr: t < grabT ? 'aha' : t < slideT ? 'smirk' : 'grin', pose: t < grabT ? 'point' : 'slide', cheeks: t >= slideT });
      at(reid, POLE.x + (t < grabT ? 0.9 : 0.28), ry, POLE.z + 0.35);
      if (t < slideT) { const e = ease.io(sw(t, S.idea, slideT)); look(v3(POLE.x + lerp(2.4, 1.6, e), UP + 1.6, POLE.z + lerp(4.2, 3.2, e)), v3(POLE.x + 0.3, UP + 1.4, POLE.z), 42); }
      else look(v3(POLE.x + 1.8, ry + 1.4, POLE.z + 3.6), v3(POLE.x + 0.2, ry + 1.2, POLE.z), 46, 0.04);
      return { blur: t > slideT && t < slideT + 0.6 };
  } },
  { id: 'fast', start: S.fast, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('inn', t, { ring: true });
      stairPile(t, 1);
      reid.set({ ...RE, expr: 'grin', pose: 'stuck', cheeks: true }); at(reid, -1.0, 0, 3.6);
      const e = ease.sine(u);
      look(v3(lerp(-3.8, -3.2, e), 1.5, lerp(5.2, 5.0, e)), v3(-0.8, 1.3, 3.2), 50, -0.03);
      return { fx: { big: t < WT('fast', 2) + 0.3 ? { text: 'WHOOSH!', k: t - S.fast, col: '#8ad0ff', size: 150 } : null } };
  } },
  { id: 'captain', start: S.captain, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const cutT = WT('captain', 8), poleT = WT('captain', 14);
      setPlace('inn', t, { brass: t >= poleT });
      kenyon.set(kenyonSpec({ expr: t < cutT ? 'aha' : t < poleT ? 'determined' : 'smirk', pose: t < cutT ? 'point' : t < poleT ? 'hammer' : 'point', swing: Math.floor(t * 6) % 2 === 0 }));
      at(kenyon, POLE.x + 1.1, UP, POLE.z + 0.8);
      if (t >= cutT && t < poleT) R.sawdust.forEach((s, i) => { const k = (t * 2 + i / 14) % 1; s.visible = true; s.position.set(POLE.x + (hsh(i) - 0.5) * 1.2, UP + 0.1 + Math.sin(k * Math.PI) * 0.6, POLE.z + (hsh(i, 2) - 0.5) * 1.2); });
      if (t < cutT) look(v3(POLE.x + 1.6, UP + 1.75, POLE.z + 3.6), v3(POLE.x + 1.1, UP + 1.6, POLE.z + 0.8), 40);
      else look(v3(POLE.x + 2.4, UP + 2.4, POLE.z + 3.8).add(shake(t, t < poleT ? 0.01 : 0)), v3(POLE.x + 0.4, UP + 0.6, POLE.z), 48);
      return { fx: { sparkleAt: t >= poleT ? (t - poleT) / 0.7 : 0 } };
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('out', t);
      rivals.forEach((c, i) => { c.set({ ...RIV[i], expr: 'laugh', pose: ['laughbelly', 'point', 'laughbelly'][i] }); at(c, -6 + i * 1.6, Math.abs(Math.sin(t * 9 + i)) * 0.06, 26.6, i === 1); });
      const e = ease.sine(u);
      look(v3(lerp(-3.4, -2.8, e), 1.6, 20.4), v3(-4.4, 1.7, 26.6), 46, -0.04);
      return { fx: { big: t >= WT('laugh', 7) ? { text: "KENYON'S FOLLY", k: t - WT('laugh', 7), col: '#f2c23a', size: 100 } : null } };
  } },
  { id: 'angry', start: S.angry, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('inn', t, { brass: true });
      const mad = t >= WT('angry', 4);
      chief.set({ expr: mad ? 'furious' : 'angry', pose: mad ? 'fist' : 'point', faceColor: mad ? '#ef6b5b' : '#ffffff', steam: mad, vein: mad }); at(chief, POLE.x + 1.4, 0, POLE.z + 1.6);
      kenyon.set(kenyonSpec({ expr: 'nervous', pose: 'stand', sweat: true })); at(kenyon, POLE.x - 0.9, 0, POLE.z + 1.0, true);
      const e = ease.o(sw(t, WT('angry', 4), WT('angry', 4) + 0.25));
      if (!mad) look(v3(POLE.x + 0.4, 1.7, POLE.z + 6.2), v3(POLE.x + 0.3, 1.8, POLE.z + 1.2), 44);
      else look(v3(POLE.x + lerp(1.8, 1.6, e), 1.75, POLE.z + lerp(5.2, 4.2, e)).add(shake(t, 0.03)), v3(POLE.x + 1.4, 1.75, POLE.z + 1.6), 42, 0.05);
      return {};
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const ringT = WT('shrug', 4);
      setPlace('inn', t, { brass: true, ring: t >= ringT });
      kenyon.set(kenyonSpec({ expr: t < ringT ? 'bored' : 'smirk', pose: t < ringT ? 'shrug' : 'bellrope', swing: Math.floor(t * 6) % 2 === 0, sweat: false }));
      at(kenyon, t < ringT ? POLE.x + 1.4 : 4.3, 0, t < ringT ? POLE.z + 1.2 : 2.9, t >= ringT);
      if (t < ringT) look(v3(POLE.x + 1.6, 1.75, POLE.z + 3.8), v3(POLE.x + 1.4, 1.7, POLE.z + 1.2), 40);
      else look(v3(2.0, 2.2, 5.3).add(shake(t, 0.012)), v3(4.3, 2.2, 2.6), 50, -0.04);
      return {};
  } },
  { id: 'race', start: S.race, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const outT = WT('race', 3);
      if (t < outT) {
        setPlace('inn', t, { brass: true, ring: true });
        const i = t < WT('race', 1) ? 0 : t < WT('race', 2) ? 1 : 2; const s0 = WT('race', i);
        const c = crew[i]; const y = lerp(UP, 0, ease.i(sw(t, s0, s0 + 0.45)));
        c.set({ ...CREW[i], expr: 'grin', pose: 'slide', cheeks: true, sweat: false }); at(c, POLE.x + 0.28, y, POLE.z + 0.35);
        look(v3(POLE.x + [1.6, -1.4, 0.8][i], y + 1.2, POLE.z + 3.2), v3(POLE.x + 0.2, y + 1.2, POLE.z), 44, [0.05, -0.05, 0][i]);
        return { blur: true, fx: { big: { text: 'SLIDE!', k: t - s0, col: ['#f2c23a', '#ff8a3a', '#ff5a8a'][i], size: 130 + i * 15 } } };
      }
      setPlace('out', t, { doorsOpen: sw(t, outT, outT + 0.5) });
      const run = sw(t, outT + 0.3, S.payoff); setEngine(run * 30, t, run > 0);
      kenyon.set(kenyonSpec({ expr: 'grin', pose: 'stuck' })); kenyon.mesh.visible = true; kenyon.mesh.position.copy(R.eng.position).add(v3(0, 2.0, 0)); kenyon.flip = false; kenyon.tilt = 0;
      look(v3(lerp(10, 18, run), 1.6, 18), v3(R.eng.position.x, 1.8, R.eng.position.z), 50, 0.04);
      return { blur: run > 0.05, fx: { big: t >= WT('race', 9) ? { text: 'FIRST!', k: t - WT('race', 9), col: '#5ae87a', size: 150 } : null } };
  } },
  { id: 'payoff', start: S.payoff, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const livesT = WT('payoff', 8);
      setPlace('out', t, { doorsOpen: 1, brass: true, fire: t >= livesT ? 0.6 : 1 });
      if (t < WT('payoff', 6)) { R.others.forEach((f) => f.userData.doors.forEach((d, i) => (d.rotation.y = (i ? -1 : 1) * 1.6 * sw(t, S.payoff + 0.3, S.payoff + 1)))); R.others.forEach((f) => (f.userData.dark.visible = false)); const e = ease.io(sw(t, S.payoff, WT('payoff', 6))); look(v3(lerp(-30, 60, e), 5, 14), v3(lerp(-24, 54, e), 4, 6), 58); return {}; }
      R.others.forEach((f) => f.userData.doors.forEach((d) => (d.rotation.y = 0)));
      reid.set({ ...RE, expr: t >= livesT ? 'grin' : 'determined', pose: 'rescue', cheeks: true }); at(reid, FIRE_POS.x - 2.2, 0, FIRE_POS.z - 6.2);
      mom.set({ expr: t >= livesT ? 'happy' : 'cry', pose: t >= livesT ? 'stuck' : 'stand' }); at(mom, FIRE_POS.x - 4.2, 0, FIRE_POS.z - 6.8, true);
      look(v3(FIRE_POS.x - 2.0, 2.0, FIRE_POS.z - 13.0), v3(FIRE_POS.x - 3.0, 2.6, FIRE_POS.z - 6.4), 48);
      return { fx: { big: t >= livesT ? { text: 'LIVES SAVED', k: t - livesT, col: '#5ae87a', size: 120 } : { text: 'SECONDS SAVED', k: t - WT('payoff', 6), col: '#f2c23a', size: 110 } } };
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      const fireT = WT('whatif', 8);
      if (t < fireT) { setPlace('inn', t, { ring: true }); stairPile(t, 1, ['cry', 'squish', 'panic', 'cry']); look(v3(2.6, 2.0, 1.8).add(shake(t, 0.02)), v3(5.0, 0.9, -4.8), 48, 0.05); }
      else { setPlace('out', t, { fire: 1 + sw(t, fireT, S.end) * 1.4 }); look(v3(FIRE_POS.x - 4, 2.0, FIRE_POS.z - 18), v3(FIRE_POS.x, 7, FIRE_POS.z), 52); }
      return { fx: { bw: 1, big: t >= fireT ? { text: 'TOO LATE', k: t - fireT, col: '#ff5a3a', size: 140 } : null } };
  } },
  { id: 'end', start: S.end, run(t, u) {
      setPlace('inn', t, { brass: true });
      const wink = t > TL.speechEnd + 0.15;
      kenyon.set(kenyonSpec({ expr: wink ? 'wink' : 'smirk', pose: wink ? 'point' : 'stand', sweat: false })); at(kenyon, POLE.x + 0.75, 0, POLE.z + 0.6);
      const e = ease.io(u);
      look(v3(POLE.x + lerp(2.2, 1.2, e), lerp(1.9, 1.75, e), POLE.z + lerp(5.4, 3.6, e)), v3(POLE.x + 0.5, lerp(1.9, 1.7, e), POLE.z + 0.4), 42);
      return { fx: { rewind: clamp01(1 - (t - S.end) / 0.4), sparkle: wink ? (t - TL.speechEnd - 0.15) / 0.6 : 0 } };
  } },
];
for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : TL.duration;
const shotAt = (t) => { let s = shots[0]; for (const x of shots) if (t >= x.start) s = x; return s; };

function renderShot(shot, t, alpha = 1, whip = 0) {
  const res = shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start) || {};
  faceAll();
  if (whip) camera.rotateY(whip);
  renderer.render(R.scene, camera);
  cx.save(); cx.globalAlpha = alpha;
  cx.filter = res.fx && res.fx.bw ? 'grayscale(1) contrast(1.3) brightness(0.95)' : 'saturate(1.3) contrast(1.06)';
  cx.drawImage(glCanvas, 0, 0, W, H); cx.restore();
  return res;
}
function bloom(a = 0.2) { sx.filter = 'brightness(1.05) contrast(1.8) blur(5px)'; sx.clearRect(0, 0, small.width, small.height); sx.drawImage(comp, 0, 0, small.width, small.height); cx.save(); cx.globalCompositeOperation = 'screen'; cx.globalAlpha = a; cx.drawImage(small, 0, 0, W, H); cx.restore(); }
function vignette(s = 0.3) { const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
function grade() { cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = 0.16; const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe0b0'); g.addColorStop(1, '#a04a3a'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
function vhs(t, amount) {
  if (amount <= 0) return;
  for (let i = 0; i < 9; i++) { const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60); cx.drawImage(comp, 0, y, W, h, Math.sin(t * 80 + i) * 60 * amount, y, W, h); }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2); cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function star(x, y, s, rot) { cx.save(); cx.translate(x, y); cx.rotate(rot); cx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.28 : s; const a = i * Math.PI / 4; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath(); cx.fillStyle = '#fff6c0'; cx.strokeStyle = '#141010'; cx.lineWidth = 7; cx.stroke(); cx.fill(); cx.restore(); }
function sparkle(k, pts = [[0.66, 0.42, 1], [0.74, 0.36, 0.6], [0.6, 0.34, 0.5]]) { for (const [x, y, s0] of pts) { const s = s0 * Math.sin(Math.min(1, k) * Math.PI) * 90; if (s > 0) star(W * x, H * y, s, k * 1.5); } }
function pop(b) {
  const k = b.k, size = b.size || 120;
  const s = k < 0.12 ? 0.4 + (k / 0.12) * 0.75 : 1.15 - 0.15 * ease.o(clamp01((k - 0.12) / 0.15));
  cx.save(); cx.translate(W / 2 + Math.sin(k * 30) * 6 * Math.exp(-k * 4), H * (b.y || 0.26)); cx.rotate(-0.05); cx.scale(s, s);
  cx.font = `900 ${size}px Montserrat`; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
  cx.lineWidth = size * 0.22; cx.strokeStyle = '#151012'; cx.strokeText(b.text, 0, 0); cx.fillStyle = b.col; cx.fillText(b.text, 0, 0); cx.restore();
}
function captions(t) {
  const g = TL.groups.find((x) => t >= x.start && t < x.hide); if (!g) return;
  const k = clamp01((t - g.start) / 0.07), s = 1.12 - 0.12 * ease.o(k);
  cx.save(); cx.translate(W / 2, H * 0.7); cx.scale(s, s);
  cx.font = '800 66px Montserrat'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
  cx.shadowColor = 'rgba(0,0,0,0.55)'; cx.shadowBlur = 14; cx.shadowOffsetY = 4; cx.lineWidth = 12; cx.strokeStyle = '#000'; cx.strokeText(g.text, 0, 0);
  cx.shadowColor = 'transparent'; cx.fillStyle = '#fff'; cx.fillText(g.text, 0, 0); cx.restore();
}

window.CAM = camera; window.R = R;
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
    bloom(0.22);
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(place === 'inn' ? 0.4 : 0.24);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.big) pop(fx.big);
    if (fx.sparkleAt) sparkle(fx.sparkleAt, [[0.42, 0.3, 0.8], [0.5, 0.5, 0.6], [0.46, 0.72, 0.5]]);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
