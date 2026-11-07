import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildBunker, mapTexture, latLonToVec, OUT_X, SPACE_X, EARTH_R, SAT_POS, SITES } from './bunker.js';
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
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 2000);

const R = buildBunker();
const pmrem = new THREE.PMREMGenerator(renderer);
const envFrom = (top, hor, gnd) => { const s = new THREE.Scene(); s.add(skyDome(top, hor, gnd, 50)); return pmrem.fromScene(s, 0.02).texture; };
const ENV = { bunker: envFrom(0x8a9a94, 0x6a7a74, 0x3a4440), red: envFrom(0x8a2a22, 0x5a1a14, 0x2a0a08), night: envFrom(0x1a2a48, 0x2a3a58, 0x10140c) };

// ---------- cast ----------
const PET = { outfit: 'soviet', hair: 'short', hairColor: '#2a2018' };
const petrov = new Char({ ...PET, expr: 'bored', pose: 'stand' }, 1.95); R.bunker.add(petrov.mesh);
const shouter = new Char({ outfit: 'soviet', hair: 'receding', headset: true, expr: 'shout', pose: 'fist', sweat: true }, 1.9); R.bunker.add(shouter.mesh);
const general = new Char({ outfit: 'soviet', hat: 'peakcap', general: true, mustache: true, expr: 'angry', pose: 'papers' }, 2.1); R.bunker.add(general.mesh);

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d'); document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6; const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d'); const img = x.createImageData(360, 640); for (let i = 0; i < img.data.length; i += 4) { const v = Math.abs((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); return c; });

function look(pos, target, fov = 50, roll = 0) {
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(target); if (roll) camera.rotateZ(roll); camera.updateMatrixWorld(true);
  const dir = target.clone().sub(pos); const dist = Math.min(dir.length(), 18); dir.setY(0).normalize();
  const focus = pos.clone().addScaledVector(dir, dist * 0.7); focus.y = 0;
  R.sun.target.position.copy(focus); R.sun.position.copy(focus).addScaledVector(R.sun.userData.dir, 150); R.sun.target.updateMatrixWorld();
}
const path = (pts, u) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoint(clamp01(u));
const sw = (t, a, b) => clamp01((t - a) / (b - a));

