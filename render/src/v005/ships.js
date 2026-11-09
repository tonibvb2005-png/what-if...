// 1779 shipyard, Caribbean sea with sailing warships, underwater hull set with barnacles + shipworms.
import * as THREE from 'three';
import { toon, outline, box, hash, skyDome, cloudSprite, glowTexture, canvasTex, blobShadow } from '../world.js';
import { normalTex } from '../effects.js';

export const YARD_X = 0, SEA_X = 400, UNDER_X = -400;

// ---------- textures ----------
const sideCache = new Map();
export function hullSideTex(variant, cover = 1, foul = 1, enemy = false) {
  const key = `${variant}|${cover.toFixed(2)}|${foul.toFixed(2)}|${enemy}`; if (sideCache.has(key)) return sideCache.get(key);
  const t = canvasTex(1024, 256, (c) => {
    const W = 1024, H = 256, wl = H * 0.62; // waterline (v from top)
    // upper works
    c.fillStyle = '#1a1814'; c.fillRect(0, 0, W, wl);
    const band = enemy ? '#2a4aa0' : '#d8a63a';
    c.fillStyle = band; c.fillRect(0, H * 0.14, W, H * 0.16); c.fillRect(0, H * 0.38, W, H * 0.13);
    for (let row = 0; row < 2; row++) for (let i = 0; i < 16; i++) { const x = 70 + i * 56, y = row ? H * 0.40 : H * 0.155; c.fillStyle = '#0a0806'; c.fillRect(x, y, 26, 22); c.fillStyle = '#a8261c'; c.fillRect(x + 1, y - 4, 24, 4); }
    c.fillStyle = 'rgba(255,255,255,0.08)'; for (let y = 6; y < wl; y += 10) c.fillRect(0, y, W, 2);
    // underwater body
    const base = variant === 'copper' ? '#c8742a' : '#6a4a2a';
    c.fillStyle = '#6a4a2a'; c.fillRect(0, wl, W, H - wl);
    for (let y = wl; y < H; y += 12) { c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(0, y, W, 2); }
    if (variant === 'copper' || cover > 0) {
      const xEnd = W * (variant === 'copper' ? 1 : cover);
      for (let y = wl - 4; y < H; y += 18) for (let x = (Math.floor(y / 18) % 2) * 20; x < xEnd; x += 40) { const v = 0.85 + hash(x, y) * 0.3; c.fillStyle = `rgb(${210 * v | 0},${120 * v | 0},${50 * v | 0})`; c.fillRect(W - x - 40, y, 38, 16); c.fillStyle = 'rgba(255,230,180,0.35)'; c.fillRect(W - x - 38, y + 2, 14, 3); }
      c.fillStyle = '#e8c070'; c.fillRect(W - xEnd, wl - 6, xEnd, 4);
    }
    if (variant === 'fouled' && foul > 0) {
      for (let i = 0; i < 900 * foul; i++) { const x = hash(i, 1) * W, y = wl - 6 + hash(i, 2) * (H - wl + 6); c.fillStyle = ['#3a6a2a', '#5a8a3a', '#2a4a20'][i % 3]; c.beginPath(); c.ellipse(x, y, 4 + hash(i, 3) * 10, 3 + hash(i, 4) * 5, hash(i, 5) * 3, 0, 7); c.fill(); }
      for (let i = 0; i < 260 * foul; i++) { const x = hash(i, 7) * W, y = wl + hash(i, 8) * (H - wl); const r = 3 + hash(i, 9) * 5; c.fillStyle = '#e8e2d2'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.fillStyle = '#6a6a5a'; c.beginPath(); c.arc(x, y, r * 0.35, 0, 7); c.fill(); }
      for (let i = 0; i < 40 * foul; i++) { c.fillStyle = '#120a06'; c.beginPath(); c.arc(hash(i, 11) * W, wl + 10 + hash(i, 12) * (H - wl - 14), 2 + hash(i, 13) * 3, 0, 7); c.fill(); }
    }
    c.fillStyle = '#e8d8b0'; c.fillRect(0, wl - 2, W, 3);
  });
  t.colorSpace = THREE.SRGBColorSpace; sideCache.set(key, t); return t;
}
function sailTex() {
  return canvasTex(256, 256, (c) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, 256, 256); c.strokeStyle = 'rgba(120,100,70,0.35)'; c.lineWidth = 3; for (let x = 0; x < 256; x += 22) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 256); c.stroke(); } for (const y of [60, 110]) { c.beginPath(); c.moveTo(0, y); c.lineTo(256, y); c.stroke(); for (let x = 8; x < 256; x += 16) { c.fillStyle = 'rgba(90,70,40,0.5)'; c.fillRect(x, y - 2, 3, 8); } } c.strokeStyle = '#8a7a5a'; c.lineWidth = 8; c.strokeRect(0, 0, 256, 256); });
}
function unionFlag() {
  return canvasTex(400, 200, (c) => { c.fillStyle = '#1f3a8a'; c.fillRect(0, 0, 400, 200); c.strokeStyle = '#fff'; c.lineWidth = 40; c.beginPath(); c.moveTo(0, 0); c.lineTo(400, 200); c.moveTo(400, 0); c.lineTo(0, 200); c.stroke(); c.strokeStyle = '#c8202a'; c.lineWidth = 14; c.beginPath(); c.moveTo(0, 0); c.lineTo(400, 200); c.moveTo(400, 0); c.lineTo(0, 200); c.stroke(); c.fillStyle = '#fff'; c.fillRect(165, 0, 70, 200); c.fillRect(0, 65, 400, 70); c.fillStyle = '#c8202a'; c.fillRect(180, 0, 40, 200); c.fillRect(0, 80, 400, 40); });
}
function frenchFlag() { return canvasTex(400, 200, (c) => { c.fillStyle = '#f6f4ea'; c.fillRect(0, 0, 400, 200); c.fillStyle = '#d8a63a'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(40 + (i % 3) * 140, 40 + Math.floor(i / 3) * 60, 10, 0, 7); c.fill(); } }); }

