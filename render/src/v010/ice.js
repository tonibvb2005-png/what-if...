// Ice trade 1806: snowy Boston pond, ship at sea + cargo hold, colourful Caribbean harbour.
import * as THREE from 'three';
import { toon, outline, box, hash, skyDome, cloudSprite, glowTexture, canvasTex } from '../world.js';
import { waterMaterial } from '../effects.js';
import { tallShip } from '../v005/ships.js';

export const POND_X = 0, SEA_X = 400, HOLD_X = -400, ISLE_X = 800;
const INK = '#151012';
const tiled = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };

export const iceMat = new THREE.MeshStandardMaterial({ color: 0xa8dcff, roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.88, emissive: 0x2a6a9a, emissiveIntensity: 0.25 });
export function iceBlock(w = 0.9, h = 0.6, d = 0.6) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), iceMat); m.castShadow = true; outline(m, 0.025);
  const hl = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.6, h * 0.2), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })); hl.position.set(-w * 0.1, h * 0.25, d / 2 + 0.005); hl.rotation.z = 0.2; m.add(hl);
  return m;
}
function planks(base = '#8a5a32') { return canvasTex(256, 256, (c) => { c.fillStyle = base; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { const v = hash(i, 7); c.fillStyle = v > 0.5 ? `rgba(255,230,190,${(v - 0.5) * 0.3})` : `rgba(30,15,5,${(0.5 - v) * 0.5})`; c.fillRect(0, i * 32, 256, 32); } c.strokeStyle = 'rgba(30,15,5,0.7)'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(256, i * 32); c.stroke(); } }); }
function usFlag() { return canvasTex(300, 160, (c) => { for (let i = 0; i < 13; i++) { c.fillStyle = i % 2 ? '#ffffff' : '#c8202a'; c.fillRect(0, i * 160 / 13, 300, 160 / 13 + 1); } c.fillStyle = '#1e2a6a'; c.fillRect(0, 0, 130, 86); c.fillStyle = '#ffffff'; for (let i = 0; i < 15; i++) { c.beginPath(); c.arc(14 + (i % 5) * 25, 14 + Math.floor(i / 5) * 28, 5, 0, 7); c.fill(); } }); }
function snowHouse(col, roofSnow = true) {
  const g = new THREE.Group(); const w = 5, h = 4, d = 4.5;
  const b = box(w, h, d, col, [0, h / 2, 0], 0.05); b.castShadow = true; g.add(b);
  const rs = new THREE.Shape(); rs.moveTo(-w / 2 - 0.3, 0); rs.lineTo(w / 2 + 0.3, 0); rs.lineTo(0, 2.4); rs.closePath();
  const rf = new THREE.Mesh(new THREE.ExtrudeGeometry(rs, { depth: d + 0.6, bevelEnabled: false }), toon(roofSnow ? 0xf4f8ff : 0x5a3a2a)); rf.position.set(0, h, -d / 2 - 0.3); outline(rf, 0.05); g.add(rf);
  for (const x of [-1.4, 1.4]) { const wnd = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ color: 0xffe08a })); wnd.position.set(x, 2.2, d / 2 + 0.01); g.add(wnd); g.add(box(1.1, 0.12, 0.1, 0xffffff, [x, 1.6, d / 2 + 0.05], 0.01)); }
  g.add(box(1.0, 1.8, 0.05, 0x2a3a5a, [0, 0.9, d / 2 + 0.02], 0.02));
  g.add(box(0.7, 1.6, 0.7, 0x8a4a3a, [1.4, h + 1.6, 0], 0.03));
  return g;
}
function pine(x, z, s = 1, snow = true) {
  const g = new THREE.Group(); g.add(box(0.3 * s, 1 * s, 0.3 * s, 0x5a3a22, [0, 0.5 * s, 0], 0));
  for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry((1.6 - k * 0.4) * s, 1.8 * s, 8), toon(0x2a7a4a)); c.position.y = (1.4 + k * 1.0) * s; c.castShadow = true; outline(c, 0.04 * s); g.add(c); if (snow) { const sc = new THREE.Mesh(new THREE.ConeGeometry((0.9 - k * 0.2) * s, 0.7 * s, 8), toon(0xf4f8ff)); sc.position.y = (1.95 + k * 1.0) * s; g.add(sc); } }
  g.position.set(x, 0, z); return g;
}
function palm(x, z, h, s = 1) {
  const g = new THREE.Group(); let px = 0, py = 0;
  for (let i = 0; i < 6; i++) { const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.28 - i * 0.03, 0.32 - i * 0.03, h / 6, 7), toon(0x9a6a3a)); px += 0.15; seg.position.set(px, py + h / 12, 0); seg.rotation.z = -0.15; outline(seg, 0.03); g.add(seg); py += h / 6; }
  for (let i = 0; i < 7; i++) { const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), toon(i % 2 ? 0x3fb34d : 0x2f9a3e)); leaf.scale.set(2.4, 0.14, 0.55); const p = new THREE.Group(); p.position.set(px, py, 0); p.rotation.y = i / 7 * Math.PI * 2; leaf.position.set(1.9, -0.35, 0); leaf.rotation.z = -0.35; outline(leaf, 0.05); p.add(leaf); g.add(p); }
  g.position.set(x, 0, z); g.scale.setScalar(s); return g;
}
function isleHouse(col, trim, seed) {
  const g = new THREE.Group(); const w = 5, h = 6, d = 5;
  const b = box(w, h, d, col, [0, h / 2, 0], 0.05); b.castShadow = true; g.add(b);
  const rf = box(w + 0.6, 0.35, d + 0.6, 0xc8582a, [0, h + 0.15, 0], 0.04); g.add(rf);
  const shutter = canvasTex(64, 96, (c) => { c.fillStyle = trim; c.fillRect(0, 0, 64, 96); c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 3; for (let y = 8; y < 96; y += 10) { c.beginPath(); c.moveTo(4, y); c.lineTo(60, y); c.stroke(); } c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(3, 3, 58, 90); });
  for (const [x, y] of [[-1.4, 1.6], [1.4, 1.6], [-1.4, 4.3], [1.4, 4.3]]) { const s = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.5), toon(0xffffff, { map: shutter })); s.position.set(x, y, d / 2 + 0.01); g.add(s); }
  g.add(box(w + 0.2, 0.15, 1.2, 0xf4f0e6, [0, 3.0, d / 2 + 0.6], 0.02));
  for (let i = 0; i < 9; i++) g.add(box(0.06, 0.8, 0.06, 0xf4f0e6, [-w / 2 + 0.3 + i * 0.55, 3.45, d / 2 + 1.15], 0)); g.add(box(w + 0.2, 0.08, 0.08, 0xf4f0e6, [0, 3.85, d / 2 + 1.15], 0));
  return g;
}

