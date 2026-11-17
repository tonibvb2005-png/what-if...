// Chicago 1878 firehouse (Engine Co. 21): cutaway interior with stairs, bunk room, the pole, horses + steam engine; street + burning house.
import * as THREE from 'three';
import { toon, outline, box, hash, skyDome, cloudSprite, glowTexture, canvasTex } from '../world.js';
import { horseCanvas } from '../v006/west.js';

export const UP = 4.5, POLE = new THREE.Vector3(-3, 0, -1), FIRE_POS = new THREE.Vector3(36, 0, 20);
const INK = '#151012';
const tiled = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };
function brickTex(base) { return canvasTex(256, 256, (c) => { c.fillStyle = '#d8ccb8'; c.fillRect(0, 0, 256, 256); for (let r = 0; r < 16; r++) for (let k = -1; k < 8; k++) { const v = 0.85 + hash(r, k) * 0.3; const col = new THREE.Color(base).multiplyScalar(v); c.fillStyle = '#' + col.getHexString(); c.fillRect(k * 36 + (r % 2) * 18 + 2, r * 16 + 2, 32, 12); } }); }
function planks(base) { return canvasTex(256, 256, (c) => { c.fillStyle = base; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { const v = hash(i, 7); c.fillStyle = v > 0.5 ? `rgba(255,230,190,${(v - 0.5) * 0.3})` : `rgba(30,15,5,${(0.5 - v) * 0.5})`; c.fillRect(0, i * 32, 256, 32); } c.strokeStyle = 'rgba(30,15,5,0.7)'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(0, i * 32); c.lineTo(256, i * 32); c.stroke(); } }); }
const slab = (g, x0, x1, z0, z1, m) => { const s = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, 0.3, z1 - z0), m); s.position.set((x0 + x1) / 2, UP - 0.15, (z0 + z1) / 2); s.castShadow = s.receiveShadow = true; outline(s, 0.02); g.add(s); };

