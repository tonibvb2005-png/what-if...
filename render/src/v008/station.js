// Tokyo 1955 rush hour: colourful platform, commuter train with sliding doors, city + Mt Fuji.
import * as THREE from 'three';
import { toon, outline, box, hash, skyDome, cloudSprite, glowTexture, canvasTex } from '../world.js';

const INK = '#151012';
const tiled = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };

function tileTex(base, grout = '#e8f0e8', cols = 8, rows = 8, size = 256) {
  return canvasTex(size, size, (c) => { c.fillStyle = grout; c.fillRect(0, 0, size, size); const w = size / cols, h = size / rows; for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) { const v = 0.93 + hash(r, k) * 0.12; const col = new THREE.Color(base).multiplyScalar(v); c.fillStyle = '#' + col.getHexString(); c.fillRect(k * w + 2, r * h + 2, w - 4, h - 4); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(k * w + 3, r * h + 3, w - 8, 3); } });
}
function adTex(i) {
  const pal = [['#ff5a5a', '#fff2a8', 'ラーメン', 'RAMEN'], ['#3a8ae8', '#ffffff', 'カメラ', 'CAMERA'], ['#ffc83a', '#c8202a', 'キャラメル', 'CARAMEL'], ['#3ac87a', '#ffffff', 'お茶', 'GREEN TEA'], ['#e85ab0', '#ffffff', 'ラジオ', 'RADIO'], ['#7a5ae8', '#ffe85a', 'ソーダ', 'SODA']][i % 6];
  return canvasTex(256, 360, (c) => {
    c.fillStyle = pal[0]; c.fillRect(0, 0, 256, 360); c.strokeStyle = INK; c.lineWidth = 12; c.strokeRect(6, 6, 244, 348);
    c.fillStyle = 'rgba(255,255,255,0.25)'; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(128, 170); c.arc(128, 170, 260, k * Math.PI / 4, k * Math.PI / 4 + 0.3); c.fill(); }
    c.fillStyle = pal[1]; c.beginPath(); c.arc(128, 160, 70, 0, 7); c.fill(); c.lineWidth = 8; c.strokeStyle = INK; c.stroke();
    c.fillStyle = INK; c.beginPath(); c.arc(105, 150, 9, 0, 7); c.arc(151, 150, 9, 0, 7); c.fill(); c.beginPath(); c.arc(128, 175, 26, 0.1 * Math.PI, 0.9 * Math.PI); c.lineWidth = 7; c.stroke();
    c.fillStyle = pal[1]; c.font = '900 44px "WenQuanYi Zen Hei", sans-serif'; c.textAlign = 'center'; c.fillText(pal[2], 128, 285); c.font = '900 30px Montserrat, sans-serif'; c.fillText(pal[3], 128, 330);
  });
}
function signTex(top, bottom, bg = '#ffffff', fg = '#1a1a1a', stripe = '#3ab04a') {
  return canvasTex(512, 160, (c) => { c.fillStyle = bg; c.fillRect(0, 0, 512, 160); c.fillStyle = stripe; c.fillRect(0, 118, 512, 42); c.strokeStyle = INK; c.lineWidth = 10; c.strokeRect(5, 5, 502, 150); c.fillStyle = fg; c.textAlign = 'center'; c.font = '900 66px "WenQuanYi Zen Hei", sans-serif'; c.fillText(top, 256, 82); c.fillStyle = '#ffffff'; c.font = '900 30px Montserrat, sans-serif'; c.fillText(bottom, 256, 150); });
}
// clock face texture (hours, minutes) drawn on demand
export function clockFace() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; let last = '';
  const draw = (hh, mm) => { const key = hh.toFixed(3) + mm.toFixed(2); if (key === last) return; last = key; const x = cv.getContext('2d'); x.clearRect(0, 0, 256, 256); x.fillStyle = '#ffffff'; x.beginPath(); x.arc(128, 128, 118, 0, 7); x.fill(); x.lineWidth = 14; x.strokeStyle = INK; x.stroke(); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; x.lineWidth = i % 3 ? 5 : 10; x.beginPath(); x.moveTo(128 + Math.sin(a) * 88, 128 - Math.cos(a) * 88); x.lineTo(128 + Math.sin(a) * 104, 128 - Math.cos(a) * 104); x.stroke(); }
    const ha = (hh % 12 + mm / 60) / 12 * Math.PI * 2, ma = mm / 60 * Math.PI * 2; x.lineCap = 'round'; x.lineWidth = 14; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(ha) * 54, 128 - Math.cos(ha) * 54); x.stroke(); x.lineWidth = 9; x.beginPath(); x.moveTo(128, 128); x.lineTo(128 + Math.sin(ma) * 86, 128 - Math.cos(ma) * 86); x.stroke(); x.fillStyle = '#e8202a'; x.beginPath(); x.arc(128, 128, 10, 0, 7); x.fill(); tex.needsUpdate = true; };
  draw(8, 0); return { tex, draw };
}