// ---------- ship ----------
function hullGeometry(L, B, D) {
  const g = new THREE.BoxGeometry(B, D, L, 8, 8, 28); const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const zn = z / (L / 2), yn = (y + D / 2) / D;
    const wz = zn < 0 ? Math.sqrt(Math.max(0.02, 1 - zn * zn * 0.96)) : 1 - 0.28 * zn * zn;
    const wy = 0.28 + 0.72 * Math.pow(Math.sin(yn * Math.PI / 2), 0.55) * (yn > 0.85 ? 1 - 0.12 * (yn - 0.85) / 0.15 : 1);
    x *= wz * wy; y += 0.6 * zn * zn + (zn < 0 ? 0.5 * zn * zn : 0);
    if (yn < 0.02) x *= 0.3;
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals(); return g;
}
const SAIL = sailTex(), UNION = unionFlag(), FRENCH = frenchFlag();
export function tallShip(opts = {}) {
  const { variant = 'wood', enemy = false } = opts;
  const g = new THREE.Group(); const L = 22, B = 5.6, D = 4.2;
  const side = new THREE.MeshStandardMaterial({ map: hullSideTex(variant, variant === 'copper' ? 1 : 0, 1, enemy), roughness: 0.55, metalness: variant === 'copper' ? 0.35 : 0 });
  const deckTex = canvasTex(128, 512, (c) => { c.fillStyle = '#b88a52'; c.fillRect(0, 0, 128, 512); c.strokeStyle = '#8a6438'; c.lineWidth = 3; for (let x = 0; x < 128; x += 14) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, 512); c.stroke(); } });
  const bottom = new THREE.MeshStandardMaterial({ color: variant === 'copper' ? 0xc8742a : 0x4a3a22, roughness: 0.5, metalness: variant === 'copper' ? 0.35 : 0 });
  const hull = new THREE.Mesh(hullGeometry(L, B, D), [side, side, new THREE.MeshStandardMaterial({ map: deckTex, roughness: 0.8 }), bottom, toon(0x3a2a1a), toon(0x3a2a1a)]);
  hull.position.y = D / 2 - 1.6; hull.castShadow = true; hull.receiveShadow = true; g.add(hull); outline(hull, 0.06);
  g.userData.side = side; g.userData.bottom = bottom; g.userData.hull = hull;
  const deckY = hull.position.y + D / 2 - 0.05;
  // stern castle + windows
  const stern = box(4.6, 1.8, 4.2, 0x1a1814, [0, deckY + 0.9, 8.6], 0.05); g.add(stern);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 1.0), new THREE.MeshBasicMaterial({ map: canvasTex(256, 64, (c) => { c.fillStyle = '#d8a63a'; c.fillRect(0, 0, 256, 64); for (let i = 0; i < 6; i++) { c.fillStyle = '#ffe9a8'; c.fillRect(10 + i * 41, 14, 30, 36); c.strokeStyle = '#2a1a10'; c.lineWidth = 3; c.strokeRect(10 + i * 41, 14, 30, 36); } }) })); win.position.set(0, deckY + 1.0, 10.72); g.add(win);
  g.add(box(0.5, 0.5, 6, 0x5a3a1a, [0, deckY + 0.4, -12], 0.03)); g.children[g.children.length - 1].rotation.x = -0.35; // bowsprit
  // masts, yards, sails
  const sails = [];
  for (const [z, h] of [[-5, 16], [1, 18], [7, 13]]) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.26, h, 10), toon(0x6a4422)); mast.position.set(0, deckY + h / 2, z); mast.castShadow = true; outline(mast, 0.03); g.add(mast);
    for (let k = 0; k < 3; k++) {
      const yy = deckY + 3 + k * (h - 4) / 3, w = 7.5 - k * 1.6;
      const yard = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, w + 0.6, 8), toon(0x5a3a1a)); yard.rotation.z = Math.PI / 2; yard.position.set(0, yy + (h - 4) / 3, z); g.add(yard);
      const sg = new THREE.PlaneGeometry(w, (h - 4) / 3 * 0.92, 8, 6); const sp = sg.attributes.position;
      for (let i = 0; i < sp.count; i++) { const u = sp.getX(i) / w + 0.5, v = sp.getY(i) / ((h - 4) / 3) + 0.5; sp.setZ(i, -Math.sin(u * Math.PI) * Math.sin(v * Math.PI * 0.9 + 0.2) * 0.9); }
      sg.computeVertexNormals();
      const sail = new THREE.Mesh(sg, new THREE.MeshStandardMaterial({ map: SAIL, roughness: 0.9, side: THREE.DoubleSide, color: enemy ? 0xf2f0e6 : 0xfff6e2 })); sail.position.set(0, yy + (h - 4) / 6, z - 0.15); sail.castShadow = true; g.add(sail); sails.push(sail);
    }
    const pen = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.35), new THREE.MeshBasicMaterial({ color: enemy ? 0xf6f4ea : 0xc8202a, side: THREE.DoubleSide })); pen.position.set(0, deckY + h + 0.2, z + 1.3); g.add(pen); sails.push(pen);
  }
  const flag = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6, 6, 2), new THREE.MeshBasicMaterial({ map: enemy ? FRENCH : UNION, side: THREE.DoubleSide })); flag.position.set(0, deckY + 4.2, 11.6); flag.rotation.y = Math.PI / 2; g.add(flag); g.add(box(0.08, 3.6, 0.08, 0x3a2a1a, [0, deckY + 2.8, 10.6], 0.01));
  g.userData.flag = flag;
  // rigging
  const pts = []; for (const [z, h] of [[-5, 16], [1, 18], [7, 13]]) for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { pts.push(new THREE.Vector3(0, deckY + h, z), new THREE.Vector3(s * 2.6, deckY, z - 1 + k)); }
  pts.push(new THREE.Vector3(0, deckY + 16, -5), new THREE.Vector3(0, deckY + 1.8, -14.6), new THREE.Vector3(0, deckY + 18, 1), new THREE.Vector3(0, deckY + 16, -5), new THREE.Vector3(0, deckY + 13, 7), new THREE.Vector3(0, deckY + 18, 1));
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x2a2018 })));
  // cannons poking out
  for (const s of [-1, 1]) for (let i = 0; i < 8; i++) { const cn = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.9, 8), toon(0x1a1a1a)); cn.rotation.z = Math.PI / 2; cn.position.set(s * 2.55, deckY - 1.0, -7 + i * 2); g.add(cn); }
  g.userData.deckY = deckY; g.userData.sails = sails;
  return g;
}