function facade(num, wallCol, doorCol) {
  const g = new THREE.Group(); const W = 14, H = 10;
  const tex = tiled(brickTex(wallCol), 4, 3);
  const m = toon(0xffffff, { map: tex });
  // wall pieces around a 6x5 arched doorway
  for (const [w, h, x, y] of [[4, H, -5, H / 2], [4, H, 5, H / 2], [6, H - 5, 0, 5 + (H - 5) / 2]]) { const piece = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), m); piece.position.set(x, y, 0); g.add(piece); }
  g.children.forEach((c) => { c.castShadow = true; outline(c, 0.05); });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(3, 0.25, 6, 20, Math.PI), toon(0xf4ecdc)); arch.position.set(0, 4.6, 0.25); g.add(arch);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.2), new THREE.MeshStandardMaterial({ map: canvasTex(512, 88, (c) => { c.fillStyle = '#f4ecd8'; c.fillRect(0, 0, 512, 88); c.strokeStyle = INK; c.lineWidth = 8; c.strokeRect(4, 4, 504, 80); c.fillStyle = '#c8202a'; c.font = '900 52px serif'; c.textAlign = 'center'; c.fillText('ENGINE CO. ' + num, 256, 64); }) })); sign.position.set(0, 8.4, 0.22); g.add(sign);
  for (const x of [-5, 5]) for (const y of [7.6]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.8), new THREE.MeshBasicMaterial({ color: 0xffe0a0 })); w.position.set(x, y, 0.22); g.add(w); g.add(box(1.6, 0.15, 0.3, 0xf4ecdc, [x, y - 1, 0.3], 0.01)); }
  const doors = [-1, 1].map((s) => { const piv = new THREE.Group(); piv.position.set(s * 3, 0, 0.1); const d = new THREE.Mesh(new THREE.BoxGeometry(3, 4.4, 0.12), toon(new THREE.Color(doorCol))); d.position.set(-s * 1.5, 2.2, 0); outline(d, 0.03); piv.add(d); for (let k = 0; k < 3; k++) { const p = box(2.4, 1.0, 0.04, 0xf4ecdc, [-s * 1.5, 0.9 + k * 1.3, 0.08], 0.01); piv.add(p); } g.add(piv); return piv; });
  g.add(box(14.4, 0.6, 0.6, 0x8a3a2a, [0, H + 0.3, 0.1], 0.04));
  const tower = box(2.4, 2.4, 2.4, 0xa8483a, [0, H + 1.6, -1], 0.04); g.add(tower); const tr = new THREE.Mesh(new THREE.ConeGeometry(2, 1.6, 4), toon(0x2a5a4a)); tr.rotation.y = Math.PI / 4; tr.position.set(0, H + 3.6, -1); outline(tr, 0.04); g.add(tr);
  const dark = box(6, 5, 0.1, 0x1a1210, [0, 2.5, -0.4], 0); g.add(dark);
  g.userData.doors = doors; g.userData.dark = dark;
  return g;
}
function engine() {
  const g = new THREE.Group();
  const red = toon(0xd8202a), brass = new THREE.MeshStandardMaterial({ color: 0xe8b84a, metalness: 0.8, roughness: 0.25 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 3.2), red); body.position.y = 1.3; body.castShadow = true; outline(body, 0.03); g.add(body);
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 1.9, 20), brass); boiler.position.set(0, 2.45, -1.0); outline(boiler, 0.03); g.add(boiler);
  const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.9, 12), toon(0x1a1a1a)); stack.position.set(0, 3.8, -1.0); g.add(stack);
  const pump = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 1.2, 12), brass); pump.position.set(0.6, 1.95, 0.6); g.add(pump);
  const seat = box(1.4, 0.15, 0.8, 0x2a1a10, [0, 1.95, 1.2], 0.02); g.add(seat); g.add(box(1.4, 0.6, 0.12, 0x2a1a10, [0, 2.2, 0.85], 0.02));
  const lad = box(0.15, 0.15, 3.4, 0x8a5a32, [0.9, 1.9, 0], 0.01); g.add(lad);
  const wheels = []; for (const [z, r] of [[-1.1, 0.8], [1.1, 0.6]]) for (const s of [-1, 1]) { const w = new THREE.Group(); const t = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 6, 24), red); w.add(t); for (let k = 0; k < 8; k++) { const sp = box(0.05, r * 2, 0.05, 0xd8202a, [0, 0, 0], 0); sp.rotation.z = k * Math.PI / 8; w.add(sp); } w.rotation.y = Math.PI / 2; w.position.set(s * 0.95, r, z); g.add(w); wheels.push(w); }
  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass); bell.position.set(0, 2.5, 1.5); bell.rotation.x = Math.PI; g.add(bell);
  g.userData.wheels = wheels;
  return g;
}

