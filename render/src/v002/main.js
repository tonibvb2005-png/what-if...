import * as THREE from 'three';
import { buildTimeline } from '../timeline.js';
import { SCRIPT } from './script.js';
import { buildHospital, WARD, YARD_X, OR_X, SUN_DIR } from './hospital.js';
import { ease, clamp01, lerp, v3, skyDome } from '../world.js';
import { Char, charTex, tintChars } from '../chars.js';

const W = 1080, H = 1920;
const RS = window.RENDER_SCALE || 0.75;
const TL = buildTimeline(SCRIPT, 45);
const { S } = TL;
const wordsOf = (sid) => TL.words.filter((w) => w.sid === sid);
const WT = (sid, k) => wordsOf(sid)[k].start;

const glCanvas = document.createElement('canvas');
const renderer = new THREE.WebGLRenderer({ canvas: glCanvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(Math.round(W * RS), Math.round(H * RS), false);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
const camera = new THREE.PerspectiveCamera(50, W / H, 0.05, 1500);

const R = buildHospital();
const pmrem = new THREE.PMREMGenerator(renderer);
function makeEnv(top, hor, ground, sunCol, sunI) {
  const s = new THREE.Scene(); s.add(skyDome(top, hor, ground, 50));
  const m = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color(sunCol).multiplyScalar(sunI) })); m.position.copy(SUN_DIR).multiplyScalar(40); s.add(m);
  return pmrem.fromScene(s, 0.02).texture;
}
const ENV = { out: makeEnv(0x4a86e0, 0xdcefff, 0xb0a080, 0xfff2d8, 6), ward: makeEnv(0xf2e6cc, 0xf6ead2, 0x8a6a48, 0xfff2d8, 3), cold: makeEnv(0x6a8a8a, 0x8aa0a0, 0x3a4440, 0xbfd8ff, 1), or: makeEnv(0xf4fbff, 0xe8f6f6, 0xa0b8bc, 0xffffff, 3) };

// ---------- cast ----------
const HERO = { outfit: 'frock', hair: 'receding', hairColor: '#4a2e1a', mustache: true };
const hero = new Char({ ...HERO, expr: 'bored', pose: 'scrub', foam: true, apron: true }, 1.95);
const prof = new Char({ outfit: 'professor', hair: 'muttonchops', monocle: true, expr: 'angry', pose: 'stand' }, 2.0);
const mk = (spec, h = 1.9) => { const c = new Char(spec, h); R.scene.add(c.mesh); return c; };
R.scene.add(hero.mesh, prof.mesh);
const colleagues = [
  mk({ outfit: 'frock', hat: 'tophat', mustache: true, expr: 'neutral', pose: 'stand', cigar: true }),
  mk({ outfit: 'frock', hat: 'tophat', hatColor: '#3a3a48', hair: 'short', expr: 'neutral', pose: 'stand', coat: '#3a2a20' }),
  mk({ outfit: 'frock', hat: 'tophat', hair: 'short', hairColor: '#8a5a2a', expr: 'neutral', pose: 'stand', coat: '#2a3a4a', cravat: '#7a1a1a' }),
  mk({ outfit: 'frock', hair: 'muttonchops', hairColor: '#5a3a1a', expr: 'neutral', pose: 'stand', coat: '#2a2a2a' }),
];
const cutters = [
  mk({ outfit: 'frock', hair: 'short', hairColor: '#c8902a', expr: 'neutral', pose: 'stand', coat: '#2a3a2a', apron: true, stained: true }),
  mk({ outfit: 'frock', hair: 'short', expr: 'happy', pose: 'stand', apron: true, stained: true, mustache: true }),
  mk({ outfit: 'frock', hair: 'receding', hairColor: '#6a6a6a', expr: 'neutral', pose: 'stand', coat: '#3a2a20', apron: true, stained: true }),
];
R.portrait.material.map = R.portraitTexture(charTex({ ...HERO, expr: 'smirk', pose: 'stand' }).canvas); R.portrait.material.needsUpdate = true;

