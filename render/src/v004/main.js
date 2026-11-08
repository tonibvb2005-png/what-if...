import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildSub, UW_X, SURF_X, SURF_Y } from './sub.js';
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
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.25;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 2000);

const R = buildSub();
const pmrem = new THREE.PMREMGenerator(renderer);
const envFrom = (top, hor, gnd) => { const s = new THREE.Scene(); s.add(skyDome(top, hor, gnd, 50)); return pmrem.fromScene(s, 0.02).texture; };
const ENV = { in: envFrom(0x8a7a5a, 0x5a4a32, 0x2a2018), red: envFrom(0x8a2a1a, 0x4a1a10, 0x1a0a08), uw: envFrom(0x4aa8d8, 0x0a3a5a, 0x02101a), night: envFrom(0x1a2a4a, 0x2a3a5a, 0x0a1420) };

// ---------- cast ----------
const ARK = { outfit: 'navyofficer', hat: 'peakcap', navy: true, hair: 'short', hairColor: '#3a2a1a' };
const ark = new Char({ ...ARK, expr: 'bored', pose: 'stand', sweat: true }, 1.9);
const cap = new Char({ outfit: 'navyofficer', hat: 'peakcap', navy: true, mustache: true, expr: 'angry', pose: 'stand', sweat: true, wetShirt: true }, 1.95);
const pol = new Char({ outfit: 'navyofficer', hair: 'receding', glasses: true, expr: 'strain', pose: 'stand', sweat: true }, 1.85);
const radioMan = new Char({ outfit: 'sailor', hair: 'short', headset: true, expr: 'strain', pose: 'stand', sweat: true }, 1.8);
const sailors = [0, 1, 2, 3, 4].map((i) => new Char({ outfit: 'sailor', hat: i % 2 ? 'pilotka' : undefined, hair: i % 2 ? undefined : 'short', hairColor: ['#3a2a1a', '#8a5a2a', '#2a1a10'][i % 3], expr: 'strain', pose: 'stand', sweat: true }, 1.8));
[ark, cap, pol, radioMan, ...sailors].forEach((c) => R.inside.add(c.mesh));
const sailorPos = [[-1.25, 2.8], [1.05, -3.6], [-0.85, -5.2], [0.0, -11.2], [-0.9, -13.2]];
const usSailors = [0, 1, 2].map(() => new Char({ outfit: 'ussailor', hat: 'dixie', expr: 'shock', pose: 'point' }, 1.85));
usSailors.forEach((c, i) => { R.destroyers[i % 2].add(c.mesh); c.mesh.position.set(1.2 - i * 0.5, 1.5, 6 + i * 2); });
const arkTop = new Char({ ...ARK, expr: 'neutral', pose: 'stand' }, 1.9); R.surf.add(arkTop.mesh);

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
const hsh = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------- timing ----------
const BLASTS = [WT('bombs', 1), WT('bombs', 1) + 0.75, WT('bombs', 4), WT('bombs', 6) + 0.1, WT('cut', 4), WT('captain', 2)];
function shakeAt(t) { let a = 0; for (const b of BLASTS) { const d = t - b; if (d > 0 && d < 0.9) a = Math.max(a, (1 - d / 0.9) ** 2); } return a; }
const battle = (t) => t < S.place ? 1 : sw(t, BLASTS[0], BLASTS[0] + 0.3) * (1 - sw(t, S.surface, S.surface + 0.5));

