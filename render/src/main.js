import * as THREE from 'three';
import { buildTimeline } from './timeline.js';
import { buildRome, roadY, groundY, ROAD_HALF, ROAD_Y, CAMBER, OLD_X, BUILD_Z0, BUILD_Z1 } from './rome.js';
import { ease, clamp01, lerp, v3, skyDome } from './world.js';
import { tintChars } from './chars.js';

const W = 1080, H = 1920;
const RS = window.RENDER_SCALE || 0.75;
const TL = buildTimeline();
const { S } = TL;
const wordsOf = (sid) => TL.words.filter((w) => w.sid === sid);
const WT = (sid, k) => wordsOf(sid)[k].start;

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(Math.round(W * RS), Math.round(H * RS), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.localClippingEnabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 1500);

const R = buildRome(); console.log('LOG world built');
const pmrem = new THREE.PMREMGenerator(renderer);
function makeEnv(top, hor, ground, sunCol, sunI) {
  const s = new THREE.Scene(); const d = skyDome(top, hor, ground, 50); s.add(d);
  const sunM = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(sunCol).multiplyScalar(sunI) }));
  sunM.position.copy(R.sun.userData.dir).multiplyScalar(40); s.add(sunM);
  return pmrem.fromScene(s, 0.02).texture;
}
const ENV = { day: makeEnv(0x4a86e0, 0xdcefff, 0x8aa860, 0xfff2d8, 6), storm: makeEnv(0x2a3248, 0x6a7890, 0x3a4430, 0x9aa8c0, 1), today: makeEnv(0x4a86e0, 0xffe0b0, 0x8aa860, 0xffd9a0, 7) };
R.scene.environmentIntensity = 0.75; console.log('LOG env done');
const clipPlane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
R.advance.material = R.advance.material.clone(); R.advance.material.clippingPlanes = [clipPlane];

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d'); document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6; const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d'); const img = x.createImageData(360, 640); for (let i = 0; i < img.data.length; i += 4) { const v = Math.abs((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); return c; });

function look(pos, target, fov = 50, roll = 0) {
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(target); if (roll) camera.rotateZ(roll); camera.updateMatrixWorld(true);
  // keep the shadow map centred on what the camera sees (crisp shadows everywhere)
  const dir = target.clone().sub(pos); const dist = Math.min(dir.length(), 16); dir.setY(0).normalize();
  const focus = pos.clone().addScaledVector(dir, dist * 0.8); focus.y = 0;
  R.sun.target.position.copy(focus); R.sun.position.copy(focus).addScaledVector(R.sun.userData.dir, 90);
  R.sun.target.updateMatrixWorld();
}
const path = (pts, u) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoint(clamp01(u));
const sw = (t, a, b) => clamp01((t - a) / (b - a));

