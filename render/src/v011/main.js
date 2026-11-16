import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildPalace, CITY_X, TOWER_Z } from './palace.js';
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

const R = buildPalace();
const pmrem = new THREE.PMREMGenerator(renderer);
{ const s = new THREE.Scene(); s.add(skyDome(0x4a9af0, 0xfff0d8, 0x9a7a5a, 50)); R.scene.environment = pmrem.fromScene(s, 0.02).texture; R.scene.environmentIntensity = 0.85; }

// ---------- cast ----------
const OT = { outfit: 'frock', hat: 'tophat', hair: 'muttonchops', hairColor: '#3a2a1a', mustache: true, coat: '#3a2a4a', vest: '#c8a24a' };
const otis = new Char({ ...OT, expr: 'determined', pose: 'stand' }, 1.85);
const helper = new Char({ outfit: 'worker', tunic: '#c8302a', hat: 'flatcap', stubble: true, expr: 'determined', pose: 'axe' }, 1.82);
const official = new Char({ outfit: 'official', hat: 'tophat', mustache: true, expr: 'angry', pose: 'stand' }, 1.92);
const CROWD = [
  { outfit: 'dress', hat: 'bonnet', hair: 'bun', dress: '#3a8ab8', blush: true, pose: 'parasol', parasolCol: '#f2a8c8' }, { outfit: 'frock', hat: 'tophat', mustache: true }, { outfit: 'worker', tunic: '#7a6a4a', hat: 'flatcap' },
  { outfit: 'dress', hat: 'bonnet', hair: 'bun', dress: '#c85a8a', blush: true }, { outfit: 'frock', hat: 'bowler', coat: '#4a3a2a' }, { outfit: 'dress', hat: 'bonnet', hair: 'long', dress: '#e8a03a', blush: true, pose: 'parasol', parasolCol: '#9ad8b0' },
  { outfit: 'frock', hat: 'tophat', hatColor: '#4a3a2a', coat: '#2a3a2a', hair: 'muttonchops', hairColor: '#b8b8c0' }, { outfit: 'worker', tunic: '#3a6ab0', hat: 'flatcap', mustache: true }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', dress: '#7a5aa8', blush: true },
  { outfit: 'frock', hat: 'bowler' },
];
const crowd = CROWD.map((s) => new Char({ ...s, expr: 'ring', pose: s.pose || 'stand' }, 1.82));
const all = [otis, helper, official, ...crowd];
all.forEach((c) => R.scene.add(c.mesh));

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d'); document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6; const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d'); const img = x.createImageData(360, 640); for (let i = 0; i < img.data.length; i += 4) { const v = Math.abs((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); return c; });

let place = 'pal';
function look(pos, target, fov = 50, roll = 0) {
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(target); if (roll) camera.rotateZ(roll); camera.updateMatrixWorld(true);
  R.sky.position.copy(pos); const ox = place === 'city' ? CITY_X : 0; R.clouds.forEach((c) => (c.position.x = c.userData.x0 + ox));
  const dir = target.clone().sub(pos); const dist = Math.min(dir.length(), 20); dir.setY(0).normalize();
  const focus = pos.clone().addScaledVector(dir, dist * 0.7); focus.y = 0;
  R.sun.target.position.copy(focus); R.sun.position.copy(focus).addScaledVector(R.sun.userData.dir, 150); R.sun.target.updateMatrixWorld();
}
const path = (pts, u) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoint(clamp01(u));
const sw = (t, a, b) => clamp01((t - a) / (b - a));
const hsh = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
const shake = (t, a) => v3(Math.sin(t * 41) * a, Math.sin(t * 33 + 1) * a, Math.sin(t * 27 + 2) * a * 0.5);
const TZ = TOWER_Z;
const TOP = 9.6;

