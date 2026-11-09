import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildShips, hullSideTex, YARD_X, SEA_X, UNDER_X } from './ships.js';
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

const R = buildShips();
const pmrem = new THREE.PMREMGenerator(renderer);
const envFrom = (top, hor, gnd) => { const s = new THREE.Scene(); s.add(skyDome(top, hor, gnd, 50)); const m = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(0xfff2d8).multiplyScalar(6) })); m.position.copy(R.sun.userData.dir).multiplyScalar(40); s.add(m); return pmrem.fromScene(s, 0.02).texture; };
const ENV = { day: envFrom(0x3a88e8, 0xd8f0ff, 0x6aa0a0), uw: envFrom(0x4ac8e8, 0x0a5a7a, 0x02202a) };

// ---------- cast ----------
const SW = { outfit: 'shipwright', hair: 'curly', hairColor: '#8a4a1a', stubble: true };
const wright = new Char({ ...SW, expr: 'bored', pose: 'hammer' }, 1.9); R.yard.add(wright.mesh);
const capt = new Char({ outfit: 'rncaptain', hat: 'tricorn', hair: 'wig', expr: 'angry', pose: 'stand' }, 2.0); R.yard.add(capt.mesh);
const tars = [
  new Char({ outfit: 'tar', hat: 'tarhat', expr: 'laugh', pose: 'laughbelly' }, 1.85),
  new Char({ outfit: 'tar', hair: 'short', stripe: '#1a3a8a', kerchief: '#c83a2a', expr: 'laugh', pose: 'point' }, 1.85),
  new Char({ outfit: 'tar', hair: 'curly', hairColor: '#2a1a10', stripe: '#c83a2a', expr: 'laugh', pose: 'walk1' }, 1.8),
];
tars.forEach((c) => R.yard.add(c.mesh));
const deckWright = new Char({ ...SW, expr: 'smirk', pose: 'stand' }, 1.9); R.hero.add(deckWright.mesh);
const deckTars = [0, 1, 2].map((i) => { const c = new Char({ outfit: 'tar', hat: i % 2 ? 'tarhat' : undefined, hair: i % 2 ? undefined : 'short', expr: 'determined', pose: 'stand', stripe: i % 2 ? '#c83a2a' : '#1a3a8a' }, 1.8); R.hero.add(c.mesh); return c; });

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d'); document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6; const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d'); const img = x.createImageData(360, 640); for (let i = 0; i < img.data.length; i += 4) { const v = Math.abs((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); return c; });