// ---------- world state from global time ----------
const STORM0 = S.storm - 0.5, STORM1 = S.storm + 0.9;
let mode = 'normal'; // 'normal' | 'whatif' | 'today'
const paveFront = (t) => mode !== 'normal' ? BUILD_Z1 : BUILD_Z0 + (BUILD_Z1 - BUILD_Z0) * ease.io(sw(t, WT('shrug', 2), S.storm - 0.2));
function standY(x, z, t) {
  if (Math.abs(x) <= ROAD_HALF) {
    if (mode === 'whatif') return ROAD_Y + 0.05;
    if (z < paveFront(t)) return roadY(x);
    if (z < BUILD_Z1 + 5) return roadY(x) - 0.95;
    return -0.3;
  }
  if (Math.abs(x) < ROAD_HALF + 0.45) return 0.6;
  return Math.max(-0.5, groundY(x, z));
}
const C = { tmp: new THREE.Color() };
function weather(t) {
  let k = mode === 'today' ? 0 : sw(t, STORM0, STORM1); if (mode === 'whatif') k = 1;
  const today = mode === 'today';
  const U = R.sky.material.uniforms;
  U.top.value.set(today ? 0x2f78d8 : 0x2a6fd8).lerp(C.tmp.set(0x1a2236), k);
  U.hor.value.set(today ? 0xffe2b0 : 0xcfe8ff).lerp(C.tmp.set(0x55627a), k);
  U.bot.value.copy(U.hor.value);
  R.fog.color.set(today ? 0xf2dcb8 : 0xcfe6f5).lerp(C.tmp.set(0x4a5468), k);
  R.fog.near = lerp(60, 14, k); R.fog.far = lerp(380, 120, k);
  R.hemi.intensity = lerp(0.55, mode === 'whatif' ? 2.2 : 1.8, k); R.hemi.color.set(0xd8ecff).lerp(C.tmp.set(0x8899bb), k);
  R.sun.intensity = lerp(today ? 3.4 : 3.2, 0.05, k); R.sun.color.set(today ? 0xffcf8f : 0xfff0d8);
  R.scene.environment = today ? ENV.today : (k > 0.5 ? ENV.storm : ENV.day);
  R.scene.environmentIntensity = lerp(0.75, 0.55, k);
  renderer.toneMappingExposure = lerp(1.15, 1.5, k);
  R.roadMat.roughness = R.advance.material.roughness = lerp(0.92, 0.18, k); R.roadMat.envMapIntensity = R.advance.material.envMapIntensity = lerp(0.45, 1.0, k);
  R.roadMat.color.set(0xffffff).lerp(C.tmp.set(0x9aa4b4), k * 0.6); R.advance.material.color.copy(R.roadMat.color);
  const tint = today ? C.tmp.set(0xfff0dc) : C.tmp.set(0xffffff).lerp(new THREE.Color(0x8e9ab4), k);
  const flashT = [WT('storm', 3), WT('mud', 9) + 0.1, WT('whatif', 9)];
  let flash = 0; for (const f of flashT) { const d = t - f; if (d > 0 && d < 0.35) flash = Math.max(flash, (d < 0.06 ? 1 : d < 0.12 ? 0.3 : d < 0.18 ? 0.8 : 0) * (k > 0.5 ? 1 : 0)); }
  R.hemi.intensity += flash * 3.5;
  tint.lerp(new THREE.Color(0xffffff), flash * 0.8); tintChars(tint);
  R.clouds.forEach((c) => (c.visible = k < 0.5));
  R.stormClouds.forEach((c) => { c.visible = k > 0.05; c.material.opacity = k; });
  const rainOn = k > 0.35;
  R.rain.visible = rainOn; if (rainOn) R.updateRain(t, camera);
  R.ditches.forEach((d) => (d.visible = k > 0.4 && mode !== 'whatif')); R.ditchWaterTex.offset.y = -t * 0.9;
  R.runoff.visible = k > 0.5 && mode === 'normal'; R.sheen.visible = false; R.runTex.offset.x = -t * 0.9; R.runNormal.offset.x = -t * 0.9;
  R.mudNormal.offset.y = -t * 0.35; R.poolNormal.offset.set(t * 0.03, -t * 0.05);
  R.rain.material.opacity = camera.position.y > 4 ? 0.22 : 0.5;
  splashes(t, k);
  R.mud.visible = k > 0.4; R.mudTex.offset.y = -t * 0.8; R.ruts.forEach((r) => (r.visible = k <= 0.4));
  R.birds.forEach((b) => { const u = b.userData; b.visible = k < 0.3; b.position.set(u.x + t * 3, u.y + Math.sin(t * 2 + u.p) * 0.6, u.z); b.scale.y = 0.6 + 0.4 * Math.abs(Math.sin(t * 6 + u.p)); });
  return { k, flash, today };
}
function splashes(t, k) {
  if (k < 0.5 || mode === 'today') { R.splashes.done(0); return; }
  let n = 0; const cz = camera.position.z, cxp = camera.position.x;
  for (let i = 0; i < 140; i++) {
    const ph = t * 2.2 + hash1(i) ; const cyc = Math.floor(ph), q = ph - cyc;
    const x = (hash2(i, cyc) - 0.5) * 2 * ROAD_HALF * 0.95, z = cz - 4 - hash2(cyc, i + 3) * 18;
    if (mode === 'whatif') continue;
    R.splashes.place(n++, x, roadY(x) + 0.025, z, (0.4 + q * 1.3) * (q < 0.85 ? 1 : 0));
  }
  R.splashes.done(n);
}
const hash1 = (i) => { const s = Math.sin(i * 91.7) * 43758.5453; return s - Math.floor(s); };
const hash2 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };
function worldState(t) {
  const today = mode === 'today', whatif = mode === 'whatif';
  R.site.visible = !today; R.today.visible = today;
  R.road.visible = !whatif; R.flatRoad.visible = whatif; R.advance.visible = !whatif;
  R.slabs.visible = R.mudPool.visible = whatif;
  const breakP = whatif ? sw(t, WT('whatif', 8) - 0.15, WT('whatif', 14) + 0.2) : 0;
  if (whatif) R.slabs.update(breakP, t);
  R.roadMat.map = today ? R.paveGrassTex : R.paveTex; R.advance.material.map = R.roadMat.map;
  const pf = paveFront(t);
  clipPlane.constant = pf;
  R.front.position.z = pf; R.front.visible = !today && !whatif && pf < BUILD_Z1 - 0.01;
  R.gravelLayer.visible = R.stoneLayer.visible = !today;
  R.kerbAdv.forEach((k) => { const len = Math.max(0.01, pf - BUILD_Z0); k.scale.z = len; k.position.z = BUILD_Z0 + len / 2; });
  R.flatRoad.position.y = whatif ? -0.45 : 0;
  R.cr.userData.wheel.rotation.z = t * 0.8; R.cr.userData.blk.position.y = 2.2 + Math.sin(t * 0.4) * 0.8;
  const cw = R.craneWalker; const wp = new THREE.Vector3(); R.cr.userData.wheel.getWorldPosition(wp); cw.mesh.position.set(wp.x, wp.y - 1.55, wp.z); cw.set({ pose: Math.floor(t * 6) % 2 ? 'walk1' : 'walk2' }); cw.face(camera); cw.mesh.visible = !today;
  R.banners.forEach((b, i) => { b.userData.cloth.rotation.y = Math.sin(t * 2 + i) * 0.25; });
  const lapse = mode === 'normal' && t > WT('shrug', 2) && t < S.storm ? 1 : 0;
  const k = sw(t, STORM0, STORM1);
  R.workers.forEach((w) => {
    w.mesh.visible = !today && !whatif && k < 0.6; w.shadow.visible = w.mesh.visible;
    if (!w.mesh.visible) return;
    let x = w.base.x, z = w.base.z; const speed = lapse ? 8 : 1;
    if (w.job === 'carry' || w.job === 'walk' || w.job === 'basket') { z += Math.sin(t * 0.5 * speed + w.phase) * 2.2; const st = Math.floor(t * 5 * speed + w.phase) % 2; w.set({ pose: w.job === 'carry' ? 'carry' : w.job === 'basket' ? 'hold' : (st ? 'walk1' : 'walk2') }); }
    if (w.job === 'pick') w.set({ pose: Math.floor(t * 2.2 * speed + w.phase) % 2 ? 'pick' : 'stand' });
    const bob = Math.abs(Math.sin(t * 6 * speed + w.phase)) * 0.05;
    const y = standY(x, z, t);
    if (camera.position.distanceTo(new THREE.Vector3(x, y + 1, z)) < 4.5) { w.mesh.visible = w.shadow.visible = false; return; }
    w.mesh.position.set(x, y + bob, z); w.shadow.position.set(x, y + 0.03, z);
    w.face(camera, Math.sin(w.phase) > 0);
  });
  R.legionG.visible = (mode === 'normal' && t > S.runoff - 0.3 && t < S.whatif + 0.5) || whatif;
  let ringN = 0, ripN = 0;
  const mudRing = (x, y, z, e, ph) => {
    if (e < 0.08) return;
    R.mudRings.place(ringN++, x, y + 0.012, z, 0.7 + 0.25 * e + Math.sin(t * 6 + ph) * 0.06);
    for (let r = 0; r < 2; r++) { const q = (t * 0.9 + ph + r * 0.5) % 1; R.mudRipples.place(ripN++, x, y + 0.008, z, (0.8 + q * 2.0) * (q < 0.9 ? 1 : 0)); }
  };
  if (R.legionG.visible) {
    const lz = whatif ? -14 : lerp(-26, -10, sw(t, S.runoff, S.whatif));
    const top = ROAD_Y + 0.05, mudY = ROAD_Y - 0.12;
    R.legion.forEach((c, i) => {
      const e = whatif ? ease.io(sw(t, WT('whatif', 9) - 0.2 + (i % 5) * 0.06 + Math.floor(i / 4) * 0.03, WT('whatif', 14) + 0.3)) : 0;
      const struggle = e > 0.12;
      c.set({ pose: struggle ? (Math.floor(t * 5 + c.phase + i) % 2 ? 'stuck' : 'stumble') : (Math.floor(t * 4 + c.phase) % 2 ? 'march1' : 'march2'), expr: whatif ? (struggle ? 'shock' : 'strain') : 'determined', mud: whatif ? Math.round(Math.min(1, 0.15 + e * 0.9) * 8) / 8 : 0 });
      const y = whatif ? lerp(top, mudY - 1.05, e) : c.base.y;
      const x = c.base.x, z = lz + c.base.z;
      c.mesh.position.set(x, y, z);
      c.face(camera);
      if (struggle) c.mesh.rotateZ(Math.sin(t * 5.5 + i * 1.7) * 0.14 * e);
      if (whatif) mudRing(x, mudY, z, e, i * 0.37);
    });
    const lead = R.legionG.children[R.legionG.children.length - 1]; lead.position.set(2.6, whatif ? top : roadY(2.6), lz + 2.2);
    lead.rotation.y = Math.atan2(camera.position.x - 2.6, camera.position.z - (lz + 2.2));
  }
  R.stuck.forEach((c, i) => {
    c.mesh.visible = k > 0.4 && mode === 'normal'; if (!c.mesh.visible) return;
    const e = ease.io(sw(t, S.mud - 0.4 + i * 0.15, S.runoff));
    const mudY = 0.16;
    c.set({ pose: Math.floor(t * 4 + i) % 2 ? 'stuck' : 'stumble', mud: Math.round((0.35 + 0.65 * e) * 8) / 8 });
    c.mesh.position.set(c.base.x, mudY - 0.45 - 0.55 * e, c.base.z); c.face(camera); c.mesh.rotateZ(Math.sin(t * 5 + i * 2.1) * 0.12);
    mudRing(c.base.x, mudY, c.base.z, 0.6 + e * 0.4, i * 0.5);
  });
  const cs = ease.io(sw(t, WT('mud', 9) - 0.2, WT('mud', 9) + 1.0)) * (k > 0.4 ? 1 : 0);
  if (k > 0.4 && mode === 'normal') mudRing(OLD_X, 0.16, -4, 0.4 + cs, 2.2);
  R.mudRings.done(ringN); R.mudRipples.done(ripN);
  R.mudCart.position.y = (k > 0.4 ? -0.15 : 0) - 0.75 * cs; R.mudCart.rotation.z = 0.18 * cs; R.mudCart.rotation.x = -0.1 * cs;
  R.ox1.position.y = -0.3 * cs; R.ox1.rotation.y = Math.atan2(camera.position.x - R.ox1.position.x, camera.position.z - R.ox1.position.z); R.ox1.visible = !today;
  const gag = sw(t, WT('laugh', 8), S.cent);
  R.gagCart.rotation.z = Math.sin(gag * Math.PI * 5) * 0.12 * (1 - gag * 0.3) + (gag > 0.85 ? -0.3 * sw(gag, 0.85, 1) : 0);
  R.gagCart.position.x = -1.2 * Math.max(0, gag - 0.6);
  R.gagCart.visible = mode === 'normal' && t < S.cent + 0.5;
  R.puddles.visible = whatif; R.puddles.position.y = ROAD_Y + 0.06; R.puddles.material.opacity = whatif ? Math.max(0, (0.25 + 0.75 * sw(t, WT('whatif', 3), WT('whatif', 7))) * (1 - breakP * 2.2)) : 0;
  R.tourists.forEach((c, i) => { const z = c.base.z - (t - S.appia) * 0.9; c.mesh.position.set(c.base.x, roadY(c.base.x), z); if (c.spec.pose.startsWith('walk')) c.set({ pose: Math.floor(t * 4 + i) % 2 ? 'walk1' : 'walk2' }); c.face(camera); });
  R.performer.face(camera);
}
function cast(t) {
  const Hh = R.hero, Ce = R.cent;
  const today = mode === 'today', whatif = mode === 'whatif';
  Hh.mesh.visible = Hh.shadow.visible = !today && !whatif;
  let hp = v3(1.2, 0, 4.2), hs = { pose: 'hold', item: 'template', expr: 'bored', wet: false };
  if (t >= S.curve) { hp = v3(-1.3, 0, 3.0); hs = { pose: 'point', item: null, expr: 'smirk', wet: false }; }
  if (t >= S.laugh) { hp = v3(1.2, 0, 4.2); hs = { pose: 'stand', item: 'tablet', expr: 'bored', wet: false }; }
  if (t >= S.shrug && t < WT('shrug', 2)) hs = { pose: 'shrug', item: null, expr: 'bored', wet: false };
  if (t >= WT('shrug', 2)) { hp = v3(-1.4, 0, lerp(4.2, 9, sw(t, WT('shrug', 2), S.storm))); hs = { pose: 'stand', item: 'tablet', expr: 'smirk', wet: false }; }
  if (t >= S.storm) { hp = v3(-4.0, 0, -9.5); hs = { pose: 'stand', item: 'tablet', expr: 'smirk', wet: true }; }
  if (t >= S.march) { hp = v3(-3.25, 0, -14); hs = { pose: 'stand', item: null, expr: 'smirk', wet: true }; }
  Hh.set(hs); Hh.mesh.position.set(hp.x, standY(hp.x, hp.z, t), hp.z); Hh.shadow.position.set(hp.x, Hh.mesh.position.y + 0.03, hp.z); Hh.face(camera);
  const cIn = S.cent - 0.7; const wu = sw(t, cIn, cIn + 1.2);
  let cp = v3(lerp(9.5, 6.4, ease.o(wu)), 0, lerp(-1, 2.4, ease.o(wu)));
  let cs = { pose: wu < 1 ? (Math.floor(t * 6) % 2 ? 'walk1' : 'walk2') : 'stand', expr: 'angry', faceColor: '#ffffff', steam: false, wet: false };
  if (t >= WT('cent', 3)) { cs.faceColor = '#ef6b5b'; cs.steam = true; }
  if (t >= WT('cent', 4)) { cs.pose = 'fist'; cs.expr = 'shout'; }
  if (t >= S.shrug) cs = { pose: 'stand', expr: 'angry', faceColor: '#ffffff', steam: false, wet: false };
  if (t >= S.storm) { cp = v3(-5.6, 0, -16.5); cs = { pose: 'stand', expr: 'shock', faceColor: '#ffffff', steam: false, wet: true }; }
  Ce.mesh.visible = Ce.shadow.visible = !today && !whatif && t > cIn - 0.3;
  Ce.set(cs); Ce.mesh.position.set(cp.x, standY(cp.x, cp.z, t), cp.z); Ce.shadow.position.set(cp.x, Ce.mesh.position.y + 0.03, cp.z); Ce.face(camera);
  const lg = t >= S.laugh && t < S.cent + 0.3;
  R.laughers.forEach((l, i) => { l.mesh.visible = l.shadow.visible = !today && !whatif && t < S.storm; l.set({ expr: lg ? 'laugh' : 'neutral', pose: lg ? (i === 1 ? 'point' : i === 2 ? 'laughbelly' : 'stand_shield') : (i === 0 ? 'stand_shield' : 'stand') }); l.mesh.position.y = standY(l.base.x, l.base.z, t) + (lg ? Math.abs(Math.sin(t * 9 + i)) * 0.06 : 0); l.face(camera, i === 1); });
  const tu = sw(t, WT('curve', 6) - 0.1, WT('curve', 6) + 2.4);
  R.tur.visible = mode === 'normal' && tu > 0 && tu < 1;
  if (R.tur.visible) { const x = lerp(-1.4, 2.4, tu); R.tur.position.set(x, roadY(x), -1.2); R.tur.rotation.set(0, Math.PI / 2, 0); R.tur.rotateX(Math.atan(-2 * CAMBER * x / (ROAD_HALF * ROAD_HALF))); R.tur.userData.legs.forEach((l, i) => (l.position.y = 0.02 + Math.max(0, Math.sin(t * 14 + i * 1.6)) * 0.05)); }
  R.performer.set({ expr: t > TL.speechEnd + 0.25 ? 'wink' : (t > S.today + 0.4 ? 'smirk' : 'neutral') });
}
function setWorld(t) { worldState(t); cast(t); return weather(t); }