// ---------- state ----------
let place = 'bunker', mode = 'normal';
function alarmK(t) {
  if (t < S.place) return 1;                         // hook = flash-forward into the alarm
  const on = sw(t, WT('alarm', 3) - 0.05, WT('alarm', 3) + 0.15);
  const off = sw(t, WT('wait', 5), WT('wait', 5) + 0.8);
  return on * (1 - off) * (t < S.cause ? 1 : 0);
}
function mapState(t) {
  const a = alarmK(t);
  let arcs = 0, prog = 1;
  if (t < S.place) arcs = 5;
  else if (t >= WT('alarm', 9) - 0.3) { arcs = t >= WT('alarm', 13) ? 5 : t >= WT('alarm', 11) ? 2 : 1; const st = arcs === 5 ? WT('alarm', 13) : arcs === 2 ? WT('alarm', 11) : WT('alarm', 9) - 0.3; prog = Math.round(sw(t, st, st + 0.6) * 6) / 6; }
  if (t > WT('wait', 5)) arcs = 0;
  const counter = t >= WT('rules', 4) && t < S.stare + 0.3 ? Math.round(sw(t, WT('rules', 4), WT('rules', 4) + 0.6) * 4) / 4 : 0;
  return { arcs, prog, alarm: a > 0.5, flash: a > 0.5 ? (Math.floor(t * 4) % 2) : 0, counter, ok: t >= WT('call', 7) && t < WT('wait', 6) + 0.6 };
}
function bunkerState(t) {
  const a = mode === 'calm' ? 0 : alarmK(t);
  const pulse = 0.5 + 0.5 * Math.sin(t * 9);
  R.mapMat.map = mapTexture(mapState(t)); R.mapMat.needsUpdate = true;
  R.sign.material.map = a > 0.5 && Math.floor(t * 3) % 2 === 0 ? R.startOn : R.startOff;
  R.tubeLights.forEach((l) => (l.intensity = lerp(22, 3, a)));
  R.tubes.forEach((tb) => tb.material.color.setScalar(lerp(1, 0.35, a)));
  R.redFill.intensity = a * (10 + 14 * pulse);
  R.mapGlow.color.set(a > 0.5 ? 0xff3a2a : 0x5affc8); R.mapGlow.intensity = lerp(18, 28, a);
  R.beacons.forEach((b, i) => { const ang = t * 5 + i * 1.6; b.tgt.position.set(Math.cos(ang) * 3, -1.2, Math.sin(ang) * 3); b.sp.intensity = a * 160; b.dome.material.color.set(a > 0.5 ? 0xff3a2a : 0x4a1010); });
  R.consoles.forEach((c, i) => { const red = a > 0.5 && (i + Math.floor(t * 2)) % 3 === 0; c.userData.screens.forEach((s, k) => { const key = red ? 'r' : 'g'; if (s.userData.k !== key) { s.material.map = red ? (c.userData.red ||= R.crtTex(c.userData.seed + k, true)) : (c.userData.green ||= s.material.map); s.material.needsUpdate = true; s.userData.k = key; } }); });
  R.scene.environment = a > 0.5 ? ENV.red : ENV.bunker; R.scene.environmentIntensity = lerp(0.6, 0.45, a);
  R.hemi.intensity = lerp(0.45, 0.12, a); R.hemi.color.set(0xbfd0e8);
  tintChars(new THREE.Color(0xffffff).lerp(new THREE.Color(0xff8a7a), a * (0.45 + 0.25 * pulse)));
  renderer.toneMappingExposure = lerp(1.15, 1.35, a);
  // clock: 23 minutes pass during the wait
  const mins = 47 + 23 * ease.io(sw(t, WT('wait', 2), WT('wait', 5)));
  R.minPivot.rotation.z = -mins / 60 * Math.PI * 2; R.hourPivot.rotation.z = -(0 + mins / 60) / 12 * Math.PI * 2 - Math.PI * 2 * (11 / 12);
  // operators
  const relief = t >= WT('wait', 5) + 0.2;
  R.ops.forEach((o, i) => {
    let pose = 'stand', expr = 'neutral', sweat = false;
    if (a > 0.5) { pose = (i + Math.floor(t * 3)) % 4 === 0 ? 'stuck' : (i % 3 === 0 ? 'point' : 'stand'); expr = i % 2 ? 'shock' : 'strain'; sweat = true; }
    if (t >= S.stare && t < S.call && a > 0.5) { pose = 'stand'; expr = 'shock'; }
    if (t >= WT('call', 7) && t < WT('wait', 5)) { pose = 'stand'; expr = 'shock'; sweat = true; }
    if (relief && t < S.cause) { pose = i % 2 ? 'stuck' : 'laughbelly'; expr = 'happy'; sweat = false; }
    if (mode === 'calm') { pose = 'stand'; expr = i % 3 ? 'neutral' : 'bored'; sweat = false; }
    o.set({ pose, expr, sweat });
    o.mesh.position.set(o.base.x, a > 0.5 && pose === 'stuck' ? Math.abs(Math.sin(t * 8 + o.phase)) * 0.08 : 0, o.base.z);
    o.face(camera, i % 2 === 0);
  });
  shouter.mesh.visible = false; general.mesh.visible = false; R.stack.visible = false;
}
function setPlace(p, t) {
  place = p;
  R.bunker.visible = p === 'bunker'; R.ext.visible = p === 'ext'; R.space.visible = p === 'space';
  R.stars.visible = p !== 'bunker'; R.moon.visible = p === 'ext';
  R.scene.fog = p === 'ext' ? new THREE.Fog(0x0e1628, 30, 170) : null;
  if (p === 'bunker') { R.sun.intensity = 0; bunkerState(t); }
  if (p === 'ext') {
    R.scene.environment = ENV.night; R.scene.environmentIntensity = 0.9; R.hemi.intensity = 0.7; R.hemi.color.set(0x6a80b0);
    R.sun.userData.dir.set(-0.35, 0.55, -0.75).normalize(); R.sun.color.set(0xa8c0ff); R.sun.intensity = 3.2; renderer.toneMappingExposure = 1.7; tintChars(new THREE.Color(0xb8c8e8));
    R.dishes.forEach((d, i) => (d.userData.head.rotation.y = t * 0.25 + i * 2));
    R.masts.forEach((m, i) => (m.userData.red.material.opacity = Math.floor(t * 1.5 + i * 0.5) % 2 ? 1 : 0.15));
  }
  if (p === 'space') {
    R.scene.environment = null; R.hemi.intensity = 0.03; R.sun.userData.dir.set(0.9, 0.25, 0.35).normalize(); R.sun.color.set(0xffffff); R.sun.intensity = 4.0; renderer.toneMappingExposure = 1.2;
    R.clouds.rotation.y = R.earth.rotation.y + t * 0.004;
  }
}