function look(pos, target, fov = 50, roll = 0) {
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(target); if (roll) camera.rotateZ(roll); camera.updateMatrixWorld(true);
  const dir = target.clone().sub(pos); const dist = Math.min(dir.length(), 22); dir.setY(0).normalize();
  const focus = pos.clone().addScaledVector(dir, dist * 0.7); focus.y = 0;
  R.sun.target.position.copy(focus); R.sun.position.copy(focus).addScaledVector(R.sun.userData.dir, 150); R.sun.target.updateMatrixWorld();
}
const path = (pts, u) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoint(clamp01(u));
const sw = (t, a, b) => clamp01((t - a) / (b - a));
const hsh = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------- state ----------
let place = 'yard';
function bob(ship, t, k) { ship.rotation.z = Math.sin(t * 0.9 + k) * 0.035; ship.rotation.x = Math.sin(t * 0.7 + k * 2) * 0.02; ship.position.y = Math.sin(t * 1.1 + k) * 0.12; ship.userData.flag.rotation.x = Math.sin(t * 6 + k) * 0.15; ship.userData.sails.forEach((s, i) => (s.scale.z = 1 + Math.sin(t * 2 + i) * 0.06)); }
function setPlace(p, t) {
  place = p;
  R.yard.visible = p === 'yard'; R.sea.visible = p === 'sea'; R.under.visible = p === 'under';
  R.clouds.forEach((c) => (c.visible = p !== 'under')); R.gulls.forEach((g) => (g.visible = p !== 'under'));
  R.sky.visible = p !== 'under';
  R.scene.fog = p === 'under' ? new THREE.FogExp2(0x0a5a7a, 0.045) : new THREE.Fog(0xcfeaff, 120, 600);
  R.scene.environment = p === 'under' ? ENV.uw : ENV.day; R.scene.environmentIntensity = 0.8;
  R.sun.intensity = p === 'under' ? 0 : 3.4; R.hemi.intensity = p === 'under' ? 1.2 : 0.6;
  R.hemi.color.set(p === 'under' ? 0x6ad8f0 : 0xd8ecff); R.hemi.groundColor.set(p === 'under' ? 0x02202a : 0x6aa0a0);
  renderer.toneMappingExposure = p === 'under' ? 1.3 : 1.15;
  tintChars(new THREE.Color(0xffffff));
  R.gulls.forEach((b) => { const u = b.userData; b.position.set((p === 'sea' ? SEA_X : YARD_X) + u.x + Math.sin(t * 0.3 + u.p) * 8, u.y + Math.sin(t * 2 + u.p), u.z + Math.cos(t * 0.3 + u.p) * 8); b.scale.y = 0.5 + 0.4 * Math.abs(Math.sin(t * 6 + u.p)); });
  R.clouds.forEach((c, i) => (c.position.x = (p === 'sea' ? SEA_X : YARD_X) + Math.cos(i / 18 * Math.PI * 2) * 240));
  R.seaN.offset.set(t * 0.004, -t * 0.03); R.harborN.offset.set(t * 0.003, t * 0.004); R.surfN.offset.set(t * 0.02, t * 0.015);
  R.yardFlag.rotation.y = Math.sin(t * 3) * 0.2;
}
// sea layout: hero at origin sailing -z; others relative
function seaState(t, opt = {}) {
  const lag = opt.lag || 0;
  bob(R.hero, t, 0); R.hero.position.x = 0; R.hero.position.z = 0;
  R.fouled.forEach((s, i) => { bob(s, t, i + 1); s.position.x = i ? 16 : -15; s.position.z = 8 + i * 6 + lag * (10 + i * 8); s.position.y -= 0.25; });
  R.enemies.forEach((s, i) => { bob(s, t, i + 4); s.visible = !!opt.enemies; s.position.set(-12 + i * 13, s.position.y, 70 - (opt.close || 0) * 30 + i * 10); });
  // wake
  R.wakes.forEach((w, i) => { const q = (t * 0.8 + hsh(i)) % 1; w.visible = true; const ship = i % 3 === 0 ? R.hero : R.fouled[i % 2]; const sp = i % 3 === 0 ? 1 : 0.4; w.position.set(ship.position.x + (hsh(i, 2) - 0.5) * 3 * (0.5 + q), 0.12, ship.position.z + 11 + q * 30 * sp); w.scale.setScalar(1 + q * 4); w.material.opacity = 0.7 * (1 - q); });
  deckWright.mesh.visible = !!opt.deck; deckTars.forEach((c, i) => { c.mesh.visible = !!opt.deck; c.mesh.position.set(-1.4 + i * 1.2, R.hero.userData.deckY, 2 + i * 1.5); c.face(camera); });
  if (opt.deck) { deckWright.mesh.position.set(0.6, R.hero.userData.deckY + 0.1, 3.5); deckWright.face(camera); }
  // cannon fire
  R.smoke.forEach((s) => (s.visible = false)); R.balls.forEach((b) => (b.visible = false)); R.splashes.forEach((s) => (s.visible = false));
  if (opt.fire) {
    for (let i = 0; i < 12; i++) {
      const per = 1.6, ph = (t * 1.0 + i * 0.37) % per / per, src = R.enemies[i % 3];
      const from = src.position.clone().add(v3(i % 2 ? 2.8 : -2.8, 2.0, -6 + (i % 5) * 2.5));
      const tgt = opt.near ? v3(9 + hsh(i, 3) * 7, 0, -24 + hsh(i, 4) * 16) : v3((hsh(i, 3) - 0.5) * 16 + (i % 2 ? 4 : -4), 0, -8 + hsh(i, 4) * 26);
      const ball = R.balls[i]; ball.visible = ph < 0.7; const q = ph / 0.7; ball.position.copy(from).lerp(tgt, q); ball.position.y = lerp(from.y, 0, q) + Math.sin(q * Math.PI) * 6;
      const sm = R.smoke[i]; sm.visible = ph < 0.5; sm.position.copy(from).add(v3(0, ph * 2, 0)); sm.scale.setScalar(2 + ph * 8); sm.material.opacity = 0.9 * (1 - ph * 2);
      const sp = R.splashes[i]; sp.visible = ph >= 0.7; const k = (ph - 0.7) / 0.3; sp.position.copy(tgt); sp.scale.set(1 + k, Math.sin(k * Math.PI) * 6 + 0.01, 1 + k); sp.material.opacity = 0.9 * (1 - k * 0.6);
    }
  }
}
function underState(t, opt = {}) {
  const foul = opt.foul ?? 1;
  const side = R.uFouled.userData.side; const step = Math.round(foul * 8) / 8; side.map = hullSideTex('fouled', 0, step); side.needsUpdate = true;
  R.weeds.forEach((w) => { w.visible = foul > 0.2; w.scale.y = foul; w.rotation.z = Math.sin(t * 1.5 + w.userData.p) * 0.3; w.rotation.x = Math.sin(t * 1.1 + w.userData.p) * 0.2; });
  R.worms.forEach((w, i) => { w.visible = !!opt.worms; w.material.map = R.wormT[Math.floor(t * 6 + i) % 2]; w.position.set(w.userData.x, 3.6 - Math.abs(Math.sin(t * 2 + w.userData.p)) * 0.15, w.userData.z); });
  const holesN = Math.floor((opt.holes || 0) * R.holes.length); R.holes.forEach((h, i) => (h.visible = i < holesN));
  R.bounceWorm.visible = !!opt.bounce;
  if (opt.bounce) { const q = opt.bounce; const hit = q < 0.5 ? q * 2 : 1; const back = q < 0.5 ? 0 : (q - 0.5) * 2; R.bounceWorm.position.set(5.5 - back * 1.5, lerp(1.2, 3.7, ease.o(hit)) - back * back * 3, -2 + back * 2); R.bounceWorm.material.rotation = back * 6; R.bounceWorm.material.map = R.wormT[q < 0.45 ? Math.floor(t * 8) % 2 : 0]; }
  R.bubbles.forEach((b, i) => { const on = !!opt.bubbles; b.visible = on; if (on) { const q = (t * 0.6 + hsh(i)) % 1; b.position.set(-5 + (hsh(i, 1) - 0.5) * 4, 3 + q * 6, (hsh(i, 2) - 0.5) * 16); b.scale.setScalar(0.12 + hsh(i, 3) * 0.3); } });
  R.motes.position.y = (t * 0.2) % 3;
}