// ---------- compositor ----------
const comp = document.createElement('canvas'); comp.width = W; comp.height = H;
const cx = comp.getContext('2d'); document.body.appendChild(comp);
const small = document.createElement('canvas'); small.width = W / 6; small.height = H / 6; const sx = small.getContext('2d');
const grains = [0, 1, 2, 3].map((s) => { const c = document.createElement('canvas'); c.width = 360; c.height = 640; const x = c.getContext('2d'); const img = x.createImageData(360, 640); for (let i = 0; i < img.data.length; i += 4) { const v = Math.abs((Math.sin(i * 12.9898 + s * 78.233) * 43758.5453) % 1) * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; } x.putImageData(img, 0, 0); return c; });

const sunDir = SUN_DIR.clone();
function look(pos, target, fov = 50, roll = 0) {
  camera.position.copy(pos); camera.fov = fov; camera.updateProjectionMatrix();
  camera.up.set(0, 1, 0); camera.lookAt(target); if (roll) camera.rotateZ(roll); camera.updateMatrixWorld(true);
  const dir = target.clone().sub(pos); const dist = Math.min(dir.length(), 14); dir.setY(0).normalize();
  const focus = pos.clone().addScaledVector(dir, dist * 0.7); focus.y = 0;
  R.sun.target.position.copy(focus); R.sun.position.copy(focus).addScaledVector(sunDir, 120); R.sun.target.updateMatrixWorld();
}
const path = (pts, u) => new THREE.CatmullRomCurve3(pts, false, 'centripetal').getPoint(clamp01(u));
const sw = (t, a, b) => clamp01((t - a) / (b - a));
const hsh = (a, b = 0) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------- state ----------
let mode = 'normal'; // normal | whatif
let place = 'ward';  // ward | aut | yard | or
const HANDS = { stand: [[196, 548], [316, 548]], shake: [[192, 548], [494, 452]], scrub: [[236, 492], [280, 492]], laughbelly: [[226, 520], [286, 520]], shrug: [[88, 340], [424, 340]], hold: [[168, 450], [344, 450]], walk1: [[196, 548], [316, 548]], walk2: [[196, 548], [316, 548]], point: [[192, 540], [488, 266]] };
const toCam = new THREE.Vector3();
let gi = 0;
function germAt(p, t, k, scale = 0.17) {
  if (gi >= R.germs.length) return; const g = R.germs[gi++];
  g.visible = true; toCam.copy(camera.position).sub(p).normalize();
  g.position.copy(p).addScaledVector(toCam, 0.08); g.position.y += Math.abs(Math.sin(t * 7 + k * 1.7)) * 0.05;
  g.scale.setScalar(scale * (1 + Math.sin(t * 9 + k) * 0.08)); g.material.rotation = Math.sin(t * 4 + k) * 0.3;
}
function germsOnHands(c, n, t, seed) {
  const hs = HANDS[c.spec.pose] || HANDS.stand;
  for (let i = 0; i < n; i++) { const h = hs[i % hs.length]; const p = c.worldPoint(h[0] + (hsh(seed, i) - 0.5) * 70, h[1] + (hsh(i, seed) - 0.5) * 50); germAt(p, t, seed * 10 + i); }
}
function setSun(angle) {
  sunDir.copy(SUN_DIR).applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  R.beams.forEach((b) => b.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), sunDir));
}
function placeChar(c, x, z, spec, flip = false, y = 0) { c.mesh.visible = true; if (spec) c.set(spec); c.mesh.position.set(x, y, z); c.face(camera, flip); }