// ---------- shots ----------
const PZ = 5.25, PY = 0.35;  // Petrov stands on the platform behind his desk
const putPetrov = (spec) => { petrov.mesh.visible = true; petrov.set({ ...PET, ...spec }); petrov.mesh.position.set(0, PY, PZ); petrov.face(camera); };
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      setPlace('bunker', t); const e = ease.sine(u);
      look(v3(lerp(0.5, 0.25, e), lerp(1.75, 1.85, e), lerp(2.9, 3.6, e)), v3(0, 1.75, PZ), lerp(42, 36, e), 0.02);
      putPetrov({ expr: 'bored', pose: 'stand', sweat: true });
      return {};
  } },
  { id: 'place', start: S.place, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('ext', t); const e = ease.io(u);
      look(path([v3(OUT_X + 10, 16, 34), v3(OUT_X + 6, 8, 18), v3(OUT_X + 3, 2.4, 6)], e), path([v3(OUT_X, 2, -20), v3(OUT_X, 2, -14), v3(OUT_X, 1.8, -10)], e), 50);
      return {};
  } },
  { id: 'inside', start: WT('place', 3), trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('bunker', t); const e = ease.sine(u);
      look(v3(lerp(2.8, 2.2, e), lerp(3.3, 3.1, e), lerp(8.2, 7.4, e)), v3(0, 1.8, -10), 54);
      putPetrov({ expr: 'bored', pose: 'stand', sweat: false });
      return {};
  } },
  { id: 'alarm', start: S.alarm, run(t, u) {
      setPlace('bunker', t);
      const k1 = ease.io(sw(t, WT('alarm', 3), WT('alarm', 6))), k2 = ease.io(sw(t, WT('alarm', 9), WT('alarm', 13) + 0.4));
      const pos = v3(lerp(2.2, 0.2, k1), lerp(3.1, 3.2, k1), lerp(7.4, 0.5, k1)).lerp(v3(-0.4, 3.7, -8.8), k2);
      look(pos, v3(lerp(0, -0.4, k1), lerp(1.9, 3.8, Math.max(k1 * 0.7, k2)), -14.7), lerp(54, 50, k2), Math.sin(t * 2) * 0.03 * k1);
      putPetrov({ expr: 'shock', pose: 'stand', sweat: true });
      return { blur: (k1 > 0.1 && k1 < 0.6) };
  } },
  { id: 'rules', start: S.rules, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('bunker', t);
      if (t < WT('rules', 4)) { look(v3(-0.4, 1.55, 3.55), v3(-0.9, 1.2, 4.5), 38, 0.05); R.redPhone.userData.handset.position.y = 0.2 + Math.abs(Math.sin(t * 30)) * 0.004; putPetrov({ expr: 'strain', pose: 'stand', sweat: true }); }
      else look(v3(-0.3, 3.6, -8.8), v3(-0.4, 3.8, -14.7), 50, -0.04);
      return {};
  } },
  { id: 'stare', start: S.stare, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('bunker', t); const e = ease.sine(u);
      look(v3(0.3, 2.0, lerp(4.2, 3.8, e)), v3(0, 1.4, -3), 50, -0.03);
      shouter.mesh.visible = true; shouter.set({ pose: t >= WT('stare', 6) ? 'fist' : 'point', expr: t >= WT('stare', 6) ? 'shout' : 'shock', faceColor: t >= WT('stare', 6) ? '#f08a7a' : '#ffffff' });
      shouter.mesh.position.set(0.15, 0, lerp(0.4, 1.1, e)); shouter.face(camera);
      return {};
  } },
  { id: 'doubt', start: S.doubt, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('bunker', t); const e = ease.sine(u);
      look(v3(lerp(0.35, 0.15, e), 1.82, lerp(3.3, 3.85, e)), v3(0, 1.78, PZ), 36);
      putPetrov({ expr: t >= WT('doubt', 3) ? 'smirk' : 'bored', pose: 'stand', sweat: true });
      return { fx: { text: t >= WT('doubt', 8) ? ['ONLY 5?', sw(t, WT('doubt', 8), WT('doubt', 8) + 0.15)] : null, textY: 0.74 } };
  } },
  { id: 'call', start: S.call, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('bunker', t); const e = ease.sine(u);
      look(v3(lerp(1.0, 0.6, e), 1.75, lerp(2.4, 3.0, e)), v3(0, 1.55, PZ), 42);
      const lift = t >= WT('call', 1);
      putPetrov({ expr: t >= WT('call', 7) ? 'determined' : 'bored', pose: lift ? 'phone' : 'stand', sweat: true });
      R.blackPhone.userData.handset.visible = !lift;
      return {};
  } },
  { id: 'wait', start: S.wait, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('bunker', t); R.blackPhone.userData.handset.visible = true;
      const nh = WT('wait', 5);
      if (t < nh) { const e = ease.sine(sw(t, S.wait, nh)); look(v3(-7.2, 3.3, lerp(1.9, 1.6, e)), v3(-8.7, 3.4, 1.5), lerp(40, 30, e)); }
      else { const e = ease.sine(sw(t, nh, S.cause)); look(v3(lerp(2.4, 2.0, e), 3.0, lerp(7.6, 7.0, e)), v3(0, 1.6, -6), 52); putPetrov({ expr: 'happy', pose: 'stand', sweat: false }); }
      const mm = Math.min(23, Math.floor(23 * ease.io(sw(t, WT('wait', 2), nh))));
      return { fx: { timer: t < nh + 0.6 ? `00:${String(mm).padStart(2, '0')}:${String(Math.floor((t * 37) % 60)).padStart(2, '0')}` : null } };
  } },
  { id: 'cause', start: S.cause, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('space', t); const e = ease.io(u);
      const satP = SAT_POS.clone();
      const g = latLonToVec(-100, 52, EARTH_R * 1.014, R.earth).add(R.space.position);
      R.glint.position.copy(g).sub(R.space.position); const gk = sw(t, WT('cause', 4), WT('cause', 6) + 0.3); R.glint.scale.setScalar(4 + 26 * gk + Math.sin(t * 20) * 2 * gk);
      look(satP.clone().add(v3(lerp(5.5, 3.0, e), lerp(3.0, 1.6, e), lerp(7.5, 4.0, e))), satP.clone().lerp(g, lerp(0.03, 0.5, ease.io(sw(t, WT('cause', 3), S.whatif)))), lerp(50, 44, e), 0.1);
      return {};
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      setPlace('space', t); mode = 'whatif';
      const e = ease.sine(u);
      look(v3(SPACE_X + lerp(22, 16, e), lerp(46, 42, e), lerp(52, 46, e)), v3(SPACE_X - 4, 30, 0), 52, 0.1);
      R.glint.scale.setScalar(0.01);
      const launches = [...SITES.usa, ...SITES.ussr];
      const tp = R.trails.geometry.attributes.position; let ti = 0;
      R.trails.visible = true;
      R.missiles.forEach((m, i) => {
        if (i >= launches.length) { m.visible = false; return; }
        const t0 = S.whatif + 0.6 + (i % 5) * 0.25 + (i >= 5 ? 0.5 : 0); const q = sw(t, t0, t0 + 3.2);
        m.visible = q > 0;
        const from = latLonToVec(...launches[i], EARTH_R, R.earth); const to = latLonToVec(...(i < 5 ? SITES.moscow : SITES.usaTargets[i - 5]), EARTH_R, R.earth);
        const pt = (qq) => { const p = from.clone().lerp(to, qq).normalize().multiplyScalar(EARTH_R + Math.sin(qq * Math.PI) * 14); return p; };
        if (q > 0) { const p = pt(q * 0.55), p2 = pt(q * 0.55 + 0.01); m.position.copy(p); m.lookAt(p2.clone().add(R.space.position)); m.rotateX(Math.PI / 2); m.scale.setScalar(3.2); }
        for (let s = 0; s < 39; s++) { const a = pt(Math.min(q, s / 39) * 0.55), b = pt(Math.min(q, (s + 1) / 39) * 0.55); tp.setXYZ(ti++, a.x, a.y, a.z); tp.setXYZ(ti++, b.x, b.y, b.z); }
      });
      tp.needsUpdate = true;
      mode = 'normal';
      return { fx: { bw: 1, white: sw(t, S.name - 0.7, S.name - 0.05) } };
  } },
  { id: 'name', start: S.name, run(t, u) {
      R.trails.visible = false; R.missiles.forEach((m) => (m.visible = false));
      mode = 'calm'; setPlace('bunker', t); const e = ease.io(u);
      look(v3(lerp(1.4, 0.5, e), lerp(2.0, 1.85, e), lerp(1.6, 3.2, e)), v3(0, lerp(1.6, 1.75, e), PZ), lerp(46, 38, e));
      putPetrov({ expr: 'neutral', pose: 'stand', sweat: false, hat: 'peakcap' });
      mode = 'normal';
      return { fx: { rewind: clamp01(1 - (t - S.name) / 0.4) } };
  } },
  { id: 'end', start: S.end, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      mode = 'calm'; setPlace('bunker', t); mode = 'normal';
      const e = ease.sine(u);
      look(v3(lerp(-0.2, -0.25, e), 1.95, lerp(0.0, 0.5, e)), v3(-0.22, 1.45, PZ), 50);
      const slam = WT('end', 7);
      general.mesh.visible = true;
      general.set({ pose: t < slam ? 'papers' : 'fist', expr: t < slam ? 'angry' : 'shout', faceColor: t >= slam ? '#ef6b5b' : '#ffffff', steam: t >= slam });
      general.mesh.position.set(-1.15, PY, PZ - 0.1); general.face(camera);
      R.stack.visible = t >= slam; R.stack.position.y = t >= slam ? Math.max(0, 0.3 - (t - slam) * 3) : 0.3;
      putPetrov({ expr: t > TL.speechEnd + 0.25 ? 'wink' : t >= WT('end', 9) ? 'bored' : 'neutral', pose: t >= WT('end', 9) && t < TL.speechEnd + 0.2 ? 'shrug' : 'stand', sweat: false, hat: undefined });
      petrov.mesh.position.x = 0.7;
      return { fx: { sparkle: t > TL.speechEnd + 0.25 ? (t - TL.speechEnd - 0.25) / 0.6 : 0, shake: t >= slam && t < slam + 0.25 ? 1 - (t - slam) / 0.25 : 0 } };
  } },
];
for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : TL.duration;
const shotAt = (t) => { let s = shots[0]; for (const x of shots) if (t >= x.start) s = x; return s; };

