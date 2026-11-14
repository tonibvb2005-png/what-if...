import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildIce, POND_X, SEA_X, HOLD_X, ISLE_X } from './ice.js';
import { ease, clamp01, lerp, v3, skyDome } from '../world.js';
import { Char, tintChars } from '../chars.js';

const W = 1080, H = 1920;
const RS = window.RENDER_SCALE || 0.75;
const TL = buildTimeline(SCRIPT, 46);
const { S } = TL;
const wordsOf = (sid) => TL.words.filter((w) => w.sid === sid);
const WT = (sid, k) => wordsOf(sid)[k].start;

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(Math.round(W * RS), Math.round(H * RS), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 2000);

const R = buildIce();
const pmrem = new THREE.PMREMGenerator(renderer);
const envFrom = (top, hor, gnd) => { const s = new THREE.Scene(); s.add(skyDome(top, hor, gnd, 50)); return pmrem.fromScene(s, 0.02).texture; };
const ENV = { winter: envFrom(0x8ab8e8, 0xffffff, 0xeef4fc), sea: envFrom(0x3a8ae8, 0xfff0d8, 0x1a7ab8), hold: envFrom(0x5a3a22, 0x7a5232, 0x3a2414), isle: envFrom(0x3a9af0, 0xfff4d0, 0xf2dca0) };

// ---------- cast ----------
const TU = { outfit: 'frock', hat: 'tophat', hair: 'short', hairColor: '#6a3a1a', coat: '#2a4a6a', vest: '#e8c24a', cravat: '#c8302a' };
const tudor = new Char({ ...TU, expr: 'determined', pose: 'point' }, 1.85);
const cutters = [
  new Char({ outfit: 'winter', hat: 'beanie', stubble: true, expr: 'determined', pose: 'saw' }, 1.82),
  new Char({ outfit: 'winter', hat: 'beanie', hatColor: '#3a8a4a', coat: '#c8302a', scarf: '#f2c23a', expr: 'laugh', pose: 'laughbelly' }, 1.82),
  new Char({ outfit: 'winter', hat: 'beanie', hatColor: '#f2c23a', hatBand: '#3a6ab0', coat: '#7a5a3a', scarf: '#3a6ab0', mustache: true, expr: 'laugh', pose: 'point' }, 1.82),
  new Char({ outfit: 'dress', hat: 'bonnet', hair: 'bun', dress: '#8a3a5a', blush: true, expr: 'laugh', pose: 'laughbelly' }, 1.78),
];
const investors = [
  new Char({ outfit: 'frock', hat: 'tophat', mustache: true, expr: 'angry', pose: 'stand' }, 1.95),
  new Char({ outfit: 'frock', hat: 'tophat', hatColor: '#4a3a2a', coat: '#3a2a22', hair: 'muttonchops', hairColor: '#b8b8c0', expr: 'angry', pose: 'stand' }, 1.9),
];
const ISL = [
  { outfit: 'islander', hat: 'madras' }, { outfit: 'islander', hat: 'straw', shirt: '#3ab0a0', pattern: '#f2c23a' }, { outfit: 'islander', hat: 'madras', hatColor: '#e84a6a', shirt: '#f2a8b8', blush: true },
  { outfit: 'islander', shirt: '#e8701a', hair: 'curly' }, { outfit: 'islander', hat: 'straw', shirt: '#7ac83a', pattern: '#e84a6a' }, { outfit: 'islander', hat: 'madras', hatColor: '#3ab0a0', shirt: '#c8a8e8', pattern: '#f2c23a', blush: true },
  { outfit: 'islander', hair: 'short', shirt: '#f2d23a', pattern: '#3a6ad8' }, { outfit: 'islander', hat: 'madras', hatColor: '#f2a23a', shirt: '#7ad8c8', pattern: '#e84a6a', blush: true },
];
const locals = ISL.map((s) => new Char({ ...s, expr: 'nervous', pose: 'stand', sweat: true }, 1.82));
const all = [tudor, ...cutters, ...investors, ...locals];
all.forEach((c) => R.scene.add(c.mesh));

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d'); document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6; const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d'); const img = x.createImageData(360, 640); for (let i = 0; i < img.data.length; i += 4) { const v = Math.abs((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); return c; });