let place = 'in';
function setPlace(p, t) {
  place = p;
  R.inside.visible = p === 'in'; R.uw.visible = p === 'uw'; R.surf.visible = p === 'surf'; R.moon.visible = p === 'surf';
  R.scene.fog = p === 'uw' ? new THREE.FogExp2(0x0a3a5a, 0.028) : p === 'in' ? new THREE.FogExp2(0x2a1a0a, 0.03) : new THREE.Fog(0x0c1626, 40, 260);
  if (p === 'in') {
    const b = battle(t), sh = shakeAt(t);
    const dying = sw(t, WT('heat', 7), WT('heat', 10));
    R.scene.environment = b > 0.5 ? ENV.red : ENV.in; R.scene.environmentIntensity = 0.5;
    R.hemi.intensity = 0.25; R.hemi.color.set(0xffe0b0); R.sun.intensity = 0;
    const flick = (dying > 0 && t < S.bombs ? (Math.floor(t * 12) % 5 === 0 ? 0.3 : 1) : 1) * (sh > 0.3 ? (Math.floor(t * 20) % 2 ? 0.25 : 1) : 1);
    R.lampLights.forEach((L) => (L.intensity = lerp(9, 4.5, b) * flick * lerp(1, 0.65, dying)));
    R.lamps.forEach((l, i) => { l.userData.bulb.material.color.setScalar(flick); l.rotation.z = Math.sin(t * 6 + i) * 0.35 * sh; l.rotation.x = Math.cos(t * 5 + i) * 0.25 * sh; });
    R.redLight.intensity = b * (6 + 4 * Math.sin(t * 6));
    renderer.toneMappingExposure = 1.35;
    tintChars(new THREE.Color(0xffe6c8).lerp(new THREE.Color(0xff9a80), b * 0.5).multiplyScalar(flick < 1 ? 0.75 : 1));
    R.thermo.material.map = t >= WT('heat', 4) || t < S.place ? R.thermoHot : R.thermo.material.map; R.thermo.material.needsUpdate = true;
    R.battery.userData.set(lerp(0.55, 0.06, Math.max(dying, t < S.place ? 1 : 0)));
    R.gauges.forEach((g, i) => g.userData.set(0.35 + hsh(i) * 0.3 + Math.sin(t * 30 + i) * 0.04 * sh));
    R.haze.rotation.y = t * 0.02;
    // crew
    const pose = (i) => sh > 0.4 ? (i % 2 ? 'stumble' : 'stuck') : 'stand';
    sailors.forEach((c, i) => { c.mesh.visible = true; c.set({ pose: pose(i), expr: sh > 0.2 ? 'shock' : 'strain', sweat: true }); c.mesh.position.set(sailorPos[i][0], 0, sailorPos[i][1]); c.face(camera, i % 2 === 0); });
    radioMan.mesh.visible = true; radioMan.set({ pose: 'stand', expr: t >= S.cut && t < S.captain ? 'sad' : 'strain' }); radioMan.mesh.position.set(1.15, 0, 3.75); radioMan.face(camera);
  }
  if (p === 'uw') {
    R.scene.environment = ENV.uw; R.scene.environmentIntensity = 0.9; R.hemi.intensity = 1.1; R.hemi.color.set(0x6ac0e8); R.hemi.groundColor.set(0x02101a); R.sun.intensity = 0;
    renderer.toneMappingExposure = 1.3; tintChars(new THREE.Color(0xffffff));
    R.nrm.offset.set(t * 0.02, t * 0.015); R.rays.forEach((r, i) => (r.material.opacity = (0.1 + 0.08 * Math.sin(t * 0.8 + i)) )); R.motes.position.y = (t * 0.3) % 4;
    R.sub.userData.prop.rotation.z = t * 3;
  }
  if (p === 'surf') {
    R.scene.environment = ENV.night; R.scene.environmentIntensity = 0.7; R.hemi.intensity = 0.4; R.hemi.color.set(0x6a80b0); R.hemi.groundColor.set(0x0a1420);
    R.sun.userData.dir.set(-0.4, 0.5, -0.8).normalize(); R.sun.color.set(0x9ab8ff); R.sun.intensity = 1.4;
    renderer.toneMappingExposure = 1.45; tintChars(new THREE.Color(0xd8e0f0));
    R.seaN.offset.set(t * 0.01, t * 0.02);
  }
}
function uwState(t) {
  R.charges.forEach((c, i) => {
    const te = BLASTS[i]; const t0 = te - 1.9; const q = (t - t0) / 1.9;
    c.visible = q > 0 && q < 1; c.position.set([-3, 4, 1, -5, 3, 0][i], lerp(SURF_Y - 0.5, 4 + i * 0.8, q), [3, -4, 6, -2, 0, 2][i]); c.rotation.x = t * 2 + i;
    const b = R.blasts[i]; const d = t - te; const on = d > 0 && d < 1.2;
    b.f.visible = b.ring.visible = on;
    if (on) { const k = d / 1.2; b.f.position.copy(c.position); b.f.position.y = 4 + i * 0.8; b.f.scale.setScalar(4 + k * 26); b.f.material.opacity = (1 - k) ** 1.5; b.ring.position.copy(b.f.position); b.ring.scale.setScalar(1 + k * 18); b.ring.material.opacity = 0.35 * (1 - k); }
  });
  R.bubbles.forEach((bb, i) => { const bi = i % 6; const d = t - BLASTS[bi]; const on = d > 0 && d < 3; bb.visible = on; if (on) { bb.position.set([-3, 4, 1, -5, 3, 0][bi] + (hsh(i, 1) - 0.5) * 6, 4 + bi * 0.8 + d * (2 + hsh(i, 2) * 4), [3, -4, 6, -2, 0, 2][bi] + (hsh(i, 3) - 0.5) * 6); bb.scale.setScalar(0.15 + hsh(i, 4) * 0.3); } });
}