export function buildFirehouse() {
  const scene = new THREE.Scene();
  const sky = skyDome(0x4a9af0, 0xffe8d0, 0xffe8d0); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xe8f0ff, 0x8a6a4a, 0.75); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0d8, 3.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.userData.dir = new THREE.Vector3(0.4, 0.7, 0.55).normalize(); scene.add(sun, sun.target);
  const clouds = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const cl = cloudSprite(i, 18 + hash(i, 9) * 12); cl.position.set(Math.cos(a) * 240, 55 + hash(i, 2) * 50, Math.sin(a) * 240); scene.add(cl); clouds.push(cl); }

  // ===== STREET =====
  const street = new THREE.Group(); scene.add(street);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), toon(0xffffff, { map: tiled(canvasTex(128, 128, (c) => { c.fillStyle = '#8a7a6a'; c.fillRect(0, 0, 128, 128); for (let i = 0; i < 300; i++) { c.fillStyle = ['#7a6a5a', '#9a8a7a', '#6a5a4a'][i % 3]; c.fillRect(hash(i, 1) * 128, hash(i, 2) * 128, 4, 3); } }), 120, 120) })); road.rotation.x = -Math.PI / 2; road.position.y = -0.01; road.receiveShadow = true; scene.add(road);
  for (const s of [-1, 1]) { const sw = new THREE.Mesh(new THREE.BoxGeometry(200, 0.2, 3), toon(0xb8b0a0)); sw.position.set(0, 0.1, s > 0 ? 8 : 28); sw.receiveShadow = true; street.add(sw); }
  const main = facade('21', '#b8382a', '#c8202a'); main.position.z = 6; scene.add(main);
  const rival = facade('7', '#6a5a5a', '#2a2a2a'); rival.position.set(-4, 0, 30); rival.rotation.y = Math.PI; street.add(rival);
  const others = [['5', '#3a6ab0', '#f2c23a', -22], ['12', '#3a8a5a', '#e8701a', 20], ['33', '#8a5aa8', '#3ab0a0', 54]].map(([n, wc, dc, x]) => { const f = facade(n, wc, dc); f.position.set(x, 0, 6); street.add(f); return f; });
  const fillers = []; for (let i = 0; i < 12; i++) { const h = 6 + hash(i, 3) * 6; const b = box(8, h, 8, [0xe8d0b0, 0xc8d8e8, 0xf0b8a0, 0xd8e8c8][i % 4], [-60 + i * 12, h / 2, 40 + (i % 2) * 2], 0.06); street.add(b); fillers.push(b); }
  // burning house down the street
  const burn = new THREE.Group(); burn.position.copy(FIRE_POS); street.add(burn);
  burn.add(box(8, 8, 8, 0xe8c8a0, [0, 4, 0], 0.06)); const br = new THREE.Mesh(new THREE.ConeGeometry(6.4, 3.4, 4), toon(0x6a3a2a)); br.rotation.y = Math.PI / 4; br.position.y = 9.7; outline(br, 0.06); burn.add(br);
  for (const [x, y] of [[-2, 2], [2, 2], [-2, 6], [2, 6]]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.6), new THREE.MeshBasicMaterial({ color: 0xff8a2a })); w.position.set(x, y, -4.02); w.rotation.y = Math.PI; burn.add(w); }
  const flameTex = canvasTex(128, 192, (c) => { const g2 = c.createRadialGradient(64, 130, 6, 64, 120, 70); g2.addColorStop(0, '#fff8c0'); g2.addColorStop(0.35, '#ffb020'); g2.addColorStop(0.75, '#ff4a10'); g2.addColorStop(1, 'rgba(255,40,0,0)'); c.fillStyle = g2; c.beginPath(); c.moveTo(64, 0); c.quadraticCurveTo(120, 90, 108, 150); c.quadraticCurveTo(64, 200, 20, 150); c.quadraticCurveTo(8, 90, 64, 0); c.fill(); });
  const flames = []; for (let i = 0; i < 26; i++) { const f = new THREE.Sprite(new THREE.SpriteMaterial({ map: flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); burn.add(f); flames.push(f); }
  const smokeTex = canvasTex(128, 128, (c) => { c.fillStyle = '#5a5058'; c.beginPath(); c.arc(64, 64, 54, 0, 7); c.fill(); c.lineWidth = 6; c.strokeStyle = '#2a2028'; c.stroke(); });
  const smoke = []; for (let i = 0; i < 16; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false })); burn.add(s); smoke.push(s); }
  const fireLight = new THREE.PointLight(0xff7a2a, 40, 30, 1.2); fireLight.position.set(0, 6, -6); burn.add(fireLight);

  // ===== INTERIOR (cutaway) =====
  const inn = new THREE.Group(); scene.add(inn);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(14, 12), toon(0xffffff, { map: tiled(planks('#7a5a3a'), 3, 3) })); fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.01, 0); fl.receiveShadow = true; inn.add(fl);
  const wallM = toon(0xffffff, { map: tiled(brickTex('#c8584a'), 4, 3) });
  for (const [w, h, d, x, y, z] of [[14, 9, 0.3, 0, 4.5, -6], [0.3, 9, 12, -7, 4.5, 0], [0.3, 9, 12, 7, 4.5, 0], [14, 0.3, 12, 0, 9, 0]]) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallM); m.position.set(x, y, z); m.receiveShadow = true; inn.add(m); }
  const floorM = toon(0xffffff, { map: tiled(planks('#9a6a3a'), 2, 2) });
  const P = POLE;
  slab(inn, -7, P.x - 0.6, -6, 6, floorM); slab(inn, P.x - 0.6, P.x + 0.6, -6, P.z - 0.6, floorM); slab(inn, P.x - 0.6, P.x + 0.6, P.z + 0.6, 6, floorM);
  slab(inn, P.x + 0.6, 2, -6, 6, floorM); slab(inn, 2, 7, -4.2, 6, floorM); slab(inn, 6.2, 7, -6, -4.2, floorM);
  // stairs (steep, narrow) from ground at x=6 up to the floor at x=2, along the back wall
  const stairs = []; for (let k = 0; k < 15; k++) { const s = box(0.32, 0.12, 1.4, 0x8a5a32, [6 - k * 0.27, (k + 1) * 0.3, -5.1], 0.01); inn.add(s); stairs.push(s); }
  inn.add(box(0.1, 1.0, 0.1, 0x5a3a1a, [6.1, 1.0, -4.4], 0)); const rail = box(4.4, 0.08, 0.08, 0x5a3a1a, [4, 2.9, -4.4], 0); rail.rotation.z = -0.82; inn.add(rail);
  // bunk room upstairs
  for (let i = 0; i < 3; i++) { const x = -0.5 + i * 2.2; inn.add(box(1.8, 0.4, 0.9, 0x6a4a2a, [x, UP + 0.3, -4.9], 0.02)); inn.add(box(1.7, 0.18, 0.85, 0xf4ecdc, [x, UP + 0.58, -4.9], 0.01)); inn.add(box(0.5, 0.15, 0.6, 0xffffff, [x - 0.55, UP + 0.72, -4.9], 0.01)); inn.add(box(1.0, 0.2, 0.86, [0xc8302a, 0x3a6ab0, 0x3a8a4a][i], [x + 0.35, UP + 0.69, -4.9], 0.01)); }
  for (let i = 0; i < 4; i++) { const hel = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0xc8202a)); hel.position.set(-6.7, UP + 1.9, -3 + i * 0.8); hel.rotation.z = -Math.PI / 2; inn.add(hel); }
  const lamps = [[-2, UP + 3.4, 0], [2, 3.6, 2], [-4, 3.6, 2]].map(([x, y, z]) => { const l = new THREE.PointLight(0xffc070, 9, 12, 1.3); l.position.set(x, y, z); inn.add(l); inn.add(box(0.3, 0.4, 0.3, 0x2a2018, [x, y, z], 0.01)); const gl = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,220,150,1)', 'rgba(255,160,60,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); gl.position.set(x, y, z + 0.2); gl.scale.setScalar(1.2); inn.add(gl); return l; });
  // the pole (wood first, brass later)
  const woodM = toon(0x9a6a3a), brassM = new THREE.MeshStandardMaterial({ color: 0xf0c050, metalness: 0.9, roughness: 0.18 });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 8.9, 14), woodM); pole.position.set(P.x, 4.45, P.z); pole.castShadow = true; outline(pole, 0.015); inn.add(pole);
  const hay = []; for (let i = 0; i < 4; i++) { const h = box(1.0, 0.6, 0.7, 0xe0c060, [P.x - 1.6 + (i % 2) * 1.0, UP + 0.3 + Math.floor(i / 2) * 0.6, P.z - 1.8], 0.02); inn.add(h); hay.push(h); }
  const sawdust = []; for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), toon(0xe0b060)); s.visible = false; inn.add(s); sawdust.push(s); }
  // alarm bell
  const bell = new THREE.Group(); const bb = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), brassM); bb.rotation.x = Math.PI; bb.position.y = -0.2; bell.add(bb); bell.add(box(0.06, 0.6, 0.06, 0x2a2018, [0, 0.3, 0], 0)); bell.position.set(4.5, 4.0, 2.6); inn.add(bell);
  inn.add(box(0.04, 4.0, 0.04, 0xc8a46a, [4.9, 2.0, 2.6], 0));
  // horses + engine
  const horseT = [new THREE.CanvasTexture(horseCanvas(false)), new THREE.CanvasTexture(horseCanvas(true))]; horseT.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace));
  const mkHorse = () => { const m = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.2), new THREE.MeshBasicMaterial({ map: horseT[0], transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.geometry.translate(0, 1.1, 0); m.castShadow = true; return m; };
  const horses = [mkHorse(), mkHorse()]; horses.forEach((h) => scene.add(h));
  const eng = engine(); scene.add(eng);
  for (let i = 0; i < 2; i++) { inn.add(box(0.15, 1.4, 2.4, 0x6a4a2a, [-5.8 + i * 2.6, 0.7, 3.4], 0.02)); }

  return { scene, sky, hemi, sun, clouds, street, main, rival, others, burn, flames, smoke, fireLight, inn, stairs, pole, woodM, brassM, hay, sawdust, bell, lamps, horses, horseT, eng };
}
