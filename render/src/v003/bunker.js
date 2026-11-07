// 1983 early-warning bunker, night exterior with radar dishes, space with Earth + satellite.
import * as THREE from 'three';
import { toon, outline, box, hash, vnoise, skyDome, glowTexture, blobShadow, canvasTex } from '../world.js';
import { Char } from '../chars.js';

export const OUT_X = 160;     // night exterior origin
export const SPACE_X = -400;  // space origin
export const EARTH_R = 40;
export const SAT_POS = new THREE.Vector3(SPACE_X + 6, 4, 62);

// ---------- world map geometry (lon, lat) ----------
const LAND = {
  na: [[-168, 66], [-156, 71], [-140, 70], [-120, 72], [-95, 72], [-80, 73], [-62, 66], [-55, 52], [-66, 45], [-70, 41], [-76, 35], [-81, 31], [-80, 25], [-84, 30], [-90, 29], [-97, 26], [-97, 21], [-90, 17], [-83, 10], [-79, 8], [-86, 13], [-95, 16], [-105, 20], [-110, 23], [-117, 32], [-123, 38], [-124, 46], [-130, 54], [-140, 59], [-152, 58], [-165, 61]],
  gl: [[-55, 60], [-44, 60], [-20, 70], [-20, 80], [-60, 82], [-72, 77], [-55, 68]],
  sa: [[-79, 8], [-60, 10], [-50, 0], [-35, -6], [-39, -14], [-48, -26], [-58, -38], [-65, -55], [-72, -50], [-74, -40], [-71, -18], [-81, -5]],
  eu: [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [4, 52], [8, 57], [5, 62], [15, 69], [28, 71], [40, 67], [60, 69], [70, 73], [90, 76], [110, 77], [140, 72], [160, 70], [180, 68], [180, 62], [163, 58], [156, 51], [142, 46], [135, 43], [128, 38], [122, 31], [120, 24], [110, 20], [106, 10], [100, 13], [98, 8], [93, 21], [80, 16], [77, 8], [72, 20], [67, 25], [57, 25], [52, 30], [48, 30], [56, 24], [59, 22], [52, 16], [43, 13], [35, 28], [33, 31], [36, 36], [27, 37], [26, 40], [23, 36], [20, 40], [13, 45], [15, 40], [8, 44], [3, 43], [0, 38], [-6, 36]],
  af: [[-17, 21], [-12, 28], [-6, 35], [10, 37], [20, 31], [32, 31], [34, 28], [43, 12], [51, 11], [40, -3], [40, -15], [33, -26], [20, -35], [17, -29], [12, -15], [13, -5], [8, 4], [-8, 4], [-17, 14]],
  au: [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -19], [153, -28], [150, -37], [141, -38], [130, -32], [115, -34]],
  uk: [[-6, 50], [1, 51], [2, 53], [-3, 58], [-6, 57]],
  jp: [[130, 31], [141, 36], [142, 45], [139, 38]],
};
const USSR = [[28, 70], [40, 67], [60, 69], [70, 73], [90, 76], [110, 77], [140, 72], [180, 68], [180, 62], [163, 58], [156, 51], [142, 46], [135, 43], [130, 43], [120, 53], [100, 50], [88, 49], [80, 43], [70, 40], [60, 37], [54, 38], [48, 42], [40, 43], [36, 45], [28, 46], [23, 52], [22, 56], [28, 60], [30, 70]];
const USA = [[-125, 48], [-95, 49], [-83, 46], [-70, 45], [-67, 44], [-76, 35], [-81, 31], [-80, 25], [-84, 30], [-97, 26], [-104, 29], [-111, 31], [-117, 32], [-124, 40]];
export const SITES = { usa: [[-110, 47], [-104, 44], [-100, 47], [-97, 42], [-106, 41]], moscow: [37.6, 55.7], ussr: [[60, 55], [80, 52], [45, 52], [100, 56], [65, 62]], usaTargets: [[-77, 39], [-74, 41], [-87, 42], [-118, 34], [-122, 38]] };

