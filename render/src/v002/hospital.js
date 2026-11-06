// Vienna General Hospital 1847: ward (+ ward next door), autopsy room, courtyard, modern scrub room.
import * as THREE from 'three';
import { toon, outline, box, hash, vnoise, skyDome, cloudSprite, glowTexture, blobShadow, canvasTex } from '../world.js';
import { Char } from '../chars.js';
import { normalTex, waterMaterial } from '../effects.js';

export const WARD = { x0: -5, x1: 5, zFront: 2, zBack: -40, h: 7 };
export const WARD2 = { zFront: -40.5, zBack: -70 };
export const YARD_X = -140;     // courtyard origin
export const OR_X = 70;         // modern scrub room origin
export const SUN_DIR = new THREE.Vector3(0.78, 0.55, -0.3).normalize();

// ---------- textures ----------
function planks(w = 1024, h = 1024) {
  const t = canvasTex(w, h, (c) => {
    const rows = 16; const rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -hash(r, 1) * 300;
      while (x < w) {
        const L = 220 + hash(r, x) * 260; const v = 0.82 + hash(x, r) * 0.25;
        c.fillStyle = `rgb(${150 * v | 0},${96 * v | 0},${58 * v | 0})`; c.fillRect(x, r * rh, L, rh);
        c.strokeStyle = 'rgba(60,35,20,0.25)'; c.lineWidth = 2;
        for (let g = 0; g < 5; g++) { c.beginPath(); const yy = r * rh + 6 + g * rh / 5; c.moveTo(x, yy); c.bezierCurveTo(x + L * 0.3, yy + 4, x + L * 0.6, yy - 4, x + L, yy + 2); c.stroke(); }
        c.fillStyle = 'rgba(30,18,10,0.9)'; c.fillRect(x, r * rh, 3, rh); x += L;
      }
      c.fillStyle = 'rgba(30,18,10,0.9)'; c.fillRect(0, r * rh, w, 3);
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function plaster(base = '#efe2c2', n = 1600) {
  const t = canvasTex(512, 512, (c) => { c.fillStyle = base; c.fillRect(0, 0, 512, 512); for (let i = 0; i < n; i++) { c.fillStyle = `rgba(120,90,50,${hash(i, 3) * 0.06})`; c.beginPath(); c.arc(hash(i, 1) * 512, hash(i, 2) * 512, 2 + hash(i, 4) * 14, 0, 7); c.fill(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function tiles(base, line, n = 8, jitter = 0.08) {
  const t = canvasTex(512, 512, (c) => { const s = 512 / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const v = 1 - jitter + hash(i, j) * jitter * 2; c.fillStyle = base; c.globalAlpha = 1; c.fillRect(i * s, j * s, s, s); c.fillStyle = `rgba(0,0,0,${(1 - v) * 1.5})`; c.fillRect(i * s, j * s, s, s); } c.strokeStyle = line; c.lineWidth = 4; for (let i = 0; i <= n; i++) { c.beginPath(); c.moveTo(i * s, 0); c.lineTo(i * s, 512); c.stroke(); c.beginPath(); c.moveTo(0, i * s); c.lineTo(512, i * s); c.stroke(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function cobbles() {
  const t = canvasTex(1024, 1024, (c) => { c.fillStyle = '#5a5248'; c.fillRect(0, 0, 1024, 1024); const s = 46; for (let j = 0; j < 1024 / s + 1; j++) for (let i = 0; i < 1024 / s + 1; i++) { const x = i * s + (j % 2) * s / 2, y = j * s; const v = 0.75 + hash(i, j) * 0.4; c.fillStyle = `rgb(${150 * v | 0},${140 * v | 0},${126 * v | 0})`; c.beginPath(); c.ellipse(x, y, s * 0.46, s * 0.42, hash(j, i), 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.ellipse(x - 6, y - 8, s * 0.2, s * 0.12, 0, 0, 7); c.fill(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}
function facadeTex(floors = 3, wins = 8, sign) {
  return canvasTex(1024, 512, (c) => {
    c.fillStyle = '#f2c94e'; c.fillRect(0, 0, 1024, 512);
    c.fillStyle = '#e3b43c'; c.fillRect(0, 0, 1024, 26); c.fillRect(0, 486, 1024, 26);
    for (let f = 0; f < floors; f++) { c.fillStyle = '#f6e7c0'; c.fillRect(0, 26 + f * (460 / floors) - 6, 1024, 10); }
    const fh = 460 / floors, ww = 1024 / wins;
    for (let f = 0; f < floors; f++) for (let i = 0; i < wins; i++) {
      const x = i * ww + ww * 0.28, y = 26 + f * fh + fh * 0.2, w = ww * 0.44, h = fh * 0.6;
      c.fillStyle = '#f8f1dc'; c.fillRect(x - 8, y - 14, w + 16, h + 22);
      c.fillStyle = '#3a4a5a'; c.fillRect(x, y, w, h);
      c.fillStyle = 'rgba(180,210,240,0.5)'; c.fillRect(x + 4, y + 4, w / 2 - 6, h / 2 - 6);
      c.strokeStyle = '#f8f1dc'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + w / 2, y); c.lineTo(x + w / 2, y + h); c.moveTo(x, y + h * 0.45); c.lineTo(x + w, y + h * 0.45); c.stroke();
      c.fillStyle = '#e8d6a8'; c.beginPath(); c.moveTo(x - 14, y - 14); c.lineTo(x + w / 2, y - 34); c.lineTo(x + w + 14, y - 14); c.fill();
    }
    if (sign) { c.fillStyle = '#f8f1dc'; c.fillRect(250, 6, 524, 50); c.fillStyle = '#5a3a1a'; c.font = '700 34px serif'; c.textAlign = 'center'; c.fillText(sign, 512, 44); }
  });
}

// ---------- props ----------
function bed(x, z, side) {
  const g = new THREE.Group(); const iron = toon(0x2f3a36, { roughness: 0.5, metalness: 0.4 });
  const L = 2.1, W = 1.0;
  const head = side * (L / 2); // head toward the wall
  for (const [dx, hgt] of [[head, 1.25], [-head, 0.85]]) {
    for (const dz of [-W / 2, W / 2]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, hgt, 8), iron); p.position.set(dx, hgt / 2, dz); p.castShadow = true; g.add(p); }
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, W, 8), iron); top.rotation.x = Math.PI / 2; top.position.set(dx, hgt, 0); g.add(top);
    for (let k = 1; k < 6; k++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, hgt - 0.55, 6), iron); b.position.set(dx, 0.55 + (hgt - 0.55) / 2, -W / 2 + k * W / 6); g.add(b); }
  }
  g.add(box(L, 0.08, W, 0x2f3a36, [0, 0.45, 0], 0));
  const matt = box(L - 0.1, 0.22, W - 0.06, 0xf4f1e8, [0, 0.6, 0], 0.02); matt.material.roughness = 0.95; g.add(matt);
  const blanket = box(L * 0.62, 0.16, W + 0.04, 0xd8e2ee, [-side * L * 0.17, 0.74, 0], 0.025); blanket.material.roughness = 0.95; g.add(blanket);
  const fold = box(0.18, 0.18, W + 0.06, 0xffffff, [side * (L * 0.14), 0.76, 0], 0.02); g.add(fold);
  const pillow = box(0.42, 0.16, W - 0.2, 0xffffff, [side * (L / 2 - 0.3), 0.78, 0], 0.025); pillow.rotation.z = -side * 0.25; g.add(pillow);
  g.position.set(x, 0, z); return g;
}
function nightstand(x, z) {
  const g = new THREE.Group(); g.add(box(0.5, 0.7, 0.45, 0x8a5a32, [0, 0.35, 0], 0.03));
  const jug = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.09, 0.02], [0.11, 0.12], [0.07, 0.24], [0.08, 0.3]].map(([a, b]) => new THREE.Vector2(a, b)), 12), toon(0xf4f6fa, { roughness: 0.3 }));
  jug.position.set(0.08, 0.7, 0); outline(jug, 0.012); g.add(jug);
  const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.09, 10), toon(0x6a8ac0)); cup.position.set(-0.12, 0.75, 0.05); g.add(cup);
  g.position.set(x, 0, z); return g;
}
function screen(x, z, rot) {
  const g = new THREE.Group();
  const cloth = toon(0xf2efe2, { roughness: 1, side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Group(); p.position.set((i - 1) * 0.62, 0, Math.abs(i - 1) * 0.12); p.rotation.y = (i - 1) * 0.35;
    p.add(box(0.6, 0.04, 0.04, 0x6a4a2a, [0, 1.75, 0], 0.01), box(0.6, 0.04, 0.04, 0x6a4a2a, [0, 0.2, 0], 0.01), box(0.04, 1.8, 0.04, 0x6a4a2a, [-0.3, 0.9, 0], 0.01), box(0.04, 1.8, 0.04, 0x6a4a2a, [0.3, 0.9, 0], 0.01));
    const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 1.5), cloth); cl.position.y = 0.97; cl.castShadow = true; p.add(cl); g.add(p);
  }
  g.position.set(x, 0, z); g.rotation.y = rot; return g;
}
function chandelier(x, z, y) {
  const g = new THREE.Group(); const brass = toon(0xc8a24a, { roughness: 0.35, metalness: 0.7 });
  g.add(box(0.03, 1.2, 0.03, 0x3a2a1a, [0, 0.6, 0], 0));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.04, 8, 24), brass); ring.rotation.x = Math.PI / 2; g.add(ring);
  const flame = glowTexture('rgba(255,220,150,1)', 'rgba(255,150,40,0)');
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; const c = box(0.05, 0.22, 0.05, 0xfff6e0, [Math.cos(a) * 0.6, 0.12, Math.sin(a) * 0.6], 0.008); g.add(c); const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flame, blending: THREE.AdditiveBlending, depthWrite: false })); f.position.set(Math.cos(a) * 0.6, 0.3, Math.sin(a) * 0.6); f.scale.setScalar(0.25); g.add(f); }
  g.position.set(x, y - 1.2, z); return g;
}
function crucifix(x, z, side) { const g = new THREE.Group(); g.add(box(0.06, 0.55, 0.04, 0x5a3a1a, [0, 0, 0], 0.01), box(0.32, 0.06, 0.04, 0x5a3a1a, [0, 0.1, 0], 0.01)); g.position.set(x, 3.1, z); g.rotation.y = side * Math.PI / 2; return g; }
function basinStation() {
  const g = new THREE.Group();
  g.add(box(1.4, 0.08, 0.7, 0x7a4a2a, [0, 0.9, 0], 0.025));
  for (const dx of [-0.62, 0.62]) for (const dz of [-0.28, 0.28]) g.add(box(0.06, 0.9, 0.06, 0x6a3a1a, [dx, 0.45, dz], 0.012));
  const porcelain = toon(0xf8f8fb, { roughness: 0.15 });
  const basin = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.18, 0.01], [0.3, 0.08], [0.36, 0.18], [0.38, 0.2]].map(([a, b]) => new THREE.Vector2(a, b)), 24), porcelain); basin.material.side = THREE.DoubleSide; basin.position.set(-0.2, 0.94, 0); outline(basin, 0.012); g.add(basin);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.018, 6, 30), toon(0x2f5aa8)); rim.rotation.x = Math.PI / 2; rim.position.set(-0.2, 1.14, 0); g.add(rim);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.33, 24), waterMaterial(0xcfe6d8, { opacity: 0.9 })); water.rotation.x = -Math.PI / 2; water.position.set(-0.2, 1.1, 0); g.add(water);
  const jug = new THREE.Mesh(new THREE.LatheGeometry([[0, 0], [0.12, 0.02], [0.15, 0.16], [0.09, 0.32], [0.11, 0.4]].map(([a, b]) => new THREE.Vector2(a, b)), 16), porcelain); jug.position.set(0.42, 0.94, 0.05); outline(jug, 0.012); g.add(jug);
  for (let k = 0; k < 3; k++) { const b = box(0.2, 0.05, 0.07, 0xb07a40, [0.25 + k * 0.08, 0.97, -0.22], 0.008); b.rotation.y = k * 0.4; g.add(b); }
  const easel = new THREE.Group(); easel.add(box(0.05, 1.9, 0.05, 0x5a3a1a, [-0.35, 0.95, 0], 0.01), box(0.05, 1.9, 0.05, 0x5a3a1a, [0.35, 0.95, 0], 0.01));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.62), toon(0xffffff, { map: canvasTex(450, 310, (c) => { c.fillStyle = '#f3ead2'; c.fillRect(0, 0, 450, 310); c.strokeStyle = '#3a2a1a'; c.lineWidth = 10; c.strokeRect(5, 5, 440, 300); c.fillStyle = '#7a1a1a'; c.font = '900 64px serif'; c.textAlign = 'center'; c.fillText('CHLORKALK', 225, 90); c.fillStyle = '#2a1a10'; c.font = 'italic 700 38px serif'; c.fillText('Hände waschen!', 225, 150); c.strokeStyle = '#2a1a10'; c.lineWidth = 6; for (const xx of [160, 290]) { c.beginPath(); c.ellipse(xx, 230, 34, 46, 0, 0, 7); c.stroke(); for (let f = 0; f < 4; f++) { c.beginPath(); c.moveTo(xx - 24 + f * 16, 190); c.lineTo(xx - 26 + f * 16, 160); c.stroke(); } } }) }));
  sign.position.set(0, 1.55, 0.03); easel.add(sign); easel.position.set(0.95, 0, -0.2); easel.rotation.y = -0.4; g.add(easel);
  return g;
}
export function chartTexture(progress) {
  return canvasTex(640, 460, (c) => {
    c.fillStyle = '#26332c'; c.fillRect(0, 0, 640, 460); c.strokeStyle = '#7a5530'; c.lineWidth = 22; c.strokeRect(0, 0, 640, 460);
    c.strokeStyle = 'rgba(240,240,230,0.9)'; c.fillStyle = 'rgba(240,240,230,0.92)'; c.lineWidth = 5; c.lineCap = 'round';
    c.font = '700 34px serif'; c.textAlign = 'left'; c.fillText('Todesfälle – I. Klinik', 40, 62);
    c.beginPath(); c.moveTo(70, 90); c.lineTo(70, 400); c.lineTo(600, 400); c.stroke();
    c.font = '600 24px serif'; c.fillText('10%', 14, 120); c.fillText('1%', 26, 390);
    const pts = [[90, 120], [150, 104], [210, 132], [270, 110], [330, 330], [390, 372], [450, 382], [510, 378], [570, 384]];
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep']; c.font = '600 20px serif';
    months.forEach((m, i) => c.fillText(m, pts[i][0] - 18, 430));
    c.lineWidth = 7; c.beginPath(); c.moveTo(...pts[0]);
    const n = progress * (pts.length - 1);
    for (let i = 1; i <= Math.floor(n); i++) c.lineTo(...pts[i]);
    const f = n - Math.floor(n); if (f > 0 && Math.floor(n) + 1 < pts.length) { const a = pts[Math.floor(n)], b = pts[Math.floor(n) + 1]; c.lineTo(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f); }
    c.stroke();
    if (progress > 0.45) { c.strokeStyle = 'rgba(255,220,120,0.95)'; c.lineWidth = 4; c.setLineDash([10, 10]); c.beginPath(); c.moveTo(330, 80); c.lineTo(330, 400); c.stroke(); c.setLineDash([]); c.fillStyle = 'rgba(255,220,120,0.95)'; c.font = '700 22px serif'; c.fillText('Chlorkalk', 300, 80); }
  });
}
function portraitTexture(charCanvas) {
  return canvasTex(512, 640, (c) => {
    const g = c.createRadialGradient(256, 260, 40, 256, 320, 420); g.addColorStop(0, '#6a5030'); g.addColorStop(1, '#1a120a'); c.fillStyle = g; c.fillRect(0, 0, 512, 640);
    c.drawImage(charCanvas, 0, 0, 512, 768, -40, 20, 592, 888);
    c.globalCompositeOperation = 'multiply'; c.fillStyle = '#e8c890'; c.fillRect(0, 0, 512, 640);
    c.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 3000; i++) { c.fillStyle = `rgba(${hash(i, 1) > 0.5 ? '255,240,200' : '40,25,10'},${hash(i, 2) * 0.06})`; c.fillRect(hash(i, 3) * 512, hash(i, 4) * 640, 6, 2); }
    c.fillStyle = '#3a2a14'; c.fillRect(150, 560, 212, 46); c.fillStyle = '#e8c86a'; c.font = '700 24px serif'; c.textAlign = 'center'; c.fillText('I. SEMMELWEIS', 256, 590);
  });
}
function lightBeam(from, len, w, d, op) {
  const tex = canvasTex(64, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(255,240,210,0.9)'); g.addColorStop(1, 'rgba(255,240,210,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); });
  const geo = new THREE.BoxGeometry(w, len, d); geo.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
  m.position.copy(from);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), SUN_DIR.clone());
  return m;
}
function horseSprite() {
  const tex = canvasTex(700, 520, (c) => {
    const INK = '#151012'; c.lineWidth = 10; c.strokeStyle = INK; c.lineJoin = 'round';
    for (const x of [200, 250, 460, 510]) { c.beginPath(); c.moveTo(x, 330); c.lineTo(x + (x % 3) * 6, 500); c.stroke(); }
    c.beginPath(); c.roundRect(150, 200, 420, 150, 75); c.fillStyle = '#7a4a2a'; c.fill(); c.stroke();
    c.beginPath(); c.moveTo(520, 230); c.lineTo(590, 90); c.lineTo(660, 110); c.lineTo(680, 170); c.lineTo(600, 190); c.lineTo(570, 260); c.closePath(); c.fillStyle = '#7a4a2a'; c.fill(); c.stroke();
    c.fillStyle = '#2a1a10'; c.beginPath(); c.moveTo(540, 220); c.lineTo(585, 95); c.lineTo(600, 100); c.lineTo(570, 230); c.fill();
    c.fillStyle = INK; c.beginPath(); c.arc(625, 125, 8, 0, 7); c.fill();
    c.beginPath(); c.moveTo(150, 230); c.quadraticCurveTo(100, 280, 120, 360); c.lineWidth = 18; c.strokeStyle = '#2a1a10'; c.stroke();
    c.lineWidth = 8; c.strokeStyle = '#3a2a1a'; c.beginPath(); c.moveTo(560, 210); c.lineTo(320, 230); c.stroke();
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 2.1), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.geometry.translate(0, 1.05, 0); return m;
}
function carriage() {
  const g = new THREE.Group();
  g.add(box(1.6, 1.1, 2.2, 0x2a2a3a, [0, 1.35, 0], 0.04), box(1.7, 0.12, 2.4, 0x6a3a1a, [0, 0.8, 0], 0.03), box(1.4, 0.4, 0.05, 0xd8c070, [0, 1.6, 1.11], 0.01));
  for (const [dz, r] of [[0.8, 0.55], [-0.8, 0.65]]) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 6, 20), toon(0x8a2a1a)); w.rotation.y = Math.PI / 2; w.position.set(s * 0.88, r, dz); g.add(w); for (let k = 0; k < 4; k++) { const sp = box(0.03, r * 2, 0.03, 0x8a2a1a, [s * 0.88, r, dz], 0); sp.rotation.x = k * Math.PI / 4; g.add(sp); } }
  return g;
}
function gasLamp(x, z) { const g = new THREE.Group(); g.add(box(0.12, 3.2, 0.12, 0x2a2a2a, [0, 1.6, 0], 0.02)); const l = box(0.4, 0.5, 0.4, 0x2a2a2a, [0, 3.4, 0], 0.02); g.add(l); g.add(box(0.32, 0.38, 0.32, 0xfff2c0, [0, 3.4, 0], 0, new THREE.MeshBasicMaterial({ color: 0xfff2c0 }))); g.position.set(x, 0, z); return g; }
function stephansdom() {
  const g = new THREE.Group(); const stone = toon(0xcdbb98); const dark = toon(0x8a7a60);
  const nave = new THREE.Mesh(new THREE.BoxGeometry(18, 22, 60), stone); nave.position.set(0, 11, 0); outline(nave, 0.3); g.add(nave);
  const roofTex = canvasTex(256, 256, (c) => { const cols = ['#e8b63c', '#2a6a4a', '#f4f0e0', '#2a3a6a']; for (let j = 0; j < 16; j++) for (let i = 0; i < 16; i++) { c.fillStyle = cols[((i + j) >> 1) % 4]; c.beginPath(); c.moveTo(i * 16, j * 16 + 8); c.lineTo(i * 16 + 8, j * 16); c.lineTo(i * 16 + 16, j * 16 + 8); c.lineTo(i * 16 + 8, j * 16 + 16); c.fill(); } });
  roofTex.wrapS = roofTex.wrapT = THREE.RepeatWrapping; roofTex.repeat.set(3, 4);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 13, 18, 4, 1), toon(0xffffff, { map: roofTex })); roof.rotation.y = Math.PI / 4; roof.scale.set(1, 1, 3.2); roof.position.set(0, 31, 0); g.add(roof);
  let y = 0; const tiers = [[12, 40], [10, 26], [8, 18], [6, 14], [4.5, 10]];
  for (const [w, h] of tiers) { const t = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), stone); t.position.set(0, y + h / 2, 34); outline(t, 0.25); g.add(t); y += h; }
  const spire = new THREE.Mesh(new THREE.ConeGeometry(3.2, 34, 8), dark); spire.position.set(0, y + 17, 34); outline(spire, 0.25); g.add(spire);
  return g;
}
function germCanvas(v) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const INK = '#151012'; x.lineWidth = 9; x.strokeStyle = INK; x.lineJoin = 'round';
  x.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * Math.PI * 2; const r = i % 2 ? 78 : 98; x.lineTo(128 + Math.cos(a) * r, 128 + Math.sin(a) * r); } x.closePath();
  x.fillStyle = ['#7ac943', '#5cb85c', '#9ad04a'][v % 3]; x.fill(); x.stroke();
  x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.ellipse(100, 92, 26, 14, -0.5, 0, 7); x.fill();
  for (const ex of [100, 156]) { x.fillStyle = '#fff'; x.beginPath(); x.arc(ex, 116, 18, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(ex + 4, 120, 8, 0, 7); x.fill(); }
  x.lineWidth = 9; x.beginPath(); x.moveTo(80, 92); x.lineTo(116, 104); x.moveTo(176, 92); x.lineTo(140, 104); x.stroke();
  x.beginPath(); x.moveTo(92, 158); x.quadraticCurveTo(128, 196, 166, 156); x.closePath(); x.fillStyle = '#7a1f1f'; x.fill(); x.stroke();
  x.fillStyle = '#fff'; x.fillRect(104, 160, 12, 10); x.fillRect(138, 160, 12, 10);
  return c;
}