export function buildIce() {
  const scene = new THREE.Scene();
  const sky = skyDome(0x6ab0f0, 0xffe8d8, 0xffe8d8); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xe8f4ff, 0x9a8a7a, 0.75); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0dc, 3.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.userData.dir = new THREE.Vector3(-0.4, 0.6, 0.6).normalize(); scene.add(sun, sun.target);
  const clouds = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const cl = cloudSprite(i, 18 + hash(i, 9) * 12); cl.position.set(Math.cos(a) * 240, 50 + hash(i, 2) * 50, Math.sin(a) * 240); cl.userData.x0 = cl.position.x; scene.add(cl); clouds.push(cl); }

  // ===== BOSTON POND =====
  const pond = new THREE.Group(); pond.position.x = POND_X; scene.add(pond);
  const snowT = tiled(canvasTex(256, 256, (c) => { c.fillStyle = '#eef4fc'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 900; i++) { c.fillStyle = ['#dce8f6', '#ffffff', '#e4eefa'][i % 3]; c.beginPath(); c.arc(hash(i, 1) * 256, hash(i, 2) * 256, 2 + hash(i, 3) * 6, 0, 7); c.fill(); } }), 30, 30);
  const snowG = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), toon(0xffffff, { map: snowT, roughness: 0.9 })); snowG.rotation.x = -Math.PI / 2; snowG.receiveShadow = true; pond.add(snowG);
  const iceT = canvasTex(512, 512, (c) => { c.fillStyle = '#9ad0ee'; c.fillRect(0, 0, 512, 512); for (let i = 0; i < 40; i++) { c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 2; c.beginPath(); let x = hash(i, 1) * 512, y = hash(i, 2) * 512; c.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (hash(i, k + 3) - 0.5) * 80; y += (hash(k, i) - 0.5) * 80; c.lineTo(x, y); } c.stroke(); } c.fillStyle = 'rgba(255,255,255,0.35)'; for (let i = 0; i < 12; i++) { c.beginPath(); c.ellipse(hash(i, 8) * 512, hash(i, 9) * 512, 60, 14, hash(i, 7) * 3, 0, 7); c.fill(); } c.strokeStyle = 'rgba(40,90,140,0.55)'; c.lineWidth = 4; for (let k = 0; k < 8; k++) { c.beginPath(); c.moveTo(80, 80 + k * 44); c.lineTo(432, 80 + k * 44); c.stroke(); c.beginPath(); c.moveTo(80 + k * 50, 80); c.lineTo(80 + k * 50, 388); c.stroke(); } });
  const pondM = new THREE.Mesh(new THREE.CircleGeometry(16, 48), new THREE.MeshStandardMaterial({ map: iceT, roughness: 0.12, metalness: 0.1, envMapIntensity: 1.4 })); pondM.rotation.x = -Math.PI / 2; pondM.position.set(0, 0.03, -8); pondM.receiveShadow = true; pond.add(pondM);
  const channel = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 14), waterMaterial(0x1a4a7a, { repeat: [1, 4], opacity: 0.95 })); channel.rotation.x = -Math.PI / 2; channel.position.set(1.5, 0.04, -9); pond.add(channel);
  const floating = []; for (let i = 0; i < 6; i++) { const b = iceBlock(0.95, 0.5, 0.95); b.position.set(1.5, 0.12, -4 - i * 1.6); pond.add(b); floating.push(b); }
  const stack = []; for (let r = 0; r < 3; r++) for (let k = 0; k < 5 - r; k++) { const b = iceBlock(); b.position.set(-6 + k * 0.95 + r * 0.47, 0.3 + r * 0.6, -1.5); pond.add(b); stack.push(b); }
  const iceHouse = new THREE.Group(); const ih = box(10, 7, 8, 0xb8382a, [0, 3.5, 0], 0.08); iceHouse.add(ih); const ihr = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 6.6, 3, 4, 1), toon(0xf4f8ff)); ihr.rotation.y = Math.PI / 4; ihr.scale.set(1.1, 1, 0.85); ihr.position.y = 8.5; outline(ihr, 0.06); iceHouse.add(ihr);
  iceHouse.add(box(3, 4, 0.1, 0x6a1a14, [0, 2, 4.05], 0.02)); const ihSign = new THREE.Mesh(new THREE.PlaneGeometry(6, 1), new THREE.MeshStandardMaterial({ map: canvasTex(384, 64, (c) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, 384, 64); c.strokeStyle = INK; c.lineWidth = 6; c.strokeRect(3, 3, 378, 58); c.fillStyle = '#2a1a10'; c.font = '900 40px serif'; c.textAlign = 'center'; c.fillText('TUDOR ICE CO.', 192, 46); }) })); ihSign.position.set(0, 5.4, 4.06); iceHouse.add(ihSign);
  iceHouse.position.set(-14, 0, -14); iceHouse.rotation.y = 0.5; pond.add(iceHouse);
  [[0xc8382a, -24, -34, 0.2], [0xf2c23a, -12, -40, 0], [0x3a6ab0, 4, -42, -0.1], [0x3a9a6a, 18, -36, -0.3], [0xf4ecdc, 28, -26, -0.6], [0xe8702a, -30, -18, 0.7]].forEach(([c, x, z, r]) => { const hs = snowHouse(c); hs.position.set(x, 0, z); hs.rotation.y = r; pond.add(hs); });
  for (let i = 0; i < 40; i++) { const a = hash(i, 1) * Math.PI * 2, r = 22 + hash(i, 2) * 40; pond.add(pine(Math.cos(a) * r, Math.sin(a) * r - 8, 1.4 + hash(i, 3) * 1.2)); }
  const snowPts = new THREE.BufferGeometry(); const sp = new Float32Array(1500 * 3); for (let i = 0; i < 1500; i++) { sp[i * 3] = (hash(i, 1) - 0.5) * 40; sp[i * 3 + 1] = hash(i, 2) * 14; sp[i * 3 + 2] = (hash(i, 3) - 0.5) * 40 - 4; } snowPts.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const snowFlakes = new THREE.Points(snowPts, new THREE.PointsMaterial({ color: 0xffffff, size: 0.09, transparent: true, opacity: 0.95, map: glowTexture('rgba(255,255,255,1)', 'rgba(255,255,255,0)'), depthWrite: false })); pond.add(snowFlakes);
  const newspaper = new THREE.Group(); pond.add(newspaper);

  // ===== SEA =====
  const sea = new THREE.Group(); sea.position.x = SEA_X; scene.add(sea);
  const ocean = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), waterMaterial(0x1a7ab8, { repeat: [60, 60], opacity: 1 })); ocean.rotation.x = -Math.PI / 2; ocean.position.y = -0.2; sea.add(ocean);
  const ship = tallShip({ variant: 'wood' }); ship.userData.flag.material.map = usFlag(); ship.scale.setScalar(0.7); sea.add(ship);
  const wake = []; for (let i = 0; i < 20; i++) { const f = new THREE.Mesh(new THREE.CircleGeometry(0.6, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); f.rotation.x = -Math.PI / 2; sea.add(f); wake.push(f); }

  // ===== CARGO HOLD =====
  const hold = new THREE.Group(); hold.position.x = HOLD_X; scene.add(hold);
  const hw = toon(0xffffff, { map: tiled(planks('#7a4a2a'), 3, 2) });
  for (const [w, h, d, x, y, z] of [[12, 5, 0.3, 0, 2.5, -4], [0.3, 5, 10, -6, 2.5, 0.5], [0.3, 5, 10, 6, 2.5, 0.5], [12, 0.3, 10, 0, 5, 0.5]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hw); m.position.set(x, y, z); m.receiveShadow = true; hold.add(m); }
  const hf = new THREE.Mesh(new THREE.PlaneGeometry(12, 10), toon(0xffffff, { map: tiled(planks('#6a3a1a'), 3, 3) })); hf.rotation.x = -Math.PI / 2; hf.position.set(0, 0, 0.5); hf.receiveShadow = true; hold.add(hf);
  for (let k = -2; k <= 2; k++) hold.add(box(0.35, 0.35, 10, 0x4a2a14, [k * 2.4, 4.7, 0.5], 0.02));
  const puddle = new THREE.Mesh(new THREE.PlaneGeometry(11.6, 9.6), waterMaterial(0x3a8ac8, { repeat: [3, 3], opacity: 0.8 })); puddle.rotation.x = -Math.PI / 2; puddle.position.set(0, 0.02, 0.5); hold.add(puddle);
  const holdIce = []; for (let r = 0; r < 2; r++) for (let k = 0; k < 6; k++) for (let j = 0; j < 2; j++) { const b = iceBlock(0.9, 0.6, 0.6); b.position.set(-3 + k * 1.0, 0.3 + r * 0.62, -2.6 + j * 0.7); b.userData.base = b.position.clone(); hold.add(b); holdIce.push(b); }
  const sawdustM = toon(0xe0b060); const sawdust = holdIce.map((b) => { const s = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.68, 0.7), new THREE.MeshStandardMaterial({ color: 0xe0b060, roughness: 1, map: tiled(canvasTex(64, 64, (c) => { c.fillStyle = '#e0b060'; c.fillRect(0, 0, 64, 64); for (let i = 0; i < 300; i++) { c.fillStyle = ['#c8984a', '#f0c878', '#b8883a'][i % 3]; c.fillRect(hash(i, 1) * 64, hash(i, 2) * 64, 3, 2); } }), 1, 1) })); s.position.copy(b.position); s.visible = false; outline(s, 0.02); hold.add(s); return s; });
  const holdLamp = new THREE.PointLight(0xffc880, 22, 16, 1.2); holdLamp.position.set(0, 4, 1.5); hold.add(holdLamp);
  const lampBox = box(0.4, 0.6, 0.4, 0x2a2018, [0, 4, 1.5], 0.02); hold.add(lampBox); const lampGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,220,150,1)', 'rgba(255,160,60,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); lampGlow.position.set(0, 4, 1.7); lampGlow.scale.setScalar(1.6); hold.add(lampGlow);
  const drips = []; for (let i = 0; i < 14; i++) { const d = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: 0x8ad0ff, roughness: 0.05, transparent: true, opacity: 0.9 })); d.scale.y = 1.6; hold.add(d); drips.push(d); }

  // ===== CARIBBEAN HARBOUR =====
  const isle = new THREE.Group(); isle.position.x = ISLE_X; scene.add(isle);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), toon(0xffffff, { map: tiled(canvasTex(128, 128, (c) => { c.fillStyle = '#f2dca0'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 400; i++) { c.fillStyle = ['#e8cc88', '#fae8b8', '#dcc080'][i % 3]; c.fillRect(hash(i, 1) * 128, hash(i, 2) * 128, 2, 2); } }), 20, 10) })); sand.rotation.x = -Math.PI / 2; sand.position.set(0, 0, -10); sand.receiveShadow = true; isle.add(sand);
  const lagoon = new THREE.Mesh(new THREE.PlaneGeometry(400, 300), waterMaterial(0x2ac8c8, { repeat: [30, 30], opacity: 0.95 })); lagoon.rotation.x = -Math.PI / 2; lagoon.position.set(0, -0.15, 170); isle.add(lagoon);
  const dock = box(4, 0.3, 14, 0xa87a48, [6, 0.15, 24], 0.03); isle.add(dock); for (let i = 0; i < 6; i++) for (const s of [-1, 1]) isle.add(box(0.25, 1.4, 0.25, 0x6a4a2a, [6 + s * 1.9, -0.4, 18 + i * 2.4], 0.01));
  const cols = [[0xf2a8b8, '#3ab0a0'], [0xf4d47a, '#3a6ad8'], [0x7ad8c8, '#e84a6a'], [0xf0a060, '#2a8a4a'], [0xc8a8e8, '#f2c23a'], [0xa8e080, '#e8701a']];
  for (let i = 0; i < 6; i++) { const h = isleHouse(cols[i][0], cols[i][1], i); h.position.set(-16 + i * 6.4, 0, -14 - (i % 2) * 1.2); isle.add(h); }
  for (const [x, z, hh] of [[-20, -2, 7], [-12, 4, 6], [14, 2, 8], [20, -4, 7], [-4, 10, 6.5], [24, 10, 7.5]]) isle.add(palm(x, z, hh));
  const bunting = []; for (let i = 0; i < 24; i++) { const f = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.5, 3), toon([0xe84a6a, 0xf2c23a, 0x3ab0a0, 0x3a6ad8, 0xe8701a][i % 5])); f.rotation.x = Math.PI; f.position.set(-12 + i * 1.0, 5.3 - Math.sin(i / 23 * Math.PI) * 0.8, -6); isle.add(f); bunting.push(f); }
  const table = new THREE.Group(); table.add(box(3.2, 0.12, 1.4, 0xa87a48, [0, 1.0, 0], 0.03)); for (const s of [-1, 1]) for (const t of [-1, 1]) table.add(box(0.12, 1.0, 0.12, 0x6a4a2a, [s * 1.45, 0.5, t * 0.6], 0.01)); table.add(box(3.3, 0.02, 1.5, 0xe84a6a, [0, 1.07, 0], 0));
  const bigIce = iceBlock(1.2, 0.9, 0.9); bigIce.position.set(0, 1.55, 0); table.add(bigIce);
  const glasses = []; for (let i = 0; i < 5; i++) { const g = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.09, 0.26, 12), new THREE.MeshStandardMaterial({ color: [0xf2a23a, 0xe84a6a, 0x7ac83a, 0xf2d23a, 0x3ab0e8][i], transparent: true, opacity: 0.8, roughness: 0.1 })); g.position.set(-1.2 + i * 0.6, 1.2, 0.4); table.add(g); glasses.push(g); }
  table.position.set(0, 0, 2); isle.add(table);
  const steam = []; for (let i = 0; i < 10; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,255,255,0.7)', 'rgba(255,255,255,0)'), transparent: true, depthWrite: false })); isle.add(s); steam.push(s); }
  const sunDisc = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,250,210,1)', 'rgba(255,200,100,0)'), fog: false, depthWrite: false })); sunDisc.position.set(ISLE_X - 60, 70, -220); sunDisc.scale.setScalar(110); scene.add(sunDisc);

  return { scene, sky, hemi, sun, clouds, pond, snowFlakes, floating, stack, iceHouse, sea, ocean, ship, wake, hold, puddle, holdIce, sawdust, drips, isle, table, bigIce, glasses, steam, bunting, sunDisc, snowG };
}