function world(t) {
  gi = 0; R.germs.forEach((g) => (g.visible = false));
  const whatif = mode === 'whatif';
  R.scene.environment = place === 'yard' ? ENV.out : place === 'aut' ? ENV.cold : place === 'or' ? ENV.or : ENV.ward;
  R.scene.environmentIntensity = place === 'aut' ? 0.35 : 0.8;
  R.hemi.intensity = place === 'aut' ? 0.15 : place === 'ward' ? 0.55 : 0.6;
  R.sun.intensity = place === 'or' ? 0 : 4.2;
  renderer.toneMappingExposure = place === 'aut' ? 1.05 : place === 'ward' ? 1.3 : 1.15;
  tintChars(place === 'aut' ? new THREE.Color(0xb8c8c8) : place === 'ward' ? new THREE.Color(0xfff4e4) : new THREE.Color(0xffffff));
  // time-lapse sun sweep during "keeps scrubbing"
  const lapse = sw(t, WT('shrug', 2), S.drop);
  setSun(lerp(-0.25, 0.55, lapse) + (t > S.drop ? 0 : 0));
  R.dust.rotation.y = t * 0.01; R.dust.position.y = Math.sin(t * 0.3) * 0.1;
  // mothers: sick until results, then healthy with babies
  const healed = mode === 'normal' && t >= WT('drop', 11) - 0.2;
  R.mothers.forEach((m, i) => { m.set(healed ? { expr: 'happy', pose: i % 3 === 2 ? 'sit' : 'baby', sweat: false } : { expr: i % 4 === 1 ? 'neutral' : 'sad', pose: 'sit', sweat: i % 2 === 0 }); m.mesh.position.y = 0.42 + (healed ? Math.abs(Math.sin(t * 2 + i)) * 0.015 : 0); m.face(camera); });
  R.mothers2.forEach((m) => m.face(camera)); R.midwives.forEach((m) => m.face(camera));
  R.nurses.forEach((n, i) => { n.set({ expr: healed ? 'happy' : 'sad' }); n.face(camera); });
  // courtyard life
  R.passers.forEach((c, i) => { const x = c.base.x + c.dir * ((t * 0.9 + i * 3) % 18 - 9); c.set({ pose: Math.floor(t * 4 + i) % 2 ? 'walk1' : 'walk2' }); c.mesh.position.set(x, 0, c.base.z); c.shadow.position.set(x, 0.02, c.base.z); c.face(camera, c.dir < 0); });
  R.pigeons.forEach((p, i) => { const u = p.userData; const hop = Math.max(0, Math.sin(t * 5 + u.p)) * 0.08; p.position.set(u.x + Math.sin(t * 0.7 + u.p) * 0.4, 0.17 + hop, u.z); });
  R.horse.rotation.y = Math.atan2(camera.position.x - (YARD_X - 2.4), camera.position.z + 11.6) * 0 + 0.5;
  // modern room water
  R.streams.forEach((s, i) => { s.scale.x = s.scale.z = 1 + Math.sin(t * 30 + i) * 0.1; });
  // hide everyone by default; shots place them
  [hero, prof, ...colleagues, ...cutters].forEach((c) => (c.mesh.visible = false));
}