// ---------- shots ----------
const shots = [
  { id: 'hook', start: 0, run(t, u) { look(path([v3(2.9, 1.05, 8.6), v3(2.3, 1.2, 7.4)], ease.sine(u)), v3(1.2, 1.55, 4.2), 40); return { w: setWorld(t) }; } },
  { id: 'rome', start: S.rome, run(t, u) {
      const e = ease.io(u);
      look(path([v3(2.3, 1.2, 7.4), v3(4.5, 3.2, 12), v3(4, 8, 22), v3(2.5, 11, 30)], e), path([v3(1.2, 1.55, 4.2), v3(0, 1.2, -6), v3(0, 2, -80), v3(0, 8, -300)], e), lerp(40, 52, e));
      return { w: setWorld(t) };
  } },
  { id: 'curve', start: S.curve, run(t) {
      const k = ease.io(sw(t, S.curve, S.curve + 1.1));
      const pos = path([v3(2.5, 11, 30), v3(1.5, 4, 14), v3(0.3, 1.5, 7.6)], k);
      const tgt = path([v3(0, 8, -300), v3(0, 1, -10), v3(0, 0.15, -0.5)], k);
      const dz = ease.io(sw(t, WT('curve', 9) - 0.1, WT('curve', 9) + 0.8));
      pos.lerp(v3(2.6, 1.6, 3.6), dz); tgt.lerp(v3(4.6, -0.4, -3.5), dz);
      look(pos, tgt, lerp(52, 60, k));
      return { w: setWorld(t), blur: k > 0.1 && k < 0.8 };
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) { look(v3(lerp(2.4, 2.9, u), 1.35, lerp(11.8, 11.2, u)), v3(5.6, 1.3, 7.3), 44, 0.12); return { w: setWorld(t) }; } },
  { id: 'gag', start: WT('laugh', 8), trans: { type: 'whip', dur: 0.12 }, run(t, u) { look(v3(lerp(4.2, 3.8, u), 1.5, -4.2), v3(0, 1.0, -9), 46, -0.06); return { w: setWorld(t) }; } },
  { id: 'cent', start: S.cent, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      const e = ease.io(u);
      look(v3(lerp(8.8, 7.3, e), lerp(0.45, 0.85, e), lerp(7.0, 4.9, e)), v3(lerp(7.5, 6.4, e), lerp(1.3, 1.55, e), 2.4), lerp(52, 40, e), -0.05);
      return { w: setWorld(t) };
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'fade', dur: 0.2 }, run(t) {
      const lp = sw(t, WT('shrug', 2), S.storm);
      if (lp <= 0) look(v3(2.4, 1.85, 7.5), v3(1.2, 1.6, 4.2), 40);
      else { const pf = paveFront(t); look(v3(lerp(4.6, 5.2, lp), lerp(4.4, 5.2, lp), pf + 7.5), v3(-0.3, 0.2, pf - 1.5), 50, 0.03); }
      return { w: setWorld(t), fx: { lapse: lp > 0 && lp < 1 ? 1 : 0 } };
  } },
  { id: 'storm', start: S.storm, trans: { type: 'fade', dur: 0.2 }, run(t, u) { const e = ease.sine(u); look(v3(lerp(-11.5, -10.5, e), lerp(5.6, 5.2, e), lerp(7, 5.5, e)), v3(2.5, 1.0, -24), 50, -0.04); return { w: setWorld(t), fx: { bolt: 1, softFlash: 1 } }; } },
  { id: 'mud', start: S.mud, trans: { type: 'whip', dur: 0.12 }, run(t, u) { look(v3(lerp(OLD_X - 2.4, OLD_X - 1.8, u), 1.35, lerp(5.0, 4.4, u)), v3(OLD_X + 0.3, 0.3, -3.2), 54, -0.13); return { w: setWorld(t) }; } },
  { id: 'runoff', start: S.runoff, trans: { type: 'whip', dur: 0.12 }, run(t, u) { look(v3(lerp(2.6, 2.3, u), 1.9, lerp(-3.0, -4.2, u)), v3(4.6, -0.4, -9), 56, 0.06); return { w: setWorld(t) }; } },
  { id: 'march', start: S.march, trans: { type: 'fade', dur: 0.2 }, run(t) { const lz = lerp(-26, -10, sw(t, S.runoff, S.whatif)); look(v3(1.2, 1.25, lz + 7.5), v3(-0.3, 1.5, lz - 2), 54, 0.03); return { w: setWorld(t) }; } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      mode = 'whatif'; const e = ease.sine(u);
      look(v3(lerp(-4.6, -4.0, e), lerp(2.7, 2.3, e), lerp(-3.5, -5.0, e)), v3(0.6, 0.1, -15), 52, -0.12);
      const w = setWorld(t); mode = 'normal'; return { w, fx: { bw: 1 } };
  } },
  { id: 'appia', start: S.appia, run(t, u) {
      mode = 'today'; const e = ease.sine(u);
      look(v3(0.8, lerp(0.75, 1.0, e), lerp(9.5, 7.5, e)), v3(-0.4, 0.9, -20), 50);
      const w = setWorld(t); mode = 'normal'; return { w, fx: { rewind: clamp01(1 - (t - S.appia) / 0.4) } };
  } },
  { id: 'today', start: S.today, trans: { type: 'fade', dur: 0.25 }, run(t) {
      mode = 'today'; const k = ease.io(sw(t, S.today, TL.speechEnd + 0.1));
      look(v3(lerp(3.6, 2.4, k), lerp(1.7, 1.75, k), lerp(8.5, 5.4, k)), v3(lerp(0.6, 1.8, k), lerp(1.3, 1.55, k), 3.0), lerp(48, 38, k));
      const w = setWorld(t); mode = 'normal'; return { w, fx: { sparkle: t > TL.speechEnd + 0.25 ? (t - TL.speechEnd - 0.25) / 0.6 : 0 } };
  } },
];
for (let i = 0; i < shots.length; i++) shots[i].end = i + 1 < shots.length ? shots[i + 1].start : TL.duration;
const shotAt = (t) => { let s = shots[0]; for (const x of shots) if (t >= x.start) s = x; return s; };