function carSideTex(len, stripe) {
  return canvasTex(1024, 160, (c) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, 1024, 160); c.fillStyle = stripe; c.fillRect(0, 96, 1024, 24); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, 150, 1024, 10); c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(0, 6, 1024, 6); });
}
function car(stripe, idx, lead) {
  const g = new THREE.Group(); const L = 20, doorsX = [-6, 0, 6], DW = 1.5, DH = 2.25, y0 = 0.15, H = 3.0, zf = -0.3;
  const bodyM = toon(0xffffff, { map: carSideTex(L, stripe), roughness: 0.5 });
  const edges = [-L / 2, ...doorsX.flatMap((d) => [d - DW / 2, d + DW / 2]), L / 2];
  const winTex = canvasTex(256, 128, (c) => { c.fillStyle = '#9ad0f0'; c.fillRect(0, 0, 256, 128); c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(20, 128); c.lineTo(90, 0); c.lineTo(130, 0); c.lineTo(60, 128); c.fill(); c.strokeStyle = '#3a3a44'; c.lineWidth = 14; c.strokeRect(7, 7, 242, 114); c.beginPath(); c.moveTo(128, 0); c.lineTo(128, 128); c.stroke(); });
  const winM = new THREE.MeshStandardMaterial({ map: winTex, transparent: true, opacity: 0.55, roughness: 0.05, metalness: 0.2 });
  for (let i = 0; i < edges.length; i += 2) {
    const a = edges[i], b = edges[i + 1], w = b - a;
    const seg = new THREE.Mesh(new THREE.BoxGeometry(w, H, 0.14), bodyM); seg.position.set((a + b) / 2, y0 + H / 2, zf); seg.castShadow = true; outline(seg, 0.03); g.add(seg);
    const n = Math.max(1, Math.floor(w / 1.6));
    for (let k = 0; k < n; k++) { const wx = a + (k + 0.5) * w / n; const wm = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(1.3, w / n - 0.25), 0.95), winM); wm.position.set(wx, y0 + 1.95, zf + 0.08); g.add(wm); }
  }
  for (const d of doorsX) { const lin = new THREE.Mesh(new THREE.BoxGeometry(DW, H - DH, 0.14), bodyM); lin.position.set(d, y0 + DH + (H - DH) / 2, zf); outline(lin, 0.03); g.add(lin); }
  // roof, floor, back wall, ends
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, L, 16, 1, false, -Math.PI / 2, Math.PI), toon(0x8a8a92)); roof.rotation.z = Math.PI / 2; roof.scale.set(0.25, 1, 1); roof.position.set(0, y0 + H, zf - 1.55); outline(roof, 0.03); g.add(roof);
  g.add(box(L, 0.14, 3.2, 0x6a6a72, [0, y0, zf - 1.55], 0.02));
  const inner = new THREE.Mesh(new THREE.BoxGeometry(L, H, 0.1), toon(0xd8d4c8)); inner.position.set(0, y0 + H / 2, zf - 3.1); g.add(inner);
  for (const s of [-1, 1]) g.add(box(0.14, H, 3.2, 0xf4ecd8, [s * L / 2, y0 + H / 2, zf - 1.55], 0.03));
  g.add(box(L, 0.5, 3.0, 0x2a2a30, [0, -0.15, zf - 1.55], 0));
  for (let k = -4; k <= 4; k++) { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 16), toon(0x2a2a30)); w.rotation.x = Math.PI / 2; w.position.set(k * 2.2, -0.35, zf + 0.05); g.add(w); }
  // straps + seats inside
  for (let k = -9; k <= 9; k += 1.2) { g.add(box(0.03, 0.4, 0.03, 0xc8c8c8, [k, y0 + 2.6, zf - 1.0], 0)); const r = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.025, 6, 12), toon(0xf4f4f4)); r.position.set(k, y0 + 2.35, zf - 1.0); g.add(r); }
  g.add(box(L - 1, 0.45, 0.6, 0x3a8a4a, [0, y0 + 0.45, zf - 2.75], 0.02));
  const lightM = new THREE.MeshBasicMaterial({ color: 0xfff8e0 }); g.add(new THREE.Mesh(new THREE.BoxGeometry(L - 1, 0.06, 0.2), lightM).translateY(y0 + 2.9).translateZ(zf - 1.55));
  const lamp = new THREE.PointLight(0xfff0d0, 5, 8, 1.4); lamp.position.set(0, y0 + 2.5, zf - 1.6); g.add(lamp);
  // number plate
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.4), new THREE.MeshBasicMaterial({ map: canvasTex(128, 72, (c) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 128, 72); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(3, 3, 122, 66); c.fillStyle = INK; c.font = '900 46px Montserrat'; c.textAlign = 'center'; c.fillText(String(idx + 1), 64, 54); }) })); num.position.set(-8.6, y0 + 2.6, zf + 0.08); g.add(num);
  // doors (2 panels each)
  const doorTex = canvasTex(128, 256, (c) => { c.fillStyle = '#e8e0cc'; c.fillRect(0, 0, 128, 256); c.fillStyle = stripe; c.fillRect(0, 150, 128, 16); c.fillStyle = 'rgba(0,0,0,0)'; c.clearRect(18, 22, 92, 100); c.strokeStyle = '#3a3a44'; c.lineWidth = 10; c.strokeRect(18, 22, 92, 100); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(3, 3, 122, 250); });
  const glassM = new THREE.MeshStandardMaterial({ color: 0xbfe6ff, transparent: true, opacity: 0.28, roughness: 0.02, metalness: 0.3 });
  const doors = doorsX.map((d) => { const panels = [-1, 1].map((s) => { const p = new THREE.Group(); const m = new THREE.Mesh(new THREE.PlaneGeometry(DW / 2, DH), new THREE.MeshStandardMaterial({ map: doorTex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.5 })); p.add(m); const gl = new THREE.Mesh(new THREE.PlaneGeometry(DW / 2 * 0.72, DH * 0.39), glassM); gl.position.set(0, DH * 0.17, 0.005); p.add(gl); p.position.set(d + s * DW / 4, y0 + DH / 2, zf + 0.09); p.userData.s = s; g.add(p); return p; }); return { x: d, panels }; });
  if (lead) { const nose = box(0.6, H, 3.2, 0xf4ecd8, [L / 2 + 0.3, y0 + H / 2, zf - 1.55], 0.04); g.add(nose); const lampF = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,250,220,1)', 'rgba(255,220,150,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); lampF.position.set(L / 2 + 0.7, y0 + 0.9, zf - 0.5); lampF.scale.setScalar(1.2); g.add(lampF); }
  g.userData = { doors, DW };
  return g;
}

