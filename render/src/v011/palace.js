// New York Crystal Palace 1854: glass dome, flags, exhibits, Otis' elevator tower with toothed rails; growing skyline.
import * as THREE from 'three';
import { toon, outline, box, hash, skyDome, cloudSprite, glowTexture, canvasTex } from '../world.js';

export const CITY_X = 400, TOWER_Z = -4;
const INK = '#151012';
const tiled = (t, rx, ry) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); return t; };

function flagTex(i) {
  const pats = [['#c8202a', '#ffffff', '#1e3a8a'], ['#2a8a4a', '#ffffff', '#e8202a'], ['#1e3a8a', '#ffffff', '#e8202a'], ['#000000', '#f2c23a', '#e8202a'], ['#f2c23a', '#2a6ad8', '#f2c23a'], ['#ffffff', '#e8202a', '#ffffff'], ['#3ab0e8', '#ffffff', '#3ab0e8'], ['#e8701a', '#ffffff', '#2a8a4a']][i % 8];
  return canvasTex(96, 64, (c) => { const vert = i % 2; pats.forEach((col, k) => { c.fillStyle = col; if (vert) c.fillRect(k * 32, 0, 32, 64); else c.fillRect(0, k * 21.4, 96, 22); }); if (i % 3 === 0) { c.fillStyle = '#f2c23a'; c.beginPath(); c.arc(48, 32, 10, 0, 7); c.fill(); } c.strokeStyle = INK; c.lineWidth = 4; c.strokeRect(2, 2, 92, 60); });
}
function teethTex() { return canvasTex(64, 512, (c) => { c.fillStyle = '#5a5a62'; c.fillRect(0, 0, 64, 512); c.fillStyle = '#8a8a94'; for (let y = 0; y < 512; y += 32) { c.beginPath(); c.moveTo(64, y); c.lineTo(20, y + 16); c.lineTo(64, y + 32); c.closePath(); c.fill(); c.strokeStyle = INK; c.lineWidth = 3; c.stroke(); } c.fillStyle = 'rgba(255,255,255,0.2)'; c.fillRect(0, 0, 10, 512); }); }
function gear(r, col) { const g = new THREE.Group(); const w = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 24), toon(col, { metalness: 0.5, roughness: 0.4 })); w.rotation.x = Math.PI / 2; outline(w, 0.03); g.add(w); for (let k = 0; k < 12; k++) { const t = box(0.3, 0.3, 0.3, col, [Math.cos(k / 12 * Math.PI * 2) * (r + 0.12), Math.sin(k / 12 * Math.PI * 2) * (r + 0.12), 0], 0.01); g.add(t); } g.add(box(0.3, 0.3, 0.5, 0x2a2a30, [0, 0, 0], 0.01)); return g; }