// ---------- shots ----------
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      setPlace('sea', t); seaState(t, { enemies: true, fire: true, close: 0.5, lag: 0.6, near: true });
      const e = ease.sine(u);
      look(v3(SEA_X + lerp(6.5, 5.5, e), lerp(1.2, 1.8, e), lerp(9, -4, e)), v3(SEA_X + 0.5, 2.2, lerp(-6, -16, e)), 52, 0.05);
      return {};
  } },
  { id: 'year', start: S.year, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('yard', t); const e = ease.io(u);
      R.yShip.userData.side.map = hullSideTex('wood', 0, 0); R.yShip.userData.side.needsUpdate = true;
      look(path([v3(-14, 16, 34), v3(-10, 9, 22), v3(-7, 4, 14)], e), path([v3(0, 2, -20), v3(0, 4, -2), v3(1, 3.5, 0)], e), 50);
      wright.mesh.visible = false; capt.mesh.visible = false; tars.forEach((c) => (c.mesh.visible = false));
      return {};
  } },
  { id: 'plates', start: S.plates, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      setPlace('yard', t);
      const cov = ease.io(sw(t, S.plates + 0.4, WT('plates', 10)));
      R.yShip.userData.side.map = hullSideTex('wood', Math.round(cov * 10) / 10, 0); R.yShip.userData.side.needsUpdate = true;
      R.yShip.userData.bottom.color.set(cov > 0.95 ? 0xc8742a : 0x4a3a22);
      const swing = Math.floor(t * (cov < 1 ? 7 : 3)) % 2 === 0;
      wright.mesh.visible = true; wright.set({ ...SW, pose: 'hammer', swing, expr: 'bored' }); wright.mesh.position.set(4.2, 1.56, lerp(5, -4, cov)); wright.face(camera, true);
      R.sparks.forEach((s, i) => { s.visible = swing && i < 6; s.position.copy(wright.mesh.position).add(v3(-0.85, 1.15 + hsh(i, 1) * 0.3, (hsh(i, 2) - 0.5) * 0.5)); s.scale.setScalar(0.3 + hsh(i, 3) * 0.3); });
      capt.mesh.visible = false; tars.forEach((c) => (c.mesh.visible = false));
      if (t < WT('plates', 10)) look(v3(7.2, 2.6, wright.mesh.position.z + 3.5), v3(3.0, 2.2, wright.mesh.position.z - 0.5), 46, 0.03);
      else { const k = ease.io(sw(t, WT('plates', 10), S.laugh)); look(v3(lerp(8, 16, k), lerp(2.6, 5, k), lerp(-1, 14, k)), v3(0, 2.4, 0), 50); }
      return {};
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('yard', t); R.sparks.forEach((s) => (s.visible = false));
      R.yShip.userData.side.map = hullSideTex('wood', 1, 0); R.yShip.userData.bottom.color.set(0xc8742a);
      wright.mesh.visible = false; capt.mesh.visible = false;
      tars.forEach((c, i) => { c.mesh.visible = true; const dance = i === 2; c.set({ expr: 'laugh', pose: dance ? (Math.floor(t * 4) % 2 ? 'walk1' : 'walk2') : ['laughbelly', 'point'][i] }); c.mesh.position.set(7.2 + i * 1.0 + (dance ? Math.sin(t * 4) * 0.4 : 0), Math.abs(Math.sin(t * 9 + i)) * 0.06, 4.5 - i * 0.7); c.face(camera, i === 1); });
      look(v3(lerp(10.5, 10.0, u), 1.5, lerp(9.5, 9.0, u)), v3(7.8, 1.3, 3.8), 46, -0.08);
      return {};
  } },
  { id: 'cap', start: S.cap, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('yard', t); const e = ease.io(u); tars.forEach((c) => (c.mesh.visible = false)); wright.mesh.visible = false;
      const wk = sw(t, S.cap - 0.4, S.cap + 0.9);
      const spec = { outfit: 'rncaptain', hat: 'tricorn', hair: 'wig', pose: wk < 1 ? (Math.floor(t * 6) % 2 ? 'walk1' : 'walk2') : 'stand', expr: 'angry', faceColor: '#ffffff', steam: false };
      if (t >= WT('cap', 3)) { spec.faceColor = '#ef6b5b'; spec.steam = true; }
      if (t >= WT('cap', 4)) { spec.pose = 'fist'; spec.expr = 'shout'; }
      capt.mesh.visible = true; capt.set(spec); const cz = lerp(9, 6.2, ease.o(wk)); capt.mesh.position.set(6.4, 0, cz);
      look(v3(lerp(7.8, 7.0, e), lerp(0.5, 0.9, e), lerp(cz + 4.5, cz + 2.6, e)), v3(6.4, lerp(1.4, 1.6, e), cz), lerp(50, 40, e), -0.04);
      capt.face(camera);
      return {};
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('yard', t); capt.mesh.visible = false; tars.forEach((c) => (c.mesh.visible = false));
      const hamT = WT('shrug', 2);
      const swing = t >= hamT && Math.floor(t * 7) % 2 === 0;
      wright.mesh.visible = true; wright.set({ ...SW, pose: t < hamT ? 'shrug' : 'hammer', swing, expr: t < hamT ? 'bored' : 'smirk' }); wright.mesh.position.set(4.2, 1.56, -4.2);
      look(v3(6.6, 3.0, -2.0), v3(4.2, 2.9, -4.2), 40);
      wright.face(camera, true);
      R.sparks.forEach((s, i) => { s.visible = swing && i < 8; s.position.copy(wright.mesh.position).add(v3(-0.85, 1.15 + hsh(i + Math.floor(t * 7), 1) * 0.4, (hsh(i, 2) - 0.5) * 0.6)); s.scale.setScalar(0.3 + hsh(i, 3) * 0.4); });
      return {};
  } },
  { id: 'later', start: S.later, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('sea', t); seaState(t, {}); const e = ease.io(u);
      const dive = ease.i(sw(t, WT('later', 9) - 0.3, S.guests));
      look(v3(SEA_X + lerp(-44, -32, e) + dive * 8, lerp(12, 6, e) - dive * 5.5, lerp(44, 34, e) - dive * 14), v3(SEA_X + lerp(-10, -16, e), lerp(4, 0.5, e) - dive * 2, lerp(-6, 10, e)), 50, 0.03);
      return { blur: dive > 0.2 };
  } },
  { id: 'guests', start: S.guests, run(t, u) {
      setPlace('under', t);
      const foul = ease.o(sw(t, S.guests, WT('guests', 3)));
      underState(t, { foul, worms: t >= WT('guests', 3), holes: sw(t, WT('guests', 5), S.slow) });
      const e = ease.sine(u);
      look(v3(UNDER_X + lerp(-1.5, -2.5, e), lerp(1.2, 2.2, e), lerp(9, 2, e)), v3(UNDER_X - 5, 4.3, lerp(2, -3, e)), 50, 0.05);
      return {};
  } },
  { id: 'slow', start: S.slow, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      setPlace('sea', t); const lag = ease.io(sw(t, S.slow, S.enemy)) * 0.5;
      seaState(t, { lag });
      look(v3(SEA_X - 26, 3.5, lerp(10, 24, u)), v3(SEA_X - 15, 2, lerp(8, 22, u)), 52, 0.04);
      return { fx: { slow: t >= WT('slow', 3) ? sw(t, WT('slow', 3), WT('slow', 3) + 0.15) : 0, slower: t >= WT('slow', 5) ? sw(t, WT('slow', 5), WT('slow', 5) + 0.15) : 0 } };
  } },
  { id: 'enemy', start: S.enemy, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('sea', t);
      const lag = 0.5 + ease.io(sw(t, WT('enemy', 4), S.smooth)) * 1.5, close = ease.io(u);
      seaState(t, { lag, enemies: true, fire: t >= WT('enemy', 2), close, deck: true });
      if (t < WT('enemy', 7)) look(v3(SEA_X + 6, 9, 24), v3(SEA_X + 0, 3, 60), 46, -0.05);
      else { const e = ease.io(sw(t, WT('enemy', 7), S.smooth)); look(v3(SEA_X + lerp(14, 9, e), lerp(5, 3.4, e), lerp(16, 6, e)), v3(SEA_X, 3, lerp(-2, -8, e)), 52, 0.06); }
      return { blur: Math.abs(t - WT('enemy', 7)) < 0.1 };
  } },
  { id: 'smooth', start: S.smooth, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      setPlace('under', t); underState(t, { foul: 1, worms: false, holes: 1, bounce: sw(t, S.smooth + 0.2, WT('smooth', 4) + 0.3) });
      const e = ease.sine(u);
      look(v3(UNDER_X + lerp(10.5, 9.5, e), lerp(1.0, 1.6, e), lerp(6, 3.5, e)), v3(UNDER_X + 5.5, 4.6, -2), 50, -0.04);
      return {};
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      const sinkT = WT('whatif', 6);
      if (t < sinkT) {
        setPlace('under', t); underState(t, { foul: 1, worms: true, holes: 1, bubbles: true });
        const cr = sw(t, WT('whatif', 3), sinkT); R.uFouled.rotation.z = cr * 0.08; R.uFouled.position.y = 6.6 - cr * 0.6;
        look(v3(UNDER_X - 1.5, 2.0, 7), v3(UNDER_X - 5, 4.2, 0), 50, 0.06);
        return { fx: { bw: 1 } };
      }
      R.uFouled.rotation.z = 0; R.uFouled.position.y = 6.6;
      setPlace('sea', t); seaState(t, {});
      const k = ease.i(sw(t, sinkT, S.end)); const f = R.fouled[0]; f.position.set(-6, -k * 9, 4); f.rotation.set(-k * 0.5, 0, k * 0.35);
      look(v3(SEA_X + 6, 3.5, 26), v3(SEA_X - 6, 1 - k * 2, 4), 50, 0.05);
      return { fx: { bw: 1 } };
  } },
  { id: 'end', start: S.end, run(t, u) {
      setPlace('sea', t); seaState(t, { deck: true }); const e = ease.io(u);
      const near = t >= WT('end', 7) - 0.2;
      if (!near) look(v3(SEA_X + lerp(9, 7, e), lerp(2.2, 3.4, e), lerp(30, 22, e)), v3(SEA_X, 2.6, -2), 50);
      else { const k = ease.io(sw(t, WT('end', 7) - 0.2, TL.speechEnd + 0.3)); look(v3(SEA_X + lerp(4.2, 3.2, k), R.hero.userData.deckY + 2.0, lerp(6.2, 5.6, k)), v3(SEA_X + 0.6, R.hero.userData.deckY + 1.4, 3.5), lerp(48, 38, k)); }
      deckWright.set({ ...SW, expr: t > TL.speechEnd + 0.2 ? 'wink' : 'smirk', pose: 'plate' });
      return { fx: { rewind: clamp01(1 - (t - S.end) / 0.4), stamp: t >= WT('end', 7) ? sw(t, WT('end', 7), WT('end', 7) + 0.18) : 0, sparkle: t > TL.speechEnd + 0.25 ? (t - TL.speechEnd - 0.25) / 0.6 : 0 } };
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
function vhs(t, amount) {
  if (amount <= 0) return;
  for (let i = 0; i < 9; i++) { const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60); cx.drawImage(comp, 0, y, W, h, Math.sin(t * 80 + i) * 60 * amount, y, W, h); }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2); cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function bigText(txt, k, y = 0.64, size = 150, col = '#ffd23f', rot = -0.05) {
  if (k <= 0) return; const s = 0.4 + 0.6 * ease.o(k) + Math.sin(k * Math.PI) * 0.15;
  cx.save(); cx.translate(W / 2, H * y); cx.scale(s, s); cx.rotate(rot); cx.font = `900 ${size}px Montserrat`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.lineJoin = 'round'; cx.lineWidth = 22; cx.strokeStyle = '#141010'; cx.strokeText(txt, 0, 0); cx.fillStyle = col; cx.fillText(txt, 0, 0); cx.restore();
}
function stamp(k) {
  if (k <= 0) return; const s = 2.2 - 1.2 * ease.o(k);
  cx.save(); cx.translate(W / 2, H * 0.76); cx.rotate(-0.12); cx.scale(s * 0.95, s * 0.95); cx.globalAlpha = Math.min(1, k * 1.5);
  cx.font = '900 96px Montserrat'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; const w = cx.measureText('COPPER-BOTTOMED').width + 70;
  cx.lineWidth = 14; cx.strokeStyle = '#c8742a'; cx.strokeRect(-w / 2, -80, w, 160); cx.lineWidth = 5; cx.strokeRect(-w / 2 + 14, -66, w - 28, 132);
  cx.fillStyle = '#e8892e'; cx.shadowColor = 'rgba(0,0,0,0.5)'; cx.shadowBlur = 10; cx.fillText('COPPER-BOTTOMED', 0, 6); cx.restore();
}
function sparkle(k) {
  for (const [x, y, s0] of [[0.6, 0.42, 1], [0.68, 0.37, 0.6], [0.55, 0.36, 0.5]]) {
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
    bloom(place === 'under' ? 0.28 : 0.2);
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(place === 'under' ? 0.4 : 0.26);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.slow) bigText('SLOWER…', fx.slow, 0.62, 120, '#9ad04a', -0.05);
    if (fx.slower) bigText('AND SLOWER…', fx.slower, 0.72, 110, '#7ab03a', 0.04);
    if (fx.stamp) stamp(fx.stamp);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