function look(pos, target, fov = 50, roll = 0) {
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(target); if (roll) camera.rotateZ(roll); camera.updateMatrixWorld(true);
  R.sky.position.copy(pos); const ox = { pond: POND_X, sea: SEA_X, hold: HOLD_X, isle: ISLE_X }[place] || 0; R.clouds.forEach((c, i) => (c.position.x = c.userData.x0 + ox));
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
let place = 'pond';
function setPlace(p, t) {
  place = p;
  R.pond.visible = p === 'pond'; R.sea.visible = p === 'sea'; R.hold.visible = p === 'hold'; R.isle.visible = p === 'isle';
  const out = p !== 'hold'; R.sky.visible = out; R.clouds.forEach((c) => (c.visible = out)); R.sunDisc.visible = p === 'isle';
  R.scene.background = out ? null : new THREE.Color(0x140c08);
  R.sky.material.uniforms.top.value.set(p === 'pond' ? 0x8ab0d8 : p === 'isle' ? 0x2a8af0 : 0x3a8ae8);
  R.sky.material.uniforms.hor.value.set(p === 'pond' ? 0xffe8e8 : p === 'isle' ? 0xfff0c8 : 0xfff0d8);
  R.scene.fog = p === 'pond' ? new THREE.Fog(0xeef0f8, 30, 140) : p === 'isle' ? new THREE.Fog(0xfff0c8, 120, 500) : p === 'sea' ? new THREE.Fog(0xfff0d8, 150, 600) : null;
  R.scene.environment = ENV[p === 'pond' ? 'winter' : p]; R.scene.environmentIntensity = out ? 0.8 : 0.5;
  R.sun.intensity = p === 'hold' ? 0 : p === 'isle' ? 3.8 : p === 'pond' ? 2.6 : 3.2;
  R.sun.color.set(p === 'pond' ? 0xe8f0ff : 0xfff0d8);
  R.hemi.intensity = out ? (p === 'pond' ? 1.0 : 0.75) : 0.25; renderer.toneMappingExposure = out ? (p === 'pond' ? 1.05 : 1.15) : 1.35;
  tintChars(p === 'hold' ? new THREE.Color(0xffe0c0) : p === 'pond' ? new THREE.Color(0xf0f6ff) : new THREE.Color(0xffffff));
  all.forEach((c) => { c.mesh.visible = false; c.mesh.scale.set(1, 1, 1); c.flip = false; });
  // ambient animation
  const sp = R.snowFlakes.geometry.attributes.position; for (let i = 0; i < sp.count; i++) sp.setY(i, (((hsh(i, 2) * 14 - t * (0.8 + hsh(i, 5) * 0.6)) % 14) + 14) % 14); sp.needsUpdate = true; R.snowFlakes.rotation.y = Math.sin(t * 0.2) * 0.05;
  R.floating.forEach((b, i) => { b.position.z = -16 + ((t * 0.6 + i * 1.8) % 12); b.position.y = 0.12 + Math.sin(t * 2 + i) * 0.02; });
  R.bunting.forEach((f, i) => (f.rotation.z = Math.sin(t * 4 + i) * 0.2));
  R.steam.forEach((s, i) => { const k = (t * 0.5 + i / 10) % 1; s.position.set((hsh(i) - 0.5) * 1.2, 2.0 + k * 1.6, 2 + (hsh(i, 2) - 0.5) * 0.6); s.scale.setScalar(0.4 + k * 0.8); s.material.opacity = (1 - k) * 0.55; });
  R.ship.position.set(0, Math.sin(t * 1.2) * 0.15, 0); R.ship.rotation.set(Math.sin(t * 0.9) * 0.03, 0, Math.sin(t * 1.1) * 0.04);
  R.wake.forEach((f, i) => { const k = (t * 0.6 + i / 20) % 1; f.position.set((hsh(i) - 0.5) * 3 * k, -0.1, 9 + k * 30); f.scale.setScalar(0.5 + k * 3); f.material.opacity = 0.7 * (1 - k); });
  R.ocean.material.userData.normal.offset.set(t * 0.02, t * 0.03);
  R.holdIce.forEach((b) => { b.scale.set(1, 1, 1); b.position.copy(b.userData.base); b.visible = true; }); R.sawdust.forEach((s) => (s.visible = false)); R.puddle.visible = false; R.drips.forEach((d) => (d.visible = false));
  R.bigIce.visible = true; R.bigIce.scale.set(1, 1, 1); R.glasses.forEach((g) => (g.visible = true));
}
const at = (c, x, y, z, flip = false) => { c.mesh.visible = true; c.mesh.position.set(x, y, z); c.flip = flip; };
function faceAll() { all.forEach((c) => { if (c.mesh.visible) c.face(camera, c.flip); }); }
function melt(k, t) {
  R.holdIce.forEach((b, i) => { const m = clamp01(k * 1.2 - hsh(i, 4) * 0.2); b.scale.set(1 - m * 0.55, 1 - m * 0.65, 1 - m * 0.55); b.position.y = b.userData.base.y - (b.userData.base.y > 0.5 ? m * 0.38 : 0) - 0.3 * m * 0.65; });
  R.puddle.visible = k > 0.05; R.puddle.position.y = 0.02 + k * 0.12;
  R.drips.forEach((d, i) => { const ph = (t * 1.6 + hsh(i, 1)) % 1; const b = R.holdIce[(i * 3) % R.holdIce.length]; d.visible = k > 0.02; d.position.set(b.position.x + (hsh(i, 2) - 0.5) * 0.6, b.position.y + 0.25 - ph * 0.9, b.position.z + 0.32); });
}

// ---------- shots ----------
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      setPlace('isle', t);
      at(tudor, ISLE_X + 1.5, 0, 3.0, true); tudor.set({ ...TU, pose: 'point', expr: 'determined', sweat: true });
      [0, 1, 2, 3].forEach((i) => { const c = locals[i]; at(c, ISLE_X - 2.6 + i * 1.6 + (i > 1 ? 0.9 : 0), 0, 3.8 + (i % 2) * 0.7, i > 1); c.set({ ...ISL[i], expr: i % 2 ? 'nervous' : 'shock', pose: i === 2 ? 'point' : 'stand', sweat: true }); });
      const e = ease.io(u);
      look(v3(ISLE_X + lerp(2.5, 1.0, e), lerp(3.2, 2.0, e), lerp(12, 6.8, e)), v3(ISLE_X, lerp(1.8, 1.6, e), 1.8), lerp(50, 44, e), 0.03);
      return {};
  } },
  { id: 'place', start: S.place, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('pond', t);
      const sawing = Math.floor(t * 3) % 2 === 0;
      cutters.slice(0, 1).forEach((c) => { at(c, POND_X + 0.3, 0, -7); c.set({ pose: 'saw', swing: sawing, expr: 'determined', laugh: false }); });
      at(cutters[2], POND_X + 2.9, 0, -10.5, true); cutters[2].set({ pose: 'saw', swing: !sawing, expr: 'strain', sweat: false });
      at(tudor, POND_X - 1.8, 0, -4.8); tudor.set({ ...TU, pose: 'point', expr: 'happy', sweat: false });
      if (t < WT('place', 2)) { const e = ease.io(sw(t, S.place, WT('place', 2))); look(path([v3(14, 16, 18), v3(6, 7, 6)], e), v3(-4, 1, -10), 50); }
      else { const e = ease.io(sw(t, WT('place', 2), S.plan)); look(v3(lerp(3.8, 2.4, e), lerp(2.2, 1.6, e), lerp(0.6, -1.2, e)), v3(lerp(0, -0.6, e), 1.0, -7), 48, -0.03); }
      return {};
  } },
  { id: 'plan', start: S.plan, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const hotT = WT('plan', 4);
      if (t < hotT) { setPlace('pond', t); at(tudor, POND_X - 1.8, 0, -4.8); tudor.set({ ...TU, pose: t > WT('plan', 2) ? 'point' : 'stand', expr: 'aha', sweat: false }); look(v3(POND_X - 0.6, 1.7, -2.4), v3(POND_X - 1.8, 1.65, -4.8), 42, 0.03); return {}; }
      setPlace('isle', t);
      const c = locals[3]; at(c, ISLE_X - 1, 0, 5.2); c.set({ ...ISL[3], expr: 'cry', pose: 'stand', sweat: true }); c.mesh.scale.y = 1 - Math.abs(Math.sin(t * 5)) * 0.03;
      const e = ease.o(sw(t, hotT, S.laugh));
      look(v3(ISLE_X - 0.4, lerp(1.0, 1.6, e), lerp(9, 7.6, e)), v3(ISLE_X - 1, 1.6, 5.2), 44, Math.sin(t * 3) * 0.02);
      return { fx: { heat: 1, big: t > WT('plan', 7) ? { text: 'BOILING HOT!', k: t - WT('plan', 7), col: '#ff7a2a', size: 120 } : null } };
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('pond', t);
      cutters.forEach((c, i) => { at(c, POND_X - 4 + i * 1.2, Math.abs(Math.sin(t * 9 + i)) * 0.06, 0.4 - (i % 2) * 0.6, i % 2 === 1); c.set({ pose: ['laughbelly', 'point', 'laughbelly', 'point'][i], expr: 'laugh', swing: false }); });
      const e = ease.sine(u);
      look(v3(POND_X - 1.6 + lerp(-0.4, 0.4, e), 1.5, 5.0), v3(POND_X - 2.2, 1.5, 0.0), 46, -0.04);
      return { fx: { paper: t > WT('laugh', 2) ? t - WT('laugh', 2) : null } };
  } },
  { id: 'ship', start: S.ship, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const meltT = WT('ship', 6);
      if (t < meltT) { setPlace('sea', t); const e = ease.io(sw(t, S.ship, meltT)); look(v3(SEA_X + lerp(22, 14, e), lerp(5, 3.5, e), lerp(18, 8, e)), v3(SEA_X, 6, -2), 50, 0.04); return {}; }
      setPlace('hold', t);
      const k = sw(t, meltT, S.nobody + 0.3); melt(k, t);
      const dk = [8, 9, 10].findIndex((i, j) => t >= WT('ship', i) && (j === 2 || t < WT('ship', [9, 10][j])));
      if (dk < 0) look(v3(HOLD_X + 2.4, 1.8, 2.6), v3(HOLD_X - 0.4, 0.6, -2.4), 46);
      else { const tg = R.holdIce[[4, 7, 9][dk]].position; look(v3(HOLD_X + [1.2, -0.8, 0.5][dk] + tg.x, 1.6, tg.z + 4.6).add(shake(t, 0.01)), v3(HOLD_X + tg.x, tg.y - 0.1, tg.z), 44, [-0.05, 0.05, 0][dk]); }
      return { fx: { big: dk >= 0 ? { text: 'DRIP.', k: t - WT('ship', [8, 9, 10][dk]), col: '#8ad0ff', size: 130 + dk * 20, y: 0.24 + dk * 0.04 } : null } };
  } },
  { id: 'nobody', start: S.nobody, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('isle', t); R.bigIce.scale.setScalar(0.75);
      const touchT = WT('nobody', 6);
      const frozen = t >= touchT;
      [0, 1, 2, 4].forEach((ix, i) => { const c = locals[ix]; at(c, ISLE_X - 1.9 + i * 1.3, 0, 3.0 + (i % 2) * 0.5, i > 1); c.set({ ...ISL[ix], expr: i === 0 ? (frozen ? 'frozen' : 'ring') : i === 3 ? (frozen ? 'panic' : 'nervous') : 'ring', pose: i === 0 ? (frozen ? 'stuck' : 'point') : 'stand', faceColor: i === 0 && frozen ? '#cfeaff' : '#ffffff', sweat: i !== 0, lookX: i === 0 ? 1 : -1 }); if (i === 0 && frozen) c.mesh.position.x += Math.sin(t * 40) * 0.03; });
      const e = ease.io(u);
      if (!frozen) look(v3(ISLE_X - 0.4, lerp(2.4, 1.8, e), lerp(8.4, 7.2, e)), v3(ISLE_X - 0.6, 1.5, 2.6), 46);
      else look(v3(ISLE_X - 1.3, 1.65, 5.3).add(shake(t, 0.01)), v3(ISLE_X - 1.9, 1.6, 3.0), 40, 0.04);
      return {};
  } },
  { id: 'angry', start: S.angry, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('pond', t);
      const mad = t >= WT('angry', 4);
      investors.forEach((c, i) => { at(c, POND_X - 5 + i * 1.4, 0, 2 - i * 0.5, i === 1); c.set({ pose: mad ? 'fist' : 'stand', expr: mad ? 'furious' : 'angry', faceColor: mad ? '#ef6b5b' : '#ffffff', steam: mad, vein: mad && i === 0 }); });
      at(tudor, POND_X - 2.1, 0, 2.6, true); tudor.set({ ...TU, pose: 'stand', expr: mad ? 'nervous' : 'sad', sweat: true });
      const e = ease.o(sw(t, WT('angry', 4), WT('angry', 4) + 0.25));
      if (!mad) look(v3(POND_X - 3.0, 1.5, 7.2), v3(POND_X - 3.4, 1.5, 2), 46);
      else look(v3(POND_X - lerp(3.4, 4.0, e), 1.7, lerp(8.0, 6.6, e)).add(shake(t, 0.03)), v3(POND_X - 4.3, 1.6, 1.8), 44, 0.05);
      return {};
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('hold', t);
      const packT = WT('shrug', 4); const pk = sw(t, packT, S.payoff - 0.3);
      R.sawdust.forEach((s, i) => { const k = clamp01(pk * 1.6 - hsh(i, 6) * 0.6); s.visible = k > 0; s.scale.setScalar(ease.o(k)); });
      at(tudor, HOLD_X + 1.6, 0, -0.2); tudor.set({ ...TU, pose: t < packT ? 'shrug' : 'point', expr: t < packT ? 'bored' : 'smirk', sweat: false });
      if (t < packT) look(v3(HOLD_X + 1.0, 1.7, 2.4), v3(HOLD_X + 1.6, 1.6, -0.2), 40);
      else { const e = ease.io(pk); look(v3(HOLD_X + lerp(3.2, 2.2, e), lerp(2.4, 2.0, e), 3.4), v3(HOLD_X - 0.4, 0.9, -2.2), 50); }
      return { fx: { big: t >= packT + 0.4 ? { text: 'SAWDUST!', k: t - packT - 0.4, col: '#f2c860', size: 130 } : null } };
  } },
  { id: 'payoff', start: S.payoff, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('isle', t);
      const dT = WT('payoff', 3), cT = WT('payoff', 5), crazyT = WT('payoff', 7);
      locals.forEach((c, i) => { const dance = Math.abs(Math.sin(t * 8 + i)) * 0.15; at(c, ISLE_X - 4 + (i % 4) * 2.4 + (i > 3 ? 1.2 : 0), dance, 4.6 + Math.floor(i / 4) * 1.6, i % 2 === 1); c.set({ ...ISL[i], expr: ['yum', 'starry', 'laugh', 'yum'][i % 4], pose: i % 3 === 0 ? 'glass' : i % 3 === 1 ? 'cone' : 'stuck', sweat: false, faceColor: '#ffffff', scoop: ['#f6b8c8', '#c8f0a0', '#fff4c8'][i % 3] }); });
      at(tudor, ISLE_X + 2.6, 0, 2.6); tudor.set({ ...TU, pose: 'stuck', expr: 'happy', sweat: false });
      if (t < dT) look(v3(ISLE_X + 1.4, 1.8, 9.6), v3(ISLE_X - 0.2, 1.6, 3.8), 44);
      else if (t < cT) { const c = locals[0]; look(v3(c.mesh.position.x + 0.3, 1.9, c.mesh.position.z + 2.0), v3(c.mesh.position.x + 0.25, 1.75, c.mesh.position.z), 38, 0.04); }
      else if (t < crazyT) { const c = locals[1]; look(v3(c.mesh.position.x - 0.2, 1.85, c.mesh.position.z + 2.0), v3(c.mesh.position.x + 0.1, 1.75, c.mesh.position.z), 38, -0.04); }
      else { const e = ease.o(sw(t, crazyT, S.king)); look(v3(ISLE_X + lerp(4, 2, e), lerp(4, 2.6, e), lerp(14, 11, e)).add(shake(t, 0.015)), v3(ISLE_X, 1.6, 4), 52, Math.sin(t * 4) * 0.03); }
      return { fx: { big: t >= dT && t < cT ? { text: 'ICE COLD!', k: t - dT, col: '#8ad0ff' } : t >= cT && t < crazyT ? { text: 'ICE CREAM!', k: t - cT, col: '#f6a8c8' } : null } };
  } },
  { id: 'king', start: S.king, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('isle', t);
      const kingT = WT('king', 8);
      at(tudor, ISLE_X + 0.2, 0, 3.4); tudor.set({ ...TU, hat: t >= kingT ? 'crown' : 'tophat', pose: t >= kingT ? 'glass' : 'stand', expr: t >= kingT ? 'smirk' : 'happy' });
      look(v3(ISLE_X + 0.3, 1.75, 6.6), v3(ISLE_X + 0.2, 1.6, 3.4), 42);
      return { fx: { map: t < kingT ? sw(t, S.king, kingT - 0.1) : null, big: t >= kingT ? { text: 'THE ICE KING', k: t - kingT, col: '#f2c23a', size: 120 } : null } };
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      setPlace('isle', t); R.bigIce.visible = false;
      [0, 1, 2, 3, 4].forEach((ix, i) => { const c = locals[ix]; at(c, ISLE_X - 2.8 + i * 1.4, 0, 3.4 + (i % 2) * 0.6, i % 2 === 0); c.set({ ...ISL[ix], expr: i % 2 ? 'cry' : 'sad', pose: i % 2 ? 'glass' : 'stand', sweat: true, faceColor: '#ffffff', drink: 'rgba(160,120,80,0.8)' }); c.mesh.scale.y = 1 - Math.abs(Math.sin(t * 3 + i)) * 0.04; });
      const e = ease.sine(u);
      look(v3(ISLE_X - 0.2, 1.7, lerp(9, 7.4, e)), v3(ISLE_X - 0.2, 1.4, 3.6), 46);
      return { fx: { bw: 1, heat: 1, big: t >= WT('whatif', 2) ? { text: 'WARM DRINKS', k: t - WT('whatif', 2), col: '#ff9a4a', size: 110 } : null } };
  } },
  { id: 'end', start: S.end, run(t, u) {
      setPlace('isle', t);
      const wink = t > TL.speechEnd + 0.15;
      at(tudor, ISLE_X + 0.2, 0, 3.4); tudor.set({ ...TU, hat: 'tophat', pose: 'glass', expr: wink ? 'wink' : 'smirk' });
      locals.slice(0, 4).forEach((c, i) => { at(c, ISLE_X - 3 + i * 2.2 + (i > 1 ? 1.2 : 0), Math.abs(Math.sin(t * 8 + i)) * 0.12, -0.8, i % 2 === 1); c.set({ ...ISL[i], expr: 'yum', pose: i % 2 ? 'cone' : 'glass', sweat: false, faceColor: '#ffffff' }); });
      const e = ease.io(u);
      look(v3(ISLE_X + lerp(1.4, 0.6, e), lerp(1.8, 1.75, e), lerp(7.6, 5.9, e)), v3(ISLE_X + 0.3, lerp(1.6, 1.7, e), 3.4), 42);
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
function grade(cold) { cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = 0.16; const g = cx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, cold ? '#c8e0ff' : '#ffe8b0'); g.addColorStop(1, cold ? '#6a8ad8' : '#e0703a'); cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
function heat(t) { // shimmer: shift horizontal strips
  for (let i = 0; i < 24; i++) { const y = (i * 80 + (t * 120) % 80) | 0; cx.drawImage(comp, 0, y, W, 40, Math.sin(t * 9 + i) * 5, y, W, 40); }
  cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = 0.25; cx.fillStyle = '#ff8a3a'; cx.fillRect(0, 0, W, H); cx.restore();
}
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
function paper(k) { // Boston newspaper slap-in
  const s = k < 0.15 ? 2 - k / 0.15 : 1; const a = clamp01(k / 0.1);
  cx.save(); cx.globalAlpha = a; cx.translate(W / 2, H * 0.3); cx.rotate(-0.08 + Math.sin(k * 2) * 0.01); cx.scale(s, s);
  cx.fillStyle = '#f4ecd8'; cx.strokeStyle = '#151012'; cx.lineWidth = 10; cx.fillRect(-380, -260, 760, 520); cx.strokeRect(-380, -260, 760, 520);
  cx.fillStyle = '#151012'; cx.textAlign = 'center'; cx.font = '900 58px serif'; cx.fillText('BOSTON GAZETTE', 0, -190); cx.fillRect(-340, -165, 680, 6); cx.font = '700 26px serif'; cx.fillText('FEBRUARY 1806', 0, -130);
  cx.font = '900 54px serif'; cx.fillText('"A SLIPPERY', 0, -50); cx.fillText('SPECULATION"', 0, 10);
  cx.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 6; i++) { cx.fillRect(-340, 60 + i * 28, 320, 12); cx.fillRect(20, 60 + i * 28, 320, 12); }
  cx.save(); cx.translate(240, 130); cx.rotate(0.2); cx.fillStyle = '#8ad0ff'; cx.strokeStyle = '#151012'; cx.lineWidth = 6; cx.fillRect(-60, -45, 120, 90); cx.strokeRect(-60, -45, 120, 90); cx.restore();
  cx.restore();
}
function mapCard(k) { // route Boston -> Martinique -> Calcutta
  const a = clamp01(k * 4); cx.save(); cx.globalAlpha = a; cx.translate(W / 2, H * 0.36);
  cx.fillStyle = '#3a9ae8'; cx.strokeStyle = '#151012'; cx.lineWidth = 12; cx.beginPath(); cx.roundRect(-460, -300, 920, 600, 40); cx.fill(); cx.stroke();
  cx.fillStyle = '#7ac85a'; cx.lineWidth = 7;
  const blob = (pts) => { cx.beginPath(); pts.forEach(([x, y], i) => (i ? cx.lineTo(x, y) : cx.moveTo(x, y))); cx.closePath(); cx.fill(); cx.stroke(); };
  blob([[-420, -250], [-260, -260], [-230, -120], [-300, -40], [-260, 40], [-320, 0], [-400, -100]]); // N America
  blob([[-270, 60], [-200, 70], [-170, 160], [-230, 270], [-270, 180]]); // S America
  blob([[-60, -260], [60, -250], [80, -150], [20, -120], [-40, -150]]); // Europe
  blob([[-40, -100], [80, -90], [110, 40], [40, 220], [-20, 100], [-60, -20]]); // Africa
  blob([[90, -250], [400, -250], [420, -80], [300, 0], [220, -20], [160, 40], [120, -100]]); // Asia
  const pts = [[-300, -120], [-230, -10], [-80, 120], [60, 250], [200, 160], [230, 20]];
  cx.setLineDash([22, 16]); cx.strokeStyle = '#ffffff'; cx.lineWidth = 10; cx.beginPath(); const n = Math.max(2, Math.floor(clamp01(k) * pts.length * 1.0) + 1);
  pts.slice(0, n).forEach(([x, y], i) => (i ? cx.lineTo(x, y) : cx.moveTo(x, y))); cx.stroke(); cx.setLineDash([]);
  const lbl = (txt, x, y) => { cx.font = '900 34px Montserrat'; cx.textAlign = 'center'; cx.lineWidth = 8; cx.strokeStyle = '#151012'; cx.strokeText(txt, x, y); cx.fillStyle = '#ffffff'; cx.fillText(txt, x, y); };
  lbl('BOSTON', -300, -150); lbl('MARTINIQUE', -190, 30); if (k > 0.75) lbl('CALCUTTA', 240, -10);
  const [sx0, sy0] = pts[Math.min(pts.length - 1, n - 1)]; cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(sx0, sy0, 22, 0, 7); cx.fill(); cx.lineWidth = 6; cx.strokeStyle = '#151012'; cx.stroke(); cx.fillStyle = '#8ad0ff'; cx.fillRect(sx0 - 9, sy0 - 9, 18, 18);
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
    if (!fx.bw) grade(place === 'pond');
    if (fx.heat) heat(t);
    bloom(0.22);
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(place === 'hold' ? 0.45 : 0.24);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.paper != null) paper(fx.paper);
    if (fx.map != null) mapCard(fx.map);
    if (fx.big) pop(fx.big);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