// ---------- the world ----------
export function buildHospital() {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xdfe9f2, 60, 420);
  const sky = skyDome(0x3f7fd8, 0xd8ecff, 0xd8ecff); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xe6f0ff, 0xb08a5a, 0.5); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d6, 4.2);
  sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -26, right: 26, top: 26, bottom: -26, near: 1, far: 260 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.userData.dir = SUN_DIR.clone(); scene.add(sun, sun.target);

  // ===== WARD =====
  const ward = new THREE.Group(); scene.add(ward);
  const floorTex = planks(); floorTex.repeat.set(2.5, 10);
  const floorMat = toon(0xffffff, { map: floorTex, roughness: 0.55, envMapIntensity: 0.6 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 74), floorMat); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -34); floor.receiveShadow = true; ward.add(floor);
  const pTex = plaster(); pTex.repeat.set(6, 2);
  const wallMat = toon(0xffffff, { map: pTex, roughness: 0.95 });
  const wainMat = toon(0x6a4226, { roughness: 0.6 });
  const W = WARD;
  const addWall = (w, h, d, x, y, z, mat = wallMat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; ward.add(m); return m; };
  // left wall (solid) for ward + ward2
  addWall(0.4, W.h, 74, W.x0 - 0.2, W.h / 2, -34);
  addWall(0.08, 1.2, 74, W.x0 + 0.04, 0.6, -34, wainMat);
  // right wall with window openings (sunlight comes through)
  const winZ = []; for (let z = -2; z > -70; z -= 4) winZ.push(z);
  addWall(0.4, 1.6, 74, W.x1 + 0.2, 0.8, -34); addWall(0.4, 1.4, 74, W.x1 + 0.2, W.h - 0.7, -34);
  addWall(0.08, 1.2, 74, W.x1 - 0.04, 0.6, -34, wainMat);
  const glassMat = new THREE.MeshBasicMaterial({ color: 0xe8f4ff, transparent: true, opacity: 0.18, depthWrite: false });
  const frameMat = toon(0xf4efe2, { roughness: 0.7 });
  for (let i = 0; i <= winZ.length; i++) { const zA = i === 0 ? 3 : winZ[i - 1] - 0.9, zB = i < winZ.length ? winZ[i] + 0.9 : -71; if (zA > zB) addWall(0.4, W.h - 3.0, zA - zB, W.x1 + 0.2, 1.6 + (W.h - 3.0) / 2, (zA + zB) / 2); }
  for (const z of winZ) {
    const g = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 4.0), glassMat); g.rotation.y = -Math.PI / 2; g.position.set(W.x1 + 0.1, 3.6, z); ward.add(g);
    for (const [w, h, y, zz] of [[0.08, 4.0, 3.6, z], [0.08, 0.08, 3.0, z], [0.08, 0.08, 4.4, z]]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.08, h, h === 4.0 ? 0.08 : 1.8), frameMat); f.position.set(W.x1 + 0.1, y, zz); f.castShadow = true; ward.add(f); }
  }
  // ceiling + beams
  addWall(10.6, 0.3, 74, 0, W.h + 0.15, -34, toon(0xf4ead2));
  for (let z = 0; z > -70; z -= 4) { const b = box(10, 0.3, 0.3, 0x7a5030, [0, W.h - 0.15, z], 0.02); ward.add(b); }
  // entrance wall with doorway (to autopsy corridor) and wall between wards with double door
  const doorWall = (z, doorW, doorH) => {
    const side = (W.x1 - W.x0 - doorW) / 2;
    addWall(side, W.h, 0.4, W.x0 + side / 2, W.h / 2, z); addWall(side, W.h, 0.4, W.x1 - side / 2, W.h / 2, z);
    addWall(doorW, W.h - doorH, 0.4, 0, doorH + (W.h - doorH) / 2, z);
    for (const s of [-1, 1]) ward.add(box(0.16, doorH, 0.5, 0x6a4226, [s * (doorW / 2 + 0.08), doorH / 2, z], 0.02));
    ward.add(box(doorW + 0.5, 0.18, 0.5, 0x6a4226, [0, doorH + 0.09, z], 0.02));
  };
  doorWall(W.zFront, 2.0, 3.0); doorWall(W.zBack, 2.6, 3.6); addWall(10.8, W.h, 0.4, 0, W.h / 2, -70.2);
  const doorLeaf = box(1.25, 3.5, 0.08, 0x7a4a2a, [-1.9, 1.75, W.zBack - 0.3], 0.02); doorLeaf.rotation.y = 1.2; ward.add(doorLeaf);
  // beds, mothers, nightstands, screens
  const mothers = [], mothers2 = [];
  const hairs = ['#6a3a1a', '#2a1a10', '#a0682a', '#3a2010', '#8a5a2a', '#c8902a'];
  const bedZ = []; for (let z = -4.5; z > -38; z -= 4) bedZ.push(z);
  bedZ.forEach((z, i) => {
    for (const s of [-1, 1]) {
      ward.add(bed(s * 3.75, z, s));
      const m = new Char({ outfit: 'patient', hair: 'long', hairColor: hairs[(i * 2 + (s > 0 ? 1 : 0)) % 6], blush: true, expr: 'sad', pose: 'sit', sweat: true }, 1.45);
      m.base = new THREE.Vector3(s * 4.35, 0.42, z); m.mesh.position.copy(m.base); ward.add(m.mesh); mothers.push(m);
      if (i % 2 === 0) ward.add(nightstand(s * 4.6, z - 1.6));
    }
  });
  ward.add(screen(-3.2, -15, 0.3), screen(3.3, -27, -0.4));
  for (let i = 0; i < bedZ.length; i += 2) ward.add(crucifix(W.x0 + 0.05, bedZ[i] - 2, 1));
  for (let z = -6; z > -40; z -= 10) ward.add(chandelier(0, z, W.h));
  // ward next door (midwives) - brighter, healthy mothers with babies
  for (let z = -45; z > -68; z -= 4) for (const s of [-1, 1]) {
    ward.add(bed(s * 3.75, z, s));
    const m = new Char({ outfit: 'patient', hair: 'long', hairColor: hairs[Math.abs(z) % 6], blush: true, expr: 'happy', pose: 'baby' }, 1.45);
    m.mesh.position.set(s * 4.35, 0.42, z); ward.add(m.mesh); mothers2.push(m);
  }
  const midwives = [new Char({ outfit: 'nurse', hat: 'nursecap', blush: true, expr: 'happy', pose: 'stand', dress: '#5a7a4a' }, 1.85), new Char({ outfit: 'nurse', hat: 'nursecap', blush: true, expr: 'happy', pose: 'hold', dress: '#5a7a4a' }, 1.85)];
  midwives[0].mesh.position.set(-1.2, 0, -50); midwives[1].mesh.position.set(1.4, 0, -57); midwives.forEach((m) => ward.add(m.mesh));
  // nurses in ward 1
  const nurses = [new Char({ outfit: 'nurse', hat: 'nursecap', blush: true, expr: 'sad', pose: 'stand' }, 1.85), new Char({ outfit: 'nurse', hat: 'nursecap', blush: true, expr: 'sad', pose: 'hold' }, 1.85), new Char({ outfit: 'nurse', hat: 'nursecap', blush: true, expr: 'sad', pose: 'stand', dress: '#5a4a8a' }, 1.85)];
  nurses[0].mesh.position.set(-2.3, 0, -9.5); nurses[1].mesh.position.set(2.4, 0, -17); nurses[2].mesh.position.set(-2.2, 0, -26); nurses.forEach((m) => ward.add(m.mesh));
  // window light beams + dust
  const beams = [];
  for (const z of winZ) { const b = lightBeam(new THREE.Vector3(W.x1 + 0.1, 3.6, z), 7.5, 0.1, 1.6, 0.11); b.scale.x = 14; ward.add(b); beams.push(b); }
  const dustPts = []; for (let i = 0; i < 900; i++) dustPts.push(new THREE.Vector3((hash(i, 1) - 0.5) * 9, hash(i, 2) * 6.5, -hash(i, 3) * 68));
  const dust = new THREE.Points(new THREE.BufferGeometry().setFromPoints(dustPts), new THREE.PointsMaterial({ color: 0xfff2d0, size: 0.035, transparent: true, opacity: 0.8, depthWrite: false })); ward.add(dust);
  // wash station, chalkboard, portrait
  const station = basinStation(); station.position.set(2.6, 0, -1.2); station.rotation.y = -Math.PI / 2 + 0.25; ward.add(station);
  const boardG = new THREE.Group(); boardG.add(box(0.06, 2.4, 0.06, 0x5a3a1a, [-0.6, 1.2, 0], 0.01), box(0.06, 2.4, 0.06, 0x5a3a1a, [0.6, 1.2, 0], 0.01));
  const chartSteps = Array.from({ length: 25 }, (_, i) => chartTexture(i / 24));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.15), new THREE.MeshStandardMaterial({ map: chartSteps[0], roughness: 0.9 })); board.position.set(0, 1.55, 0.04); boardG.add(board);
  boardG.position.set(-2.5, 0, -2.2); boardG.rotation.y = 0.5; ward.add(boardG);
  const frame = new THREE.Group();
  frame.add(box(1.75, 2.15, 0.1, 0xc8a24a, [0, 0, 0], 0.02)); frame.children[0].material.metalness = 0.7; frame.children[0].material.roughness = 0.3;
  const portrait = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.82), new THREE.MeshStandardMaterial({ roughness: 0.6 })); portrait.position.z = 0.06; frame.add(portrait);
  frame.position.set(W.x0 + 0.08, 3.4, -0.6); frame.rotation.y = Math.PI / 2; ward.add(frame);
  const portraitLamp = new THREE.PointLight(0xffd9a0, 6, 6, 1.5); portraitLamp.position.set(W.x0 + 1.6, 4.6, -0.6); ward.add(portraitLamp);

  // ===== AUTOPSY ROOM (behind the entrance, z 2..14) =====
  const aut = new THREE.Group(); scene.add(aut);
  const aTile = tiles('#8fa59a', '#4a5a52', 6); aTile.repeat.set(4, 2);
  const aWall = toon(0xffffff, { map: aTile, roughness: 0.4 });
  const aFloor = tiles('#6a6a64', '#3a3a36', 8); aFloor.repeat.set(4, 5);
  const af = new THREE.Mesh(new THREE.PlaneGeometry(10.2, 12.4), toon(0xffffff, { map: aFloor, roughness: 0.5 })); af.rotation.x = -Math.PI / 2; af.position.set(0, 0.005, 8.2); af.receiveShadow = true; aut.add(af);
  for (const [w, h, d, x, y, z] of [[0.4, 6, 12.4, W.x0 - 0.2, 3, 8.2], [0.4, 6, 12.4, W.x1 + 0.2, 3, 8.2], [10.8, 6, 0.4, 0, 3, 14.6], [10.6, 0.3, 12.6, 0, 6.15, 8.2]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), aWall); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; aut.add(m); }
  const slab = box(2.4, 0.2, 1.1, 0xb8b8b0, [0, 1.0, 8.5], 0.03); slab.material.roughness = 0.35; aut.add(slab);
  aut.add(box(0.5, 0.9, 0.5, 0x8a8a84, [-0.8, 0.45, 8.5], 0.02), box(0.5, 0.9, 0.5, 0x8a8a84, [0.8, 0.45, 8.5], 0.02));
  const sheet = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.5, 6, 12), toon(0xf2f2ea, { roughness: 1 })); sheet.rotation.z = Math.PI / 2; sheet.scale.set(1, 1, 0.75); sheet.position.set(0, 1.25, 8.5); outline(sheet, 0.02); aut.add(sheet);
  const tray = box(0.7, 0.04, 0.4, 0xc8ccd2, [1.6, 1.05, 7.6], 0.01); tray.material.metalness = 0.8; tray.material.roughness = 0.3; aut.add(tray, box(0.6, 1.0, 0.4, 0x5a4a3a, [1.6, 0.5, 7.6], 0.02));
  for (let k = 0; k < 5; k++) { const ins = box(0.05, 0.02, 0.26, 0xe0e4ea, [1.38 + k * 0.1, 1.08, 7.6], 0); ins.material.metalness = 0.9; aut.add(ins); }
  const shelf = new THREE.Group(); for (let r = 0; r < 3; r++) { shelf.add(box(2.6, 0.06, 0.4, 0x5a3a1a, [0, 1.2 + r * 0.7, 0], 0.01)); for (let k = 0; k < 6; k++) { const j = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.32, 12), new THREE.MeshStandardMaterial({ color: [0x9ac87a, 0xc8b86a, 0x7ab0a8][k % 3], transparent: true, opacity: 0.75, roughness: 0.1 })); j.position.set(-1.1 + k * 0.44, 1.4 + r * 0.7, 0); shelf.add(j); } }
  shelf.position.set(W.x0 + 0.4, 0, 9.5); shelf.rotation.y = Math.PI / 2; aut.add(shelf);
  const coldLight = new THREE.SpotLight(0xbfd8ff, 60, 18, 0.7, 0.6, 1.2); coldLight.position.set(3.5, 5.6, 12); coldLight.target.position.set(0, 1, 8.5); coldLight.castShadow = true; coldLight.shadow.mapSize.set(1024, 1024); aut.add(coldLight, coldLight.target);
  const warmLamp = new THREE.PointLight(0xffc880, 8, 7, 1.5); warmLamp.position.set(0, 3.2, 8.5); aut.add(warmLamp);
  aut.add(box(0.06, 2.4, 0.06, 0x2a2a2a, [0, 4.6, 8.5], 0));
  const lampShade = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.35, 16, 1, true), toon(0x2f4a3a, { side: THREE.DoubleSide })); lampShade.position.set(0, 3.35, 8.5); aut.add(lampShade);

  // ===== COURTYARD =====
  const yard = new THREE.Group(); yard.position.x = YARD_X; scene.add(yard);
  const cTex = cobbles(); cTex.repeat.set(12, 12);
  const yf = new THREE.Mesh(new THREE.PlaneGeometry(120, 160), toon(0xffffff, { map: cTex, roughness: 0.85 })); yf.rotation.x = -Math.PI / 2; yf.position.set(0, 0, -30); yf.receiveShadow = true; yard.add(yf);
  const fac = (w, h, x, z, ry, sign) => { const t = facadeTex(3, Math.round(w / 3.4), sign); const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, 4), [toon(0xf2c94e), toon(0xf2c94e), toon(0xc0583a), toon(0xf2c94e), toon(0xffffff, { map: t }), toon(0xffffff, { map: t })]); m.position.set(x, h / 2, z); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; outline(m, 0.08); yard.add(m); const roof = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 1.6, 4.6), toon(0xb8532f)); roof.position.set(x, h + 0.6, z); roof.rotation.y = ry; roof.rotation.x = 0; yard.add(roof); };
  fac(44, 14, 0, -34, 0, 'K. K. ALLGEMEINES KRANKENHAUS'); fac(40, 14, -24, -12, Math.PI / 2); fac(40, 14, 24, -12, -Math.PI / 2);
  yard.add(box(4, 5, 0.6, 0x5a3a1a, [0, 2.5, -31.7], 0.03));
  for (const [x, z] of [[-8, -6], [8, -6], [-8, -22], [8, -22]]) yard.add(gasLamp(x, z));
  const car = carriage(); car.position.set(-4, 0, -14); car.rotation.y = 0.5; yard.add(car);
  const horse = horseSprite(); horse.position.set(-2.4, 0, -11.6); yard.add(horse);
  for (let i = 0; i < 4; i++) { const tr = new THREE.Group(); const t = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.28, 3, 8), toon(0x6a4a2a)); t.position.y = 1.5; tr.add(t); const c = new THREE.Mesh(new THREE.SphereGeometry(1.8, 14, 10), toon(0x4f8a3a)); c.position.y = 4; c.scale.y = 1.15; outline(c, 0.06); c.castShadow = true; tr.add(c); tr.position.set(i < 2 ? -14 : 14, 0, -6 - (i % 2) * 14); yard.add(tr); }
  const dom = stephansdom(); dom.position.set(14, 0, -125); dom.rotation.y = 0.4; dom.scale.setScalar(0.8); yard.add(dom);
  for (let i = 0; i < 12; i++) { const c = cloudSprite(i, 18 + hash(i, 9) * 14); c.position.set((hash(i, 1) - 0.5) * 300, 70 + hash(i, 2) * 50, -150 - hash(i, 3) * 150); yard.add(c); }
  const passers = [];
  const pSpecs = [{ outfit: 'dress', hat: 'bonnet', hair: 'bun', blush: true, expr: 'happy', pose: 'walk1', dress: '#5a7ab0' }, { outfit: 'frock', hat: 'tophat', mustache: true, expr: 'neutral', pose: 'walk1', coat: '#3a2a20' }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', blush: true, expr: 'neutral', pose: 'walk2', dress: '#b85a7a', flower: '#f2d24a' }, { outfit: 'frock', hat: 'tophat', hatColor: '#4a4a58', expr: 'happy', pose: 'walk2' }, { outfit: 'nurse', hat: 'nursecap', blush: true, expr: 'neutral', pose: 'walk1' }, { outfit: 'dress', hat: 'bonnet', hair: 'bun', blush: true, expr: 'happy', pose: 'walk1', dress: '#7a9a5a' }];
  pSpecs.forEach((s, i) => { const c = new Char(s, 1.85); c.base = new THREE.Vector3(-9 + i * 3.4, 0, -10 - (i % 3) * 5); c.dir = i % 2 ? 1 : -1; c.phase = i; yard.add(c.mesh); passers.push(c); const sh = blobShadow(0.5, 0.25); c.shadow = sh; yard.add(sh); });
  const pigeonTex = canvasTex(128, 96, (c) => { c.fillStyle = '#8a8f9a'; c.strokeStyle = '#151012'; c.lineWidth = 6; c.beginPath(); c.ellipse(60, 56, 40, 24, 0, 0, 7); c.fill(); c.stroke(); c.beginPath(); c.arc(96, 36, 16, 0, 7); c.fill(); c.stroke(); c.fillStyle = '#e8a040'; c.beginPath(); c.moveTo(110, 36); c.lineTo(124, 40); c.lineTo(110, 44); c.fill(); c.fillStyle = '#151012'; c.beginPath(); c.arc(100, 32, 3, 0, 7); c.fill(); c.strokeStyle = '#151012'; c.beginPath(); c.moveTo(55, 78); c.lineTo(50, 94); c.moveTo(70, 78); c.lineTo(72, 94); c.stroke(); });
  const pigeons = []; for (let i = 0; i < 10; i++) { const p = new THREE.Sprite(new THREE.SpriteMaterial({ map: pigeonTex })); p.scale.set(0.45, 0.34, 1); p.userData = { x: (hash(i, 1) - 0.5) * 8, z: -2 - hash(i, 2) * 8, p: hash(i, 3) * 6 }; yard.add(p); pigeons.push(p); }

  // ===== MODERN SCRUB ROOM =====
  const orr = new THREE.Group(); orr.position.x = OR_X; scene.add(orr);
  const wt = tiles('#e8f4f2', '#b8d0cc', 10, 0.03); wt.repeat.set(3, 2);
  const ow = toon(0xffffff, { map: wt, roughness: 0.25 });
  for (const [w, h, d, x, y, z] of [[12, 0.2, 12, 0, -0.1, 0], [12, 0.2, 12, 0, 4.1, 0], [12, 4.2, 0.3, 0, 2, -3], [0.3, 4.2, 12, -6, 2, 0], [0.3, 4.2, 12, 6, 2, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), y < 0 ? toon(0x9fb8c0, { roughness: 0.3 }) : ow); m.position.set(x, y, z); m.receiveShadow = true; orr.add(m); }
  const steel = new THREE.MeshStandardMaterial({ color: 0xd8dde2, metalness: 0.9, roughness: 0.25 });
  const trough = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.5, 0.8), steel); trough.position.set(0, 1.05, -2.4); trough.castShadow = true; outline(trough, 0.02); orr.add(trough);
  const inner = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.6), new THREE.MeshStandardMaterial({ color: 0x9aa4ac, metalness: 0.9, roughness: 0.3 })); inner.position.set(0, 1.25, -2.4); orr.add(inner);
  { const fr = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.9, 0.05), steel); fr.position.set(0, 0.45, -2.0); orr.add(fr); }
  const streams = [];
  for (const x of [-1.1, 0, 1.1]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 10), steel); f.position.set(x, 1.85, -2.7); orr.add(f); const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.35, 10), steel); sp.rotation.x = Math.PI / 2; sp.position.set(x, 2.08, -2.55); orr.add(sp); const st = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.022, 0.78, 10), waterMaterial(0xdff2ff, { opacity: 0.8 })); st.position.set(x, 1.68, -2.4); orr.add(st); streams.push(st); }
  const lampArm = box(0.1, 0.1, 2.4, 0xe0e4e8, [1.8, 3.8, -0.8], 0.01); orr.add(lampArm);
  const surgLamp = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 0.25, 24), toon(0xe8ecf0, { roughness: 0.3 })); surgLamp.position.set(1.8, 3.6, 0.3); orr.add(surgLamp);
  const lampGlow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 24), new THREE.MeshBasicMaterial({ color: 0xffffff })); lampGlow.rotation.x = Math.PI / 2; lampGlow.position.set(1.8, 3.47, 0.3); orr.add(lampGlow);
  const orLight = new THREE.PointLight(0xeaf6ff, 30, 14, 1.2); orLight.position.set(0, 3.6, 0.5); orr.add(orLight);
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), toon(0xffffff, { map: canvasTex(330, 420, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 330, 420); c.fillStyle = '#2f8c79'; c.fillRect(0, 0, 330, 70); c.fillStyle = '#fff'; c.font = '900 40px Montserrat'; c.textAlign = 'center'; c.fillText('SCRUB IN', 165, 50); c.fillStyle = '#2a2a2a'; c.font = '700 26px Montserrat'; ['1. Wet', '2. Soap', '3. Scrub 20 s', '4. Rinse', '5. Dry'].forEach((t, i) => c.fillText(t, 165, 130 + i * 56)); }) }));
  poster.position.set(-2.6, 2.6, -2.84); orr.add(poster);
  const surgeon = new Char({ outfit: 'scrubs', hat: 'surgcap', mustache: true, hair: 'receding', hairColor: '#4a2e1a', expr: 'neutral', pose: 'scrub', foam: true }, 1.95);
  surgeon.mesh.position.set(0.1, 0, -1.6); orr.add(surgeon.mesh);
  const nurse2 = new Char({ outfit: 'scrubs', hat: 'surgcap', hatColor: '#3a7ab0', mask: true, expr: 'happy', pose: 'stand', blush: true }, 1.85); nurse2.mesh.position.set(-1.9, 0, -1.2); orr.add(nurse2.mesh);

  // ---------- germs ----------
  const germTex = [0, 1, 2].map((v) => { const t = new THREE.CanvasTexture(germCanvas(v)); t.colorSpace = THREE.SRGBColorSpace; return t; });
  const germs = [];
  for (let i = 0; i < 160; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: germTex[i % 3], depthWrite: false })); s.visible = false; s.renderOrder = 5; scene.add(s); germs.push(s); }

  return { scene, sky, hemi, sun, ward, floorMat, mothers, mothers2, nurses, midwives, beams, dust, station, board, chartSteps, frame, portrait, portraitTexture, aut, yard, passers, pigeons, horse, orr, surgeon, nurse2, streams, germs };
}