export function buildPalace() {
  const scene = new THREE.Scene();
  const sky = skyDome(0x4a9af0, 0xfff0d8, 0xfff0d8); scene.add(sky);
  const hemi = new THREE.HemisphereLight(0xeaf4ff, 0x9a7a5a, 0.8); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff2dc, 3.2); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 300 }); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  sun.userData.dir = new THREE.Vector3(0.35, 0.8, 0.45).normalize(); scene.add(sun, sun.target);
  const clouds = []; for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; const cl = cloudSprite(i, 18 + hash(i, 9) * 12); cl.position.set(Math.cos(a) * 240, 60 + hash(i, 2) * 50, Math.sin(a) * 240); cl.userData.x0 = cl.position.x; scene.add(cl); clouds.push(cl); }

  // ===== CRYSTAL PALACE =====
  const pal = new THREE.Group(); scene.add(pal);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(24, 8), toon(0xffffff, { map: tiled(canvasTex(256, 256, (c) => { c.fillStyle = '#c89a62'; c.fillRect(0, 0, 256, 256); for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? 'rgba(255,230,190,0.15)' : 'rgba(60,30,10,0.12)'; c.fillRect(i * 32, 0, 32, 256); } c.strokeStyle = 'rgba(60,30,10,0.5)'; c.lineWidth = 3; for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32, 256); c.stroke(); } }), 8, 8), roughness: 0.5 })); floor.rotation.x = -Math.PI / 2; floor.rotation.z = Math.PI / 8; floor.receiveShadow = true; pal.add(floor);
  for (let k = 0; k < 4; k++) { const cp = new THREE.Mesh(new THREE.PlaneGeometry(3, 48), toon(0xb8202a)); cp.rotation.x = -Math.PI / 2; cp.rotation.z = k * Math.PI / 4; cp.position.y = 0.01; cp.receiveShadow = true; pal.add(cp); }
  const glassT = canvasTex(256, 256, (c) => { c.fillStyle = 'rgba(190,225,255,0.25)'; c.fillRect(0, 0, 256, 256); c.strokeStyle = '#f4f4f0'; c.lineWidth = 6; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * 64, 0); c.lineTo(i * 64, 256); c.moveTo(0, i * 64); c.lineTo(256, i * 64); c.stroke(); } c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(10, 50); c.lineTo(50, 10); c.stroke(); });
  const glassM = new THREE.MeshStandardMaterial({ map: tiled(glassT, 16, 4), transparent: true, side: THREE.DoubleSide, roughness: 0.1, metalness: 0.1, depthWrite: false });
  const walls = new THREE.Mesh(new THREE.CylinderGeometry(24, 24, 16, 8, 1, true), glassM); walls.position.y = 8; walls.rotation.y = Math.PI / 8; pal.add(walls);
  const domeM = new THREE.MeshStandardMaterial({ map: tiled(glassT.clone(), 24, 6), transparent: true, side: THREE.DoubleSide, roughness: 0.1, depthWrite: false }); domeM.map.wrapS = domeM.map.wrapT = THREE.RepeatWrapping; domeM.map.repeat.set(24, 6); domeM.map.needsUpdate = true;
  const dome = new THREE.Mesh(new THREE.SphereGeometry(24, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), domeM); dome.scale.y = 0.7; dome.position.y = 16; pal.add(dome);
  for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const rib = new THREE.Mesh(new THREE.TorusGeometry(24, 0.12, 6, 32, Math.PI / 2), toon(0xf4f4f0)); rib.rotation.y = a; rib.scale.y = 0.7; rib.position.y = 16; pal.add(rib); }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(24, 0.35, 8, 48), toon(0xf4f4f0)); ring.rotation.x = Math.PI / 2; ring.position.y = 16; pal.add(ring);
  for (let k = 0; k < 8; k++) { const a = k / 8 * Math.PI * 2 + Math.PI / 8; const col = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 16, 10), toon(0xf4f4f0)); col.position.set(Math.cos(a) * 23.5, 8, Math.sin(a) * 23.5); pal.add(col); }
  // balcony + flags of all nations
  const balc = new THREE.Mesh(new THREE.TorusGeometry(20, 0.5, 6, 48), toon(0xf4ecd8)); balc.rotation.x = Math.PI / 2; balc.position.y = 8; pal.add(balc);
  const flags = []; for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2; const f = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.2), new THREE.MeshStandardMaterial({ map: flagTex(k), side: THREE.DoubleSide })); f.position.set(Math.cos(a) * 19.4, 7.0, Math.sin(a) * 19.4); f.lookAt(0, 7, 0); pal.add(f); flags.push(f); }
  const banner = new THREE.Mesh(new THREE.PlaneGeometry(12, 1.8), new THREE.MeshStandardMaterial({ map: canvasTex(768, 112, (c) => { c.fillStyle = '#1e3a8a'; c.fillRect(0, 0, 768, 112); c.strokeStyle = '#f2c23a'; c.lineWidth = 8; c.strokeRect(6, 6, 756, 100); c.fillStyle = '#ffffff'; c.font = '900 54px serif'; c.textAlign = 'center'; c.fillText("WORLD'S FAIR · NEW YORK 1854", 384, 74); }), side: THREE.DoubleSide })); banner.position.set(0, 10.5, -19.5); pal.add(banner);
  // exhibits
  const exhibits = [];
  for (const [x, z, col] of [[-12, -8, 0xc8a03a], [12, -8, 0x8a8a94], [-14, 6, 0xc85a3a], [14, 6, 0x3a8ab8]]) { const st = box(4, 1, 3, 0x7a4a2a, [x, 0.5, z], 0.04); pal.add(st); const gA = gear(1.0, col); gA.position.set(x - 0.6, 2.2, z); pal.add(gA); const gB = gear(0.6, 0x5a5a62); gB.position.set(x + 0.9, 1.9, z + 0.1); pal.add(gB); exhibits.push(gA, gB); }
  const statue = new THREE.Group(); statue.add(box(1.4, 1.4, 1.4, 0xe8e4dc, [0, 0.7, 0], 0.03)); const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.8, 6, 12), toon(0xf4f0e8)); body.position.y = 2.8; outline(body, 0.03); statue.add(body); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), toon(0xf4f0e8)); hd.position.y = 4.2; outline(hd, 0.03); statue.add(hd); statue.position.set(-8, 0, 12); pal.add(statue);
  const beams = []; for (let k = 0; k < 5; k++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(3, 30), new THREE.MeshBasicMaterial({ color: 0xfff4d8, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); b.position.set(-10 + k * 5, 12, -6 + k * 2); b.rotation.set(0.2, 0.4 * k, 0.35); pal.add(b); beams.push(b); }

  // ===== THE TOWER =====
  const tower = new THREE.Group(); tower.position.z = TOWER_Z; pal.add(tower);
  const tt = teethTex(); tt.wrapT = THREE.RepeatWrapping; tt.repeat.set(1, 3);
  for (const s of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.45, 15, 0.45), [toon(0x8a5a32), toon(0x8a5a32), toon(0x8a5a32), toon(0x8a5a32), toon(0x8a5a32), toon(0x8a5a32)]); post.position.set(s * 1.65, 7.5, 0); post.castShadow = true; outline(post, 0.03); tower.add(post); const rail = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 14.6), toon(0xffffff, { map: tt, metalness: 0.4 })); rail.position.set(s * 1.42, 7.4, 0.0); rail.rotation.y = -s * Math.PI / 2; if (s > 0) rail.scale.x = -1; tower.add(rail); const railF = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 14.6), toon(0x6a6a72)); railF.position.set(s * 1.43, 7.4, 0.24); tower.add(railF); }
  tower.add(box(3.9, 0.5, 0.6, 0x7a4a2a, [0, 15.2, 0], 0.04));
  for (const z of [-0.8, 0.8]) for (const y of [4, 9]) tower.add(box(3.3, 0.14, 0.14, 0x7a4a2a, [0, y, z * 0.2 - 0.25], 0.02));
  const pulley = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.25, 20), toon(0x5a5a62, { metalness: 0.5 })); pulley.rotation.x = Math.PI / 2; pulley.position.set(0, 15.8, 0); outline(pulley, 0.03); tower.add(pulley);
  // platform (moves)
  const plat = new THREE.Group(); tower.add(plat);
  plat.add(box(2.7, 0.2, 2.2, 0xa87a48, [0, 0, 0.3], 0.04));
  for (const s of [-1, 1]) { plat.add(box(0.12, 0.9, 2.2, 0x6a4a2a, [s * 1.3, 0.55, 0.3], 0.01)); plat.add(box(0.14, 3.0, 0.14, 0x3a3a40, [s * 1.2, 1.6, 0.0], 0.01)); }
  plat.add(box(2.6, 0.12, 0.12, 0x6a4a2a, [0, 1.0, 1.4], 0.01));
  const yoke = box(2.7, 0.22, 0.25, 0x3a3a40, [0, 3.1, 0], 0.02); plat.add(yoke);
  const spring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 6, 16), toon(0xc8a03a)); spring.position.set(0, 3.35, 0); spring.scale.y = 2; plat.add(spring);
  const pawls = [-1, 1].map((s) => { const p = new THREE.Group(); p.add(box(0.5, 0.16, 0.16, 0x2a2a30, [s * 0.25, 0, 0], 0.01)); p.position.set(s * 1.1, 3.1, 0); plat.add(p); return p; });
  const crates = []; for (let k = 0; k < 4; k++) { const c = box(0.8, 0.8, 0.8, 0xb88a4a, [-0.5 + (k % 2) * 1.0, 0.5 + Math.floor(k / 2) * 0.8, 0.3], 0.03); c.visible = false; plat.add(c); crates.push(c); }
  // rope: upper piece (pulley -> cut point) and lower stub (cut point -> yoke)
  const ropeM = toon(0xc8a46a);
  const ropeUp = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), ropeM); tower.add(ropeUp);
  const ropeLo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), ropeM); tower.add(ropeLo);
  const ropeDown = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1, 8), ropeM); tower.add(ropeDown); // over the pulley down to the helper
  const sparks = []; for (let i = 0; i < 12; i++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,230,160,1)', 'rgba(255,150,40,0)'), blending: THREE.AdditiveBlending, depthWrite: false })); s.visible = false; tower.add(s); sparks.push(s); }
  const dust = []; for (let i = 0; i < 10; i++) { const d = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(220,200,170,0.8)', 'rgba(220,200,170,0)'), transparent: true, depthWrite: false })); d.visible = false; tower.add(d); dust.push(d); }
  const hats = []; for (let i = 0; i < 10; i++) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.45, 12), toon(i % 3 ? 0x1d1d24 : 0x5a3a2a)); const br = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.04, 14), h.material); br.position.y = -0.2; h.add(br); outline(h, 0.02); h.visible = false; pal.add(h); hats.push(h); }

  // ===== CITY =====
  const city = new THREE.Group(); city.position.x = CITY_X; scene.add(city);
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), toon(0xffffff, { map: tiled(canvasTex(128, 128, (c) => { c.fillStyle = '#7a8a6a'; c.fillRect(0, 0, 128, 128); c.fillStyle = '#4a4a52'; c.fillRect(0, 0, 128, 20); c.fillRect(0, 0, 20, 128); c.fillStyle = '#f2c23a'; for (let i = 24; i < 128; i += 18) c.fillRect(9, i, 2, 8); }), 40, 40) })); grid.rotation.x = -Math.PI / 2; grid.receiveShadow = true; city.add(grid);
  const winT = (col, seed) => tiled(canvasTex(64, 64, (c) => { c.fillStyle = col; c.fillRect(0, 0, 64, 64); for (let r = 0; r < 2; r++) for (let k = 0; k < 2; k++) { c.fillStyle = hash(seed + r, k) > 0.35 ? '#2a3a58' : '#ffe8a0'; c.fillRect(8 + k * 30, 8 + r * 30, 18, 18); } }), 2, 1);
  const cols = ['#e8d0b0', '#c8d8e8', '#f0b8a0', '#d8e8c8', '#e8c8d8', '#f4e4a8', '#b8c8e0', '#e0b890'];
  const buildings = [];
  for (let i = 0; i < 64; i++) {
    const gx = (i % 8) - 3.5, gz = Math.floor(i / 8) - 3.5; const x = gx * 10, z = gz * 10;
    const w = 6 + hash(i, 1) * 2, d = 6 + hash(i, 2) * 2;
    const dist = Math.hypot(gx, gz); const target = Math.max(2, Math.round((100 - dist * 22) * (0.4 + hash(i, 3) * 0.6)));
    const t = winT(cols[i % 8], i);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, 1, d), toon(0xffffff, { map: t })); m.geometry.translate(0, 0.5, 0); m.position.set(x, 0, z); m.castShadow = true; m.receiveShadow = true; outline(m, 0.06);
    m.userData = { target, tex: t, w, d }; city.add(m); buildings.push(m);
    const roof = box(w * 0.4, 1.2, d * 0.4, 0x8a8a94, [0, 0, 0], 0.03); m.add(roof); m.userData.roof = roof;
  }
  const stairs = new THREE.Group(); for (let k = 0; k < 40; k++) stairs.add(box(1.6, 0.25, 0.5, 0x9a8a7a, [0, k * 0.25 + 0.12, -k * 0.5], 0.01)); stairs.position.set(-6, 0, 6); stairs.rotation.y = Math.PI / 2; city.add(stairs);

  return { scene, sky, hemi, sun, clouds, pal, flags, exhibits, beams, tower, plat, pawls, crates, ropeUp, ropeLo, ropeDown, pulley, sparks, dust, hats, city, buildings, stairs, statue };
}