// ---------- state ----------
function setPlace(p, t) {
  place = p;
  R.pal.visible = p === 'pal'; R.city.visible = p === 'city';
  R.scene.fog = p === 'city' ? new THREE.Fog(0xfff0d8, 120, 420) : null;
  R.sun.intensity = 3.2; R.hemi.intensity = 0.8;
  tintChars(new THREE.Color(0xffffff));
  all.forEach((c) => { c.mesh.visible = false; c.mesh.scale.set(1, 1, 1); c.flip = false; });
  R.flags.forEach((f, i) => (f.rotation.z = Math.sin(t * 2 + i) * 0.06));
  R.exhibits.forEach((g, i) => (g.rotation.z = t * (i % 2 ? -1.6 : 1)));
  R.crates.forEach((c) => (c.visible = false)); R.sparks.forEach((s) => (s.visible = false)); R.dust.forEach((d) => (d.visible = false)); R.hats.forEach((h) => (h.visible = false));
  R.pawls.forEach((p, i) => (p.position.x = (i ? 1 : -1) * 1.1));
  R.buildings.forEach((b) => setFloors(b, 2));
}
function setFloors(b, n) { b.scale.y = n * 1.0; b.userData.tex.repeat.set(2, n); b.userData.roof.scale.y = 1 / Math.max(1, n); b.userData.roof.position.y = 1 + 0.6 / Math.max(1, n); b.userData.roof.visible = n > 20; }
function setCyl(m, a, b) { const d = b.clone().sub(a); m.position.copy(a).addScaledVector(d, 0.5); m.scale.set(1, Math.max(0.01, d.length()), 1); m.quaternion.setFromUnitVectors(v3(0, 1, 0), d.normalize()); m.visible = true; }
// platform at height py; cut: 0 = intact, >0 seconds since the cut
function rig(py, cut = -1, t = 0) {
  R.plat.position.y = py;
  const yokeTop = v3(0, py + 3.4, 0), pul = v3(0, 15.8, 0), pulR = v3(0.55, 15.8, 0), cleat = v3(2.3, 1.3, 0.6);
  if (cut < 0) { setCyl(R.ropeUp, yokeTop, pul); setCyl(R.ropeDown, pulR, cleat); R.ropeLo.visible = false; }
  else {
    R.ropeUp.visible = false;
    const flick = clamp01(cut / 0.5); setCyl(R.ropeDown, pulR, pulR.clone().lerp(cleat, 1 - flick * 0.9).add(v3(Math.sin(cut * 20) * 0.3 * (1 - flick), 0, 0)));
    setCyl(R.ropeLo, yokeTop, yokeTop.clone().add(v3(Math.sin(cut * 8) * 0.6 * Math.exp(-cut), 1.6 - Math.min(1.4, cut * 2), 0)));
  }
}
const at = (c, x, y, z, flip = false) => { c.mesh.visible = true; c.mesh.position.set(x, y, z); c.flip = flip; };
function faceAll() { all.forEach((c) => { if (c.mesh.visible) c.face(camera, c.flip); }); }
function crowdOn(t, opts = {}) {
  crowd.forEach((c, i) => { const row = Math.floor(i / 5), col = i % 5; const x = -4.2 + col * 2.1 + (row % 2) * 1.0, z = TZ + 4.2 + row * 1.6;
    if (opts.skip && opts.skip(i)) return;
    const spec = CROWD[i]; c.set({ ...spec, expr: opts.expr ? opts.expr(i) : 'ring', pose: opts.pose ? opts.pose(i) : (spec.pose || 'stand'), lookX: 0, faceColor: '#ffffff', steam: false });
    at(c, x, opts.bounce ? Math.abs(Math.sin(t * 9 + i)) * 0.12 : 0, z, i % 2 === 1); });
}
const otisOn = (py, spec) => { otis.set({ ...OT, ...spec }); at(otis, 0.15, py + 0.1, TZ + 0.3); };

