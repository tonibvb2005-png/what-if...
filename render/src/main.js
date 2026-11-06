import * as THREE from 'three';
import { buildTimeline } from './timeline.js';
import { buildDesert, DECK_Y } from './desert.js';
import { buildTomb, buildLab, buildMacro, HERO_PX } from './interiors.js';
import { ease, clamp01, lerp, v3 } from './world.js';

const W = 1080, H = 1920;
const RS = window.RENDER_SCALE || 0.75;
const TL = buildTimeline();
const { S } = TL;
const wordsOf = (sid) => TL.words.filter((w) => w.sid === sid);
const WT = (sid, k) => wordsOf(sid)[k].start;

// ---------- renderer ----------
const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(Math.round(W * RS), Math.round(H * RS), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 1200);

const D = buildDesert(), T = buildTomb(), L = buildLab(), M = buildMacro();

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d');
document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6;
const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => {
  const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d');
  const img = x.createImageData(360, 640);
  for (let i = 0; i < img.data.length; i += 4) { const v = (Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1; const g = Math.abs(v) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = g; img.data[i + 3] = 255; }
  x.putImageData(img, 0, 0); return c;
});

// ---------- helpers ----------
function look(pos, target, fov = 50, roll = 0) {
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(target);
  if (roll) camera.rotateZ(roll);
  camera.updateMatrixWorld(true);
  camera.userData.target = target.clone();
}
function path(points, u) {
  const c = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  return c.getPoint(clamp01(u));
}
const sw = (t, a, b) => clamp01((t - a) / (b - a));

// ---------- desert state from global time ----------
let whatIf = false;
function sledgeZ(t) {
  if (whatIf) return 0;
  const a = S.pull + 0.35;
  if (t < a) return 0;
  const u = t - a;
  return u < 1.2 ? 1.4 * u * u : 1.4 * 1.44 + 3.36 * (u - 1.2);
}
function desertState(t) {
  const z = sledgeZ(t);
  D.sledge.position.z = z;
  const grab = WT('men', 2);
  const tension = whatIf ? 1 : clamp01((t - grab) / 0.35);
  D.updateRopes(tension);
  // which way is "forward" on screen?
  const p0 = v3(0, 0.8, z + 5.5).project(camera), p1 = v3(0, 0.8, z + 9).project(camera);
  const fwdRight = p1.x > p0.x;
  const laughing = t >= S.laugh && t < S.overseer + 0.4;
  const stumbleT = WT('pull', 6);
  const fallT = WT('whatif', 2);
  D.workers.forEach((c, i) => {
    let pose = t >= grab || whatIf ? 'pull' : 'stand';
    let expr = pose === 'pull' ? (i % 3 ? 'strain' : 'neutral') : 'neutral';
    let sweat = pose === 'pull' && i % 4 === 0;
    if (laughing && c.k < 6) { expr = 'laugh'; pose = c.k === 1 && c.rope === 2 ? 'point' : 'pull'; sweat = false; }
    if (!whatIf && t >= S.pull + 0.4) { expr = i % 2 ? 'happy' : 'neutral'; sweat = false; }
    if (!whatIf && t >= stumbleT && t < S.ritual && c.k < 14) { pose = 'stumble'; expr = 'shock'; }
    if (whatIf) { expr = 'strain'; sweat = true; if (t >= fallT + (c.k % 7) * 0.05) { pose = 'fallen'; } }
    c.set({ pose, expr, sweat });
    const bob = pose === 'pull' && t >= S.pull && !whatIf ? Math.abs(Math.sin(t * 7 + c.phase)) * 0.05 : 0;
    c.mesh.position.set(c.base.x, bob, c.base.z);
    c.face(camera, pose === 'point' || pose === 'stand' ? false : !fwdRight);
  });
  // hero
  const N = D.neferu;
  D.neferu.mesh.visible = D.nsh.visible = !whatIf;
  let npose = 'pour', nexpr = 'bored';
  if (t >= S.shrug && t < WT('shrug', 2)) { npose = 'shrug'; nexpr = 'bored'; }
  else if (t >= WT('shrug', 2) && t < S.pull) { npose = 'pour'; nexpr = 'smirk'; }
  else if (t >= S.pull) { npose = 'hold'; nexpr = 'smirk'; }
  N.set({ pose: npose, expr: nexpr });
  N.face(camera, !fwdRight);
  if (!whatIf && npose === 'pour') {
    const sp = N.worldPoint(N.meta.spout[0], N.meta.spout[1]);
    const to = v3(sp.x, 0.03, Math.max(sp.z + 0.35, z + 5.9));
    D.setStream(true, t, sp, to);
  } else D.setStream(false, t);
  D.wet.visible = !whatIf;
  const wetGrow = clamp01((t - 0.0) / 6);
  D.wet.scale.set(1.2 + 1.1 * wetGrow, 0.7 + 0.6 * wetGrow, 1);
  D.tracks.forEach((tr) => { const len = Math.max(0.01, z); tr.visible = !whatIf && z > 0.05; tr.scale.y = len; tr.position.z = -5.5 + len / 2; });
  // overseer
  const O = D.overseer;
  const oIn = S.overseer - 0.6;
  const walkU = clamp01((t - oIn) / 1.3);
  const op = v3(lerp(7.2, 4.3, ease.o(walkU)), 0, lerp(3.2, 7.4, ease.o(walkU)));
  O.mesh.visible = D.osh.visible = !whatIf && t >= oIn - 0.2;
  O.mesh.position.copy(op); D.osh.position.set(op.x, 0.02, op.z);
  let opose = walkU < 1 ? (Math.floor(t * 6) % 2 ? 'walk1' : 'walk2') : 'staff', oexpr = 'angry', face = '#ffffff', steam = false;
  if (t >= WT('overseer', 3)) { face = '#ef6b5b'; steam = true; }
  if (t >= WT('overseer', 4)) { opose = 'fist'; oexpr = 'shout'; }
  if (t >= S.shrug) { opose = 'staff'; oexpr = 'angry'; }
  if (t >= S.pull) { oexpr = 'shock'; face = '#ffffff'; steam = false; }
  O.set({ pose: opose, expr: oexpr, faceColor: face, steam });
  O.face(camera, false);
  D.extraG.visible = whatIf && t >= WT('whatif', 5) - 0.2;
  if (D.extraG.visible) {
    const u = t - (WT('whatif', 5) - 0.2);
    D.extra.forEach((c) => { c.set({ pose: Math.floor(t * 7 + c.phase) % 2 ? 'walk1' : 'walk2', expr: 'neutral' }); c.mesh.position.set(c.base.x, 0, c.base.z + 40 - Math.min(40, u * 22)); c.face(camera, fwdRight); });
  }
  D.dust.rotation.y = t * 0.01;
}