// ---------- shots ----------
const HX0 = 1.75, HZ0 = -1.05;            // hero at the wash basin
const shots = [
  { id: 'hook', start: 0, run(t, u) {
      place = 'ward'; world(t);
      const e = ease.io(sw(t, 0.6, S.vienna - 0.1));
      look(v3(lerp(0.2, 0.05, e), lerp(1.05, 1.55, e), lerp(-0.3, 0.1, e)), v3(HX0, lerp(0.75, 1.45, e), HZ0), lerp(44, 40, e));
      placeChar(hero, HX0, HZ0, { pose: 'scrub', foam: true, apron: false, expr: e > 0.6 ? 'determined' : 'bored', scrubT: Math.floor(t * 6) });
      return {};
  } },
  { id: 'vienna', start: S.vienna, run(t, u) {
      place = 'yard'; world(t); const e = ease.io(u);
      look(path([v3(YARD_X + 1.5, 0.55, 3.5), v3(YARD_X + 3.5, 3, 7), v3(YARD_X + 6, 7.5, 12)], e), path([v3(YARD_X - 1, 0.5, -6), v3(YARD_X, 4, -25), v3(YARD_X + 2, 9, -34)], e), lerp(46, 52, e));
      return {};
  } },
  { id: 'sick', start: S.sick, trans: { type: 'fade', dur: 0.25 }, run(t) {
      place = 'ward'; world(t);
      const far = WT('sick', 7);
      const a = ease.sine(sw(t, S.sick, far)), b = ease.io(sw(t, far, S.notice - 0.1));
      const z = lerp(lerp(-3, -24, a), -50, b);
      look(v3(lerp(0.4, 0, b), lerp(1.7, 1.55, b), z), v3(lerp(-1.2, 0, b), 1.1, z - 9), 52, 0.02);
      return { blur: b > 0.1 && b < 0.9 };
  } },
  { id: 'notice', start: S.notice, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      place = 'ward'; world(t);
      look(v3(lerp(1.0, 0.7, u), 1.55, lerp(-4.2, -4.8, u)), v3(-1.2, 1.35, -9.0), 44);
      placeChar(hero, -0.9, -8.6, { ...HERO, pose: 'note', apron: false, foam: false, expr: 'aha' });
      return {};
  } },
  { id: 'autopsy', start: WT('notice', 5), trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      const walkS = WT('notice', 8), walkE = WT('notice', 16) + 0.2;
      const k = ease.io(sw(t, walkS, walkE)); const dz = lerp(8.5, -6.5, k);
      place = dz > 2 ? 'aut' : 'ward'; world(t);
      cutters.forEach((c, i) => {
        const ox = [-0.9, 0.15, 1.1][i], oz = [0.4, -0.3, 0.5][i];
        const z = k > 0 ? dz + oz : [8.0, 9.3, 7.4][i];
        const x = k > 0 ? ox * 0.8 : [-1.7, 1.75, 1.0][i];
        placeChar(c, x, z, { pose: k > 0 && k < 1 ? (Math.floor(t * 4 + i) % 2 ? 'walk1' : 'walk2') : 'stand', expr: i === 1 ? 'happy' : 'neutral' });
        germsOnHands(c, 4, t, i + 1);
      });
      const cz = k > 0 ? dz - 3.6 : 4.6;
      look(v3(k > 0 ? 0.5 : 0.6, k > 0 ? 1.55 : 2.6, k > 0 ? cz : 3.6), v3(0, k > 0 ? 1.2 : 1.0, k > 0 ? dz : 8.4), 52, k > 0 ? 0.02 : -0.03);
      return {};
  } },
  { id: 'reach', start: WT('notice', 16), trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      place = 'ward'; world(t);
      const c = cutters[1]; placeChar(c, -2.2, -8.0, { pose: 'shake', expr: 'happy' }, true);
      germsOnHands(c, 5, t, 7);
      // germs hopping toward the mother
      const m = R.mothers[2]; const mp = m.worldPoint(256, 300); const hp = c.worldPoint(494, 452);
      for (let i = 0; i < 3; i++) { const q = (t * 1.2 + i / 3) % 1; const p = hp.clone().lerp(mp, q); p.y += Math.sin(q * Math.PI) * 0.35; germAt(p, t, 50 + i, 0.15); }
      look(v3(lerp(-0.6, -0.9, u), 1.3, lerp(-6.0, -6.4, u)), v3(-3.4, 1.05, -8.6), 42, 0.05);
      return {};
  } },
  { id: 'scrub', start: S.scrub, trans: { type: 'fade', dur: 0.2 }, run(t, u) {
      place = 'ward'; world(t); const e = ease.sine(u);
      look(v3(lerp(-1.6, -1.0, e), 1.6, lerp(-4.6, -4.0, e)), v3(1.9, 1.25, -1.2), 46);
      placeChar(hero, HX0 - 0.3, HZ0 - 0.6, { ...HERO, pose: t > WT('scrub', 3) ? 'point' : 'stand', apron: false, foam: false, expr: 'determined' });
      colleagues.forEach((c, i) => placeChar(c, -0.2 + i * 0.75, -3.6 - (i % 2) * 0.6, { pose: 'stand', expr: 'neutral' }));
      return {};
  } },
  { id: 'laugh', start: S.laugh, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      place = 'ward'; world(t);
      look(v3(lerp(1.2, 0.9, u), 1.6, lerp(0.6, 0.2, u)), v3(-2.0, 1.3, -4.2), 46, -0.08);
      const poses = ['laughbelly', 'point', 'shrug', 'laughbelly'];
      colleagues.forEach((c, i) => { placeChar(c, -1.1 - i * 0.75, -3.4 - (i % 2) * 0.8, { pose: poses[i], expr: 'laugh' }, i === 1); c.mesh.position.y = Math.abs(Math.sin(t * 9 + i)) * 0.05; });
      germsOnHands(colleagues[2], 6, t, 3);
      return {};
  } },
  { id: 'boss', start: S.boss, trans: { type: 'whip', dur: 0.12 }, run(t, u) {
      place = 'ward'; world(t); const e = ease.io(u);
      const wk = sw(t, S.boss - 0.3, S.boss + 1.1);
      const pz = lerp(3.0, -0.6, ease.o(wk));
      let spec = { pose: wk < 1 ? (Math.floor(t * 6) % 2 ? 'walk1' : 'walk2') : 'stand', expr: 'angry', faceColor: '#ffffff', steam: false };
      if (t >= WT('boss', 3)) { spec.faceColor = '#ef6b5b'; spec.steam = true; }
      if (t >= WT('boss', 4)) { spec.pose = 'fist'; spec.expr = 'shout'; }
      placeChar(prof, 0.2, pz, spec);
      look(v3(lerp(-0.9, -0.4, e), lerp(0.5, 0.9, e), lerp(-4.6, -3.0, e)), v3(0.2, lerp(1.4, 1.55, e), pz), lerp(50, 38, e), 0.05);
      return {};
  } },
  { id: 'shrug', start: S.shrug, trans: { type: 'fade', dur: 0.2 }, run(t) {
      place = 'ward'; world(t);
      const lp = sw(t, WT('shrug', 2), S.drop);
      if (lp <= 0) { look(v3(0.2, 1.55, -0.1), v3(HX0, 1.45, HZ0), 40); placeChar(hero, HX0, HZ0, { ...HERO, pose: 'shrug', apron: false, foam: false, expr: 'bored' }); }
      else {
        look(v3(-2.4, lerp(2.7, 3.1, lp), lerp(-5.6, -6.0, lp)), v3(2.1, 0.9, -1.3), 50, 0.02);
        placeChar(hero, HX0, HZ0, { ...HERO, pose: 'scrub', apron: false, foam: true, expr: 'smirk', scrubT: Math.floor(t * 10) });
        colleagues.forEach((c, i) => { const q = (t * 2.2 + i * 0.25) % 1; placeChar(c, lerp(-0.4, 1.4, q), lerp(-3.4, -1.6, q) - i * 0.35, { pose: q > 0.7 ? 'scrub' : (Math.floor(t * 8 + i) % 2 ? 'walk1' : 'walk2'), expr: 'bored', foam: q > 0.7 }); });
      }
      return { fx: { lapse: lp > 0 && lp < 1 ? lp : 0 } };
  } },
  { id: 'drop', start: S.drop, trans: { type: 'fade', dur: 0.2 }, run(t) {
      place = 'ward'; world(t);
      const turn = WT('drop', 11);
      if (t < turn) {
        const p = sw(t, S.drop + 0.2, WT('drop', 10) + 0.3);
        R.board.material.map = R.chartSteps[Math.round(p * 24)]; R.board.material.needsUpdate = true;
        look(v3(-1.45, 1.6, lerp(-0.25, -0.55, p)), v3(-2.5, 1.5, -2.2), 40);
        placeChar(hero, -1.6, -2.9, { ...HERO, pose: 'point', apron: false, foam: false, expr: 'determined' }, true);
      } else {
        const e = ease.sine(sw(t, turn, S.whatif));
        look(v3(lerp(0.6, 0.2, e), 1.55, lerp(-5.5, -9.5, e)), v3(-3.2, 1.0, lerp(-12.5, -16.5, e)), 46);
      }
      return { fx: { oneIn: t >= WT('drop', 8) && t < WT('drop', 13) ? ['1 in 10', sw(t, WT('drop', 8), WT('drop', 8) + 0.15)] : t >= WT('drop', 13) ? ['1 in 100', sw(t, WT('drop', 13), WT('drop', 13) + 0.15)] : null }, blur: t > turn - 0.12 && t < turn + 0.12 };
  } },
  { id: 'whatif', start: S.whatif, rewind: 0.45, run(t, u) {
      mode = 'whatif'; place = 'ward'; world(t);
      const e = ease.sine(u);
      look(v3(lerp(1.4, 1.0, e), 1.7, lerp(-2.6, -3.4, e)), v3(-0.3, 1.25, -11), 50, 0.06);
      const chain = [...colleagues, ...cutters];
      chain.forEach((c, i) => placeChar(c, (i % 2 ? 0.7 : -0.7), -5.5 - i * 1.3, { pose: 'shake', expr: i % 2 ? 'happy' : 'neutral' }, i % 2 === 1));
      const grow = sw(t, S.whatif + 0.4, S.name);
      chain.forEach((c, i) => germsOnHands(c, 2 + Math.floor(grow * 6), t, i + 20));
      for (let i = 0; i < chain.length - 1; i++) for (let j = 0; j < 2 + Math.floor(grow * 3); j++) {
        const q = (t * 1.4 + j * 0.37 + i * 0.21) % 1; const a = chain[i].worldPoint(494, 452), b = chain[i + 1].worldPoint(494, 452);
        const p = a.clone().lerp(b, q); p.y += Math.sin(q * Math.PI) * 0.5; germAt(p, t, 100 + i * 5 + j, 0.14);
      }
      mode = 'normal';
      return { fx: { bw: 1 } };
  } },
  { id: 'name', start: S.name, run(t, u) {
      place = 'ward'; world(t); const e = ease.io(u);
      look(v3(lerp(-1.0, -2.6, e), lerp(3.0, 3.35, e), lerp(-0.2, -0.55, e)), v3(-4.9, 3.4, -0.6), lerp(48, 40, e));
      return { fx: { rewind: clamp01(1 - (t - S.name) / 0.4) } };
  } },
  { id: 'today', start: S.today, trans: { type: 'fade', dur: 0.25 }, run(t) {
      place = 'or'; world(t);
      const k = ease.io(sw(t, S.today, TL.speechEnd + 0.1));
      look(v3(OR_X + lerp(1.2, 0.5, k), lerp(1.7, 1.6, k), lerp(2.4, 0.4, k)), v3(OR_X + 0.1, lerp(1.2, 1.4, k), -1.6), lerp(48, 38, k));
      R.surgeon.set({ expr: t > TL.speechEnd + 0.25 ? 'wink' : 'smirk', scrubT: Math.floor(t * 8), pose: t > TL.speechEnd + 0.1 ? 'stand' : 'scrub' });
      R.surgeon.face(camera); R.nurse2.face(camera);
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
  cx.filter = res.fx && res.fx.bw ? 'grayscale(1) contrast(1.25) brightness(0.95)' : 'saturate(1.15) contrast(1.05)';
  cx.drawImage(glCanvas, 0, 0, W, H); cx.restore();
  return res;
}
function bloom(a = 0.2) { sx.filter = 'brightness(1.05) contrast(1.8) blur(5px)'; sx.clearRect(0, 0, small.width, small.height); sx.drawImage(comp, 0, 0, small.width, small.height); cx.save(); cx.globalCompositeOperation = 'screen'; cx.globalAlpha = a; cx.drawImage(small, 0, 0, W, H); cx.restore(); }
function vignette(s = 0.3) { const g = cx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, H * 0.75); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${s})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
function grade(warm) { cx.save(); cx.globalCompositeOperation = 'soft-light'; cx.globalAlpha = 0.2; const g = cx.createLinearGradient(0, 0, 0, H); if (warm === 'cold') { g.addColorStop(0, '#6a8aa0'); g.addColorStop(1, '#203040'); } else if (warm === 'or') { g.addColorStop(0, '#e8f8ff'); g.addColorStop(1, '#6a9aa8'); } else { g.addColorStop(0, '#fff0d0'); g.addColorStop(1, '#8a6a4a'); } cx.fillStyle = g; cx.fillRect(0, 0, W, H); cx.restore(); }
function vhs(t, amount) {
  if (amount <= 0) return;
  for (let i = 0; i < 9; i++) { const y = ((Math.sin(t * 50 + i * 7.3) * 0.5 + 0.5) * H) | 0, h = 10 + ((i * 37) % 60); cx.drawImage(comp, 0, y, W, h, Math.sin(t * 80 + i) * 60 * amount, y, W, h); }
  cx.save(); cx.globalAlpha = 0.22 * amount; cx.fillStyle = '#000'; for (let y = 0; y < H; y += 6) cx.fillRect(0, y, W, 2); cx.restore();
  cx.save(); cx.globalAlpha = amount; cx.font = '800 64px Montserrat'; cx.fillStyle = '#fff'; cx.shadowColor = '#000'; cx.shadowBlur = 8; cx.fillText('◀◀ REW', 70, 150); cx.restore();
}
function grain(t, a) { cx.save(); cx.globalAlpha = a; cx.globalCompositeOperation = 'overlay'; cx.drawImage(grains[Math.floor(t * 30) % 4], 0, 0, W, H); cx.restore(); }
function bigText(txt, k, y = 0.62, size = 200) {
  if (k <= 0) return; const s = 0.4 + 0.6 * ease.o(k) + Math.sin(k * Math.PI) * 0.15;
  cx.save(); cx.translate(W / 2, H * y); cx.scale(s, s); cx.rotate(-0.05); cx.font = `900 ${size}px Montserrat`; cx.textAlign = 'center'; cx.textBaseline = 'middle';
  cx.lineJoin = 'round'; cx.lineWidth = 24; cx.strokeStyle = '#141010'; cx.strokeText(txt, 0, 0); cx.fillStyle = '#ffd23f'; cx.fillText(txt, 0, 0); cx.restore();
}
function sparkle(k) {
  for (const [x, y, s0] of [[0.62, 0.43, 1], [0.7, 0.38, 0.6], [0.56, 0.37, 0.5]]) {
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
    if (!fx.bw) grade(place === 'aut' ? 'cold' : place === 'or' ? 'or' : 'warm');
    bloom(0.22);
    if (fx.bw) { grain(t, 0.35); vignette(0.55); } else vignette(place === 'aut' ? 0.5 : 0.3);
    if (fx.rewind) vhs(t, fx.rewind);
    if (fx.oneIn) bigText(fx.oneIn[0], fx.oneIn[1], 0.66, 190);
    if (fx.sparkle) sparkle(fx.sparkle);
  }
  captions(t);
  return opts.noData ? null : comp.toDataURL('image/jpeg', 0.93);
};
document.title = 'ready';