// ---------- shots ----------
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      setPlace('pal', t); rig(TOP);
      otisOn(TOP, { pose: 'stand', expr: 'smirk' });
      helper.set({ pose: 'axe', swing: false, expr: 'grin', cheeks: true }); at(helper, 2.9, 0, TZ + 1.4, true);
      const e = ease.io(u);
      if (t < WT('hook', 7)) look(v3(lerp(5, 3.6, e), lerp(1.0, 2.2, e), TZ + lerp(12, 10, e)), v3(0.4, lerp(7, 10.5, e), TZ), 50, 0.06);
      else look(v3(3.4, 1.6, TZ + 3.6).add(shake(t, 0.01)), v3(2.4, 1.4, TZ + 0.8), 40, -0.05);
      return {};
  } },
  { id: 'place', start: S.place, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('pal', t);
      const fallT = WT('place', 9);
      if (t < WT('place', 6)) { rig(0.15); crowdOn(t, { expr: (i) => ['nervous', 'ring', 'bored'][i % 3] }); const e = ease.io(sw(t, S.place, WT('place', 6))); look(path([v3(0, 26, 22), v3(8, 14, 16), v3(8, 4, 12)], e), path([v3(0, 10, -10), v3(0, 4, -4), v3(0, 3, TZ)], e), 52); return {}; }
      // a cargo hoist without the brake: rope snaps, crates crash down
      R.crates.forEach((c) => (c.visible = true));
      const k = sw(t, fallT, fallT + 0.45); const py = t < fallT ? 7 : lerp(7, 0.15, k * k);
      rig(py, t >= fallT ? t - fallT : -1);
      if (k >= 1) R.dust.forEach((d, i) => { const dt = t - fallT - 0.45; d.visible = true; d.position.set((hsh(i) - 0.5) * 3 * (1 + dt), 0.4 + dt * 0.8, 0.6 + (hsh(i, 2) - 0.5) * 2); d.scale.setScalar(1 + dt * 3); d.material.opacity = Math.max(0, 0.8 - dt); });
      look(v3(3.6, 2.6, TZ + 9).add(shake(t, k >= 1 ? 0.06 * Math.exp(-(t - fallT - 0.45) * 3) : 0)), v3(0, lerp(7, 2, k), TZ), 46);
      return { blur: k > 0 && k < 1, fx: { big: k >= 1 ? { text: 'CRASH!', k: t - fallT - 0.45, col: '#ff5a3a', size: 160 } : null } };
  } },
  { id: 'idea', start: S.idea, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('pal', t); rig(0.15);
      const teethT = WT('idea', 10);
      otisOn(0.15, { pose: t < teethT ? 'stand' : 'point', expr: t < teethT ? 'determined' : 'smirk' });
      if (t < teethT) { const e = ease.io(sw(t, S.idea, teethT)); look(v3(lerp(-3.2, -2.2, e), 1.8, TZ + lerp(6.5, 4.6, e)), v3(0, 2.0, TZ), 44, 0.03); }
      else { const e = ease.o(sw(t, teethT, S.up)); look(v3(0.2, lerp(3.2, 4.4, e), TZ + 1.4), v3(1.42, lerp(3.4, 4.6, e), TZ), 40, 0.02); }
      return { fx: { big: t >= WT('idea', 11) ? { text: 'IRON TEETH', k: t - WT('idea', 11), col: '#c8ccd4', size: 120 } : null } };
  } },
  { id: 'up', start: S.up, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('pal', t);
      const u1 = WT('up', 7), u2 = WT('up', 8), u3 = WT('up', 9);
      const lv = t < u1 ? 0.15 : t < u2 ? lerp(0.15, 3.5, ease.io(sw(t, u1, u1 + 0.5))) : t < u3 ? lerp(3.5, 6.5, ease.io(sw(t, u2, u2 + 0.5))) : lerp(6.5, TOP, ease.io(sw(t, u3, u3 + 0.8)));
      rig(lv); otisOn(lv, { pose: t < u1 ? 'point' : 'stand', expr: t < u3 ? 'determined' : 'smirk' });
      crowdOn(t, { expr: () => 'ring' });
      helper.set({ pose: 'stand', expr: 'determined' }); at(helper, 2.9, 0, TZ + 1.4, true);
      if (t < u1) look(v3(-2.6, 1.4, TZ + 9), v3(0, 2.2, TZ), 46);
      else look(v3(lerp(-2.0, -2.6, sw(t, u1, S.laugh)), lv + 1.4, TZ + 5.0), v3(0.1, lv + 1.6, TZ + 0.3), 42, 0.03);
      return { fx: { big: t >= u3 ? { text: 'HIGHER!', k: t - u3, col: '#f2c23a', size: 130 } : null } };
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('pal', t); rig(TOP); otisOn(TOP, { pose: 'stand', expr: 'smirk' });
      crowdOn(t, { expr: () => 'laugh', pose: (i) => (i % 2 ? 'point' : 'laughbelly'), bounce: true });
      const e = ease.sine(u);
      look(v3(lerp(-1.6, -0.6, e), 1.4, TZ + 9.4), v3(-1, 1.9, TZ + 4.6), 46, -0.04);
      return {};
  } },
  { id: 'angry', start: S.angry, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('pal', t); rig(TOP); otisOn(TOP, { pose: 'stand', expr: 'smirk' });
      const mad = t >= WT('angry', 4);
      official.set({ pose: mad ? 'fist' : 'point', expr: mad ? 'furious' : 'angry', faceColor: mad ? '#ef6b5b' : '#ffffff', steam: mad, vein: mad }); at(official, -2.4, 0, TZ + 2.4);
      crowdOn(t, { skip: (i) => i < 2, expr: () => 'nervous' });
      const e = ease.o(sw(t, WT('angry', 4), WT('angry', 4) + 0.25));
      if (!mad) look(v3(-1.0, 1.4, TZ + 6.6), v3(-2.4, 1.9, TZ + 2.4), 44);
      else look(v3(lerp(-1.4, -1.9, e), 1.75, TZ + lerp(5.4, 4.6, e)).add(shake(t, 0.03)), v3(-2.4, 1.75, TZ + 2.4), 42, 0.05);
      return {};
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('pal', t); rig(TOP);
      const cutT = WT('shrug', 7);
      otisOn(TOP, { pose: t < cutT ? 'shrug' : 'point', expr: t < cutT ? 'bored' : 'smirk' });
      helper.set({ pose: 'axe', swing: false, expr: t < cutT ? 'nervous' : 'grin' }); at(helper, 2.9, 0, TZ + 1.4, true);
      if (t < WT('shrug', 4)) look(v3(0.4, TOP + 1.9, TZ + 3.2), v3(0.15, TOP + 1.6, TZ + 0.3), 40);
      else if (t < cutT) look(v3(0.6, TOP + 2.6, TZ + 3.6), v3(1.2, TOP - 2, TZ + 0.6), 50, 0.03);
      else look(v3(3.6, 1.7, TZ + 4.2), v3(2.6, 1.6, TZ + 1.2), 40, -0.04);
      return {};
  } },
  { id: 'snap', start: S.snap, trans: { type: 'whip', dur: 0.1 }, run(t, u) {
      setPlace('pal', t);
      const cutT = S.snap + 0.05, dropEnd = WT('snap', 5);
      const cut = t - cutT;
      const k = sw(t, WT('snap', 3), dropEnd);
      const py = TOP - 1.3 * ease.i(k);
      rig(py, cut);
      const caught = t >= dropEnd;
      R.pawls.forEach((p, i) => (p.position.x = (i ? 1 : -1) * (1.1 + (caught ? 0.28 : 0))));
      if (caught && t - dropEnd < 0.4) R.sparks.forEach((s, i) => { const dt = t - dropEnd; s.visible = true; const sd = i % 2 ? 1 : -1; s.position.set(sd * (1.42 + dt * (1 + hsh(i)) * 2), py + 3.1 - dt * 3 * hsh(i, 2), (hsh(i, 3) - 0.5) * 0.6); s.scale.setScalar(0.3 + hsh(i, 4) * 0.3); });
      otisOn(py, { pose: caught ? 'stand' : 'stuck', expr: caught ? 'smirk' : 'shock' });
      helper.set({ pose: 'axe', swing: true, expr: caught ? 'grin' : 'panic' }); at(helper, 2.9, 0, TZ + 1.4, true);
      crowdOn(t, { expr: (i) => (caught ? 'shock' : 'panic'), pose: (i) => (caught ? 'stand' : 'stuck') });
      if (t < WT('snap', 1)) look(v3(3.4, 1.5, TZ + 3.2).add(shake(t, 0.05)), v3(2.4, 1.4, TZ + 0.8), 40, -0.06);
      else if (!caught) look(v3(-2.4, py + 0.6, TZ + 6.2).add(shake(t, 0.03)), v3(0, py + 1.6, TZ), 46, 0.04);
      else { const e = ease.o(sw(t, dropEnd, S.safe)); look(v3(lerp(-1.4, -2.6, e), lerp(py + 2.4, 3.2, e), TZ + lerp(4.2, 9.5, e)).add(shake(t, 0.06 * Math.exp(-(t - dropEnd) * 4))), v3(0, py + 1.6, TZ), lerp(42, 50, e)); }
      return { blur: k > 0 && !caught, fx: { big: t < WT('snap', 1) ? { text: 'SNAP!', k: t - S.snap, col: '#ff5a3a', size: 170 } : caught && t < WT('snap', 6) + 0.3 ? { text: 'STOP!', k: t - dropEnd, col: '#5ae87a', size: 150 } : null } };
  } },
  { id: 'safe', start: S.safe, trans: { type: 'fade', dur: 0.15 }, run(t, u) {
      setPlace('pal', t); const py = TOP - 1.3; rig(py, 5); R.pawls.forEach((p, i) => (p.position.x = (i ? 1 : -1) * 1.38));
      otisOn(py, { pose: 'bow', expr: 'polite' });
      crowdOn(t, { expr: () => 'grin', pose: (i) => (i % 2 ? 'stuck' : 'laughbelly'), bounce: true });
      R.hats.forEach((h, i) => { const k = ((t - S.safe) * 1.1 + hsh(i) * 0.3); if (k > 1.2) return; h.visible = true; const b = crowd[i].mesh.position; h.position.set(b.x + (hsh(i, 1) - 0.5), 2.3 + Math.sin(Math.min(1, k) * Math.PI) * 4.5, b.z); h.rotation.set(k * 8, k * 4, 0); });
      if (t < WT('safe', 3)) look(v3(0.6, py + 2.0, TZ + 3.4), v3(0.15, py + 1.6, TZ + 0.3), 40);
      else look(v3(-2.4, 2.4, TZ + 11), v3(0, 3.6, TZ + 2), 50, -0.03);
      return { fx: { big: t >= WT('safe', 3) ? { text: 'ALL SAFE!', k: t - WT('safe', 3), col: '#5ae87a', size: 140 } : null } };
  } },
  { id: 'payoff', start: S.payoff, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('city', t);
      const t10 = WT('payoff', 5), t50 = WT('payoff', 7), t100 = WT('payoff', 9);
      const lvl = t < t10 ? 2 : t < t50 ? lerp(2, 10, ease.o(sw(t, t10, t10 + 0.5))) : t < t100 ? lerp(10, 50, ease.o(sw(t, t50, t50 + 0.6))) : lerp(50, 100, ease.o(sw(t, t100, t100 + 0.8)));
      R.buildings.forEach((b) => setFloors(b, Math.max(2, Math.round(Math.min(b.userData.target, lvl) * (0.6 + 0.4 * (b.userData.target / 100))))));
      const e = ease.io(u);
      look(v3(CITY_X + lerp(40, 70, e), lerp(8, 60, e), lerp(60, 90, e)), v3(CITY_X, lerp(4, 40, e), 0), 52);
      const n = t >= t100 ? '100' : t >= t50 ? '50' : t >= t10 ? '10' : null;
      return { blur: false, fx: { big: n ? { text: n + ' FLOORS', k: t - (t >= t100 ? t100 : t >= t50 ? t50 : t10), col: '#f2c23a', size: 130 } : null } };
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      setPlace('city', t);
      const c = crowd[7]; c.set({ ...CROWD[7], expr: 'cry', pose: Math.floor(t * 4) % 2 ? 'walk1' : 'walk2', sweat: true }); const k = sw(t, S.whatif + 0.4, S.end); at(c, CITY_X - 6 - k * 6, 0.3 + k * 3 + 0.25, 6, true);
      if (t < WT('whatif', 5)) look(v3(CITY_X + 40, 10, 60), v3(CITY_X, 2, 0), 50);
      else look(v3(CITY_X - 6 - k * 6 + 3.2, 2 + k * 3, 10), v3(CITY_X - 6 - k * 6, 1.4 + k * 3, 6), 44, 0.04);
      return { fx: { bw: 1, big: t >= WT('whatif', 3) && t < WT('whatif', 5) ? { text: 'NO SKYSCRAPERS', k: t - WT('whatif', 3), col: '#ff5a4a', size: 100 } : null } };
  } },
  { id: 'end', start: S.end, run(t, u) {
      setPlace('pal', t); const py = TOP - 1.3; rig(py, 5); R.pawls.forEach((p, i) => (p.position.x = (i ? 1 : -1) * 1.38));
      const wink = t > TL.speechEnd + 0.15;
      otisOn(py, { pose: wink ? 'point' : 'stand', expr: wink ? 'wink' : 'smirk' });
      const e = ease.io(u);
      look(v3(lerp(1.4, 0.6, e), py + lerp(2.2, 1.95, e), TZ + lerp(5.2, 3.2, e)), v3(0.15, py + lerp(1.4, 1.65, e), TZ + 0.3), 42);
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
function grade() { cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = 0.16; const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe8c0'); g.addColorStop(1, '#8a6ac0'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
function vhs(t, amount) {
  if (amount <= 0) return;
  for (let i = 0; i < 9; i++) { const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60); cx.drawImage(comp, 0, y, W, h, Math.sin(t * 80 + i) * 60 * amount, y, W, h); }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2); cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function star(x, y, s, rot) { cx.save(); cx.translate(x, y); cx.rotate(rot); cx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.28 : s; const a = i * Math.PI / 4; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath(); cx.fillStyle = '#fff6c0'; cx.strokeStyle = '#141010'; cx.lineWidth = 7; cx.stroke(); cx.fill(); cx.restore(); }
function sparkle(k) { for (const [x, y, s0] of [[0.66, 0.42, 1], [0.74, 0.36, 0.6], [0.6, 0.34, 0.5]]) { const s = s0 * Math.sin(Math.min(1, k) * Math.PI) * 90; if (s > 0) star(W * x, H * y, s, k * 1.5); } }
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
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(0.24);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.big) pop(fx.big);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