function tombState(t, wink) {
  T.torches.forEach((tc, i) => { const f = 0.85 + Math.sin(t * 13 + i * 3) * 0.08 + Math.sin(t * 29 + i) * 0.06; tc.L.intensity = 22 * f; tc.fl.scale.set(1.4 * f, 2.0 * (0.9 + 0.2 * Math.sin(t * 17 + i)), 1); });
  T.muralMat.map = wink ? T.muralB : T.muralA;
  T.dust.rotation.y = t * 0.02; T.dust.position.y = Math.sin(t * 0.5) * 0.1;
}

// ---------- shots ----------
// each: start (s), trans {type, dur}, run(t,u,d) -> {scene, blur, fx}
const NEF = () => v3(0.95, DECK_Y + 1.3, 4.55 + sledgeZ(0));
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      look(path([v3(2.75, 1.45, 8.1), v3(2.15, 1.55, 7.35)], ease.sine(u)), v3(0.95, 1.95, 5.3), 42);
      desertState(t); return { scene: D.scene };
  } },
  { id: 'reveal', start: S.egypt, run(t, u) {
      const e = ease.io(u);
      const pos = path([v3(2.15, 1.55, 7.35), v3(2.4, 0.7, 8.6), v3(4.6, 0.55, 6.5), v3(6.0, 0.45, 3.5), v3(6.2, 0.4, 9.2)], e);
      const tgt = path([v3(0.95, 1.95, 5.3), v3(1.0, 0.1, 6.2), v3(1.6, 0.5, 1.5), v3(0.5, 2.5, 0.0), v3(0, 4.4, -0.8)], e);
      look(pos, tgt, lerp(42, 64, e)); desertState(t); return { scene: D.scene };
  } },
  { id: 'drone', start: S.men, run(t, u) {
      const e = ease.io(u);
      const pos = path([v3(6.2, 0.4, 9.2), v3(9, 4, 6), v3(10, 9, 3), v3(8.5, 12, 4)], e);
      const tgt = path([v3(0, 4.4, -0.8), v3(0, 3, 8), v3(0, 0.5, 18), v3(0, 0, 20)], e);
      look(pos, tgt, lerp(64, 55, e)); desertState(t); return { scene: D.scene };
  } },
  { id: 'crane', start: S.oneman, run(t, u, d) {
      const k = Math.min(1, (t - S.oneman) / 1.1);
      const e = ease.io(k);
      const pos = path([v3(8.5, 12, 4), v3(6, 6, 10), v3(3.4, 2.6, 8.9)], e).add(v3(0, 0, 0)).lerp(v3(2.7, 2.3, 7.5), ease.sine(clamp01((t - S.oneman - 1.1) / Math.max(0.1, d - 1.1))));
      const tgt = path([v3(0, 0, 20), v3(0.8, 1.5, 9), v3(0.95, 2.0, 5.2)], e);
      look(pos, tgt, lerp(55, 44, e)); desertState(t); return { scene: D.scene, blur: k > 0.15 && k < 0.85 };
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      look(v3(lerp(5.0, 4.3, u), 1.25, lerp(12.8, 12.2, u)), v3(1.4, 1.25, 9.7), 46, 0.13);
      desertState(t); return { scene: D.scene };
  } },
  { id: 'overseer', start: S.overseer, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const e = ease.io(u);
      look(v3(lerp(6.6, 5.0, e), lerp(0.4, 0.75, e), lerp(11.6, 9.0, e)), v3(lerp(5.2, 4.3, e), lerp(1.3, 1.55, e), 7.4), lerp(52, 40, e), -0.04);
      desertState(t); return { scene: D.scene };
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      look(v3(lerp(2.75, 2.55, u), 2.15, lerp(8.0, 7.7, u)), v3(0.95, 2.05, 5.1), 40);
      desertState(t); return { scene: D.scene };
  } },
  { id: 'pull', start: S.pull, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const z = sledgeZ(t);
      look(v3(4.6, 0.55, z + lerp(10.5, 9.5, u)), v3(1.0, 1.2, z + 3.0), 56, 0.04);
      desertState(t); return { scene: D.scene };
  } },
  { id: 'stumble', start: WT('pull', 6), trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const z = sledgeZ(t);
      look(v3(4.4, 1.4, z + 16.5), v3(1.0, 1.0, z + 11.5), 50, -0.12);
      desertState(t); return { scene: D.scene };
  } },
  { id: 'ritual', start: S.ritual, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      const e = ease.sine(u);
      look(v3(lerp(-3.2, 2.4, e), lerp(2.4, 2.2, e), lerp(5.6, 5.2, e)), v3(lerp(-0.8, 0.6, e), 3.2, -4), 58);
      tombState(t, false);
      T.arch.forEach((a) => { a.mesh.visible = true; a.face(camera); });
      const rt = WT('ritual', 10);
      T.arch[0].set({ expr: t > rt ? 'happy' : 'neutral' });
      T.arch[1].set({ expr: t > rt ? 'aha' : 'neutral' });
      T.bubble.visible = t > rt - 0.05;
      const pop = clamp01((t - rt + 0.05) / 0.12);
      T.bubble.position.copy(T.arch[0].mesh.position).add(v3(0.6, 2.55, 0));
      T.bubble.scale.set(2.0 * (0.6 + 0.4 * ease.o(pop)), 1.0 * (0.6 + 0.4 * ease.o(pop)), 1);
      T.mural.material = T.muralMat;
      return { scene: T.scene };
  } },
  { id: 'lab', start: S.lab, run(t, u) {
      const e = ease.sine(u);
      look(v3(lerp(0.4, 1.0, e), lerp(2.6, 2.2, e), lerp(4.8, 3.6, e)), v3(lerp(0.0, 0.6, e), 1.45, 0), 48);
      L.mini.position.x = lerp(-0.9, 0.95, ease.io(clamp01((t - S.lab - 0.4) / 2)));
      L.string.scale.x = Math.max(0.05, (2.05 - L.mini.position.x) / 2.2); L.string.position.x = (L.mini.position.x + 2.05) / 2;
      L.setGauge(lerp(100, 92, e));
      L.phys.set({ expr: t > WT('lab', 4) ? 'aha' : 'neutral', pose: t > WT('lab', 4) ? 'point' : 'stand' });
      L.phys.face(camera);
      return { scene: L.scene };
  } },
  { id: 'macro', start: S.macro, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      const e = ease.sine(u);
      look(v3(lerp(-5, -1.5, e), lerp(4.6, 3.4, e), lerp(7.0, 5.0, e)), v3(lerp(-1, 1.0, e), 0, lerp(-0.5, -1.5, e)), 50, 0.05);
      const g0 = WT('macro', 2);
      M.bridges.forEach((b) => { const k = clamp01((t - g0 - b.userData.delay * 0.5) / 0.25); b.scale.set(k, 1, k); b.visible = k > 0.01; });
      M.sparkles.forEach((s) => { const k = clamp01((t - g0 - s.userData.delay * 0.5) / 0.25); s.material.opacity = k * (0.7 + 0.3 * Math.sin(t * 9 + s.userData.delay * 20)); });
      M.grains.forEach((g, i) => { const k = clamp01((t - g0) / 0.6); g.position.copy(g.userData.base).multiplyScalar(1 - 0.06 * k); });
      const r0 = WT('macro', 6);
      M.runner.position.set(lerp(-22, 4, clamp01((t - r0) / 2.0)), 1.55, -0.5);
      return { scene: M.scene };
  } },
  { id: 'gauge', start: S.half, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      look(v3(lerp(2.6, 2.35, u), lerp(1.95, 1.85, u), lerp(1.75, 1.35, u)), v3(2.12, 1.72, 0.05), 42);
      const k = ease.io(clamp01((t - S.half - 0.35) / 0.8));
      L.setGauge(lerp(100, 50, k)); L.phys.face(camera);
      return { scene: L.scene, fx: { half: clamp01((t - WT('half', 5)) / 0.15) } };
  } },
  { id: 'whatif', start: S.whatif, run(t, u, d) {
      whatIf = true;
      const e = ease.sine(u);
      look(v3(lerp(9.5, 8.5, e), lerp(4.6, 5.4, e), lerp(23, 21.5, e)), v3(0, 0.6, 13), 54, 0.14);
      desertState(t);
      whatIf = false;
      return { scene: D.scene, fx: { bw: 1, x2: clamp01((t - WT('whatif', 6)) / 0.15) } };
  } },
  { id: 'wall', start: S.wall, run(t, u) {
      const hero = T.muralPoint(HERO_PX[0], HERO_PX[1]);
      const k = ease.io(clamp01((t - S.wall) / Math.max(0.5, S.front - S.wall)));
      const p = clamp01((t - S.front) / Math.max(0.3, TL.speechEnd - S.front));
      const start = v3(-4.8, 4.2, 2.4);
      let pos = start.clone().lerp(hero.clone().add(v3(0, 0, 3.4)), k);
      pos.lerp(hero.clone().add(v3(0, 0, 2.3)), ease.io(p));
      const tgt = v3(-4.8, 4.0, -5).lerp(hero, k);
      look(pos, tgt, 46);
      tombState(t, t > TL.speechEnd + 0.25);
      T.arch.forEach((a) => (a.mesh.visible = false)); T.bubble.visible = false;
      return { scene: T.scene, fx: { rewind: clamp01(1 - (t - S.wall) / 0.4), sparkle: t > TL.speechEnd + 0.25 ? (t - TL.speechEnd - 0.25) / 0.6 : 0 } };
  } },
];
for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : TL.duration;
const rewindShot = shots.find((s) => s.id === 'whatif');
rewindShot.rewind = 0.45;