function palm(x, z, h, s) {
  const g = new THREE.Group(); let px = 0, py = 0;
  for (let i = 0; i < 6; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.28 - i * 0.03, 0.32 - i * 0.03, h / 6, 7), toon(0x9a6a3a)); px += 0.15; seg.position.set(px, py + h / 12, 0); seg.rotation.z = -0.15; outline(seg, 0.03); g.add(seg); py += h / 6; }
  for (let i = 0; i < 7; i++) { const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), toon(i % 2 ? 0x3fa34d : 0x2f8a3e)); leaf.scale.set(2.4, 0.14, 0.55); const p = new THREE.Group(); p.position.set(px, py, 0); p.rotation.y = i / 7 * Math.PI * 2; leaf.position.set(1.9, -0.35, 0); leaf.rotation.z = -0.35; outline(leaf, 0.05); p.add(leaf); g.add(p); }
  g.position.set(x, 0, z); return g;
}
function wormCanvas(chew) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 384; const x = c.getContext('2d'); const INK = '#151012';
  x.lineWidth = 9; x.strokeStyle = INK;
  for (let i = 5; i >= 0; i--) { const y = 340 - i * 46, w = 58 - i * 2; x.beginPath(); x.ellipse(128 + Math.sin(i * 1.2) * 14, y, w, 34, 0, 0, 7); x.fillStyle = i % 2 ? '#f29ab0' : '#f6b4c4'; x.fill(); x.stroke(); }
  x.beginPath(); x.arc(128, 90, 72, 0, 7); x.fillStyle = '#f6b4c4'; x.fill(); x.stroke();
  for (const ex of [100, 156]) { x.fillStyle = '#fff'; x.beginPath(); x.arc(ex, 72, 18, 0, 7); x.fill(); x.stroke(); x.fillStyle = INK; x.beginPath(); x.arc(ex + 3, 76, 8, 0, 7); x.fill(); }
  x.beginPath(); x.moveTo(84, 108 + (chew ? 0 : 6)); x.quadraticCurveTo(128, 150, 172, 108 + (chew ? 0 : 6)); x.closePath(); x.fillStyle = '#7a1f1f'; x.fill(); x.stroke();
  x.fillStyle = '#fff'; for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(90 + k * 14, 112); x.lineTo(97 + k * 14, 126 + (chew ? 4 : 0)); x.lineTo(104 + k * 14, 112); x.fill(); }
  x.strokeStyle = '#8a8e96'; x.lineWidth = 10; x.beginPath(); x.moveTo(128, 18); x.lineTo(128, -10); x.stroke();
  return c;
}