function renderShot(shot, t, alpha = 1, whip = 0) {
  const res = shot.run(t, (t - shot.start) / (shot.end - shot.start), shot.end - shot.start);
  if (whip) camera.rotateY(whip);
  renderer.render(R.scene, camera);
  cx.save(); cx.globalAlpha = alpha;
  cx.filter = res.fx && res.fx.bw ? 'grayscale(1) contrast(1.25) brightness(0.95)' : 'saturate(1.2) contrast(1.05)';
  cx.drawImage(glCanvas, 0, 0, W, H); cx.restore();
  return res;
}
function bloom(a = 0.16) { sx.filter = 'brightness(1.05) contrast(1.8) blur(5px)'; sx.clearRect(0, 0, small.width, small.height); sx.drawImage(comp, 0, 0, small.width, small.height); cx.save(); cx.globalCompositeOperation = 'screen'; cx.globalAlpha = a; cx.drawImage(small, 0, 0, W, H); cx.restore(); }
const sunV = new THREE.Vector3();
function sunGlow(k) {
  if (k > 0.4) return;
  sunV.copy(R.sun.userData.dir).multiplyScalar(500).add(camera.position).project(camera);
  if (sunV.z > 1) return;
  const x = (sunV.x * 0.5 + 0.5) * W, y = (-sunV.y * 0.5 + 0.5) * H;
  const a = (1 - k / 0.4) * 0.55;
  const g = cx.createRadialGradient(x, y, 0, x, y, H * 0.55); g.addColorStop(0, `rgba(255,236,200,${a})`); g.addColorStop(0.25, `rgba(255,220,170,${a * 0.35})`); g.addColorStop(1, 'rgba(255,210,160,0)');
  cx.save(); cx.globalCompositeOperation = 'screen'; cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore();
}
function grade(k, today) {
  cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = 0.22;
  const g = cx.createLinearGradient(0, 0, 0, H);
  if (k > 0.5) { g.addColorStop(0, '#5a7aaa'); g.addColorStop(1, '#203048'); }
  else if (today) { g.addColorStop(0, '#ffcf90'); g.addColorStop(1, '#a0603a'); }
  else { g.addColorStop(0, '#fff2d0'); g.addColorStop(1, '#6a88b0'); }
  cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore();
}
function vignette(s = 0.3) { const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
function vhs(t, amount) {
  if (amount <= 0) return;
  for (let i = 0; i < 9; i++) { const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60); cx.drawImage(comp, 0, y, W, h, Math.sin(t * 80 + i) * 60 * amount, y, W, h); }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2); cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function bolt(t, flash, seed) {
  if (flash <= 0.25) return;
  cx.save(); cx.globalCompositeOperation = 'screen';
  let x = W * (0.25 + hash1(seed) * 0.5), y = 0; const pts = [[x, y]];
  while (y < H * 0.42) { y += 40 + hash2(seed, y) * 70; x += (hash2(y, seed) - 0.5) * 140; pts.push([x, y]); }
  for (const [lw, col] of [[34, 'rgba(150,180,255,0.25)'], [14, 'rgba(210,225,255,0.7)'], [5, 'rgba(255,255,255,1)']]) {
    cx.beginPath(); cx.moveTo(...pts[0]); for (const p of pts) cx.lineTo(...p); cx.lineWidth = lw * flash; cx.strokeStyle = col; cx.lineJoin = 'round'; cx.stroke();
  }
  cx.restore();
}
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
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
    const probe = shot.run(t, lt / (shot.end - shot.start), shot.end - shot.start);
    if (probe.blur) blur = true;
    const n = blur && !opts.fast ? 5 : 1;
    for (let i = 0; i < n; i++) { const tt = t + (n > 1 ? (i / (n - 1) - 0.5) / 30 * 1.5 : 0); res = renderShot(shot, tt, 1 / (i + 1), whipAt(tt)); }
    if (tr.type === 'fade' && prev && lt < tr.dur) renderShot(prev, t, 1 - lt / tr.dur);
    if (!(res.fx || {}).bw && res.w) { sunGlow(res.w.k); grade(res.w.k, res.w.today); }
    bloom(0.2);
    const fx = res.fx || {};
    if (res.w && res.w.flash) { cx.save(); cx.globalAlpha = res.w.flash * (fx.softFlash ? 0.22 : 0.45); cx.fillStyle = '#eef4ff'; cx.fillRect(0, 0, W, H); cx.restore(); }
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(res.w && res.w.k > 0.5 ? 0.45 : 0.28);
    if (fx.bolt && res.w) bolt(t, res.w.flash, 7);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