function shotAt(t) { let s = shots[0]; for (const x of shots) if (t >= x.start) s = x; return s; }

const tmpWhip = new THREE.Euler();
function renderShot(shot, t, alpha = 1, whip = 0) {
  const u = (t - shot.start) / (shot.end - shot.start);
  const res = shot.run(t, u, shot.end - shot.start);
  if (whip) { camera.rotateY(whip); }
  // update billboards facing after whip rotation is negligible
  renderer.render(res.scene, camera);
  cx.save();
  cx.globalAlpha = alpha;
  cx.filter = res.fx && res.fx.bw ? 'grayscale(1) contrast(1.25) brightness(0.95)' : 'saturate(1.18) contrast(1.05)';
  cx.drawImage(glCanvas, 0, 0, W, H);
  cx.restore();
  return res;
}

function bloom() {
  sx.filter = 'brightness(1.05) contrast(1.8) blur(5px)';
  sx.clearRect(0, 0, small.width, small.height);
  sx.drawImage(comp, 0, 0, small.width, small.height);
  cx.save(); cx.globalCompositeOperation = 'screen'; cx.globalAlpha = 0.16; cx.drawImage(small, 0, 0, W, H); cx.restore();
}
function vignette(strength = 0.35) {
  const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75);
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  cx.fillStyle = g; cx.fillRect(0, 0, W, H);
}
function vhs(t, amount) {
  if (amount <= 0) return;
  const img = cx.getImageData(0, 0, W, H);
  cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
  cx.putImageData(img, 0, 0);
  // tearing bands
  for (let i = 0; i < 9; i++) {
    const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60);
    const off = Math.sin(t * 80 + i) * 60 * amount;
    cx.drawImage(comp, 0, y, W, h, off, y, W, h);
  }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000';
  for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2);
  cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8;
  cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function grain(t, amt) {
  cx.save(); cx.globalAlpha = amt; cx.globalCompositeOperation = 'overlay';
  const gimg = grains[Math.floor(t * 30) % 4];
  cx.drawImage(gimg, 0, 0, W, H); cx.restore();
}
function bigText(txt, k, y = 0.62, size = 260) {
  if (k <= 0) return;
  const s = 0.4 + 0.6 * ease.o(k) + Math.sin(k * Math.PI) * 0.15;
  cx.save(); cx.translate(W / 2, H * y); cx.scale(s, s); cx.rotate(-0.06);
  cx.font = `900 ${size}px Montserrat`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.lineJoin = 'round'; cx.lineWidth = 26; cx.strokeStyle = '#141010'; cx.strokeText(txt, 0, 0);
  cx.fillStyle = '#ffd23f'; cx.fillText(txt, 0, 0); cx.restore();
}
function sparkle(k) {
  const pts = [[0.58, 0.36, 1], [0.66, 0.31, 0.6], [0.53, 0.29, 0.5]];
  for (const [x, y, s0] of pts) {
    const s = s0 * Math.sin(Math.min(1, k) * Math.PI) * 90;
    cx.save(); cx.translate(W * x, H * y); cx.rotate(k * 1.5);
    cx.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * 0.28 : s; const a = i * Math.PI / 4; cx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } cx.closePath();
    cx.fillStyle = '#fff6c0'; cx.strokeStyle = '#141010'; cx.lineWidth = 7; cx.stroke(); cx.fill(); cx.restore();
  }
}
function captions(t) {
  const g = TL.groups.find((x) => t >= x.start && t < x.hide);
  if (!g) return;
  const k = clamp01((t - g.start) / 0.07);
  const s = 1.12 - 0.12 * ease.o(k);
  cx.save(); cx.translate(W / 2, H * 0.355); cx.scale(s, s);
  cx.font = '800 66px Montserrat'; cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.lineJoin = 'round';
  cx.shadowColor = 'rgba(0,0,0,0.55)'; cx.shadowBlur = 14; cx.shadowOffsetY = 4;
  cx.lineWidth = 12; cx.strokeStyle = '#000'; cx.strokeText(g.text, 0, 0);
  cx.shadowColor = 'transparent'; cx.fillStyle = '#fff'; cx.fillText(g.text, 0, 0);
  cx.restore();
}