// ---------- shots ----------
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      setPlace('in', t); const e = ease.sine(u);
      look(v3(lerp(0.75, 0.62, e), 1.65, lerp(1.2, 0.55, e)), v3(0.6, 1.6, -0.6), lerp(44, 38, e), 0.03);
      ark.mesh.visible = true; ark.set({ ...ARK, expr: 'bored', pose: 'stand', sweat: true }); ark.mesh.position.set(0.6, 0, -0.6); ark.face(camera);
      cap.mesh.visible = pol.mesh.visible = false;
      return {};
  } },
  { id: 'place', start: S.place, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('uw', t); uwState(t); const e = ease.sine(u);
      R.sub.position.set(0, 0, 0); R.sub.rotation.set(0, 0, 0);
      look(v3(UW_X + lerp(9, 6, e), lerp(2.5, 1.0, e), lerp(16, 6, e)), v3(UW_X, 1, lerp(2, -4, e)), 52, 0.05);
      return {};
  } },
  { id: 'heat', start: S.heat, trans: { type: 'fade', dur: 0.25 }, run(t, u) {
      setPlace('in', t);
      ark.mesh.visible = cap.mesh.visible = pol.mesh.visible = true;
      ark.set({ ...ARK, expr: 'bored', pose: 'stand', sweat: true }); ark.mesh.position.set(0.6, 0, -0.6);
      cap.set({ expr: 'strain', pose: 'stand', sweat: true }); cap.mesh.position.set(-0.6, 0, -1.4);
      pol.set({ expr: 'strain', pose: 'stand' }); pol.mesh.position.set(-1.1, 0, 0.3);
      if (t < WT('heat', 4)) look(v3(0.5, 2.1, 4.4), v3(-0.1, 1.2, -4), 56, 0.02);
      else if (t < WT('heat', 7)) look(v3(-0.35, 1.7, 1.15), v3(-2.0, 1.7, 1.2), 40);
      else look(v3(0.35, 1.9, 1.25), v3(1.95, 1.9, 1.2), 40, -0.03);
      [ark, cap, pol].forEach((c) => c.face(camera));
      return {};
  } },
  { id: 'bombs', start: S.bombs, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const inside = t >= WT('bombs', 7);
      if (!inside) {
        setPlace('uw', t); uwState(t); const e = ease.sine(sw(t, S.bombs, WT('bombs', 7)));
        look(v3(UW_X + lerp(4, 2.5, e), lerp(-6, -7, e), lerp(14, 12, e)), v3(UW_X, lerp(12, 18, e), 0), 58, 0.06);
        return {};
      }
      setPlace('in', t); const sh = shakeAt(t);
      ark.mesh.visible = cap.mesh.visible = pol.mesh.visible = true;
      ark.set({ ...ARK, expr: 'determined', pose: 'stand', sweat: true }); ark.mesh.position.set(0.6, 0, -0.6);
      cap.set({ expr: 'shock', pose: 'stumble' }); cap.mesh.position.set(-0.6, 0, -1.4); pol.set({ expr: 'shock', pose: 'stuck' }); pol.mesh.position.set(-1.1, 0, 0.3);
      look(v3(0.4 + Math.sin(t * 70) * 0.08 * sh, 2.0 + Math.cos(t * 60) * 0.06 * sh, 4.0), v3(0, 1.3, -4), 56, Math.sin(t * 40) * 0.05 * sh);
      [ark, cap, pol].forEach((c) => c.face(camera));
      return {};
  } },
  { id: 'cut', start: S.cut, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('in', t); const e = ease.sine(u); const sh = shakeAt(t);
      ark.mesh.visible = cap.mesh.visible = pol.mesh.visible = false;
      look(v3(lerp(0.15, 0.3, e) + Math.sin(t * 70) * 0.05 * sh, 1.7, lerp(1.3, 1.6, e)), v3(1.3, 1.45, 3.6), 40, -0.04);
      return { fx: { static: t < WT('cut', 4) ? 1 : 0 } };
  } },
  { id: 'captain', start: S.captain, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const torpT = WT('captain', 6);
      setPlace('in', t); const sh = shakeAt(t);
      if (t < torpT) {
        cap.mesh.visible = true; ark.mesh.visible = pol.mesh.visible = false;
        cap.set({ expr: t >= WT('captain', 4) ? 'shout' : 'angry', pose: t >= WT('captain', 4) ? 'fist' : 'stand', faceColor: t >= WT('captain', 3) ? '#ef6b5b' : '#ffffff', steam: t >= WT('captain', 3) });
        cap.mesh.position.set(-0.4, 0, -1.4);
        look(v3(0.2 + Math.sin(t * 70) * 0.06 * sh, 0.9, 1.0), v3(-0.4, 1.55, -1.4), 44, 0.06);
        cap.face(camera);
      } else {
        const k = ease.io(sw(t, torpT, S.rule)); R.torp.position.z = lerp(-12.5, -14.0, k);
        ark.mesh.visible = cap.mesh.visible = pol.mesh.visible = false;
        look(v3(1.4, 1.45, lerp(-10.2, -10.8, k)), v3(0.55, 1.0, -13.5), 42, -0.05);
      }
      return { blur: t > torpT - 0.08 && t < torpT + 0.08 };
  } },
  { id: 'rule', start: S.rule, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      setPlace('in', t); const e = ease.sine(u);
      R.torp.position.z = -14.0;
      ark.mesh.visible = cap.mesh.visible = pol.mesh.visible = true;
      cap.set({ expr: 'angry', pose: 'stand', faceColor: '#f08a7a', steam: false }); pol.set({ expr: 'strain', pose: 'stand' }); ark.set({ ...ARK, expr: 'neutral', pose: 'stand', sweat: true });
      cap.mesh.position.set(-0.75, 0, -1.0); pol.mesh.position.set(0.05, 0, -1.25); ark.mesh.position.set(0.85, 0, -1.0);
      look(v3(0.05, 1.7, lerp(2.9, 2.5, e)), v3(0.05, 1.45, -1.1), 50);
      [cap, pol, ark].forEach((c) => c.face(camera));
      const marks = [];
      if (t >= WT('rule', 7)) marks.push({ c: cap, k: sw(t, WT('rule', 7), WT('rule', 7) + 0.15), ok: true });
      if (t >= WT('rule', 9)) marks.push({ c: pol, k: sw(t, WT('rule', 9), WT('rule', 9) + 0.15), ok: true });
      return { fx: { marks } };
  } },
  { id: 'him', start: S.him, trans: { type: 'fade', dur: 0.15 }, run(t, u) {
      setPlace('in', t); const e = ease.sine(u);
      ark.mesh.visible = true; cap.mesh.visible = pol.mesh.visible = false;
      ark.set({ ...ARK, expr: t >= WT('him', 2) ? 'determined' : 'neutral', pose: 'stand', sweat: true });
      const shake = t >= WT('him', 2) ? Math.sin((t - WT('him', 2)) * 18) * 0.035 * (1 - sw(t, WT('him', 2), WT('him', 2) + 0.8)) : 0;
      ark.mesh.position.set(0.85 + shake, 0, -1.0);
      look(v3(0.85, 1.72, lerp(0.85, 0.6, e)), v3(0.85, 1.65, -1.0), 38);
      ark.face(camera);
      return { fx: { marks: t >= WT('him', 2) ? [{ c: ark, k: sw(t, WT('him', 2), WT('him', 2) + 0.15), ok: false }] : [] } };
  } },
  { id: 'argue', start: S.argue, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('in', t); const e = ease.sine(u);
      ark.mesh.visible = cap.mesh.visible = true; pol.mesh.visible = false;
      const calm = sw(t, S.argue, S.surface);
      ark.set({ ...ARK, expr: 'determined', pose: t >= WT('argue', 8) ? 'point' : 'stand', sweat: true });
      cap.set({ expr: calm > 0.6 ? 'sad' : 'angry', pose: 'stand', faceColor: calm > 0.4 ? '#ffffff' : '#f08a7a', steam: false });
      ark.mesh.position.set(0.55, 0, -0.9); cap.mesh.position.set(-0.55, 0, -1.3);
      look(v3(lerp(-0.6, -0.3, e), 1.7, lerp(1.9, 1.5, e)), v3(0.1, 1.5, -1.1), 46);
      ark.face(camera); cap.face(camera, true);
      return {};
  } },
  { id: 'surface', start: S.surface, trans: { type: 'fade', dur: 0.3 }, run(t, u) {
      setPlace('surf', t);
      const rise = ease.o(sw(t, S.surface - 0.3, WT('surface', 3) + 0.6));
      R.subS.position.set(0, lerp(-6, -0.4, rise), 0); R.subS.rotation.set(lerp(-0.12, 0, rise), 0, 0);
      R.foam.forEach((f, i) => { const a = hsh(i, 1) * Math.PI * 2, r = 2 + hsh(i, 2) * 10; const on = rise > 0.2; f.visible = on; f.position.set(Math.cos(a) * r * 0.4, 0.15 + Math.max(0, Math.sin(t * 2 + i)) * 0.3 * (1 - rise * 0.5), Math.sin(a) * r * 1.1); f.scale.setScalar((0.6 + hsh(i, 3) * 1.6) * (1.2 - rise * 0.5)); f.material.opacity = 0.7 * (1 - rise * 0.6); });
      const lt = WT('surface', 9);
      R.lights.forEach((L, i) => { const tp = R.subS.position.clone().add(v3(Math.sin(t * 0.7 + i) * 2, 1.5, Math.cos(t * 0.5 + i) * 3)); L.tg.position.copy(tp); const src = new THREE.Vector3(); L.sp.getWorldPosition(src); src.sub(R.surf.position); L.beam.position.copy(src); L.beam.lookAt(tp.clone().add(R.surf.position)); L.beam.rotateX(Math.PI / 2); L.lens.position.copy(src); const on = t > lt - 0.6; L.sp.intensity = on ? 140 : 0; L.beam.visible = L.lens.visible = on; });
      usSailors.forEach((c) => c.face(camera));
      arkTop.mesh.visible = false;
      const e = ease.sine(u);
      look(v3(SURF_X + lerp(9, 7, e), lerp(1.2, 1.6, e), lerp(16, 13, e)), v3(SURF_X, lerp(0.5, 2.0, rise), 0), 54, 0.03);
      return {};
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      const blastT = WT('whatif', 6);
      if (t < WT('whatif', 8)) {
        setPlace('uw', t); uwState(t - 100);
        const k = sw(t, blastT - 0.1, blastT + 0.8);
        const b = R.blasts[0]; b.f.visible = k > 0; b.f.position.set(0, 3, 0); b.f.scale.setScalar(5 + k * 90); b.f.material.opacity = 1;
        look(v3(UW_X + 10, 0, 26), v3(UW_X, 6, 0), 54, 0.08);
        return { fx: { bw: 1, white: k > 0 ? Math.min(1, k * 1.5) * 0.7 : 0 } };
      }
      setPlace('surf', t); R.lights.forEach((L) => { L.sp.intensity = 0; L.beam.visible = L.lens.visible = false; });
      R.subS.position.y = -8;
      const q = ease.o(sw(t, WT('whatif', 8), S.name - 0.2));
      R.column.visible = R.dome.visible = true; R.column.position.set(-6, 0, -30); R.column.scale.set(1 + q * 0.4, 6 + q * 90, 1 + q * 0.4);
      R.dome.position.set(-6, 0, -30); R.dome.scale.set(20 + q * 80, 8 + q * 20, 20 + q * 80);
      look(v3(SURF_X + 26, 6, 60), v3(SURF_X - 6, 30, -30), 56, -0.04);
      return { fx: { bw: 1, white: sw(t, S.name - 0.5, S.name - 0.05) } };
  } },
  { id: 'name', start: S.name, run(t, u) {
      R.column.visible = R.dome.visible = false;
      setPlace('surf', t); const e = ease.io(u);
      R.subS.position.set(0, -0.4, 0); R.subS.rotation.set(0, 0, 0); R.foam.forEach((f) => (f.visible = false));
      R.lights.forEach((L, i) => { const tp = v3(0, 3, 2.9); L.tg.position.copy(tp); const src = new THREE.Vector3(); L.sp.getWorldPosition(src); src.sub(R.surf.position); L.beam.position.copy(src); L.beam.lookAt(tp.clone().add(R.surf.position)); L.beam.rotateX(Math.PI / 2); L.lens.position.copy(src); L.sp.intensity = 140; L.beam.visible = L.lens.visible = true; });
      arkTop.mesh.visible = true; arkTop.set({ ...ARK, expr: 'neutral', pose: 'stand' }); arkTop.mesh.position.set(0, 2.95, 2.9);
      look(v3(SURF_X + lerp(4.5, 2.2, e), lerp(3.4, 4.4, e), lerp(10.3, 6.9, e)), v3(SURF_X, 4.2, 2.9), lerp(46, 38, e));
      arkTop.face(camera);
      return { fx: { rewind: clamp01(1 - (t - S.name) / 0.4) } };
  } },
  { id: 'end', start: S.end, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      setPlace('surf', t); const e = ease.sine(u);
      R.lights.forEach((L) => { L.sp.intensity = 140; });
      arkTop.mesh.visible = true; arkTop.set({ ...ARK, expr: t > TL.speechEnd + 0.2 ? 'wink' : t >= WT('end', 7) ? 'smirk' : 'neutral', pose: 'stand' }); arkTop.mesh.position.set(0, 2.95, 2.9);
      look(v3(SURF_X + lerp(1.4, 1.0, e), 4.55, lerp(6.1, 5.5, e)), v3(SURF_X, 4.45, 2.9), 36);
      arkTop.face(camera);
      return { fx: { sparkle: t > TL.speechEnd + 0.25 ? (t - TL.speechEnd - 0.25) / 0.6 : 0 } };
  } },
];
for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : TL.duration;
const shotAt = (t) => { let s = shots[0]; for (const x of shots) if (t >= x.start) s = x; return s; };