function renderShot(shot, t, alpha = 1, whip = 0) {
  const res = shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start) || {};
  if (whip) camera.rotateY(whip);
  if (res.fx && res.fx.shake) { camera.position.x += Math.sin(t * 90) * 0.04 * res.fx.shake; camera.position.y += Math.cos(t * 70) * 0.03 * res.fx.shake; camera.updateMatrixWorld(true); }
  renderer.render(R.scene, camera);
  cx.save(); cx.globalAlpha = alpha;
  cx.filter = res.fx && res.fx.bw ? 'grayscale(1) contrast(1.3) brightness(0.95)' : 'saturate(1.15) contrast(1.06)';
  cx.drawImage(glCanvas, 0, 0, W, H); cx.restore();
  return res;
}
function bloom(a = 0.24) { sx.filter = 'brightness(1.05) contrast(1.8) blur(5px)'; sx.clearRect(0, 0, small.width, small.height); sx.drawImage(comp, 0, 0, small.width, small.height); cx.save(); cx.globalCompositeOperation = 'screen'; cx.globalAlpha = a; cx.drawImage(small, 0, 0, W, H); cx.restore(); }
function vignette(s = 0.3) { const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
function vhs(t, amount) {
  if (amount <= 0) return;
  for (let i = 0; i < 9; i++) { const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60); cx.drawImage(comp, 0, y, W, h, Math.sin(t * 80 + i) * 60 * amount, y, W, h); }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2); cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function bigText(txt, k, y = 0.64, size = 190, col = '#ffd23f') {
  if (k <= 0) return; const s = 0.4 + 0.6 * ease.o(k) + Math.sin(k * Math.PI) * 0.15;
  cx.save(); cx.translate(W / 2, H * y); cx.scale(s, s); cx.rotate(-0.05); cx.font = `900 ${size}px Montserrat`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.lineJoin = 'round'; cx.lineWidth = 24; cx.strokeStyle = '#141010'; cx.strokeText(txt, 0, 0); cx.fillStyle = col; cx.fillText(txt, 0, 0); cx.restore();
}
function timer(txt) {
  cx.save(); cx.font = '700 120px monospace'; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  const w = cx.measureText(txt).width + 80; cx.fillStyle = 'rgba(10,10,10,0.75)'; cx.beginPath(); cx.roundRect(W / 2 - w / 2, H * 0.66 - 90, w, 180, 24); cx.fill();
  cx.shadowColor = '#ff3a2a'; cx.shadowBlur = 24; cx.fillStyle = '#ff5a4a'; cx.fillText(txt, W / 2, H * 0.66); cx.restore();
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
    bloom(place === 'bunker' && alarmK(t) > 0.5 ? 0.3 : 0.22);
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(place === 'space' ? 0.2 : 0.42);
    if (fx.white) { cx.save(); cx.globalAlpha = fx.white; cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H); cx.restore(); }
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.text) bigText(fx.text[0], fx.text[1], fx.textY || 0.66, 170);
    if (fx.timer) timer(fx.timer);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