const ll2xy = (lon, lat, w, h) => [(lon + 180) / 360 * w, (85 - lat) / 145 * h];
function poly(c, pts, w, h) { c.beginPath(); pts.forEach(([lo, la], i) => { const [x, y] = ll2xy(lo, la, w, h); i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); }

// wall screen texture: state {arcs: n (0..5), prog: 0..1 per arc, alarm: bool, flash: 0..1, counter: 0..1, ok: bool}
const mapCache = new Map();
export function mapTexture(st) {
  const key = JSON.stringify(st); if (mapCache.has(key)) return mapCache.get(key);
  const W = 2048, H = 1024;
  const t = canvasTex(W, H, (c) => {
    c.fillStyle = '#04121c'; c.fillRect(0, 0, W, H);
    c.strokeStyle = 'rgba(60,160,140,0.25)'; c.lineWidth = 2;
    for (let lo = -180; lo <= 180; lo += 15) { const [x] = ll2xy(lo, 0, W, H); c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    for (let la = -75; la <= 75; la += 15) { const [, y] = ll2xy(0, la, W, H); c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    for (const p of Object.values(LAND)) { poly(c, p, W, H); c.fillStyle = 'rgba(40,140,110,0.35)'; c.fill(); c.strokeStyle = '#5affc8'; c.lineWidth = 4; c.stroke(); }
    poly(c, USSR, W, H); c.fillStyle = st.alarm ? 'rgba(255,60,60,0.25)' : 'rgba(120,255,200,0.18)'; c.fill(); c.strokeStyle = st.alarm ? '#ff6a5a' : '#9affd8'; c.lineWidth = 5; c.stroke();
    poly(c, USA, W, H); c.fillStyle = 'rgba(80,160,255,0.22)'; c.fill(); c.strokeStyle = '#7ab8ff'; c.lineWidth = 5; c.stroke();
    const [mx, my] = ll2xy(...SITES.moscow, W, H);
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(mx, my, 10, 0, 7); c.fill(); c.font = '700 34px monospace'; c.fillText('МОСКВА', mx - 40, my - 22);
    // incoming arcs USA -> Moscow (they cross the pole: drawn bowed to the north)
    for (let i = 0; i < st.arcs; i++) {
      const [sx, sy] = ll2xy(...SITES.usa[i], W, H); const p = i === st.arcs - 1 ? st.prog : 1;
      const cxp = (sx + mx) / 2, cyp = 40 + i * 14;
      c.strokeStyle = '#ff3b30'; c.lineWidth = 7; c.setLineDash([22, 12]); c.beginPath(); c.moveTo(sx, sy);
      const N = 40; for (let k = 1; k <= N * p; k++) { const u = k / N; const x = (1 - u) * (1 - u) * sx + 2 * u * (1 - u) * cxp + u * u * mx, y = (1 - u) * (1 - u) * sy + 2 * u * (1 - u) * cyp + u * u * my; c.lineTo(x, y); }
      c.stroke(); c.setLineDash([]);
      c.fillStyle = '#ff3b30'; c.beginPath(); c.arc(sx, sy, 14, 0, 7); c.fill();
    }
    if (st.counter > 0) for (let i = 0; i < 5; i++) {
      const [sx, sy] = ll2xy(...SITES.ussr[i], W, H), [tx, ty] = ll2xy(...SITES.usaTargets[i], W, H);
      c.strokeStyle = `rgba(255,200,60,${0.4 + 0.6 * st.counter})`; c.lineWidth = 5; c.setLineDash([10, 14]); c.beginPath(); c.moveTo(sx, sy); c.quadraticCurveTo((sx + tx) / 2, 60 + i * 18, tx, ty); c.stroke(); c.setLineDash([]);
    }
    c.fillStyle = st.alarm ? '#ff6a5a' : '#5affc8'; c.font = '700 40px monospace';
    c.fillText(st.alarm ? `ЦЕЛЬ: ${st.arcs}   ДОСТОВЕРНОСТЬ: ВЫСОКАЯ` : 'СИСТЕМА «ОКО»   ОБСТАНОВКА: НОРМА', 40, H - 40);
    if (st.ok) { c.fillStyle = 'rgba(90,255,200,0.9)'; c.font = '900 120px monospace'; c.fillText('ЛОЖНАЯ ТРЕВОГА', 420, 560); }
    if (st.alarm && st.flash > 0.5) { c.fillStyle = 'rgba(255,40,40,0.18)'; c.fillRect(0, 0, W, H); }
  });
  t.colorSpace = THREE.SRGBColorSpace; mapCache.set(key, t); return t;
}
function crtTex(seed, red) {
  return canvasTex(256, 192, (c) => {
    c.fillStyle = red ? '#2a0606' : '#03140a'; c.fillRect(0, 0, 256, 192);
    c.fillStyle = red ? '#ff5a4a' : '#5aff8a'; c.font = '700 16px monospace';
    for (let i = 0; i < 9; i++) { let s = ''; for (let k = 0; k < 18; k++) s += hash(seed + i, k) > 0.5 ? String.fromCharCode(48 + Math.floor(hash(k, seed + i) * 10)) : ' '; c.fillText(red && i === 4 ? '  СТАРТ  СТАРТ' : s, 10, 22 + i * 19); }
    c.fillStyle = 'rgba(255,255,255,0.05)'; for (let y = 0; y < 192; y += 4) c.fillRect(0, y, 256, 1);
  });
}
function concreteTex() {
  const t = canvasTex(512, 512, (c) => { c.fillStyle = '#8a8c88'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(${hash(i, 1) > 0.5 ? '255,255,255' : '0,0,0'},${hash(i, 2) * 0.06})`; c.fillRect(hash(i, 3) * 512, hash(i, 4) * 512, 3 + hash(i, 5) * 8, 3 + hash(i, 6) * 8); } c.strokeStyle = 'rgba(40,40,40,0.35)'; c.lineWidth = 3; for (let y = 0; y < 512; y += 128) { c.beginPath(); c.moveTo(0, y); c.lineTo(512, y); c.stroke(); } for (let x = 0; x < 512; x += 256) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 512); c.stroke(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function earthTex() {
  return canvasTex(2048, 1024, (c) => {
    const W = 2048, H = 1024;
    const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1a4a8a'); g.addColorStop(0.5, '#1e5aa8'); g.addColorStop(1, '#1a4a8a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (const p of Object.values(LAND)) { c.beginPath(); p.forEach(([lo, la], i) => { const x = (lo + 180) / 360 * W, y = (90 - la) / 180 * H; i ? c.lineTo(x, y) : c.moveTo(x, y); }); c.closePath(); c.fillStyle = '#4f8a3a'; c.fill(); }
    c.globalCompositeOperation = 'source-atop';
    for (let i = 0; i < 4000; i++) { const x = hash(i, 1) * W, y = hash(i, 2) * H; c.fillStyle = hash(i, 3) > 0.6 ? 'rgba(180,150,90,0.25)' : 'rgba(30,80,30,0.2)'; c.beginPath(); c.arc(x, y, 6 + hash(i, 4) * 20, 0, 7); c.fill(); }
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = '#f2f6fa'; c.fillRect(0, 0, W, 60); c.fillRect(0, H - 70, W, 70);
  });
}
function cloudTex() {
  return canvasTex(2048, 1024, (c) => {
    c.clearRect(0, 0, 2048, 1024);
    for (let i = 0; i < 2200; i++) { const x = hash(i, 1) * 2048, y = 100 + hash(i, 2) * 820; const r = 3 + hash(i, 3) * 12; c.fillStyle = `rgba(255,255,255,${0.08 + hash(i, 4) * 0.22})`; c.beginPath(); c.ellipse(x, y, r * 3.5, r, (hash(i, 5) - 0.5) * 0.4, 0, 7); c.fill(); }
  });
}

function console_(x, z, seed) {
  const g = new THREE.Group();
  const body = box(2.6, 0.9, 0.9, 0x6a7a74, [0, 0.45, 0], 0.03); body.material.roughness = 0.6; g.add(body);
  const top = box(2.6, 0.08, 0.7, 0x5a6a64, [0, 1.0, -0.05], 0.02); top.rotation.x = -0.35; g.add(top);
  const knobs = canvasTex(256, 64, (c) => { c.fillStyle = '#4a5a54'; c.fillRect(0, 0, 256, 64); for (let i = 0; i < 18; i++) { c.fillStyle = ['#e8e8e8', '#ff4a3a', '#ffd23a', '#5aff8a'][i % 4]; c.beginPath(); c.arc(12 + i * 14, 20 + (i % 2) * 22, 5, 0, 7); c.fill(); } });
  const kp = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: knobs })); kp.rotation.x = -Math.PI / 2 + 0.35; kp.position.set(0, 1.05, -0.05); g.add(kp);
  const screens = [];
  for (const dx of [-0.65, 0.65]) {
    const mon = box(0.9, 0.7, 0.6, 0xc8c2a8, [dx, 1.5, -0.25], 0.025); g.add(mon);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.52), new THREE.MeshBasicMaterial({ map: crtTex(seed + dx * 10, false) })); sc.position.set(dx, 1.52, 0.06); g.add(sc); screens.push(sc);
  }
  g.position.set(x, 0, z); g.rotation.y = Math.PI; g.userData.screens = screens; g.userData.seed = seed;
  return g;
}
function phone(color) {
  const g = new THREE.Group(); const m = toon(color, { roughness: 0.25 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.28), m); b.position.y = 0.07; outline(b, 0.012); g.add(b);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 20), toon(0xf2f2f2)); dial.position.set(0, 0.15, 0.04); g.add(dial);
  const hs = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.28, 4, 8), m); hs.rotation.z = Math.PI / 2; hs.position.set(0, 0.2, -0.06); outline(hs, 0.01); g.add(hs);
  g.userData.handset = hs; return g;
}
function birch(x, z, h, s) {
  const g = new THREE.Group();
  const bark = canvasTex(64, 256, (c) => { c.fillStyle = '#eeeae0'; c.fillRect(0, 0, 64, 256); for (let i = 0; i < 26; i++) { c.fillStyle = '#2a2a2a'; c.fillRect(hash(i, s) * 40, hash(s, i) * 256, 10 + hash(i, 3) * 20, 3 + hash(i, 4) * 5); } });
  const t = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, h, 8), toon(0xffffff, { map: bark })); t.position.y = h / 2; t.castShadow = true; outline(t, 0.03); g.add(t);
  for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 8), toon([0xc8b040, 0x9aa83a, 0xd8a838, 0x7a9a3a][(i + s) % 4])); c.scale.set(1, 1.3, 1); c.position.set((hash(i, s) - 0.5) * 1.6, h * 0.75 + i * 0.5, (hash(s, i) - 0.5) * 1.6); outline(c, 0.05); g.add(c); }
  g.position.set(x, 0, z); return g;
}
function pine(x, z, h) { const g = new THREE.Group(); g.add(box(0.3, h * 0.3, 0.3, 0x4a3020, [0, h * 0.15, 0], 0.03)); for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(1.8 - i * 0.45, h * 0.4, 9), toon(0x1f4a2e)); c.position.y = h * 0.35 + i * h * 0.2; outline(c, 0.05); c.castShadow = true; g.add(c); } g.position.set(x, 0, z); return g; }
function dish(r) {
  const g = new THREE.Group();
  const d = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 10, 0, Math.PI * 2, 0, 0.75), toon(0xe8ecee, { side: THREE.DoubleSide, roughness: 0.4 })); d.rotation.x = Math.PI; d.position.y = r * 1.05; outline(d, 0.06);
  const head = new THREE.Group(); head.add(d); const feed = box(0.12, r * 0.9, 0.12, 0x9aa0a4, [0, r * 0.45, 0], 0.02); head.add(feed);
  head.rotation.x = -0.9; head.position.y = 3.2;
  g.add(box(1.2, 3.2, 1.2, 0x8a8c88, [0, 1.6, 0], 0.04)); g.add(head); g.userData.head = head; return g;
}

export function buildBunker() {
  const scene = new THREE.Scene();
  const sky = skyDome(0x050a18, 0x14203a, 0x0a0a10); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xbfd0e8, 0x2a2a30, 0.4); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 0); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); sun.shadow.bias = -0.0005; sun.userData.dir = new THREE.Vector3(0.4, 0.6, 0.5).normalize(); scene.add(sun, sun.target);

  // ===== BUNKER =====
  const bunker = new THREE.Group(); scene.add(bunker);
  const ct = concreteTex(); ct.repeat.set(4, 1.5);
  const cmat = toon(0xffffff, { map: ct, roughness: 0.9 });
  const lino = canvasTex(512, 512, (c) => { for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { c.fillStyle = (i + j) % 2 ? '#5a6a62' : '#4e5c55'; c.fillRect(i * 64, j * 64, 64, 64); } }); lino.wrapS = lino.wrapT = THREE.RepeatWrapping; lino.repeat.set(5, 6);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(18, 24), toon(0xffffff, { map: lino, roughness: 0.35 })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0, -3); fl.receiveShadow = true; bunker.add(fl);
  for (const [w, h, d, x, y, z] of [[0.5, 5, 24, -9, 2.5, -3], [0.5, 5, 24, 9, 2.5, -3], [18, 5, 0.5, 0, 2.5, -15], [18, 5, 0.5, 0, 2.5, 9], [18, 0.4, 24, 0, 5.0, -3]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), cmat); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true; bunker.add(m); }
  for (let z = 6; z > -14; z -= 3) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 18, 10), toon(0x6a7a6a, { roughness: 0.4, metalness: 0.5 })); p.rotation.z = Math.PI / 2; p.position.set(0, 4.55, z); bunker.add(p); }
  const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 24, 10), toon(0xa05a3a, { roughness: 0.5, metalness: 0.4 })); pipe2.rotation.x = Math.PI / 2; pipe2.position.set(-8.4, 4.3, -3); bunker.add(pipe2);
  // wall map
  const mapMat = new THREE.MeshBasicMaterial({ map: mapTexture({ arcs: 0, prog: 0, alarm: false, flash: 0, counter: 0, ok: false }) });
  const map = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 4.2), mapMat); map.position.set(0, 2.6, -14.7); bunker.add(map);
  bunker.add(box(8.9, 0.2, 0.3, 0x2a2a2a, [0, 0.45, -14.6], 0.02), box(8.9, 0.2, 0.3, 0x2a2a2a, [0, 4.75, -14.6], 0.02));
  const mapGlow = new THREE.PointLight(0x5affc8, 18, 14, 1.5); mapGlow.position.set(0, 2.8, -12.5); bunker.add(mapGlow);
  // СТАРТ sign
  const startOn = canvasTex(512, 160, (c) => { c.fillStyle = '#ff2a1a'; c.fillRect(0, 0, 512, 160); c.fillStyle = '#fff6e0'; c.font = '900 110px sans-serif'; c.textAlign = 'center'; c.fillText('СТАРТ', 256, 120); });
  const startOff = canvasTex(512, 160, (c) => { c.fillStyle = '#3a0a08'; c.fillRect(0, 0, 512, 160); c.fillStyle = '#5a2a20'; c.font = '900 110px sans-serif'; c.textAlign = 'center'; c.fillText('СТАРТ', 256, 120); });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.75), new THREE.MeshBasicMaterial({ map: startOff })); sign.position.set(5.6, 3.9, -14.4); bunker.add(sign, box(2.6, 0.95, 0.2, 0x1a1a1a, [5.6, 3.9, -14.55], 0.02));
  // consoles + operators
  const consoles = []; const ops = [];
  const hairs = ['#2a2018', '#5a3a1a', '#8a5a2a', '#1a1410'];
  let k = 0;
  for (const z of [-9, -5.5, -2]) for (const x of [-5.4, -1.8, 1.8, 5.4]) {
    const c = console_(x, z, k); bunker.add(c); consoles.push(c);
    const female = k % 3 === 1;
    const op = new Char({ outfit: 'soviet', hair: female ? 'bun' : 'short', hairColor: hairs[k % 4], blush: female, headset: true, expr: 'neutral', pose: 'stand' }, 1.85);
    op.base = new THREE.Vector3(x + (k % 2 ? 0.5 : -0.5), 0, z + 0.85); op.mesh.position.copy(op.base); op.phase = hash(k, 3) * 6; bunker.add(op.mesh); ops.push(op); k++;
  }
  // duty officer platform + desk
  bunker.add(box(5, 0.35, 3.4, 0x4a4a46, [0, 0.175, 5.4], 0.03));
  const desk = box(3.0, 0.08, 1.2, 0x6a4a2a, [0, 1.12, 4.6], 0.025); bunker.add(desk);
  bunker.add(box(2.9, 0.75, 1.1, 0x5a3a20, [0, 0.72, 4.6], 0.03));
  const redPhone = phone(0xb8261c); redPhone.position.set(-0.9, 1.16, 4.5); redPhone.rotation.y = 0.3; bunker.add(redPhone);
  const blackPhone = phone(0x1e1e22); blackPhone.position.set(0.9, 1.16, 4.5); blackPhone.rotation.y = -0.2; bunker.add(blackPhone);
  const log = box(0.5, 0.05, 0.36, 0x2a4a6a, [0.1, 1.18, 4.3], 0.01); bunker.add(log);
  const lampArm = box(0.04, 0.5, 0.04, 0x2a2a2a, [1.3, 1.4, 4.85], 0); bunker.add(lampArm);
  const deskLamp = new THREE.PointLight(0xffd8a0, 4, 4, 1.5); deskLamp.position.set(-0.2, 1.7, 4.6); bunker.add(deskLamp);
  // paperwork stack for the punchline
  const stack = new THREE.Group(); for (let i = 0; i < 14; i++) { const p = box(0.42, 0.03, 0.3, i % 2 ? 0xf2eee2 : 0xe8e2cc, [(hash(i, 1) - 0.5) * 0.04, 1.2 + i * 0.032, 0], 0.004); p.rotation.y = (hash(i, 2) - 0.5) * 0.15; stack.add(p); } stack.position.set(-0.3, 0, 4.45); stack.visible = false; bunker.add(stack);
  // fluorescent tubes + alarm beacons
  const tubes = []; const tubeLights = [];
  for (const z of [-11, -6, -1, 4]) for (const x of [-4, 4]) { const tb = box(2.2, 0.08, 0.22, 0xffffff, [x, 4.72, z], 0, new THREE.MeshBasicMaterial({ color: 0xf2fbff })); bunker.add(tb); tubes.push(tb); }
  for (const z of [-9, -2, 4]) { const L = new THREE.PointLight(0xe8f4ff, 22, 16, 1.4); L.position.set(0, 4.3, z); bunker.add(L); tubeLights.push(L); }
  const beacons = [];
  for (const [x, z] of [[-8.5, -13], [8.5, -13], [-8.5, 6], [8.5, 6]]) {
    const g = new THREE.Group(); g.position.set(x, 4.5, z); bunker.add(g);
    g.add(box(0.36, 0.2, 0.36, 0x2a2a2a, [0, 0.1, 0], 0.02));
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x5a1010 })); dome.rotation.x = Math.PI; dome.position.y = -0.02; g.add(dome);
    const sp = new THREE.SpotLight(0xff2a1a, 0, 22, 0.55, 0.5, 1.2); sp.position.set(0, -0.1, 0); const tgt = new THREE.Object3D(); g.add(sp, tgt); sp.target = tgt;
    beacons.push({ g, dome, sp, tgt });
  }
  const redFill = new THREE.PointLight(0xff2a1a, 0, 30, 1.2); redFill.position.set(0, 3.8, -4); bunker.add(redFill);
  // wall clock
  const clockFace = canvasTex(256, 256, (c) => { c.fillStyle = '#f4f2ea'; c.beginPath(); c.arc(128, 128, 124, 0, 7); c.fill(); c.strokeStyle = '#1a1a1a'; c.lineWidth = 10; c.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; c.lineWidth = 7; c.beginPath(); c.moveTo(128 + Math.sin(a) * 100, 128 - Math.cos(a) * 100); c.lineTo(128 + Math.sin(a) * 116, 128 - Math.cos(a) * 116); c.stroke(); } c.fillStyle = '#b8261c'; c.beginPath(); c.arc(128, 128, 8, 0, 7); c.fill(); });
  const clock = new THREE.Group(); clock.position.set(-8.7, 3.4, 1.5); clock.rotation.y = Math.PI / 2; bunker.add(clock);
  const cf = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshBasicMaterial({ map: clockFace })); clock.add(cf);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 32), toon(0x2a2a2a)); clock.add(rim);
  const hHour = box(0.05, 0.3, 0.02, 0x111111, [0, 0.15, 0.03], 0); const hMin = box(0.035, 0.48, 0.02, 0x111111, [0, 0.24, 0.04], 0);
  const hourPivot = new THREE.Group(), minPivot = new THREE.Group(); hourPivot.add(hHour); minPivot.add(hMin); clock.add(hourPivot, minPivot);
  // flag + poster
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.4), new THREE.MeshStandardMaterial({ map: canvasTex(440, 280, (c) => { c.fillStyle = '#c8201a'; c.fillRect(0, 0, 440, 280); c.fillStyle = '#f2c94a'; c.font = '900 64px sans-serif'; c.fillText('☭', 30, 90); c.strokeStyle = '#f2c94a'; c.lineWidth = 3; c.beginPath(); for (let j = 0; j < 10; j++) { const a = j * Math.PI / 5 - Math.PI / 2, r = j % 2 ? 6 : 14; c.lineTo(62 + Math.cos(a) * r, 22 + Math.sin(a) * r); } c.closePath(); c.stroke(); }), roughness: 0.9, side: THREE.DoubleSide }));
  flag.position.set(8.7, 3.1, -6); flag.rotation.y = -Math.PI / 2; bunker.add(flag);

  // ===== NIGHT EXTERIOR =====
  const ext = new THREE.Group(); ext.position.x = OUT_X; scene.add(ext);
  const gt = canvasTex(512, 512, (c) => { c.fillStyle = '#2a3a22'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 4000; i++) { c.fillStyle = ['#3a4a28', '#4a4026', '#22301c', '#5a4a2a'][i % 4]; c.fillRect(hash(i, 1) * 512, hash(i, 2) * 512, 3, 6); } }); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(30, 30);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), toon(0xffffff, { map: gt, roughness: 1 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; ext.add(gnd);
  for (let i = 0; i < 70; i++) { const a = hash(i, 1) * Math.PI * 2, r = 14 + hash(i, 2) * 60; const x = Math.cos(a) * r, z = Math.sin(a) * r - 10; if (Math.abs(x) < 7 && z > -18 && z < 12) continue; ext.add(i % 3 ? birch(x, z, 6 + hash(i, 3) * 4, i) : pine(x, z, 8 + hash(i, 4) * 5)); }
  const entr = new THREE.Group(); entr.add(box(7, 3.4, 5, 0x8a8c88, [0, 1.7, 0], 0.06)); entr.children[0].material.map = ct; const door = box(2.4, 2.4, 0.2, 0x3a4a3a, [0, 1.2, 2.55], 0.03); entr.add(door);
  const doorLamp = new THREE.PointLight(0xffd8a0, 10, 9, 1.4); doorLamp.position.set(0, 3.0, 3.4); entr.add(doorLamp); entr.add(box(0.5, 0.25, 0.3, 0xfff2c0, [0, 3.0, 2.7], 0, new THREE.MeshBasicMaterial({ color: 0xfff2c0 })));
  entr.position.set(0, 0, -10); ext.add(entr);
  const dishes = []; for (const [x, z, r] of [[-12, -22, 3.2], [13, -26, 4], [4, -38, 2.6]]) { const d = dish(r); d.position.set(x, 0, z); ext.add(d); dishes.push(d); }
  const masts = []; for (const [x, z, h] of [[-20, -40, 26], [22, -46, 32]]) { const m = new THREE.Group(); for (const s of [-1, 1]) for (const t of [-1, 1]) { const leg = box(0.12, h, 0.12, 0xb8b8b8, [s * 0.5, h / 2, t * 0.5], 0.01); m.add(leg); } for (let y = 1; y < h; y += 1.6) m.add(box(1.1, 0.06, 1.1, 0xb8b8b8, [0, y, 0], 0)); const red = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,60,40,1)', 'rgba(255,0,0,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); red.position.y = h + 0.4; red.scale.setScalar(2.5); m.add(red); m.userData.red = red; m.position.set(x, 0, z); ext.add(m); masts.push(m); }
  const starGeo = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 1500 }, (_, i) => { const a = hash(i, 1) * Math.PI * 2, e = 0.08 + hash(i, 2) * 1.4; return new THREE.Vector3(Math.cos(a) * Math.cos(e) * 380, Math.sin(e) * 380, Math.sin(a) * Math.cos(e) * 380); }));
  const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false })); scene.add(stars);
  const moon = new THREE.Sprite(new THREE.SpriteMaterial({ map: canvasTex(256, 256, (c) => { const g = c.createRadialGradient(128, 128, 30, 128, 128, 128); g.addColorStop(0, 'rgba(255,250,230,1)'); g.addColorStop(0.42, 'rgba(255,250,230,1)'); g.addColorStop(0.46, 'rgba(200,220,255,0.35)'); g.addColorStop(1, 'rgba(120,150,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); c.fillStyle = 'rgba(200,195,180,0.6)'; for (const [x, y, r] of [[110, 110, 12], [150, 140, 9], [120, 155, 7]]) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } }), fog: false, depthWrite: false })); moon.position.set(OUT_X - 60, 70, -160); moon.scale.setScalar(40); scene.add(moon);
  const guard = new Char({ outfit: 'soviet', hat: 'peakcap', expr: 'neutral', pose: 'stand' }, 1.9); guard.mesh.position.set(-2.4, 0, -7.2); ext.add(guard.mesh);

  // ===== SPACE =====
  const space = new THREE.Group(); space.position.set(SPACE_X, 0, 0); scene.add(space);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 96, 64), new THREE.MeshStandardMaterial({ map: earthTex(), roughness: 0.75 })); earth.rotation.y = -Math.PI * 0.62; earth.rotation.x = 0.35; space.add(earth);
  const clouds = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.012, 96, 64), new THREE.MeshStandardMaterial({ map: cloudTex(), transparent: true, roughness: 0.25, depthWrite: false })); clouds.rotation.copy(earth.rotation); space.add(clouds);
  const atmo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(120,180,255,0.0)', 'rgba(80,140,255,0)'), blending: THREE.AdditiveBlending, depthWrite: false }));
  const atmoTex = canvasTex(512, 512, (c) => { const g = c.createRadialGradient(256, 256, 190, 256, 256, 256); g.addColorStop(0, 'rgba(120,180,255,0)'); g.addColorStop(0.72, 'rgba(120,180,255,0.0)'); g.addColorStop(0.78, 'rgba(140,200,255,0.75)'); g.addColorStop(1, 'rgba(80,140,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 512, 512); });
  atmo.material.map = atmoTex; atmo.scale.setScalar(EARTH_R * 2.75); space.add(atmo);
  const sat = new THREE.Group(); space.add(sat);
  const foil = new THREE.MeshStandardMaterial({ color: 0xd8a840, metalness: 0.9, roughness: 0.35 });
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.4, 16), foil); body.rotation.z = Math.PI / 2; outline(body, 0.03); sat.add(body);
  const panelTex = canvasTex(256, 128, (c) => { c.fillStyle = '#1a2a6a'; c.fillRect(0, 0, 256, 128); c.strokeStyle = '#8ab0ff'; c.lineWidth = 2; for (let x = 0; x < 256; x += 21) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 128); c.stroke(); } for (let y = 0; y < 128; y += 21) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); } });
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 3.6), new THREE.MeshStandardMaterial({ map: panelTex, metalness: 0.6, roughness: 0.2 })); p.position.set(0, 0, s * 2.6); outline(p, 0.02); sat.add(p); }
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.6, 16), toon(0x2a2a2a)); lens.position.set(-1.5, 0, 0); lens.rotation.z = Math.PI / 2; sat.add(lens);
  sat.position.copy(SAT_POS).sub(space.position); sat.rotation.set(0.2, 0.6, -0.5);
  const glint = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,255,240,1)', 'rgba(255,240,200,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); glint.scale.setScalar(0.1); space.add(glint);
  const missiles = [];
  for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 1.4, 10), toon(0xe8e8e8)); outline(b, 0.03); g.add(b); const n = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.5, 10), toon(0x2a2a2a)); n.position.y = 0.95; g.add(n); const fl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,230,160,1)', 'rgba(255,120,30,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); fl.position.y = -1.0; fl.scale.set(0.9, 1.6, 1); g.add(fl); g.visible = false; space.add(g); missiles.push(g); }
  const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 40 * 3), 3));
  const trails = new THREE.LineSegments(trailGeo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); trails.frustumCulled = false; trails.visible = false; space.add(trails);

  return { scene, sky, hemi, sun, bunker, map, mapMat, sign, startOn, startOff, consoles, ops, redPhone, blackPhone, stack, tubes, tubeLights, beacons, redFill, hourPivot, minPivot, mapGlow, ext, dishes, masts, stars, moon, guard, space, earth, clouds, atmo, sat, glint, missiles, trails, crtTex };
}

export function latLonToVec(lon, lat, r, earth) {
  const phi = (90 - lat) * Math.PI / 180, th = (lon + 180) * Math.PI / 180;
  const v = new THREE.Vector3(-r * Math.sin(phi) * Math.cos(th), r * Math.cos(phi), r * Math.sin(phi) * Math.sin(th));
  return v.applyEuler(earth.rotation);
}