function building(w, h, d, col, seed) {
  const t = canvasTex(128, 256, (c) => { c.fillStyle = col; c.fillRect(0, 0, 128, 256); for (let r = 0; r < 10; r++) for (let k = 0; k < 4; k++) { c.fillStyle = hash(r + seed, k) > 0.3 ? '#2a3a58' : '#ffe8a0'; c.fillRect(10 + k * 30, 12 + r * 24, 18, 14); } c.fillStyle = 'rgba(0,0,0,0.15)'; c.fillRect(0, 0, 6, 256); });
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), toon(0xffffff, { map: t })); m.position.y = h / 2; m.castShadow = true; outline(m, 0.08);
  const g = new THREE.Group(); g.add(m);
  if (seed % 3 === 0) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.3, h * 0.5), new THREE.MeshBasicMaterial({ map: canvasTex(64, 160, (c) => { c.fillStyle = ['#e8202a', '#2a6ad8', '#f2c23a'][seed % 3 === 0 ? (seed / 3) % 3 | 0 : 0]; c.fillRect(0, 0, 64, 160); c.fillStyle = '#ffffff'; c.font = '900 40px "WenQuanYi Zen Hei"'; c.textAlign = 'center'; ['東', '京', '銀'].forEach((ch, i) => c.fillText(ch, 32, 46 + i * 50)); }) })); sg.position.set(w / 2 + 0.02, h * 0.6, 0); sg.rotation.y = Math.PI / 2; g.add(sg); }
  return g;
}