export function buildShips() {
  const scene = new THREE.Scene();
  const sky = skyDome(0x2a78e0, 0xcfeaff, 0xcfeaff); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xd8ecff, 0x6aa0a0, 0.6); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 3.4); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.userData.dir = new THREE.Vector3(-0.45, 0.7, 0.55).normalize(); scene.add(sun, sun.target);
  const clouds = []; for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; const c = cloudSprite(i, 18 + hash(i, 9) * 14); c.position.set(Math.cos(a) * 240, 50 + hash(i, 2) * 60, Math.sin(a) * 240); scene.add(c); clouds.push(c); }
  const gullTex = canvasTex(128, 64, (c) => { c.strokeStyle = '#1a1a22'; c.lineWidth = 7; c.lineCap = 'round'; c.beginPath(); c.moveTo(10, 24); c.quadraticCurveTo(40, 8, 64, 34); c.quadraticCurveTo(88, 8, 118, 24); c.stroke(); });
  const gulls = []; for (let i = 0; i < 10; i++) { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: gullTex, fog: false })); b.scale.set(1.6, 0.8, 1); b.userData = { x: (hash(i, 1) - 0.5) * 50, y: 14 + hash(i, 2) * 14, z: (hash(i, 3) - 0.5) * 50, p: hash(i, 4) * 6 }; scene.add(b); gulls.push(b); }

  // ===== SHIPYARD =====
  const yard = new THREE.Group(); yard.position.x = YARD_X; scene.add(yard);
  const groundTex = canvasTex(512, 512, (c) => { c.fillStyle = '#b8a078'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 3000; i++) { c.fillStyle = ['#a08a64', '#c8b08a', '#8a7454'][i % 3]; c.fillRect(hash(i, 1) * 512, hash(i, 2) * 512, 3, 3); } }); groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping; groundTex.repeat.set(20, 20);
  const yg = new THREE.Mesh(new THREE.PlaneGeometry(200, 120), toon(0xffffff, { map: groundTex, roughness: 1 })); yg.rotation.x = -Math.PI / 2; yg.position.set(0, 0, 20); yg.receiveShadow = true; yard.add(yg);
  const harborN = normalTex(256, [[5, 1], [11, 0.5]], [1, 1], 3); harborN.repeat.set(30, 30);
  const harbor = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), new THREE.MeshStandardMaterial({ color: 0x2a7a9a, roughness: 0.15, normalMap: harborN, envMapIntensity: 1.2 })); harbor.rotation.x = -Math.PI / 2; harbor.position.set(0, -0.6, -170); yard.add(harbor);
  const yShip = tallShip({ variant: 'wood' }); yShip.position.set(0, 2.2, 0); yShip.rotation.x = -0.04; yard.add(yShip);
  for (let z = -9; z <= 9; z += 3) for (const s of [-1, 1]) { const p = box(0.3, 3.4, 0.3, 0x8a6a3a, [s * 3.6, 1.7, z], 0.03); yard.add(p); const brace = box(0.2, 0.2, 2.2, 0x8a6a3a, [s * 3.6, 2.6, z + 1.1], 0.02); yard.add(brace); }
  for (const s of [-1, 1]) yard.add(box(0.8, 0.12, 20, 0xa07a48, [s * 3.9, 1.5, 0], 0.03));
  const plates = []; for (let i = 0; i < 9; i++) { const st = new THREE.Group(); for (let k = 0; k < 8; k++) { const p = box(1.0, 0.05, 0.7, 0xc8742a, [(hash(i, k) - 0.5) * 0.05, k * 0.055, 0], 0.01); p.material.metalness = 0.7; p.material.roughness = 0.3; st.add(p); } st.position.set(6.5 + (i % 3) * 1.3, 0, -6 + Math.floor(i / 3) * 1.6); yard.add(st); plates.push(st); }
  for (let i = 0; i < 8; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.45, 1.1, 14), toon(0x8a5a2a)); b.position.set(-7 - (i % 3) * 1.1, 0.55, 4 + Math.floor(i / 3) * 1.1); outline(b, 0.03); b.castShadow = true; yard.add(b); }
  for (const [x, z, w] of [[-16, 12, 10], [16, 14, 12]]) { const shed = box(w, 5, 7, 0x9a4a32, [x, 2.5, z], 0.08); yard.add(shed); const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 5.6, 2.5, 4, 1), toon(0x5a3a2a)); roof.rotation.y = Math.PI / 4; roof.scale.set(w / 7.6, 1, 1); roof.position.set(x, 6.2, z); outline(roof, 0.06); yard.add(roof); }
  const pole = box(0.18, 10, 0.18, 0xe8e2d2, [-9, 5, -4], 0.03); yard.add(pole);
  const yardFlag = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6, 8, 2), new THREE.MeshBasicMaterial({ map: UNION, side: THREE.DoubleSide })); yardFlag.position.set(-7.4, 9, -4); yard.add(yardFlag);
  const sparks = []; for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,230,160,1)', 'rgba(255,150,40,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); s.visible = false; yard.add(s); sparks.push(s); }

  // ===== CARIBBEAN SEA =====
  const sea = new THREE.Group(); sea.position.x = SEA_X; scene.add(sea);
  const seaN = normalTex(256, [[4, 1], [9, 0.5], [19, 0.25]], [1, 2], 3.2); seaN.repeat.set(40, 40);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), new THREE.MeshStandardMaterial({ color: 0x1aa8c8, roughness: 0.12, metalness: 0.1, normalMap: seaN, normalScale: new THREE.Vector2(0.9, 0.9), envMapIntensity: 1.2 })); ocean.rotation.x = -Math.PI / 2; ocean.receiveShadow = true; sea.add(ocean);
  const island = new THREE.Group(); const sand = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xf2d8a0)); sand.scale.y = 0.12; island.add(sand); const hill = new THREE.Mesh(new THREE.SphereGeometry(18, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x4f9a3a)); hill.scale.y = 0.55; hill.position.y = 1; outline(hill, 0.3); island.add(hill); for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2; island.add(palm(Math.cos(a) * 22, Math.sin(a) * 22, 7 + hash(i, 3) * 3, i)); } island.position.set(-70, -0.5, -150); sea.add(island);
  const hero = tallShip({ variant: 'copper' }); sea.add(hero);
  const fouled = [0, 1].map(() => tallShip({ variant: 'fouled' })); fouled.forEach((s) => sea.add(s));
  const enemies = [0, 1, 2].map(() => tallShip({ enemy: true })); enemies.forEach((s) => sea.add(s));
  const smoke = []; for (let i = 0; i < 40; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(235,235,235,1)', 'rgba(200,200,200,0)'), transparent: true, depthWrite: false })); s.visible = false; sea.add(s); smoke.push(s); }
  const balls = []; for (let i = 0; i < 12; i++) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), toon(0x1a1a1a)); b.visible = false; sea.add(b); balls.push(b); }
  const splashes = []; for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 1.6, 1, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.85, roughness: 0.9, side: THREE.DoubleSide })); s.geometry.translate(0, 0.5, 0); s.visible = false; sea.add(s); splashes.push(s); }
  const wakes = []; for (let i = 0; i < 90; i++) { const w = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,255,255,0.9)', 'rgba(255,255,255,0)'), transparent: true, depthWrite: false })); w.visible = false; sea.add(w); wakes.push(w); }

  // ===== UNDERWATER HULL SET =====
  const under = new THREE.Group(); under.position.x = UNDER_X; scene.add(under);
  const uwSky = skyDome(0x2ab0d8, 0x0a5a7a, 0x02202a, 200); under.add(uwSky);
  const surfN = normalTex(256, [[5, 1], [11, 0.5]], [1, 1], 3); surfN.repeat.set(8, 8);
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshStandardMaterial({ color: 0x8ae0f0, roughness: 0.1, normalMap: surfN, side: THREE.DoubleSide, emissive: 0x3aa0c0, emissiveIntensity: 0.7 })); surf.rotation.x = -Math.PI / 2; surf.position.y = 9; under.add(surf);
  const rayTex = canvasTex(64, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, 'rgba(200,245,255,0.9)'); g.addColorStop(1, 'rgba(200,245,255,0)'); c.fillStyle = g; c.fillRect(0, 0, 64, 256); });
  for (let i = 0; i < 18; i++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(1.5 + hash(i, 1) * 3, 40), new THREE.MeshBasicMaterial({ map: rayTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.16, side: THREE.DoubleSide, fog: false })); r.position.set((hash(i, 3) - 0.5) * 60, -11, (hash(i, 4) - 0.5) * 40); r.rotation.set(0.12, hash(i, 5) * 3, 0.18); under.add(r); }
  const motes = new THREE.Points(new THREE.BufferGeometry().setFromPoints(Array.from({ length: 1200 }, (_, i) => new THREE.Vector3((hash(i, 1) - 0.5) * 50, (hash(i, 2) - 0.6) * 30, (hash(i, 3) - 0.5) * 40))), new THREE.PointsMaterial({ color: 0xcff4ff, size: 0.06, transparent: true, opacity: 0.6 })); under.add(motes);
  const uFouled = tallShip({ variant: 'fouled' }); uFouled.position.set(-5, 6.6, 0); under.add(uFouled);
  const uCopper = tallShip({ variant: 'copper' }); uCopper.position.set(5.5, 6.6, -2); under.add(uCopper);
  const copperGlow = new THREE.PointLight(0x9ae8ff, 40, 16, 1.2); copperGlow.position.set(9, 1.5, 2); under.add(copperGlow);
  const weeds = []; for (let i = 0; i < 40; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.25, 1.2 + hash(i, 1) * 1.6, 1, 4), new THREE.MeshStandardMaterial({ color: [0x3a7a2a, 0x5a9a3a, 0x2a5a20][i % 3], side: THREE.DoubleSide, roughness: 0.9 })); w.geometry.translate(0, -(0.6 + hash(i, 1) * 0.8), 0); w.position.set(-5 + (hash(i, 2) - 0.5) * 3.2, 3.6 + hash(i, 3) * 0.6, (hash(i, 4) - 0.5) * 18); w.userData.p = hash(i, 5) * 6; under.add(w); weeds.push(w); }
  const wormT = [new THREE.CanvasTexture(wormCanvas(false)), new THREE.CanvasTexture(wormCanvas(true))]; wormT.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));
  const worms = []; for (let i = 0; i < 9; i++) { const w = new THREE.Sprite(new THREE.SpriteMaterial({ map: wormT[0] })); w.scale.set(0.9, 1.35, 1); w.userData = { x: -5 + (hash(i, 1) - 0.5) * 2.4, z: -6 + i * 1.5, p: hash(i, 2) * 6 }; under.add(w); worms.push(w); }
  const bounceWorm = new THREE.Sprite(new THREE.SpriteMaterial({ map: wormT[0] })); bounceWorm.scale.set(1.0, 1.5, 1); under.add(bounceWorm);
  const holeTex = canvasTex(64, 64, (c) => { c.fillStyle = '#120a06'; c.beginPath(); c.arc(32, 32, 26, 0, 7); c.fill(); c.strokeStyle = '#3a2a1a'; c.lineWidth = 6; c.stroke(); });
  const holes = []; for (let i = 0; i < 30; i++) { const h = new THREE.Mesh(new THREE.CircleGeometry(0.18 + hash(i, 1) * 0.12, 16), new THREE.MeshBasicMaterial({ map: holeTex, transparent: true })); h.rotation.x = Math.PI / 2; h.position.set(-5 + (hash(i, 2) - 0.5) * 2.2, 4.62, -8 + hash(i, 3) * 16); h.visible = false; under.add(h); holes.push(h); }
  const bubbleTex = canvasTex(64, 64, (c) => { c.strokeStyle = 'rgba(230,250,255,0.95)'; c.lineWidth = 5; c.beginPath(); c.arc(32, 32, 24, 0, 7); c.stroke(); });
  const bubbles = []; for (let i = 0; i < 90; i++) { const b = new THREE.Sprite(new THREE.SpriteMaterial({ map: bubbleTex, transparent: true, depthWrite: false })); b.visible = false; under.add(b); bubbles.push(b); }

  return { scene, sky, hemi, sun, clouds, gulls, yard, yShip, plates, sparks, yardFlag, harborN, sea, seaN, ocean, island, hero, fouled, enemies, smoke, balls, splashes, wakes, under, surfN, motes, uFouled, uCopper, weeds, worms, wormT, bounceWorm, holes, bubbles };
}