function renderShot(shot, t, alpha = 1, whip = 0) {
  const res = shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start) || {};
  if (whip) camera.rotateY(whip);
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
function staticNoise(t) { cx.save(); cx.globalAlpha = 0.18; cx.globalCompositeOperation = 'screen'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function mark(c, k, ok) {
  if (k <= 0) return; const p = c.worldPoint(256, -40).project(camera); const x = (p.x * 0.5 + 0.5) * W, y = (-p.y * 0.5 + 0.5) * H;
  const s = (0.4 + 0.6 * ease.o(k) + Math.sin(k * Math.PI) * 0.2) * 1.1;
  cx.save(); cx.translate(x, y); cx.scale(s, s); cx.beginPath(); cx.arc(0, 0, 70, 0, 7); cx.fillStyle = ok ? '#2fbf5a' : '#e0302a'; cx.fill(); cx.lineWidth = 12; cx.strokeStyle = '#141010'; cx.stroke();
  cx.lineCap = 'round'; cx.lineJoin = 'round'; cx.lineWidth = 18; cx.strokeStyle = '#fff'; cx.beginPath();
  if (ok) { cx.moveTo(-30, 2); cx.lineTo(-8, 26); cx.lineTo(34, -24); } else { cx.moveTo(-26, -26); cx.lineTo(26, 26); cx.moveTo(26, -26); cx.lineTo(-26, 26); }
  cx.stroke(); cx.restore();
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
    bloom(place === 'uw' ? 0.3 : 0.24);
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(place === 'in' ? 0.5 : 0.35);
    if (fx.static) staticNoise(t);
    if (fx.white) { cx.save(); cx.globalAlpha = fx.white; cx.fillStyle = '#fff'; cx.fillRect(0, 0, W, H); cx.restore(); }
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.marks) fx.marks.forEach((m) => mark(m.c, m.k, m.ok));
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