window.TIMELINE = TL;
window.SHOTS = shots.map((s) => ({ id: s.id, start: s.start, end: s.end, trans: s.trans ? s.trans.type : null }));
window.DURATION = TL.duration;
window.renderAt = function (t, opts = {}) {
  const shot = shotAt(t);
  const idx = shots.indexOf(shot);
  const prev = shots[idx - 1];
  cx.globalAlpha = 1; cx.fillStyle = '#000'; cx.fillRect(0, 0, W, H);
  const lt = t - shot.start;
  let res;
  const tr = shot.trans || {};
  if (shot.rewind && lt < shot.rewind && prev) {
    // play the previous shot backwards, fast
    const rt = shot.start - lt * 4;
    res = renderShot(prev, rt);
    bloom(); vhs(t, 1);
  } else {
    const subs = [];
    let blur = false;
    if (tr.type === 'whip' && prev && lt < tr.dur) blur = true;
    const nxt = shots[idx + 1];
    if (nxt && nxt.trans && nxt.trans.type === 'whip' && shot.end - t < nxt.trans.dur) blur = true;
    const whipAt = (tt) => {
      if (tr.type === 'whip' && prev && tt - shot.start < tr.dur) return -0.5 * (1 - (tt - shot.start) / tr.dur);
      if (nxt && nxt.trans && nxt.trans.type === 'whip' && shot.end - tt < nxt.trans.dur) return 0.5 * (1 - (shot.end - tt) / nxt.trans.dur);
      return 0;
    };
    const probe = shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start);
    if (probe.blur) blur = true;
    const n = blur && !opts.fast ? 6 : 1;
    for (let i = 0; i < n; i++) {
      const tt = t + (n > 1 ? (i / (n - 1) - 0.5) / 30 * 1.6 : 0);
      res = renderShot(shot, tt, 1 / (i + 1), whipAt(tt));
    }
    if (tr.type === 'fade' && prev && lt < tr.dur) {
      // crossfade: draw previous shot on top fading out
      renderShot(prev, t, 1 - lt / tr.dur);
    }
    bloom();
    const fx = res.fx || {};
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(0.28);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.half) bigText('½', fx.half, 0.8, 330);
    if (fx.x2) bigText('×2', fx.x2, 0.62, 240);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