export function buildStation() {
  const scene = new THREE.Scene();
  const sky = skyDome(0x4a9af0, 0xffe0c8, 0xffe0c8); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x8a7a6a, 0.75); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dc, 3.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.userData.dir = new THREE.Vector3(-0.45, 0.62, 0.62).normalize(); scene.add(sun, sun.target);
  const clouds = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const cl = cloudSprite(i, 18 + hash(i, 9) * 12); cl.position.set(Math.cos(a) * 240, 50 + hash(i, 2) * 50, Math.sin(a) * 240); scene.add(cl); clouds.push(cl); }
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), toon(0xffffff, { map: tiled(canvasTex(256, 256, (c) => { c.fillStyle = '#9ab07a'; c.fillRect(0, 0, 256, 256); c.fillStyle = '#c8c0b0'; c.fillRect(0, 0, 256, 26); c.fillRect(0, 0, 26, 256); for (let i = 0; i < 40; i++) { c.fillStyle = ['#e8d0b0', '#c8d8e8', '#f0c8a8'][i % 3]; c.fillRect(40 + hash(i, 1) * 190, 40 + hash(i, 2) * 190, 18, 18); } }), 120, 120) })); ground.rotation.x = -Math.PI / 2; ground.position.y = -1.3; ground.receiveShadow = true; scene.add(ground);

  // ===== PLATFORM =====
  const plat = new THREE.Group(); scene.add(plat);
  const pf = new THREE.Mesh(new THREE.BoxGeometry(90, 1.3, 9.5), [toon(0x9a968c), toon(0x9a968c), toon(0xffffff, { map: tiled(tileTex('#d8d4c8', '#b8b4a8', 4, 4), 45, 5) }), toon(0x9a968c), toon(0x8a867c), toon(0x8a867c)]);
  pf.position.set(0, -0.65, 4.75); pf.receiveShadow = true; plat.add(pf);
  const tact = new THREE.Mesh(new THREE.PlaneGeometry(90, 0.35), toon(0xffffff, { map: tiled(canvasTex(64, 64, (c) => { c.fillStyle = '#f2c81a'; c.fillRect(0, 0, 64, 64); c.fillStyle = '#d8a810'; for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) { c.beginPath(); c.arc(8 + i * 16, 8 + k * 16, 5, 0, 7); c.fill(); } }), 250, 1) })); tact.rotation.x = -Math.PI / 2; tact.position.set(0, 0.012, 0.85); tact.receiveShadow = true; plat.add(tact);
  plat.add(box(90, 0.02, 0.12, 0xffffff, [0, 0.01, 0.2], 0));
  // track bed + rails
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(400, 8), toon(0xffffff, { map: tiled(canvasTex(128, 128, (c) => { c.fillStyle = '#7a7268'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 400; i++) { c.fillStyle = ['#6a625a', '#8a8278', '#5a5450'][i % 3]; c.fillRect(hash(i, 1) * 128, hash(i, 2) * 128, 4, 3); } c.fillStyle = '#5a3a24'; c.fillRect(0, 50, 128, 28); }), 200, 4) })); bed.rotation.x = -Math.PI / 2; bed.position.set(0, -1.28, -2.2); bed.receiveShadow = true; plat.add(bed);
  for (const z of [-1.4, -2.9]) plat.add(box(400, 0.12, 0.12, 0xb8b8c0, [0, -1.15, z], 0));
  // far side wall across the tracks (colourful ads)
  const farWall = new THREE.Mesh(new THREE.BoxGeometry(90, 6, 0.4), toon(0xffffff, { map: tiled(tileTex('#7ad0b8', '#d8f0e8', 10, 6), 12, 1) })); farWall.position.set(0, 1.7, -6.4); plat.add(farWall);
  for (let i = 0; i < 14; i++) { const ad = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.25), toon(0xffffff, { map: adTex(i) })); ad.position.set(-30 + i * 4.6, 1.8, -6.18); plat.add(ad); }
  // back wall behind the platform
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(90, 5.5, 0.4), toon(0xffffff, { map: tiled(tileTex('#8ad8a8', '#e8f8ee', 10, 6), 12, 1) })); backWall.position.set(0, 2.75, 9.6); plat.add(backWall);
  for (let i = 0; i < 12; i++) { const ad = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 2.0), toon(0xffffff, { map: adTex(i + 3) })); ad.position.set(-28 + i * 5, 2.4, 9.38); ad.rotation.y = Math.PI; plat.add(ad); }
  // vending machines
  for (const [x, col] of [[-6, 0xe8302a], [-4.9, 0x2a6ae8], [7.5, 0xf2a21a], [16, 0xe8302a]]) { const vm = box(1.0, 2.0, 0.8, col, [x, 1.0, 8.9], 0.04); plat.add(vm); const pan = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.9), new THREE.MeshBasicMaterial({ map: canvasTex(64, 72, (c) => { c.fillStyle = '#e8f4ff'; c.fillRect(0, 0, 64, 72); for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) { c.fillStyle = ['#e8302a', '#2a8a4a', '#f2c23a', '#2a6ae8'][(r + k) % 4]; c.fillRect(6 + k * 14, 8 + r * 22, 9, 16); } }) })); pan.position.set(x, 1.35, 8.49); pan.rotation.y = Math.PI; plat.add(pan); }
  // canopy roof + pillars + hanging signs + lights
  const roof = box(90, 0.25, 10, 0xe8e4dc, [0, 5.2, 4.6], 0.04); plat.add(roof);
  const lightM = new THREE.MeshBasicMaterial({ color: 0xfffbe8 });
  for (let x = -40; x <= 40; x += 4) plat.add(new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.06, 0.18), lightM).translateX(x).translateY(5.05).translateZ(4.5));
  const pillars = [];
  for (let x = -36; x <= 36; x += 8) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 5.2, 12), toon(0x2aa86a)); p.position.set(x, 2.6, 4.6); p.castShadow = true; outline(p, 0.03); plat.add(p); pillars.push(p); }
  const sgnM = new THREE.MeshStandardMaterial({ map: signTex('新宿', 'SHINJUKU'), roughness: 0.5 });
  for (const x of [-12, 4, 20]) { const s = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.82, 0.08), sgnM); s.position.set(x, 4.2, 4.6); plat.add(s); for (const d of [-1, 1]) plat.add(box(0.04, 0.6, 0.04, 0x3a3a40, [x + d * 1.0, 4.85, 4.6], 0)); }
  const clock = clockFace();
  const clk = new THREE.Mesh(new THREE.CircleGeometry(0.55, 32), new THREE.MeshBasicMaterial({ map: clock.tex })); clk.position.set(-4, 3.9, 4.32); clk.rotation.y = Math.PI; plat.add(clk);
  const clk2 = clk.clone(); clk2.position.set(-4, 3.9, 4.88); clk2.rotation.y = 0; plat.add(clk2); plat.add(box(0.06, 0.8, 0.06, 0x3a3a40, [-4, 4.7, 4.6], 0));
  plat.add(box(1.25, 1.25, 0.5, 0x2a2a30, [-4, 3.9, 4.6], 0.03));
  // benches
  for (const x of [-20, 12, 24]) { plat.add(box(2.4, 0.12, 0.6, 0x3a8ad8, [x, 0.5, 8.0], 0.02)); plat.add(box(2.4, 0.6, 0.1, 0x3a8ad8, [x, 0.85, 8.3], 0.02)); }
  const platLights = []; for (const x of [-16, -4, 8]) { const l = new THREE.PointLight(0xfff4dc, 6, 12, 1.4); l.position.set(x, 4.6, 4); plat.add(l); platLights.push(l); }

  // ===== TRAIN =====
  const train = new THREE.Group(); scene.add(train);
  const cars = [0, 1, 2, 3, 4].map((i) => { const c = car('#e8701a', i, i === 4); c.position.x = i * 20.3; train.add(c); return c; });

  // ===== CITY + FUJI =====
  const city = new THREE.Group(); scene.add(city);
  const cols = ['#e8d0b0', '#c8d8e8', '#f0c8a8', '#d8e8c8', '#e8c8d8', '#f4e4a8'];
  for (let i = 0; i < 160; i++) { const a = hash(i, 1) * Math.PI * 2, r = 30 + hash(i, 2) * 170; const x = Math.cos(a) * r, z = Math.sin(a) * r - 10; if (z > -12 && z < 22 && Math.abs(x) < 50) continue; const b = building(5 + hash(i, 3) * 6, 6 + hash(i, 4) * 18, 5 + hash(i, 5) * 6, cols[i % 6], i); b.position.set(x, -1.3, z); city.add(b); }
  const fuji = new THREE.Mesh(new THREE.ConeGeometry(170, 110, 48), toon(0xffffff, { map: canvasTex(256, 256, (c) => { const g = c.createLinearGradient(0, 0, 0, 256); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, '#ffffff'); g.addColorStop(0.36, '#6a8ac8'); g.addColorStop(1, '#4a6aa8'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); }), fog: false })); fuji.position.set(-60, 20, -560); scene.add(fuji);
  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,240,200,1)', 'rgba(255,180,120,0)'), fog: false, depthWrite: false })); sunDisc.position.set(120, 80, -380); sunDisc.scale.setScalar(120); scene.add(sunDisc);

  return { scene, ground, sky, hemi, sun, clouds, plat, train, cars, city, clock, platLights, pillars };
}
