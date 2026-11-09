// Wild West 1871: main street, gold mine, tailor shop, modern jeans close-up; horses + pants for the tug test.
import * as THREE from 'three';
import { toon, outline, box, hash, vnoise, skyDome, cloudSprite, glowTexture, canvasTex, blobShadow } from '../world.js';

export const MINE_X = 200, SHOP_X = -200, JEANS_X = 400;

function planksTex(base = '#9a6a3a', w = 256, h = 256, vertical = true, rep = [1, 1]) {
  const t = canvasTex(w, h, (c) => { c.fillStyle = base; c.fillRect(0, 0, w, h); for (let i = 0; i < 10; i++) { const v = 0.85 + hash(i, 3) * 0.3; c.fillStyle = `rgba(${v > 1 ? '255,240,220' : '40,20,10'},${Math.abs(1 - v) * 0.6})`; if (vertical) c.fillRect(i * w / 10, 0, w / 10, h); else c.fillRect(0, i * h / 10, w, h / 10); } c.strokeStyle = 'rgba(40,20,10,0.6)'; c.lineWidth = 3; for (let i = 0; i <= 10; i++) { c.beginPath(); if (vertical) { c.moveTo(i * w / 10, 0); c.lineTo(i * w / 10, h); } else { c.moveTo(0, i * h / 10); c.lineTo(w, i * h / 10); } c.stroke(); } for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(40,20,10,0.5)'; c.beginPath(); c.arc(hash(i, 1) * w, hash(i, 2) * h, 2, 0, 7); c.fill(); } });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep); return t;
}
function facade(sign, color, signCol = '#f4e6c0', w = 7, h = 7.5) {
  const g = new THREE.Group();
  const wood = toon(0xffffff, { map: planksTex(color, 256, 256, true, [2, 2]), roughness: 0.9 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, 5, 8), wood); body.position.set(0, 2.5, -4); body.castShadow = body.receiveShadow = true; outline(body, 0.06); g.add(body);
  const front = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, h, 0.3), wood); front.position.set(0, h / 2, 0.1); front.castShadow = true; outline(front, 0.06); g.add(front);
  const signM = new THREE.Mesh(new THREE.PlaneGeometry(w - 1, 1.2), new THREE.MeshStandardMaterial({ map: canvasTex(600, 120, (c) => { c.fillStyle = signCol; c.fillRect(0, 0, 600, 120); c.strokeStyle = '#3a2410'; c.lineWidth = 10; c.strokeRect(5, 5, 590, 110); c.fillStyle = '#3a2410'; c.font = '900 64px serif'; c.textAlign = 'center'; c.fillText(sign, 300, 84); }), roughness: 0.8 })); signM.position.set(0, h - 1.2, 0.27); g.add(signM);
  const winTex = canvasTex(128, 160, (c) => { c.fillStyle = '#2a3a4a'; c.fillRect(0, 0, 128, 160); c.fillStyle = 'rgba(200,230,255,0.35)'; c.fillRect(8, 8, 50, 60); c.strokeStyle = '#f4e6c0'; c.lineWidth = 8; c.strokeRect(4, 4, 120, 152); c.beginPath(); c.moveTo(64, 0); c.lineTo(64, 160); c.moveTo(0, 80); c.lineTo(128, 80); c.stroke(); });
  for (const dx of [-w / 3, w / 3]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), new THREE.MeshStandardMaterial({ map: winTex, roughness: 0.3 })); win.position.set(dx, 1.8, 0.27); g.add(win); const win2 = win.clone(); win2.position.y = 4.6; g.add(win2); }
  const door = box(1.3, 2.4, 0.1, 0x5a3418, [0, 1.2, 0.3], 0.03); g.add(door);
  // boardwalk + awning
  g.add(box(w + 0.4, 0.25, 3, 0xa87a48, [0, 0.12, 1.7], 0.03));
  const awn = box(w + 0.4, 0.12, 3, 0x7a4a24, [0, 3.2, 1.7], 0.03); awn.rotation.x = 0.12; g.add(awn);
  for (const dx of [-w / 2, 0, w / 2]) g.add(box(0.18, 3.2, 0.18, 0x6a3a1a, [dx, 1.6, 3.1], 0.02));
  return g;
}
function cactus(x, z, h) { const g = new THREE.Group(); const m = toon(0x4f8a3a); const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.35, h, 6, 10), m); t.position.y = h / 2 + 0.3; outline(t, 0.04); g.add(t); for (const s of [-1, 1]) { const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, h * 0.3, 6, 8), m); a.position.set(s * 0.6, h * 0.55, 0); outline(a, 0.03); g.add(a); const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.5, 4, 8), m); b.rotation.z = Math.PI / 2; b.position.set(s * 0.38, h * 0.38, 0); g.add(b); } g.position.set(x, 0, z); return g; }
function mesa(x, z, w, h, d) { const t = canvasTex(256, 256, (c) => { const cols = ['#c8582a', '#d8723a', '#b84a22', '#e08a4a']; for (let y = 0; y < 256; y += 16) { c.fillStyle = cols[(y / 16) % 4]; c.fillRect(0, y, 256, 16); } }); const m = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.45, w * 0.55, h, 9), toon(0xffffff, { map: t })); m.scale.z = d / w; m.position.set(x, h / 2 - 1, z); outline(m, 0.4); return m; }
function waterTower() { const g = new THREE.Group(); for (const s of [-1, 1]) for (const t of [-1, 1]) g.add(box(0.25, 7, 0.25, 0x6a4a2a, [s * 1.4, 3.5, t * 1.4], 0.03)); const tank = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 16), toon(0xffffff, { map: planksTex('#8a5a32', 256, 128, true, [4, 1]) })); tank.position.y = 8.5; outline(tank, 0.06); g.add(tank); const roof = new THREE.Mesh(new THREE.ConeGeometry(2.5, 1.4, 16), toon(0x5a3a22)); roof.position.y = 10.7; outline(roof, 0.05); g.add(roof); return g; }
function windmill() { const g = new THREE.Group(); g.add(box(0.2, 9, 0.2, 0x8a8a8a, [0, 4.5, 0], 0.02)); const head = new THREE.Group(); head.position.set(0, 9, 0.3); for (let k = 0; k < 12; k++) { const b = box(0.25, 1.6, 0.04, 0xd8d8d8, [0, 1, 0], 0.01); const p = new THREE.Group(); p.add(b); p.rotation.z = k * Math.PI / 6; head.add(p); } g.add(head); g.userData.head = head; return g; }
function wagon() { const g = new THREE.Group(); g.add(box(2.2, 0.8, 4.5, 0x7a4a24, [0, 1.3, 0], 0.04)); const cover = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 4.4, 16, 1, true, 0, Math.PI), toon(0xf2ead2, { side: THREE.DoubleSide })); cover.rotation.z = Math.PI / 2; cover.rotation.y = Math.PI / 2; cover.position.y = 1.7; outline(cover, 0.04); g.add(cover); for (const z of [-1.6, 1.6]) for (const s of [-1, 1]) { const w = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.07, 6, 18), toon(0x5a3418)); w.rotation.y = Math.PI / 2; w.position.set(s * 1.15, 0.7, z); g.add(w); for (let k = 0; k < 4; k++) { const sp = box(0.03, 1.4, 0.03, 0x5a3418, [s * 1.15, 0.7, z], 0); sp.rotation.x = k * Math.PI / 4; g.add(sp); } } return g; }
function tumble() { const g = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7, 1), new THREE.MeshBasicMaterial({ color: 0x8a6a3a, wireframe: true })); return g; }
export function horseCanvas(pull) {
  const c = document.createElement('canvas'); c.width = 768; c.height = 560; const x = c.getContext('2d'); const INK = '#151012';
  x.lineWidth = 10; x.strokeStyle = INK; x.lineJoin = 'round'; x.lineCap = 'round';
  const lean = pull ? -0.12 : 0;
  x.save(); x.translate(384, 520); x.rotate(lean); x.translate(-384, -520);
  const legs = pull ? [[230, 340, 150, 520], [290, 350, 240, 520], [500, 350, 560, 520], [560, 340, 650, 515]] : [[230, 340, 220, 520], [290, 350, 290, 520], [500, 350, 500, 520], [560, 340, 570, 520]];
  for (const [a, b, cc, d] of legs) { x.beginPath(); x.moveTo(a, b); x.lineTo(cc, d); x.lineWidth = 30; x.strokeStyle = INK; x.stroke(); x.lineWidth = 18; x.strokeStyle = '#8a4a22'; x.stroke(); x.fillStyle = '#2a1a10'; x.beginPath(); x.ellipse(cc + 4, d - 4, 18, 10, 0, 0, 7); x.fill(); }
  x.beginPath(); x.roundRect(170, 210, 460, 170, 85); x.fillStyle = '#9a5a2a'; x.fill(); x.lineWidth = 10; x.strokeStyle = INK; x.stroke();
  x.fillStyle = '#f4ecd8'; x.beginPath(); x.ellipse(300, 270, 46, 30, 0.3, 0, 7); x.fill();
  x.beginPath(); x.moveTo(580, 250); x.lineTo(650, 90); x.lineTo(735, 120); x.lineTo(748, 190); x.lineTo(670, 210); x.lineTo(630, 300); x.closePath(); x.fillStyle = '#9a5a2a'; x.fill(); x.stroke();
  x.fillStyle = '#2a1a10'; x.beginPath(); x.moveTo(596, 240); x.lineTo(645, 100); x.lineTo(662, 106); x.lineTo(626, 260); x.fill();
  x.fillStyle = '#fff'; x.beginPath(); x.arc(690, 138, 16, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(694, 140, 7, 0, 7); x.fill();
  if (pull) { x.lineWidth = 7; x.beginPath(); x.moveTo(672, 118); x.lineTo(710, 112); x.stroke(); x.fillStyle = '#7fd0ff'; x.beginPath(); x.arc(740, 100, 10, 0, 7); x.fill(); }
  x.beginPath(); x.moveTo(170, 240); x.quadraticCurveTo(110, 290, 130, 380); x.lineWidth = 22; x.strokeStyle = '#2a1a10'; x.stroke();
  x.lineWidth = 9; x.strokeStyle = '#3a2410'; x.beginPath(); x.moveTo(600, 230); x.lineTo(420, 250); x.lineTo(200, 260); x.stroke(); x.beginPath(); x.roundRect(380, 200, 90, 70, 10); x.fillStyle = '#5a3418'; x.fill(); x.stroke();
  x.restore();
  return c;
}
function pantsTex(rivets, torn = 0) {
  return canvasTex(512, 640, (c) => {
    c.clearRect(0, 0, 512, 640);
    const shape = () => { c.beginPath(); c.moveTo(70, 20); c.lineTo(442, 20); c.lineTo(470, 620); c.lineTo(290, 620); c.lineTo(256, 230); c.lineTo(222, 620); c.lineTo(42, 620); c.closePath(); };
    shape(); c.fillStyle = '#2f5aa0'; c.fill();
    c.save(); shape(); c.clip(); c.strokeStyle = 'rgba(255,255,255,0.07)'; c.lineWidth = 3; for (let i = -640; i < 640; i += 8) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 640, 640); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(240, 0, 32, 640); c.restore();
    shape(); c.lineWidth = 12; c.strokeStyle = '#151012'; c.stroke();
    c.fillStyle = '#244a88'; c.fillRect(70, 20, 372, 60); c.strokeStyle = '#151012'; c.lineWidth = 8; c.strokeRect(70, 20, 372, 60);
    c.strokeStyle = '#e8a03a'; c.lineWidth = 5; c.setLineDash([14, 8]);
    for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(256 + sd * 150, 80); c.quadraticCurveTo(256 + sd * 100, 170, 256 + sd * 40, 130); c.stroke(); }
    c.beginPath(); c.moveTo(70, 90); c.lineTo(442, 90); c.stroke(); c.setLineDash([]);
    if (rivets) for (const [px, py] of [[256 - 150, 86], [256 - 40, 130], [256 + 150, 86], [256 + 40, 130]]) { c.fillStyle = '#d88a3a'; c.beginPath(); c.arc(px, py, 13, 0, 7); c.fill(); c.strokeStyle = '#6a3a1a'; c.lineWidth = 4; c.stroke(); c.fillStyle = 'rgba(255,240,200,0.8)'; c.beginPath(); c.arc(px - 4, py - 4, 4, 0, 7); c.fill(); }
    if (torn > 0) { c.globalCompositeOperation = 'destination-out'; c.beginPath(); c.moveTo(256, 0); for (let y = 0; y <= 640; y += 32) c.lineTo(256 + (y / 32 % 2 ? 14 : -14) * torn, y); c.lineTo(256 + 40 * torn, 640); c.lineTo(256 - 40 * torn, 640); c.closePath(); c.fill(); c.globalCompositeOperation = 'source-over'; }
  });
}

export function buildWest() {
  const scene = new THREE.Scene();
  const sky = skyDome(0x2a78e0, 0xf6e2b8, 0xf6e2b8); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xe0f0ff, 0xc8905a, 0.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d0, 3.6); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.userData.dir = new THREE.Vector3(-0.5, 0.65, 0.45).normalize(); scene.add(sun, sun.target);
  const clouds = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const cl = cloudSprite(i, 20 + hash(i, 9) * 14); cl.position.set(Math.cos(a) * 260, 60 + hash(i, 2) * 60, Math.sin(a) * 260); scene.add(cl); clouds.push(cl); }
  const dirtTex = canvasTex(512, 512, (c) => { c.fillStyle = '#d8a86a'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 5000; i++) { c.fillStyle = ['#c8985a', '#e8b87a', '#b8884a', '#a8784a'][i % 4]; c.fillRect(hash(i, 1) * 512, hash(i, 2) * 512, 2 + hash(i, 3) * 3, 2); } for (let i = 0; i < 30; i++) { c.strokeStyle = 'rgba(120,80,40,0.25)'; c.lineWidth = 10; c.beginPath(); c.moveTo(0, hash(i, 4) * 512); c.lineTo(512, hash(i, 5) * 512); c.stroke(); } });
  dirtTex.wrapS = dirtTex.wrapT = THREE.RepeatWrapping; dirtTex.repeat.set(40, 40);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), toon(0xffffff, { map: dirtTex, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

  // ===== TOWN =====
  const town = new THREE.Group(); scene.add(town);
  const left = [['SALOON', '#a84a2a', '#f4d68a'], ['BANK', '#6a7a8a', '#f4e6c0'], ['GENERAL STORE', '#8a6a3a', '#e8f0d0'], ['HOTEL', '#7a4a6a', '#f4e6c0']];
  const right = [['J. DAVIS - TAILOR', '#4a6a8a', '#f4e6c0'], ['SHERIFF', '#9a7a4a', '#f4e6c0'], ['BARBER', '#a85a4a', '#f4f4f4'], ['ASSAY OFFICE', '#6a5a3a', '#f4e6c0']];
  left.forEach(([s, c, sc], i) => { const f = facade(s, c, sc); f.position.set(-10, 0, -i * 9); f.rotation.y = Math.PI / 2; town.add(f); });
  right.forEach(([s, c, sc], i) => { const f = facade(s, c, sc); f.position.set(10, 0, -i * 9); f.rotation.y = -Math.PI / 2; town.add(f); });
  for (let i = 0; i < 6; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.36, 0.9, 12), toon(0x8a5a2a)); b.position.set((i % 2 ? 1 : -1) * 7.2, 0.45, 2 - i * 5); outline(b, 0.03); b.castShadow = true; town.add(b); }
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { town.add(box(3, 0.12, 0.12, 0x6a3a1a, [s * 6.4, 1.0, -3 - i * 9], 0.02)); town.add(box(0.12, 1.0, 0.12, 0x6a3a1a, [s * 6.4, 0.5, -1.5 - i * 9], 0.02), box(0.12, 1.0, 0.12, 0x6a3a1a, [s * 6.4, 0.5, -4.5 - i * 9], 0.02)); }
  town.add(box(2.4, 0.7, 1.0, 0x6a4a2a, [-6.6, 0.35, -12], 0.03));
  const wg = wagon(); wg.position.set(5.0, 0, -22); wg.rotation.y = 0.2; town.add(wg);
  const wt = waterTower(); wt.position.set(-4, 0, -44); town.add(wt);
  const wm = windmill(); wm.position.set(6, 0, -50); town.add(wm);
  for (const [x, z, h] of [[-15, 8, 2.4], [16, 6, 2.0], [-18, -30, 2.8], [18, -38, 2.2], [-8, -60, 2.6], [12, -70, 3]]) town.add(cactus(x, z, h));
  for (const [x, z, w, h, d] of [[-80, -260, 60, 40, 30], [40, -300, 90, 55, 40], [140, -240, 50, 30, 30], [-170, -220, 70, 35, 30]]) scene.add(mesa(x, z, w, h, d));
  const tumbles = [0, 1].map(() => { const t = tumble(); town.add(t); return t; });
  const dust = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 500 }, (_, i) => new THREE.Vector3((hash(i, 1) - 0.5) * 16, hash(i, 2) * 3, -hash(i, 3) * 40 + 8))), new THREE.PointsMaterial({ color: 0xf0d0a0, size: 0.06, transparent: true, opacity: 0.7 })); town.add(dust);
  // horses + pants for the tug test (in the street at z = -10)
  const horseT = [new THREE.CanvasTexture(horseCanvas(false)), new THREE.CanvasTexture(horseCanvas(true))]; horseT.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));
  const mkHorse = () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 2.6), new THREE.MeshBasicMaterial({ map: horseT[0], transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.geometry.translate(0, 1.3, 0); m.castShadow = true; return m; };
  const horses = [mkHorse(), mkHorse()]; horses.forEach((h) => town.add(h));
  const pantsT = { riv: pantsTex(true), plain: pantsTex(false), torn: [0.3, 0.7, 1.2].map((k) => pantsTex(false, k)) };
  const pants = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.0), new THREE.MeshStandardMaterial({ map: pantsT.riv, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 })); pants.castShadow = true; town.add(pants);
  const ropeMat = toon(0xc8a46a);
  const ropes = [0, 1].map(() => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6), ropeMat); town.add(r); return r; });
  const rivetGlow = [0, 1, 2, 3].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,210,120,1)', 'rgba(255,140,40,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); town.add(s); return s; });
  const hats = []; for (let i = 0; i < 10; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.55, 0.3, 14), toon([0x8a5a2a, 0x3a2a1a, 0x6a5a48][i % 3])); outline(h, 0.02); h.visible = false; town.add(h); hats.push(h); }

  // ===== MINE =====
  const mine = new THREE.Group(); mine.position.x = MINE_X; scene.add(mine);
  const rockTex = canvasTex(256, 256, (c) => { c.fillStyle = '#b8683a'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 300; i++) { c.fillStyle = ['#a8582a', '#c8784a', '#985028'][i % 3]; c.beginPath(); c.arc(hash(i, 1) * 256, hash(i, 2) * 256, 4 + hash(i, 3) * 14, 0, 7); c.fill(); } }); rockTex.wrapS = rockTex.wrapT = THREE.RepeatWrapping; rockTex.repeat.set(4, 2);
  const hill = new THREE.Mesh(new THREE.SphereGeometry(16, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xffffff, { map: rockTex })); hill.scale.set(1.3, 0.8, 1); hill.position.set(0, -1, -14); outline(hill, 0.2); mine.add(hill);
  const tunnel = box(4, 4.2, 6, 0x0a0806, [0, 2.1, -3.5], 0, new THREE.MeshBasicMaterial({ color: 0x0a0806 })); mine.add(tunnel);
  for (const s of [-1, 1]) mine.add(box(0.5, 4.6, 0.5, 0x7a4a24, [s * 2.2, 2.3, -0.6], 0.04)); mine.add(box(5.4, 0.6, 0.6, 0x7a4a24, [0, 4.6, -0.6], 0.04));
  const mineSign = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.7), new THREE.MeshStandardMaterial({ map: canvasTex(300, 70, (c) => { c.fillStyle = '#e8d8b0'; c.fillRect(0, 0, 300, 70); c.fillStyle = '#3a2410'; c.font = '900 44px serif'; c.textAlign = 'center'; c.fillText('LUCKY STRIKE', 150, 52); }) })); mineSign.position.set(0, 5.4, -0.25); mine.add(mineSign);
  for (const s of [-1, 1]) mine.add(box(0.1, 0.1, 18, 0x5a5a5a, [s * 0.6, 0.06, 6], 0.01)); for (let z = -2; z < 15; z += 1) mine.add(box(1.8, 0.08, 0.25, 0x6a4a2a, [0, 0.03, z], 0.01));
  const cart = new THREE.Group(); cart.add(box(1.6, 0.9, 2.0, 0x5a5a62, [0, 0.8, 0], 0.04)); for (let i = 0; i < 6; i++) { const n = new THREE.Mesh(new THREE.IcosahedronGeometry(0.22, 0), new THREE.MeshStandardMaterial({ color: 0xf0c23a, metalness: 0.9, roughness: 0.25 })); n.position.set((hash(i, 1) - 0.5) * 1.2, 1.3, (hash(i, 2) - 0.5) * 1.5); cart.add(n); } cart.position.set(-2.8, 0, 1.5); mine.add(cart);
  const lantern = new THREE.PointLight(0xffb060, 6, 8, 1.5); lantern.position.set(1.8, 3.4, 0.2); mine.add(lantern);
  const nuggets = []; for (let i = 0; i < 14; i++) { const n = new THREE.Mesh(new THREE.IcosahedronGeometry(0.11 + hash(i, 1) * 0.08, 0), new THREE.MeshStandardMaterial({ color: 0xf4c83a, metalness: 0.9, roughness: 0.2, emissive: 0x3a2a00 })); outline(n, 0.015); n.visible = false; mine.add(n); nuggets.push(n); }
  for (const [x, z, h] of [[-8, 6, 2.2], [9, 8, 2.6], [-12, -2, 3]]) mine.add(cactus(x, z, h));

  // ===== TAILOR SHOP =====
  const shop = new THREE.Group(); shop.position.x = SHOP_X; scene.add(shop);
  const wallT = planksTex('#a8784a', 256, 256, true, [6, 2]); const floorT = planksTex('#7a5232', 256, 256, false, [4, 4]);
  const sf = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), toon(0xffffff, { map: floorT, roughness: 0.7 })); sf.rotation.x = -Math.PI / 2; sf.position.y = 0.01; sf.receiveShadow = true; shop.add(sf);
  const wmat = toon(0xffffff, { map: wallT, roughness: 0.9 });
  for (const [w, h, d, x, y, z] of [[12, 5, 0.3, 0, 2.5, -4], [0.3, 5, 12, -6, 2.5, 0], [0.3, 5, 12, 6, 2.5, 0], [12, 0.3, 12, 0, 5, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wmat); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true; shop.add(m); }
  const bench = box(3.6, 0.12, 1.4, 0x7a4a24, [0, 1.0, -1.6], 0.03); shop.add(bench); for (const dx of [-1.6, 1.6]) for (const dz of [-0.55, 0.55]) shop.add(box(0.12, 1.0, 0.12, 0x5a3418, [dx, 0.5, -1.6 + dz], 0.01));
  const benchPants = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.7), new THREE.MeshStandardMaterial({ map: pantsT.plain, transparent: true, alphaTest: 0.4, roughness: 0.9 })); benchPants.rotation.x = -Math.PI / 2; benchPants.position.set(-0.2, 1.07, -1.6); shop.add(benchPants);
  for (let i = 0; i < 5; i++) { const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.6, 16), toon(i % 2 ? 0x2f5aa0 : 0x3a6ab0)); bolt.rotation.z = Math.PI / 2; bolt.position.set(-4.6, 0.4 + i * 0.6, -3.3 + (i % 2) * 0.2); outline(bolt, 0.02); shop.add(bolt); }
  shop.add(box(1.8, 0.1, 0.8, 0x5a3418, [-4.6, 3.3, -3.4], 0.02));
  const anvil = new THREE.Group(); anvil.add(box(0.5, 0.6, 0.4, 0x2a2a2e, [0, 0.3, 0], 0.02), box(1.0, 0.3, 0.45, 0x3a3a40, [0, 0.75, 0], 0.02)); anvil.position.set(2.6, 0, -1.4); shop.add(anvil);
  const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 16), new THREE.MeshStandardMaterial({ color: 0xd8f0ff, transparent: true, opacity: 0.5, roughness: 0.1 })); jar.position.set(1.2, 1.24, -1.4); shop.add(jar);
  for (let i = 0; i < 10; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 8), new THREE.MeshStandardMaterial({ color: 0xd88a3a, metalness: 0.8, roughness: 0.3 })); r.position.set(1.2 + (hash(i, 1) - 0.5) * 0.24, 1.1 + i * 0.02, -1.4 + (hash(i, 2) - 0.5) * 0.24); shop.add(r); }
  const manq = new THREE.Group(); manq.add(box(0.06, 1.2, 0.06, 0x3a2a1a, [0, 0.6, 0], 0.01)); const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.6, 6, 12), toon(0xe8d8b0)); torso.position.y = 1.55; outline(torso, 0.02); manq.add(torso); manq.position.set(-2.8, 0, -2.4); shop.add(manq);
  const lamp = new THREE.PointLight(0xffc880, 10, 10, 1.4); lamp.position.set(0.6, 3.6, -0.8); shop.add(lamp);
  const winSun = new THREE.SpotLight(0xfff2d8, 60, 14, 0.5, 0.6, 1.2); winSun.position.set(5.6, 4.2, 2); winSun.target.position.set(0, 1, -1.5); shop.add(winSun, winSun.target);
  const rivetsOnPants = []; for (let i = 0; i < 4; i++) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.02, 10), new THREE.MeshStandardMaterial({ color: 0xe8963a, metalness: 0.85, roughness: 0.25, emissive: 0x3a1a00 })); r.position.set(-0.2 + [-0.44, -0.13, 0.44, 0.13][i], 1.09, -1.6 + [-0.48, -0.36, -0.48, -0.36][i]); r.visible = false; shop.add(r); rivetsOnPants.push(r); }
  const sparks = []; for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,230,160,1)', 'rgba(255,150,40,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); s.visible = false; shop.add(s); sparks.push(s); }

  // ===== MODERN JEANS CLOSE-UP =====
  const jeans = new THREE.Group(); jeans.position.x = JEANS_X; scene.add(jeans);
  const denim = canvasTex(1024, 1024, (c) => { c.fillStyle = '#2a4f8a'; c.fillRect(0, 0, 1024, 1024); c.strokeStyle = 'rgba(255,255,255,0.08)'; c.lineWidth = 3; for (let i = -1024; i < 1024; i += 7) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 1024, 1024); c.stroke(); } for (let i = 0; i < 1500; i++) { c.fillStyle = `rgba(255,255,255,${hash(i, 1) * 0.06})`; c.fillRect(hash(i, 2) * 1024, hash(i, 3) * 1024, 8, 2); } c.strokeStyle = '#e8a03a'; c.lineWidth = 7; c.setLineDash([18, 10]); c.beginPath(); c.moveTo(80, 150); c.quadraticCurveTo(520, 520, 940, 240); c.stroke(); c.beginPath(); c.moveTo(80, 180); c.quadraticCurveTo(520, 560, 940, 270); c.stroke(); c.beginPath(); c.moveTo(0, 110); c.lineTo(1024, 110); c.stroke(); c.setLineDash([]); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 10; c.beginPath(); c.moveTo(80, 160); c.quadraticCurveTo(520, 540, 940, 255); c.stroke(); });
  const jp = new THREE.Mesh(new THREE.PlaneGeometry(6, 6, 20, 20), new THREE.MeshStandardMaterial({ map: denim, roughness: 0.95 })); const jpp = jp.geometry.attributes.position; for (let i = 0; i < jpp.count; i++) jpp.setZ(i, Math.sin(jpp.getX(i) * 0.6) * 0.15 + Math.cos(jpp.getY(i) * 0.5) * 0.1); jp.geometry.computeVertexNormals(); jeans.add(jp);
  const bigRivets = [];
  for (const [x, y] of [[-2.55, 2.05], [2.6, 1.55]]) { const r = new THREE.Group(); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 24), new THREE.MeshStandardMaterial({ color: 0xd8903a, metalness: 0.95, roughness: 0.2 })); cap.rotation.x = Math.PI / 2; r.add(cap); const dome = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), cap.material); dome.rotation.x = Math.PI / 2; dome.position.z = 0.04; r.add(dome); r.position.set(x, y, 0.22); jeans.add(r); bigRivets.push(r); }
  const jLight = new THREE.PointLight(0xfff2d8, 30, 12, 1.2); jLight.position.set(-2, 3, 3); jeans.add(jLight);

  return { scene, ground, sky, hemi, sun, clouds, town, wm, tumbles, dust, horses, horseT, pants, pantsT, ropes, rivetGlow, hats, mine, nuggets, cart, shop, benchPants, rivetsOnPants, sparks, jeans, bigRivets };
}
